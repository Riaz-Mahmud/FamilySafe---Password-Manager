
'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(), // API key is loaded from GOOGLE_API_KEY env var
  ],
  logSinks: ['json'],
  // Store traces in development.
  enableTracing: true,
});
