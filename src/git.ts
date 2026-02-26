import simpleGit, { SimpleGit } from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CLONE_DIR = path.join(os.tmpdir(), 'repo-report-card');

export interface RepoInfo {
    name: string;
    url: string;
    path: string;
    files: { path: string; content: string }[];
}

export async function cloneRepository(repoUrl: string): Promise<RepoInfo> {
    const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'repo';
    const timestamp = Date.now();
    const repoPath = path.join(CLONE_DIR, `${repoName}_${timestamp}`);

    if (!fs.existsSync(CLONE_DIR)) {
        fs.mkdirSync(CLONE_DIR, { recursive: true });
    }

    const git: SimpleGit = simpleGit();
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

export async function getRepoFiles(repoPath: string): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rb', '.rs', '.c', '.cpp', '.h', '.cs', '.php'];
    const ignoreDirs = ['node_modules', 'dist', 'build', '.next', 'coverage', '.git'];

    function traverseDir(dir: string) {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                if (!ignoreDirs.includes(item)) {
                    traverseDir(fullPath);
                }
            } else if (stat.isFile()) {
                if (extensions.some(ext => item.endsWith(ext))) {
                    files.push(fullPath);
                }
            }
        }
    }

    traverseDir(repoPath);
    return files;
}

export function getFileContent(filePath: string, maxChars: number = 100000): string {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.slice(0, maxChars);
    } catch (error) {
        return '';
    }
}

export function cleanupRepo(repoPath: string): void {
    if (fs.existsSync(repoPath)) {
        fs.rmSync(repoPath, { recursive: true, force: true });
    }
}
