
export interface Credential {
  id: string;
  url: string;
  username: string;
  password: string;
  notes: string;
  lastModified: string;
  createdAt: string;
  sharedWith: string[]; // array of family member IDs
  icon: string;
  tags: string[];
  expiryMonths?: number;
  safeForTravel?: boolean;
  isShared?: boolean;
  sharedTo?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  email?: string;
  avatar: string; // URL to avatar image
  status: 'pending' | 'active' | 'local';
  uid?: string; // The user ID of the family member after they sign up
}

export interface AuditLog {
  id:string;
  action: string;
  description: string;
  timestamp: string;
}

export interface DeviceSession {
  id: string;
  userAgent: string;
  lastSeen: string;
  createdAt: string;
  isCurrent: boolean;
}
