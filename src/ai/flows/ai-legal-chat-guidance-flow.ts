'use server';
/**
 * @fileOverview A Genkit flow for providing instant, easy-to-understand legal guidance on Indian laws (IPC, Family, Tax) in multiple languages.
 *
 * - aiLegalChatGuidance - A function that handles the AI legal chat guidance process.
 * - AILegalChatGuidanceInput - The input type for the aiLegalChatGuidance function.
 * - AILegalChatGuidanceOutput - The return type for the aiLegalChatGuidance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AILegalChatGuidanceInputSchema = z.object({
  query: z.string().describe('The legal question about Indian laws (IPC, Family, Tax).'),
  language: z
    .enum(['English', 'Marathi', 'Hindi'])
    .default('English')
    .describe('The desired output language for the legal advice.'),
});
export type AILegalChatGuidanceInput = z.infer<typeof AILegalChatGuidanceInputSchema>;

const AILegalChatGuidanceOutputSchema = z.object({
  legalAdvice: z.string().describe('The AI-generated, easy-to-understand legal advice.'),
});
export type AILegalChatGuidanceOutput = z.infer<typeof AILegalChatGuidanceOutputSchema>;

export async function aiLegalChatGuidance(
  input: AILegalChatGuidanceInput
): Promise<AILegalChatGuidanceOutput> {
  return aiLegalChatGuidanceFlow(input);
}

const aiLegalChatGuidancePrompt = ai.definePrompt({
  name: 'aiLegalChatGuidancePrompt',
  input: {schema: AILegalChatGuidanceInputSchema},
  output: {schema: AILegalChatGuidanceOutputSchema},
  prompt: `You are an AI legal advisor specializing in Indian laws, including IPC, Family Law, and Tax Law. Your goal is to provide instant, easy-to-understand legal guidance in a simple and accessible manner.

Respond to the user's query in the specified language, ensuring the advice is clear and avoids complex legal jargon.

Query: {{{query}}}
Desired Language: {{{language}}}

Provide the legal advice in the 'legalAdvice' field of the output.`,
});

const aiLegalChatGuidanceFlow = ai.defineFlow(
  {
    name: 'aiLegalChatGuidanceFlow',
    inputSchema: AILegalChatGuidanceInputSchema,
    outputSchema: AILegalChatGuidanceOutputSchema,
  },
  async input => {
    const {output} = await aiLegalChatGuidancePrompt(input);
    return output!;
  }
);
