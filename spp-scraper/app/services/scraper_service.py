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
            
            # Fallback
            page_links = self.driver.find_elements(By.CSS_SELECTOR, "ul.pagination li a, .pagination a")
            max_page = 1
            for link in page_links:
                text = link.text.strip()
                if text.isdigit():
                    max_page = max(max_page, int(text))
            
            return {
                "totalEntries": max_page * 10,
                "totalPages": max_page,
                "currentPage": 1,
                "entriesPerPage": 10
            }
        except Exception as e:
            return {
                "totalEntries": 0,
                "totalPages": 1,
                "currentPage": 1,
                "entriesPerPage": 10
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
    
    def scrape_all_pages(self, max_pages: int = 0):
        """Scrape all pages"""
        self.status["isRunning"] = True
        self.status["startTime"] = datetime.now().isoformat()
        self.status["error"] = None
        self.status["shouldStop"] = False
        self.status["pagesScraped"] = 0
        self.status["itemsScraped"] = 0
        self.data = []
        
        seen_rows = set()
        pagination = self._get_pagination_info()
        total_pages = pagination.get("totalPages", 1)
        
        if max_pages > 0:
            total_pages = min(total_pages, max_pages)
        
        current_page = 0
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
                
                if current_page >= total_pages:
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
