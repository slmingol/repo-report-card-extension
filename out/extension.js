"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const panel_1 = require("./panel");
function activate(context) {
    console.log('Repo Report Card extension is now active!');
    let disposable = vscode.commands.registerCommand('repo-report-card.analyze', async () => {
        panel_1.RepoReportCardPanel.createOrShow(context.extensionUri);
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map