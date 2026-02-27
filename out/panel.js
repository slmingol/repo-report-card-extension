"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepoReportCardPanel = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const analyzer_1 = require("./analyzer");
class RepoReportCardPanel {
    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (RepoReportCardPanel.currentPanel) {
            RepoReportCardPanel.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel('repoReportCard', 'Code Quality Report Card', column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [extensionUri]
        });
        RepoReportCardPanel.currentPanel = new RepoReportCardPanel(panel, extensionUri);
    }
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._panel.webview.html = this._getHtmlContent();
        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'analyze':
                    await this._handleAnalyze(message.urls);
                    break;
            }
        }, null, this._disposables);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }
    async _handleAnalyze(urls) {
        this._panel.webview.postMessage({ command: 'analysisStarted', count: urls.length });
        try {
            const results = await (0, analyzer_1.analyzeRepositories)(urls);
            // Sort by score
            const ranking = results
                .filter(r => !r.error)
                .sort((a, b) => b.score - a.score)
                .map(r => ({ repoName: r.repoName, score: r.score }));
            this._panel.webview.postMessage({
                command: 'analysisComplete',
                results: { analyses: results, ranking }
            });
        }
        catch (error) {
            this._panel.webview.postMessage({
                command: 'analysisError',
                error: error.message
            });
        }
    }
    _getHtmlContent() {
        // Read the local logo image and convert to base64 data URL
        let logoDataUrl = '';
        try {
            const logoFilePath = path.join(this._extensionUri.fsPath, 'media', 'logo.png');
            const logoBuffer = fs.readFileSync(logoFilePath);
            const logoBase64 = logoBuffer.toString('base64');
            logoDataUrl = `data:image/png;base64,${logoBase64}`;
        }
        catch (e) {
            // fallback to empty or placeholder
            logoDataUrl = '';
        }
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Repo Report Card</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .header {
            display: flex;
            align-items: center;
            margin-bottom: 40px;
            gap: 20px;
        }
        .logo {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            object-fit: cover;
            border: 4px solid #667eea;
        }
        .title-container {
            flex: 1;
            text-align: center;
        }
        h1 {
            color: #333;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            font-size: 1.2em;
            font-style: italic;
        }
        .form-group {
            margin-bottom: 30px;
        }

        label {
            display: block;
            color: #333;
            font-weight: 600;
            margin-bottom: 10px;
            font-size: 1.1em;
        }

        textarea {
            width: 100%;
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-family: monospace;
            font-size: 14px;
            resize: vertical;
            transition: border-color 0.3s;
        }

        textarea:focus {
            outline: none;
            border-color: #667eea;
        }

        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 10px;
            font-size: 1.1em;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        button:active {
            transform: translateY(0);
        }

        button:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }

        #loading {
            text-align: center;
            padding: 40px;
            color: #667eea;
            font-size: 1.2em;
        }

        #results {
            margin-top: 40px;
        }

        .ranking {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 30px;
        }

        .ranking h2 {
            color: #333;
            margin-bottom: 15px;
        }

        .ranking-item {
            display: flex;
            align-items: center;
            padding: 10px;
            margin: 5px 0;
            background: white;
            border-radius: 8px;
        }

        .rank {
            font-size: 1.5em;
            font-weight: bold;
            margin-right: 15px;
            color: #667eea;
        }

        .repo-card {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 30px;
            margin: 20px 0;
        }

        .repo-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .repo-name {
            font-size: 1.8em;
            color: #333;
            font-weight: bold;
        }

        .grade {
            font-size: 3em;
            font-weight: bold;
            padding: 10px 30px;
            border-radius: 10px;
            background: white;
        }

        .grade-A { color: #4caf50; }
        .grade-B { color: #8bc34a; }
        .grade-C { color: #ffc107; }
        .grade-D { color: #ff9800; }
        .grade-F { color: #f44336; }

        .assessment {
            background: white;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }

        .assessment-title {
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }

        .summary {
            color: #666;
            line-height: 1.6;
            margin-bottom: 15px;
        }

        .improvement-list {
            list-style: none;
        }

        .improvement-item {
            background: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }

        .improvement-category {
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }

        .improvement-priority {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: 600;
            margin-left: 10px;
        }

        .priority-High { background: #ffebee; color: #c62828; }
        .priority-Medium { background: #fff3e0; color: #f57c00; }
        .priority-Low { background: #e8f5e9; color: #2e7d32; }

        .error {
            background: #ffebee;
            color: #c62828;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }

        .button-group {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
        }

        #pdfBtn {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        }

        #pdfBtn:hover {
            box-shadow: 0 5px 15px rgba(40, 167, 69, 0.4);
        }

        /* Print styles */
        @media print {
            body {
                background: white !important;
                padding: 0;
            }

            .container {
                box-shadow: none;
                padding: 20px;
            }

            .form-group, .button-group, #loading {
                display: none !important;
            }

            .repo-card {
                page-break-inside: avoid;
                margin: 20px 0;
            }

            .ranking {
                page-break-after: always;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${logoDataUrl}" alt="Principal Skinner" class="logo">
            <div class="title-container">
                <h1>📊 Code Quality Report Card</h1>
                <p class="subtitle">Analyze Repositories & Pull Requests | Powered by GitHub Copilot</p>
            </div>
        </div>

        <div class="form-group">
            <label for="repoUrls">📚 Enter GitHub Repository or Pull Request URLs (one per line)</label>
            <textarea id="repoUrls" rows="8" placeholder="Repositories:
https://github.com/facebook/react
https://github.com/microsoft/vscode

Pull Requests:
https://github.com/owner/repo/pull/123
https://github.com/owner/repo/pull/456"></textarea>
        </div>

        <div class="button-group">
            <button id="analyzeBtn">🎓 Grade and Analyze</button>
            <button id="pdfBtn" style="display: none;">📄 Save to PDF</button>
        </div>

        <div id="loading" style="display: none;">
            <p>📝 Principal Skinner is analyzing your code...</p>
        </div>

        <div id="results"></div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <script>
        const vscode = acquireVsCodeApi();
        const analyzeBtn = document.getElementById('analyzeBtn');
        const pdfBtn = document.getElementById('pdfBtn');
        const repoUrlsInput = document.getElementById('repoUrls');
        const loading = document.getElementById('loading');
        const resultsDiv = document.getElementById('results');

        analyzeBtn.addEventListener('click', () => {
            const urls = repoUrlsInput.value
                .split('\\n')
                .map(url => url.trim())
                .filter(url => url.length > 0);

            if (urls.length === 0) {
                alert('Please enter at least one repository or pull request URL');
                return;
            }

            vscode.postMessage({ command: 'analyze', urls });
        });

        pdfBtn.addEventListener('click', () => {
            const element = document.querySelector('.container');
            const opt = {
                margin: 0.5,
                filename: 'repo-report-card.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };
            
            // Hide form and buttons before generating PDF
            const formGroup = document.querySelector('.form-group');
            const buttonGroup = document.querySelector('.button-group');
            const loadingDiv = document.getElementById('loading');
            
            formGroup.style.display = 'none';
            buttonGroup.style.display = 'none';
            loadingDiv.style.display = 'none';
            
            html2pdf().set(opt).from(element).save().then(() => {
                // Restore visibility after PDF generation
                formGroup.style.display = '';
                buttonGroup.style.display = '';
            });
        });

        window.addEventListener('message', event => {
            const message = event.data;

            switch (message.command) {
                case 'analysisStarted':
                    analyzeBtn.disabled = true;
                    loading.style.display = 'block';
                    resultsDiv.innerHTML = '';
                    break;

                case 'analysisComplete':
                    analyzeBtn.disabled = false;
                    loading.style.display = 'none';
                    pdfBtn.style.display = 'block';
                    displayResults(message.results);
                    break;

                case 'analysisError':
                    analyzeBtn.disabled = false;
                    loading.style.display = 'none';
                    resultsDiv.innerHTML = \`<div class="error">❌ Error: \${message.error}</div>\`;
                    break;
            }
        });

        function getLetterGrade(score) {
            if (score >= 90) return 'A';
            if (score >= 80) return 'B';
            if (score >= 70) return 'C';
            if (score >= 60) return 'D';
            return 'F';
        }

        function getSkinnerQuote(score) {
            if (score >= 90) return '"An unforgettable performance!" - Excellent work.';
            if (score >= 80) return '"Adequate work, I suppose." - Good job.';
            if (score >= 70) return '"This is acceptable... barely." - Needs improvement.';
            if (score >= 60) return '"I\\'ve seen worse... not much worse." - Considerable work needed.';
            return '"This is an unfavorable review." - Pathetic.';
        }

        function displayResults(data) {
            let html = '';

            // Rankings
            if (data.ranking.length > 0) {
                html += '<div class="ranking"><h2>🏆 Rankings</h2>';
                data.ranking.forEach((item, index) => {
                    const grade = getLetterGrade(item.score);
                    html += \`
                        <div class= "ranking-item">
                            <span class="rank">#\${index + 1}</span>
                            <span style="flex: 1;">\${item.repoName}</span>
                            <span class="grade grade-\${grade}" style="font-size: 1.5em; padding: 5px 15px;">\${grade}</span>
                            <span style="margin-left: 15px; font-weight: bold;">\${item.score}/100</span>
                        </div>
                    \`;
                });
                html += '</div>';
            }

            // Individual reports
            data.analyses.forEach(analysis => {
                const grade = getLetterGrade(analysis.score);
                const quote = getSkinnerQuote(analysis.score);

                html += \`<div class="repo-card">
                    <div class="repo-header">
                        <div>
                            <div class="repo-name">\${analysis.repoName}</div>
                            <a href="\${analysis.repoUrl}" target="_blank">\${analysis.repoUrl}</a>
                        </div>
                        <div class="grade grade-\${grade}">\${grade}</div>
                    </div>
                    <div style="text-align: center; font-size: 2em; margin: 20px 0;">\${analysis.score}/100</div>
                \`;

                if (analysis.error) {
                    html += \`<div class="error">❌ \${analysis.error}</div>\`;
                } else {
                    html += \`
                        <div class="assessment">
                            <div class="assessment-title">Principal's Assessment: \${quote}</div>
                            <div class="summary">\${analysis.summary}</div>
                        </div>
                        <h3>📝 Areas Requiring Attention (10 Points):</h3>
                        <ul class="improvement-list">
                    \`;

                    analysis.improvementPlan.forEach((point, index) => {
                        html += \`
                            <li class="improvement-item">
                                <div class="improvement-category">
                                    \${index + 1}. \${point.category}
                                    <span class="improvement-priority priority-\${point.priority}">\${point.priority}</span>
                                </div>
                                <div>\${point.description}</div>
                            </li>
                        \`;
                    });

                    html += '</ul>';
                }

                html += '</div>';
            });

            resultsDiv.innerHTML = html;
        }
    </script>
</body>
</html>`;
    }
    dispose() {
        RepoReportCardPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
exports.RepoReportCardPanel = RepoReportCardPanel;
//# sourceMappingURL=panel.js.map