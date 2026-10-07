import type { RouteObject } from 'react-router-dom';

import { lazy, Suspense } from 'react';

import { UserLayout } from '@app/layouts/UserLayout';
import { UserGuard } from '@app/routes/UserGuard';
import { EventDetailPage } from '@pages/eventDetail/EventDetailPage';
import { EventListPage } from '@pages/eventList/EventListPage';
import { GameDetailPage } from '@pages/gameDetail/GameDetailPage';
import { HomePage } from '@pages/home/HomePage';
import { LoginPage } from '@pages/login/LoginPage';
import { MissionDetailPage } from '@pages/missionDetail/MissionDetailPage';
import { MissionListPage } from '@pages/missionList/MissionListPage';
import { MyEntriesPage } from '@pages/myEntries/MyEntriesPage';
import { MyPage } from '@pages/myPage/MyPage';
import { MyTicketsPage } from '@pages/myTickets/MyTicketsPage';
import { TimeRafflePage } from '@pages/timeRaffle/TimeRafflePage';
import { TimeRaffleDetailPage } from '@pages/timeRaffleDetail/TimeRaffleDetailPage';
import { env } from '@shared/config/env';

// 디자인 갤러리는 개발용 화면 — 운영 빌드에서는 라우트 자체를 등록하지 않는다
const UiGalleryPageLazy = lazy(() =>
    import('@pages/uiGallery/UiGalleryPage').then((m) => ({ default: m.UiGalleryPage })),
);

export const userRoutes: RouteObject[] = [
    { path: '/login', element: <LoginPage /> },
    {
        element: (
            <UserGuard>
                <UserLayout />
            </UserGuard>
        ),
        children: [
            { path: '/', element: <HomePage /> },
            { path: '/time-raffle', element: <TimeRafflePage /> },
            { path: '/time-raffle/:id', element: <TimeRaffleDetailPage /> },
            { path: '/events', element: <EventListPage /> },
            { path: '/events/:id', element: <EventDetailPage /> },
            { path: '/missions', element: <MissionListPage /> },
            { path: '/missions/:missionId', element: <MissionDetailPage /> },
            { path: '/missions/games/:gameId', element: <GameDetailPage /> },
            { path: '/my-tickets', element: <MyTicketsPage /> },
            { path: '/my-entries', element: <MyEntriesPage /> },
            { path: '/mypage', element: <MyPage /> },
            ...(env.isDev
                ? ([
                      {
                          path: '/ui-gallery',
                          element: (
                              <Suspense fallback={null}>
                                  <UiGalleryPageLazy />
                              </Suspense>
                          ),
                      },
                  ] satisfies RouteObject[])
                : []),
        ],
    },
];
