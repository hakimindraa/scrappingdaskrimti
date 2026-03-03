from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import json
import io
import re
from bs4 import BeautifulSoup
from app.services.scraper_service import DastiScraperService
from app.services.activity_logger import get_activity_logs, clear_activity_logs

router = APIRouter()

# Global scraper instance
scraper = DastiScraperService()


class OpenBrowserRequest(BaseModel):
    url: Optional[str] = None


class NavigateRequest(BaseModel):
    url: str


class StartScrapingRequest(BaseModel):
    startPage: int = 1
    endPage: int = 0


class SetDataUrlRequest(BaseModel):
    url: str


@router.post("/open")
async def open_browser(request: OpenBrowserRequest):
    """Open browser and navigate to URL"""
    result = scraper.open_browser(request.url)
    return result


@router.post("/close")
async def close_browser():
    """Close browser"""
    scraper.close_browser()
    return {"success": True, "message": "Browser closed"}


@router.post("/navigate")
async def navigate(request: NavigateRequest):
    """Navigate to URL"""
    result = scraper.navigate_to(request.url)
    return result


@router.get("/current-url")
async def get_current_url():
    """Get current URL"""
    result = scraper.get_current_url()
    return result


@router.get("/screenshot")
async def take_screenshot(filename: Optional[str] = None):
    """Take screenshot"""
    result = scraper.take_screenshot(filename)
    return result


@router.get("/detect-captcha")
async def detect_captcha():
    """Detect captcha on current page"""
    result = scraper.detect_captcha()
    return result


@router.get("/check-login")
async def check_login():
    """Check if user is logged in"""
    result = scraper.check_login()
    return result


@router.post("/save-session")
async def save_session():
    """Save session cookies and navigation state"""
    result = scraper.save_session()
    return result


@router.post("/load-session")
async def load_session():
    """Load session cookies and navigation state"""
    result = scraper.load_session()
    return result


@router.get("/navigation-state")
async def get_navigation_state():
    """Get navigation state"""
    result = scraper.get_navigation_state()
    return result


@router.post("/set-data-url")
async def set_data_url(request: SetDataUrlRequest):
    """Set data page URL manually"""
    result = scraper.set_data_url(request.url)
    return result


@router.post("/navigate-to-data")
async def navigate_to_data():
    """Auto navigate to data page"""
    result = scraper.navigate_to_data()
    return result


@router.get("/detect-table")
async def detect_table():
    """Detect table on current page"""
    table_info = scraper.detect_table()
    if table_info:
        return {"success": True, "tableInfo": table_info}
    else:
        return {"success": False, "error": "No table detected"}


@router.post("/start")
async def start_scraping(request: StartScrapingRequest):
    """Start scraping"""
    import threading
    
    thread = threading.Thread(
        target=scraper.scrape_all_pages,
        args=(request.startPage, request.endPage)
    )
    thread.daemon = True
    thread.start()
    
    return {
        "success": True,
        "message": "Scraping started",
        "startPage": request.startPage,
        "endPage": request.endPage if request.endPage > 0 else "all"
    }


@router.post("/stop")
async def stop_scraping():
    """Stop scraping"""
    scraper.stop_scraping()
    return {"success": True, "message": "Scraping stopped"}


@router.get("/status")
async def get_status():
    """Get scraper status"""
    status = scraper.get_status()
    return {"success": True, "status": status}


@router.get("/data")
async def get_data(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query("")
):
    """Get paginated data"""
    result = scraper.get_data(page, limit, search)
    return {"success": True, **result}


@router.get("/data/all")
async def get_all_data():
    """Get all data"""
    data = scraper.get_all_data()
    return {
        "success": True,
        "data": data,
        "count": len(data)
    }


@router.post("/data/clear")
async def clear_data():
    """Clear all data"""
    scraper.clear_data()
    return {"success": True, "message": "Data cleared"}


@router.get("/export/csv")
async def export_csv():
    """Export data to CSV"""
    data = scraper.get_all_data()
    
    if not data:
        return {"success": False, "error": "No data to export"}
    
    df = pd.DataFrame(data)
    
    # Create CSV in memory
    output = io.StringIO()
    df.to_csv(output, index=False, encoding='utf-8-sig')
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8-sig')),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=dasti_data.csv"
        }
    )


@router.get("/export/json")
async def export_json():
    """Export data to JSON"""
    data = scraper.get_all_data()
    
    if not data:
        return {"success": False, "error": "No data to export"}
    
    json_str = json.dumps(data, ensure_ascii=False, indent=2)
    
    return StreamingResponse(
        io.BytesIO(json_str.encode('utf-8')),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename=dasti_data.json"
        }
    )


@router.get("/export/excel")
async def export_excel():
    """Export data to Excel"""
    data = scraper.get_all_data()
    
    if not data:
        return {"success": False, "error": "No data to export"}
    
    df = pd.DataFrame(data)
    
    # Create Excel in memory
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='DASTI Data')
    
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=dasti_data.xlsx"
        }
    )


@router.get("/logs")
async def get_logs(limit: int = Query(100, ge=1, le=1000)):
    """Get activity logs"""
    logs = get_activity_logs("DASTI", limit)
    return {
        "success": True,
        "logs": logs,
        "count": len(logs)
    }


@router.post("/logs/clear")
async def clear_logs():
    """Clear activity logs"""
    result = clear_activity_logs("DASTI")
    return result


@router.get("/debug/pagination")
async def debug_pagination():
    """Debug pagination elements on current page"""
    if not scraper.driver:
        return {"success": False, "error": "Browser not open"}
    
    try:
        # Get all pagination elements
        pagination_info = {
            "success": True,
            "elements": []
        }
        
        # Find all links in pagination
        pagination_links = scraper.driver.find_elements(By.XPATH, "//ul[contains(@class, 'pagination')]//a")
        for i, link in enumerate(pagination_links):
            pagination_info["elements"].append({
                "index": i,
                "text": link.text,
                "href": link.get_attribute("href"),
                "class": link.get_attribute("class"),
                "visible": link.is_displayed()
            })
        
        # Get page source snippet around pagination
        soup = BeautifulSoup(scraper.driver.page_source, 'html.parser')
        pagination_html = soup.find('ul', class_=re.compile('pagination'))
        if pagination_html:
            pagination_info["html"] = str(pagination_html)[:500]  # First 500 chars
        
        return pagination_info
    except Exception as e:
        return {"success": False, "error": str(e)}
