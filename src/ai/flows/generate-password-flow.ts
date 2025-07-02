'use server';
/**
 * @fileOverview A secure password generation AI agent.
 *
 * - generatePassword - A function that handles the password generation process.
 * - GeneratePasswordOutput - The return type for the generatePassword function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePasswordOutputSchema = z.object({
  password: z.string().describe('The generated secure password.'),
});
export type GeneratePasswordOutput = z.infer<typeof GeneratePasswordOutputSchema>;

export async function generatePassword(): Promise<GeneratePasswordOutput> {
  return generatePasswordFlow();
}

const prompt = ai.definePrompt({
  name: 'generatePasswordPrompt',
  output: {schema: GeneratePasswordOutputSchema},
  prompt: `You are a password security expert. Your task is to generate a single, secure, and random password.

The password must meet the following criteria:
- It must be exactly 16 characters long.
- It must include a mix of uppercase letters, lowercase letters, numbers, and special characters (e.g., !@#$%^&*).
- It should be completely random and not based on any patterns or dictionary words.

Generate the password and return it in the 'password' field.`,
});

const generatePasswordFlow = ai.defineFlow(
  {
    name: 'generatePasswordFlow',
    outputSchema: GeneratePasswordOutputSchema,
  },
  async () => {
    const {output} = await prompt();
    return output!;
  }
);
