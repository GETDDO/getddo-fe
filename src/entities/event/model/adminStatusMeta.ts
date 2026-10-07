import type { AdminEventStatus, EventType, MembershipRule } from './adminTypes';

// 관리자 상태 칩의 표시 메타 — 목록 테이블과 상세 화면이 함께 쓴다 (spec 05-api/event.md EventStatus)
export const ADMIN_STATUS_META: Record<AdminEventStatus, { label: string; chipClass: string }> = {
    SCHEDULED: { label: '진행 예정', chipClass: 'bg-status-pending text-status-pending-text' },
    OPEN: { label: '진행 중', chipClass: 'bg-status-approved text-status-approved-text' },
    CLOSED: { label: '마감', chipClass: 'bg-surface-sunken text-fg-secondary' },
    DRAW_CONFIRMED: {
        label: '추첨 확정·발표 대기',
        chipClass: 'bg-status-pending text-status-pending-text',
    },
    PUBLISHED: { label: '발표 완료', chipClass: 'bg-status-approved text-status-approved-text' },
    CANCELED: { label: '취소', chipClass: 'bg-status-rejected text-status-rejected-text' },
    REDRAWING: { label: '재추첨 중', chipClass: 'bg-status-pending text-status-pending-text' },
    NO_ENTRANTS: { label: '응모자 없음', chipClass: 'bg-surface-sunken text-fg-secondary' },
    NO_ELIGIBLE_ENTRANTS: {
        label: '추첨 대상 없음',
        chipClass: 'bg-surface-sunken text-fg-secondary',
    },
};

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
    NO_TICKET: '응모권 미사용',
    TICKET: '응모권 사용',
};

export const MEMBERSHIP_LABEL: Record<MembershipRule, string> = {
    excellent: '우수',
    vip: 'VIP',
    vvip: 'VVIP',
};
