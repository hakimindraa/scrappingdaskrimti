from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.services.scraper_service import SPPScraperService
import json
import io
import csv

router = APIRouter()

# Global scraper instance
scraper_service = SPPScraperService()


class NavigateRequest(BaseModel):
    url: str


class ScrapeRequest(BaseModel):
    max_pages: int = 0  # 0 = all pages


# Status endpoint
@router.get("/status")
async def get_status():
    return {
        "success": True,
        "data": scraper_service.get_status()
    }


# Open browser
@router.post("/open")
async def open_browser():
    try:
        result = scraper_service.open_browser()
        return {"success": True, "message": "Browser opened", "url": result}
    except Exception as e:
        return {"success": False, "message": str(e)}


# Close browser
@router.post("/close")
async def close_browser():
    try:
        scraper_service.close_browser()
        return {"success": True, "message": "Browser closed"}
    except Exception as e:
        return {"success": False, "message": str(e)}


# Navigate to URL
@router.post("/navigate")
async def navigate(request: NavigateRequest):
    try:
        scraper_service.navigate_to(request.url)
        return {"success": True, "message": f"Navigated to {request.url}"}
    except Exception as e:
        return {"success": False, "message": str(e)}


# Detect table on current page
@router.get("/detect-table")
async def detect_table():
    try:
        result = scraper_service.detect_table()
        if result:
            return {
                "success": True,
                "headers": result.get("headers", []),
                "rowCount": result.get("row_count", 0),
                "pagination": result.get("pagination"),
                "currentUrl": result.get("current_url")
            }
        return {"success": False, "message": "No table found"}
    except Exception as e:
        return {"success": False, "message": str(e)}


# Start scraping
@router.post("/start")
async def start_scraping(request: ScrapeRequest, background_tasks: BackgroundTasks):
    try:
        if scraper_service.status["isRunning"]:
            return {"success": False, "message": "Scraping already in progress"}
        
        background_tasks.add_task(scraper_service.scrape_all_pages, request.max_pages)
        return {"success": True, "message": "Scraping started"}
    except Exception as e:
        return {"success": False, "message": str(e)}


# Stop scraping
@router.post("/stop")
async def stop_scraping():
    try:
        scraper_service.stop_scraping()
        return {"success": True, "message": "Scraping stopped"}
    except Exception as e:
        return {"success": False, "message": str(e)}


# Get scraped data
@router.get("/data")
async def get_data(page: int = 1, limit: int = 10, search: str = ""):
    try:
        result = scraper_service.get_data(page, limit, search)
        return {
            "success": True,
            "data": result["data"],
            "pagination": result["pagination"]
        }
    except Exception as e:
        return {"success": False, "message": str(e), "data": [], "pagination": {}}


# Export to CSV
@router.get("/export/csv")
async def export_csv():
    try:
        data = scraper_service.get_all_data()
        if not data:
            raise HTTPException(status_code=404, detail="No data to export")
        
        output = io.StringIO()
        if data:
            writer = csv.DictWriter(output, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=spp_data.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Export to JSON
@router.get("/export/json")
async def export_json():
    try:
        data = scraper_service.get_all_data()
        if not data:
            raise HTTPException(status_code=404, detail="No data to export")
        
        return StreamingResponse(
            iter([json.dumps(data, indent=2, ensure_ascii=False)]),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=spp_data.json"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Clear data
@router.post("/clear")
async def clear_data():
    try:
        scraper_service.clear_data()
        return {"success": True, "message": "Data cleared"}
    except Exception as e:
        return {"success": False, "message": str(e)}
