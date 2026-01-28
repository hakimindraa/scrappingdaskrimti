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

# Parse CORS origins from environment variable (comma separated)
cors_origins_env = os.getenv("CORS_ORIGIN", "http://localhost:3000,http://127.0.0.1:3000")
allowed_origins = [origin.strip() for origin in cors_origins_env.split(",")]

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
