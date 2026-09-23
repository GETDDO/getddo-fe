import { toKst } from '@shared/lib/date';

const DAY_MS = 24 * 60 * 60 * 1000;

// 카드 표시용 "2026-09-01" 형태
export function formatYmd(date: string): string {
    const d = toKst(date);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

// KST 달력 날짜 기준 D-day (마감 당일 = D-0)
export function kstDayDiff(endIso: string, now: Date): number {
    const end = toKst(endIso);
    const n = toKst(now);
    const endDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
    const nowDay = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
    return Math.round((endDay - nowDay) / DAY_MS);
}
