import sqlite3
import json
from datetime import datetime

# Connect to database
db_path = "dasti-scraper/data/dasti_data.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=" * 80)
print("DATABASE OVERVIEW")
print("=" * 80)

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print(f"\nTables found: {len(tables)}")
for table in tables:
    print(f"  - {table[0]}")

print("\n" + "=" * 80)

# Check each table
for table in tables:
    table_name = table[0]
    print(f"\nTABLE: {table_name}")
    print("-" * 80)
    
    # Get row count
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = cursor.fetchone()[0]
    print(f"Total rows: {count}")
    
    if count > 0:
        # Get column names
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        col_names = [col[1] for col in columns]
        print(f"Columns: {', '.join(col_names)}")
        
        # Show first 5 rows
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 5")
        rows = cursor.fetchall()
        
        print(f"\nFirst {len(rows)} rows:")
        for i, row in enumerate(rows, 1):
            print(f"\n  Row {i}:")
            for col_name, value in zip(col_names, row):
                # Truncate long values
                if isinstance(value, str) and len(value) > 100:
                    value = value[:100] + "..."
                print(f"    {col_name}: {value}")

print("\n" + "=" * 80)
print("END OF DATABASE OVERVIEW")
print("=" * 80)

conn.close()
