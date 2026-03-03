import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional


class DataStore:
    def __init__(self, db_path: str = "./data/dasti_data.db"):
        self.db_path = db_path
        self._ensure_db_directory()
        self._init_database()
    
    def _ensure_db_directory(self):
        """Ensure database directory exists"""
        db_dir = os.path.dirname(self.db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
    
    def _init_database(self):
        """Initialize database tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Scraped data table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scraped_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source TEXT NOT NULL,
                data_json TEXT NOT NULL,
                scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                page_number INTEGER,
                UNIQUE(source, data_json)
            )
        """)
        
        # Scraping sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scraping_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source TEXT NOT NULL UNIQUE,
                session_cookies TEXT,
                navigation_state TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Activity logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source TEXT NOT NULL,
                level TEXT NOT NULL,
                message TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()
    
    def save_data(self, source: str, headers: List[str], data: List[Dict], pages_scraped: int = 0):
        """Save scraped data to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Clear existing data for this source
            cursor.execute("DELETE FROM scraped_data WHERE source = ?", (source,))
            
            # Insert new data
            for i, row in enumerate(data):
                data_json = json.dumps(row, ensure_ascii=False)
                page_num = (i // 10) + 1 if pages_scraped == 0 else None
                
                cursor.execute("""
                    INSERT OR IGNORE INTO scraped_data (source, data_json, page_number)
                    VALUES (?, ?, ?)
                """, (source, data_json, page_num))
            
            conn.commit()
            return {"success": True, "count": len(data)}
        except Exception as e:
            conn.rollback()
            return {"success": False, "error": str(e)}
        finally:
            conn.close()
    
    def load_data(self, source: str) -> Dict[str, Any]:
        """Load scraped data from database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT data_json, page_number FROM scraped_data 
                WHERE source = ? 
                ORDER BY id
            """, (source,))
            
            rows = cursor.fetchall()
            data = []
            headers = []
            pages_scraped = 0
            
            for row in rows:
                row_data = json.loads(row[0])
                data.append(row_data)
                
                if not headers and row_data:
                    headers = list(row_data.keys())
                
                if row[1]:
                    pages_scraped = max(pages_scraped, row[1])
            
            return {
                "success": True,
                "data": data,
                "headers": headers,
                "pages_scraped": pages_scraped
            }
        except Exception as e:
            return {"success": False, "error": str(e), "data": []}
        finally:
            conn.close()
    
    def clear_data(self, source: str):
        """Clear all data for a source"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("DELETE FROM scraped_data WHERE source = ?", (source,))
            conn.commit()
            return {"success": True}
        except Exception as e:
            conn.rollback()
            return {"success": False, "error": str(e)}
        finally:
            conn.close()
    
    def save_session(self, source: str, cookies: List[Dict], navigation_state: Dict):
        """Save session cookies and navigation state"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cookies_json = json.dumps(cookies, ensure_ascii=False)
            nav_json = json.dumps(navigation_state, ensure_ascii=False)
            
            cursor.execute("""
                INSERT OR REPLACE INTO scraping_sessions 
                (source, session_cookies, navigation_state, updated_at)
                VALUES (?, ?, ?, ?)
            """, (source, cookies_json, nav_json, datetime.now()))
            
            conn.commit()
            return {"success": True}
        except Exception as e:
            conn.rollback()
            return {"success": False, "error": str(e)}
        finally:
            conn.close()
    
    def load_session(self, source: str) -> Dict[str, Any]:
        """Load session cookies and navigation state"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT session_cookies, navigation_state, updated_at 
                FROM scraping_sessions 
                WHERE source = ?
            """, (source,))
            
            row = cursor.fetchone()
            if row:
                cookies = json.loads(row[0]) if row[0] else []
                nav_state = json.loads(row[1]) if row[1] else {}
                
                return {
                    "success": True,
                    "cookies": cookies,
                    "navigationState": nav_state,
                    "updatedAt": row[2]
                }
            else:
                return {"success": False, "error": "No session found"}
        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            conn.close()
    
    def add_log(self, source: str, level: str, message: str):
        """Add activity log"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO activity_logs (source, level, message)
                VALUES (?, ?, ?)
            """, (source, level, message))
            
            conn.commit()
            return {"success": True}
        except Exception as e:
            conn.rollback()
            return {"success": False, "error": str(e)}
        finally:
            conn.close()
    
    def get_logs(self, source: str, limit: int = 100) -> List[Dict]:
        """Get activity logs"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT level, message, timestamp 
                FROM activity_logs 
                WHERE source = ? 
                ORDER BY id DESC 
                LIMIT ?
            """, (source, limit))
            
            rows = cursor.fetchall()
            logs = []
            
            for row in rows:
                logs.append({
                    "level": row[0],
                    "message": row[1],
                    "timestamp": row[2]
                })
            
            return logs
        except Exception as e:
            return []
        finally:
            conn.close()
    
    def clear_logs(self, source: str):
        """Clear activity logs"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("DELETE FROM activity_logs WHERE source = ?", (source,))
            conn.commit()
            return {"success": True}
        except Exception as e:
            conn.rollback()
            return {"success": False, "error": str(e)}
        finally:
            conn.close()


# Global instance
data_store = DataStore()
