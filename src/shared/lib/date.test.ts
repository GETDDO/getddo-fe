import { kstInputToUtcIso, kstNextMonthStart, utcIsoToKstInput } from './date';

describe('kstNextMonthStart', () => {
    it('다음 달 1일 00:00 KST를 반환한다', () => {
        // 2026-09-28 12:00 KST = 2026-09-28T03:00:00Z
        const next = kstNextMonthStart(new Date('2026-09-28T03:00:00Z'));
        expect(next.toISOString()).toBe('2026-09-30T15:00:00.000Z');
    });

    it('12월에는 다음 해 1월 1일로 넘어간다', () => {
        const next = kstNextMonthStart(new Date('2026-12-15T00:00:00Z'));
        expect(next.toISOString()).toBe('2026-12-31T15:00:00.000Z');
    });

    it('월 경계를 넘은 UTC 시각은 KST 기준 다음 달로 판정한다', () => {
        // UTC 9월 30일 16:00 = KST 10월 1일 01:00 — 이미 10월이므로 만료일은 11월 1일
        const next = kstNextMonthStart(new Date('2026-09-30T16:00:00Z'));
        expect(next.toISOString()).toBe('2026-10-31T15:00:00.000Z');
    });
});

describe('kstInputToUtcIso / utcIsoToKstInput', () => {
    it('datetime-local 입력을 KST로 해석해 UTC ISO로 변환한다', () => {
        expect(kstInputToUtcIso('2026-10-07T15:00')).toBe('2026-10-07T06:00:00.000Z');
    });

    it('UTC ISO를 datetime-local 입력값(KST)으로 되돌린다', () => {
        expect(utcIsoToKstInput('2026-10-07T06:00:00.000Z')).toBe('2026-10-07T15:00');
    });

    it('KST 자정 경계를 넘나들어도 날짜가 맞다', () => {
        expect(kstInputToUtcIso('2026-10-07T00:30')).toBe('2026-10-06T15:30:00.000Z');
        expect(utcIsoToKstInput('2026-10-06T15:30:00.000Z')).toBe('2026-10-07T00:30');
    });
});
