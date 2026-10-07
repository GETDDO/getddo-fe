/**
 * 출석 카드가 넓어지거나 좁아지는 시간(ms). 페이지의 열 너비 전환과 카드의 대기 시간이 같은 값을 쓴다
 */
export const ATTENDANCE_WIDEN_MS = 300;

/** 출석 카드 펼침 변경 옵션 — animate면 페이지가 열 너비를 부드럽게 바꾼다 (펼치기·접기·출석 직후) */
export interface AttendanceExpandOptions {
    animate?: boolean;
}

/** 출석 직후 오늘 칸 연출 — 반죽이 구워지는 시간, 타코야끼가 떨어져 찍히는 시간(ms) */
export const REVEAL_BAKE_MS = 1000;
export const REVEAL_LAND_MS = 420;

/** 떨어지는 타코야끼가 판에 닿는 시점 — 찍힘 연출 시간 중 비율 (이때 납작하게 눌린다) */
export const REVEAL_HIT_AT = 0.5;
