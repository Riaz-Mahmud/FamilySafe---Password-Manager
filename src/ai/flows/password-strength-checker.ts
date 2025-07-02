'use server';

/**
 * @fileOverview Password strength checker AI agent.
 *
 * - checkPasswordStrength - A function that handles the password strength checking process.
 * - PasswordStrengthInput - The input type for the checkPasswordStrength function.
 * - PasswordStrengthOutput - The return type for the checkPasswordStrength function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PasswordStrengthInputSchema = z.object({
  password: z.string().describe('The password to check.'),
});
export type PasswordStrengthInput = z.infer<typeof PasswordStrengthInputSchema>;

const PasswordStrengthOutputSchema = z.object({
  strength: z.enum(['Weak', 'Moderate', 'Strong', 'Very Strong']).describe('The strength of the password.'),
  suggestions: z.array(z.string()).describe('Suggestions for improving the password strength.'),
});
export type PasswordStrengthOutput = z.infer<typeof PasswordStrengthOutputSchema>;

export async function checkPasswordStrength(input: PasswordStrengthInput): Promise<PasswordStrengthOutput> {
  return checkPasswordStrengthFlow(input);
}

const prompt = ai.definePrompt({
  name: 'passwordStrengthPrompt',
  input: {schema: PasswordStrengthInputSchema},
  output: {schema: PasswordStrengthOutputSchema},
  prompt: `You are a password security expert. Assess the strength of the provided password based on length, character variety (uppercase, lowercase, numbers, symbols), and common patterns.

- Classify the strength as 'Weak', 'Moderate', 'Strong', or 'Very Strong'.
- Provide a concise list of suggestions for improvement if the password is not 'Very Strong'. If it is 'Very Strong', return an empty array for suggestions.

Password: {{{password}}}`,
});

const checkPasswordStrengthFlow = ai.defineFlow(
  {
    name: 'checkPasswordStrengthFlow',
    inputSchema: PasswordStrengthInputSchema,
    outputSchema: PasswordStrengthOutputSchema,
  },
  async input => {
    if (!input.password) {
        return { strength: 'Weak', suggestions: ['Password cannot be empty.'] };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
