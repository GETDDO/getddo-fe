import type { TicketOperationType } from './history';

// 이력 한 건은 응모권 한 장의 처리라 보유 장수 변동으로 환산하면 지급·반환 +1, 사용·만료 -1이다.
// 정정은 장수를 바꾸지 않으므로 null — 화면은 변동 칸을 비운다
export const TICKET_OPERATION_DELTA: Record<TicketOperationType, number | null> = {
    GRANT: 1,
    REFUND: 1,
    USE: -1,
    EXPIRE: -1,
    CORRECTION: null,
};
