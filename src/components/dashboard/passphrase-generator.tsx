
'use client';

import { useState } from 'react';
import { generatePassphrase, type PassphraseGeneratorOutput } from '@/ai/flows/passphrase-generator-flow';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Check, Copy, Info, Loader2, Sparkles } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

type PassphraseGeneratorProps = {
  form: UseFormReturn<any>;
};

export function PassphraseGenerator({ form }: PassphraseGeneratorProps) {
  const [passphraseResult, setPassphraseResult] = useState<PassphraseGeneratorOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [wordCount, setWordCount] = useState(4);
  const { toast } = useToast();

  const handleGeneratePassphrase = async () => {
    setIsGenerating(true);
    setPassphraseResult(null);
    try {
      const result = await generatePassphrase({ numberOfWords: wordCount });
      setPassphraseResult(result);
    } catch (error) {
      console.error("Error generating passphrase:", error);
      toast({
        title: 'Error',
        description: 'Failed to generate a passphrase. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: `${field} has been copied successfully.`,
    });
  };

  return (
    <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h4 className="font-medium">Passphrase Generator</h4>
          <p className="text-xs text-muted-foreground">Create a strong, memorable passphrase.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Label htmlFor="word-count" className="text-xs shrink-0">Words:</Label>
          <Select value={String(wordCount)} onValueChange={(value) => setWordCount(Number(value))} disabled={isGenerating}>
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
          <Button type="button" variant="outline" size="sm" onClick={handleGeneratePassphrase} disabled={isGenerating} className="w-full sm:w-auto">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate
          </Button>
        </div>
      </div>

      {isGenerating && (
        <div className="pt-2 space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      )}

      {passphraseResult && (
        <div className="pt-2 space-y-2">
          <div className="p-3 bg-background rounded-md border text-center">
            <p className="font-mono text-lg tracking-wider text-primary break-all">{passphraseResult.passphrase}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="button" size="sm" className="w-full" onClick={() => {
              form.setValue('password', passphraseResult.passphrase, { shouldValidate: true });
              toast({ title: 'Passphrase Applied', description: 'The new passphrase has been set.' });
            }}>
              <Check className="mr-2 h-4 w-4" /> Use Passphrase
            </Button>
            <Button type="button" size="sm" variant="secondary" className="w-full" onClick={() => handleCopy(passphraseResult.passphrase, 'Passphrase')}>
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground pt-1">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{passphraseResult.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
}
