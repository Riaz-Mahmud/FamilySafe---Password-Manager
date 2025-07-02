import type { Credential, FamilyMember } from '@/types';
import { Github, Globe, Bot } from 'lucide-react';

export const mockCredentials: Credential[] = [
  {
    id: '1',
    url: 'https://github.com',
    username: 'developer@example.com',
    password: 'supersecretpassword1',
    notes: 'Personal account for side projects.',
    lastModified: '2023-10-26',
    sharedWith: ['1', '2'],
    icon: Github,
  },
  {
    id: '2',
    url: 'https://google.com',
    username: 'main.account@gmail.com',
    password: 'supersecretpassword2',
    notes: 'Main Google account.',
    lastModified: '2023-10-25',
    sharedWith: ['1'],
    icon: Globe,
  },
  {
    id: '3',
    url: 'https://openai.com',
    username: 'ai-enthusiast@work.com',
    password: 'supersecretpassword3',
    notes: '',
    lastModified: '2023-10-22',
    sharedWith: [],
    icon: Bot,
  },
];

export const mockFamilyMembers: FamilyMember[] = [
  {
    id: '1',
    name: 'Alice',
    avatar: 'https://placehold.co/40x40/b19cd9/121212.png',
  },
  {
    id: '2',
    name: 'Bob',
    avatar: 'https://placehold.co/40x40/6a49bd/FFFFFF.png',
  },
  {
    id: '3',
    name: 'Charlie',
    avatar: 'https://placehold.co/40x40/FFFFFF/121212.png',
  },
];
