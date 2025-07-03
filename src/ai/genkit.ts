
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// This is the global Genkit instance that can be used throughout the application.
// It is initialized with the Google AI plugin.
export const ai = genkit({
  plugins: [googleAI()],
});
