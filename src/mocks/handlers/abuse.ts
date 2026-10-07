import { http } from 'msw';

import type { AbuseCase } from '@entities/abuseCase';

import { env } from '@shared/config/env';

import { mockNow } from '../now';
import { fail, ok } from './response';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

// spec AR01의 reviewStatus(PENDING/ALLOWED/CONFIRMED)를 목업 상태값으로 환산한다 — CONFIRMED는 추첨 제외로 모은다
const STATUS_BY_REVIEW_STATUS: Record<string, AbuseCase['status']> = {
    PENDING: 'pending',
    ALLOWED: 'allowed',
    CONFIRMED: 'excluded',
};

// 목업 세션 동안 유지되는 탐지·검토 상태 — 검토 요청이 이 목록에 반영된다
const abuseCases: AbuseCase[] = [
    {
        id: 'ab-1',
        target: 'entry',
        userId: 'vu-1042',
        userNickname: '빠른손김철수',
        eventTitle: '닌텐도 스위치 2 래플',
        rewardSource: null,
        reason: '허용 횟수 초과 반복 응모',
        requestSummary: 'POST /events/evt-201/entries — 10분 내 6회 (멱등키 상이)',
        detectedAt: '2026-09-27T14:32:00Z',
        status: 'pending',
        review: null,
    },
    {
        id: 'ab-2',
        target: 'entry',
        userId: 'vu-2017',
        userNickname: '자동화테스트',
        eventTitle: '스타벅스 e카드 래플',
        rewardSource: null,
        reason: '마감 후 응모 요청',
        requestSummary: 'POST /events/evt-187/entries — 마감 23:59 이후 3회',
        detectedAt: '2026-09-27T01:15:00Z',
        status: 'pending',
        review: null,
    },
    {
        id: 'ab-3',
        target: 'ticket-reward',
        userId: 'vu-0874',
        userNickname: '보상헌터',
        eventTitle: null,
        rewardSource: 'attendance',
        reason: '출석 지급 자동화 의심',
        requestSummary: 'POST /attendances — 1초 간격 12회 연속',
        detectedAt: '2026-09-26T22:58:00Z',
        status: 'pending',
        review: null,
    },
    {
        id: 'ab-4',
        target: 'ticket-reward',
        userId: 'vu-1330',
        userNickname: '게임러너',
        eventTitle: null,
        rewardSource: 'game',
        reason: '게임 결과 비정상 제출',
        requestSummary: 'POST /games/dino/results — 동일 점수 30회 연속 제출',
        detectedAt: '2026-09-26T09:40:00Z',
        status: 'pending',
        review: null,
    },
    {
        id: 'ab-5',
        target: 'entry',
        userId: 'vu-0911',
        userNickname: '정상참가자',
        eventTitle: '5G 프리미어 가입 감사 이벤트',
        rewardSource: null,
        reason: '동일 요청 재전송 반복',
        requestSummary: 'POST /events/evt-142/entries — 멱등키 동일 4회 (네트워크 재시도 의심)',
        detectedAt: '2026-09-25T11:20:00Z',
        status: 'allowed',
        review: {
            reviewer: 'admin-01',
            reviewedAt: '2026-09-25T13:05:00Z',
            note: '멱등키가 동일한 재시도로 확인 — 통신 재시도는 부정이 아니므로 참여 허용',
        },
    },
    {
        id: 'ab-6',
        target: 'entry',
        userId: 'vu-0455',
        userNickname: '다계정의심',
        eventTitle: 'VVIP 데이터 쿠폰 래플',
        rewardSource: null,
        reason: '비정상 반복 응모',
        requestSummary: 'POST /events/evt-099/entries — 1시간 내 42회',
        detectedAt: '2026-09-24T16:47:00Z',
        status: 'excluded',
        review: {
            reviewer: 'admin-01',
            reviewedAt: '2026-09-24T18:02:00Z',
            note: '동일 패턴 반복 응모 확인 — 해당 이벤트 추첨 대상에서 제외',
        },
    },
];

export const abuseHandlers = [
    // AR01 초안 — Page 봉투. spec의 요약 필드(userId/eventId/sourceType 등)와 목업 표시 필드가 달라
    // 시연 필드를 그대로 싣고, 경로·봉투·필터 파라미터만 계약을 따른다
    http.get(api('/admin/abuse-cases'), ({ request }) => {
        const url = new URL(request.url);
        const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
        const size = Math.max(1, Number(url.searchParams.get('size')) || 20);
        const reviewStatus = url.searchParams.get('reviewStatus');
        const sourceType = url.searchParams.get('sourceType');
        const userId = url.searchParams.get('userId');

        const filtered = abuseCases.filter((item) => {
            if (reviewStatus && item.status !== STATUS_BY_REVIEW_STATUS[reviewStatus]) return false;
            if (userId && item.userId !== userId) return false;
            if (sourceType) {
                if (sourceType === 'ENTRY') return item.target === 'entry';
                if (item.target !== 'ticket-reward') return false;
                if (item.rewardSource !== sourceType.toLowerCase()) return false;
            }
            return true;
        });
        return ok({
            items: filtered.slice((page - 1) * size, page * size),
            page,
            size,
            totalElements: filtered.length,
        });
    }),
    // AR03 초안 — ReviewDecisionRequest{decision:ALLOW|CONFIRM, reason, excludeFromEvent?, userNoticeReason?} →
    // 201 ReviewDecisionResult. 내부 상태는 화면 모델(allowed/excluded)로 유지한다
    http.post(api('/admin/abuse-cases/:caseId/decisions'), async ({ params, request }) => {
        const target = abuseCases.find((c) => c.id === params.caseId);
        if (!target) {
            return fail(404, 'RESOURCE_NOT_FOUND', '탐지 건을 찾을 수 없습니다');
        }
        if (target.status !== 'pending') {
            return fail(409, 'STATE_CONFLICT', '이미 검토가 완료된 건입니다');
        }
        const body = (await request.json()) as {
            decision?: 'ALLOW' | 'CONFIRM';
            reason?: string;
            excludeFromEvent?: boolean;
            userNoticeReason?: string;
        };
        if (body.decision !== 'ALLOW' && body.decision !== 'CONFIRM') {
            return fail(400, 'COMMON-002', 'decision은 ALLOW 또는 CONFIRM이어야 합니다');
        }
        // 이벤트 제외를 요청하면 제외된 본인에게 안내될 사유가 필요하다 (spec AR03 제안)
        if (body.excludeFromEvent && !body.userNoticeReason?.trim()) {
            return fail(400, 'COMMON-002', '추첨 대상 제외 시 안내 사유가 필요합니다');
        }

        const exclude = body.decision === 'CONFIRM' && body.excludeFromEvent === true;
        target.status = exclude ? 'excluded' : 'allowed';
        target.review = {
            reviewer: 'admin-01',
            reviewedAt: mockNow().toISOString(),
            note: body.userNoticeReason?.trim() ?? body.reason?.trim() ?? '',
        };
        return ok(
            {
                caseId: target.id,
                reviewStatus: body.decision === 'ALLOW' ? 'ALLOWED' : 'CONFIRMED',
                reviewedBy: 'admin-01',
                reviewedAt: target.review.reviewedAt,
                eligibilityStatus: exclude ? 'EXCLUDED' : 'ELIGIBLE',
                refundedTicketCount: 0,
            },
            201,
        );
    }),
];
