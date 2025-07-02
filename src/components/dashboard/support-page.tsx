
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const faqs = [
  {
    question: 'How do I add a new password?',
    answer: 'Navigate to the "All Passwords" or "My Passwords" page and click the "Add Credential" button in the top right corner. Fill out the form and click "Save Credential".'
  },
  {
    question: 'How can I share a password with a family member?',
    answer: 'When adding or editing a credential, use the "Share with" dropdown to select the family members you want to grant access to. They must be added to your family group first.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, your data is encrypted and stored securely in our database. We use industry-standard security practices to protect your information.'
  },
  {
    question: 'How do I reset my password?',
    answer: 'You can go to the login page and click "Forgot your password?", or go to the Settings page and click the "Send Password Reset Email" button.'
  }
];

export function SupportPage() {
    const { toast } = useToast();
    const [isSending, setIsSending] = useState(false);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        // Simulate sending a message
        setTimeout(() => {
            setIsSending(false);
            toast({
                title: 'Message Sent!',
                description: 'Our support team will get back to you shortly.',
            });
            (e.target as HTMLFormElement).reset();
        }, 1500);
    };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>
            Find answers to common questions about FamilySafe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Support</CardTitle>
          <CardDescription>
            Can't find an answer? Fill out the form below and we'll get back to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="e.g., Trouble logging in" required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Describe your issue in detail..." required rows={5} />
            </div>
            <Button type="submit" disabled={isSending}>
              {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
