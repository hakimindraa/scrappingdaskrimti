from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import scraper, insight
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="DASTI Scraper API",
    description="API untuk scraping data DASTI dengan login dan captcha handling",
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
app.include_router(insight.router, prefix="/api/insight", tags=["insight"])


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "message": "DASTI Scraper API is running",
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "DASTI Scraper API",
        "version": "1.0.0",
        "docs": "/docs"
    }
