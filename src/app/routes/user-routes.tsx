import type { RouteObject } from 'react-router-dom';

import { UserLayout } from '@app/layouts/UserLayout';
import { AttendancePage } from '@pages/attendance';
import { EventDetailPage } from '@pages/event-detail';
import { EventListPage } from '@pages/event-list';
import { GameHubPage } from '@pages/game-hub';
import { HomePage } from '@pages/home';
import { MissionListPage } from '@pages/mission-list';
import { MyEntriesPage } from '@pages/my-entries';
import { MyTicketsPage } from '@pages/my-tickets';
import { MyPage } from '@pages/mypage';
import { TimeRafflePage } from '@pages/time-raffle';
import { UiGalleryPage } from '@pages/ui-gallery';

export const userRoutes: RouteObject[] = [
    {
        element: <UserLayout />,
        children: [
            { path: '/', element: <HomePage /> },
            { path: '/time-raffle', element: <TimeRafflePage /> },
            { path: '/events', element: <EventListPage /> },
            { path: '/events/:id', element: <EventDetailPage /> },
            { path: '/attendance', element: <AttendancePage /> },
            { path: '/missions', element: <MissionListPage /> },
            { path: '/games', element: <GameHubPage /> },
            { path: '/my-tickets', element: <MyTicketsPage /> },
            { path: '/my-entries', element: <MyEntriesPage /> },
            { path: '/mypage', element: <MyPage /> },
            { path: '/ui-gallery', element: <UiGalleryPage /> },
        ],
    },
];
