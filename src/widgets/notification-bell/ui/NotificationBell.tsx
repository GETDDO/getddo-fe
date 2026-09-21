import { Bell } from 'lucide-react';

import {
    NotificationItem,
    useMarkNotificationRead,
    useNotificationList,
} from '@entities/notification';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';

export function NotificationBell() {
    const { data: notifications } = useNotificationList();
    const { mutate: markRead } = useMarkNotificationRead();
    // FSD 경계상 app/virtual-clock은 widgets에서 참조할 수 없다 — 알림 목록의 상대 시간 표시 전용이라 실제 시각을 직접 쓴다
    const now = new Date();

    const unreadCount = notifications?.filter((notification) => !notification.read).length ?? 0;

    return (
        <Popover>
            <PopoverTrigger
                aria-label="알림"
                className="text-fg-primary relative flex size-6 items-center justify-center"
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
                            className="text-fg-tertiary text-caption"
                            onClick={() => {
                                notifications
                                    ?.filter((notification) => !notification.read)
                                    .forEach((notification) => markRead(notification.id));
                            }}
                        >
                            모두 읽음
                        </button>
                    )}
                </div>
                <div className="border-border-default border-t" />
                <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
                    {(notifications ?? []).length === 0 && (
                        <p className="text-fg-tertiary text-body-sm py-4 text-center">
                            알림이 없습니다.
                        </p>
                    )}
                    {notifications?.map((notification) => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            now={now}
                            onRead={(id) => markRead(id)}
                        />
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
