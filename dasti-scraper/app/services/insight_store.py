import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional


class InsightStore:
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
        """Initialize insight database tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Surat Masuk table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS surat_masuk (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                row_id TEXT NOT NULL UNIQUE,
                jenis TEXT NOT NULL,
                asal TEXT NOT NULL,
                month INTEGER NOT NULL,
                year INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Surat Keluar table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS surat_keluar (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                row_id TEXT NOT NULL UNIQUE,
                jenis TEXT NOT NULL,
                month INTEGER NOT NULL,
                year INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Jenis Kategori Overrides table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS jenis_kategori_overrides (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                jenis TEXT NOT NULL UNIQUE,
                kategori TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Asal Kelompok Overrides table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS asal_kelompok_overrides (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asal TEXT NOT NULL UNIQUE,
                kelompok TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Row-level overrides for jenis
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS jenis_row_overrides (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                row_id TEXT NOT NULL UNIQUE,
                kategori TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Row-level overrides for asal
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS asal_row_overrides (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                row_id TEXT NOT NULL UNIQUE,
                kelompok TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Year/Month row overrides
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS date_row_overrides (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                row_id TEXT NOT NULL UNIQUE,
                year INTEGER,
                month INTEGER,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()
    
    # === Surat Masuk Operations ===
    
    def save_surat_masuk(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Save surat masuk data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Clear existing data
            cursor.execute("DELETE FROM surat_masuk")
            
            # Insert new data
            for row in data:
                cursor.execute("""
                    INSERT INTO surat_masuk (row_id, jenis, asal, month, year)
                    VALUES (?, ?, ?, ?, ?)
                """, (row['rowId'], row['jenis'], row['asal'], row['month'], row['year']))
            
            conn.commit()
            return {"success": True, "count": len(data)}
        except Exception as e:
            conn.rollback()
            return {"success": False, "error": str(e)}
        finally:
            conn.close()
    
    def load_surat_masuk(self) -> Dict[str, Any]:
        """Load surat masuk data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT row_id, jenis, asal, month, year FROM surat_masuk
                ORDER BY id
            """)
            
            rows = cursor.fetchall()
            data = []
            
            for row in rows:
                data.append({
                    "rowId": row[0],
                    "jenis": row[1],
                    "asal": row[2],
                    "month": row[3],
                    "year": row[4]
                })
            
            return {"success": True, "data": data}
        except Exception as e:
            return {"success": False, "error": str(e), "data": []}
        finally:
            conn.close()
    
    # === Surat Keluar Operations ===
    
    def save_surat_keluar(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Save surat keluar data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Clear existing data
            cursor.execute("DELETE FROM surat_keluar")
            
            # Insert new data
            for row in data:
                cursor.execute("""
                    INSERT INTO surat_keluar (row_id, jenis, month, year)
                    VALUES (?, ?, ?, ?)
                """, (row['rowId'], row['jenis'], row['month'], row['year']))
            
            conn.commit()
            return {"success": True, "count": len(data)}
        except Exception as e:
            conn.rollback()
            return {"success": False, "error": str(e)}
        finally:
            conn.close()
    
    def load_surat_keluar(self) -> Dict[str, Any]:
        """Load surat keluar data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT row_id, jenis, month, year FROM surat_keluar
                ORDER BY id
            """)
            
            rows = cursor.fetchall()
            data = []
            
            for row in rows:
                data.append({
                    "rowId": row[0],
                    "jenis": row[1],
                    "month": row[2],
                    "year": row[3]
                })
            
            return {"success": True, "data": data}
        except Exception as e:
            return {"success": False, "error": str(e), "data": []}
        finally:
            conn.close()
    
    # === Jenis Kategori Overrides ===
    
    def save_jenis_overrides(self, overrides: Dict[str, str]) -> Dict[str, Any]:
        """Save jenis kategori overrides"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            for jenis, kategori in overrides.items():
                cursor.execute("""
                    INSERT OR REPLACE INTO jenis_kategori_overrides (jenis, kategori, updated_at)
                    VALUES (?, ?, ?)
                """, (jenis, kategori, datetime.now()))
            
            conn.commit()
            return {"success": True, "count": len(overrides)}
        except Exception as e:
            conn.rollback()
            return {"success": False, "error": str(e)}
        finally:
            conn.close()
    
    def load_jenis_overrides(self) -> Dict[str, Any]:
        """Load jenis kategori overrides"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT jenis, kategori FROM jenis_kategori_overrides")
            rows = cursor.fetchall()
            
            overrides = {row[0]: row[1] for row in rows}
            
            return {"success": True, "overrides": overrides}
        except Exception as e:
            return {"success": False, "error": str(e), "overrides": {}}
        finally:
            conn.close()
    
    # === Asal Kelompok Overrides ===
    
    def save_asal_overrides(self, overrides: Dict[str, str]) -> Dict[str, Any]:
        """Save asal kelompok overrides"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            for asal, kelompok in overrides.items():
                cursor.execute("""
                    INSERT OR REPLACE INTO asal_kelompok_overrides (asal, kelompok, updated_at)
                    VALUES (?, ?, ?)
                """, (asal, kelompok, datetime.now()))
            
            conn.commit()
            return {"success": True, "count": len(overrides)}
        except Exception as e:
            conn.rollback()
            return {"success": False, "error": str(e)}
        finally:
            conn.close()
    
    def load_asal_overrides(self) -> Dict[str, Any]:
        """Load asal kelompok overrides"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT asal, kelompok FROM asal_kelompok_overrides")
            rows = cursor.fetchall()
            
            overrides = {row[0]: row[1] for row in rows}
            
            return {"success": True, "overrides": overrides}
        except Exception as e:
            return {"success": False, "error": str(e), "overrides": {}}
        finally:
            conn.close()
    
    # === Row-level Overrides ===
    
    def save_jenis_row_overrides(self, overrides: Dict[str, str]) -> Dict[str, Any]:
        """Save per-row jenis overrides"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Clear existing
            cursor.execute("DELETE FROM jenis_row_overrides")
            
            # Insert new
            for row_id, kategori in overrides.items():
                cursor.execute("""
                    INSERT INTO jenis_row_overrides (row_id, kategori, updated_at)
                    VALUES (?, ?, ?)
                """, (row_id, kategori, datetime.now()))
            
            conn.commit()
            return {"success": True, "count": len(overrides)}
        except Exception as e:
            conn.rollback()
            return {"success": False, "error": str(e)}
        finally:
            conn.close()
    
    def load_jenis_row_overrides(self) -> Dict[str, Any]:
        """Load per-row jenis overrides"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT row_id, kategori FROM jenis_row_overrides")
            rows = cursor.fetchall()
            
            overrides = {row[0]: row[1] for row in rows}
            
            return {"success": True, "overrides": overrides}
        except Exception as e:
            return {"success": False, "error": str(e), "overrides": {}}
        finally:
            conn.close()
    
    def save_asal_row_overrides(self, overrides: Dict[str, str]) -> Dict[str, Any]:
        """Save per-row asal overrides"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Clear existing
            cursor.execute("DELETE FROM asal_row_overrides")
            
            # Insert new
            for row_id, kelompok in overrides.items():
                cursor.execute("""
                    INSERT INTO asal_row_overrides (row_id, kelompok, updated_at)
                    VALUES (?, ?, ?)
                """, (row_id, kelompok, datetime.now()))
            
            conn.commit()
            return {"success": True, "count": len(overrides)}
        except Exception as e:
            conn.rollback()
            return {"success": False, "error": str(e)}
        finally:
            conn.close()
    
    def load_asal_row_overrides(self) -> Dict[str, Any]:
        """Load per-row asal overrides"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT row_id, kelompok FROM asal_row_overrides")
            rows = cursor.fetchall()
            
            overrides = {row[0]: row[1] for row in rows}
            
            return {"success": True, "overrides": overrides}
        except Exception as e:
            return {"success": False, "error": str(e), "overrides": {}}
        finally:
            conn.close()
    
    def save_date_row_overrides(self, year_overrides: Dict[str, int], month_overrides: Dict[str, int]) -> Dict[str, Any]:
        """Save per-row date overrides"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Clear existing
            cursor.execute("DELETE FROM date_row_overrides")
            
            # Combine all row_ids
            all_row_ids = set(year_overrides.keys()) | set(month_overrides.keys())
            
            # Insert new
            for row_id in all_row_ids:
                year = year_overrides.get(row_id)
                month = month_overrides.get(row_id)
                cursor.execute("""
                    INSERT INTO date_row_overrides (row_id, year, month, updated_at)
                    VALUES (?, ?, ?, ?)
                """, (row_id, year, month, datetime.now()))
            
            conn.commit()
            return {"success": True, "count": len(all_row_ids)}
        except Exception as e:
            conn.rollback()
            return {"success": False, "error": str(e)}
        finally:
            conn.close()
    
    def load_date_row_overrides(self) -> Dict[str, Any]:
        """Load per-row date overrides"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT row_id, year, month FROM date_row_overrides")
            rows = cursor.fetchall()
            
            year_overrides = {}
            month_overrides = {}
            
            for row in rows:
                row_id, year, month = row
                if year is not None:
                    year_overrides[row_id] = year
                if month is not None:
                    month_overrides[row_id] = month
            
            return {
                "success": True,
                "yearOverrides": year_overrides,
                "monthOverrides": month_overrides
            }
        except Exception as e:
            return {"success": False, "error": str(e), "yearOverrides": {}, "monthOverrides": {}}
        finally:
            conn.close()
    
    # === Clear All Data ===
    
    def clear_all_insight_data(self) -> Dict[str, Any]:
        """Clear all insight data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("DELETE FROM surat_masuk")
            cursor.execute("DELETE FROM surat_keluar")
            cursor.execute("DELETE FROM jenis_row_overrides")
            cursor.execute("DELETE FROM asal_row_overrides")
            cursor.execute("DELETE FROM date_row_overrides")
            
            conn.commit()
            return {"success": True}
        except Exception as e:
            conn.rollback()
            return {"success": False, "error": str(e)}
        finally:
            conn.close()


# Global instance
insight_store = InsightStore()
