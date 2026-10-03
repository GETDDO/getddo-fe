import { http, HttpResponse } from 'msw';

import type { AbuseCase, AbuseDecision } from '@entities/abuseCase';

import { env } from '@shared/config/env';

import { mockNow } from '../now';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

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
    http.get(api('/admin/abuse-cases'), () => HttpResponse.json(abuseCases)),
    http.post(api('/admin/abuse-cases/:id/review'), async ({ params, request }) => {
        const target = abuseCases.find((c) => c.id === params.id);
        if (!target) {
            return HttpResponse.json(
                { code: 'ABUSE_CASE_NOT_FOUND', message: '탐지 건을 찾을 수 없습니다' },
                { status: 404 },
            );
        }
        if (target.status !== 'pending') {
            return HttpResponse.json(
                { code: 'ALREADY_REVIEWED', message: '이미 검토가 완료된 건입니다' },
                { status: 409 },
            );
        }
        const { decision, note } = (await request.json()) as {
            decision?: AbuseDecision;
            note?: string;
        };
        if (decision !== 'allow' && decision !== 'exclude') {
            return HttpResponse.json(
                { code: 'INVALID_DECISION', message: 'decision은 allow 또는 exclude여야 합니다' },
                { status: 400 },
            );
        }
        if (decision === 'exclude' && !note?.trim()) {
            return HttpResponse.json(
                { code: 'REVIEW_NOTE_REQUIRED', message: '제외 시 사유 기록이 필요합니다' },
                { status: 400 },
            );
        }
        target.status = decision === 'allow' ? 'allowed' : 'excluded';
        target.review = {
            reviewer: 'admin-01',
            reviewedAt: mockNow().toISOString(),
            note: note?.trim() ?? '',
        };
        return HttpResponse.json(target);
    }),
];
