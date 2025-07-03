
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
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

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

  const handleSignOut = async () => {
    if(!user) return;
    await addAuditLog(user.uid, 'User Signed Out', 'User signed out from the application.');
    await signOutUser();
    router.push('/login');
  };

  const handleAddCredential = async (newCredential: Omit<Credential, 'id' | 'lastModified'>) => {
    if(!user) return;
    try {
      await addCredential(user.uid, newCredential);
      await addAuditLog(user.uid, 'Create Credential', `Saved credential for ${newCredential.url}.`);
      toast({
        title: 'Credential Added',
        description: 'The new credential has been saved successfully.',
      });
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
  
  const handleAddFamilyMember = async (newMember: Omit<FamilyMember, 'id' | 'avatar'>) => {
     if(!user) return;
     try {
        const memberToAdd = {
            ...newMember,
            avatar: `https://placehold.co/40x40.png`,
        };
        await addFamilyMember(user.uid, memberToAdd);
        await addAuditLog(user.uid, 'Create Family Member', `Added ${newMember.name} to the family group.`);
        toast({
            title: 'Family Member Added',
            description: `${newMember.name} has been added to your family group.`,
        });
    } catch (error) {
        console.error("Error adding family member:", error);
        toast({ title: 'Error', description: 'Failed to add family member.', variant: 'destructive' });
    }
  };

  const handleUpdateFamilyMember = async (updatedMember: FamilyMember) => {
    if(!user) return;
    try {
        await updateFamilyMember(user.uid, updatedMember.id, updatedMember);
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

  const filteredCredentials = credentials.filter(credential => {
    const searchMatch =
      credential.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credential.username.toLowerCase().includes(searchTerm.toLowerCase());

    if (!searchMatch) {
      return false;
    }

    if (activeMenu === 'My Passwords') {
      return credential.sharedWith.length === 0;
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
        return (
          <PasswordList
            credentials={filteredCredentials}
            familyMembers={familyMembers}
            onEdit={openEditDialog}
            onDelete={setDeleteTargetId}
            onSend={openSendEmailDialog}
          />
        );
      case 'Family Members':
        return (
          <FamilyMembersList
            familyMembers={familyMembers}
            onEdit={openEditFamilyMemberDialog}
            onDelete={setDeleteFamilyMemberTargetId}
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
                onClick={() => setActiveMenu('All Passwords')}
                isActive={activeMenu === 'All Passwords'}
                tooltip="All Passwords"
              >
                <Home />
                All Passwords
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveMenu('My Passwords')}
                isActive={activeMenu === 'My Passwords'}
                tooltip="My Passwords"
              >
                <Shield />
                My Passwords
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveMenu('Family Members')}
                isActive={activeMenu === 'Family Members'}
                tooltip="Family Members"
              >
                <Users />
                Family Members
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveMenu('Password Health Report')}
                isActive={activeMenu === 'Password Health Report'}
                tooltip="Password Health Report"
              >
                <ShieldCheck />
                Password Health Report
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveMenu('Audit Logs')}
                isActive={activeMenu === 'Audit Logs'}
                tooltip="Audit Logs"
              >
                <History />
                Audit Logs
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveMenu('Device Management')}
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
              <SidebarMenuButton onClick={() => setActiveMenu('Support')} isActive={activeMenu === 'Support'} tooltip="Support">
                <LifeBuoy />
                Support
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveMenu('Settings')}
                isActive={activeMenu === 'Settings'}
                tooltip="Settings"
              >
                <Settings />
                Settings
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
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
                    placeholder="Search passwords..."
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
            <h1 className="text-3xl font-bold font-headline mb-6">{activeMenu}</h1>
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
