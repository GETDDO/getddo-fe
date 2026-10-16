import type { TicketGrade, TicketSourceType } from '@entities/ticket';

import { useAdminTicketGrantCounts, useAdminTicketHistoryCounts } from '@entities/ticket';
import { recentKstDays } from '@shared/lib/date';
import { useVirtualClock } from '@shared/lib/virtualClock';

export const TREND_SOURCES: readonly TicketSourceType[] = ['ATTENDANCE', 'MISSION', 'GAME'];
const GRADES: readonly TicketGrade[] = ['BRONZE', 'SILVER', 'GOLD'];

/** 대시보드 기간 — 집계 API가 없어 날짜×출처마다 건수를 따로 불러오므로 2주까지만 둔다 */
export const TREND_PERIODS = [
    { value: '7', label: '7일' },
    { value: '14', label: '14일' },
] as const;
export type TrendPeriod = (typeof TREND_PERIODS)[number]['value'];

export interface TrendRow {
    ymd: string;
    /** 축 라벨 "10/16" */
    label: string;
    ATTENDANCE: number;
    MISSION: number;
    GAME: number;
    /** 그날 지급 합계 */
    granted: number;
    /** 그날 응모에 쓴 응모권 수 (USE 이력) */
    used: number;
}

const axisLabel = (ymd: string) => {
    const [, month, day] = ymd.split('-');
    return `${Number(month)}/${Number(day)}`;
};

/**
 * 최근 days일(KST)의 날짜별 지급(출처별)·응모 건수와 기간 전체 등급 분포.
 * 가상 시계 기준 오늘까지 센다 — 조건별 건수 조회를 모아 만든 값이다
 */
export function useTicketTrend(days: number) {
    const ranges = recentKstDays(useVirtualClock().now(), days);
    const period = { from: ranges[0]?.from, to: ranges.at(-1)?.to };

    const grants = useAdminTicketGrantCounts(
        ranges.flatMap(({ from, to }) =>
            TREND_SOURCES.map((sourceType) => ({ sourceType, from, to })),
        ),
    );
    const uses = useAdminTicketHistoryCounts(
        ranges.map(({ from, to }) => ({ operationType: 'USE', from, to })),
    );
    const grades = useAdminTicketGrantCounts(GRADES.map((grade) => ({ grade, ...period })));

    const rows: TrendRow[] = ranges.map(({ ymd }, index) => {
        const [attendance = 0, mission = 0, game = 0] = TREND_SOURCES.map(
            (_, sourceIndex) => grants.counts[index * TREND_SOURCES.length + sourceIndex] ?? 0,
        );
        return {
            ymd,
            label: axisLabel(ymd),
            ATTENDANCE: attendance,
            MISSION: mission,
            GAME: game,
            granted: attendance + mission + game,
            used: uses.counts[index] ?? 0,
        };
    });

    return {
        rows,
        grades: GRADES.map((grade, index) => ({ grade, count: grades.counts[index] ?? 0 })),
        trend: {
            isPending: grants.isPending || uses.isPending,
            isError: grants.isError || uses.isError,
            refetch: () => {
                grants.refetch();
                uses.refetch();
            },
        },
        gradeStatus: grades,
    };
}
