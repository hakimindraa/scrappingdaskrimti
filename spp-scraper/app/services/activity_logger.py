"""
Activity Logger Module
Sends activity logs to SIPEDE backend for centralized logging
"""

import httpx
import os
from typing import Literal

# SIPEDE backend URL
SIPEDE_API_URL = os.getenv("SIPEDE_API_URL", "http://localhost:5000")


async def add_activity_log(
    log_type: Literal["info", "success", "warning", "error"],
    message: str,
    source: str = "SPDP"
):
    """
    Send activity log to SIPEDE backend
    
    Args:
        log_type: Type of log (info, success, warning, error)
        message: Log message
        source: Source of the log (default: SPDP)
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{SIPEDE_API_URL}/api/scraper/activity",
                json={
                    "type": log_type,
                    "message": message,
                    "source": source
                }
            )
            if response.status_code == 200:
                print(f"[Activity] {log_type}: {message} ({source})")
            else:
                print(f"[Activity] Failed to log: {response.status_code}")
    except Exception as e:
        # Don't fail the main operation if logging fails
        print(f"[Activity] Error sending log: {e}")


def add_activity_log_sync(
    log_type: Literal["info", "success", "warning", "error"],
    message: str,
    source: str = "SPDP"
):
    """
    Synchronous version of add_activity_log for use in non-async contexts
    """
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.post(
                f"{SIPEDE_API_URL}/api/scraper/activity",
                json={
                    "type": log_type,
                    "message": message,
                    "source": source
                }
            )
            if response.status_code == 200:
                print(f"[Activity] {log_type}: {message} ({source})")
            else:
                print(f"[Activity] Failed to log: {response.status_code}")
    except Exception as e:
        print(f"[Activity] Error sending log: {e}")
