"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneRepository = cloneRepository;
exports.getRepoFiles = getRepoFiles;
exports.getFileContent = getFileContent;
exports.cleanupRepo = cleanupRepo;
const simple_git_1 = require("simple-git");
const fs = require("fs");
const path = require("path");
const os = require("os");
const CLONE_DIR = path.join(os.tmpdir(), 'repo-report-card');
function parseGitHubUrl(url) {
    // PR URL: https://github.com/owner/repo/pull/1234
    const prMatch = url.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
    if (prMatch) {
        const [, owner, repo, prNumber] = prMatch;
        return {
            type: 'pr',
            repoUrl: `https://github.com/${owner}/${repo}.git`,
            prNumber
        };
    }
    // Repo URL: https://github.com/owner/repo(.git)
    const repoMatch = url.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(\.git)?$/);
    if (repoMatch) {
        const [, owner, repo] = repoMatch;
        return {
            type: 'repo',
            repoUrl: `https://github.com/${owner}/${repo}.git`
        };
    }
    throw new Error('Invalid GitHub URL');
}
async function cloneRepository(url) {
    const parsed = parseGitHubUrl(url);
    const repoName = parsed.repoUrl.split('/').pop()?.replace('.git', '') || 'repo';
    const timestamp = Date.now();
    const repoPath = path.join(CLONE_DIR, `${repoName}_${timestamp}`);
    if (!fs.existsSync(CLONE_DIR)) {
        fs.mkdirSync(CLONE_DIR, { recursive: true });
    }
    const git = (0, simple_git_1.default)();
    await git.clone(parsed.repoUrl, repoPath, ['--depth', '1']);
    var filePaths = [''];
    if (parsed.type === 'pr') {
        await git.cwd(repoPath);
        const prNumber = parsed.prNumber;
        const prRef = `pull/${prNumber}/head:pr-${prNumber}`;
        await git.fetch('origin', prRef);
        await git.checkout(`pr-${prNumber}`);
        // Get the diff to find changed files
        const diff = await git.diff(['origin/main..HEAD', '--name-only']);
        const changedFiles = diff.split('\n').filter(f => f.trim());
        // Get the full file list for context, but prioritize changed files
        const allFiles = await getRepoFiles(repoPath);
        // Prioritize changed files and include up to 20 files total
        const changedFilePaths = changedFiles
            .map(f => path.join(repoPath, f))
            .filter(f => fs.existsSync(f) && fs.statSync(f).isFile());
        const remainingSlots = Math.max(0, 20 - changedFilePaths.length);
        const otherFiles = allFiles
            .filter(f => !changedFilePaths.includes(f))
            .slice(0, remainingSlots);
        filePaths = [...changedFilePaths, ...otherFiles];
        // const diffSummary = await git.diffSummary(['origin/main...HEAD']);
        // filePaths = diffSummary.files.map(f => path.join(repoPath, f.file));
    }
    else if (parsed.type == 'repo') {
        const files = await getRepoFiles(repoPath);
        filePaths = files.slice(0, 20);
    }
    const fileContents = filePaths.map(filePath => ({
        path: path.relative(repoPath, filePath),
        content: getFileContent(filePath, 5000)
    }));
    return {
        name: repoName,
        url: url,
        path: repoPath,
        files: fileContents
    };
}
async function getRepoFiles(repoPath) {
    const files = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rb', '.rs', '.c', '.cpp', '.h', '.cs', '.php'];
    const ignoreDirs = ['node_modules', 'dist', 'build', '.next', 'coverage', '.git'];
    function traverseDir(dir) {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                if (!ignoreDirs.includes(item)) {
                    traverseDir(fullPath);
                }
            }
            else if (stat.isFile()) {
                if (extensions.some(ext => item.endsWith(ext))) {
                    files.push(fullPath);
                }
            }
        }
    }
    traverseDir(repoPath);
    return files;
}
function getFileContent(filePath, maxChars = 100000) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.slice(0, maxChars);
    }
    catch (error) {
        return '';
    }
}
function cleanupRepo(repoPath) {
    if (fs.existsSync(repoPath)) {
        fs.rmSync(repoPath, { recursive: true, force: true });
    }
}
//# sourceMappingURL=git.js.map