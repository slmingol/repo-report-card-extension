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
                cleanlinessScore: 0,
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

Here is a list of the criteria for clean code:
1. Readability: The code is easy to read and comprehend. Variable, function, and class names are meaningful and self-explanatory; code is well-formatted and consistently styled.
2. Simplicity: The code solves problems in the simplest possible way without unnecessary complexity or clever tricks.
3. Consistency: The code follows a consistent style and conventions (naming, indentation, spacing, etc.) throughout the codebase.
4. Maintainability: Code is organized and modular, making it easy to modify, extend, or fix bugs without introducing new issues.
5. Documentation: The code is self-explanatory as much as possible, but essential comments and documentation are present where non-obvious logic occurs.
6. No Duplicates (DRY Principle): Repeated or duplicated code is avoided. Common functionality is extracted and reused.
7. Extensibility: The code can be extended with new functionality without extensive rewrites or breaking existing code.


Here is a sample of the repository's code:

${codeContext}

Please analyze this repository and provide:
1. An overall quality score from 0-100
2. A clean code score from 0-100 based on the criteria for clean code given
2. A brief summary of the repository's strengths and weaknesses, focusing more on code cleanliness based on the criterias
3. Exactly 5 specific improvement points, each with:
   - category: A short category name
   - description: Detailed description of the improvement
   - priority: 'High', 'Medium', or 'Low'

If the url is a pull request, only analyze the changes made in the pull request.

Respond ONLY with valid JSON in this exact format:
{
  "score": <number 0-100>,
  "cleanlinessScore": <number 0-100>,
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
            cleanlinessScore: analysis.cleanlinessScore,
            summary: analysis.summary,
            improvementPlan: analysis.improvementPlan.slice(0, 10)
        };
    }
    catch (error) {
        return {
            repoName: repoInfo.name,
            repoUrl: repoInfo.url,
            score: 0,
            cleanlinessScore: 0,
            improvementPlan: [],
            summary: '',
            error: error.message
        };
    }
}
//# sourceMappingURL=analyzer.js.map