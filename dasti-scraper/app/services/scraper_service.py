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
import os
from typing import Optional, Dict, List, Any
from datetime import datetime
from app.services.activity_logger import add_activity_log_sync
from app.services import data_store


class DastiScraperService:
    def __init__(self):
        self.driver: Optional[webdriver.Chrome] = None
        self.data: List[Dict[str, str]] = []
        self.headers: List[str] = []
        self.status = {
            "browserOpen": False,
            "isLoggedIn": False,
            "isRunning": False,
            "navigationLevel": 0,  # 0=none, 1=login, 2=after-login, 3=intermediate, 4=data-page
            "currentPage": 0,
            "pagesScraped": 0,
            "itemsScraped": 0,
            "startTime": None,
            "error": None,
            "currentUrl": None,
            "tableInfo": None,
            "dataCount": 0,
            "elapsedTime": 0,
            "shouldStop": False,
            "captchaDetected": False,
            "sessionSaved": False
        }
        
        self.navigation_state = {
            "loginUrl": "",
            "afterLoginUrl": "",
            "intermediateUrl": "",
            "dataPageUrl": "",
            "currentLevel": 0
        }
        
        # Load persisted data on startup
        try:
            loaded = data_store.data_store.load_data('DASTI')
            if loaded.get('success') and loaded.get('data'):
                self.data = loaded['data']
                self.headers = loaded.get('headers', [])
                self.status['dataCount'] = len(self.data)
                self.status['pagesScraped'] = loaded.get('pages_scraped', 0)
                print(f"[Service] Loaded {len(self.data)} persisted DASTI records from database")
        except Exception as e:
            print(f"[Service] Failed to load persisted data: {e}")
    
    def _setup_driver(self):
        """Setup Chrome driver dengan opsi optimal dan anti-detection"""
        chrome_options = Options()
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--start-maximized")
        chrome_options.add_argument("--remote-debugging-port=9222")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation", "enable-logging"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # Suppress Chrome warnings
        chrome_options.add_experimental_option('prefs', {
            'profile.default_content_setting_values.notifications': 2,
            'credentials_enable_service': False,
            'profile.password_manager_enabled': False
        })
        
        # User agent rotation
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
        ]
        import random
        chrome_options.add_argument(f"user-agent={random.choice(user_agents)}")
        
        try:
            # Try to install/update ChromeDriver with cache clearing
            print("[Driver] Installing/updating ChromeDriver...")
            driver_path = ChromeDriverManager().install()
            print(f"[Driver] ChromeDriver path: {driver_path}")
            
            service = Service(driver_path)
            driver = webdriver.Chrome(service=service, options=chrome_options)
            
            # Remove webdriver flag
            driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
                "source": """
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => undefined
                    })
                """
            })
            
            print("[Driver] Chrome driver initialized successfully")
            return driver
            
        except Exception as e:
            print(f"[Driver] Error setting up ChromeDriver: {e}")
            print("[Driver] Trying to clear cache and reinstall...")
            
            # Clear webdriver-manager cache
            import shutil
            import os
            cache_path = os.path.join(os.path.expanduser("~"), ".wdm")
            if os.path.exists(cache_path):
                try:
                    shutil.rmtree(cache_path)
                    print("[Driver] Cache cleared")
                except Exception as cache_err:
                    print(f"[Driver] Could not clear cache: {cache_err}")
            
            # Try again with fresh install
            try:
                driver_path = ChromeDriverManager().install()
                service = Service(driver_path)
                driver = webdriver.Chrome(service=service, options=chrome_options)
                
                driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
                    "source": """
                        Object.defineProperty(navigator, 'webdriver', {
                            get: () => undefined
                        })
                    """
                })
                
                print("[Driver] Chrome driver initialized successfully after cache clear")
                return driver
            except Exception as retry_err:
                print(f"[Driver] Failed to initialize ChromeDriver after retry: {retry_err}")
                raise Exception(f"ChromeDriver initialization failed. Please update Chrome browser or run: pip install --upgrade webdriver-manager selenium")
    
    def open_browser(self, url: str = None) -> Dict:
        """Open browser and navigate to URL"""
        if self.driver:
            self.close_browser()
        
        try:
            self.driver = self._setup_driver()
            
            # Navigate to URL if provided, otherwise use env variable
            target_url = url or os.getenv("DASTI_LOGIN_URL", "")
            if target_url:
                self.driver.get(target_url)
                self.navigation_state["loginUrl"] = target_url
                self.navigation_state["currentLevel"] = 1
                self.status["navigationLevel"] = 1
            
            time.sleep(2)
            
            self.status["browserOpen"] = True
            self.status["currentUrl"] = self.driver.current_url
            self.status["error"] = None
            
            add_activity_log_sync("info", "Browser dibuka", "DASTI")
            
            return {
                "success": True,
                "currentUrl": self.driver.current_url,
                "navigationLevel": self.status["navigationLevel"]
            }
        except Exception as e:
            self.status["error"] = str(e)
            add_activity_log_sync("error", f"Gagal membuka browser: {str(e)}", "DASTI")
            return {"success": False, "error": str(e)}
    
    def close_browser(self):
        """Close browser"""
        if self.driver:
            try:
                self.driver.quit()
                add_activity_log_sync("info", "Browser ditutup", "DASTI")
            except:
                pass
            self.driver = None
        
        self.status["browserOpen"] = False
        self.status["isRunning"] = False
        self.status["currentUrl"] = None
        self.status["navigationLevel"] = 0
        self.navigation_state["currentLevel"] = 0
    
    def navigate_to(self, url: str) -> Dict:
        """Navigate to URL"""
        if not self.driver:
            return {"success": False, "error": "Browser not open"}
        
        try:
            self.driver.get(url)
            time.sleep(2)
            self.status["currentUrl"] = self.driver.current_url
            
            add_activity_log_sync("info", f"Navigasi ke: {url}", "DASTI")
            
            return {
                "success": True,
                "currentUrl": self.driver.current_url
            }
        except Exception as e:
            self.status["error"] = str(e)
            return {"success": False, "error": str(e)}
    
    def get_current_url(self) -> Dict:
        """Get current URL"""
        if not self.driver:
            return {"success": False, "error": "Browser not open"}
        
        try:
            return {
                "success": True,
                "currentUrl": self.driver.current_url
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def take_screenshot(self, filename: str = None) -> Dict:
        """Take screenshot of current page"""
        if not self.driver:
            return {"success": False, "error": "Browser not open"}
        
        try:
            if not filename:
                filename = f"screenshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            
            screenshot_dir = "./screenshots"
            os.makedirs(screenshot_dir, exist_ok=True)
            
            filepath = os.path.join(screenshot_dir, filename)
            self.driver.save_screenshot(filepath)
            
            return {
                "success": True,
                "filepath": filepath
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def detect_captcha(self) -> Dict:
        """Detect if captcha is present on current page"""
        if not self.driver:
            return {"success": False, "error": "Browser not open"}
        
        try:
            captcha_detected = False
            captcha_type = None
            
            # Check for common captcha patterns
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            
            # Check for reCAPTCHA
            if soup.find('div', class_=re.compile(r'g-recaptcha|recaptcha')):
                captcha_detected = True
                captcha_type = "reCAPTCHA"
            
            # Check for image captcha
            elif soup.find('img', alt=re.compile(r'captcha|verification', re.I)):
                captcha_detected = True
                captcha_type = "Image Captcha"
            
            # Check for captcha input field
            elif soup.find('input', {'name': re.compile(r'captcha', re.I)}):
                captcha_detected = True
                captcha_type = "Text Captcha"
            
            self.status["captchaDetected"] = captcha_detected
            
            return {
                "success": True,
                "captchaDetected": captcha_detected,
                "captchaType": captcha_type
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    
    def check_login(self) -> Dict:
        """Check if user is logged in"""
        if not self.driver:
            return {"success": False, "error": "Browser not open"}
        
        try:
            current_url = self.driver.current_url
            login_url = self.navigation_state.get("loginUrl", "")
            
            # Simple check: if URL changed from login page, assume logged in
            is_logged_in = login_url and current_url != login_url
            
            # Additional check: look for logout button or user menu
            if is_logged_in:
                soup = BeautifulSoup(self.driver.page_source, 'html.parser')
                logout_elements = soup.find_all(text=re.compile(r'logout|keluar|sign out', re.I))
                
                if logout_elements:
                    is_logged_in = True
                    self.status["isLoggedIn"] = True
                    self.status["navigationLevel"] = 2
                    self.navigation_state["afterLoginUrl"] = current_url
                    self.navigation_state["currentLevel"] = 2
            
            self.status["isLoggedIn"] = is_logged_in
            
            if is_logged_in:
                add_activity_log_sync("success", "Login berhasil terdeteksi", "DASTI")
            
            return {
                "success": True,
                "isLoggedIn": is_logged_in,
                "currentUrl": current_url,
                "navigationLevel": self.status["navigationLevel"]
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def save_session(self) -> Dict:
        """Save session cookies and navigation state"""
        if not self.driver:
            return {"success": False, "error": "Browser not open"}
        
        try:
            cookies = self.driver.get_cookies()
            
            result = data_store.data_store.save_session(
                'DASTI',
                cookies,
                self.navigation_state
            )
            
            if result.get('success'):
                self.status["sessionSaved"] = True
                add_activity_log_sync("success", "Session berhasil disimpan", "DASTI")
            
            return result
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def load_session(self) -> Dict:
        """Load session cookies and navigation state"""
        if not self.driver:
            return {"success": False, "error": "Browser not open"}
        
        try:
            result = data_store.data_store.load_session('DASTI')
            
            if result.get('success'):
                cookies = result.get('cookies', [])
                nav_state = result.get('navigationState', {})
                
                # Load cookies
                for cookie in cookies:
                    try:
                        self.driver.add_cookie(cookie)
                    except:
                        pass
                
                # Update navigation state
                self.navigation_state.update(nav_state)
                
                # Refresh page to apply cookies
                self.driver.refresh()
                time.sleep(2)
                
                self.status["sessionSaved"] = True
                add_activity_log_sync("success", "Session berhasil dimuat", "DASTI")
                
                return {"success": True, "navigationState": nav_state}
            else:
                return result
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_navigation_state(self) -> Dict:
        """Get current navigation state"""
        return {
            "success": True,
            "navigationState": self.navigation_state,
            "currentLevel": self.status["navigationLevel"]
        }
    
    def set_data_url(self, url: str) -> Dict:
        """Set data page URL manually"""
        try:
            self.navigation_state["dataPageUrl"] = url
            self.navigation_state["currentLevel"] = 4
            self.status["navigationLevel"] = 4
            
            add_activity_log_sync("info", f"Data page URL diset: {url}", "DASTI")
            
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def navigate_to_data(self) -> Dict:
        """Auto navigate to data page using saved URL"""
        if not self.driver:
            return {"success": False, "error": "Browser not open"}
        
        data_url = self.navigation_state.get("dataPageUrl")
        if not data_url:
            return {"success": False, "error": "Data page URL not set"}
        
        try:
            self.driver.get(data_url)
            time.sleep(2)
            
            self.status["currentUrl"] = self.driver.current_url
            self.status["navigationLevel"] = 4
            self.navigation_state["currentLevel"] = 4
            
            add_activity_log_sync("success", "Navigasi ke halaman data berhasil", "DASTI")
            
            return {
                "success": True,
                "currentUrl": self.driver.current_url
            }
        except Exception as e:
            self.status["error"] = str(e)
            return {"success": False, "error": str(e)}
    
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
            # Try to find pagination info text
            info_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Showing') or contains(text(), 'Menampilkan')]")
            for el in info_elements:
                text = el.text
                match = re.search(r'(Showing|Menampilkan)\s+([\d,]+)\s+(to|sampai)\s+([\d,]+)\s+(of|dari)\s+([\d,]+)', text, re.I)
                if match:
                    from_num = int(match.group(2).replace(',', ''))
                    to_num = int(match.group(4).replace(',', ''))
                    total_entries = int(match.group(6).replace(',', ''))
                    per_page = to_num - from_num + 1
                    if per_page <= 0:
                        per_page = 10
                    total_pages = (total_entries + per_page - 1) // per_page
                    return {
                        "type": "numbered",
                        "totalEntries": total_entries,
                        "totalPages": total_pages,
                        "currentPage": (from_num // per_page) + 1,
                        "entriesPerPage": per_page
                    }
            
            # Fallback: detect pagination type
            page_links = self.driver.find_elements(By.CSS_SELECTOR, "ul.pagination li a, .pagination a")
            if page_links:
                max_page = 1
                for link in page_links:
                    text = link.text.strip()
                    if text.isdigit():
                        max_page = max(max_page, int(text))
                
                return {
                    "type": "numbered" if max_page > 1 else "next-prev",
                    "totalEntries": -1,
                    "totalPages": -1,
                    "currentPage": 1,
                    "entriesPerPage": 10,
                    "isDynamic": True
                }
            
            # Check for next/prev buttons only
            next_buttons = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Next') or contains(text(), 'Selanjutnya') or contains(text(), '›')]")
            if next_buttons:
                return {
                    "type": "next-prev",
                    "totalEntries": -1,
                    "totalPages": -1,
                    "currentPage": 1,
                    "entriesPerPage": 10,
                    "isDynamic": True
                }
            
            return {
                "type": "none",
                "totalEntries": 0,
                "totalPages": 1,
                "currentPage": 1,
                "entriesPerPage": 10
            }
        except Exception as e:
            return {
                "type": "unknown",
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
            
            # Debug: Log pagination elements found
            try:
                pagination_elements = self.driver.find_elements(By.XPATH, "//ul[contains(@class, 'pagination')]//a")
                print(f"[DASTI] Found {len(pagination_elements)} pagination links")
                for i, elem in enumerate(pagination_elements[:10]):  # Log first 10
                    print(f"[DASTI] Pagination link {i+1}: text='{elem.text}', href='{elem.get_attribute('href')}'")
            except Exception as e:
                print(f"[DASTI] Error detecting pagination elements: {e}")
            
            self.headers = headers
            self.status["tableInfo"] = {
                "headers": headers,
                "rowCount": row_count,
                "pagination": pagination
            }
            
            add_activity_log_sync("success", f"Tabel terdeteksi: {row_count} baris, {len(headers)} kolom", "DASTI")
            
            return {
                "headers": headers,
                "row_count": row_count,
                "pagination": pagination,
                "current_url": self.driver.current_url
            }
        except Exception as e:
            self.status["error"] = str(e)
            add_activity_log_sync("error", f"Gagal mendeteksi tabel: {str(e)}", "DASTI")
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
            
            # Log current attempt
            if target_page:
                print(f"[DASTI] Attempting to navigate to page {target_page}")
                add_activity_log_sync("info", f"Mencoba navigasi ke halaman {target_page}", "DASTI")
            else:
                print(f"[DASTI] Attempting to click next page")
                add_activity_log_sync("info", "Mencoba klik halaman selanjutnya", "DASTI")
            
            # Try clicking page number
            if target_page:
                page_selectors = [
                    # Standard Bootstrap pagination
                    f"//ul[contains(@class, 'pagination')]//a[normalize-space(text())='{target_page}']",
                    f"//ul[contains(@class, 'pagination')]//li/a[text()='{target_page}']",
                    f"//a[contains(@class, 'page-link') and normalize-space(text())='{target_page}']",
                    # Generic pagination (any list with links)
                    f"//a[normalize-space(text())='{target_page}' and contains(@href, 'page')]",
                    f"//a[text()='{target_page}']",
                    # Button elements
                    f"//button[normalize-space(text())='{target_page}']",
                ]
                
                for selector in page_selectors:
                    try:
                        elements = self.driver.find_elements(By.XPATH, selector)
                        print(f"[DASTI] Found {len(elements)} elements with selector: {selector}")
                        
                        for element in elements:
                            if element.is_displayed():
                                print(f"[DASTI] Clicking element: {element.text}")
                                self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
                                time.sleep(0.5)
                                self.driver.execute_script("arguments[0].click();", element)
                                time.sleep(3)  # Increased wait time
                                
                                if self._wait_for_page_change(old_first_row, timeout=20):
                                    print(f"[DASTI] Successfully navigated to page {target_page}")
                                    add_activity_log_sync("success", f"Berhasil navigasi ke halaman {target_page}", "DASTI")
                                    return True
                    except Exception as e:
                        print(f"[DASTI] Error with selector {selector}: {str(e)}")
                        continue
            
            # Try Next button (for sequential navigation)
            next_selectors = [
                # Bootstrap pagination
                "//ul[contains(@class, 'pagination')]//li[not(contains(@class, 'disabled'))]/a[contains(text(), '›')]",
                "//ul[contains(@class, 'pagination')]//li[not(contains(@class, 'disabled'))]/a[contains(text(), '>')]",
                "//ul[contains(@class, 'pagination')]//li[not(contains(@class, 'disabled'))]/a[contains(text(), 'Next')]",
                "//ul[contains(@class, 'pagination')]//li[not(contains(@class, 'disabled'))]/a[contains(text(), 'Selanjutnya')]",
                "//a[@aria-label='Next' and not(ancestor::li[contains(@class, 'disabled')])]",
                # Generic next buttons
                "//a[contains(text(), 'Selanjutnya') and not(contains(@class, 'disabled'))]",
                "//button[contains(text(), 'Selanjutnya') and not(@disabled)]",
                "//a[contains(@class, 'next') and not(contains(@class, 'disabled'))]",
            ]
            
            for selector in next_selectors:
                try:
                    elements = self.driver.find_elements(By.XPATH, selector)
                    print(f"[DASTI] Found {len(elements)} next buttons with selector: {selector}")
                    
                    for element in elements:
                        if element.is_displayed():
                            try:
                                parent = element.find_element(By.XPATH, "./parent::li")
                                if "disabled" in (parent.get_attribute("class") or ""):
                                    continue
                            except:
                                pass
                            
                            print(f"[DASTI] Clicking next button")
                            self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
                            time.sleep(0.5)
                            self.driver.execute_script("arguments[0].click();", element)
                            time.sleep(3)  # Increased wait time
                            
                            if self._wait_for_page_change(old_first_row, timeout=20):
                                print(f"[DASTI] Successfully clicked next page")
                                add_activity_log_sync("success", "Berhasil klik halaman selanjutnya", "DASTI")
                                return True
                except Exception as e:
                    print(f"[DASTI] Error with next selector {selector}: {str(e)}")
                    continue
            
            print(f"[DASTI] Failed to navigate to next page")
            add_activity_log_sync("warning", "Gagal navigasi ke halaman selanjutnya", "DASTI")
            return False
        except Exception as e:
            print(f"[DASTI] Exception in _click_next_page: {str(e)}")
            add_activity_log_sync("error", f"Error navigasi pagination: {str(e)}", "DASTI")
            return False
    
    def _is_last_page(self) -> bool:
        """Check if on last page"""
        try:
            next_disabled = self.driver.find_elements(By.XPATH, 
                "//ul[contains(@class, 'pagination')]//li[contains(@class, 'disabled')]/a[contains(text(), '›') or contains(text(), 'Next') or contains(text(), 'Selanjutnya')]"
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
    
    def scrape_all_pages(self, start_page: int = 1, end_page: int = 0):
        """Scrape pages from start_page to end_page (0 = all pages)"""
        self.status["isRunning"] = True
        self.status["startTime"] = datetime.now().isoformat()
        self.status["error"] = None
        self.status["shouldStop"] = False
        self.status["pagesScraped"] = 0
        self.status["itemsScraped"] = 0
        self.data = []
        
        # Log activity: scraping started
        if end_page > 0:
            add_activity_log_sync("info", f"Scraping dimulai (halaman {start_page}-{end_page})", "DASTI")
        else:
            add_activity_log_sync("info", f"Scraping dimulai (dari halaman {start_page})", "DASTI")
        
        seen_rows = set()
        
        # Determine target end page
        if end_page > 0:
            target_end_page = end_page
        else:
            target_end_page = 99999  # No limit
        
        # Navigate to start page if not page 1
        current_page = start_page - 1
        if start_page > 1:
            if not self._click_next_page(target_page=start_page):
                self.status["error"] = f"Gagal navigasi ke halaman {start_page}"
                self.status["isRunning"] = False
                add_activity_log_sync("error", f"Gagal navigasi ke halaman {start_page}", "DASTI")
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
            
            # Calculate final elapsed time before stopping timer
            if self.status["startTime"]:
                start = datetime.fromisoformat(self.status["startTime"])
                self.status["elapsedTime"] = int((datetime.now() - start).total_seconds())
                # Stop timer by clearing startTime
                self.status["startTime"] = None
            
            # Log activity and save data
            if self.status["error"]:
                add_activity_log_sync("error", f"Scraping gagal: {self.status['error']}", "DASTI")
            else:
                data_store.data_store.save_data('DASTI', self.headers, self.data, self.status['pagesScraped'])
                add_activity_log_sync(
                    "success", 
                    f"Scraping selesai - {len(self.data)} data dari {self.status['pagesScraped']} halaman", 
                    "DASTI"
                )
    
    def stop_scraping(self):
        """Stop scraping process"""
        self.status["shouldStop"] = True
        add_activity_log_sync("warning", "Scraping dihentikan oleh user", "DASTI")
    
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
        data_store.data_store.clear_data('DASTI')
        add_activity_log_sync("info", "Data berhasil dihapus", "DASTI")
