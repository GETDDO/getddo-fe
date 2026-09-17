import { http, HttpResponse } from 'msw';

import { env } from '@shared/config/env';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

export const attendanceHandlers = [
    http.get(api('/attendance/me'), () =>
        HttpResponse.json({
            checkedToday: false,
            streak: 3,
            checkedDates: ['2026-09-15', '2026-09-16'],
        }),
    ),
    http.post(api('/attendance/check'), () =>
        HttpResponse.json(
            {
                checkedToday: true,
                streak: 4,
                ticketsGranted: 1,
            },
            { status: 201 },
        ),
    ),
];
