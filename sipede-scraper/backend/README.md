# SIPEDE Scraper Backend

Backend API service for scraping data from SIPEDE (Sistem Informasi Persuratan Desa) using Playwright.

## Features

- 🔐 **Login Authentication** - Authenticate with SIPEDE portal
- 📄 **Data Scraping** - Extract surat masuk data from tables
- 📊 **Pagination Support** - Handle multi-page data extraction
- 🔍 **Search & Filter** - Search by keywords, date range
- 📥 **Export Data** - Export to JSON or CSV format
- ⚡ **Real-time Status** - Track scraping progress

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Scraping**: Playwright
- **Security**: Helmet, CORS

## Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Copy environment file
copy .env.example .env
```

## Configuration

Edit `.env` file:

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
SIPEDE_BASE_URL=https://sipede.patikab.go.id
```

## Usage

### Start Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/scraper/login` | Login to SIPEDE |
| POST | `/api/scraper/logout` | Logout and cleanup |
| GET | `/api/scraper/status` | Get scraping status |
| POST | `/api/scraper/scrape` | Start scraping |
| POST | `/api/scraper/search` | Search surat |
| GET | `/api/scraper/data` | Get scraped data |
| GET | `/api/scraper/export/json` | Export to JSON |
| GET | `/api/scraper/export/csv` | Export to CSV |

### Example API Calls

**Login:**
```bash
curl -X POST http://localhost:5000/api/scraper/login \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'
```

**Start Scraping:**
```bash
curl -X POST http://localhost:5000/api/scraper/scrape \
  -H "Content-Type: application/json" \
  -d '{"startPage": 1, "endPage": 10}'
```

**Get Status:**
```bash
curl http://localhost:5000/api/scraper/status
```

**Get Data (with pagination):**
```bash
curl "http://localhost:5000/api/scraper/data?page=1&limit=20&search=surat"
```

**Export to CSV:**
```bash
curl http://localhost:5000/api/scraper/export/csv -o surat_masuk.csv
```

## Data Structure

Each scraped surat record contains:

| Field | Description |
|-------|-------------|
| `no` | Row number |
| `jenisSurat` | Letter type |
| `tanggal` | Date |
| `nomor` | Letter number |
| `asal` | Origin |
| `tujuan` | Destination |
| `hal` | Subject |

## Testing

```bash
# Run test scraper
npm run test:scraper
```

## Project Structure

```
backend/
├── src/
│   ├── scrapers/
│   │   └── sipedeScraper.js    # Playwright scraper
│   ├── controllers/
│   │   └── scraperController.js # API controllers
│   ├── services/
│   │   └── scraperService.js   # Service layer
│   ├── routes/
│   │   └── scraperRoutes.js    # Express routes
│   ├── test/
│   │   └── testScraper.js      # Test script
│   ├── app.js                  # Express app
│   └── server.js               # Server entry
├── .env
├── .env.example
├── package.json
└── README.md
```

## License

MIT
