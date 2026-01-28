# Web Scraper Application

A powerful web scraping tool built with **Next.js** (frontend) and **FastAPI** (backend).

## 📁 Project Structure

```
porto/
├── frontend/          # Next.js Application
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   ├── components/# React components
│   │   └── lib/       # API client & utilities
│   └── package.json
│
└── backend/           # FastAPI Application
    ├── app/
    │   ├── main.py    # Entry point
    │   ├── routers/   # API endpoints
    │   ├── services/  # Business logic
    │   └── models/    # Pydantic schemas
    └── requirements.txt
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+

### 1. Start .venv
e:\porto\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

### 2. Start Backend
cd e:\porto\backend; e:\porto\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

cd e:\porto\sipede-scraper\backend; npm run dev

### 3. Frontend
cd e:\porto\frontend; npm run dev

### Jalankan server
Frontend will be available at: http://localhost:3000

## ✨ Features

### Backend
- 🔍 Scrape any website URL
- 📝 Extract page title
- 🏷️ Extract meta tags (description, keywords, OG tags)
- 🔗 Extract all links with text
- 🖼️ Extract all images with alt text
- 📄 Extract text content
- 📑 Extract all headings (H1-H6)
- 🎯 Custom CSS selector support
- ⚡ Async HTTP requests with httpx

### Frontend
- 🎨 Modern dark theme UI
- ✅ Checkbox options for data selection
- 📊 Tabbed results display
- 📋 Copy to clipboard functionality
- 🔄 API health check indicator
- 📱 Responsive design

## 📡 API Endpoints

### POST /api/scrape
Scrape a URL with options.

**Request Body:**
```json
{
  "url": "https://example.com",
  "options": {
    "title": true,
    "meta": true,
    "links": true,
    "images": true,
    "text": false,
    "headings": false
  },
  "custom_selector": null
}
```

### POST /api/scrape/custom
Scrape using custom CSS selector.

**Request Body:**
```json
{
  "url": "https://example.com",
  "selector": ".article-content p",
  "attribute": null
}
```

### GET /health
Health check endpoint.

## 🛠️ Tech Stack

### Frontend
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS

### Backend
- FastAPI
- httpx (async HTTP client)
- BeautifulSoup4 (HTML parsing)
- Pydantic (data validation)

## 📄 License

MIT License
