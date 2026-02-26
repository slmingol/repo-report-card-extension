"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeRepositories = analyzeRepositories;
const vscode = require("vscode");
const git_1 = require("./git");
async function analyzeRepositories(repoUrls) {
    const results = [];
    for (const url of repoUrls) {
        try {
            const repoInfo = await (0, git_1.cloneRepository)(url);
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
        // Get all available language models
        const models = await vscode.lm.selectChatModels({
            vendor: 'copilot',
            family: 'gpt-4o'
        });
        if (models.length === 0) {
            throw new Error('No Copilot model available. Make sure you have GitHub Copilot enabled.');
        }
        const model = models[0];
        // Build the code context
        const codeContext = repoInfo.files
            .map(f => `File: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
            .join('\n\n');
        const prompt = `You are a senior code reviewer analyzing the repository "${repoInfo.name}".

Here is a sample of the repository's code:

${codeContext}

Please analyze this repository and provide:
1. An overall quality score from 0-100
2. A brief summary of the repository's strengths and weaknesses
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