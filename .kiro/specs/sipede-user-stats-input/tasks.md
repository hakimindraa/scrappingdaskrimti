# Implementation Plan: Manual SIPEDE User Statistics Input

## Overview

Implementasi fitur input manual statistik SIPEDE dengan form input, validasi real-time, penyimpanan localStorage, dan visualisasi 3 grafik donut. Fitur ini akan diintegrasikan ke InsightTab sebagai section terpisah di bawah Excel upload section.

## Tasks

- [ ] 1. Setup data layer dan TypeScript interfaces
  - Buat file `frontend/src/types/sipede.ts` dengan interface SipedeStats, DonutChartData, ChartSegment
  - Buat file `frontend/src/lib/sipede-storage.ts` dengan functions saveSipedeStats, loadSipedeStats, clearSipedeStats
  - Implement localStorage error handling dengan graceful degradation
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 1.1 Write property test for localStorage round-trip
  - **Property 5: Data Persistence Round-trip**
  - **Validates: Requirements 2.1, 2.2, 2.4, 2.5, 7.4**

- [ ]* 1.2 Write unit tests for localStorage functions
  - Test default values when localStorage empty
  - Test error handling for corrupted data
  - _Requirements: 2.3_

- [ ] 2. Implement SipedeInputForm component
  - [ ] 2.1 Create component structure dengan 6 input fields
    - Buat file `frontend/src/components/SipedeInputForm.tsx`
    - Implement form layout dengan 3 kolom (2 fields per kolom)
    - Add labels untuk setiap field: Status Aktif, Status Tidak Aktif, Tercatat SIPEDE, Tidak Tercatat SIPEDE, Terdaftar E-sign, Tidak Terdaftar E-sign
    - Add submit button
    - _Requirements: 1.1, 1.4_

  - [ ] 2.2 Implement input validation logic
    - Create validateField function untuk real-time validation
    - Implement rules: integer only, non-negative, required
    - Add error state management per field
    - _Requirements: 1.2, 1.3, 8.1, 8.2, 8.3_

  - [ ]* 2.3 Write property tests for input validation
    - **Property 1: Non-numeric Input Rejection**
    - **Property 2: Negative Number Rejection**
    - **Property 3: Decimal Number Rejection**
    - **Property 4: Valid Integer Acceptance**
    - **Validates: Requirements 1.2, 1.3, 8.1, 8.3**

  - [ ] 2.3 Implement form submission handler
    - Add onSubmit handler yang validate semua fields
    - Trigger parent callback dengan validated data
    - Implement submit button disabled state logic
    - _Requirements: 8.5_

  - [ ] 2.4 Add success and error message display
    - Implement inline error messages per field
    - Add success message dengan auto-dismiss (3 detik)
    - Style error messages (red) dan success messages (green)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 8.4_

  - [ ]* 2.5 Write unit tests for form component
    - Test form structure (6 fields, submit button)
    - Test zero value acceptance
    - Test success message auto-dismiss
    - _Requirements: 1.1, 1.4, 8.2, 6.3_

  - [ ] 2.6 Style SipedeInputForm component
    - Apply Tailwind CSS classes sesuai design (white card, teal gradient header, rounded inputs)
    - Implement responsive layout (3 kolom → 2 kolom → 1 kolom)
    - Match existing card styling (border-radius 20px, soft shadow)
    - _Requirements: 5.1, 5.2_

