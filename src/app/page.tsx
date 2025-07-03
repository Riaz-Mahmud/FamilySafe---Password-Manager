
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
  Share2,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AddPasswordDialog } from '@/components/dashboard/add-password-dialog';
import { PasswordList } from '@/components/dashboard/password-list';
import { FamilyMembersList } from '@/components/dashboard/family-members-list';
import type { Credential, FamilyMember, AuditLog, DeviceSession } from '@/types';
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
  getSharesForUser,
  deleteShare,
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
import { sendInvitationEmailAction, shareCredentialAction } from '@/app/actions';


export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [deviceSessions, setDeviceSessions] = useState<DeviceSession[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isAddFamilyMemberDialogOpen, setAddFamilyMemberDialogOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('All Passwords');
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editingFamilyMember, setEditingFamilyMember] = useState<FamilyMember | null>(null);
  const [deleteFamilyMemberTargetId, setDeleteFamilyMemberTargetId] = useState<string | null>(null);
  const [isSendEmailDialogOpen, setSendEmailDialogOpen] = useState(false);
  const [credentialToSend, setCredentialToSend] = useState<Credential | null>(null);
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string | null>(null);
  const [isTravelModeActive, setTravelModeActive] = useState(false);
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

  useEffect(() => {
    if (!user?.uid) {
      setCredentials([]);
      setFamilyMembers([]);
      setAuditLogs([]);
      setDeviceSessions([]);
      setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);
    
    let loadedCount = 0;
    const totalToLoad = 4;

    const checkDone = () => {
      loadedCount++;
      if (loadedCount === totalToLoad) {
        setIsDataLoading(false);
      }
    };

    const unsubscribeCredentials = getCredentials(user.uid, (creds) => {
      setCredentials(creds);
      checkDone();
    });

    const unsubscribeFamilyMembers = getFamilyMembers(user.uid, (members) => {
      setFamilyMembers(members);
      checkDone();
    });

    const unsubscribeAuditLogs = getAuditLogs(user.uid, (logs) => {
      setAuditLogs(logs);
      checkDone();
    });
    
    const currentSessionId = localStorage.getItem('sessionId');
    const unsubscribeSessions = getDeviceSessions(user.uid, currentSessionId, (sessions) => {
      setDeviceSessions(sessions);
      checkDone();
    });


    return () => {
      unsubscribeCredentials();
      unsubscribeFamilyMembers();
      unsubscribeAuditLogs();
      unsubscribeSessions();
    };
  }, [user?.uid]);

  // This effect handles the automatic claiming of shared credentials.
  useEffect(() => {
    if (!user?.uid || !user.email) return;

    const unsubscribeShares = getSharesForUser(user.email, async (shares) => {
      if (shares.length > 0) {
        for (const share of shares) {
          try {
            // Construct the credential to be added
            const credentialForRecipient = {
              ...share.credential,
              notes: `Shared by ${share.fromName}.\n\n${share.credential.notes || ''}`,
              sharedWith: [], // A shared credential cannot be re-shared
              isShared: true,
              sharedBy: share.fromName,
              sharedTo: user.email!,
            };
            
            // Add the claimed credential to the user's own list. This will encrypt it.
            await addCredential(user.uid, credentialForRecipient);

            // Delete the temporary share document
            await deleteShare(share.id);
            
            toast({
              title: "Credential Received",
              description: `You received a new shared credential for ${share.credential.url} from ${share.fromName}.`
            });
          } catch (error) {
            console.error("Error claiming share:", error);
            toast({
              title: 'Error Receiving Credential',
              description: 'There was a problem receiving a shared item.',
              variant: 'destructive',
            });
          }
        }
      }
    });

    return () => {
      unsubscribeShares();
    };
  }, [user?.uid, user?.email, toast]);

  const handleSignOut = async () => {
    if(!user) return;
    await addAuditLog(user.uid, 'User Signed Out', 'User signed out from the application.');
    await signOutUser();
    router.push('/login');
  };

  const handleSharing = async (credential: Omit<Credential, 'id' | 'lastModified' | 'createdAt'>, originalSharedWithIds: string[] = []) => {
      if (!user) return;
      
      const newSharedWithIds = credential.sharedWith || [];
      const addedIds = newSharedWithIds.filter(id => !originalSharedWithIds.includes(id));
      
      // From those members, filter out the ones that are not local and have an email
      const sharableMembers = familyMembers.filter(m => 
          addedIds.includes(m.id) && m.email && m.status !== 'local'
      );

      const emailsToShareWith = sharableMembers.map(m => m.email!);

      if (emailsToShareWith.length > 0) {
          const result = await shareCredentialAction({
              fromUid: user.uid,
              fromName: user.displayName || user.email!,
              toEmails: emailsToShareWith,
              credential: {
                  url: credential.url,
                  username: credential.username,
                  password: credential.password,
                  notes: credential.notes,
                  icon: credential.icon,
                  tags: credential.tags,
                  expiryMonths: credential.expiryMonths,
                  safeForTravel: credential.safeForTravel,
              }
          });

          if (result.success) {
              toast({
                  title: "Credential Shared",
                  description: `Your credential has been sent to ${emailsToShareWith.length} member(s).`
              });
          } else {
               toast({
                  title: "Sharing Failed",
                  description: result.message,
                  variant: "destructive"
              });
          }
      }
  };

  const handleAddCredential = async (newCredential: Omit<Credential, 'id' | 'lastModified' | 'createdAt'>) => {
    if(!user) return;
    try {
      await addCredential(user.uid, newCredential);
      await addAuditLog(user.uid, 'Create Credential', `Saved credential for ${newCredential.url}.`);
      toast({
        title: 'Credential Added',
        description: 'The new credential has been saved successfully.',
      });
      // Handle sharing for new credentials
      await handleSharing(newCredential);
    } catch (error) {
      console.error("Error adding credential:", error);
      toast({ title: 'Error', description: 'Failed to add credential.', variant: 'destructive' });
    }
  };

  const handleUpdateCredential = async (updatedCredential: Credential) => {
    if(!user) return;
    try {
      const originalCredential = credentials.find(c => c.id === updatedCredential.id);
      const { id, ...dataToUpdate } = updatedCredential;
      await updateCredential(user.uid, id, dataToUpdate);
      await addAuditLog(user.uid, 'Update Credential', `Updated credential for ${updatedCredential.url}.`);
      toast({
        title: 'Credential Updated',
        description: 'The credential has been updated successfully.',
      });
       // Handle sharing for updated credentials
      await handleSharing(updatedCredential, originalCredential?.sharedWith);
    } catch (error) {
      console.error("Error updating credential:", error);
      toast({ title: 'Error', description: 'Failed to update credential.', variant: 'destructive' });
    }
  };

  const handleDeleteCredential = async () => {
    if (deleteTargetId && user) {
      const credToDelete = credentials.find(c => c.id === deleteTargetId);
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
        
        // If email is removed, it becomes a local member and uid should be cleared.
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


  const openAddDialog = () => {
    setEditingCredential(null);
    setAddDialogOpen(true);
  };

  const openEditDialog = (credential: Credential) => {
    setEditingCredential(credential);
    setAddDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setEditingCredential(null);
    }
    setAddDialogOpen(open);
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
    if (!open) {
      setEditingFamilyMember(null);
    }
    setAddFamilyMemberDialogOpen(open);
  };
  
  const openSendEmailDialog = (credential: Credential) => {
    setCredentialToSend(credential);
    setSendEmailDialogOpen(true);
  };

  const handleSelectFamilyMember = (memberId: string) => {
    const member = familyMembers.find(m => m.id === memberId);
    if (!member) {
        return; // Safety check
    }

    if (member.status === 'pending') {
        toast({
            title: 'Invitation Pending',
            description: 'This member has not yet accepted their invitation.',
        });
    }
    setSelectedFamilyMemberId(memberId);
    setActiveMenu('All Passwords');
    setSearchTerm('');
  };

  const handleMenuClick = (menu: string) => {
    setActiveMenu(menu);
    setSelectedFamilyMemberId(null);
    setSearchTerm('');
  };

  const filteredCredentials = credentials.filter(credential => {
      // Filter by Travel Mode first
      if (isTravelModeActive && !credential.safeForTravel) {
        return false;
      }
      
      // Filter by active menu second, as it's the primary mode
      if (activeMenu === 'My Passwords') {
        if (credential.isShared) return false;
      } else if (activeMenu === 'Shared Passwords') {
        if (!credential.isShared) return false;
      }

      // Filter by selected family member if a member is selected
      if (selectedFamilyMemberId) {
        const member = familyMembers.find(m => m.id === selectedFamilyMemberId);
        if (!member) return false; // Safety check
        // Check if the credential's sharedWith array contains the selected member's ID
        if (!credential.sharedWith.includes(selectedFamilyMemberId)) {
          return false;
        }
      }

      // Then, filter by search term
      if (searchTerm) {
          const lowerCaseSearchTerm = searchTerm.toLowerCase();
          const searchMatch =
          credential.url.toLowerCase().includes(lowerCaseSearchTerm) ||
          credential.username.toLowerCase().includes(lowerCaseSearchTerm) ||
          (credential.tags && credential.tags.some(tag => tag.toLowerCase().includes(lowerCaseSearchTerm)));
          if (!searchMatch) return false;
      }
      
      return true;
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const renderContent = () => {
    if (isDataLoading) {
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
      case 'All Passwords':
      case 'My Passwords':
      case 'Shared Passwords':
        return (
          <PasswordList
            credentials={filteredCredentials}
            familyMembers={familyMembers}
            onEdit={openEditDialog}
            onDelete={setDeleteTargetId}
            onSend={openSendEmailDialog}
            onMemberSelect={handleSelectFamilyMember}
            isTravelModeActive={isTravelModeActive}
          />
        );
      case 'Family Members':
        return (
          <FamilyMembersList
            familyMembers={familyMembers}
            onEdit={openEditFamilyMemberDialog}
            onDelete={setDeleteFamilyMemberTargetId}
            onMemberSelect={handleSelectFamilyMember}
          />
        );
      case 'Password Health Report':
        return <PasswordHealthReportPage credentials={credentials} onEditCredential={openEditDialog} />;
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

  const activeFamilyMember = selectedFamilyMemberId
    ? familyMembers.find((m) => m.id === selectedFamilyMemberId)
    : null;

  const pageTitle = activeFamilyMember
    ? `Passwords Shared with ${activeFamilyMember.name}`
    : activeMenu;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleMenuClick('All Passwords')}
                isActive={activeMenu === 'All Passwords' && !selectedFamilyMemberId}
                tooltip="All Passwords"
              >
                <Home />
                All Passwords
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleMenuClick('My Passwords')}
                isActive={activeMenu === 'My Passwords'}
                tooltip="My Passwords"
              >
                <Shield />
                My Passwords
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleMenuClick('Shared Passwords')}
                isActive={activeMenu === 'Shared Passwords'}
                tooltip="Shared Passwords"
              >
                <Share2 />
                Shared Passwords
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleMenuClick('Family Members')}
                isActive={activeMenu === 'Family Members'}
                tooltip="Family Members"
              >
                <Users />
                Family Members
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleMenuClick('Password Health Report')}
                isActive={activeMenu === 'Password Health Report'}
                tooltip="Password Health Report"
              >
                <ShieldCheck />
                Password Health Report
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleMenuClick('Audit Logs')}
                isActive={activeMenu === 'Audit Logs'}
                tooltip="Audit Logs"
              >
                <History />
                Audit Logs
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleMenuClick('Device Management')}
                isActive={activeMenu === 'Device Management'}
                tooltip="Device Management"
              >
                <MonitorSmartphone />
                Device Management
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleMenuClick('Support')} isActive={activeMenu === 'Support'} tooltip="Support">
                <LifeBuoy />
                Support
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleMenuClick('Settings')}
                isActive={activeMenu === 'Settings'}
                tooltip="Settings"
              >
                <Settings />
                Settings
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
            {activeMenu === 'All Passwords' || activeMenu === 'My Passwords' ? (
              <>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search passwords by site, username, or tag..."
                    className="pl-10 w-full max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button onClick={openAddDialog} className="font-semibold">
                  <Plus className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:inline">Add Credential</span>
                </Button>
              </>
            ) : activeMenu === 'Shared Passwords' ? (
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search passwords by site, username, or tag..."
                    className="pl-10 w-full max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
            ) : activeMenu === 'Family Members' ? (
              <>
                <div className="flex-1" />
                <Button onClick={openAddFamilyMemberDialog} className="font-semibold">
                  <Plus className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:inline">Add Family Member</span>
                </Button>
              </>
            ) : <div className="flex-1" />}
          </header>

          <main className="flex-1 overflow-y-auto">
            <h1 className="text-3xl font-bold font-headline mb-6">{pageTitle}</h1>
            {renderContent()}
          </main>
        </div>
      </SidebarInset>

      <AddPasswordDialog
        open={isAddDialogOpen}
        onOpenChange={handleDialogChange}
        onAddCredential={handleAddCredential}
        onUpdateCredential={handleUpdateCredential}
        familyMembers={familyMembers}
        credentialToEdit={editingCredential}
      />

      <AddFamilyMemberDialog
        open={isAddFamilyMemberDialogOpen}
        onOpenChange={handleFamilyDialogChange}
        onAddFamilyMember={handleAddFamilyMember}
        onUpdateFamilyMember={handleUpdateFamilyMember}
        familyMemberToEdit={editingFamilyMember}
      />

      <SendEmailDialog
        open={isSendEmailDialogOpen}
        onOpenChange={setSendEmailDialogOpen}
        credential={credentialToSend}
        familyMembers={familyMembers}
        user={user}
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

    </SidebarProvider>
  );
}
