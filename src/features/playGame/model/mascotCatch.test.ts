import {
    createMascotCatchRound,
    judgeMascotCatch,
    mascotCatchPoints,
    mascotCatchPosition,
    mascotCatchSweepMs,
    mascotCatchZoneWidth,
} from './mascotCatch';

describe('mascotCatch', () => {
    it('성공할수록 빨라지고 금색 구간이 좁아지되 한계 아래로는 내려가지 않는다', () => {
        expect(mascotCatchSweepMs(0)).toBe(1600);
        expect(mascotCatchSweepMs(5)).toBe(1300);
        expect(mascotCatchSweepMs(100)).toBe(650);
        expect(mascotCatchZoneWidth(0)).toBeCloseTo(0.22);
        expect(mascotCatchZoneWidth(5)).toBeCloseTo(0.17);
        expect(mascotCatchZoneWidth(100)).toBeCloseTo(0.09);
    });

    it('타코야끼는 0에서 1까지 갔다가 되돌아온다', () => {
        expect(mascotCatchPosition(0, 1000)).toBe(0);
        expect(mascotCatchPosition(500, 1000)).toBeCloseTo(0.5);
        expect(mascotCatchPosition(1000, 1000)).toBe(1);
        expect(mascotCatchPosition(1500, 1000)).toBeCloseTo(0.5);
        expect(mascotCatchPosition(2000, 1000)).toBe(0);
    });

    it('금색 구간 가운데는 퍼펙트, 구간 안은 성공, 밖은 실패로 채점한다', () => {
        const round = { center: 0.5, width: 0.2, sweepMs: 1000 };
        expect(judgeMascotCatch(0.51, round)).toBe('perfect');
        expect(judgeMascotCatch(0.58, round)).toBe('hit');
        expect(judgeMascotCatch(0.6, round)).toBe('hit');
        expect(judgeMascotCatch(0.65, round)).toBe('miss');
        expect(mascotCatchPoints('perfect')).toBe(20);
        expect(mascotCatchPoints('hit')).toBe(10);
        expect(mascotCatchPoints('miss')).toBe(0);
    });

    it('금색 구간은 길 양 끝에 붙지 않고, 앞 판과 겹치면 반대편으로 옮긴다', () => {
        const low = createMascotCatchRound(() => 0, 0);
        const high = createMascotCatchRound(() => 1, 0);
        expect(low.center - low.width / 2).toBeGreaterThanOrEqual(0.08 - 1e-9);
        expect(high.center + high.width / 2).toBeLessThanOrEqual(0.92 + 1e-9);

        const again = createMascotCatchRound(() => 0, 0, low);
        expect(Math.abs(again.center - low.center)).toBeGreaterThanOrEqual(low.width);
    });
});
