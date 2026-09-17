import { http, HttpResponse } from 'msw';

import { env } from '@shared/config/env';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

const mockMissions = [
    {
        id: 'msn-1',
        title: '알림 수신 동의하기',
        type: 'survey',
        rewardTickets: 1,
        status: 'available',
    },
    { id: 'msn-2', title: '5G 퀴즈 풀기', type: 'quiz', rewardTickets: 2, status: 'available' },
];

export const missionHandlers = [
    http.get(api('/missions'), () => HttpResponse.json(mockMissions)),
    http.post(api('/missions/:missionId/submit'), ({ params }) =>
        HttpResponse.json(
            { missionId: params.missionId, status: 'completed', ticketsGranted: 1 },
            { status: 201 },
        ),
    ),
];
