# Repo Report Card VS Code Extension

> Grade GitHub repositories with Principal Skinner using GitHub Copilot!

## Features
- 📊 Analyze multiple GitHub repositories at once
- 🎓 Get grades (A-F) based on code quality
- 📝 Receive 10 specific improvement suggestions per repo
- 💬 Uses your GitHub Copilot subscription (no additional API keys needed!)
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

## Usage
1. Open the Command Palette and run `Repo Report Card: Analyze Repositories`.
2. Enter one or more GitHub repository URLs (one per line).
3. Click `Grade These Repositories`.
4. When the analysis is complete, click `Save to PDF` to export the report (logo included).

## How It Works
The extension:
1. Clones each repository (shallow clone)
2. Extracts source code files
3. Sends them to GitHub Copilot for analysis
4. Displays results with grades, rankings, and improvement suggestions
5. Cleans up temporary files

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
- Enter one or more GitHub repository URLs (one per line) in the input box.
- Click the `Grade These Repositories` button.
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
- All analysis happens through your GitHub Copilot subscription
- Repositories are cloned to temp directories and deleted after analysis
- No data is sent to third-party services

## Contributing
Pull requests and issues are welcome!

## License
MIT
