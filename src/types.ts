export interface Credential {
  id: string;
  url: string;
  username: string;
  password: string;
  notes: string;
  lastModified: string;
  sharedWith: string[]; // array of family member IDs
  icon: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  avatar: string; // URL to avatar image
}
