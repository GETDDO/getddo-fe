import { http } from 'msw';

import type { PublicResults, PublishedPrize } from '@entities/drawResult';

import { env } from '@shared/config/env';

import { mockNow } from '../now';
import { ANNOUNCE_DELAY_MS, findMockEvent, type MockEvent } from './event';
import { fail, ok } from './response';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

// 마스킹된 이름 풀 — 서버가 가린 값을 흉내 낸다. 화면은 받은 문자열을 그대로 쓴다
const MASKED_NAMES = [
    '서준**',
    '김*겸',
    '이하*',
    '박서*',
    '최민*',
    '정우*',
    '한지*',
    '오예*',
    '윤도*',
    '강하*',
];

/**
 * 등수별 경품 구성.
 *
 * 목 이벤트에는 경품이 하나(prizeName·winnerCount)뿐이라 등수를 나눌 수 없다.
 * 시연에서 1·2·3등 연출을 보려면 여러 등수가 필요해 데모 래플에만 따로 적어 둔다.
 */
const PRIZE_SETS: Record<string, { rank: number; name: string; winnerCount: number }[]> = {
    'evt-112': [
        { rank: 1, name: '닌텐도 스위치 2', winnerCount: 1 },
        { rank: 2, name: '무너 메탈릭 피규어', winnerCount: 5 },
        { rank: 3, name: '무너 아크릴 키링 세트', winnerCount: 20 },
    ],
    // 등수·인원이 많은 래플 — 명단이 길어졌을 때의 스크롤을 확인한다
    'evt-113': [
        { rank: 1, name: '무너 메탈릭 피규어', winnerCount: 1 },
        { rank: 2, name: '무너 아크릴 키링 세트', winnerCount: 15 },
        { rank: 3, name: '무너 굿즈 박스', winnerCount: 40 },
    ],
    'evt-106': [
        { rank: 1, name: '다이슨 에어랩', winnerCount: 1 },
        { rank: 2, name: '스타벅스 e카드 3만원권', winnerCount: 10 },
    ],
};

/**
 * 같은 이벤트·등수·순번이면 늘 같은 당첨자를 만든다.
 *
 * 난수를 쓰면 폴링할 때마다 명단이 바뀌어 발표된 결과처럼 보이지 않는다.
 * 뒷자리는 화면의 조회 입력과 맞춰 보는 값이라 특히 고정되어야 한다.
 */
function seededWinner(eventId: string, rank: number, index: number) {
    let hash = 0;
    for (const char of `${eventId}-${rank}-${index}`) {
        hash = (hash * 31 + char.charCodeAt(0)) % 100_000;
    }
    return {
        maskedName: MASKED_NAMES[hash % MASKED_NAMES.length] ?? '익명**',
        maskedPhoneNum: String(hash % 10_000).padStart(4, '0'),
    };
}

function buildPrizes(event: MockEvent): PublishedPrize[] {
    const set = PRIZE_SETS[event.id] ?? [
        { rank: 1, name: event.prizeName, winnerCount: event.winnerCount },
    ];

    // 응모자가 모자라면 자리를 다 채우지 못한다 — 확정된 미충원만 unfilledCount로 적는다
    const participants = event.participantCount ?? 0;

    return (
        set
            // 하위 등수부터 연출할 수 있도록 등수 내림차순으로 내려준다 (05-api/drawing.md)
            .sort((a, b) => b.rank - a.rank)
            .map(({ rank, name, winnerCount }) => {
                const filled = Math.min(winnerCount, Math.max(0, participants));
                return {
                    prizeId: `${event.id}-prize-${rank}`,
                    rank,
                    name,
                    winnerCount: filled,
                    unfilledCount: winnerCount - filled,
                    winners: Array.from({ length: filled }, (_, index) =>
                        seededWinner(event.id, rank, index),
                    ),
                };
            })
    );
}

function buildResults(event: MockEvent, now: number): PublicResults {
    const ends = new Date(event.endsAt).getTime();
    const scheduledAt = ends + ANNOUNCE_DELAY_MS;
    // 예정 시각이 지나야 공개한다. 서버가 판정할 몫이라 목업도 같은 기준을 쓴다
    const isPublished = now >= scheduledAt;
    const hasEntrants = (event.participantCount ?? 0) > 0;

    const displayStatus: PublicResults['displayStatus'] = !isPublished
        ? 'WAITING'
        : hasEntrants
          ? 'PUBLISHED'
          : 'NO_ENTRANTS';

    return {
        eventId: event.id,
        isPublished,
        publicationScheduledAt: new Date(scheduledAt).toISOString(),
        // 발표 전에는 공개 정보를 하나도 싣지 않는다 (05-api/drawing.md)
        publishedAt: isPublished ? new Date(scheduledAt).toISOString() : null,
        revision: isPublished ? 1 : null,
        updatedAt: isPublished ? new Date(scheduledAt).toISOString() : null,
        serverTime: new Date(now).toISOString(),
        displayStatus,
        prizes: isPublished && hasEntrants ? buildPrizes(event) : [],
    };
}

export const drawResultHandlers = [
    // E08 — 공개 결과 조회
    http.get(api('/events/:eventId/results'), ({ params }) => {
        const eventId = String(params.eventId);
        const event = findMockEvent(eventId);
        if (!event) return fail(404, 'EVENT_NOT_FOUND', '이벤트를 찾을 수 없습니다');

        return ok(buildResults(event, mockNow().getTime()));
    }),
];
