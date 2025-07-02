
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
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AddPasswordDialog } from '@/components/dashboard/add-password-dialog';
import { PasswordList } from '@/components/dashboard/password-list';
import { FamilyMembersList } from '@/components/dashboard/family-members-list';
import type { Credential, FamilyMember } from '@/types';
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
} from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-provider';
import { signOutUser } from '@/services/auth';
import { SettingsPage } from '@/components/dashboard/settings-page';
import { SupportPage } from '@/components/dashboard/support-page';
import { sendCredentialEmail } from '@/ai/flows/send-credential-email-flow';
import { SendEmailDialog } from '@/components/dashboard/send-email-dialog';


export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isAddFamilyMemberDialogOpen, setAddFamilyMemberDialogOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('All Passwords');
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editingFamilyMember, setEditingFamilyMember] = useState<FamilyMember | null>(null);
  const [deleteFamilyMemberTargetId, setDeleteFamilyMemberTargetId] = useState<string | null>(null);
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
      setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);
    
    let credsLoaded = false;
    let membersLoaded = false;

    const checkDone = () => {
      if (credsLoaded && membersLoaded) {
        setIsDataLoading(false);
      }
    };

    const unsubscribeCredentials = getCredentials(user.uid, (creds) => {
      setCredentials(creds);
      credsLoaded = true;
      checkDone();
    });

    const unsubscribeFamilyMembers = getFamilyMembers(user.uid, (members) => {
      setFamilyMembers(members);
      membersLoaded = true;
      checkDone();
    });

    return () => {
      unsubscribeCredentials();
      unsubscribeFamilyMembers();
    };
  }, [user?.uid]);

  const handleSignOut = async () => {
    await signOutUser();
    router.push('/login');
  };

  const handleAddCredential = async (newCredential: Omit<Credential, 'id' | 'lastModified'>) => {
    if(!user) return;
    try {
      await addCredential(user.uid, newCredential);
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
      try {
        await deleteCredential(user.uid, deleteTargetId);
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
  
  const handleInitiateSendEmail = (credential: Credential) => {
    setCredentialToSend(credential);
  };

  const handleSendEmail = async (emails: string[], credential: Credential) => {
    try {
      const result = await sendCredentialEmail({
        emails,
        url: credential.url,
        username: credential.username,
        password: credential.password,
      });
      if (result.success) {
        toast({
          title: 'Email Sent',
          description: result.message,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send credential email.',
        variant: 'destructive',
      });
    } finally {
      setCredentialToSend(null);
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
      try {
          await deleteFamilyMember(user.uid, deleteFamilyMemberTargetId);
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
                  <Plus className="mr-2 h-5 w-5" />
                  Add Credential
                </Button>
              </>
            ) : activeMenu === 'Family Members' ? (
              <>
                <div className="flex-1" />
                <Button onClick={openAddFamilyMemberDialog} className="font-semibold">
                  <Plus className="mr-2 h-5 w-5" />
                  Add Family Member
                </Button>
              </>
            ) : <div className="flex-1" />}
          </header>

          <main className="flex-1 overflow-y-auto">
            <h1 className="text-3xl font-bold font-headline mb-6">{activeMenu}</h1>
            {isDataLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <>
                {activeMenu === 'Family Members' ? (
                  <FamilyMembersList
                    familyMembers={familyMembers}
                    onEdit={openEditFamilyMemberDialog}
                    onDelete={setDeleteFamilyMemberTargetId}
                  />
                ) : (activeMenu === 'All Passwords' || activeMenu === 'My Passwords') ? (
                  <PasswordList
                    credentials={filteredCredentials}
                    familyMembers={familyMembers}
                    onEdit={openEditDialog}
                    onDelete={setDeleteTargetId}
                    onSendEmail={handleInitiateSendEmail}
                  />
                ) : activeMenu === 'Settings' ? (
                  <SettingsPage />
                ) : activeMenu === 'Support' ? (
                  <SupportPage />
                ) : null}
              </>
            )}
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
        open={!!credentialToSend}
        onOpenChange={(open) => !open && setCredentialToSend(null)}
        credential={credentialToSend}
        familyMembers={familyMembers}
        user={user}
        onSendEmail={handleSendEmail}
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
