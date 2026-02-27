"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeRepositories = analyzeRepositories;
const vscode = require("vscode");
const git_1 = require("./git");
async function analyzeRepositories(repoUrls) {
    const results = [];
    for (const url of repoUrls) {
        try {
            // Check if this is a PR URL
            const isPRUrl = /github\.com\/[^\/]+\/[^\/]+\/pull\/\d+/.test(url);
            const repoInfo = isPRUrl
                ? await (0, git_1.cloneRepositoryWithPR)(url)
                : await (0, git_1.cloneRepository)(url);
            const analysis = await analyzeRepoWithCopilot(repoInfo);
            results.push(analysis);
            (0, git_1.cleanupRepo)(repoInfo.path);
        }
        catch (error) {
            results.push({
                repoName: url.split('/').pop() || 'unknown',
                repoUrl: url,
                score: 0,
                improvementPlan: [],
                summary: '',
                error: error.message
            });
        }
    }
    return results;
}
async function analyzeRepoWithCopilot(repoInfo) {
    try {
        // Try to get Claude Sonnet model first, fall back to GPT-4
        let models = await vscode.lm.selectChatModels({
            vendor: 'copilot',
            family: 'claude-sonnet'
        });
        let modelName = 'Claude Sonnet';
        // If Claude not available, try GPT-4
        if (models.length === 0) {
            models = await vscode.lm.selectChatModels({
                vendor: 'copilot',
                family: 'gpt-4o'
            });
            modelName = 'GPT-4o';
        }
        // If still no models, error out
        if (models.length === 0) {
            throw new Error('No AI models available. Make sure you have GitHub Copilot enabled.');
        }
        const model = models[0];
        console.log(`Using ${modelName} for repository analysis`);
        // Build the code context with indication of changed files for PRs
        const codeContext = repoInfo.files
            .map(f => {
            const changeIndicator = f.isChanged ? ' [CHANGED IN PR]' : '';
            return `File: ${f.path}${changeIndicator}\n\`\`\`\n${f.content}\n\`\`\``;
        })
            .join('\n\n');
        // Adjust prompt based on whether this is a PR or full repo analysis
        const analysisType = repoInfo.isPR
            ? `pull request #${repoInfo.prNumber} in the repository "${repoInfo.name.split(' (PR')[0]}"`
            : `repository "${repoInfo.name}"`;
        const focusGuidance = repoInfo.isPR
            ? 'Focus your analysis on the changed files (marked with [CHANGED IN PR]) and their impact on the overall codebase. Evaluate the quality of the changes, potential issues, and how well they integrate with existing code.'
            : 'Analyze the overall code quality, architecture, and maintainability of the repository.';
        const prompt = `You are a senior code reviewer analyzing the ${analysisType}.

Here is ${repoInfo.isPR ? 'the code with changes highlighted' : 'a sample of the repository\'s code'}:

${codeContext}

${focusGuidance}

Please analyze this ${repoInfo.isPR ? 'pull request' : 'repository'} and provide:
1. An overall quality score from 0-100
2. A brief summary of the ${repoInfo.isPR ? 'changes\' strengths and weaknesses' : 'repository\'s strengths and weaknesses'}
3. Exactly 10 specific improvement points, each with:
   - category: A short category name
   - description: Detailed description of the improvement
   - priority: 'High', 'Medium', or 'Low'

Respond ONLY with valid JSON in this exact format:
{
  "score": <number 0-100>,
  "summary": "<your summary>",
  "improvementPlan": [
    {
      "category": "<category>",
      "description": "<description>",
      "priority": "<High|Medium|Low>"
    }
  ]
}`;
        const messages = [
            vscode.LanguageModelChatMessage.User(prompt)
        ];
        const chatResponse = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);
        let fullResponse = '';
        for await (const fragment of chatResponse.text) {
            fullResponse += fragment;
        }
        // Parse the JSON response
        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse Copilot response');
        }
        const analysis = JSON.parse(jsonMatch[0]);
        return {
            repoName: repoInfo.name,
            repoUrl: repoInfo.url,
            score: analysis.score,
            summary: analysis.summary,
            improvementPlan: analysis.improvementPlan.slice(0, 10)
        };
    }
    catch (error) {
        return {
            repoName: repoInfo.name,
            repoUrl: repoInfo.url,
            score: 0,
            improvementPlan: [],
            summary: '',
            error: error.message
        };
    }
}
//# sourceMappingURL=analyzer.js.map