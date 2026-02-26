import * as vscode from 'vscode';
import { analyzeRepositories } from './analyzer';
import { RepoReportCardPanel } from './panel';

// Extension activation entry point
export function activate(context: vscode.ExtensionContext) {
    console.log('Repo Report Card extension is now active!');

    let disposable = vscode.commands.registerCommand('repo-report-card.analyze', async () => {
        RepoReportCardPanel.createOrShow(context.extensionUri);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
