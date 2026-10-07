import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router-dom';

import { lazy, Suspense } from 'react';

import { AdminGuard } from './AdminGuard';

// 관리자 화면 전체를 lazy로 분리해 유저 번들에 섞이지 않게 한다.
// layout과 각 페이지가 별도 chunk로 나뉘고, 페이지는 AdminLayout 안쪽에서 개별 Suspense를 가진다.
const AdminLayoutLazy = lazy(() =>
    import('@app/layouts/AdminLayout').then((m) => ({ default: m.AdminLayout })),
);

const lazyPage = (importer: () => Promise<{ default: ComponentType }>) => {
    const Page = lazy(importer);
    return (
        <Suspense fallback={null}>
            <Page />
        </Suspense>
    );
};

export const adminRoutes: RouteObject[] = [
    {
        path: '/admin',
        element: (
            <AdminGuard>
                <Suspense fallback={null}>
                    <AdminLayoutLazy />
                </Suspense>
            </AdminGuard>
        ),
        children: [
            {
                index: true,
                element: lazyPage(() =>
                    import('@pages/admin/dashboard/AdminDashboardPage').then((m) => ({
                        default: m.AdminDashboardPage,
                    })),
                ),
            },
            {
                path: 'events',
                element: lazyPage(() =>
                    import('@pages/admin/events/AdminEventsPage').then((m) => ({
                        default: m.AdminEventsPage,
                    })),
                ),
            },
            {
                path: 'events/new',
                element: lazyPage(() =>
                    import('@pages/admin/eventForm/AdminEventFormPage').then((m) => ({
                        default: m.AdminEventFormPage,
                    })),
                ),
            },
            {
                path: 'events/:eventId',
                element: lazyPage(() =>
                    import('@pages/admin/eventDetail/AdminEventDetailPage').then((m) => ({
                        default: m.AdminEventDetailPage,
                    })),
                ),
            },
            {
                path: 'events/:eventId/edit',
                element: lazyPage(() =>
                    import('@pages/admin/eventForm/AdminEventFormPage').then((m) => ({
                        default: m.AdminEventFormPage,
                    })),
                ),
            },
            {
                path: 'draw',
                element: lazyPage(() =>
                    import('@pages/admin/draw/AdminDrawPage').then((m) => ({
                        default: m.AdminDrawPage,
                    })),
                ),
            },
            {
                path: 'abuse-review',
                element: lazyPage(() =>
                    import('@pages/admin/abuseReview/AdminAbuseReviewPage').then((m) => ({
                        default: m.AdminAbuseReviewPage,
                    })),
                ),
            },
            {
                path: 'audit',
                element: lazyPage(() =>
                    import('@pages/admin/audit/AdminAuditPage').then((m) => ({
                        default: m.AdminAuditPage,
                    })),
                ),
            },
            {
                path: 'banners',
                element: lazyPage(() =>
                    import('@pages/admin/banners/AdminBannersPage').then((m) => ({
                        default: m.AdminBannersPage,
                    })),
                ),
            },
            {
                path: 'virtual-clock',
                element: lazyPage(() =>
                    import('@pages/admin/virtualClock/AdminVirtualClockPage').then((m) => ({
                        default: m.AdminVirtualClockPage,
                    })),
                ),
            },
        ],
    },
];
