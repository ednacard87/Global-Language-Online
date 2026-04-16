'use server';
/**
 * @fileOverview An AI flow to extract quiz results from an image.
 *
 * - extractQuizResult - A function that handles the quiz result extraction.
 * - ExtractQuizResultInput - The input type for the extractQuizResult function.
 * - ExtractQuizResultOutput - The return type for the extractQuizResult function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractQuizResultInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image of a quiz result, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractQuizResultInput = z.infer<typeof ExtractQuizResultInputSchema>;

const ExtractQuizResultOutputSchema = z.object({
  percentage: z
    .number()
    .describe('The numerical percentage score found in the image. Return 0 if no score is found.'),
});
export type ExtractQuizResultOutput = z.infer<typeof ExtractQuizResultOutputSchema>;

const prompt = ai.definePrompt({
    name: 'extractQuizResultPrompt',
    input: {schema: ExtractQuizResultInputSchema},
    output: {schema: ExtractQuizResultOutputSchema},
    prompt: `You are an expert at analyzing images of quiz results to find the final score.
    
    Analyze the following image and identify the final percentage score. The score might be written as a number with a '%' symbol (e.g., "85%", "Score: 92 %") or just a number that clearly represents a final percentage grade.
    
    Return only the numerical value of the percentage. For example, if you see "95%", return 95.
    
    If you cannot find a clear percentage score in the image, you must return 0.
    
    Image: {{media url=imageDataUri}}`,
});

const extractQuizResultFlow = ai.defineFlow(
  {
    name: 'extractQuizResultFlow',
    inputSchema: ExtractQuizResultInputSchema,
    outputSchema: ExtractQuizResultOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function extractQuizResult(input: ExtractQuizResultInput): Promise<ExtractQuizResultOutput> {
  return extractQuizResultFlow(input);
}
