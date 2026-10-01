import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
    NotificationItem,
    useMarkAllNotificationsRead,
    useMarkNotificationRead,
    useNotificationList,
} from '@entities/notification';
import { useVirtualClock } from '@shared/lib/virtual-clock';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';

export function NotificationBell() {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotificationList();
    const { mutate: markRead } = useMarkNotificationRead();
    const { mutate: markAllRead } = useMarkAllNotificationsRead();
    const navigate = useNavigate();
    // 알림 목록의 상대 시간 표시 전용이다
    const now = useVirtualClock().now();

    const notifications = data?.pages.flatMap((page) => page.items) ?? [];
    const unreadCount = notifications.filter((notification) => !notification.isRead).length;

    return (
        <Popover>
            <PopoverTrigger
                aria-label="알림"
                className="text-fg-primary focus-visible:ring-border-focus relative flex size-6 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:outline-none"
            >
                <Bell className="size-6" />
                {unreadCount > 0 && (
                    <span className="bg-brand-primary border-surface-page absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2" />
                )}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
                <div className="flex items-center justify-between">
                    <p className="text-body-sm-bold text-fg-primary">알림</p>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            className="text-fg-tertiary text-caption focus-visible:ring-border-focus hover:text-fg-primary rounded-sm focus-visible:ring-2 focus-visible:outline-none"
                            onClick={() => markAllRead()}
                        >
                            모두 읽음
                        </button>
                    )}
                </div>
                <div className="border-border-default border-t" />
                <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
                    {notifications.length === 0 && (
                        <p className="text-fg-tertiary text-body-sm py-4 text-center">
                            알림이 없습니다.
                        </p>
                    )}
                    {notifications.map((notification) => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            now={now}
                            onRead={(id, linkUrl) => {
                                markRead(id);
                                // linkUrl은 서버가 주는 내부 경로만 다룬다 — 외부 URL 이동은 시연 범위 밖
                                if (linkUrl?.startsWith('/')) {
                                    void navigate(linkUrl);
                                }
                            }}
                        />
                    ))}
                    {hasNextPage && (
                        <button
                            type="button"
                            className="text-fg-tertiary text-caption focus-visible:ring-border-focus hover:text-fg-primary rounded-sm py-1 focus-visible:ring-2 focus-visible:outline-none"
                            onClick={() => void fetchNextPage()}
                            disabled={isFetchingNextPage}
                        >
                            더 보기
                        </button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
