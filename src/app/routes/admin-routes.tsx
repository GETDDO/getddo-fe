import type { RouteObject } from 'react-router-dom';

import { AdminAbuseReviewPage } from '@pages/admin/abuse-review';
import { AdminBannersPage } from '@pages/admin/banners';
import { AdminDashboardPage } from '@pages/admin/dashboard';
import { AdminDrawPage } from '@pages/admin/draw';
import { AdminEventsPage } from '@pages/admin/events';
import { AdminVirtualClockPage } from '@pages/admin/virtual-clock';
import { AdminLayout } from '@widgets/admin-layout';

import { AdminGuard } from './AdminGuard';

export const adminRoutes: RouteObject[] = [
    {
        path: '/admin',
        element: (
            <AdminGuard>
                <AdminLayout />
            </AdminGuard>
        ),
        children: [
            { index: true, element: <AdminDashboardPage /> },
            { path: 'events', element: <AdminEventsPage /> },
            { path: 'draw', element: <AdminDrawPage /> },
            { path: 'abuse-review', element: <AdminAbuseReviewPage /> },
            { path: 'banners', element: <AdminBannersPage /> },
            { path: 'virtual-clock', element: <AdminVirtualClockPage /> },
        ],
    },
];
