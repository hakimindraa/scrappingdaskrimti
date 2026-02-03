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
                color: #064e3b;
                margin-bottom: 0.5rem;
            }

            .spp-theme .tab-header h2 {
                color: #064e3b;
            }

            .tab-header p {
                color: #64748b;
            }

            .tab-header .close-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                margin-top: 1rem;
                padding: 0.5rem 1rem;
                background: rgba(220, 38, 38, 0.08);
                border: 1px solid rgba(220, 38, 38, 0.25);
                border-radius: 10px;
                color: #dc2626;
                cursor: pointer;
                transition: all 0.25s;
            }

            .tab-header .close-btn:hover {
                background: rgba(220, 38, 38, 0.15);
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
                padding: 0.625rem 1.25rem;
                background: #f8faf9;
                border: 1px solid #e2e8f0;
                border-radius: 50px;
                opacity: 0.5;
                transition: all 0.3s;
            }

            .step.active {
                opacity: 1;
                background: linear-gradient(135deg, rgba(6, 78, 59, 0.1), rgba(16, 185, 129, 0.1));
                border: 1px solid rgba(6, 78, 59, 0.3);
            }

            .spp-theme .step.active {
                background: linear-gradient(135deg, rgba(6, 78, 59, 0.1), rgba(16, 185, 129, 0.1));
                border: 1px solid rgba(6, 78, 59, 0.3);
            }

            .step.done {
                opacity: 0.85;
                background: rgba(16, 185, 129, 0.1);
            }

            .step-num {
                width: 26px;
                height: 26px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #e2e8f0;
                border-radius: 50%;
                font-size: 0.8rem;
                font-weight: 600;
                color: #64748b;
            }

            .step.active .step-num {
                background: linear-gradient(135deg, #064e3b, #065f46);
                color: #fff;
            }

            .spp-theme .step.active .step-num {
                background: linear-gradient(135deg, #064e3b, #065f46);
            }

            .step.done .step-num {
                background: #10b981;
                color: #fff;
            }

            .step-text {
                font-size: 0.875rem;
                font-weight: 500;
                color: #475569;
            }

            .step.active .step-text {
                color: #064e3b;
            }

            .step-line {
                width: 30px;
                height: 2px;
                background: #e2e8f0;
            }

            /* Error Box */
            .error-box {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 1rem 1.25rem;
                background: rgba(220, 38, 38, 0.06);
                border: 1px solid rgba(220, 38, 38, 0.2);
                border-radius: 12px;
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
                padding: 1rem 1.25rem;
                background: rgba(6, 78, 59, 0.06);
                border: 1px solid rgba(6, 78, 59, 0.2);
                border-radius: 12px;
                color: #064e3b;
                margin-bottom: 1.5rem;
                font-size: 0.9rem;
            }

            /* Cards */
            .card {
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 20px;
                padding: 2rem;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
            }

            .main-card {
                text-align: center;
            }

            .card-icon {
                width: 72px;
                height: 72px;
                margin: 0 auto 1.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, rgba(6, 78, 59, 0.1), rgba(16, 185, 129, 0.1));
                border-radius: 20px;
            }

            .card-icon.spp {
                background: linear-gradient(135deg, rgba(6, 78, 59, 0.15), rgba(16, 185, 129, 0.15));
            }

            .card-icon svg {
                width: 36px;
                height: 36px;
                color: #064e3b;
            }

            .card-icon.spp svg {
                color: #065f46;
            }

            .card-icon.success {
                background: rgba(16, 185, 129, 0.15);
            }

            .card-icon.success svg {
                color: #10b981;
            }

            .card-icon.pulse {
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.85; }
            }

            .main-card h2 {
                font-size: 1.5rem;
                margin-bottom: 0.75rem;
                color: #1e293b;
            }

            .main-card p {
                color: #64748b;
                margin-bottom: 1.5rem;
            }

            /* Year Badge */
            .year-badge {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1.5rem;
                background: linear-gradient(135deg, rgba(6, 78, 59, 0.08), rgba(16, 185, 129, 0.08));
                border: 1px solid rgba(6, 78, 59, 0.2);
                border-radius: 50px;
                color: #064e3b;
                font-size: 1rem;
                margin-bottom: 1.5rem;
            }

            .year-badge strong {
                font-size: 1.25rem;
                color: #065f46;
            }

            /* Year Filter Section */
            .year-filter-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 1.5rem;
                padding: 1.5rem;
                background: linear-gradient(135deg, rgba(6, 78, 59, 0.04), rgba(16, 185, 129, 0.04));
                border: 1px solid rgba(6, 78, 59, 0.12);
                border-radius: 16px;
            }

            .year-filter-label {
                font-size: 0.9rem;
                font-weight: 600;
                color: #1e293b;
            }

            .year-select {
                padding: 0.75rem 2.5rem 0.75rem 1.25rem;
                font-size: 1.1rem;
                font-weight: 600;
                background: #ffffff;
                border: 2px solid #064e3b;
                border-radius: 12px;
                color: #064e3b;
                cursor: pointer;
                appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23064e3b' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 0.875rem center;
                min-width: 150px;
                text-align: center;
                transition: all 0.25s;
            }

            .year-select:hover {
                background-color: #f8faf9;
                box-shadow: 0 4px 16px rgba(6, 78, 59, 0.15);
            }

            .year-select:focus {
                outline: none;
                box-shadow: 0 0 0 3px rgba(6, 78, 59, 0.15);
            }

            .year-select:disabled {
                opacity: 0.5;
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
                color: #64748b;
            }

            .year-select-inline {
                padding: 0.5rem 1.75rem 0.5rem 0.875rem;
                font-size: 0.9rem;
                font-weight: 500;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                color: #064e3b;
                cursor: pointer;
                appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%23064e3b' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 0.5rem center;
            }

            .year-select-inline:focus {
                outline: none;
                border-color: #064e3b;
            }

            /* Year Info Text */
            .year-info {
                color: #065f46;
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
                padding: 1.25rem;
                background: #f8faf9;
                border: 1px solid #e2e8f0;
                border-radius: 14px;
            }

            .stat-card .stat-value {
                font-size: 1.75rem;
                font-weight: 700;
                color: #064e3b;
            }

            .stat-card .stat-label {
                font-size: 0.75rem;
                color: #64748b;
                margin-top: 0.25rem;
            }

            /* Buttons */
            .primary-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 1rem 2rem;
                background: linear-gradient(135deg, #064e3b, #065f46);
                border: none;
                border-radius: 14px;
                color: #fff;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.25s;
            }

            .primary-btn.spp {
                background: linear-gradient(135deg, #064e3b, #047857);
            }

            .primary-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(6, 78, 59, 0.35);
            }

            .primary-btn.spp:hover:not(:disabled) {
                box-shadow: 0 8px 24px rgba(6, 78, 59, 0.35);
            }

            .primary-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .primary-btn.success {
                background: linear-gradient(135deg, #10b981, #059669);
            }

            .primary-btn svg {
                width: 20px;
                height: 20px;
            }

            .secondary-btn, .danger-btn {
                padding: 0.75rem 1.5rem;
                border-radius: 10px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.25s;
            }

            .secondary-btn {
                background: rgba(6, 78, 59, 0.08);
                border: 1px solid rgba(6, 78, 59, 0.2);
                color: #064e3b;
            }

            .secondary-btn:hover {
                background: rgba(6, 78, 59, 0.12);
            }

            .danger-btn {
                background: rgba(220, 38, 38, 0.08);
                border: 1px solid rgba(220, 38, 38, 0.2);
                color: #dc2626;
            }

            .danger-btn:hover {
                background: rgba(220, 38, 38, 0.12);
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
                color: #475569;
            }

            .instruction-list code {
                background: rgba(6, 78, 59, 0.08);
                padding: 0.125rem 0.5rem;
                border-radius: 6px;
                color: #064e3b;
                font-size: 0.8rem;
            }

            /* URL Display */
            .url-display {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 0.75rem 1.25rem;
                background: #f8faf9;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                margin-bottom: 1.5rem;
                font-size: 0.875rem;
            }

            .url-label {
                color: #64748b;
            }

            .url-value {
                color: #064e3b;
                word-break: break-all;
                font-weight: 500;
            }

            /* Headers Preview */
            .headers-preview {
                margin-bottom: 1.5rem;
                text-align: left;
            }

            .preview-label {
                display: block;
                font-size: 0.875rem;
                color: #64748b;
                margin-bottom: 0.5rem;
            }

            .headers-list {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
            }

            .header-tag {
                padding: 0.375rem 0.875rem;
                background: rgba(6, 78, 59, 0.08);
                border: 1px solid rgba(6, 78, 59, 0.15);
                border-radius: 8px;
                font-size: 0.8rem;
                color: #064e3b;
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
                color: #64748b;
            }

            .max-pages-input input {
                width: 90px;
                padding: 0.625rem 1rem;
                background: #f8faf9;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                color: #1e293b;
                text-align: center;
                font-weight: 500;
            }

            .max-pages-input input:focus {
                outline: none;
                border-color: #064e3b;
            }

            /* Scraping Status Detail */
            .scraping-status-detail {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
                padding: 0.875rem 1.5rem;
                margin: 1rem 0;
                background: rgba(6, 78, 59, 0.08);
                border: 1px solid rgba(6, 78, 59, 0.2);
                border-radius: 12px;
                font-size: 0.9rem;
                color: #064e3b;
                animation: fadeIn 0.3s ease-in-out;
            }

            .scraping-status-detail.navigating {
                background: rgba(59, 130, 246, 0.08);
                border-color: rgba(59, 130, 246, 0.25);
                color: #1d4ed8;
            }

            .scraping-status-detail.waiting {
                background: rgba(245, 158, 11, 0.08);
                border-color: rgba(245, 158, 11, 0.25);
                color: #b45309;
            }

            .scraping-status-detail.scraping {
                background: rgba(16, 185, 129, 0.08);
                border-color: rgba(16, 185, 129, 0.25);
                color: #059669;
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
                gap: 2.5rem;
                margin: 1.5rem 0;
            }

            .stat {
                text-align: center;
            }

            .stat-value {
                display: block;
                font-size: 2rem;
                font-weight: 700;
                color: #1e293b;
            }

            .stat-value.highlight {
                color: #064e3b;
            }

            .stat-value.highlight.spp {
                color: #065f46;
            }

            .stat-label {
                font-size: 0.75rem;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            /* Progress Bar */
            .progress-bar-container {
                height: 10px;
                background: #e2e8f0;
                border-radius: 5px;
                overflow: hidden;
            }

            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #064e3b, #10b981);
                border-radius: 5px;
                transition: width 0.5s ease;
            }

            .progress-bar.spp {
                background: linear-gradient(90deg, #064e3b, #10b981);
            }

            .progress-bar.indeterminate {
                width: 30%;
                animation: indeterminate 1.5s infinite ease-in-out;
            }

            @keyframes indeterminate {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(400%); }
            }

            /* Scraping Progress Section - New Big Progress Bar */
            .scraping-progress-section {
                background: white;
                border: 2px solid #a7f3d0;
                border-radius: 16px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
            }

            .progress-header-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }

            .progress-label {
                font-size: 0.9rem;
                font-weight: 600;
                color: #064e3b;
            }

            .progress-percentage {
                font-size: 2.5rem;
                font-weight: 800;
                color: #064e3b;
                font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
                line-height: 1;
            }

            .progress-track {
                height: 16px;
                background: #e2e8f0;
                border-radius: 8px;
                overflow: hidden;
                position: relative;
                margin-bottom: 0.75rem;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #064e3b, #059669, #10b981);
                border-radius: 8px;
                transition: width 0.5s ease-out;
                position: relative;
                overflow: hidden;
                min-width: 0;
            }

            .progress-shine {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(
                    90deg,
                    transparent 0%,
                    rgba(255, 255, 255, 0.5) 50%,
                    transparent 100%
                );
                animation: shine-effect 1.5s infinite;
            }

            @keyframes shine-effect {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            .progress-footer-row {
                display: flex;
                justify-content: space-between;
                font-size: 0.8rem;
                color: #64748b;
            }

            /* Data Section */
            .data-section {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }

            .summary-card {
                background: rgba(6, 78, 59, 0.04);
                border: 1px solid rgba(6, 78, 59, 0.15);
                border-radius: 16px;
                padding: 1.5rem;
                text-align: center;
            }

            .summary-card.spp {
                background: rgba(6, 78, 59, 0.06);
                border-color: rgba(6, 78, 59, 0.2);
            }

            .summary-card h3 {
                font-size: 1.25rem;
                color: #064e3b;
                margin-bottom: 1rem;
            }

            .summary-card.spp h3 {
                color: #065f46;
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
                padding: 0.75rem 1rem;
                width: 260px;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                color: #1e293b;
            }

            .search-form input:focus {
                outline: none;
                border-color: #064e3b;
            }

            .search-form button {
                padding: 0.75rem 1.25rem;
                background: rgba(6, 78, 59, 0.1);
                border: 1px solid rgba(6, 78, 59, 0.2);
                border-radius: 10px;
                color: #064e3b;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s;
            }

            .search-form button:hover {
                background: rgba(6, 78, 59, 0.15);
            }

            .export-buttons {
                display: flex;
                gap: 0.5rem;
            }

            .export-btn {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1.25rem;
                border-radius: 10px;
                text-decoration: none;
                font-weight: 500;
                transition: all 0.25s;
            }

            .export-btn.csv {
                background: linear-gradient(135deg, #064e3b, #065f46);
                border: none;
                color: white;
            }

            .export-btn.csv:hover {
                box-shadow: 0 4px 16px rgba(6, 78, 59, 0.35);
                transform: translateY(-1px);
            }

            .export-btn.json {
                background: rgba(6, 78, 59, 0.08);
                border: 1px solid rgba(6, 78, 59, 0.2);
                color: #064e3b;
            }

            .export-btn.json:hover {
                background: rgba(6, 78, 59, 0.12);
            }

            /* Table */
            .table-container {
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                overflow-x: auto;
            }

            .loading-state, .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 3rem;
                color: #64748b;
            }

            .data-table {
                width: 100%;
                border-collapse: collapse;
                min-width: 600px;
            }

            .data-table th {
                padding: 1rem 1.25rem;
                background: linear-gradient(135deg, rgba(6, 78, 59, 0.06), rgba(16, 185, 129, 0.04));
                color: #064e3b;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                text-align: left;
                border-bottom: 1px solid #e2e8f0;
                white-space: nowrap;
            }

            .data-table td {
                padding: 0.875rem 1.25rem;
                border-bottom: 1px solid #f1f5f9;
                font-size: 0.875rem;
                color: #334155;
            }

            .data-table tr:hover {
                background: #f8faf9;
            }

            .data-table tr:last-child td {
                border-bottom: none;
            }

            /* Pagination */
            .pagination {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 1rem;
            }

            .page-btn {
                padding: 0.625rem 1.25rem;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                color: #1e293b;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s;
            }

            .page-btn:hover:not(:disabled) {
                background: #f8faf9;
                border-color: #064e3b;
                color: #064e3b;
            }

            .page-btn:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }

            .page-info {
                font-size: 0.875rem;
                color: #64748b;
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
                width: 18px;
                height: 18px;
                border: 2px solid rgba(6, 78, 59, 0.2);
                border-top-color: #064e3b;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            }

            .spinner.large {
                width: 36px;
                height: 36px;
                border-width: 3px;
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
                    gap: 1.25rem;
                }

                .stat-value {
                    font-size: 1.5rem;
                }

                .search-form input {
                    width: 160px;
                }

                .card {
                    padding: 1.5rem;
                }
            }
        `}</style>
    );
}
