# Requirements Document

## Introduction

This document specifies requirements for the Manual SIPEDE User Statistics Input feature. The feature enables users to manually input SIPEDE (Sistem Informasi Pegawai Daerah) employee statistics and visualize the data in three separate charts within the Insight dashboard. The feature operates independently from the existing Excel upload functionality for incoming/outgoing mail and stores data locally in the browser.

## Glossary

- **SIPEDE_Input_Form**: The user interface component that accepts manual input of SIPEDE user statistics
- **Status_Chart**: The visualization component that displays employee status (Active vs Inactive) as a chart
- **Registration_Chart**: The visualization component that displays SIPEDE registration status (Registered vs Not Registered) as a chart
- **Esign_Chart**: The visualization component that displays E-sign registration status (Registered vs Not Registered) as a chart
- **LocalStorage_Manager**: The service responsible for persisting and retrieving SIPEDE statistics data from browser localStorage
- **Insight_Dashboard**: The existing dashboard component (InsightTab) where the SIPEDE feature will be integrated
- **Status_Aktif**: The count of employees with active employment status
- **Status_Tidak_Aktif**: The count of employees with inactive employment status
- **Tercatat_SIPEDE**: The count of employees registered in the SIPEDE system
- **Tidak_Tercatat_SIPEDE**: The count of employees not registered in the SIPEDE system
- **Terdaftar_Esign**: The count of employees registered in the E-sign system
- **Tidak_Terdaftar_Esign**: The count of employees not registered in the E-sign system

## Requirements

### Requirement 1: Manual Input Form

**User Story:** As a dashboard user, I want to manually input SIPEDE user statistics, so that I can track employee status and registration data without uploading Excel files.

#### Acceptance Criteria

1. THE SIPEDE_Input_Form SHALL display six numeric input fields: Status_Aktif, Status_Tidak_Aktif, Tercatat_SIPEDE, Tidak_Tercatat_SIPEDE, Terdaftar_Esign, and Tidak_Terdaftar_Esign
2. WHEN a user enters a non-numeric value, THE SIPEDE_Input_Form SHALL reject the input and display a validation error
3. WHEN a user enters a negative number, THE SIPEDE_Input_Form SHALL reject the input and display a validation error
4. THE SIPEDE_Input_Form SHALL include a submit button to save the entered statistics
5. THE SIPEDE_Input_Form SHALL be visually separated from the existing Excel upload feature in the Insight_Dashboard

### Requirement 2: Data Persistence

**User Story:** As a dashboard user, I want my SIPEDE statistics to persist across browser sessions, so that I don't have to re-enter the data each time I visit the dashboard.

#### Acceptance Criteria

1. WHEN a user submits valid SIPEDE statistics, THE LocalStorage_Manager SHALL store the data in browser localStorage
2. WHEN the Insight_Dashboard loads, THE LocalStorage_Manager SHALL retrieve previously saved SIPEDE statistics from localStorage
3. IF no saved data exists in localStorage, THEN THE LocalStorage_Manager SHALL return the default values
4. THE LocalStorage_Manager SHALL serialize SIPEDE statistics as JSON before storing
5. THE LocalStorage_Manager SHALL deserialize JSON data when retrieving SIPEDE statistics

### Requirement 3: Data Visualization

**User Story:** As a dashboard user, I want to see SIPEDE user statistics in three separate charts, so that I can quickly understand the distribution of employee status, SIPEDE registration, and E-sign registration.

#### Acceptance Criteria

1. THE Status_Chart SHALL display a chart visualizing Status_Aktif and Status_Tidak_Aktif data
2. THE Registration_Chart SHALL display a chart visualizing Tercatat_SIPEDE and Tidak_Tercatat_SIPEDE data
3. THE Esign_Chart SHALL display a chart visualizing Terdaftar_Esign and Tidak_Terdaftar_Esign data
4. THE charts SHALL use the Recharts library for rendering
5. THE charts SHALL display labels showing the category name and count for each segment
6. THE charts SHALL use distinct colors for each segment to ensure visual clarity
7. WHEN SIPEDE statistics are updated, THE charts SHALL re-render with the new data in real-time
8. THE charts SHALL be positioned in the Insight_Dashboard to maintain visual hierarchy and readability

### Requirement 4: Integration with Insight Dashboard

**User Story:** As a dashboard user, I want the SIPEDE input feature to be part of the Insight dashboard, so that I can access all statistics features in one place.

#### Acceptance Criteria

1. THE Insight_Dashboard SHALL display the SIPEDE_Input_Form as a separate section from the Excel upload feature for incoming/outgoing mail
2. THE Insight_Dashboard SHALL display all three charts (Status_Chart, Registration_Chart, and Esign_Chart) in the same view
3. THE Insight_Dashboard SHALL maintain the existing Excel upload functionality for incoming/outgoing mail without modification
4. THE Insight_Dashboard SHALL render both SIPEDE user statistics features and Excel upload features simultaneously
5. THE Insight_Dashboard SHALL organize the layout to clearly distinguish between SIPEDE user statistics and mail statistics features

### Requirement 5: Type Safety

**User Story:** As a developer, I want TypeScript type definitions for SIPEDE user statistics, so that I can prevent type-related bugs and improve code maintainability.

#### Acceptance Criteria

1. THE system SHALL define a TypeScript interface for SIPEDE user statistics containing all six numeric fields
2. THE SIPEDE_Input_Form SHALL use the defined TypeScript types for all props and state
3. THE LocalStorage_Manager SHALL use the defined TypeScript types for all function parameters and return values
4. THE Status_Chart, Registration_Chart, and Esign_Chart SHALL use the defined TypeScript types for all props

### Requirement 6: User Feedback

**User Story:** As a dashboard user, I want to receive confirmation when I save SIPEDE statistics, so that I know my data has been stored successfully.

#### Acceptance Criteria

1. WHEN a user successfully submits SIPEDE statistics, THE SIPEDE_Input_Form SHALL display a success message
2. WHEN a user submits invalid data, THE SIPEDE_Input_Form SHALL display specific error messages indicating which fields are invalid
3. THE success message SHALL automatically dismiss after 3 seconds
4. THE error messages SHALL remain visible until the user corrects the invalid input

### Requirement 7: Data Update Capability

**User Story:** As a dashboard user, I want to update previously saved SIPEDE user statistics, so that I can keep the data current as employee status and registration changes.

#### Acceptance Criteria

1. WHEN the Insight_Dashboard loads with existing saved data, THE SIPEDE_Input_Form SHALL populate all six fields with the saved values
2. WHEN a user modifies any field and submits, THE LocalStorage_Manager SHALL overwrite the previous data with the new values
3. THE Status_Chart, Registration_Chart, and Esign_Chart SHALL update immediately after new data is saved
4. FOR ALL valid SIPEDE statistics objects, saving then loading SHALL produce equivalent data (round-trip property)
