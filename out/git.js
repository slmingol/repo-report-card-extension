"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneRepository = cloneRepository;
exports.getRepoFiles = getRepoFiles;
exports.getFileContent = getFileContent;
exports.cleanupRepo = cleanupRepo;
exports.cloneRepositoryWithPR = cloneRepositoryWithPR;
const simple_git_1 = require("simple-git");
const fs = require("fs");
const path = require("path");
const os = require("os");
const CLONE_DIR = path.join(os.tmpdir(), 'repo-report-card');
async function cloneRepository(repoUrl) {
    const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'repo';
    const timestamp = Date.now();
    const repoPath = path.join(CLONE_DIR, `${repoName}_${timestamp}`);
    if (!fs.existsSync(CLONE_DIR)) {
        fs.mkdirSync(CLONE_DIR, { recursive: true });
    }
    const git = (0, simple_git_1.default)();
    await git.clone(repoUrl, repoPath, ['--depth', '1']);
    const files = await getRepoFiles(repoPath);
    const fileContents = files.slice(0, 20).map(filePath => ({
        path: path.relative(repoPath, filePath),
        content: getFileContent(filePath, 5000)
    }));
    return {
        name: repoName,
        url: repoUrl,
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
/**
 * Clones a repository and fetches a specific pull request
 * PR URL format: https://github.com/owner/repo/pull/123
 */
async function cloneRepositoryWithPR(prUrl) {
    // Parse the PR URL
    const match = prUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
    if (!match) {
        throw new Error('Invalid GitHub PR URL. Expected format: https://github.com/owner/repo/pull/123');
    }
    const [, owner, repo, prNumber] = match;
    const repoUrl = `https://github.com/${owner}/${repo}.git`;
    const repoName = repo;
    const timestamp = Date.now();
    const repoPath = path.join(CLONE_DIR, `${repoName}_pr${prNumber}_${timestamp}`);
    if (!fs.existsSync(CLONE_DIR)) {
        fs.mkdirSync(CLONE_DIR, { recursive: true });
    }
    const git = (0, simple_git_1.default)();
    // Clone the repository
    await git.clone(repoUrl, repoPath, ['--depth', '1']);
    // Fetch the PR
    const gitRepo = (0, simple_git_1.default)(repoPath);
    await gitRepo.fetch('origin', `pull/${prNumber}/head:pr-${prNumber}`);
    await gitRepo.checkout(`pr-${prNumber}`);
    // Get the diff to find changed files
    const diff = await gitRepo.diff(['origin/main...HEAD', '--name-only']);
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
    const filesToAnalyze = [...changedFilePaths, ...otherFiles];
    const fileContents = filesToAnalyze.map(filePath => ({
        path: path.relative(repoPath, filePath),
        content: getFileContent(filePath, 5000),
        isChanged: changedFilePaths.includes(filePath)
    }));
    return {
        name: `${repoName} (PR #${prNumber})`,
        url: prUrl,
        path: repoPath,
        files: fileContents,
        isPR: true,
        prNumber: parseInt(prNumber, 10)
    };
}
//# sourceMappingURL=git.js.map