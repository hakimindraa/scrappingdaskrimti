export default function ScraperStyles() {
    return (
        <style jsx global>{`
            .scraper-tab {
                padding: 2rem;
                background: linear-gradient(180deg, #f0fdf4 0%, #f8fafc 40%);
                min-height: calc(100vh - 80px);
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
                border-radius: 24px;
                padding: 2rem;
                box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
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
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
                transition: all 0.2s;
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

            /* Page Range Input */
            .page-range-input {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 1.5rem;
                padding: 1rem 1.5rem;
                background: linear-gradient(135deg, rgba(6, 78, 59, 0.04), rgba(16, 185, 129, 0.04));
                border: 1px solid rgba(6, 78, 59, 0.12);
                border-radius: 12px;
            }

            .page-range-input label {
                font-size: 0.875rem;
                color: #64748b;
                font-weight: 500;
            }

            .range-inputs {
                display: flex;
                align-items: center;
                gap: 1rem;
                flex-wrap: wrap;
                justify-content: center;
            }

            .range-field {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .range-field span {
                font-size: 0.875rem;
                color: #475569;
            }

            .range-field input {
                width: 80px;
                padding: 0.625rem 0.75rem;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                color: #1e293b;
                text-align: center;
                font-weight: 500;
                transition: border-color 0.2s;
            }

            .range-field input:focus {
                outline: none;
                border-color: #064e3b;
                box-shadow: 0 0 0 3px rgba(6, 78, 59, 0.1);
            }

            .range-hint {
                font-size: 0.75rem;
                color: #94a3b8;
            }

            /* Keep old max-pages-input for backwards compatibility */
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

            /* New Scraping Button */
            .new-scrape-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                margin-top: 1.25rem;
                padding: 0.75rem 1.5rem;
                background: linear-gradient(135deg, #064e3b, #065f46);
                border: none;
                border-radius: 10px;
                color: #ffffff;
                font-size: 0.9rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.25s;
            }

            .new-scrape-btn:hover:not(:disabled) {
                background: linear-gradient(135deg, #065f46, #047857);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(6, 78, 59, 0.3);
            }

            .new-scrape-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .new-scrape-btn.spp {
                background: linear-gradient(135deg, #065f46, #047857);
            }

            .new-scrape-btn.spp:hover:not(:disabled) {
                background: linear-gradient(135deg, #047857, #059669);
            }

            .new-scrape-btn svg {
                width: 18px;
                height: 18px;
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
                border-radius: 20px;
                overflow-x: auto;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
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
                background: #f0fdf4;
                color: #064e3b;
                font-size: 0.75rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                text-align: left;
                border-bottom: 2px solid #d1fae5;
                white-space: nowrap;
            }

            .data-table td {
                padding: 0.875rem 1.25rem;
                border-bottom: 1px solid #f1f5f9;
                font-size: 0.875rem;
                color: #334155;
            }

            .data-table tr:hover {
                background: #f0fdf4;
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
                border: 1.5px solid #e2e8f0;
                border-radius: 12px;
                color: #1e293b;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.2s;
            }

            .page-btn:hover:not(:disabled) {
                background: #f0fdf4;
                border-color: #a7f3d0;
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

            /* Scraping History Section */
            .scraping-history-section {
                grid-column: 1;
                background: linear-gradient(135deg, #ffffff 0%, #f8faf9 100%);
            }

            .scraping-history-section .section-header h2 {
                display: flex;
                align-items: center;
                gap: 0.625rem;
                font-size: 1.1rem;
                font-weight: 700;
                color: #1e293b;
            }

            .scraping-history-section .section-header h2 svg {
                width: 20px;
                height: 20px;
                color: #10b981;
            }

            .scraping-history-list {
                display: flex;
                flex-direction: column;
                gap: 0.875rem;
                max-height: 420px;
                overflow-y: auto;
                padding: 0.25rem;
                padding-right: 0.5rem;
            }

            .scraping-history-list::-webkit-scrollbar {
                width: 6px;
            }

            .scraping-history-list::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 3px;
            }

            .scraping-history-list::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 3px;
            }

            .scraping-history-list::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
            }

            .history-item {
                display: flex;
                align-items: flex-start;
                gap: 1rem;
                padding: 1rem 1.25rem;
                background: linear-gradient(135deg, #ffffff 0%, #f8faf9 100%);
                border: 1px solid #e2e8f0;
                border-radius: 14px;
                transition: all 0.25s ease;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
            }

            .history-item:hover {
                background: linear-gradient(135deg, #f8faf9 0%, #f1f5f9 100%);
                border-color: #cbd5e1;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
                transform: translateY(-1px);
            }

            .history-item.success {
                border-left: 4px solid #10b981;
                background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
            }

            .history-item.error {
                border-left: 4px solid #ef4444;
                background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
            }

            .history-item.warning {
                border-left: 4px solid #f59e0b;
                background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
            }

            .history-item.info {
                border-left: 4px solid #3b82f6;
                background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
            }

            .history-icon {
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 10px;
                flex-shrink: 0;
                font-size: 1rem;
            }

            .history-icon svg {
                width: 18px;
                height: 18px;
            }

            .history-item.success .history-icon {
                background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
                color: #059669;
                box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);
            }

            .history-item.error .history-icon {
                background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
                color: #dc2626;
                box-shadow: 0 2px 6px rgba(239, 68, 68, 0.2);
            }

            .history-item.warning .history-icon {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                color: #d97706;
                box-shadow: 0 2px 6px rgba(245, 158, 11, 0.2);
            }

            .history-item.info .history-icon {
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                color: #2563eb;
                box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
            }

            .history-content {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .history-message {
                font-size: 0.9rem;
                color: #1e293b;
                font-weight: 600;
                line-height: 1.5;
                letter-spacing: -0.01em;
            }

            .history-meta {
                display: flex;
                align-items: center;
                gap: 0.625rem;
                font-size: 0.8rem;
                color: #64748b;
            }

            .history-source {
                font-weight: 600;
                color: #047857;
                background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
                padding: 0.25rem 0.625rem;
                border-radius: 6px;
                font-size: 0.75rem;
                letter-spacing: 0.02em;
            }

            .history-meta .history-separator {
                width: 4px;
                height: 4px;
                background: #cbd5e1;
                border-radius: 50%;
            }

            .history-time {
                color: #94a3b8;
                font-size: 0.8rem;
                display: flex;
                align-items: center;
                gap: 0.375rem;
            }

            .history-time::before {
                content: '•';
                color: #cbd5e1;
                font-size: 0.5rem;
            }

            .empty-history {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 3rem 2rem;
                text-align: center;
                color: #94a3b8;
                background: linear-gradient(135deg, #f8faf9 0%, #f1f5f9 100%);
                border-radius: 12px;
                border: 2px dashed #e2e8f0;
            }

            .empty-history .empty-icon {
                width: 48px;
                height: 48px;
                margin-bottom: 1rem;
                opacity: 0.5;
                flex-shrink: 0;
            }

            .empty-history span {
                font-size: 1rem;
                font-weight: 600;
                color: #64748b;
                margin-bottom: 0.25rem;
            }

            .empty-history p {
                font-size: 0.85rem;
                color: #94a3b8;
            }

            .clear-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 1rem;
                background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                border: 1px solid rgba(239, 68, 68, 0.25);
                border-radius: 8px;
                color: #dc2626;
                font-size: 0.8rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.25s ease;
                box-shadow: 0 1px 3px rgba(239, 68, 68, 0.1);
            }

            .clear-btn:hover {
                background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
                border-color: rgba(239, 68, 68, 0.4);
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
                transform: translateY(-1px);
            }

            .clear-btn svg {
                width: 14px;
                height: 14px;
            }

            .clear-btn:hover {
                background: rgba(239, 68, 68, 0.15);
                border-color: rgba(239, 68, 68, 0.3);
            }

            .clear-btn svg {
                width: 16px;
                height: 16px;
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

                .scraping-history-list {
                    max-height: 300px;
                }

                .history-item {
                    padding: 0.875rem 1rem;
                    gap: 0.75rem;
                }

                .history-icon {
                    width: 32px;
                    height: 32px;
                }

                .history-icon svg {
                    width: 16px;
                    height: 16px;
                }

                .history-message {
                    font-size: 0.85rem;
                }

                .history-meta {
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .history-source {
                    font-size: 0.7rem;
                }

                .history-time {
                    font-size: 0.75rem;
                }
                    gap: 0.5rem;
                }
            }
        `}</style>
    );
}
