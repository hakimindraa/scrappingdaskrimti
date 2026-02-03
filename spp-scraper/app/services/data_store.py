# Data persistence module for SPDP scraper
import sqlite3
import json
import os
from datetime import datetime
from pathlib import Path

# Ensure data directory exists
DATA_DIR = Path(__file__).parent.parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "spdp_data.db"

def get_connection():
    """Get database connection with row factory"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Initialize the database and create tables"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Create scraped_data table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scraped_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            headers TEXT NOT NULL,
            data TEXT NOT NULL,
            row_count INTEGER DEFAULT 0,
            pages_scraped INTEGER DEFAULT 0,
            scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create index
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_scraped_data_source 
        ON scraped_data(source)
    """)
    
    conn.commit()
    conn.close()
    print(f"[Database] SPDP SQLite initialized at: {DB_PATH}")

# Initialize on import
init_database()

def save_data(source: str, headers: list, data: list, pages_scraped: int = 0):
    """Save scraped data to database"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        headers_json = json.dumps(headers, ensure_ascii=False)
        data_json = json.dumps(data, ensure_ascii=False)
        
        # Check if data exists
        cursor.execute("SELECT id FROM scraped_data WHERE source = ?", (source,))
        existing = cursor.fetchone()
        
        if existing:
            cursor.execute("""
                UPDATE scraped_data 
                SET headers = ?, data = ?, row_count = ?, pages_scraped = ?, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE source = ?
            """, (headers_json, data_json, len(data), pages_scraped, source))
            print(f"[DataStore] Updated {len(data)} rows for {source}")
        else:
            cursor.execute("""
                INSERT INTO scraped_data (source, headers, data, row_count, pages_scraped)
                VALUES (?, ?, ?, ?, ?)
            """, (source, headers_json, data_json, len(data), pages_scraped))
            print(f"[DataStore] Saved {len(data)} rows for {source}")
        
        conn.commit()
        conn.close()
        return {"success": True, "row_count": len(data)}
    except Exception as e:
        print(f"[DataStore] Save error: {e}")
        return {"success": False, "error": str(e)}

def load_data(source: str):
    """Load scraped data from database"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT headers, data, row_count, pages_scraped, scraped_at, updated_at
            FROM scraped_data WHERE source = ?
        """, (source,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                "success": True,
                "headers": json.loads(row["headers"]),
                "data": json.loads(row["data"]),
                "row_count": row["row_count"],
                "pages_scraped": row["pages_scraped"],
                "scraped_at": row["scraped_at"],
                "updated_at": row["updated_at"]
            }
        
        return {"success": True, "headers": [], "data": [], "row_count": 0, "pages_scraped": 0}
    except Exception as e:
        print(f"[DataStore] Load error: {e}")
        return {"success": False, "headers": [], "data": [], "row_count": 0, "error": str(e)}

def clear_data(source: str):
    """Clear scraped data for a source"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM scraped_data WHERE source = ?", (source,))
        conn.commit()
        conn.close()
        print(f"[DataStore] Cleared data for {source}")
        return {"success": True}
    except Exception as e:
        print(f"[DataStore] Clear error: {e}")
        return {"success": False, "error": str(e)}

def get_data_info(source: str):
    """Get data info without loading full data"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT row_count, pages_scraped, scraped_at, updated_at
            FROM scraped_data WHERE source = ?
        """, (source,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                "exists": True,
                "row_count": row["row_count"],
                "pages_scraped": row["pages_scraped"],
                "scraped_at": row["scraped_at"],
                "updated_at": row["updated_at"]
            }
        
        return {"exists": False, "row_count": 0, "pages_scraped": 0}
    except Exception as e:
        print(f"[DataStore] GetInfo error: {e}")
        return {"exists": False, "row_count": 0, "error": str(e)}
