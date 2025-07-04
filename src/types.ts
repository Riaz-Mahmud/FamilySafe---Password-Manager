

export interface Vault {
  id: string;
  name: string;
  ownerUid: string;
}

export interface Credential {
  id: string;
  url: string;
  username: string;
  password: string;
  notes: string;
  lastModified?: Date;
  createdAt?: Date;
  icon: string;
  tags: string[];
  expiryMonths?: number;
  safeForTravel?: boolean;
  vaultId: string;
  sharedWith: string[];
  ownerId?: string;
  ownerName?: string;
  originalId?: string;
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
  timestamp?: Date;
}

export interface DeviceSession {
  id: string;
  userAgent: string;
  lastSeen?: Date;
  createdAt?: Date;
  isCurrent: boolean;
}

export interface SecureDocument {
  id: string;
  name: string;
  notes: string; // encrypted
  fileDataUrl: string; // encrypted
  fileType: string;
  fileSize: number;
  lastModified?: Date;
  createdAt?: Date;
  icon: string; // lucide icon name
  vaultId: string;
  sharedWith: string[];
  ownerId?: string;
  ownerName?: string;
  originalId?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'share_credential' | 'share_document' | 'welcome' | 'info';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
  from?: {
    name: string;
    avatar?: string;
  };
}
