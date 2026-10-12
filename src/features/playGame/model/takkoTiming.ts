/**
 * 타꼬 타이밍 맞추기 규칙 — 금색 구간에 선 타꼬 위를 좌우로 오가는 이쑤시개를 구간 안에서 꽂는다.
 * 한 번이라도 구간 밖에 꽂으면 끝나고(목숨·제한 시간 없음), 성공할수록 빨라지고 금색 구간이 좁아진다.
 * 위치(이쑤시개)는 길 왼쪽 끝 0 ~ 오른쪽 끝 1 비율로 다룬다
 */

/** 금색 구간 안에서 멈추면 받는 점수 */
export const TAKKO_TIMING_POINTS = 10;
/** 금색 구간 가운데 가까이(퍼펙트) 멈추면 받는 점수 — 일반 성공의 두 배 */
export const TAKKO_TIMING_PERFECT_POINTS = 20;

/** 금색 구간 폭 가운데 이 비율 안쪽에 멈추면 퍼펙트 */
const PERFECT_RATIO = 0.3;
/** 금색 구간이 길 양 끝에 붙지 않게 두는 여백 */
const EDGE_MARGIN = 0.08;

export interface TakkoTimingRound {
    /** 금색 구간 가운데 위치 (0~1) */
    center: number;
    /** 금색 구간 폭 (0~1) */
    width: number;
    /** 타코야끼가 한쪽 끝에서 반대쪽 끝까지 가는 시간(ms) */
    sweepMs: number;
}

export type TakkoTimingResult = 'perfect' | 'hit' | 'miss';

/** 한쪽 끝에서 반대쪽 끝까지 가는 시간(ms) — 1.6초에서 시작해 성공할 때마다 0.06초씩 줄고 0.65초 아래로는 내려가지 않는다 */
export function takkoTimingSweepMs(successCount: number): number {
    return Math.max(650, 1600 - successCount * 60);
}

/** 금색 구간 폭 — 길의 22%에서 시작해 성공할 때마다 1%씩 좁아지고 9% 아래로는 좁아지지 않는다 */
export function takkoTimingZoneWidth(successCount: number): number {
    return Math.max(0.09, 0.22 - successCount * 0.01);
}

/** 새 판 — 금색 구간 위치를 앞 판과 겹치지 않게 무작위로 정한다 */
export function createTakkoTimingRound(
    random: () => number,
    successCount: number,
    previous?: TakkoTimingRound,
): TakkoTimingRound {
    const width = takkoTimingZoneWidth(successCount);
    const min = EDGE_MARGIN + width / 2;
    const span = 1 - min * 2;
    let center = min + random() * span;
    // 앞 판과 거의 같은 자리면 길 반대편으로 옮겨 매번 위치를 새로 보게 한다
    if (previous && Math.abs(previous.center - center) < width) center = 1 - center;
    return { center, width, sweepMs: takkoTimingSweepMs(successCount) };
}

/** 지난 시간(ms)에 따른 타코야끼 위치 — 0에서 출발해 1까지 갔다가 되돌아오기를 반복한다 */
export function takkoTimingPosition(elapsedMs: number, sweepMs: number): number {
    const phase = (Math.max(0, elapsedMs) / sweepMs) % 2;
    return phase <= 1 ? phase : 2 - phase;
}

/** 멈춘 위치 채점 — 금색 구간 가운데 가까이면 퍼펙트, 구간 안이면 성공, 밖이면 실패 */
export function judgeTakkoTiming(position: number, round: TakkoTimingRound): TakkoTimingResult {
    const distance = Math.abs(position - round.center);
    if (distance <= (round.width / 2) * PERFECT_RATIO) return 'perfect';
    if (distance <= round.width / 2) return 'hit';
    return 'miss';
}

export const takkoTimingPoints = (result: TakkoTimingResult) =>
    result === 'perfect' ? TAKKO_TIMING_PERFECT_POINTS : result === 'hit' ? TAKKO_TIMING_POINTS : 0;
