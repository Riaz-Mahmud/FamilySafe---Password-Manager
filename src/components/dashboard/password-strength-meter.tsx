import { cn } from "@/lib/utils";
import type { PasswordStrengthOutput } from "@/ai/flows/password-strength-checker";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

type PasswordStrengthMeterProps = {
  strengthResult: PasswordStrengthOutput | null;
  isChecking: boolean;
};

const strengthLevels: Record<PasswordStrengthOutput['strength'], { color: string; width: string; text: string }> = {
  'Weak': { color: 'bg-destructive', width: 'w-1/4', text: 'Weak' },
  'Moderate': { color: 'bg-yellow-500', width: 'w-2/4', text: 'Moderate' },
  'Strong': { color: 'bg-blue-500', width: 'w-3/4', text: 'Strong' },
  'Very Strong': { color: 'bg-green-500', width: 'w-full', text: 'Very Strong' },
};

export function PasswordStrengthMeter({ strengthResult, isChecking }: PasswordStrengthMeterProps) {
  const level = strengthResult ? strengthLevels[strengthResult.strength] : null;

  return (
    <div className="space-y-2 text-sm p-3 bg-secondary/50 rounded-lg">
      <div className="flex justify-between items-center">
        <span className="font-medium text-muted-foreground">Password Strength:</span>
        {isChecking 
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : level && <span className={cn("font-semibold", level.width === 'w-full' ? 'text-green-500' : 'text-foreground')}>{level.text}</span>
        }
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        {level && <div className={cn("h-2 rounded-full transition-all", level.color, level.width)}></div>}
      </div>
      {!isChecking && strengthResult?.suggestions && strengthResult.suggestions.length > 0 && (
        <ul className="list-none space-y-1 pt-2">
            {strengthResult.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-yellow-500" />
                    <span>{suggestion}</span>
                </li>
            ))}
        </ul>
      )}
      {!isChecking && strengthResult?.strength === 'Very Strong' && (
         <div className="flex items-start gap-2 text-green-500 pt-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            <span>This is a very strong password.</span>
        </div>
      )}
    </div>
  );
}
