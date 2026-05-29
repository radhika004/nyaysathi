'use server';
/**
 * @fileOverview A Genkit flow for extracting key legal entities and summarizing legal documents.
 *
 * - documentSummarizationAndEntityExtraction - A function that handles the document summarization and entity extraction process.
 * - DocumentSummarizationAndEntityExtractionInput - The input type for the documentSummarizationAndEntityExtraction function.
 * - DocumentSummarizationAndEntityExtractionOutput - The return type for the documentSummarizationAndEntityExtraction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DocumentSummarizationAndEntityExtractionInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A legal document (PDF or image) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DocumentSummarizationAndEntityExtractionInput = z.infer<
  typeof DocumentSummarizationAndEntityExtractionInputSchema
>;

const DocumentSummarizationAndEntityExtractionOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the legal document.'),
  extractedEntities: z
    .array(z.string())
    .describe('A list of key legal entities extracted from the document.'),
});
export type DocumentSummarizationAndEntityExtractionOutput = z.infer<
  typeof DocumentSummarizationAndEntityExtractionOutputSchema
>;

export async function documentSummarizationAndEntityExtraction(
  input: DocumentSummarizationAndEntityExtractionInput
): Promise<DocumentSummarizationAndEntityExtractionOutput> {
  return documentSummarizationAndEntityExtractionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'documentSummarizationAndEntityExtractionPrompt',
  input: {schema: DocumentSummarizationAndEntityExtractionInputSchema},
  output: {schema: DocumentSummarizationAndEntityExtractionOutputSchema},
  prompt: `You are an expert legal assistant. Your task is to analyze the provided legal document.

First, provide a concise summary of the document, highlighting its main purpose and key takeaways.

Second, identify and list all key legal entities present in the document. These may include, but are not limited to, parties involved, dates, case numbers, specific laws or acts cited, courts, and important financial figures.

Document: {{media url=documentDataUri}}`,
});

const documentSummarizationAndEntityExtractionFlow = ai.defineFlow(
  {
    name: 'documentSummarizationAndEntityExtractionFlow',
    inputSchema: DocumentSummarizationAndEntityExtractionInputSchema,
    outputSchema: DocumentSummarizationAndEntityExtractionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
