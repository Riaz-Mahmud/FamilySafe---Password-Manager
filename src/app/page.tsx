

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  SidebarGroup,
  SidebarMenuAction,
  SidebarGroupLabel,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  Home,
  Shield,
  Users,
  Settings,
  Plus,
  Search,
  LogOut,
  LifeBuoy,
  Loader2,
  ShieldCheck,
  History,
  MonitorSmartphone,
  Plane,
  FolderLock,
  Trash,
  GanttChartSquare,
  BadgeInfo,
  Album,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AddPasswordDialog } from '@/components/dashboard/add-password-dialog';
import { PasswordList } from '@/components/dashboard/password-list';
import { FamilyMembersList } from '@/components/dashboard/family-members-list';
import type { Credential, FamilyMember, AuditLog, DeviceSession, SecureDocument, Vault, Notification, Memory } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { AddFamilyMemberDialog } from '@/components/dashboard/add-family-member-dialog';
import {
  getCredentials,
  addCredential,
  updateCredential,
  deleteCredential,
  getFamilyMembers,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  addAuditLog,
  getAuditLogs,
  getDeviceSessions,
  revokeDeviceSession,
  getSecureDocuments,
  addSecureDocument,
  updateSecureDocument,
  deleteSecureDocument,
  createVault,
  getVaults,
  deleteVault,
  getNotifications,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getMemories,
  addMemory,
  updateMemory,
  deleteMemory,
} from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-provider';
import { signOutUser } from '@/services/auth';
import { SettingsPage } from '@/components/dashboard/settings-page';
import { SupportPage } from '@/components/dashboard/support-page';
import { SendEmailDialog } from '@/components/dashboard/send-email-dialog';
import { PasswordHealthReportPage } from '@/components/dashboard/security-health-page';
import { AuditLogsPage } from '@/components/dashboard/audit-logs-page';
import { DeviceManagementPage } from '@/components/dashboard/device-management-page';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { sendInvitationEmailAction, shareItemAction } from '@/app/actions';
import { AddSecureDocumentDialog } from '@/components/dashboard/add-secure-document-dialog';
import { SecureDocumentList } from '@/components/dashboard/secure-document-list';
import { SecureDocumentPreviewDialog } from '@/components/dashboard/secure-document-preview-dialog';
import { AddVaultDialog } from '@/components/dashboard/add-vault-dialog';
import { encryptData } from '@/lib/crypto';
import { NotificationsPopover } from '@/components/dashboard/notifications-popover';
import { AddMemoryDialog } from '@/components/dashboard/add-memory-dialog';
import { MemoryList } from '@/components/dashboard/memory-list';


