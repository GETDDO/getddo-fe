import { useReducedMotion } from 'framer-motion';
import { useId } from 'react';
import { Link } from 'react-router-dom';
import {
    Area,
    CartesianGrid,
    ComposedChart,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { TICKET_SOURCE_TYPE_LABEL } from '@entities/ticket';
import { formatNumber } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { LoadingBlock, Skeleton } from '@shared/ui/skeleton';

import type { TrendRow } from '../model/useTicketTrend';

import { TREND_SOURCES } from '../model/useTicketTrend';
import { DashboardPanel } from './DashboardPanel';

// 디자인 시스템 차트 규칙 — 현재 값은 chart/line 실선 + 아래로 옅어지는 영역, 비교 값은 chart/compare 점선
const LINE = 'var(--color-chart-line)';
const COMPARE = 'var(--color-chart-axis)';
const AXIS_TICK = { fill: 'var(--color-chart-axis)', fontSize: 12 };

/** 점에 올렸을 때 — 어두운 말풍선에 날짜, 지급 합계와 출처별 내역, 응모 사용 수 */
function TrendTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: readonly { payload?: unknown }[];
}) {
    const row = payload?.[0]?.payload as TrendRow | undefined;
    if (!active || !row) return null;
    return (
        <div className="bg-surface-inverse text-fg-inverse flex min-w-40 flex-col gap-1 rounded-xl px-3.5 py-3 shadow-lg">
            <span className="text-caption text-fg-inverse/60">{row.ymd}</span>
            <span className="text-body-bold tabular-nums">지급 {formatNumber(row.granted)}장</span>
            <span className="text-caption text-fg-inverse/70 tabular-nums">
                {TREND_SOURCES.map(
                    (source) => `${TICKET_SOURCE_TYPE_LABEL[source]} ${formatNumber(row[source])}`,
                ).join(' · ')}
            </span>
            <span className="text-caption border-fg-inverse/15 mt-1 flex items-center gap-2 border-t pt-1.5 tabular-nums">
                <span className="border-fg-inverse/60 w-3 border-t-2 border-dashed" />
                응모에 사용 {formatNumber(row.used)}장
            </span>
        </div>
    );
}

/** 응모권 지급(영역 곡선)과 응모 사용(점선) 추이 — 보상이 들어오고 쓰이는 흐름을 한 그림으로 본다 */
export function TicketTrendPanel({
    rows,
    isPending,
    isError,
    onRetry,
    className,
}: {
    rows: TrendRow[];
    isPending: boolean;
    isError: boolean;
    onRetry: () => void;
    className?: string;
}) {
    const reduceMotion = useReducedMotion() === true;
    // useId 값의 특수문자는 SVG url(#…) 참조에서 깨질 수 있어 영숫자만 남긴다
    const gradientId = `trend-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
    const totalGranted = rows.reduce((sum, row) => sum + row.granted, 0);
    const totalUsed = rows.reduce((sum, row) => sum + row.used, 0);
    const useRate = totalGranted > 0 ? Math.round((totalUsed / totalGranted) * 100) : 0;

    return (
        <DashboardPanel
            title="응모권 지급·응모 추이"
            caption={`최근 ${rows.length}일 · 오늘은 지금까지 집계 (가상 시계 기준)`}
            actions={
                <Button size="sm" variant="ghost" asChild>
                    <Link to="/admin/tickets?tab=grants">지급 이력</Link>
                </Button>
            }
            error={isError}
            onRetry={onRetry}
            className={className}
        >
            {/* 기간 합계를 크게 — 참고 대시보드의 잔액 숫자처럼 그래프가 무엇의 합인지 먼저 읽힌다 */}
            <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
                <div className="flex flex-col">
                    <span className="text-caption text-fg-tertiary flex items-center gap-1.5">
                        <span className="bg-chart-line h-0.5 w-3 rounded-full" />
                        지급
                    </span>
                    {isPending ? (
                        <Skeleton className="mt-1 h-8 w-28" />
                    ) : (
                        <span className="text-title-1 text-fg-primary tabular-nums">
                            {formatNumber(totalGranted)}장
                        </span>
                    )}
                </div>
                <div className="flex flex-col">
                    <span className="text-caption text-fg-tertiary flex items-center gap-1.5">
                        <span className="border-chart-axis w-3 border-t-2 border-dashed" />
                        응모에 사용
                    </span>
                    {isPending ? (
                        <Skeleton className="mt-1 h-6 w-20" />
                    ) : (
                        <span className="text-title-3 text-fg-secondary tabular-nums">
                            {formatNumber(totalUsed)}장
                        </span>
                    )}
                </div>
                {!isPending && (
                    <span className="bg-brand-soft text-fg-brand text-caption mb-1 rounded-full px-2 py-0.5 font-semibold tabular-nums">
                        사용률 {useRate}%
                    </span>
                )}
            </div>
            {isPending ? (
                <LoadingBlock>
                    <Skeleton className="h-64 w-full rounded-xl" />
                </LoadingBlock>
            ) : (
                <figure
                    className="h-64 lg:h-auto lg:min-h-64 lg:flex-1"
                    aria-label={`최근 ${rows.length}일 응모권 지급과 응모 사용 추이`}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={rows}
                            margin={{ top: 12, right: 8, bottom: 0, left: -16 }}
                        >
                            <defs>
                                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={LINE} stopOpacity={0.16} />
                                    <stop offset="100%" stopColor={LINE} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="var(--color-chart-grid)" />
                            <XAxis
                                dataKey="label"
                                tickLine={false}
                                axisLine={false}
                                tick={AXIS_TICK}
                                tickMargin={10}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                allowDecimals={false}
                                tickLine={false}
                                axisLine={false}
                                tick={AXIS_TICK}
                                width={48}
                            />
                            <Tooltip
                                content={({ active, payload }) => (
                                    <TrendTooltip active={active} payload={payload} />
                                )}
                                cursor={{ stroke: COMPARE, strokeDasharray: '4 4' }}
                            />
                            <Area
                                dataKey="granted"
                                type="monotone"
                                stroke={LINE}
                                strokeWidth={2.5}
                                fill={`url(#${gradientId})`}
                                // 날짜마다 흰 속 점 — 값이 찍힌 자리를 읽기 쉽게 (참고 대시보드 방식)
                                dot={{
                                    r: 4,
                                    fill: 'var(--color-surface-page)',
                                    stroke: LINE,
                                    strokeWidth: 2,
                                }}
                                activeDot={{
                                    r: 6,
                                    fill: LINE,
                                    stroke: 'var(--color-surface-page)',
                                    strokeWidth: 3,
                                }}
                                isAnimationActive={!reduceMotion}
                            />
                            <Line
                                dataKey="used"
                                type="monotone"
                                stroke={COMPARE}
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                activeDot={{ r: 4, fill: COMPARE, strokeWidth: 0 }}
                                isAnimationActive={!reduceMotion}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </figure>
            )}
        </DashboardPanel>
    );
}
