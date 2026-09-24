// 필터 칩 — '전체' 외에는 이벤트 tags에 같은 이름이 있으면 해당 칩에 노출한다.
// 경품 성격으로 나눈다. 응모권 사용 여부는 requiredTickets로 판단하므로 칩에 넣지 않는다.
export const EVENT_FILTERS = [
    '전체',
    '디지털기기',
    '기프티콘·상품권',
    '한정 굿즈',
    '데이터·통신',
    '멤버십 혜택',
] as const;

export type EventFilter = (typeof EVENT_FILTERS)[number];

// 서버 페이지네이션 형식이 미합의(CONTEXT.md)라 전체 목록을 받아 프론트에서 나눈다
export const PAGE_SIZE = 12;
