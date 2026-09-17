import { http, HttpResponse } from 'msw';

import { env } from '@shared/config/env';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

const mockEvents = [
    {
        id: 'evt-001',
        title: '5G 프리미어 가입 감사 이벤트',
        description: '응모권 1장으로 참여하는 추첨 이벤트',
        bannerImageUrl: null,
        startsAt: '2026-09-01T00:00:00Z',
        endsAt: '2026-09-30T14:59:59Z',
        status: 'open',
        requiredTickets: 1,
        prizeName: '갤럭시 버즈',
        winnerCount: 10,
    },
    {
        id: 'evt-002',
        title: '출석왕 챌린지',
        description: '이번 달 출석 미션 완주자 대상 추첨',
        bannerImageUrl: null,
        startsAt: '2026-09-01T00:00:00Z',
        endsAt: '2026-10-31T14:59:59Z',
        status: 'open',
        requiredTickets: 3,
        prizeName: '네이버페이 포인트 5만원',
        winnerCount: 100,
    },
];

export const eventHandlers = [
    http.get(api('/events'), () => HttpResponse.json(mockEvents)),
    http.get(api('/events/:eventId'), ({ params }) => {
        const event = mockEvents.find((e) => e.id === params.eventId);
        if (!event) {
            return HttpResponse.json(
                { code: 'EVENT_NOT_FOUND', message: '이벤트를 찾을 수 없습니다' },
                { status: 404 },
            );
        }
        return HttpResponse.json(event);
    }),
];
