import type { LucideIcon } from 'lucide-react';

import { CalendarDays, Dices, Images, LayoutDashboard, ShieldAlert } from 'lucide-react';

export interface AdminNavItem {
    to: string;
    label: string;
    icon: LucideIcon;
    /** index 라우트(/admin)는 정확히 일치할 때만 활성화한다 */
    end?: boolean;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
    { to: '/admin', label: '대시보드', icon: LayoutDashboard, end: true },
    { to: '/admin/events', label: '이벤트 관리', icon: CalendarDays },
    { to: '/admin/draw', label: '추첨 관리', icon: Dices },
    { to: '/admin/abuse-review', label: '어뷰징 검토', icon: ShieldAlert },
    { to: '/admin/banners', label: '배너 관리', icon: Images },
];
