# Repo Report Card

> Grade GitHub repositories with Principal Skinner using GitHub Copilot!

## Features

- 📊 Analyze multiple GitHub repositories at once
- 🎓 Get grades (A-F) based on code quality
- 📝 Receive 10 specific improvement suggestions per repo
- 💬 Uses your GitHub Copilot subscription (no additional API keys needed!)
- 🎨 Beautiful Principal Skinner themed interface

## Requirements

- VS Code 1.85.0 or higher
- **GitHub Copilot** subscription and extension installed
- Git installed on your system

## Usage

1. Open the Command Palette (`Cmd+Shift+P` on Mac, `Ctrl+Shift+P` on Windows/Linux)
2. Type and select: `Repo Report Card: Analyze Repositories`
3. Enter GitHub repository URLs (one per line)
4. Click "Grade These Repositories"
5. Wait for Principal Skinner to grade your repos!

## How It Works

The extension:
1. Clones each repository (shallow clone)
2. Extracts source code files
3. Sends them to GitHub Copilot for analysis
4. Displays results with grades, rankings, and improvement suggestions
5. Cleans up temporary files

## Installation

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

## Privacy

- All analysis happens through your GitHub Copilot subscription
- Repositories are cloned to temp directories and deleted after analysis
- No data is sent to third-party services

## License

ISC
