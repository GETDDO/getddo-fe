import { Outlet, type RouteObject } from 'react-router-dom';

import { AdminAbuseReviewPage } from '@pages/admin/abuse-review';
import { AdminBannersPage } from '@pages/admin/banners';
import { AdminDashboardPage } from '@pages/admin/dashboard';
import { AdminDrawPage } from '@pages/admin/draw';
import { AdminEventsPage } from '@pages/admin/events';

import { AdminGuard } from './admin-guard';

export const adminRoutes: RouteObject[] = [
    {
        path: '/admin',
        element: (
            <AdminGuard>
                <Outlet />
            </AdminGuard>
        ),
        children: [
            { index: true, element: <AdminDashboardPage /> },
            { path: 'events', element: <AdminEventsPage /> },
            { path: 'draw', element: <AdminDrawPage /> },
            { path: 'abuse-review', element: <AdminAbuseReviewPage /> },
            { path: 'banners', element: <AdminBannersPage /> },
        ],
    },
];
