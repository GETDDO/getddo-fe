import { formatRelativeFromNow } from '@shared/lib/date';
import { cn } from '@shared/lib/utils';

import type { Notification } from '../model/types';

export function NotificationItem({
    notification,
    now,
    onRead,
}: {
    notification: Notification;
    now: Date;
    onRead?: (id: string) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onRead?.(notification.id)}
            className={cn(
                'flex w-full flex-col items-start gap-1 rounded-lg px-2 py-2 text-left transition-colors',
                notification.read ? 'bg-transparent' : 'bg-brand-soft',
            )}
        >
            <div className="flex items-center gap-1.5">
                {!notification.read && (
                    <span className="bg-brand-primary size-1.5 shrink-0 rounded-full" />
                )}
                <p className="text-caption text-fg-primary font-semibold">{notification.title}</p>
            </div>
            <p className="text-caption text-fg-secondary">{notification.body}</p>
            <p className="text-fg-tertiary text-[10px]">
                {formatRelativeFromNow(notification.createdAt, now)}
            </p>
        </button>
    );
}
