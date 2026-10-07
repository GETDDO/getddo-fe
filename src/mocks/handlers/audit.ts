import { http, HttpResponse } from 'msw';

import type { AuditLogDetail, AuditLogSummary } from '@entities/audit';

import { env } from '@shared/config/env';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

const okBody = (data: unknown) => ({
    success: true,
    code: 'SUCCESS',
    message: '성공했습니다.',
    data,
});
const failBody = (code: string, message: string) => ({ success: false, code, message, data: null });
const ok = (data: unknown, status = 200) => HttpResponse.json(okBody(data), { status });
const fail = (status: number, code: string, message: string) =>
    HttpResponse.json(failBody(code, message), { status });

/**
 * 감사 로그 시드 — 추첨 실행·추첨 대상 제외·당첨 취소·정책 변경 유형.
 * 목업 세션 동안 읽기 전용으로 유지된다 (계약에 수정·삭제 API가 없다).
 */
const auditLogs: AuditLogDetail[] = [
    {
        id: '0199b001-0001-7000-8000-000000000001',
        actorId: 'admin-01',
        action: 'DRAW_EXECUTE',
        targetType: 'event',
        targetId: '0199a501-0042-7000-8000-000000000042',
        reason: '마감 후 수동 추첨 실행',
        requestId: 'req-7f3a2c91',
        createdAt: '2026-10-06T05:12:00Z',
        beforeData: null,
        afterData: { winnerCount: 3, candidateCount: 128 },
    },
    {
        id: '0199b001-0002-7000-8000-000000000002',
        actorId: 'admin-02',
        action: 'ENTRY_EXCLUDE',
        targetType: 'entry',
        targetId: '0199a702-0911-7000-8000-000000000911',
        reason: '어뷰징 검토 — 비정상 반복 응모로 추첨 대상 제외',
        requestId: 'req-2b8d4e05',
        createdAt: '2026-10-05T09:40:00Z',
        beforeData: { status: 'pending' },
        afterData: { status: 'excluded' },
    },
    {
        id: '0199b001-0003-7000-8000-000000000003',
        actorId: 'admin-01',
        action: 'WIN_CANCEL',
        targetType: 'drawResult',
        targetId: '0199a803-0330-7000-8000-000000000330',
        reason: '당첨자 본인 확인 실패 — 당첨 취소',
        requestId: 'req-9c1f7a33',
        createdAt: '2026-10-05T02:18:00Z',
        beforeData: { status: 'won' },
        afterData: { status: 'canceled' },
    },
    {
        id: '0199b001-0004-7000-8000-000000000004',
        actorId: 'admin-02',
        action: 'POLICY_UPDATE',
        targetType: 'event',
        targetId: '0199a501-0042-7000-8000-000000000042',
        reason: '인당 응모권 상한 과다 설정 정정',
        requestId: 'req-5e6b8d12',
        createdAt: '2026-10-04T11:05:00Z',
        beforeData: { maxTicketsPerUser: 10 },
        afterData: { maxTicketsPerUser: 5 },
    },
    {
        id: '0199b001-0005-7000-8000-000000000005',
        actorId: null,
        action: 'DRAW_EXECUTE',
        targetType: 'event',
        targetId: '0199a501-0017-7000-8000-000000000017',
        reason: '예약 시각 도달 — 자동 추첨 실행',
        requestId: null,
        createdAt: '2026-10-04T02:00:00Z',
        beforeData: null,
        afterData: { winnerCount: 1, candidateCount: 342 },
    },
    {
        id: '0199b001-0006-7000-8000-000000000006',
        actorId: 'admin-01',
        action: 'ENTRY_EXCLUDE',
        targetType: 'entry',
        targetId: '0199a702-0455-7000-8000-000000000455',
        reason: '어뷰징 검토 — 다계정 의심으로 추첨 대상 제외',
        requestId: 'req-3d9f1a77',
        createdAt: '2026-10-03T08:52:00Z',
        beforeData: { status: 'pending' },
        afterData: { status: 'excluded' },
    },
    {
        id: '0199b001-0007-7000-8000-000000000007',
        actorId: 'admin-03',
        action: 'WIN_CANCEL',
        targetType: 'drawResult',
        targetId: '0199a803-0118-7000-8000-000000000118',
        reason: '당첨자 요청 — 수령 포기로 당첨 취소',
        requestId: 'req-8a4c6b29',
        createdAt: '2026-10-03T04:31:00Z',
        beforeData: { status: 'won' },
        afterData: { status: 'canceled' },
    },
    {
        id: '0199b001-0008-7000-8000-000000000008',
        actorId: 'admin-02',
        action: 'POLICY_UPDATE',
        targetType: 'event',
        targetId: '0199a501-0033-7000-8000-000000000033',
        reason: '멤버십 참여 조건 완화',
        requestId: 'req-1e5d9f84',
        createdAt: '2026-10-02T07:26:00Z',
        beforeData: { membershipRule: 'vvip' },
        afterData: { membershipRule: 'vip' },
    },
    {
        id: '0199b001-0009-7000-8000-000000000009',
        actorId: 'admin-01',
        action: 'DRAW_EXECUTE',
        targetType: 'event',
        targetId: '0199a501-0021-7000-8000-000000000021',
        reason: '발표 지연 — 수동 추첨 실행',
        requestId: 'req-6b2e8c40',
        createdAt: '2026-10-01T10:44:00Z',
        beforeData: null,
        afterData: { winnerCount: 5, candidateCount: 96 },
    },
    {
        id: '0199b001-0010-7000-8000-000000000010',
        actorId: null,
        action: 'ENTRY_EXCLUDE',
        targetType: 'entry',
        targetId: '0199a702-0773-7000-8000-000000000773',
        reason: '이벤트 취소에 따른 응모 일괄 제외',
        requestId: null,
        createdAt: '2026-09-30T13:57:00Z',
        beforeData: { status: 'entered' },
        afterData: { status: 'excluded' },
    },
    {
        id: '0199b001-0011-7000-8000-000000000011',
        actorId: 'admin-03',
        action: 'POLICY_UPDATE',
        targetType: 'event',
        targetId: '0199a501-0058-7000-8000-000000000058',
        reason: '가중치 적용 여부 재검토 — 비활성화',
        requestId: 'req-4f7a1d68',
        createdAt: '2026-09-29T06:33:00Z',
        beforeData: { weightingEnabled: true },
        afterData: { weightingEnabled: false },
    },
    {
        id: '0199b001-0012-7000-8000-000000000012',
        actorId: 'admin-02',
        action: 'WIN_CANCEL',
        targetType: 'drawResult',
        targetId: '0199a803-0264-7000-8000-000000000264',
        reason: '부정 당첨 확인 — 당첨 취소 후 재추첨 예정',
        requestId: 'req-0c3e5b96',
        createdAt: '2026-09-28T12:09:00Z',
        beforeData: { status: 'won' },
        afterData: { status: 'canceled' },
    },
];

