# Design Document: Direct DASTI Login Button

## Overview

This feature replaces the manual URL input field in the DASTI scraper with a direct login button, providing one-click access to the official DASTI login page. The implementation is frontend-only, requiring no backend modifications, and aligns the DASTI scraper with the existing SIPEDE and SPDP scraper patterns for improved user experience consistency.

The change simplifies the user workflow by eliminating the need to manually input the DASTI login URL (https://dasti.kejaksaan.go.id), reducing friction and potential user errors. The button will handle browser opening, loading states, and error conditions following established patterns from other scrapers in the application.

## Architecture

### Component Structure

The implementation modifies a single React component:
- **DastiScraperTab.tsx**: The main DASTI scraper UI component

### Data Flow

```
User Click → handleOpenBrowser() → api.openBrowser(DASTI_LOGIN_URL) → Backend Service
                                                                              ↓
User sees Step 2 ← setStep('waiting-login') ← Success Response ←──────────────┘
```

### State Management

The component uses React's useState hooks for local state management:
- `step`: Tracks the current workflow step ('initial', 'waiting-login', 'navigating', 'ready', 'scraping', 'done')
- `isLoading`: Boolean flag for loading state during API calls
- `error`: String for error messages

No changes to the existing state management pattern are required.

## Components and Interfaces

### Modified Component: DastiScraperTab

**Location**: `frontend/src/components/DastiScraperTab.tsx`

**Changes**:
1. Add constant for DASTI login URL at the top of the component
2. Remove the `loginUrl` state variable and its input field
3. Modify the `handleOpenBrowser` function to use the constant URL
4. Update the Step 1 UI to display a direct button instead of URL input

### Constant Definition

```typescript
const DASTI_LOGIN_URL = 'https://dasti.kejaksaan.go.id';
```

This constant will be defined at the component level (inside the function component, before hooks) for easy maintenance and visibility.

### Button Component Structure

The button will follow the existing pattern from SIPEDE scraper:

```typescript
<button onClick={handleOpenBrowser} className="primary-btn" disabled={isLoading}>
    {isLoading ? (
        <><span className="spinner" /> Membuka browser...</>
    ) : (
        <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" />
        </svg> Open DASTI Login</>
    )}
</button>
```

### API Integration

The existing `api.openBrowser()` function from `frontend/src/lib/dasti-api.ts` will be used without modification:

```typescript
export async function openBrowser(url?: string): Promise<ApiResponse>
```

The function accepts an optional URL parameter, which will be provided as the `DASTI_LOGIN_URL` constant.

## Data Models

No new data models are required. The implementation uses existing types:

### Existing Types (No Changes)

```typescript
interface ApiResponse {
    success: boolean;
    message?: string;
    error?: string;
    currentUrl?: string;
    navigationLevel?: number;
}
```

The component continues to use the existing `ScraperStatus` and other types from `dasti-api.ts` without modification.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- Properties 3.1-3.4 (loading state management) can be combined into a single comprehensive property about loading state lifecycle
- Properties 4.1, 4.3, 4.4 (error handling) can be combined into a single property about error state behavior
- Properties 2.1 and 2.3 (button click and state transition) represent a single user interaction flow

The following properties represent the unique, non-redundant validation requirements:

### Property 1: Button Click Triggers Correct API Call

*For any* component state where step is 'initial', clicking the login button should call api.openBrowser() with the DASTI_LOGIN_URL constant value.

**Validates: Requirements 2.1, 2.4**

### Property 2: Successful Browser Open Transitions State

*For any* successful API response from openBrowser(), the component should transition from step 'initial' to step 'waiting-login'.

**Validates: Requirements 2.3**

### Property 3: Loading State Lifecycle

*For any* button click that initiates browser opening, the button should be disabled and show loading UI until the API call completes (success or failure), then re-enable.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 4: Error State Preservation

*For any* failed API response, the component should display an error message, remain in the 'initial' step, and keep the button enabled for retry.

**Validates: Requirements 4.1, 4.3, 4.4**

## Error Handling

### Error Scenarios

1. **Network Connection Failure**: When the backend service is unreachable
   - Display: "Failed to connect to server. Pastikan backend DASTI berjalan di port 5002."
   - Action: Remain in Step 1, allow retry

2. **Browser Opening Failure**: When the backend fails to open the browser
   - Display: Error message from API response or generic failure message
   - Action: Remain in Step 1, allow retry

3. **Unexpected API Response**: When the API returns an unexpected format
   - Display: Generic error message
   - Action: Log to console, remain in Step 1, allow retry

### Error Handling Pattern

The implementation follows the existing error handling pattern:

```typescript
try {
    const result = await api.openBrowser(DASTI_LOGIN_URL);
    if (result.success) {
        setStep('waiting-login');
    } else {
        setError(result.error || 'Failed to open browser');
    }
} catch (err) {
    setError('Failed to connect to server. Pastikan backend DASTI berjalan di port 5002.');
} finally {
    setIsLoading(false);
}
```

This pattern ensures:
- Network errors are caught and displayed with helpful messages
- API errors are extracted from the response
- Loading state is always cleaned up
- Users can retry after any error

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific UI examples (button text, icon presence)
- Constant value verification
- Component rendering in specific states
- Integration with existing workflow steps

**Property Tests** focus on:
- Universal behavior across all valid states
- State transition correctness
- Loading state lifecycle management
- Error handling consistency

### Property-Based Testing

**Library**: fast-check (for TypeScript/React)

**Configuration**: Each property test will run a minimum of 100 iterations to ensure comprehensive input coverage.

**Test Tagging**: Each property test will include a comment tag referencing the design document:
```typescript
// Feature: dasti-direct-login, Property 1: Button Click Triggers Correct API Call
```

### Unit Testing Focus

Unit tests will verify:
1. **UI Elements**: Button displays correct text "Open DASTI Login" and has an icon
2. **Constant Value**: DASTI_LOGIN_URL equals "https://dasti.kejaksaan.go.id"
3. **State Rendering**: Step 1 shows button, not URL input field
4. **Error Messages**: Specific error message for connection failures
5. **CSS Classes**: Button uses "primary-btn" class matching SIPEDE/SPDP pattern
6. **Backward Compatibility**: Existing step indicator and workflow states remain functional

### Property Testing Implementation

Each correctness property will be implemented as a single property-based test:

**Property 1 Test**: Generate random component states with step='initial', simulate button click, verify api.openBrowser called with DASTI_LOGIN_URL

**Property 2 Test**: Generate random successful API responses, verify state transitions to 'waiting-login'

**Property 3 Test**: Generate random button click events, verify loading state lifecycle (disabled → loading UI → re-enabled)

**Property 4 Test**: Generate random error responses, verify error display, step preservation, and button remains enabled

### Test File Structure

```
frontend/
  src/
    components/
      __tests__/
        DastiScraperTab.unit.test.tsx      # Unit tests for specific examples
        DastiScraperTab.property.test.tsx  # Property-based tests for universal behavior
```

### Testing Tools

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component rendering and interaction
- **fast-check**: Property-based testing library
- **MSW (Mock Service Worker)**: API mocking for integration tests
