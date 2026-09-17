import type { RouteObject } from 'react-router-dom';

import { AttendancePage } from '@pages/attendance';
import { EventDetailPage } from '@pages/event-detail';
import { EventListPage } from '@pages/event-list';
import { GameHubPage } from '@pages/game-hub';
import { MissionListPage } from '@pages/mission-list';
import { MyEntriesPage } from '@pages/my-entries';
import { MyTicketsPage } from '@pages/my-tickets';
import { MyPage } from '@pages/mypage';

export const userRoutes: RouteObject[] = [
    { path: '/', element: <EventListPage /> },
    { path: '/events/:id', element: <EventDetailPage /> },
    { path: '/attendance', element: <AttendancePage /> },
    { path: '/missions', element: <MissionListPage /> },
    { path: '/games', element: <GameHubPage /> },
    { path: '/my-tickets', element: <MyTicketsPage /> },
    { path: '/my-entries', element: <MyEntriesPage /> },
    { path: '/mypage', element: <MyPage /> },
];