// AU01 목록은 Summary만 반환한다 — 상세 필드(beforeData/afterData)는 AU02에서만 내린다
const toSummary = ({
    id,
    actorId,
    action,
    targetType,
    targetId,
    reason,
    requestId,
    createdAt,
}: AuditLogDetail): AuditLogSummary => ({
    id,
    actorId,
    action,
    targetType,
    targetId,
    reason,
    requestId,
    createdAt,
});

export const auditHandlers = [
    // AU01 — 목록: actorId/action/targetType/targetId 필터 + 기간 [from,to) + Page 봉투 (페이지는 1부터)
    http.get(api('/admin/audit-logs'), ({ request }) => {
        const url = new URL(request.url);
        const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
        const size = Math.max(1, Number(url.searchParams.get('size')) || 20);
        const actorId = url.searchParams.get('actorId');
        const action = url.searchParams.get('action');
        const targetType = url.searchParams.get('targetType');
        const targetId = url.searchParams.get('targetId');
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');

        const filtered = auditLogs
            .filter((log) => {
                if (actorId && log.actorId !== actorId) return false;
                if (action && log.action !== action) return false;
                if (targetType && log.targetType !== targetType) return false;
                if (targetId && log.targetId !== targetId) return false;
                if (from && new Date(log.createdAt) < new Date(from)) return false;
                if (to && new Date(log.createdAt) >= new Date(to)) return false;
                return true;
            })
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));

        return ok({
            items: filtered.slice((page - 1) * size, page * size).map(toSummary),
            page,
            size,
            totalElements: filtered.length,
        });
    }),

    // AU02 — 상세: Summary + beforeData/afterData
    http.get(api('/admin/audit-logs/:auditLogId'), ({ params }) => {
        const log = auditLogs.find((l) => l.id === params.auditLogId);
        if (!log) return fail(404, 'RESOURCE_NOT_FOUND', '감사 로그를 찾을 수 없습니다');
        return ok(log);
    }),
];
