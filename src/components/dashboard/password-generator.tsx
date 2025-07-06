'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { Slider } from '../ui/slider';
import { Checkbox } from '../ui/checkbox';

const CHARSETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

type PasswordGeneratorProps = {
  form: UseFormReturn<any>;
};

export function PasswordGenerator({ form }: PasswordGeneratorProps) {
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const { toast } = useToast();

  const generatePassword = () => {
    let charset = CHARSETS.lowercase;
    if (includeUppercase) charset += CHARSETS.uppercase;
    if (includeNumbers) charset += CHARSETS.numbers;
    if (includeSymbols) charset += CHARSETS.symbols;

    if (charset.length === 0) {
        toast({
            title: 'Cannot Generate Password',
            description: 'Please select at least one character type.',
            variant: 'destructive',
        });
        return '';
    }

    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  };

  const handleGenerateAndApply = () => {
    const newPassword = generatePassword();
    if(newPassword) {
        form.setValue('password', newPassword, { shouldValidate: true, shouldDirty: true });
        toast({
          title: 'Password Generated',
          description: 'A new random password has been generated and applied.',
        });
    }
  };

  return (
    <div className="space-y-4 p-3 bg-muted/50 rounded-lg h-full flex flex-col justify-between">
        <div>
            <h4 className="font-medium">Random Password Generator</h4>
            <p className="text-xs text-muted-foreground">Create a strong, random password locally.</p>
        </div>

        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="password-length" className="text-xs">Length: {length}</Label>
                <Slider
                    id="password-length"
                    min={8}
                    max={32}
                    step={1}
                    value={[length]}
                    onValueChange={(value) => setLength(value[0])}
                />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
                 <div className="flex items-center space-x-2">
                    <Checkbox id="include-uppercase" checked={includeUppercase} onCheckedChange={(checked) => setIncludeUppercase(Boolean(checked))} />
                    <Label htmlFor="include-uppercase" className="font-normal text-xs leading-none">A-Z</Label>
                </div>
                 <div className="flex items-center space-x-2">
                    <Checkbox id="include-numbers" checked={includeNumbers} onCheckedChange={(checked) => setIncludeNumbers(Boolean(checked))} />
                    <Label htmlFor="include-numbers" className="font-normal text-xs leading-none">0-9</Label>
                </div>
                 <div className="flex items-center space-x-2">
                    <Checkbox id="include-symbols" checked={includeSymbols} onCheckedChange={(checked) => setIncludeSymbols(Boolean(checked))} />
                    <Label htmlFor="include-symbols" className="font-normal text-xs leading-none">!@#</Label>
                </div>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button type="button" size="sm" className="w-full" onClick={handleGenerateAndApply}>
              <RefreshCw className="mr-2 h-4 w-4" /> Generate & Apply
            </Button>
        </div>
    </div>
  );
}
