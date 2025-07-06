
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

// A simple wordlist for local generation. In a real app, this could be much larger.
const wordList = [
  'apple', 'banana', 'orange', 'grape', 'lemon', 'lime', 'peach', 'plum',
  'house', 'chair', 'table', 'door', 'window', 'roof', 'floor', 'wall',
  'river', 'ocean', 'mountain', 'forest', 'desert', 'island', 'valley', 'canyon',
  'happy', 'strong', 'clever', 'brave', 'shiny', 'quiet', 'bright', 'calm',
  'red', 'blue', 'green', 'yellow', 'purple', 'black', 'white', 'silver'
];

function generateLocalPassphrase(wordCount: number): string {
  const words = [];
  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    words.push(wordList[randomIndex]);
  }
  return words.join('-');
}

type PassphraseGeneratorProps = {
  form: UseFormReturn<any>;
};

export function PassphraseGenerator({ form }: PassphraseGeneratorProps) {
  const [wordCount, setWordCount] = useState(4);
  const { toast } = useToast();

  const handleGenerateAndApply = () => {
    const newPassphrase = generateLocalPassphrase(wordCount);
    form.setValue('password', newPassphrase, { shouldValidate: true, shouldDirty: true });
    toast({
      title: 'Passphrase Generated',
      description: 'A new passphrase has been generated and applied.',
    });
  };

  return (
    <div className="space-y-2 p-3 bg-muted/50 rounded-lg h-full flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h4 className="font-medium">Passphrase Generator</h4>
          <p className="text-xs text-muted-foreground">Create a secure, memorable passphrase locally.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Label htmlFor="word-count" className="text-xs shrink-0">Words:</Label>
          <Select value={String(wordCount)} onValueChange={(value) => setWordCount(Number(value))}>
            <SelectTrigger id="word-count" className="h-8 w-full sm:w-[60px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="6">6</SelectItem>
              <SelectItem value="7">7</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
       <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button type="button" size="sm" className="w-full" onClick={handleGenerateAndApply}>
              <Sparkles className="mr-2 h-4 w-4" /> Generate & Apply
            </Button>
        </div>
    </div>
  );
}
