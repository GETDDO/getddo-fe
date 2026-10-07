import { z } from 'zod';

// AU01 목록 항목 (getddo-spec 05-api/audit.md 초안 — 검토 대기, 조회 전용)
export const auditLogSummarySchema = z.object({
    id: z.string(),
    // 시스템이 기록한 작업은 처리자가 없어 null이다
    actorId: z.string().nullable(),
    action: z.string(),
    targetType: z.string(),
    targetId: z.string(),
    reason: z.string().nullable(),
    requestId: z.string().nullable(),
    createdAt: z.iso.datetime(),
});

// AU02 상세 — 변경 근거 데이터. 비밀값·무관한 개인정보는 서버가 넣지 않는다
export const auditLogDetailSchema = auditLogSummarySchema.extend({
    beforeData: z.record(z.string(), z.unknown()).nullable(),
    afterData: z.record(z.string(), z.unknown()).nullable(),
});

export type AuditLogSummary = z.infer<typeof auditLogSummarySchema>;
export type AuditLogDetail = z.infer<typeof auditLogDetailSchema>;

/**
 * 알려진 action 값의 표시 레이블. 계약은 action을 자유 문자열로 두므로
 * 목록에 없는 값은 원문 그대로 보여준다 — 초안이 확정되며 값이 늘어날 수 있다.
 */
export const AUDIT_ACTION_LABEL: Record<string, string> = {
    DRAW_EXECUTE: '추첨 실행',
    ENTRY_EXCLUDE: '추첨 대상 제외',
    WIN_CANCEL: '당첨 취소',
    POLICY_UPDATE: '정책 변경',
};

// 자유 문자열 키를 그대로 조회하면 '__proto__' 같은 상속 속성이 반환돼 렌더가 깨진다 — 고유 키만 레이블로 인정한다
export const auditActionLabel = (action: string) =>
    Object.hasOwn(AUDIT_ACTION_LABEL, action) ? AUDIT_ACTION_LABEL[action] : action;

export const AUDIT_TARGET_TYPE_LABEL: Record<string, string> = {
    event: '이벤트',
    entry: '응모',
    drawResult: '추첨 결과',
};

export const auditTargetTypeLabel = (targetType: string) =>
    Object.hasOwn(AUDIT_TARGET_TYPE_LABEL, targetType)
        ? AUDIT_TARGET_TYPE_LABEL[targetType]
        : targetType;