- [ ] 3. Checkpoint - Ensure form validation works correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement SipedeCharts component
  - [ ] 4.1 Create SipedeCharts parent component
    - Buat file `frontend/src/components/SipedeCharts.tsx`
    - Setup layout untuk 3 charts side by side (flex row)
    - Add responsive behavior (stack to column on mobile)
    - _Requirements: 3.1, 5.2_

  - [ ] 4.2 Implement donut chart helper functions
    - Create donutArc function untuk SVG path calculation
    - Create calculatePercentage function dengan division by zero handling
    - Add error handling untuk invalid data (NaN, undefined)
    - _Requirements: 3.4_

  - [ ] 4.3 Implement StatusChart component (Aktif vs Tidak Aktif)
    - Create SVG donut chart dengan 2 segments
    - Display percentage di center
    - Add labels below chart dengan dots dan counts
    - Colors: #c026d3 (aktif), #e5e7eb (tidak aktif)
    - _Requirements: 3.2, 3.5, 3.6_

  - [ ] 4.4 Implement RegistrationChart component (Tercatat vs Tidak Tercatat SIPEDE)
    - Create SVG donut chart dengan 2 segments
    - Display percentage di center
    - Add labels below chart
    - Colors: #c026d3 (tercatat), #f472b6 (tidak tercatat)
    - _Requirements: 3.3, 3.5, 3.6_

  - [ ] 4.5 Implement EsignChart component (Terdaftar vs Tidak Terdaftar E-sign)
    - Create SVG donut chart dengan 2 segments
    - Display percentage di center
    - Add labels below chart
    - Colors: #c026d3 (terdaftar), #f472b6 (tidak terdaftar)
    - _Requirements: 3.3, 3.5, 3.6_

  - [ ]* 4.6 Write property test for chart data synchronization
    - **Property 8: Chart Data Synchronization**
    - **Validates: Requirements 3.7, 7.3**

  - [ ]* 4.7 Write unit tests for chart components
    - Test all three charts render
    - Test chart labels display correctly
    - Test division by zero handling
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 4.2_

  - [ ] 4.8 Style SipedeCharts component
    - Apply Tailwind CSS untuk chart container (white card, purple gradient header)
    - Style individual charts (120x120px, proper spacing)
    - Implement responsive layout
    - _Requirements: 5.1, 5.2_

- [ ] 5. Checkpoint - Ensure charts render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Integrate components into InsightTab
  - [ ] 6.1 Add SIPEDE state management to InsightTab
    - Import SipedeStats type
    - Add sipedeStats state dengan useState
    - Add useEffect untuk load data dari localStorage on mount
    - Create handleSipedeSubmit function
    - _Requirements: 7.1, 7.2_

  - [ ]* 6.2 Write property tests for state management
    - **Property 6: Form Population from Saved Data**
    - **Property 7: Data Overwrite on Update**
    - **Validates: Requirements 7.1, 7.2**

  - [ ] 6.3 Add new SIPEDE manual input section
    - Import SipedeInputForm dan SipedeCharts components
    - Add section container di bawah Excel upload section, sebelum Dashboard SIPEDE
    - Wire up form onSubmit ke handleSipedeSubmit
    - Pass sipedeStats ke SipedeCharts
    - _Requirements: 4.1, 4.3, 4.4_

  - [ ] 6.4 Update existing "Persentase User SIPEDE" card
    - Calculate statusAktifPercentage dari sipedeStats
    - Calculate tercatatPercentage dari sipedeStats
    - Calculate esignPercentage dari sipedeStats
    - Replace hardcoded values (94%, 62%, 100%) dengan calculated values
    - _Requirements: 4.5_

  - [ ]* 6.5 Write integration tests
    - Test form submission updates charts
    - Test localStorage integration works end-to-end
    - Test section separation (SIPEDE vs Excel upload)
    - Test existing Excel upload functionality unchanged
    - _Requirements: 4.1, 4.4, 7.3_

  - [ ] 6.6 Add CSS styles untuk new section
    - Create .sipede-manual-section class
    - Create .sipede-input-card dan .sipede-charts-card classes
    - Add visual separation dari Excel upload (spacing, divider)
    - Ensure consistent styling dengan existing cards
    - _Requirements: 4.4, 5.1_

- [ ] 7. Final checkpoint and polish
  - [ ] 7.1 Test responsive behavior
    - Test pada desktop (≥1100px): 3 kolom form, 3 kolom charts
    - Test pada tablet (640px-1099px): 2 kolom form, 2 kolom charts
    - Test pada mobile (<640px): 1 kolom stacked
    - _Requirements: 5.2_

  - [ ] 7.2 Verify accessibility
    - Check all inputs have proper labels
    - Check error messages linked via aria-describedby
    - Check keyboard navigation works
    - Check color contrast meets WCAG AA
    - _Requirements: 5.3_

  - [ ] 7.3 Final QA and bug fixes
    - Test all validation rules work correctly
    - Test localStorage persistence across page reloads
    - Test success message auto-dismiss timing
    - Verify no console errors or warnings
    - _Requirements: All_

- [ ] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional dan dapat di-skip untuk faster MVP
- Setiap task reference specific requirements untuk traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples dan edge cases
- Tech stack: Next.js 15, TypeScript, React, Tailwind CSS
- No new dependencies required (kecuali fast-check untuk property tests - optional)
