from datetime import datetime
from app.services.data_store import data_store


def add_activity_log_sync(level: str, message: str, source: str = "DASTI"):
    """Add activity log synchronously"""
    try:
        data_store.add_log(source, level, message)
        print(f"[{datetime.now().isoformat()}] [{level.upper()}] {message}")
    except Exception as e:
        print(f"[ERROR] Failed to log activity: {e}")


def get_activity_logs(source: str = "DASTI", limit: int = 100):
    """Get activity logs"""
    try:
        return data_store.get_logs(source, limit)
    except Exception as e:
        print(f"[ERROR] Failed to get logs: {e}")
        return []


def clear_activity_logs(source: str = "DASTI"):
    """Clear activity logs"""
    try:
        return data_store.clear_logs(source)
    except Exception as e:
        print(f"[ERROR] Failed to clear logs: {e}")
        return {"success": False, "error": str(e)}
