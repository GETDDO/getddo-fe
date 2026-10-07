import { z } from 'zod';

// 탐지 대상 — 이벤트 응모 검토와 응모권 지급 검토를 구분한다 (getddo-spec entry.md)
export const abuseCaseTargetSchema = z.enum(['entry', 'ticket-reward']);
export const abuseCaseStatusSchema = z.enum(['pending', 'allowed', 'excluded']);
export const abuseDecisionSchema = z.enum(['allow', 'exclude']);
// 응모권 지급 탐지가 적용되는 단계 — 출석·미션·게임 지급에도 탐지를 적용한다 (getddo-spec entry.md)
export const rewardSourceSchema = z.enum(['attendance', 'mission', 'game']);

// 검토 결과는 상태·검토자·검토 시각·사유를 함께 기록한다 (getddo-spec entry.md)
export const abuseCaseReviewSchema = z.object({
    reviewer: z.string(),
    reviewedAt: z.iso.datetime(),
    note: z.string(),
});

export const abuseCaseSchema = z.object({
    id: z.string(),
    target: abuseCaseTargetSchema,
    userId: z.string(),
    userNickname: z.string(),
    eventTitle: z.string().nullable(),
    rewardSource: rewardSourceSchema.nullable(),
    reason: z.string(),
    requestSummary: z.string(),
    detectedAt: z.iso.datetime(),
    status: abuseCaseStatusSchema,
    review: abuseCaseReviewSchema.nullable(),
});

// spec AR03 — 검토 결정 응답. 목업은 갱신된 건 전체가 아니라 계약의 결정 결과를 돌려준다
export const reviewDecisionResultSchema = z.object({
    caseId: z.string(),
    reviewStatus: z.enum(['ALLOWED', 'CONFIRMED']),
    reviewedBy: z.string(),
    reviewedAt: z.iso.datetime(),
    eligibilityStatus: z.enum(['ELIGIBLE', 'EXCLUDED']).nullable(),
    refundedTicketCount: z.number().int().nonnegative(),
});

export type AbuseCaseTarget = z.infer<typeof abuseCaseTargetSchema>;
export type AbuseCaseStatus = z.infer<typeof abuseCaseStatusSchema>;
export type AbuseDecision = z.infer<typeof abuseDecisionSchema>;
export type RewardSource = z.infer<typeof rewardSourceSchema>;
export type AbuseCaseReview = z.infer<typeof abuseCaseReviewSchema>;
export type AbuseCase = z.infer<typeof abuseCaseSchema>;
export type ReviewDecisionResult = z.infer<typeof reviewDecisionResultSchema>;
