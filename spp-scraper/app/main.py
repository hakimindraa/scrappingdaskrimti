from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from app.routers import scraper
import os

app = FastAPI(
    title="SPP Scraper API",
    description="API untuk scraping data SPP via LAN",
    version="1.0.0"
)

# CORS - Allow all origins for local network access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(scraper.router, prefix="/api/scraper", tags=["scraper"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "SPP Scraper API is running"}


@app.get("/")
async def root():
    return {"status": "ok", "message": "SPP Scraper API"}
