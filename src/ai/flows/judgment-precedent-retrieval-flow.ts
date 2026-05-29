'use server';
/**
 * @fileOverview A Genkit flow for retrieving relevant High Court and Supreme Court case laws and judgments.
 *
 * - retrieveJudgmentPrecedent - A function that handles the judgment and precedent retrieval process.
 * - JudgmentPrecedentRetrievalInput - The input type for the retrieveJudgmentPrecedent function.
 * - JudgmentPrecedentRetrievalOutput - The return type for the retrieveJudgmentPrecedent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const JudgmentPrecedentRetrievalInputSchema = z.object({
  query: z.string().describe('The legal query for which to find relevant judgments and precedents.'),
});
export type JudgmentPrecedentRetrievalInput = z.infer<typeof JudgmentPrecedentRetrievalInputSchema>;

const JudgmentOutputSchema = z.object({
  title: z.string().describe('The title or name of the judgment.'),
  court: z.string().describe('The court that issued the judgment (e.g., Supreme Court of India, High Court of Bombay).'),
  citation: z.string().describe('The official citation for the judgment.'),
  summary: z.string().describe('A brief summary of the judgment and its relevance to the query.'),
  link: z.string().url().optional().describe('An optional URL to the full text of the judgment.'),
});

const JudgmentPrecedentRetrievalOutputSchema = z.object({
  judgments: z.array(JudgmentOutputSchema).describe('A list of relevant High Court and Supreme Court judgments and precedents.'),
  explanation: z.string().describe('A brief explanation of how these judgments relate to the provided query.'),
});
export type JudgmentPrecedentRetrievalOutput = z.infer<typeof JudgmentPrecedentRetrievalOutputSchema>;

export async function retrieveJudgmentPrecedent(
  input: JudgmentPrecedentRetrievalInput
): Promise<JudgmentPrecedentRetrievalOutput> {
  return judgmentPrecedentRetrievalFlow(input);
}

const prompt = ai.definePrompt({
  name: 'judgmentPrecedentRetrievalPrompt',
  input: {schema: JudgmentPrecedentRetrievalInputSchema},
  output: {schema: JudgmentPrecedentRetrievalOutputSchema},
  prompt: `You are an AI legal research assistant specializing in Indian law. Your task is to identify and present relevant High Court and Supreme Court case laws and judgments based on a user's legal query.

Focus specifically on judgments from the Supreme Court of India and various Indian High Courts.

Analyze the following query and provide a list of relevant judgments. For each judgment, include its title, the court that issued it, its official citation, a brief summary of its key findings and relevance, and optionally a link to the full text if available.

After listing the judgments, provide a concise explanation of how these judgments collectively relate to the user's query.

Legal Query: {{{query}}}`,
});

const judgmentPrecedentRetrievalFlow = ai.defineFlow(
  {
    name: 'judgmentPrecedentRetrievalFlow',
    inputSchema: JudgmentPrecedentRetrievalInputSchema,
    outputSchema: JudgmentPrecedentRetrievalOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
