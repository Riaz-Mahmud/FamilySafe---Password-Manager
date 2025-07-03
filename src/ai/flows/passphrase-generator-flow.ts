
'use server';
/**
 * @fileOverview A flow to generate memorable and secure passphrases.
 *
 * - generatePassphrase - A function that handles generating the passphrase and an explanation of its strength.
 * - PassphraseGeneratorInput - The input type for the generatePassphrase function.
 * - PassphraseGeneratorOutput - The return type for the generatePassphrase function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const PassphraseGeneratorInputSchema = z.object({
  numberOfWords: z
    .number()
    .min(3)
    .max(8)
    .default(4)
    .describe('The number of words to include in the passphrase.'),
});
export type PassphraseGeneratorInput = z.infer<typeof PassphraseGeneratorInputSchema>;

export const PassphraseGeneratorOutputSchema = z.object({
  passphrase: z
    .string()
    .describe('The generated passphrase, consisting of lowercase words separated by dashes.'),
  explanation: z
    .string()
    .describe('A brief explanation of why this passphrase is secure.'),
});
export type PassphraseGeneratorOutput = z.infer<typeof PassphraseGeneratorOutputSchema>;

export async function generatePassphrase(
  input: PassphraseGeneratorInput
): Promise<PassphraseGeneratorOutput> {
  return passphraseGeneratorFlow(input);
}

const passphrasePrompt = ai.definePrompt({
  name: 'passphrasePrompt',
  input: { schema: PassphraseGeneratorInputSchema },
  output: { schema: PassphraseGeneratorOutputSchema },
  prompt: `You are a security expert specializing in creating memorable, secure passphrases.
Generate a passphrase with exactly {{{numberOfWords}}} common, non-offensive, lowercase English words.
The words should be separated by a single dash "-". Do not include any other characters or punctuation.

Example for 4 words: "correct-horse-battery-staple"

After generating the passphrase, provide a brief, one-sentence explanation of why this type of passphrase is secure, focusing on its length and the difficulty of guessing it.
`,
});

const passphraseGeneratorFlow = ai.defineFlow(
  {
    name: 'passphraseGeneratorFlow',
    inputSchema: PassphraseGeneratorInputSchema,
    outputSchema: PassphraseGeneratorOutputSchema,
  },
  async (input) => {
    const { output } = await passphrasePrompt(input);
    return output!;
  }
);
