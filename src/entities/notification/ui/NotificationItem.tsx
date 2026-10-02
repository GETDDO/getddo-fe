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
    onRead?: (id: string, linkUrl: string | null) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onRead?.(notification.id, notification.linkUrl)}
            // 피그마 홈 알림창 — 읽지 않은 알림은 옅은 파랑 배경과 핑크 점, 제목·본문·시간은 점 뒤 12px에 맞춘다
            className={cn(
                'focus-visible:ring-border-focus flex w-full flex-col items-start gap-0.5 rounded-lg px-2 py-1 pl-5 text-left focus-visible:ring-2 focus-visible:outline-none motion-safe:transition-colors',
                notification.isRead ? 'hover:bg-surface-canvas' : 'bg-status-active',
            )}
        >
            <p className="text-caption text-fg-primary relative">
                {!notification.isRead && (
                    <span className="bg-brand-primary absolute top-1.5 -left-3 size-1.25 rounded-full" />
                )}
                {notification.title}
            </p>
            <p className="text-caption text-fg-secondary">{notification.body}</p>
            <p className="text-fg-tertiary text-[10px] leading-4.5">
                {formatRelativeFromNow(notification.createdAt, now)}
            </p>
        </button>
    );
}
