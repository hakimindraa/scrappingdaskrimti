# Requirements Document: Direct DASTI Login Button

## Introduction

This feature simplifies the DASTI scraper workflow by replacing the manual URL input field with a direct login button. Currently, users must manually input the DASTI login URL before opening the browser. This creates unnecessary friction and is inconsistent with the SIPEDE and SPDP scrapers, which use direct buttons. The new implementation will provide one-click access to the official DASTI login page at https://dasti.kejaksaan.go.id.

## Glossary

- **DASTI_UI**: The frontend user interface component for the DASTI scraper (DastiScraperTab.tsx)
- **Login_Button**: The direct action button that opens the DASTI login page
- **Browser_Service**: The backend service that opens and controls the browser instance
- **Login_URL**: The hardcoded URL constant for the official DASTI login page (https://dasti.kejaksaan.go.id)
- **Step_1**: The initial state of the DASTI scraper workflow where users initiate browser opening
- **Step_2**: The waiting-login state after the browser has been successfully opened

## Requirements

### Requirement 1: Direct Login Button Display

**User Story:** As a user, I want to see a direct login button instead of a URL input field, so that I can access DASTI with one click.

#### Acceptance Criteria

1. THE DASTI_UI SHALL display the Login_Button in Step_1
2. THE DASTI_UI SHALL remove the URL input field from Step_1
3. THE Login_Button SHALL display the text "Open DASTI Login"
4. THE Login_Button SHALL display an appropriate browser or login icon

### Requirement 2: Browser Opening Action

**User Story:** As a user, I want the button to automatically open the DASTI login page, so that I don't need to manually input the URL.

#### Acceptance Criteria

1. WHEN the user clicks the Login_Button, THE DASTI_UI SHALL call the Browser_Service with the Login_URL
2. THE Login_URL SHALL be set to "https://dasti.kejaksaan.go.id"
3. WHEN the Browser_Service successfully opens the browser, THE DASTI_UI SHALL transition to Step_2
4. THE DASTI_UI SHALL use the existing api.openBrowser() function to open the browser

### Requirement 3: Loading State Feedback

**User Story:** As a user, I want to see visual feedback when the button is clicked, so that I know the system is processing my request.

#### Acceptance Criteria

1. WHEN the user clicks the Login_Button, THE DASTI_UI SHALL disable the Login_Button
2. WHILE the browser is opening, THE DASTI_UI SHALL display a loading spinner on the Login_Button
3. WHILE the browser is opening, THE DASTI_UI SHALL change the button text to "Membuka browser..."
4. WHEN the browser opens successfully or fails, THE DASTI_UI SHALL re-enable the Login_Button

### Requirement 4: Error Handling

**User Story:** As a user, I want to see clear error messages if the browser fails to open, so that I can troubleshoot the issue.

#### Acceptance Criteria

1. IF the Browser_Service fails to open the browser, THEN THE DASTI_UI SHALL display an error message
2. THE DASTI_UI SHALL display the error message "Failed to connect to server. Pastikan backend DASTI berjalan di port 5002."
3. WHEN an error occurs, THE DASTI_UI SHALL remain in Step_1
4. WHEN an error occurs, THE DASTI_UI SHALL allow the user to retry by clicking the Login_Button again

### Requirement 5: UI Consistency

**User Story:** As a user, I want the DASTI scraper to work like the SIPEDE and SPDP scrapers, so that I have a consistent experience across all scrapers.

#### Acceptance Criteria

1. THE DASTI_UI SHALL follow the same button styling as SIPEDE and SPDP scrapers
2. THE DASTI_UI SHALL follow the same loading state pattern as SIPEDE and SPDP scrapers
3. THE DASTI_UI SHALL follow the same error handling pattern as SIPEDE and SPDP scrapers
4. THE DASTI_UI SHALL maintain the existing step indicator and progress tracking

### Requirement 6: URL Configuration

**User Story:** As a developer, I want the DASTI login URL to be defined as a constant, so that it can be easily updated if needed.

#### Acceptance Criteria

1. THE DASTI_UI SHALL define the Login_URL as a named constant
2. THE Login_URL constant SHALL be located at the top of the component file
3. THE Login_URL constant SHALL have a descriptive name indicating its purpose
4. THE DASTI_UI SHALL reference the Login_URL constant when calling the Browser_Service

### Requirement 7: Performance

**User Story:** As a user, I want the button to respond quickly when clicked, so that the interface feels responsive.

#### Acceptance Criteria

1. WHEN the user clicks the Login_Button, THE DASTI_UI SHALL respond within 500 milliseconds
2. WHEN the Browser_Service is called, THE browser SHALL open within 3 seconds under normal network conditions
3. THE DASTI_UI SHALL not block user interaction with other UI elements while the browser is opening

### Requirement 8: Backward Compatibility

**User Story:** As a developer, I want to ensure no backend changes are required, so that the implementation is frontend-only.

#### Acceptance Criteria

1. THE DASTI_UI SHALL use the existing Browser_Service API without modifications
2. THE Browser_Service SHALL continue to accept URL parameters as before
3. THE DASTI_UI SHALL maintain compatibility with the existing scraper workflow states
4. THE implementation SHALL not require changes to dasti-scraper/app/services/scraper_service.py