export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Data state
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [allOwnedCredentials, setAllOwnedCredentials] = useState<Credential[]>([]);
  const [allOwnedDocuments, setAllOwnedDocuments] = useState<SecureDocument[]>([]);
  const [allOwnedMemories, setAllOwnedMemories] = useState<Memory[]>([]);
  const [allSharedCredentials, setAllSharedCredentials] = useState<Credential[]>([]);
  const [allSharedDocuments, setAllSharedDocuments] = useState<SecureDocument[]>([]);
  const [allSharedMemories, setAllSharedMemories] = useState<Memory[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [deviceSessions, setDeviceSessions] = useState<DeviceSession[]>([]);

  // UI State
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isItemsLoading, setItemsLoading] = useState(true);
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState('All Passwords');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTravelModeActive, setTravelModeActive] = useState(false);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<FamilyMember | null>(null);

  // Dialog state
  const [isAddPasswordDialogOpen, setAddPasswordDialogOpen] = useState(false);
  const [isAddDocumentDialogOpen, setAddDocumentDialogOpen] = useState(false);
  const [isAddMemoryDialogOpen, setAddMemoryDialogOpen] = useState(false);
  const [isAddFamilyMemberDialogOpen, setAddFamilyMemberDialogOpen] = useState(false);
  const [isAddVaultDialogOpen, setAddVaultDialogOpen] = useState(false);
  const [isSendEmailDialogOpen, setSendEmailDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setPreviewDialogOpen] = useState(false);
  
  // Editing and Deleting state
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editingDocument, setEditingDocument] = useState<SecureDocument | null>(null);
  const [deleteDocumentTargetId, setDeleteDocumentTargetId] = useState<string | null>(null);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [deleteMemoryTargetId, setDeleteMemoryTargetId] = useState<string | null>(null);
  const [editingFamilyMember, setEditingFamilyMember] = useState<FamilyMember | null>(null);
  const [deleteFamilyMemberTargetId, setDeleteFamilyMemberTargetId] = useState<string | null>(null);
  const [vaultToDelete, setVaultToDelete] = useState<Vault | null>(null);
  
  // Data to pass to dialogs
  const [credentialToSend, setCredentialToSend] = useState<Credential | null>(null);
  const [documentToPreview, setDocumentToPreview] = useState<SecureDocument | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const savedTravelMode = localStorage.getItem('travelMode');
    if (savedTravelMode) {
      setTravelModeActive(JSON.parse(savedTravelMode));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('travelMode', JSON.stringify(isTravelModeActive));
  }, [isTravelModeActive]);
  
  // Effect for loading primary user data (non-item specific)
  useEffect(() => {
    if (!user?.uid) {
      setFamilyMembers([]);
      setAuditLogs([]);
      setDeviceSessions([]);
      setNotifications([]);
      return;
    }

    const unsubscribeFamilyMembers = getFamilyMembers(user.uid, setFamilyMembers);
    const unsubscribeAuditLogs = getAuditLogs(user.uid, setAuditLogs);
    const currentSessionId = localStorage.getItem('sessionId');
    const unsubscribeSessions = getDeviceSessions(user.uid, currentSessionId, setDeviceSessions);
    const unsubscribeNotifications = getNotifications(user.uid, setNotifications);

    return () => {
      unsubscribeFamilyMembers();
      unsubscribeAuditLogs();
      unsubscribeSessions();
      unsubscribeNotifications();
    };
  }, [user?.uid]);
  
  // Effect for loading vaults and setting up the initial state
  useEffect(() => {
    if (!user?.uid) {
      setIsDataLoading(false);
      return;
    }
    
    setIsDataLoading(true);
    const unsubscribe = getVaults(user.uid, async (fetchedVaults) => {
      if (fetchedVaults.length === 0 && !authLoading) {
        // This is a new user, create a personal vault for them
        const newVaultId = await createVault(user.uid, 'Personal');
        // Add a welcome notification for the new user
        await addNotification(user.uid, {
          userId: user.uid,
          type: 'welcome',
          title: 'Welcome to FamilySafe!',
          message: 'Click "Add Credential" to save your first password.',
          link: '/',
          read: false,
          createdAt: new Date()
        });
        // The listener will pick up the new vault, so no need to set state here.
      } else {
        setVaults(fetchedVaults);
        if (!selectedVaultId && fetchedVaults.length > 0) {
          // If no vault is selected, default to the first one
          setSelectedVaultId(fetchedVaults[0].id);
        }
      }
      setIsDataLoading(false);
    });
    return unsubscribe;
  }, [user?.uid, authLoading]);
  
  // Effect for loading ALL items for the user (owned and shared)
  useEffect(() => {
    if (!user?.uid) {
      setAllOwnedCredentials([]);
      setAllOwnedDocuments([]);
      setAllOwnedMemories([]);
      setAllSharedCredentials([]);
      setAllSharedDocuments([]);
      setAllSharedMemories([]);
      return;
    }
    
    setItemsLoading(true);
    const unsubscribeCreds = getCredentials(user.uid, (allCreds) => {
      setAllOwnedCredentials(allCreds.filter(c => !c.ownerId));
      setAllSharedCredentials(allCreds.filter(c => !!c.ownerId));
      setItemsLoading(false);
    });
    
    const unsubscribeDocs = getSecureDocuments(user.uid, (allDocs) => {
      setAllOwnedDocuments(allDocs.filter(d => !d.ownerId));
      setAllSharedDocuments(allDocs.filter(d => !!d.ownerId));
      setItemsLoading(false);
    });

    const unsubscribeMems = getMemories(user.uid, (allMems) => {
      setAllOwnedMemories(allMems.filter(m => !m.ownerId));
      setAllSharedMemories(allMems.filter(m => !!m.ownerId));
      setItemsLoading(false);
    });

    return () => {
      unsubscribeCreds();
      unsubscribeDocs();
      unsubscribeMems();
    };
  }, [user?.uid]);


  const handleSignOut = async () => {
    if(!user) return;
    await addAuditLog(user.uid, 'User Signed Out', 'User signed out from the application.');
    await signOutUser();
    router.push('/login');
  };

  // --- Vault Actions ---
  const handleAddVault = async (name: string) => {
    if (!user) return;
    try {
      const newVaultId = await createVault(user.uid, name);
      await addAuditLog(user.uid, 'Create Vault', `Created vault named "${name}".`);
      toast({
        title: 'Vault Created',
        description: `The "${name}" vault has been created.`,
      });
      setSelectedVaultId(newVaultId);
    } catch (error) {
       console.error("Error creating vault:", error);
       toast({ title: 'Error', description: 'Failed to create vault.', variant: 'destructive' });
    }
  };

  const handleDeleteVault = async () => {
    if (!vaultToDelete || !user) return;
    try {
      await deleteVault(user.uid, vaultToDelete.id);
      await addAuditLog(user.uid, 'Delete Vault', `Deleted vault named "${vaultToDelete.name}".`);
      toast({
        title: 'Vault Deleted',
        description: `The "${vaultToDelete.name}" vault and all its contents have been permanently deleted.`,
        variant: 'destructive',
      });
      setSelectedVaultId(null); // Will trigger effect to select first available vault
    } catch (error) {
       console.error("Error deleting vault:", error);
       toast({ title: 'Error', description: 'Failed to delete vault.', variant: 'destructive' });
    } finally {
      setVaultToDelete(null);
    }
  };
  
  const handleShareItem = async (
    itemData: any,
    itemType: 'credential' | 'document' | 'memory',
    recipients: FamilyMember[]
  ) => {
    if (!user) return;

    let sharedCount = 0;
    for (const recipient of recipients) {
      if (!recipient.uid || recipient.status !== 'active') {
        toast({
          title: 'Sharing Skipped',
          description: `Cannot share with ${recipient.name} as their account is not active. They need to sign up first.`,
          variant: 'destructive',
          duration: 8000,
        });
        continue;
      }

      // Prepare data for sharing
      let encryptedForRecipient;
      const baseData = {
        ...itemData,
        originalId: itemData.id,
        ownerId: user.uid,
        ownerName: user.displayName || user.email,
      };
      delete baseData.id;
      delete baseData.sharedWith;

      // Encrypt data with recipient's key (their UID)
      if (itemType === 'credential') {
        encryptedForRecipient = {
          ...baseData,
          username: encryptData(baseData.username, recipient.uid),
          password: encryptData(baseData.password, recipient.uid),
          notes: encryptData(baseData.notes || '', recipient.uid),
        };
      } else if (itemType === 'document') {
        encryptedForRecipient = {
          ...baseData,
          notes: encryptData(baseData.notes || '', recipient.uid),
          fileDataUrl: encryptData(baseData.fileDataUrl, recipient.uid),
        };
      } else { // memory
        encryptedForRecipient = {
            ...baseData,
            story: encryptData(baseData.story, recipient.uid),
            photoUrl: baseData.photoUrl ? encryptData(baseData.photoUrl, recipient.uid) : '',
        }
      }

      try {
        // Prepare notification data
        const notificationData = {
          userId: recipient.uid,
          type: itemType === 'credential' ? 'share_credential' : (itemType === 'document' ? 'share_document' : 'info'),
          title: `New ${itemType} shared`,
          message: `${user.displayName || user.email} shared "${itemData.name || itemData.url || itemData.title}" with you.`,
          link: `/`, // Update link based on item type
          from: {
            name: user.displayName || user.email || 'A User',
            avatar: user.photoURL || undefined,
          },
        };

        // Use the new server action
        const result = await shareItemAction({
          recipientUid: recipient.uid,
          itemType,
          itemData: encryptedForRecipient,
          notificationData: notificationData,
        });

        if (!result.success) {
          throw new Error(result.message);
        }

        sharedCount++;
      } catch (error: any) {
        console.error(`Failed to share with ${recipient.name}`, error);
        toast({
          title: 'Sharing Error',
          description: error.message || `Could not share with ${recipient.name}.`,
          variant: 'destructive',
        });
      }
    }

    if (sharedCount > 0) {
      const itemTypeName = itemType.charAt(0).toUpperCase() + itemType.slice(1);
      toast({
        title: 'Shared Successfully',
        description: `${itemTypeName} shared with ${sharedCount} member(s).`,
      });
    }
  };


  // --- Credential Actions ---
  const handleAddCredential = async (newCredential: Omit<Credential, 'id' | 'lastModified' | 'createdAt' | 'vaultId'>) => {
    if(!user || !selectedVaultId) return;
    try {
      const newCredentialId = await addCredential(user.uid, selectedVaultId, newCredential);
      await addAuditLog(user.uid, 'Create Credential', `Saved credential for ${newCredential.url}.`);
      toast({
        title: 'Credential Added',
        description: 'The new credential has been saved successfully.',
      });
      
      const recipients = familyMembers.filter(m => newCredential.sharedWith?.includes(m.id));
      if (recipients.length > 0) {
        const credentialToShare = { ...newCredential, id: newCredentialId };
        await handleShareItem(credentialToShare, 'credential', recipients);
      }
    } catch (error) {
      console.error("Error adding credential:", error);
      toast({ title: 'Error', description: 'Failed to add credential.', variant: 'destructive' });
    }
  };

  const handleUpdateCredential = async (updatedCredential: Credential) => {
    if(!user) return;
    try {
      const { id, ...dataToUpdate } = updatedCredential;
      await updateCredential(user.uid, id, dataToUpdate);
      await addAuditLog(user.uid, 'Update Credential', `Updated credential for ${updatedCredential.url}.`);
      toast({
        title: 'Credential Updated',
        description: 'The credential has been updated successfully.',
      });
      
      const recipients = familyMembers.filter(m => updatedCredential.sharedWith?.includes(m.id));
      if (recipients.length > 0) {
        await handleShareItem(updatedCredential, 'credential', recipients);
      }
    } catch (error) {
      console.error("Error updating credential:", error);
      toast({ title: 'Error', description: 'Failed to update credential.', variant: 'destructive' });
    }
  };

  const handleDeleteCredential = async () => {
    if (deleteTargetId && user) {
      const allCreds = [...allOwnedCredentials, ...allSharedCredentials];
      const credToDelete = allCreds.find(c => c.id === deleteTargetId);
      try {
        await deleteCredential(user.uid, deleteTargetId);
         if (credToDelete) {
           await addAuditLog(user.uid, 'Delete Credential', `Deleted credential for ${credToDelete.url}.`);
        }
        toast({
          title: 'Credential Deleted',
          description: 'The credential has been permanently deleted.',
          variant: 'destructive',
        });
      } catch (error) {
        console.error("Error deleting credential:", error);
        toast({ title: 'Error', description: 'Failed to delete credential.', variant: 'destructive' });
      } finally {
        setDeleteTargetId(null);
      }
    }
  };

  const handleAddSecureDocument = async (newDocument: Omit<SecureDocument, 'id' | 'lastModified' | 'createdAt' | 'vaultId'>) => {
    if(!user || !selectedVaultId) return;
    try {
      const newDocumentId = await addSecureDocument(user.uid, selectedVaultId, newDocument);
      await addAuditLog(user.uid, 'Create Secure Document', `Saved document named ${newDocument.name}.`);
      toast({
        title: 'Document Added',
        description: 'The new secure document has been saved successfully.',
      });

      const recipients = familyMembers.filter(m => newDocument.sharedWith?.includes(m.id));
      if (recipients.length > 0) {
        const documentToShare = { ...newDocument, id: newDocumentId };
        await handleShareItem(documentToShare, 'document', recipients);
      }
    } catch (error) {
      console.error("Error adding document:", error);
      toast({ title: 'Error', description: 'Failed to add secure document.', variant: 'destructive' });
    }
  };

  const handleUpdateSecureDocument = async (updatedDocument: SecureDocument) => {
    if(!user) return;
    try {
      const { id, ...dataToUpdate } = updatedDocument;
      await updateSecureDocument(user.uid, id, dataToUpdate);
      await addAuditLog(user.uid, 'Update Secure Document', `Updated document named ${updatedDocument.name}.`);
      toast({
        title: 'Document Updated',
        description: 'The secure document has been updated successfully.',
      });
    } catch (error) {
      console.error("Error updating document:", error);
      toast({ title: 'Error', description: 'Failed to update secure document.', variant: 'destructive' });
    }
  };

  const handleDeleteSecureDocument = async () => {
    if (deleteDocumentTargetId && user) {
      const allDocs = [...allOwnedDocuments, ...allSharedDocuments];
      const docToDelete = allDocs.find(d => d.id === deleteDocumentTargetId);
      try {
        await deleteSecureDocument(user.uid, deleteDocumentTargetId);
        if (docToDelete) {
           await addAuditLog(user.uid, 'Delete Secure Document', `Deleted document named ${docToDelete.name}.`);
        }
        toast({
          title: 'Document Deleted',
          description: 'The secure document has been permanently deleted.',
          variant: 'destructive',
        });
      } catch (error) {
        console.error("Error deleting document:", error);
        toast({ title: 'Error', description: 'Failed to delete secure document.', variant: 'destructive' });
      } finally {
        setDeleteDocumentTargetId(null);
      }
    }
  };

  // --- Memory Actions ---
  const handleAddMemory = async (newMemory: Omit<Memory, 'id' | 'lastModified' | 'createdAt' | 'vaultId'>) => {
    if (!user || !selectedVaultId) return;
    try {
      const newMemoryId = await addMemory(user.uid, selectedVaultId, newMemory);
      await addAuditLog(user.uid, 'Create Memory', `Saved memory titled "${newMemory.title}".`);
      toast({
        title: 'Memory Added',
        description: 'The new memory has been saved successfully.',
      });

      const recipients = familyMembers.filter(m => newMemory.sharedWith?.includes(m.id));
      if (recipients.length > 0) {
        const memoryToShare = { ...newMemory, id: newMemoryId };
        await handleShareItem(memoryToShare, 'memory', recipients);
      }
    } catch (error) {
      console.error("Error adding memory:", error);
      toast({ title: 'Error', description: 'Failed to add memory.', variant: 'destructive' });
    }
  };

  const handleUpdateMemory = async (updatedMemory: Memory) => {
    if (!user) return;
    try {
      const { id, ...dataToUpdate } = updatedMemory;
      await updateMemory(user.uid, id, dataToUpdate);
      await addAuditLog(user.uid, 'Update Memory', `Updated memory titled "${updatedMemory.title}".`);
      toast({
        title: 'Memory Updated',
        description: 'The memory has been updated successfully.',
      });
    } catch (error) {
      console.error("Error updating memory:", error);
      toast({ title: 'Error', description: 'Failed to update memory.', variant: 'destructive' });
    }
  };

  const handleDeleteMemory = async () => {
    if (deleteMemoryTargetId && user) {
      const allMems = [...allOwnedMemories, ...allSharedMemories];
      const memToDelete = allMems.find(d => d.id === deleteMemoryTargetId);
      try {
        await deleteMemory(user.uid, deleteMemoryTargetId);
        if (memToDelete) {
           await addAuditLog(user.uid, 'Delete Memory', `Deleted memory titled "${memToDelete.title}".`);
        }
        toast({
          title: 'Memory Deleted',
          description: 'The memory has been permanently deleted.',
          variant: 'destructive',
        });
      } catch (error) {
        console.error("Error deleting memory:", error);
        toast({ title: 'Error', description: 'Failed to delete memory.', variant: 'destructive' });
      } finally {
        setDeleteMemoryTargetId(null);
      }
    }
  };
  
  const handleAddFamilyMember = async (memberData: Omit<FamilyMember, 'id' | 'avatar' | 'uid'> & { sendInvite?: boolean }) => {
    if (!user) return;
    try {
        const memberToAdd = {
            name: memberData.name,
            email: memberData.email,
            avatar: `https://placehold.co/40x40.png`,
            status: memberData.status,
        };

        await addFamilyMember(user.uid, memberToAdd);
        
        if (memberData.status === 'local') {
            await addAuditLog(user.uid, 'Create Local Member', `Added ${memberData.name} as a local-only member.`);
            toast({
                title: 'Local Member Added',
                description: `${memberData.name} has been added for organizational purposes.`,
            });
            return;
        }

        await addAuditLog(user.uid, 'Create Family Member', `Added ${memberData.name} to the family group.`);

        if (memberData.email && memberData.sendInvite && typeof window !== 'undefined') {
            const result = await sendInvitationEmailAction({
                email: memberData.email,
                referrerName: user.displayName || 'A friend',
                referralLink: `${window.location.origin}/signup`,
            });

            if (result.success) {
                toast({
                    title: 'Family Member Invited',
                    description: `An invitation has been sent to ${memberData.name}. Their status will become active once they sign up.`,
                });
            } else {
                toast({
                    title: 'Member Added (Invite Failed)',
                    description: `${memberData.name} was added, but the invite email failed: ${result.message}`,
                    variant: 'destructive',
                    duration: 8000,
                });
            }
        } else {
            toast({
                title: 'Family Member Added',
                description: `${memberData.name} has been added. Their account will be linked automatically when they next sign in.`,
            });
        }
    } catch (error) {
        console.error("Error adding family member:", error);
        toast({ title: 'Error', description: 'Failed to add family member.', variant: 'destructive' });
    }
  };

  const handleUpdateFamilyMember = async (updatedMember: FamilyMember) => {
    if(!user) return;
    try {
        const memberToUpdate: Partial<FamilyMember> = { ...updatedMember };
        
        if (!memberToUpdate.email) {
            memberToUpdate.status = 'local';
            delete memberToUpdate.uid;
        }

        await updateFamilyMember(user.uid, updatedMember.id, memberToUpdate);
        await addAuditLog(user.uid, 'Update Family Member', `Updated details for ${updatedMember.name}.`);
        toast({
            title: 'Family Member Updated',
            description: 'The member details have been updated successfully.',
        });
    } catch (error)
    {
        console.error("Error updating family member:", error);
        toast({ title: 'Error', description: 'Failed to update family member.', variant: 'destructive' });
    } finally {
      setEditingFamilyMember(null);
      setAddFamilyMemberDialogOpen(false);
    }
  };

  const handleDeleteFamilyMember = async () => {
    if (deleteFamilyMemberTargetId && user) {
       const memberToDelete = familyMembers.find(m => m.id === deleteFamilyMemberTargetId);
      try {
          await deleteFamilyMember(user.uid, deleteFamilyMemberTargetId);
          if (memberToDelete) {
             await addAuditLog(user.uid, 'Delete Family Member', `Removed ${memberToDelete.name} from the family group.`);
          }
          toast({
              title: 'Family Member Removed',
              description: 'The family member has been removed.',
              variant: 'destructive',
          });
      } catch (error) {
          console.error("Error deleting family member:", error);
          toast({ title: 'Error', description: 'Failed to remove family member.', variant: 'destructive' });
      } finally {
          setDeleteFamilyMemberTargetId(null);
      }
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!user) return;
    try {
      await revokeDeviceSession(user.uid, sessionId);
      await addAuditLog(user.uid, 'Device Revoked', `Revoked access for a device session.`);
      toast({
        title: 'Device Revoked',
        description: 'The device session has been revoked.',
      });
    } catch (error) {
      console.error("Error revoking session:", error);
      toast({ title: 'Error', description: 'Failed to revoke device session.', variant: 'destructive' });
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    if (!user) return;
    await markNotificationAsRead(user.uid, notificationId);
  };

  const handleMarkAllNotificationsAsRead = async () => {
      if (!user) return;
      await markAllNotificationsAsRead(user.uid);
  };

  const openAddPasswordDialog = () => {
    setEditingCredential(null);
    setAddPasswordDialogOpen(true);
  };

  const openEditPasswordDialog = (credential: Credential) => {
    setEditingCredential(credential);
    setAddPasswordDialogOpen(true);
  };

  const handlePasswordDialogChange = (open: boolean) => {
    if (!open) setEditingCredential(null);
    setAddPasswordDialogOpen(open);
  };
  
  const openAddDocumentDialog = () => {
    setEditingDocument(null);
    setAddDocumentDialogOpen(true);
  };

  const openEditDocumentDialog = (doc: SecureDocument) => {
    setEditingDocument(doc);
    setAddDocumentDialogOpen(true);
  };

  const handleDocumentDialogChange = (open: boolean) => {
    if (!open) setEditingDocument(null);
    setAddDocumentDialogOpen(open);
  };

  const openAddMemoryDialog = () => {
    setEditingMemory(null);
    setAddMemoryDialogOpen(true);
  };

  const openEditMemoryDialog = (memory: Memory) => {
    setEditingMemory(memory);
    setAddMemoryDialogOpen(true);
  };

  const handleMemoryDialogChange = (open: boolean) => {
    if (!open) setEditingMemory(null);
    setAddMemoryDialogOpen(open);
  };
  
  const openPreviewDialog = (doc: SecureDocument) => {
    setDocumentToPreview(doc);
    setPreviewDialogOpen(true);
  };

  const handlePreviewDialogChange = (open: boolean) => {
    if (!open) setDocumentToPreview(null);
    setPreviewDialogOpen(open);
  };

  const openAddFamilyMemberDialog = () => {
    setEditingFamilyMember(null);
    setAddFamilyMemberDialogOpen(true);
  };

  const openEditFamilyMemberDialog = (member: FamilyMember) => {
    setEditingFamilyMember(member);
    setAddFamilyMemberDialogOpen(true);
  };

  const handleFamilyDialogChange = (open: boolean) => {
    if (!open) setEditingFamilyMember(null);
    setAddFamilyMemberDialogOpen(open);
  };
  
  const openSendEmailDialog = (credential: Credential) => {
    setCredentialToSend(credential);
    setSendEmailDialogOpen(true);
  };

  const handleMenuClick = (menu: string) => {
    setActiveMenu(menu);
    setSearchTerm('');
    setSelectedFamilyMember(null);
  };

  const handleVaultSelect = (vaultId: string) => {
    setSelectedVaultId(vaultId);
    setActiveMenu('All Items');
    setSearchTerm('');
    setSelectedFamilyMember(null);
  };
  
  const handleFamilyMemberSelect = (memberId: string) => {
    const member = familyMembers.find((m) => m.id === memberId);
    if (member) {
        setSelectedFamilyMember(member);
        setActiveMenu('SharedWithFamilyMember');
        setSearchTerm('');
    }
  };

  // --- Derived State for Filtering ---
  const vaultCredentials = allOwnedCredentials.filter(c => c.vaultId === selectedVaultId);
  const vaultDocuments = allOwnedDocuments.filter(d => d.vaultId === selectedVaultId);
  const vaultMemories = allOwnedMemories.filter(m => m.vaultId === selectedVaultId);

  const credentialsToDisplay = activeMenu === 'Shared Passwords' ? allSharedCredentials : vaultCredentials;
  const documentsToDisplay = activeMenu === 'Shared Documents' ? allSharedDocuments : vaultDocuments;
  const memoriesToDisplay = activeMenu === 'Shared Memories' ? allSharedMemories : vaultMemories;

  const filteredCredentials = credentialsToDisplay.filter(credential => {
      if (isTravelModeActive && !credential.safeForTravel) return false;
      if (searchTerm) {
          const lowerCaseSearchTerm = searchTerm.toLowerCase();
          return credential.url.toLowerCase().includes(lowerCaseSearchTerm) ||
                 credential.username.toLowerCase().includes(lowerCaseSearchTerm) ||
                 (credential.tags && credential.tags.some(tag => tag.toLowerCase().includes(lowerCaseSearchTerm)));
      }
      return true;
  });

  const filteredDocuments = documentsToDisplay.filter(doc => {
      if (searchTerm) {
          const lowerCaseSearchTerm = searchTerm.toLowerCase();
          return doc.name.toLowerCase().includes(lowerCaseSearchTerm) ||
                 doc.fileType.toLowerCase().includes(lowerCaseSearchTerm);
      }
      return true;
  });

  const filteredMemories = memoriesToDisplay.filter(mem => {
    if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return mem.title.toLowerCase().includes(lowerCaseSearchTerm) ||
               (mem.tags && mem.tags.some(tag => tag.toLowerCase().includes(lowerCaseSearchTerm)));
    }
    return true;
  });

  if (authLoading || isDataLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const selectedVault = vaults.find(v => v.id === selectedVaultId);

  const renderContent = () => {
    if (isItemsLoading) {
       return (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      );
    }
    
    switch (activeMenu) {
      case 'All Items':
        return (
          <div className="space-y-8">
            <PasswordList
              credentials={filteredCredentials}
              onEdit={openEditPasswordDialog}
              onDelete={setDeleteTargetId}
              onSend={openSendEmailDialog}
              isTravelModeActive={isTravelModeActive}
            />
            <SecureDocumentList
              documents={filteredDocuments}
              onEdit={openEditDocumentDialog}
              onDelete={setDeleteDocumentTargetId}
              onPreview={openPreviewDialog}
            />
            <MemoryList
                memories={filteredMemories}
                onEdit={openEditMemoryDialog}
                onDelete={setDeleteMemoryTargetId}
            />
          </div>
        );
      case 'All Passwords':
        return (
          <PasswordList
            credentials={filteredCredentials}
            onEdit={openEditPasswordDialog}
            onDelete={setDeleteTargetId}
            onSend={openSendEmailDialog}
            isTravelModeActive={isTravelModeActive}
          />
        );
      case 'Secure Documents':
        return (
          <SecureDocumentList
            documents={filteredDocuments}
            onEdit={openEditDocumentDialog}
            onDelete={setDeleteDocumentTargetId}
            onPreview={openPreviewDialog}
          />
        );
      case 'Memories':
        return (
            <MemoryList
                memories={filteredMemories}
                onEdit={openEditMemoryDialog}
                onDelete={setDeleteMemoryTargetId}
            />
        );
       case 'Shared Passwords':
        return (
          <PasswordList
            credentials={filteredCredentials}
            onEdit={openEditPasswordDialog}
            onDelete={setDeleteTargetId}
            onSend={openSendEmailDialog}
          />
        );
      case 'Shared Documents':
        return (
          <SecureDocumentList
            documents={filteredDocuments}
            onEdit={openEditDocumentDialog}
            onDelete={setDeleteDocumentTargetId}
            onPreview={openPreviewDialog}
          />
        );
      case 'Shared Memories':
        return (
            <MemoryList
                memories={filteredMemories}
                onEdit={openEditMemoryDialog}
                onDelete={setDeleteMemoryTargetId}
            />
        );
      case 'Family Members':
        return <FamilyMembersList familyMembers={familyMembers} onEdit={openEditFamilyMemberDialog} onDelete={setDeleteFamilyMemberTargetId} onMemberSelect={handleFamilyMemberSelect} />;
      case 'SharedWithFamilyMember': {
        if (!selectedFamilyMember) return null;
        
        const credentialsSharedByMe = allOwnedCredentials.filter(c => c.sharedWith?.includes(selectedFamilyMember.id));
        const credentialsSharedToMe = allSharedCredentials.filter(c => c.ownerId === selectedFamilyMember.uid);
        const combinedCredentials = [...credentialsSharedByMe, ...credentialsSharedToMe];

        const documentsSharedByMe = allOwnedDocuments.filter(d => d.sharedWith?.includes(selectedFamilyMember.id));
        const documentsSharedToMe = allSharedDocuments.filter(d => d.ownerId === selectedFamilyMember.uid);
        const combinedDocuments = [...documentsSharedByMe, ...documentsSharedToMe];

        const memoriesSharedByMe = allOwnedMemories.filter(m => m.sharedWith?.includes(selectedFamilyMember.id));
        const memoriesSharedToMe = allSharedMemories.filter(m => m.ownerId === selectedFamilyMember.uid);
        const combinedMemories = [...memoriesSharedByMe, ...memoriesSharedToMe];
        
        const filteredCombinedCredentials = combinedCredentials.filter(credential => {
            if (searchTerm) {
                const lowerCaseSearchTerm = searchTerm.toLowerCase();
                return credential.url.toLowerCase().includes(lowerCaseSearchTerm) ||
                       credential.username.toLowerCase().includes(lowerCaseSearchTerm) ||
                       (credential.tags && credential.tags.some(tag => tag.toLowerCase().includes(lowerCaseSearchTerm)));
            }
            return true;
        });

        const filteredCombinedDocuments = combinedDocuments.filter(doc => {
            if (searchTerm) {
                const lowerCaseSearchTerm = searchTerm.toLowerCase();
                return doc.name.toLowerCase().includes(lowerCaseSearchTerm) ||
                       doc.fileType.toLowerCase().includes(lowerCaseSearchTerm);
            }
            return true;
        });

        const filteredCombinedMemories = combinedMemories.filter(mem => {
          if (searchTerm) {
              const lowerCaseSearchTerm = searchTerm.toLowerCase();
              return mem.title.toLowerCase().includes(lowerCaseSearchTerm) ||
                     (mem.tags && mem.tags.some(tag => tag.toLowerCase().includes(lowerCaseSearchTerm)));
          }
          return true;
        });

        if (filteredCombinedCredentials.length === 0 && filteredCombinedDocuments.length === 0 && filteredCombinedMemories.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
                    <Users className="h-16 w-16 text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-headline font-bold">Nothing Shared Yet</h2>
                    <p className="text-muted-foreground mt-2">
                        You haven't shared anything with {selectedFamilyMember.name}, and they haven't shared anything with you.
                    </p>
                </div>
            );
        }

        return (
          <div className="space-y-8">
            {filteredCombinedCredentials.length > 0 && <PasswordList
              credentials={filteredCombinedCredentials}
              onEdit={openEditPasswordDialog}
              onDelete={setDeleteTargetId}
              onSend={openSendEmailDialog}
            />}
            {filteredCombinedDocuments.length > 0 && <SecureDocumentList
              documents={filteredCombinedDocuments}
              onEdit={openEditDocumentDialog}
              onDelete={setDeleteDocumentTargetId}
              onPreview={openPreviewDialog}
            />}
            {filteredCombinedMemories.length > 0 && <MemoryList
                memories={filteredCombinedMemories}
                onEdit={openEditMemoryDialog}
                onDelete={setDeleteMemoryTargetId}
            />}
          </div>
        );
      }
      case 'Password Health Report':
        return <PasswordHealthReportPage credentials={allOwnedCredentials} onEditCredential={openEditPasswordDialog} />;
      case 'Audit Logs':
        return <AuditLogsPage logs={auditLogs} />;
      case 'Device Management':
        return <DeviceManagementPage sessions={deviceSessions} onRevoke={handleRevokeSession} />;
      case 'Settings':
        return <SettingsPage />;
      case 'Support':
        return <SupportPage />;
      default:
        return null;
    }
  };

  const pageTitle = activeMenu === 'SharedWithFamilyMember' && selectedFamilyMember
    ? `Shared with ${selectedFamilyMember.name}`
    : activeMenu === 'All Items' 
    ? selectedVault?.name || 'Vault' 
    : activeMenu === 'Shared Passwords'
    ? 'Passwords Shared with Me'
    : activeMenu === 'Shared Documents'
    ? 'Documents Shared with Me'
    : activeMenu === 'Shared Memories'
    ? 'Memories Shared with Me'
    : activeMenu;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarGroup>
              <SidebarGroupLabel>Categories</SidebarGroupLabel>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => handleMenuClick('All Items')} isActive={activeMenu === 'All Items'} tooltip="All Items in Vault">
                  <GanttChartSquare /> All Items
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => handleMenuClick('All Passwords')} isActive={activeMenu === 'All Passwords'} tooltip="Passwords in Vault">
                  <Shield /> Passwords
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => handleMenuClick('Secure Documents')} isActive={activeMenu === 'Secure Documents'} tooltip="Documents in Vault">
                  <FolderLock /> Documents
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => handleMenuClick('Memories')} isActive={activeMenu === 'Memories'} tooltip="Memories in Vault">
                  <Album /> Memories
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Vaults</SidebarGroupLabel>
              <SidebarMenuAction onClick={() => setAddVaultDialogOpen(true)} tooltip="Create New Vault">
                <Plus />
              </SidebarMenuAction>
              {vaults.map((vault) => (
                <SidebarMenuItem key={vault.id}>
                  <SidebarMenuButton onClick={() => handleVaultSelect(vault.id)} isActive={selectedVaultId === vault.id && !activeMenu.includes('Shared') && activeMenu !== 'SharedWithFamilyMember'} tooltip={vault.name}>
                    <Home /> {vault.name}
                  </SidebarMenuButton>
                  <SidebarMenuAction onClick={(e) => {e.stopPropagation(); setVaultToDelete(vault)}} tooltip="Delete Vault" className="text-muted-foreground hover:text-destructive">
                    <Trash />
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
            </SidebarGroup>
             <SidebarSeparator />
              <SidebarGroup>
                <SidebarGroupLabel>Sharing</SidebarGroupLabel>
                 <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => handleMenuClick('Shared Passwords')} isActive={activeMenu === 'Shared Passwords'} tooltip="Passwords shared with me">
                    <Shield /> Shared Passwords
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => handleMenuClick('Shared Documents')} isActive={activeMenu === 'Shared Documents'} tooltip="Documents shared with me">
                    <FolderLock /> Shared Documents
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => handleMenuClick('Shared Memories')} isActive={activeMenu === 'Shared Memories'} tooltip="Memories shared with me">
                    <Album /> Shared Memories
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarGroup>
             <SidebarSeparator />
             <SidebarGroup>
              <SidebarGroupLabel>Security & Management</SidebarGroupLabel>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => handleMenuClick('Family Members')} isActive={activeMenu === 'Family Members' || activeMenu === 'SharedWithFamilyMember'} tooltip="Family Members">
                  <Users /> Family Members
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => handleMenuClick('Password Health Report')} isActive={activeMenu === 'Password Health Report'} tooltip="Password Health Report">
                  <ShieldCheck /> Password Health
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => handleMenuClick('Audit Logs')} isActive={activeMenu === 'Audit Logs'} tooltip="Audit Logs">
                  <History /> Audit Logs
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => handleMenuClick('Device Management')} isActive={activeMenu === 'Device Management'} tooltip="Device Management">
                  <MonitorSmartphone /> Device Management
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarGroup>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleMenuClick('Support')} isActive={activeMenu === 'Support'} tooltip="Support">
                <LifeBuoy /> Support
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleMenuClick('Settings')} isActive={activeMenu === 'Settings'} tooltip="Settings">
                <Settings /> Settings
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="p-2">
            <div className="flex items-center justify-between rounded-lg p-2 hover:bg-sidebar-accent">
                <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    <Label htmlFor="travel-mode" className="text-sm font-medium cursor-pointer">Travel Mode</Label>
                </div>
                <Switch
                    id="travel-mode"
                    checked={isTravelModeActive}
                    onCheckedChange={setTravelModeActive}
                />
            </div>
          </div>
          <Separator className="my-2" />
          {user && (
            <div className="flex items-center gap-3 p-2">
              <Avatar>
                <AvatarImage data-ai-hint="person" src={user.photoURL || `https://placehold.co/40x40.png`} alt={user.displayName || 'User'} />
                <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="font-semibold truncate">{user.displayName || 'User'}</span>
                <span className="text-sm text-muted-foreground truncate">{user.email}</span>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto" onClick={handleSignOut}>
                <LogOut />
              </Button>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col h-screen">
          <header className="flex items-center gap-4 mb-6">
            <SidebarTrigger className="md:hidden" />
            
            {activeMenu.includes('Password') || activeMenu.includes('Document') || activeMenu.includes('Memories') || activeMenu.includes('All Items') || activeMenu.includes('Shared') || activeMenu === 'SharedWithFamilyMember' ? (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder={
                      activeMenu === 'SharedWithFamilyMember' && selectedFamilyMember 
                      ? `Search items shared with ${selectedFamilyMember.name}...`
                      : activeMenu.includes('Shared') ? "Search shared items..." : "Search this vault..."
                  }
                  className="pl-10 w-full max-w-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={!selectedVaultId && !activeMenu.includes('Shared') && activeMenu !== 'SharedWithFamilyMember'}
                />
              </div>
            ) : <div className="flex-1" />}

            <div className="flex items-center gap-2">
                <NotificationsPopover
                    notifications={notifications}
                    onMarkAsRead={handleMarkNotificationAsRead}
                    onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                />
                {activeMenu === 'Family Members' ? (
                    <Button onClick={openAddFamilyMemberDialog} className="font-semibold">
                        <Plus className="h-5 w-5 md:mr-2" />
                        <span className="hidden md:inline">Add Family Member</span>
                    </Button>
                ) : activeMenu !== 'SharedWithFamilyMember' &&
                   !['Password Health Report', 'Audit Logs', 'Device Management', 'Settings', 'Support'].includes(activeMenu) ? (
                    <>
                        <Button onClick={openAddPasswordDialog} className="font-semibold" disabled={!selectedVaultId || activeMenu.includes('Shared') || activeMenu === 'Secure Documents' || activeMenu === 'Memories'}>
                          <Plus className="h-5 w-5 md:mr-2" />
                          <span className="hidden md:inline">Add Credential</span>
                        </Button>
                        <Button onClick={openAddDocumentDialog} className="font-semibold" disabled={!selectedVaultId || activeMenu.includes('Shared') || activeMenu === 'All Passwords' || activeMenu === 'Memories'}>
                          <Plus className="h-5 w-5 md:mr-2" />
                          <span className="hidden md:inline">Add Document</span>
                        </Button>
                        <Button onClick={openAddMemoryDialog} className="font-semibold" disabled={!selectedVaultId || activeMenu.includes('Shared') || activeMenu === 'All Passwords' || activeMenu === 'Secure Documents'}>
                          <Plus className="h-5 w-5 md:mr-2" />
                          <span className="hidden md:inline">Add Memory</span>
                        </Button>
                    </>
                 ) : null}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <h1 className="text-3xl font-bold font-headline mb-6">{pageTitle}</h1>
            {(selectedVaultId || activeMenu.includes('Shared') || activeMenu === 'SharedWithFamilyMember') ? renderContent() : (
              !isDataLoading && (
                <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
                  <BadgeInfo className="h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="text-2xl font-headline font-bold">No Vault Selected</h2>
                  <p className="text-muted-foreground mt-2">
                    Select a vault from the sidebar to view its items, or create a new one.
                  </p>
                </div>
              )
            )}
          </main>
        </div>
      </SidebarInset>

      <AddPasswordDialog
        open={isAddPasswordDialogOpen}
        onOpenChange={handlePasswordDialogChange}
        onAddCredential={handleAddCredential}
        onUpdateCredential={handleUpdateCredential}
        credentialToEdit={editingCredential}
        vaultId={selectedVaultId}
        familyMembers={familyMembers}
      />

      <AddSecureDocumentDialog
        open={isAddDocumentDialogOpen}
        onOpenChange={handleDocumentDialogChange}
        onAddDocument={handleAddSecureDocument}
        onUpdateDocument={handleUpdateSecureDocument}
        documentToEdit={editingDocument}
        vaultId={selectedVaultId}
        familyMembers={familyMembers}
      />

      <AddMemoryDialog
        open={isAddMemoryDialogOpen}
        onOpenChange={handleMemoryDialogChange}
        onAddMemory={handleAddMemory}
        onUpdateMemory={handleUpdateMemory}
        memoryToEdit={editingMemory}
        vaultId={selectedVaultId}
        familyMembers={familyMembers}
      />

      <AddFamilyMemberDialog
        open={isAddFamilyMemberDialogOpen}
        onOpenChange={handleFamilyDialogChange}
        onAddFamilyMember={handleAddFamilyMember}
        onUpdateFamilyMember={handleUpdateFamilyMember}
        familyMemberToEdit={editingFamilyMember}
      />

      <AddVaultDialog
        open={isAddVaultDialogOpen}
        onOpenChange={setAddVaultDialogOpen}
        onAddVault={handleAddVault}
      />

      <SendEmailDialog
        open={isSendEmailDialogOpen}
        onOpenChange={setSendEmailDialogOpen}
        credential={credentialToSend}
        familyMembers={familyMembers}
        user={user}
      />
      
      <SecureDocumentPreviewDialog
        open={isPreviewDialogOpen}
        onOpenChange={handlePreviewDialogChange}
        document={documentToPreview}
      />

      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              credential and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTargetId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCredential} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteDocumentTargetId} onOpenChange={(open) => !open && setDeleteDocumentTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this secure document from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDocumentTargetId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSecureDocument} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={!!deleteMemoryTargetId} onOpenChange={(open) => !open && setDeleteMemoryTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this memory from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteMemoryTargetId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMemory} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteFamilyMemberTargetId} onOpenChange={(open) => !open && setDeleteFamilyMemberTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the family member from your group. They will lose access to all shared passwords. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteFamilyMemberTargetId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFamilyMember} className="bg-destructive hover:bg-destructive/90">
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!vaultToDelete} onOpenChange={(open) => !open && setVaultToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{vaultToDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this vault and all credentials and documents inside it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVaultToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVault} className="bg-destructive hover:bg-destructive/90">
              Delete Vault
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </SidebarProvider>
  );
}
