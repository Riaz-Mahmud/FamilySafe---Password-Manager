
'use client';

import type { Memory } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Edit, Trash2, Album } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

type MemoryListProps = {
  memories: Memory[];
  onEdit: (memory: Memory) => void;
  onDelete: (id: string) => void;
};

export function MemoryList({ memories, onEdit, onDelete }: MemoryListProps) {
  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
        <Album className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-headline font-bold">No Memories Found</h2>
        <p className="text-muted-foreground mt-2">
          Click "Add Memory" to preserve your first story.
        </p>
      </div>
    );
  }

  const renderOwnership = (memory: Memory) => {
    if (!memory.ownerName) return null;
    return (
        <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="font-normal text-xs">Shared by {memory.ownerName}</Badge>
        </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {memories.map(memory => (
        <Card key={memory.id} className="flex flex-col overflow-hidden">
            <div className="relative aspect-video bg-muted">
                {memory.photoUrl ? (
                    <Image
                        src={memory.photoUrl}
                        alt={memory.title}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <Album className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                )}
                {renderOwnership(memory)}
            </div>
            <CardContent className="p-4 flex flex-col flex-grow">
                <p className="text-sm text-muted-foreground">{new Date(memory.memoryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p>
                <h3 className="font-semibold text-lg flex-grow mt-1">{memory.title}</h3>
                {memory.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {memory.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-4 pt-0 mt-auto">
                <div className="flex gap-2 w-full">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => onEdit(memory)} disabled={!!memory.ownerId}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50 hover:border-destructive/80" onClick={() => onDelete(memory.id)} disabled={!!memory.ownerId}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
