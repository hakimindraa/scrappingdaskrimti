from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import time
import re
from typing import Optional, Dict, List, Any
from datetime import datetime
from app.services.activity_logger import add_activity_log_sync
from app.services import data_store


class SPPScraperService:
    def __init__(self):
        self.driver: Optional[webdriver.Chrome] = None
        self.data: List[Dict[str, str]] = []
        self.headers: List[str] = []
        self.status = {
            "browserOpen": False,
            "isLoggedIn": False,
            "isRunning": False,
            "currentPage": 0,
            "pagesScraped": 0,
            "itemsScraped": 0,
            "startTime": None,
            "error": None,
            "currentUrl": None,
            "tableInfo": None,
            "dataCount": 0,
            "elapsedTime": 0,
            "shouldStop": False
        }
        
        # Load persisted data on startup
        try:
            loaded = data_store.load_data('SPDP')
            if loaded.get('success') and loaded.get('data'):
                self.data = loaded['data']
                self.headers = loaded.get('headers', [])
                self.status['dataCount'] = len(self.data)
                self.status['pagesScraped'] = loaded.get('pages_scraped', 0)
                print(f"[Service] Loaded {len(self.data)} persisted SPDP records from database")
        except Exception as e:
            print(f"[Service] Failed to load persisted data: {e}")
    
    def _setup_driver(self):
        """Setup Chrome driver dengan opsi optimal"""
        chrome_options = Options()
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--start-maximized")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
            "source": """
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                })
            """
        })
        
        return driver
    
    def open_browser(self) -> str:
        """Open browser and navigate to SPP login page"""
        if self.driver:
            self.close_browser()
        
        self.driver = self._setup_driver()
        self.driver.get("http://10.35.0.101:4111/")
        time.sleep(2)
        
        self.status["browserOpen"] = True
        self.status["currentUrl"] = self.driver.current_url
        self.status["error"] = None
        
        return self.driver.current_url
    
    def close_browser(self):
        """Close browser"""
        if self.driver:
            try:
                self.driver.quit()
            except:
                pass
            self.driver = None
        
        self.status["browserOpen"] = False
        self.status["isRunning"] = False
        self.status["currentUrl"] = None
    
    def navigate_to(self, url: str):
        """Navigate to URL"""
        if not self.driver:
            raise Exception("Browser not open")
        
        self.driver.get(url)
        time.sleep(2)
        self.status["currentUrl"] = self.driver.current_url
    
    def get_status(self) -> Dict:
        """Get current status"""
        if self.driver:
            try:
                self.status["currentUrl"] = self.driver.current_url
            except:
                pass
        
        # Calculate elapsed time
        if self.status["startTime"]:
            start = datetime.fromisoformat(self.status["startTime"])
            self.status["elapsedTime"] = int((datetime.now() - start).total_seconds())
        
        self.status["dataCount"] = len(self.data)
        return self.status
    
    def _get_pagination_info(self) -> Dict:
        """Get pagination info from current page"""
        try:
            info_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Showing')]")
            for el in info_elements:
                text = el.text
                match = re.search(r'Showing\s+([\d,]+)\s+to\s+([\d,]+)\s+of\s+([\d,]+)', text)
                if match:
                    from_num = int(match.group(1).replace(',', ''))
                    to_num = int(match.group(2).replace(',', ''))
                    total_entries = int(match.group(3).replace(',', ''))
                    per_page = to_num - from_num + 1
                    if per_page <= 0:
                        per_page = 10
                    total_pages = (total_entries + per_page - 1) // per_page
                    return {
                        "totalEntries": total_entries,
                        "totalPages": total_pages,
                        "currentPage": (from_num // per_page) + 1,
                        "entriesPerPage": per_page
                    }
            
            # Fallback: Try to find total entries from any text containing numbers
            # For dynamic pagination, mark as "unknown" so UI can show appropriate message
            page_links = self.driver.find_elements(By.CSS_SELECTOR, "ul.pagination li a, .pagination a")
            max_page = 1
            for link in page_links:
                text = link.text.strip()
                if text.isdigit():
                    max_page = max(max_page, int(text))
            
            # Mark as dynamic pagination (more pages may exist)
            return {
                "totalEntries": -1,  # -1 = unknown (dynamic)
                "totalPages": -1,    # -1 = unknown (dynamic)
                "currentPage": 1,
                "entriesPerPage": 10,
                "isDynamic": True
            }
        except Exception as e:
            return {
                "totalEntries": 0,
                "totalPages": -1,
                "currentPage": 1,
                "entriesPerPage": 10,
                "isDynamic": True
            }
    
    def detect_table(self) -> Optional[Dict]:
        """Detect table on current page"""
        if not self.driver:
            raise Exception("Browser not open")
        
        try:
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "table tbody tr"))
            )
            time.sleep(1)
            
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            table = soup.find('table')
            
            if not table:
                return None
            
            headers = []
            thead = table.find('thead')
            if thead:
                header_row = thead.find('tr')
                if header_row:
                    headers = [th.get_text(strip=True) for th in header_row.find_all(['th', 'td'])]
            
            tbody = table.find('tbody')
            row_count = len(tbody.find_all('tr')) if tbody else 0
            
            pagination = self._get_pagination_info()
            
            self.headers = headers
            self.status["tableInfo"] = {
                "headers": headers,
                "rowCount": row_count,
                "pagination": pagination
            }
            
            return {
                "headers": headers,
                "row_count": row_count,
                "pagination": pagination,
                "current_url": self.driver.current_url
            }
        except Exception as e:
            self.status["error"] = str(e)
            return None
    
    def _get_first_row_text(self) -> str:
        """Get first row text for change detection"""
        try:
            tbody = self.driver.find_element(By.CSS_SELECTOR, "table tbody")
            first_row = tbody.find_element(By.CSS_SELECTOR, "tr:first-child")
            return first_row.text.strip()[:100]
        except:
            return ""
    
    def _extract_year_from_row(self, row: Dict[str, str]) -> Optional[int]:
        """Extract year from row data by looking for date patterns"""
        # Look for year in any column, prioritize columns with SPDP, TANGGAL, TGL in name
        priority_keys = []
        other_keys = []
        
        for key in row.keys():
            key_upper = key.upper()
            if any(x in key_upper for x in ['SPDP', 'TANGGAL', 'TGL', 'DATE']):
                priority_keys.append(key)
            else:
                other_keys.append(key)
        
        # Check priority columns first, then others
        for key in priority_keys + other_keys:
            value = str(row.get(key, ''))
            
            # Look for date pattern DD-MM-YYYY or DD/MM/YYYY
            date_match = re.search(r'\d{1,2}[-/]\d{1,2}[-/](\d{4})', value)
            if date_match:
                return int(date_match.group(1))
            
            # Look for year in SPDP number pattern /YYYY/
            spdp_match = re.search(r'/(\d{4})/', value)
            if spdp_match:
                year = int(spdp_match.group(1))
                if 2000 <= year <= 2100:  # Validate reasonable year range
                    return year
            
            # Look for standalone 4-digit year
            year_match = re.search(r'\b(20\d{2})\b', value)
            if year_match:
                return int(year_match.group(1))
        
        return None
    
    def _scrape_current_page(self) -> List[Dict]:
        """Scrape data from current page"""
        page_data = []
        
        try:
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "table tbody tr"))
            )
            time.sleep(1)
            
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            table = soup.find('table')
            
            if table:
                # Get headers if not already set
                if not self.headers:
                    thead = table.find('thead')
                    if thead:
                        header_row = thead.find('tr')
                        if header_row:
                            self.headers = [th.get_text(strip=True) for th in header_row.find_all(['th', 'td'])]
                
                tbody = table.find('tbody')
                if tbody:
                    rows = tbody.find_all('tr')
                    for tr in rows:
                        cells = tr.find_all(['td', 'th'])
                        row_values = [cell.get_text(strip=True) for cell in cells]
                        
                        if row_values and any(row_values):
                            row_dict = {}
                            for i, value in enumerate(row_values):
                                key = self.headers[i] if i < len(self.headers) else f"Kolom_{i+1}"
                                row_dict[key] = value
                            page_data.append(row_dict)
        
        except Exception as e:
            self.status["error"] = str(e)
        
        return page_data
    
    def _wait_for_page_change(self, old_first_row: str, timeout: int = 15) -> bool:
        """Wait for page content to change"""
        start_time = time.time()
        while time.time() - start_time < timeout:
            new_first_row = self._get_first_row_text()
            if new_first_row and new_first_row != old_first_row:
                return True
            time.sleep(0.3)
        return False
    
    def _click_next_page(self, target_page: int = None) -> bool:
        """Click next page button"""
        try:
            old_first_row = self._get_first_row_text()
            
            # Try clicking page number
            if target_page:
                page_selectors = [
                    f"//ul[contains(@class, 'pagination')]//a[normalize-space(text())='{target_page}']",
                    f"//ul[contains(@class, 'pagination')]//li/a[text()='{target_page}']",
                    f"//a[contains(@class, 'page-link') and normalize-space(text())='{target_page}']",
                ]
                
                for selector in page_selectors:
                    try:
                        elements = self.driver.find_elements(By.XPATH, selector)
                        for element in elements:
                            if element.is_displayed():
                                self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
                                time.sleep(0.5)
                                self.driver.execute_script("arguments[0].click();", element)
                                time.sleep(2)
                                
                                if self._wait_for_page_change(old_first_row):
                                    return True
                    except:
                        continue
            
            # Try Next button
            next_selectors = [
                "//ul[contains(@class, 'pagination')]//li[not(contains(@class, 'disabled'))]/a[contains(text(), '›')]",
                "//ul[contains(@class, 'pagination')]//li[not(contains(@class, 'disabled'))]/a[contains(text(), '>')]",
                "//ul[contains(@class, 'pagination')]//li[not(contains(@class, 'disabled'))]/a[contains(text(), 'Next')]",
                "//a[@aria-label='Next' and not(ancestor::li[contains(@class, 'disabled')])]",
            ]
            
            for selector in next_selectors:
                try:
                    elements = self.driver.find_elements(By.XPATH, selector)
                    for element in elements:
                        if element.is_displayed():
                            try:
                                parent = element.find_element(By.XPATH, "./parent::li")
                                if "disabled" in (parent.get_attribute("class") or ""):
                                    continue
                            except:
                                pass
                            
                            self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
                            time.sleep(0.5)
                            self.driver.execute_script("arguments[0].click();", element)
                            time.sleep(2)
                            
                            if self._wait_for_page_change(old_first_row):
                                return True
                except:
                    continue
            
            return False
        except Exception as e:
            return False
    
    def _is_last_page(self) -> bool:
        """Check if on last page"""
        try:
            next_disabled = self.driver.find_elements(By.XPATH, 
                "//ul[contains(@class, 'pagination')]//li[contains(@class, 'disabled')]/a[contains(text(), '›')]"
            )
            if next_disabled:
                return True
            
            last_disabled = self.driver.find_elements(By.XPATH,
                "//ul[contains(@class, 'pagination')]//li[contains(@class, 'disabled')]/a[contains(text(), '»')]"
            )
            if last_disabled:
                return True
            
            return False
        except:
            return False
    
    def scrape_all_pages(self, start_page: int = 1, end_page: int = 0, filter_year: int = 0):
        """Scrape pages from start_page to end_page (0 = all pages), optionally filter by year"""
        self.status["isRunning"] = True
        self.status["startTime"] = datetime.now().isoformat()
        self.status["error"] = None
        self.status["shouldStop"] = False
        self.status["pagesScraped"] = 0
        self.status["itemsScraped"] = 0
        self.data = []
        
        # Log activity: scraping started
        year_info = f" tahun {filter_year}" if filter_year > 0 else ""
        if end_page > 0:
            add_activity_log_sync("info", f"Scraping dimulai (halaman {start_page}-{end_page}{year_info})", "SPDP")
        else:
            add_activity_log_sync("info", f"Scraping dimulai (dari halaman {start_page}{year_info})", "SPDP")
        
        seen_rows = set()
        pagination = self._get_pagination_info()
        total_pages = pagination.get("totalPages", 1)
        
        # Determine target end page
        # When end_page is 0, we scrape all pages (use a very high limit and rely on _is_last_page())
        if end_page > 0:
            target_end_page = end_page
        else:
            target_end_page = 99999  # No limit, will stop at _is_last_page()
        
        # Navigate to start page if not page 1
        current_page = start_page - 1  # Will be incremented to start_page in loop
        if start_page > 1:
            # Navigate to start page first
            if not self._click_next_page(target_page=start_page):
                self.status["error"] = f"Gagal navigasi ke halaman {start_page}"
                self.status["isRunning"] = False
                add_activity_log_sync("error", f"Gagal navigasi ke halaman {start_page}", "SPDP")
                return
            time.sleep(1)
        
        consecutive_failures = 0
        max_failures = 5
        
        try:
            while not self.status["shouldStop"]:
                current_page += 1
                self.status["currentPage"] = current_page
                
                # Scrape current page
                page_data = self._scrape_current_page()
                
                if page_data:
                    new_rows = 0
                    for row in page_data:
                        # Filter by year if specified
                        if filter_year > 0:
                            row_year = self._extract_year_from_row(row)
                            if row_year != filter_year:
                                continue  # Skip this row
                        
                        row_tuple = tuple(sorted(row.items()))
                        if row_tuple not in seen_rows:
                            seen_rows.add(row_tuple)
                            self.data.append(row)
                            new_rows += 1
                    
                    if new_rows > 0:
                        self.status["pagesScraped"] = current_page
                        self.status["itemsScraped"] = len(self.data)
                        consecutive_failures = 0
                    else:
                        consecutive_failures += 1
                else:
                    consecutive_failures += 1
                
                # Check stop conditions
                if consecutive_failures >= max_failures:
                    break
                
                if self._is_last_page():
                    break
                
                if current_page >= target_end_page:
                    break
                
                # Go to next page
                next_page = current_page + 1
                if not self._click_next_page(target_page=next_page):
                    time.sleep(2)
                    if not self._click_next_page(target_page=next_page):
                        consecutive_failures += 1
                        if consecutive_failures >= max_failures:
                            break
                    else:
                        consecutive_failures = 0
                        time.sleep(1)
                else:
                    consecutive_failures = 0
                    time.sleep(1)
        
        except Exception as e:
            self.status["error"] = str(e)
        
        finally:
            self.status["isRunning"] = False
            self.status["dataCount"] = len(self.data)
            
            # Log activity: scraping completed or error
            if self.status["error"]:
                add_activity_log_sync("error", f"Scraping gagal: {self.status['error']}", "SPDP")
            else:
                # Save data to database for persistence
                data_store.save_data('SPDP', self.headers, self.data, self.status['pagesScraped'])
                add_activity_log_sync(
                    "success", 
                    f"Scraping selesai - {len(self.data)} data dari {self.status['pagesScraped']} halaman", 
                    "SPDP"
                )
    
    def stop_scraping(self):
        """Stop scraping process"""
        self.status["shouldStop"] = True
    
    def get_data(self, page: int = 1, limit: int = 10, search: str = "") -> Dict:
        """Get paginated data"""
        filtered_data = self.data
        
        if search:
            search_lower = search.lower()
            filtered_data = [
                row for row in self.data
                if any(search_lower in str(v).lower() for v in row.values())
            ]
        
        total = len(filtered_data)
        total_pages = (total + limit - 1) // limit if total > 0 else 1
        
        start = (page - 1) * limit
        end = start + limit
        page_data = filtered_data[start:end]
        
        return {
            "data": page_data,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": total_pages
            }
        }
    
    def get_all_data(self) -> List[Dict]:
        """Get all scraped data"""
        return self.data
    
    def clear_data(self):
        """Clear all data"""
        self.data = []
        self.headers = []
        self.status["dataCount"] = 0
        self.status["pagesScraped"] = 0
        self.status["itemsScraped"] = 0
        # Clear from database
        data_store.clear_data('SPDP')
