import { z } from 'zod';

// 차단된 요청의 발생 단계 — 이벤트 응모와 응모권 지급을 구분한다 (getddo-spec entry.md)
export const abuseCaseTargetSchema = z.enum(['entry', 'ticket-reward']);
// 응모권 지급 차단이 적용된 지급 경로 — 출석·미션·게임의 기존 탐지는 유지하되 새 차단 범위로 확정하지 않는다
export const rewardSourceSchema = z.enum(['attendance', 'mission', 'game']);

/**
 * 지급 전 차단 내역 — spec AR01의 AbuseCaseSummary.
 * spec 요약 필드 대신 시연 표시 필드(userNickname·eventTitle·requestSummary)를 싣는다.
 * 검색·정렬·필드의 상세 계약은 GD-141 설계에서 확인한다 (getddo-spec 05-api/abuse.md)
 */
export const abuseCaseSchema = z.object({
    id: z.string(),
    target: abuseCaseTargetSchema,
    userId: z.string(),
    userNickname: z.string(),
    eventId: z.string().nullable(),
    eventTitle: z.string().nullable(),
    rewardSource: rewardSourceSchema.nullable(),
    /** 차단 사유 — 지급 전 서버 검증이 판정한 차단 근거 */
    reason: z.string(),
    /** 차단된 관련 요청의 요약 */
    requestSummary: z.string(),
    detectedAt: z.iso.datetime(),
});

// spec AR02의 AbuseCaseDetail — 차단 사유·관련 요청·검증 근거를 관리자 전용으로 제공한다
export const abuseCaseDetailSchema = abuseCaseSchema.extend({
    /** 서버 검증이 남긴 차단 근거 — 원문 근거를 일반 사용자에게 전달하지 않는다 */
    evidence: z.array(z.string()),
});

export const ABUSE_TARGET_LABEL: Record<AbuseCaseTarget, string> = {
    entry: '이벤트 응모',
    'ticket-reward': '응모권 지급',
};

export const REWARD_SOURCE_LABEL: Record<RewardSource, string> = {
    attendance: '출석',
    mission: '미션',
    game: '게임',
};

export type AbuseCaseTarget = z.infer<typeof abuseCaseTargetSchema>;
export type RewardSource = z.infer<typeof rewardSourceSchema>;
export type AbuseCase = z.infer<typeof abuseCaseSchema>;
export type AbuseCaseDetail = z.infer<typeof abuseCaseDetailSchema>;
