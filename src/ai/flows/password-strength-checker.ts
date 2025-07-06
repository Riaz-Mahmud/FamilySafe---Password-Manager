
'use server';
/**
 * @fileOverview An AI flow to check the strength of a password.
 *
 * - checkPasswordStrength - A function that analyzes a password.
 * - PasswordStrengthInput - The input type for the checkPasswordStrength function.
 * - PasswordStrengthOutput - The return type for the checkPasswordStrength function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const PasswordStrengthInputSchema = z.string();
export type PasswordStrengthInput = z.infer<typeof PasswordStrengthInputSchema>;

export const PasswordStrengthOutputSchema = z.object({
  strength: z.enum(['Weak', 'Moderate', 'Strong', 'Very Strong']).describe('The assessed strength of the password.'),
  suggestions: z.array(z.string()).describe('Actionable suggestions to improve the password strength. Provide 2-3 short, helpful tips. For very strong passwords, this can be an empty array.'),
});
export type PasswordStrengthOutput = z.infer<typeof PasswordStrengthOutputSchema>;

// The schema for the prompt's input must be an object.
const PasswordStrengthPromptInputSchema = z.object({
    password: z.string().describe('The password to check.')
});

export async function checkPasswordStrength(password: PasswordStrengthInput): Promise<PasswordStrengthOutput> {
  return passwordStrengthFlow(password);
}

const prompt = ai.definePrompt({
  name: 'passwordStrengthPrompt',
  input: {schema: PasswordStrengthPromptInputSchema},
  output: {schema: PasswordStrengthOutputSchema},
  prompt: `You are a password security expert. Analyze the provided password based on common criteria like length, complexity (presence of uppercase, lowercase, numbers, symbols), and common patterns.

Do not mention the password itself in your response.

Based on your analysis, classify its strength as one of: Weak, Moderate, Strong, or Very Strong.

Also, provide a few brief, actionable suggestions for how to improve it. If the password is 'Very Strong', you can provide an empty array for suggestions.

Password to analyze: {{{password}}}`,
});

const passwordStrengthFlow = ai.defineFlow(
  {
    name: 'passwordStrengthFlow',
    inputSchema: PasswordStrengthInputSchema,
    outputSchema: PasswordStrengthOutputSchema,
  },
  async (password) => {
    // A password must be passed. If it is empty, return a default weak state.
    if (!password || password.length === 0) {
      return {
        strength: 'Weak',
        suggestions: ['Enter a password to check its strength.'],
      };
    }

    const {output} = await prompt({ password });
    return output!;
  }
);
