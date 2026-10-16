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
    useChartWidth,
} from 'recharts';

import { TICKET_SOURCE_TYPE_LABEL } from '@entities/ticket';
import { formatNumber } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { LoadingBlock, Skeleton } from '@shared/ui/skeleton';

import type { TrendRow } from '../model/useTicketTrend';

import { TREND_SOURCES } from '../model/useTicketTrend';
import { DashboardPanel } from './DashboardPanel';

// 디자인 시스템 차트 규칙 — 현재 값은 chart/line 실선 + 아래로 옅어지는 영역, 비교 값은 점선
const LINE = 'var(--color-chart-line)';
const COMPARE = 'var(--color-chart-axis)';
const AXIS_TICK = { fill: 'var(--color-chart-axis)', fontSize: 12 };
/** 값 점 — 흰 속에 마젠타 테두리 */
const POINT = { r: 4.5, fill: 'var(--color-surface-page)', stroke: LINE, strokeWidth: 2.5 };

/** 말풍선 크기 — 점 위에 꼬리를 달아 띄운다 */
const BUBBLE_W = 168;
const BUBBLE_H = 74;
const BUBBLE_GAP = 14;

/**
 * 올린 점 위의 말풍선 — 프라이머리 바탕에 아래로 꼬리. 점 바로 위에 붙도록 차트 안(SVG)에 그린다.
 * 점이 위쪽 끝에 가까워 말풍선이 잘리면 점 아래로 뒤집고, 좌우 끝에서는 차트 안으로 밀어 넣되 꼬리는 점을 가리킨다
 */
function PointBubble({ cx, cy, payload }: { cx?: number; cy?: number; payload?: unknown }) {
    const chartWidth = useChartWidth() ?? 0;
    const row = payload as TrendRow | undefined;
    if (cx == null || cy == null || !row) return null;
    const left = Math.min(Math.max(cx - BUBBLE_W / 2, 0), Math.max(chartWidth - BUBBLE_W, 0));
    const below = cy - BUBBLE_GAP - BUBBLE_H < 0;
    const top = below ? cy + BUBBLE_GAP : cy - BUBBLE_GAP - BUBBLE_H;
    return (
        <g>
            <circle
                cx={cx}
                cy={cy}
                r={6}
                fill={LINE}
                stroke="var(--color-surface-page)"
                strokeWidth={3}
            />
            <foreignObject
                x={left}
                y={top - (below ? 0 : 6)}
                width={BUBBLE_W}
                height={BUBBLE_H + 6}
                className="pointer-events-none overflow-visible"
            >
                <div className={below ? 'flex flex-col-reverse' : 'flex flex-col'}>
                    <div className="bg-brand-primary text-fg-on-brand flex w-full flex-col gap-0.5 rounded-xl px-3 py-2 shadow-md">
                        <span className="text-caption flex justify-between opacity-80">
                            {row.ymd}
                            <span className="tabular-nums">사용 {formatNumber(row.used)}장</span>
                        </span>
                        <span className="text-body-bold tabular-nums">
                            지급 {formatNumber(row.granted)}장
                        </span>
                        <span className="text-caption tabular-nums opacity-80">
                            {TREND_SOURCES.map(
                                (source) =>
                                    `${TICKET_SOURCE_TYPE_LABEL[source]} ${formatNumber(row[source])}`,
                            ).join(' · ')}
                        </span>
                    </div>
                    {/* 꼬리 — 점을 가리키는 작은 삼각형 */}
                    <span
                        style={{ marginLeft: cx - left - 6 }}
                        className={
                            below
                                ? 'border-b-brand-primary size-0 border-x-[6px] border-b-[6px] border-x-transparent'
                                : 'border-t-brand-primary size-0 border-x-[6px] border-t-[6px] border-x-transparent'
                        }
                    />
                </div>
            </foreignObject>
        </g>
    );
}

/** 응모권 지급(직선 꺾은선 + 영역)과 응모 사용(점선) 추이 — 보상이 들어오고 쓰이는 흐름을 한 그림으로 본다 */
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
            {/* 기간 합계를 크게 — 그래프가 무엇의 합인지 먼저 읽힌다 */}
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
                            margin={{ top: 16, right: 12, bottom: 0, left: -16 }}
                        >
                            <defs>
                                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={LINE} stopOpacity={0.14} />
                                    <stop offset="100%" stopColor={LINE} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            {/* 가로 격자만 — 세로선이 점을 관통하지 않게 */}
                            <CartesianGrid vertical={false} stroke="var(--color-chart-grid)" />
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
                            {/* 말풍선은 점 위에 직접 그리므로 툴팁 상자는 숨기고 세로 안내선만 둔다 */}
                            <Tooltip
                                content={() => null}
                                cursor={{
                                    stroke: 'var(--color-border-default)',
                                    strokeDasharray: '4 4',
                                }}
                            />
                            <Line
                                dataKey="used"
                                type="linear"
                                stroke={COMPARE}
                                strokeWidth={1.5}
                                strokeDasharray="5 5"
                                dot={false}
                                activeDot={false}
                                isAnimationActive={!reduceMotion}
                            />
                            <Area
                                dataKey="granted"
                                type="linear"
                                stroke={LINE}
                                strokeWidth={2.5}
                                fill={`url(#${gradientId})`}
                                dot={POINT}
                                activeDot={(props: {
                                    cx?: number;
                                    cy?: number;
                                    payload?: unknown;
                                }) => <PointBubble key="bubble" {...props} />}
                                isAnimationActive={!reduceMotion}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </figure>
            )}
        </DashboardPanel>
    );
}
