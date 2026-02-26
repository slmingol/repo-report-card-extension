import * as vscode from 'vscode';
import { cloneRepository, cleanupRepo, RepoInfo } from './git';

export interface ImprovementPoint {
    category: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
}

export interface RepoAnalysis {
    repoName: string;
    repoUrl: string;
    score: number;
    improvementPlan: ImprovementPoint[];
    summary: string;
    error?: string;
}

export async function analyzeRepositories(repoUrls: string[]): Promise<RepoAnalysis[]> {
    const results: RepoAnalysis[] = [];

    for (const url of repoUrls) {
        try {
            const repoInfo = await cloneRepository(url);
            const analysis = await analyzeRepoWithCopilot(repoInfo);
            results.push(analysis);
            cleanupRepo(repoInfo.path);
        } catch (error: any) {
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

async function analyzeRepoWithCopilot(repoInfo: RepoInfo): Promise<RepoAnalysis> {
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

    } catch (error: any) {
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
