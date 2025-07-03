
'use client';

import type { FamilyMember } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, Users, CheckCircle, Clock, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type FamilyMembersListProps = {
  familyMembers: FamilyMember[];
  onEdit: (member: FamilyMember) => void;
  onDelete: (id: string) => void;
  onMemberSelect?: (id: string) => void;
};

export function FamilyMembersList({ familyMembers, onEdit, onDelete, onMemberSelect }: FamilyMembersListProps) {
  if (familyMembers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-headline font-bold">No Family Members Found</h2>
        <p className="text-muted-foreground mt-2">
          Click "Add Family Member" to invite someone or add a local member for organization.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {familyMembers.map(member => (
        <Card key={member.id} className="flex flex-col">
          <CardContent className="p-0 flex flex-col items-center text-center flex-grow">
            <div
              className="w-full p-6 flex flex-col items-center cursor-pointer hover:bg-muted/50 rounded-t-lg flex-grow"
              onClick={() => onMemberSelect?.(member.id)}
            >
              <Avatar className="h-20 w-20 mb-4">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-lg">{member.name}</h3>
              <p className="text-sm text-muted-foreground">{member.email || 'No email'}</p>
               {member.status === 'active' ? (
                  <Badge variant="secondary" className="mt-2 text-green-600 border-green-600/50">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                ) : member.status === 'pending' ? (
                  <Badge variant="outline" className="mt-2">
                    <Clock className="mr-1 h-3 w-3" />
                    Pending
                  </Badge>
                ) : (
                  <Badge variant="outline" className="mt-2">
                    <UserX className="mr-1 h-3 w-3" />
                    Local
                  </Badge>
                )}
            </div>
            <div className="flex gap-2 w-full p-6 pt-2 border-t mt-auto">
                <Button variant="outline" size="sm" className="w-full" onClick={() => onEdit(member)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </Button>
                <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50 hover:border-destructive/80" onClick={() => onDelete(member.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
