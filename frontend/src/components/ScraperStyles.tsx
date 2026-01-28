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
                background: linear-gradient(90deg, #00d4ff, #7b2cbf);
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
                color: #888;
            }

            .tab-header .close-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                margin-top: 1rem;
                padding: 0.5rem 1rem;
                background: rgba(239, 68, 68, 0.2);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 8px;
                color: #f87171;
                cursor: pointer;
                transition: all 0.3s;
            }

            .tab-header .close-btn:hover {
                background: rgba(239, 68, 68, 0.3);
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
                background: rgba(255, 255, 255, 0.05);
                border-radius: 20px;
                opacity: 0.5;
                transition: all 0.3s;
            }

            .step.active {
                opacity: 1;
                background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(123, 44, 191, 0.2));
                border: 1px solid rgba(0, 212, 255, 0.3);
            }

            .spp-theme .step.active {
                background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.2));
                border: 1px solid rgba(245, 158, 11, 0.3);
            }

            .step.done {
                opacity: 0.8;
                background: rgba(16, 185, 129, 0.2);
            }

            .step-num {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                font-size: 0.75rem;
                font-weight: 600;
            }

            .step.active .step-num {
                background: #00d4ff;
                color: #000;
            }

            .spp-theme .step.active .step-num {
                background: #f59e0b;
            }

            .step.done .step-num {
                background: #10b981;
                color: #fff;
            }

            .step-text {
                font-size: 0.875rem;
            }

            .step-line {
                width: 30px;
                height: 2px;
                background: rgba(255, 255, 255, 0.1);
            }

            /* Error Box */
            .error-box {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 1rem;
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 10px;
                color: #f87171;
                margin-bottom: 1.5rem;
            }

            .error-box button {
                margin-left: auto;
                background: none;
                border: none;
                color: #f87171;
                font-size: 1.25rem;
                cursor: pointer;
            }

            /* Info Box */
            .info-box {
                padding: 1rem;
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid rgba(59, 130, 246, 0.3);
                border-radius: 8px;
                color: #60a5fa;
                margin-bottom: 1.5rem;
                font-size: 0.875rem;
            }

            /* Cards */
            .card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 2rem;
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
                background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(123, 44, 191, 0.2));
                border-radius: 50%;
            }

            .card-icon.spp {
                background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.2));
            }

            .card-icon svg {
                width: 32px;
                height: 32px;
                color: #00d4ff;
            }

            .card-icon.spp svg {
                color: #f59e0b;
            }

            .card-icon.success {
                background: rgba(16, 185, 129, 0.2);
            }

            .card-icon.success svg {
                color: #10b981;
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
                color: #fff;
            }

            .main-card p {
                color: #888;
                margin-bottom: 1.5rem;
            }

            /* Year Badge */
            .year-badge {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1.5rem;
                background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2));
                border: 1px solid rgba(251, 191, 36, 0.4);
                border-radius: 50px;
                color: #fbbf24;
                font-size: 1rem;
                margin-bottom: 1.5rem;
            }

            .year-badge strong {
                font-size: 1.25rem;
                color: #fcd34d;
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
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
            }

            .stat-card .stat-value {
                font-size: 1.5rem;
                font-weight: 700;
                color: #fff;
            }

            .stat-card .stat-label {
                font-size: 0.75rem;
                color: #888;
            }

            /* Buttons */
            .primary-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 1rem 2rem;
                background: linear-gradient(135deg, #00d4ff, #7b2cbf);
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
                box-shadow: 0 8px 20px rgba(0, 212, 255, 0.3);
            }

            .primary-btn.spp:hover:not(:disabled) {
                box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
            }

            .primary-btn:disabled {
                opacity: 0.7;
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
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s;
            }

            .secondary-btn {
                background: rgba(0, 212, 255, 0.1);
                border: 1px solid rgba(0, 212, 255, 0.3);
                color: #00d4ff;
            }

            .danger-btn {
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                color: #f87171;
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
                color: #ccc;
            }

            .instruction-list code {
                background: rgba(0, 212, 255, 0.1);
                padding: 0.125rem 0.5rem;
                border-radius: 4px;
                color: #00d4ff;
                font-size: 0.8rem;
            }

            /* URL Display */
            .url-display {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 0.75rem 1rem;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                margin-bottom: 1.5rem;
                font-size: 0.875rem;
            }

            .url-label {
                color: #888;
            }

            .url-value {
                color: #00d4ff;
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
                color: #888;
                margin-bottom: 0.5rem;
            }

            .headers-list {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
            }

            .header-tag {
                padding: 0.25rem 0.75rem;
                background: rgba(0, 212, 255, 0.1);
                border: 1px solid rgba(0, 212, 255, 0.2);
                border-radius: 4px;
                font-size: 0.75rem;
                color: #00d4ff;
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
                color: #888;
            }

            .max-pages-input input {
                width: 80px;
                padding: 0.5rem 1rem;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                color: #fff;
                text-align: center;
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
                color: #fff;
            }

            .stat-value.highlight {
                color: #00d4ff;
            }

            .stat-value.highlight.spp {
                color: #f59e0b;
            }

            .stat-label {
                font-size: 0.75rem;
                color: #888;
                text-transform: uppercase;
            }

            /* Progress Bar */
            .progress-bar-container {
                height: 6px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                overflow: hidden;
            }

            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #00d4ff, #7b2cbf);
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
                background: rgba(16, 185, 129, 0.1);
                border: 1px solid rgba(16, 185, 129, 0.3);
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
                color: #10b981;
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
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                color: #fff;
            }

            .search-form button {
                padding: 0.625rem 1rem;
                background: rgba(0, 212, 255, 0.2);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 8px;
                color: #00d4ff;
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
                background: rgba(16, 185, 129, 0.2);
                border: 1px solid rgba(16, 185, 129, 0.3);
                color: #34d399;
            }

            .export-btn.json {
                background: rgba(251, 191, 36, 0.2);
                border: 1px solid rgba(251, 191, 36, 0.3);
                color: #fbbf24;
            }

            /* Table */
            .table-container {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                overflow-x: auto;
            }

            .loading-state, .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 3rem;
                color: #888;
            }

            .data-table {
                width: 100%;
                border-collapse: collapse;
                min-width: 600px;
            }

            .data-table th {
                padding: 1rem;
                background: rgba(0, 212, 255, 0.1);
                color: #00d4ff;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                text-align: left;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                white-space: nowrap;
            }

            .data-table td {
                padding: 0.75rem 1rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                font-size: 0.875rem;
                color: #e0e0e0;
            }

            .data-table tr:hover {
                background: rgba(255, 255, 255, 0.03);
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
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                color: #fff;
                cursor: pointer;
            }

            .page-btn:hover:not(:disabled) {
                background: rgba(0, 212, 255, 0.2);
            }

            .page-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .page-info {
                font-size: 0.875rem;
                color: #888;
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
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top-color: #fff;
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
