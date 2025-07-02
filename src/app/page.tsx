'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AddPasswordDialog } from '@/components/dashboard/add-password-dialog';
import { PasswordList } from '@/components/dashboard/password-list';
import { FamilyMembersList } from '@/components/dashboard/family-members-list';
import type { Credential, FamilyMember } from '@/types';
import { mockCredentials, mockFamilyMembers } from '@/data/mock';
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

export default function DashboardPage() {
  const [credentials, setCredentials] = useState<Credential[]>(mockCredentials);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(mockFamilyMembers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isAddFamilyMemberDialogOpen, setAddFamilyMemberDialogOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('All Passwords');
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editingFamilyMember, setEditingFamilyMember] = useState<FamilyMember | null>(null);
  const [deleteFamilyMemberTargetId, setDeleteFamilyMemberTargetId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddCredential = (newCredential: Omit<Credential, 'id' | 'lastModified'>) => {
    const credentialToAdd: Credential = {
      ...newCredential,
      id: Date.now().toString(),
      lastModified: new Date().toLocaleDateString(),
    };
    setCredentials(prev => [credentialToAdd, ...prev]);
    toast({
      title: 'Credential Added',
      description: 'The new credential has been saved successfully.',
    });
  };

  const handleUpdateCredential = (updatedCredential: Credential) => {
    setCredentials(prev =>
      prev.map(c => (c.id === updatedCredential.id ? updatedCredential : c))
    );
    toast({
      title: 'Credential Updated',
      description: 'The credential has been updated successfully.',
    });
  };

  const handleDeleteCredential = () => {
    if (deleteTargetId) {
      setCredentials(prev => prev.filter(c => c.id !== deleteTargetId));
      toast({
        title: 'Credential Deleted',
        description: 'The credential has been permanently deleted.',
        variant: 'destructive',
      });
      setDeleteTargetId(null);
    }
  };

  const handleAddFamilyMember = (newMember: Omit<FamilyMember, 'id' | 'avatar'>) => {
    const memberToAdd: FamilyMember = {
      ...newMember,
      id: Date.now().toString(),
      avatar: `https://placehold.co/40x40.png`,
    };
    setFamilyMembers(prev => [...prev, memberToAdd]);
    toast({
      title: 'Family Member Added',
      description: `${newMember.name} has been invited to your family.`,
    });
  };

  const handleUpdateFamilyMember = (updatedMember: FamilyMember) => {
    setFamilyMembers(prev =>
      prev.map(m => (m.id === updatedMember.id ? updatedMember : m))
    );
    setEditingFamilyMember(null);
    setAddFamilyMemberDialogOpen(false);
    toast({
      title: 'Family Member Updated',
      description: 'The member details have been updated successfully.',
    });
  };

  const handleDeleteFamilyMember = () => {
    if (deleteFamilyMemberTargetId) {
      setFamilyMembers(prev => prev.filter(m => m.id !== deleteFamilyMemberTargetId));
      toast({
        title: 'Family Member Removed',
        description: 'The family member has been removed.',
        variant: 'destructive',
      });
      setDeleteFamilyMemberTargetId(null);
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
      // Assuming "My Passwords" are those not shared with anyone.
      // In a real app, this would be based on the owner's ID.
      return credential.sharedWith.length === 0;
    }
    
    // For "All Passwords", we already filtered by search, so return true.
    return true;
  });

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
          <div className="flex items-center gap-3 p-2">
            <Avatar>
              <AvatarImage src="https://placehold.co/40x40.png" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold truncate">User Name</span>
              <span className="text-sm text-muted-foreground truncate">user@familysafe.com</span>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto">
              <LogOut />
            </Button>
          </div>
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
              />
            ) : activeMenu === 'Settings' ? (
              <div className="text-center p-8 border-2 border-dashed rounded-lg">Settings page coming soon!</div>
            ) : activeMenu === 'Support' ? (
              <div className="text-center p-8 border-2 border-dashed rounded-lg">Support page coming soon!</div>
            ) : null}
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
