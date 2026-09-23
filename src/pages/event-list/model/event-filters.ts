// 필터 칩 — '전체' 외에는 이벤트 tags에 같은 이름이 있으면 해당 칩에 노출한다
export const EVENT_FILTERS = [
    '전체',
    '사전예약',
    '유플러스 혜택',
    '온라인 가입 혜택',
    '모바일 온라인 가입 혜택',
    '홈 온라인 가입 혜택',
    '너겟',
    '멤버십 혜택',
] as const;

export type EventFilter = (typeof EVENT_FILTERS)[number];

// TODO: 추천 기준이 백엔드와 합의되면 교체 — 지금은 진행 중 이벤트 앞 8개
export const RECOMMENDED_COUNT = 8;

// 서버 페이지네이션 형식이 미합의(CONTEXT.md)라 전체 목록을 받아 프론트에서 나눈다
export const PAGE_SIZE = 12;
