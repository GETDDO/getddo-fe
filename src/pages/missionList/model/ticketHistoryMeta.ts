import type { TicketTransactionType } from '@entities/ticket';

type TicketHistoryMeta = {
    /** 접힌 행 둘째 줄과 상세의 '구분'에 쓰는 이름 */
    label: string;
    /** 상세에서 이어서 볼 화면 — 래플 응모·반환은 내 응모 내역, 만료·회수·정정은 내 응모권 */
    link?: { to: string; label: string };
};

const ENTRIES_LINK = { to: '/my-entries', label: '내 응모 내역 보기' };
const TICKETS_LINK = { to: '/my-tickets', label: '내 응모권 보기' };

/** 응모권 거래 구분별 표시 정보 (spec T02 TicketTransaction 유형) */
export const TICKET_HISTORY_META: Record<TicketTransactionType, TicketHistoryMeta> = {
    GRANT: { label: '적립' },
    SPEND: { label: '응모 사용', link: ENTRIES_LINK },
    REFUND: { label: '응모 취소 반환', link: ENTRIES_LINK },
    EXPIRE: { label: '기간 만료', link: TICKETS_LINK },
    REVOKE: { label: '회수', link: TICKETS_LINK },
    CORRECTION: { label: '관리자 정정', link: TICKETS_LINK },
};
