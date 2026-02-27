# Code Quality Report Card VS Code Extension

> Grade GitHub repositories AND pull requests with Principal Skinner using AI models (via GitHub Copilot)!

## Features
- 📊 Analyze entire GitHub repositories OR individual pull requests
- 🔍 For PRs: Focused analysis on changed files and their impact
- 📊 Analyze multiple targets at once (mix repos and PRs)
- 🎓 Get grades (A-F) based on code quality
- 📝 Receive 10 specific improvement suggestions per analysis
- 💬 Uses AI models (Claude Sonnet or GPT-4o) via your GitHub Copilot subscription (no additional API keys needed!)
- 🎨 Beautiful Principal Skinner themed interface
- 📄 Export the report (with logo) to PDF
- 🤖 Automated packaging and release via GitHub Actions

## Requirements
- VS Code 1.85.0 or higher
- **GitHub Copilot** subscription and extension installed
- Git installed on your system

## Installation

### From VSIX
1. Download the latest `.vsix` file from the [releases page](https://github.com/slmingol/repo-report-card-extension/releases/latest).
2. In VS Code, open the Command Palette (Cmd+Shift+P or Ctrl+Shift+P).
3. Run `Extensions: Install from VSIX...` and select the downloaded `.vsix` file.
4. Reload VS Code if prompted.

### From Source
1. Clone or download this repository
2. Open the folder in VS Code
3. Press `F5` to launch the extension in debugging mode
4. In the new VS Code window, run the command `Repo Report Card: Analyze Repositories`

### Package and Install
```bash
npm install -g @vscode/vsce
vsce package
code --install-extension repo-report-card-1.0.0.vsix
```

## Usage (Step-by-Step)

### 1. Download the Extension
- Go to the [GitHub Releases page](https://github.com/slmingol/repo-report-card-extension/releases/latest).
- Download the latest `.vsix` file (e.g., `repo-report-card-1.0.0.vsix`) to your computer. You can save it anywhere you like (e.g., your Downloads folder).

### 2. Install the Extension in VS Code
- Open Visual Studio Code.
- Open the Command Palette:
  - On Mac: `Cmd+Shift+P`
  - On Windows/Linux: `Ctrl+Shift+P`
- Type `Extensions: Install from VSIX...` and select it.
- In the file dialog, navigate to and select the `.vsix` file you downloaded.
- Wait for the confirmation message that the extension was installed.
- If prompted, reload or restart VS Code.

### 3. Run the Extension
- Open the Command Palette again (`Cmd+Shift+P` or `Ctrl+Shift+P`).
- Type and select: `Repo Report Card: Analyze Repositories`.
- Enter one or more GitHub repository or pull request URLs (one per line) in the input box.
  - Repository example: `https://github.com/facebook/react`
  - Pull request example: `https://github.com/owner/repo/pull/123`
- Click the `Grade and Analyze` button.
- Wait for the analysis to complete. The report card will be displayed in the panel.
- To save the report (including the logo) as a PDF, click the `Save to PDF` button.

## How It Works

### For Repositories:
The extension:
1. Clones each repository (shallow clone)
2. Extracts source code files
3. Sends them to AI models (Claude Sonnet or GPT-4o) via GitHub Copilot for analysis
4. Displays results with grades, rankings, and improvement suggestions
5. Cleans up temporary files

### For Pull Requests:
The extension:
1. Clones the repository and fetches the specific PR
2. Identifies files changed in the PR
3. Prioritizes changed files while including context from the broader codebase
4. Sends the code to AI models with focus on the PR changes
5. Provides targeted analysis of code quality and potential issues in the changes
6. Cleans up temporary files

## Detailed Download, Install, Setup, and Run Instructions

### 1. Download the Extension
- Go to the [GitHub Releases page](https://github.com/slmingol/repo-report-card-extension/releases/latest).
- Download the latest `.vsix` file (e.g., `repo-report-card-1.0.0.vsix`) to your computer.

### 2. Install the Extension in VS Code
- Open Visual Studio Code.
- Open the Command Palette:
  - On Mac: `Cmd+Shift+P`
  - On Windows/Linux: `Ctrl+Shift+P`
- Type `Extensions: Install from VSIX...` and select it.
- In the file dialog, navigate to and select the `.vsix` file you downloaded.
- Wait for the confirmation message that the extension was installed.
- If prompted, reload or restart VS Code.

### 3. Setup Requirements
- Ensure you have the following:
  - Visual Studio Code version 1.85.0 or higher
  - The [GitHub Copilot extension](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) installed and authenticated
  - An active GitHub Copilot subscription
  - [Git](https://git-scm.com/) installed and available in your system PATH

### 4. Run the Extension
- Open the Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`).
- Type and select: `Repo Report Card: Analyze Repositories`
- Enter one or more GitHub repository or pull request URLs (one per line) in the input box.
  - For repositories: `https://github.com/facebook/react`
  - For pull requests: `https://github.com/owner/repo/pull/123`
  - You can mix both types in a single analysis!
- Click the `Grade and Analyze` button.
- Wait for the analysis to complete. The report card will be displayed in the panel.
- To save the report (including the logo) as a PDF, click the `Save to PDF` button.

### Troubleshooting
- If you do not see the extension in the sidebar, ensure it is enabled in VS Code.
- If you encounter errors related to Copilot, make sure you are signed in and your subscription is active.
- If Git is not found, ensure it is installed and available in your system PATH.
- For any issues, check the Output and Developer Tools (Help > Toggle Developer Tools) in VS Code for error messages.

---

## Development & Release
- The extension is automatically versioned and released via GitHub Actions when you push to the `main` branch.
- The workflow will bump the version, package the extension, and publish a release with the `.vsix` artifact.

## Privacy
- All analysis happens through your GitHub Copilot subscription using AI models (Claude Sonnet or GPT-4o)
- Repositories are cloned to temp directories and deleted after analysis
- No data is sent to third-party services

## Contributing
Pull requests and issues are welcome!

## License
MIT
