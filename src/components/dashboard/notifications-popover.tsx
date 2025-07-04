
'use client';

import { Bell, CheckCheck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Notification } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface NotificationsPopoverProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export function NotificationsPopover({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationsPopoverProps) {
  const router = useRouter();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    onMarkAsRead(notification.id);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
           <span className="sr-only">Toggle notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="link" size="sm" className="p-0 h-auto text-sm" onClick={onMarkAllAsRead}>
              <CheckCheck className="mr-1 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'flex items-start gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors',
                  !notification.read && 'bg-primary/10'
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                {notification.from?.avatar ? (
                  <Avatar className="h-10 w-10">
                    <AvatarImage data-ai-hint="person" src={notification.from.avatar} />
                    <AvatarFallback>{notification.from.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-10 w-10 flex items-center justify-center bg-secondary rounded-full">
                     <Bell className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 space-y-1 overflow-hidden">
                  <p className="font-medium text-sm leading-tight">{notification.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                  </p>
                </div>
                {!notification.read && (
                    <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1 self-center" />
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground p-8">
              <Bell className="mx-auto h-12 w-12 mb-4" />
              <h4 className="font-semibold">No notifications yet</h4>
              <p className="text-sm">We'll let you know when something new happens.</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
