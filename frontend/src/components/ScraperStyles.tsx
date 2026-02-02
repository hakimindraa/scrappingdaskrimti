export default function ScraperStyles() {
    return (
        <style jsx global>{`
            .scraper-tab {
                padding: 2rem;
            }

            .tab-header {
                text-align: center;
                margin-bottom: 2rem;
            }

            .tab-header h2 {
                font-size: 1.75rem;
                font-weight: 700;
                background: linear-gradient(90deg, #16a34a, #059669);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 0.5rem;
            }

            .spp-theme .tab-header h2 {
                background: linear-gradient(90deg, #f59e0b, #ef4444);
                -webkit-background-clip: text;
                background-clip: text;
            }

            .tab-header p {
                color: #6b8e6b;
            }

            .tab-header .close-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                margin-top: 1rem;
                padding: 0.5rem 1rem;
                background: rgba(220, 38, 38, 0.1);
                border: 1px solid rgba(220, 38, 38, 0.3);
                border-radius: 8px;
                color: #dc2626;
                cursor: pointer;
                transition: all 0.3s;
            }

            .tab-header .close-btn:hover {
                background: rgba(220, 38, 38, 0.2);
            }

            .tab-header .close-btn svg {
                width: 18px;
                height: 18px;
            }

            .main-content {
                max-width: 900px;
                margin: 0 auto;
            }

            /* Step Indicator */
            .step-indicator {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                margin-bottom: 2rem;
                flex-wrap: wrap;
            }

            .step {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 1rem;
                background: #f0f9f0;
                border-radius: 20px;
                opacity: 0.5;
                transition: all 0.3s;
            }

            .step.active {
                opacity: 1;
                background: linear-gradient(135deg, rgba(22, 163, 74, 0.15), rgba(5, 150, 105, 0.15));
                border: 1px solid rgba(22, 163, 74, 0.3);
            }

            .spp-theme .step.active {
                background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.2));
                border: 1px solid rgba(245, 158, 11, 0.3);
            }

            .step.done {
                opacity: 0.8;
                background: rgba(22, 163, 74, 0.15);
            }

            .step-num {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #d4e7d4;
                border-radius: 50%;
                font-size: 0.75rem;
                font-weight: 600;
                color: #1a3a1a;
            }

            .step.active .step-num {
                background: #16a34a;
                color: #fff;
            }

            .spp-theme .step.active .step-num {
                background: #f59e0b;
            }

            .step.done .step-num {
                background: #16a34a;
                color: #fff;
            }

            .step-text {
                font-size: 0.875rem;
            }

            .step-line {
                width: 30px;
                height: 2px;
                background: #d4e7d4;
            }

            /* Error Box */
            .error-box {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 1rem;
                background: rgba(220, 38, 38, 0.08);
                border: 1px solid rgba(220, 38, 38, 0.3);
                border-radius: 10px;
                color: #dc2626;
                margin-bottom: 1.5rem;
            }

            .error-box button {
                margin-left: auto;
                background: none;
                border: none;
                color: #dc2626;
                font-size: 1.25rem;
                cursor: pointer;
            }

            /* Info Box */
            .info-box {
                padding: 1rem;
                background: rgba(22, 163, 74, 0.08);
                border: 1px solid rgba(22, 163, 74, 0.3);
                border-radius: 8px;
                color: #16a34a;
                margin-bottom: 1.5rem;
                font-size: 0.875rem;
            }

            /* Cards */
            .card {
                background: #ffffff;
                border: 1px solid #d4e7d4;
                border-radius: 16px;
                padding: 2rem;
                box-shadow: 0 4px 12px rgba(22, 163, 74, 0.08);
            }

            .main-card {
                text-align: center;
            }

            .card-icon {
                width: 64px;
                height: 64px;
                margin: 0 auto 1.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, rgba(22, 163, 74, 0.15), rgba(5, 150, 105, 0.15));
                border-radius: 50%;
            }

            .card-icon.spp {
                background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.2));
            }

            .card-icon svg {
                width: 32px;
                height: 32px;
                color: #16a34a;
            }

            .card-icon.spp svg {
                color: #f59e0b;
            }

            .card-icon.success {
                background: rgba(22, 163, 74, 0.15);
            }

            .card-icon.success svg {
                color: #16a34a;
            }

            .card-icon.pulse {
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.8; }
            }

            .main-card h2 {
                font-size: 1.5rem;
                margin-bottom: 0.75rem;
                color: #1a3a1a;
            }

            .main-card p {
                color: #6b8e6b;
                margin-bottom: 1.5rem;
            }

            /* Year Badge */
            .year-badge {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1.5rem;
                background: linear-gradient(135deg, rgba(22, 163, 74, 0.15), rgba(5, 150, 105, 0.15));
                border: 1px solid rgba(22, 163, 74, 0.4);
                border-radius: 50px;
                color: #16a34a;
                font-size: 1rem;
                margin-bottom: 1.5rem;
            }

            .year-badge strong {
                font-size: 1.25rem;
                color: #059669;
            }

            /* Year Filter Section */
            .year-filter-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 1.5rem;
                padding: 1.5rem;
                background: linear-gradient(135deg, rgba(22, 163, 74, 0.08), rgba(5, 150, 105, 0.05));
                border: 1px solid rgba(22, 163, 74, 0.2);
                border-radius: 12px;
            }

            .year-filter-label {
                font-size: 0.9rem;
                font-weight: 600;
                color: #1a3a1a;
            }

            .year-select {
                padding: 0.75rem 2rem 0.75rem 1rem;
                font-size: 1.1rem;
                font-weight: 600;
                background: #ffffff;
                border: 2px solid #16a34a;
                border-radius: 10px;
                color: #16a34a;
                cursor: pointer;
                appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2316a34a' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 0.75rem center;
                min-width: 150px;
                text-align: center;
                transition: all 0.3s;
            }

            .year-select:hover {
                background-color: #f0f9f0;
                box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
            }

            .year-select:focus {
                outline: none;
                box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.2);
            }

            .year-select:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            /* Year Filter Inline (for done page) */
            .year-filter-inline {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .year-filter-inline label {
                font-size: 0.875rem;
                color: #6b8e6b;
            }

            .year-select-inline {
                padding: 0.5rem 1.5rem 0.5rem 0.75rem;
                font-size: 0.9rem;
                font-weight: 500;
                background: #ffffff;
                border: 1px solid #d4e7d4;
                border-radius: 8px;
                color: #16a34a;
                cursor: pointer;
                appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%2316a34a' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 0.5rem center;
            }

            .year-select-inline:focus {
                outline: none;
                border-color: #16a34a;
            }

            /* Year Info Text */
            .year-info {
                color: #16a34a;
                font-weight: 500;
                margin-bottom: 0.5rem;
            }

            /* Stats Grid */
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1rem;
                margin-bottom: 1.5rem;
            }

            .stat-card {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 1rem;
                background: #f0f9f0;
                border: 1px solid #d4e7d4;
                border-radius: 12px;
            }

            .stat-card .stat-value {
                font-size: 1.5rem;
                font-weight: 700;
                color: #16a34a;
            }

            .stat-card .stat-label {
                font-size: 0.75rem;
                color: #6b8e6b;
            }

            /* Buttons */
            .primary-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 1rem 2rem;
                background: linear-gradient(135deg, #16a34a, #059669);
                border: none;
                border-radius: 10px;
                color: #fff;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }

            .primary-btn.spp {
                background: linear-gradient(135deg, #f59e0b, #ef4444);
            }

            .primary-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(22, 163, 74, 0.3);
            }

            .primary-btn.spp:hover:not(:disabled) {
                box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
            }

            .primary-btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }

            .primary-btn.success {
                background: linear-gradient(135deg, #16a34a, #059669);
            }

            .primary-btn svg {
                width: 20px;
                height: 20px;
            }

            .secondary-btn, .danger-btn {
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s;
            }

            .secondary-btn {
                background: rgba(22, 163, 74, 0.1);
                border: 1px solid rgba(22, 163, 74, 0.3);
                color: #16a34a;
            }

            .danger-btn {
                background: rgba(220, 38, 38, 0.1);
                border: 1px solid rgba(220, 38, 38, 0.3);
                color: #dc2626;
            }

            .action-row {
                display: flex;
                justify-content: center;
                gap: 1rem;
                flex-wrap: wrap;
            }

            /* Instruction List */
            .instruction-list {
                text-align: left;
                max-width: 500px;
                margin: 0 auto 1.5rem;
                padding-left: 1.5rem;
            }

            .instruction-list li {
                margin-bottom: 0.5rem;
                color: #3d5c3d;
            }

            .instruction-list code {
                background: rgba(22, 163, 74, 0.1);
                padding: 0.125rem 0.5rem;
                border-radius: 4px;
                color: #16a34a;
                font-size: 0.8rem;
            }

            /* URL Display */
            .url-display {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 0.75rem 1rem;
                background: #f0f9f0;
                border-radius: 8px;
                margin-bottom: 1.5rem;
                font-size: 0.875rem;
            }

            .url-label {
                color: #6b8e6b;
            }

            .url-value {
                color: #16a34a;
                word-break: break-all;
            }

            /* Headers Preview */
            .headers-preview {
                margin-bottom: 1.5rem;
                text-align: left;
            }

            .preview-label {
                display: block;
                font-size: 0.875rem;
                color: #6b8e6b;
                margin-bottom: 0.5rem;
            }

            /* Year Filter Section */
            .year-filter-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 1.5rem;
            }

            .year-filter-label {
                font-size: 0.9rem;
                color: #3d5c3d;
                font-weight: 500;
            }

            .year-select {
                padding: 0.75rem 2rem 0.75rem 1rem;
                font-size: 1rem;
                background: #ffffff;
                border: 2px solid #16a34a;
                border-radius: 10px;
                color: #1a3a1a;
                cursor: pointer;
                appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2316a34a' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 0.5rem center;
                background-size: 1.25rem;
                min-width: 150px;
                font-weight: 600;
            }

            .year-select:focus {
                outline: none;
                box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.2);
            }

            .year-select:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .year-filter-inline {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .year-filter-inline label {
                font-size: 0.875rem;
                color: #3d5c3d;
            }

            .year-select-inline {
                padding: 0.5rem 1.5rem 0.5rem 0.75rem;
                font-size: 0.875rem;
                background: #ffffff;
                border: 1px solid #d4e7d4;
                border-radius: 6px;
                color: #1a3a1a;
                cursor: pointer;
                appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2316a34a' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 0.35rem center;
                background-size: 1rem;
            }

            .year-info {
                font-size: 0.9rem;
                color: #16a34a;
                margin-bottom: 0.5rem;
            }

            .headers-list {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
            }

            .header-tag {
                padding: 0.25rem 0.75rem;
                background: rgba(22, 163, 74, 0.1);
                border: 1px solid rgba(22, 163, 74, 0.2);
                border-radius: 4px;
                font-size: 0.75rem;
                color: #16a34a;
            }

            /* Max Pages Input */
            .max-pages-input {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 1rem;
                margin-bottom: 1.5rem;
            }

            .max-pages-input label {
                font-size: 0.875rem;
                color: #6b8e6b;
            }

            .max-pages-input input {
                width: 80px;
                padding: 0.5rem 1rem;
                background: #f0f9f0;
                border: 1px solid #d4e7d4;
                border-radius: 6px;
                color: #1a3a1a;
                text-align: center;
            }

            /* Scraping Status Detail */
            .scraping-status-detail {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
                padding: 0.75rem 1.5rem;
                margin: 1rem 0;
                background: rgba(22, 163, 74, 0.1);
                border: 1px solid rgba(22, 163, 74, 0.3);
                border-radius: 10px;
                font-size: 0.9rem;
                color: #166534;
                animation: fadeIn 0.3s ease-in-out;
            }

            .scraping-status-detail.navigating {
                background: rgba(59, 130, 246, 0.1);
                border-color: rgba(59, 130, 246, 0.3);
                color: #1d4ed8;
            }

            .scraping-status-detail.waiting {
                background: rgba(245, 158, 11, 0.1);
                border-color: rgba(245, 158, 11, 0.3);
                color: #b45309;
            }

            .scraping-status-detail.scraping {
                background: rgba(22, 163, 74, 0.1);
                border-color: rgba(22, 163, 74, 0.3);
                color: #166534;
            }

            .scraping-status-detail .status-icon {
                font-size: 1.25rem;
            }

            .scraping-status-detail .status-text {
                font-weight: 500;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-5px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* Progress Stats */
            .progress-stats, .summary-stats {
                display: flex;
                justify-content: center;
                gap: 2rem;
                margin: 1.5rem 0;
            }

            .stat {
                text-align: center;
            }

            .stat-value {
                display: block;
                font-size: 2rem;
                font-weight: 700;
                color: #1a3a1a;
            }

            .stat-value.highlight {
                color: #16a34a;
            }

            .stat-value.highlight.spp {
                color: #f59e0b;
            }

            .stat-label {
                font-size: 0.75rem;
                color: #6b8e6b;
                text-transform: uppercase;
            }

            /* Progress Bar */
            .progress-bar-container {
                height: 6px;
                background: #d4e7d4;
                border-radius: 3px;
                overflow: hidden;
            }

            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #16a34a, #059669);
                border-radius: 3px;
            }

            .progress-bar.spp {
                background: linear-gradient(90deg, #f59e0b, #ef4444);
            }

            .progress-bar.indeterminate {
                width: 30%;
                animation: indeterminate 1.5s infinite ease-in-out;
            }

            @keyframes indeterminate {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(400%); }
            }

            /* Data Section */
            .data-section {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }

            .summary-card {
                background: rgba(22, 163, 74, 0.08);
                border: 1px solid rgba(22, 163, 74, 0.3);
                border-radius: 12px;
                padding: 1.5rem;
                text-align: center;
            }

            .summary-card.spp {
                background: rgba(245, 158, 11, 0.1);
                border-color: rgba(245, 158, 11, 0.3);
            }

            .summary-card h3 {
                font-size: 1.25rem;
                color: #16a34a;
                margin-bottom: 1rem;
            }

            .summary-card.spp h3 {
                color: #f59e0b;
            }

            /* Data Toolbar */
            .data-toolbar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 1rem;
            }

            .search-form {
                display: flex;
                gap: 0.5rem;
            }

            .search-form input {
                padding: 0.625rem 1rem;
                width: 250px;
                background: #f0f9f0;
                border: 1px solid #d4e7d4;
                border-radius: 8px;
                color: #1a3a1a;
            }

            .search-form button {
                padding: 0.625rem 1rem;
                background: rgba(22, 163, 74, 0.15);
                border: 1px solid rgba(22, 163, 74, 0.3);
                border-radius: 8px;
                color: #16a34a;
                cursor: pointer;
            }

            .export-buttons {
                display: flex;
                gap: 0.5rem;
            }

            .export-btn {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.625rem 1rem;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 500;
                transition: all 0.3s;
            }

            .export-btn.csv {
                background: rgba(22, 163, 74, 0.15);
                border: 1px solid rgba(22, 163, 74, 0.3);
                color: #16a34a;
            }

            .export-btn.json {
                background: rgba(245, 158, 11, 0.15);
                border: 1px solid rgba(245, 158, 11, 0.3);
                color: #d97706;
            }

            /* Table */
            .table-container {
                background: #ffffff;
                border: 1px solid #d4e7d4;
                border-radius: 12px;
                overflow-x: auto;
            }

            .loading-state, .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 3rem;
                color: #6b8e6b;
            }

            .data-table {
                width: 100%;
                border-collapse: collapse;
                min-width: 600px;
            }

            .data-table th {
                padding: 1rem;
                background: rgba(22, 163, 74, 0.08);
                color: #16a34a;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                text-align: left;
                border-bottom: 1px solid #d4e7d4;
                white-space: nowrap;
            }

            .data-table td {
                padding: 0.75rem 1rem;
                border-bottom: 1px solid #e8f5e8;
                font-size: 0.875rem;
                color: #1a3a1a;
            }

            .data-table tr:hover {
                background: #f0f9f0;
            }

            /* Pagination */
            .pagination {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 1rem;
            }

            .page-btn {
                padding: 0.5rem 1rem;
                background: #f0f9f0;
                border: 1px solid #d4e7d4;
                border-radius: 6px;
                color: #1a3a1a;
                cursor: pointer;
            }

            .page-btn:hover:not(:disabled) {
                background: rgba(22, 163, 74, 0.15);
            }

            .page-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .page-info {
                font-size: 0.875rem;
                color: #6b8e6b;
            }

            /* Action Buttons */
            .action-buttons {
                display: flex;
                justify-content: center;
                gap: 1rem;
                flex-wrap: wrap;
            }

            /* Spinner */
            .spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid rgba(22, 163, 74, 0.3);
                border-top-color: #16a34a;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            }

            .spinner.large {
                width: 32px;
                height: 32px;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            @media (max-width: 768px) {
                .scraper-tab {
                    padding: 1rem;
                }

                .step-indicator {
                    gap: 0.25rem;
                }
                
                .step-text {
                    display: none;
                }

                .step-line {
                    width: 20px;
                }

                .stats-grid {
                    grid-template-columns: repeat(3, 1fr);
                }

                .progress-stats, .summary-stats {
                    gap: 1rem;
                }

                .stat-value {
                    font-size: 1.5rem;
                }

                .search-form input {
                    width: 150px;
                }
            }
        `}</style>
    );
}
