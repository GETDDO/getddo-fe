import type { TicketGrade } from './types';

// 등급 표시 이름 — 응모권 이력·보유 묶음에서 등급을 한글로 읽힐 때 쓴다
export const TICKET_GRADE_LABEL: Record<TicketGrade, string> = {
    BRONZE: '브론즈',
    SILVER: '실버',
    GOLD: '골드',
};
