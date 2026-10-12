import { http } from 'msw';

import type { AbuseCaseDetail } from '@entities/abuseCase';

import { env } from '@shared/config/env';

import { fail, ok } from './response';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

// 목업 세션 동안 유지되는 차단 기록 — 지급 전 서버 검증에서 차단된 요청만 남는다.
// 차단되지 않고 지급된 요청은 이 기록에 나타나지 않는다 (spec AR01·AR02)
const abuseCases: AbuseCaseDetail[] = [
    {
        id: 'ab-1',
        target: 'entry',
        userId: 'vu-1042',
        userNickname: '빠른손김철수',
        eventId: 'evt-201',
        eventTitle: '닌텐도 스위치 2 래플',
        rewardSource: null,
        reason: '허용 횟수 초과 반복 응모',
        requestSummary: 'POST /events/evt-201/entries — 10분 내 6회 (멱등키 상이)',
        detectedAt: '2026-09-27T14:32:00Z',
        evidence: [
            '10분 윈도 내 동일 사용자 응모 요청 6회',
            '멱등키가 서로 다른 신규 요청으로 판정',
            '요청 원본 IP·디바이스 지문 동일',
        ],
    },
    {
        id: 'ab-2',
        target: 'entry',
        userId: 'vu-2017',
        userNickname: '자동화테스트',
        eventId: 'evt-187',
        eventTitle: '스타벅스 e카드 래플',
        rewardSource: null,
        reason: '마감 후 응모 요청',
        requestSummary: 'POST /events/evt-187/entries — 마감 23:59 이후 3회',
        detectedAt: '2026-09-27T01:15:00Z',
        evidence: [
            '이벤트 마감 시각(2026-09-26 23:59 KST) 이후 수신된 요청 3건',
            '서버 수신 시각 기준 초과 판정',
        ],
    },
    {
        id: 'ab-3',
        target: 'ticket-reward',
        userId: 'vu-0874',
        userNickname: '보상헌터',
        eventId: null,
        eventTitle: null,
        rewardSource: 'attendance',
        reason: '출석 지급 요청 빈도 제한 초과',
        requestSummary: 'POST /attendances — 1초 간격 12회 연속',
        detectedAt: '2026-09-26T22:58:00Z',
        evidence: ['1초 간격 연속 호출 12회', '요청 간격 편차 50ms 미만 — 비정상 호출 패턴'],
    },
    {
        id: 'ab-4',
        target: 'ticket-reward',
        userId: 'vu-1330',
        userNickname: '게임러너',
        eventId: null,
        eventTitle: null,
        rewardSource: 'game',
        reason: '게임 결과 비정상 제출',
        requestSummary: 'POST /games/dino/results — 동일 점수 30회 연속 제출',
        detectedAt: '2026-09-26T09:40:00Z',
        evidence: ['동일 점수 30회 연속 제출', '플레이 시간 대비 획득 점수 상한 초과'],
    },
    {
        id: 'ab-6',
        target: 'entry',
        userId: 'vu-0455',
        userNickname: '다계정의심',
        eventId: 'evt-099',
        eventTitle: 'VVIP 데이터 쿠폰 래플',
        rewardSource: null,
        reason: '비정상 반복 응모',
        requestSummary: 'POST /events/evt-099/entries — 1시간 내 42회',
        detectedAt: '2026-09-24T16:47:00Z',
        evidence: ['1시간 내 동일 계정 응모 요청 42회', '동일 IP 대역의 다계정 패턴 탐지'],
    },
];

export const abuseHandlers = [
    // AR01 초안 — Page 봉투. spec의 요약 필드(sourceType·detectionType 등)와 목업 표시 필드가 달라
    // 시연 필드를 그대로 싣고, 경로·봉투·필터 파라미터만 계약을 따른다. 최신 차단 순으로 내린다
    http.get(api('/admin/abuse-cases'), ({ request }) => {
        const url = new URL(request.url);
        const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
        const size = Math.max(1, Number(url.searchParams.get('size')) || 20);
        const userId = url.searchParams.get('userId');
        const eventId = url.searchParams.get('eventId');
        const sourceType = url.searchParams.get('sourceType');
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');

        const filtered = abuseCases
            .filter((item) => {
                if (userId && item.userId !== userId) return false;
                if (eventId && item.eventId !== eventId) return false;
                if (from && item.detectedAt < from) return false;
                if (to && item.detectedAt >= to) return false;
                if (sourceType) {
                    if (sourceType === 'ENTRY') return item.target === 'entry';
                    if (item.target !== 'ticket-reward') return false;
                    if (item.rewardSource !== sourceType.toLowerCase()) return false;
                }
                return true;
            })
            .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
        return ok({
            items: filtered.slice((page - 1) * size, page * size),
            page,
            size,
            totalElements: filtered.length,
        });
    }),
    // AR02 초안 — AbuseCaseDetail: 차단 사유·관련 요청·검증 근거를 관리자 전용으로 내린다
    http.get(api('/admin/abuse-cases/:caseId'), ({ params }) => {
        const target = abuseCases.find((c) => c.id === params.caseId);
        if (!target) {
            return fail(404, 'RESOURCE_NOT_FOUND', '차단 내역을 찾을 수 없습니다');
        }
        return ok(target);
    }),
];
