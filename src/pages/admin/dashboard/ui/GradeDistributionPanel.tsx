import type { PieLabelRenderProps, PieSectorDataItem } from 'recharts';

import { useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from 'recharts';

import type { TicketGrade } from '@entities/ticket';

import { TICKET_GRADE_DOT, TICKET_GRADE_LABEL, TICKET_GRADE_ODDS } from '@entities/ticket';
import { formatNumber } from '@shared/lib/format';
import { cn } from '@shared/lib/utils';
import { LoadingBlock, Skeleton } from '@shared/ui/skeleton';

import { DashboardPanel } from './DashboardPanel';

const GRADE_FILL: Record<TicketGrade, string> = {
    BRONZE: 'var(--color-grade-bronze)',
    SILVER: 'var(--color-grade-silver)',
    GOLD: 'var(--color-grade-gold)',
};
const ACTIVE_FILL = 'var(--color-brand-primary)';
/** 칸 안 비율 글자는 이만큼 넓은 칸에만 — 좁은 칸은 범례로 읽는다 */
const MIN_LABEL_PERCENT = 8;
/** 올린 칸이 바깥으로 튀어나오는 길이 */
const POP_OUT = 10;

const percentOf = (count: number, total: number) =>
    total === 0 ? 0 : Math.round((count / total) * 1000) / 10;

const RADIAN = Math.PI / 180;
/** 칸 가운데(두께 중간) 좌표 */
const midPoint = (cx: number, cy: number, inner: number, outer: number, midAngle: number) => {
    const radius = (inner + outer) / 2;
    return {
        x: cx + radius * Math.cos(-midAngle * RADIAN),
        y: cy + radius * Math.sin(-midAngle * RADIAN),
    };
};

/**
 * 기간 중 지급한 응모권의 등급 분포 — 무작위 등급 추첨(ADR-014)이 설정한 확률대로 나가는지 본다.
 * 평평한 두꺼운 도넛에 칸마다 비율을 적고, 올린 칸은 바깥으로 튀어나오며 프라이머리 색으로 바뀌어 등급·장수를 보여준다
 */
export function GradeDistributionPanel({
    days,
    grades,
    isPending,
    isError,
    onRetry,
}: {
    days: number;
    grades: { grade: TicketGrade; count: number }[];
    isPending: boolean;
    isError: boolean;
    onRetry: () => void;
}) {
    const reduceMotion = useReducedMotion() === true;
    const [hovered, setHovered] = useState<number | null>(null);
    const total = grades.reduce((sum, item) => sum + item.count, 0);

    // 칸 안 비율 — 올린 칸은 activeShape가 대신 그린다
    const renderLabel = (props: PieLabelRenderProps) => {
        const { cx, cy, innerRadius, outerRadius, midAngle, index } = props;
        const item = grades[index];
        if (!item || index === hovered) return null;
        const percent = percentOf(item.count, total);
        if (percent < MIN_LABEL_PERCENT) return null;
        const { x, y } = midPoint(
            Number(cx),
            Number(cy),
            Number(innerRadius),
            Number(outerRadius),
            Number(midAngle),
        );
        return (
            <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-fg-on-brand text-[0.6875rem] font-semibold"
            >
                {percent}%
            </text>
        );
    };

    const renderActive = (props: PieSectorDataItem) => {
        const {
            cx = 0,
            cy = 0,
            innerRadius = 0,
            outerRadius = 0,
            startAngle,
            endAngle,
            midAngle = 0,
        } = props;
        // 활성 칸은 마우스를 올린 칸이다
        const item = hovered == null ? undefined : grades[hovered];
        const { x, y } = midPoint(cx, cy, innerRadius, outerRadius + POP_OUT, midAngle);
        return (
            <g>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius + POP_OUT}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={ACTIVE_FILL}
                    stroke="var(--color-surface-page)"
                    strokeWidth={2}
                />
                {item && (
                    <text
                        x={x}
                        y={y}
                        textAnchor="middle"
                        className="fill-fg-on-brand font-semibold"
                    >
                        <tspan x={x} dy="-0.35em" className="text-[0.625rem]">
                            {TICKET_GRADE_LABEL[item.grade]}
                        </tspan>
                        <tspan x={x} dy="1.2em" className="text-xs">
                            {percentOf(item.count, total)}%
                        </tspan>
                    </text>
                )}
            </g>
        );
    };

    return (
        <DashboardPanel
            title="지급 등급 분포"
            caption={`최근 ${days}일 지급 응모권 · 실제 비율과 설정 확률 비교`}
            error={isError}
            onRetry={onRetry}
        >
            {isPending ? (
                <LoadingBlock>
                    <Skeleton className="size-44 rounded-full" />
                </LoadingBlock>
            ) : total === 0 ? (
                <p className="text-body-sm text-fg-tertiary py-10 text-center">
                    기간 중 지급한 응모권이 없습니다.
                </p>
            ) : (
                <div className="flex flex-1 flex-wrap content-center items-center justify-center gap-x-10 gap-y-5 py-4">
                    <figure
                        className="relative size-48 shrink-0"
                        aria-label="등급별 지급 비율 도넛 그래프"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart
                                margin={{
                                    top: POP_OUT,
                                    right: POP_OUT,
                                    bottom: POP_OUT,
                                    left: POP_OUT,
                                }}
                            >
                                {/* 칸을 올리면 activeShape가 켜지도록 툴팁 상태만 쓴다 (상자는 그리지 않는다) */}
                                <Tooltip content={() => null} />
                                <Pie
                                    data={grades}
                                    dataKey="count"
                                    nameKey="grade"
                                    innerRadius="58%"
                                    outerRadius="100%"
                                    startAngle={90}
                                    endAngle={-270}
                                    stroke="var(--color-surface-page)"
                                    strokeWidth={2}
                                    label={renderLabel}
                                    labelLine={false}
                                    activeShape={renderActive}
                                    onMouseEnter={(_, index) => setHovered(index)}
                                    onMouseLeave={() => setHovered(null)}
                                    isAnimationActive={!reduceMotion}
                                >
                                    {grades.map(({ grade }) => (
                                        <Cell key={grade} fill={GRADE_FILL[grade]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <figcaption className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-title-2 text-fg-primary tabular-nums">
                                {formatNumber(total)}
                            </span>
                            <span className="text-caption text-fg-tertiary">지급 장수</span>
                        </figcaption>
                    </figure>
                    <ul className="flex flex-col gap-3">
                        {grades.map(({ grade, count }, index) => (
                            <li
                                key={grade}
                                className={cn(
                                    'flex flex-col rounded-lg px-2 py-1 transition-colors',
                                    index === hovered && 'bg-brand-soft',
                                )}
                            >
                                <span className="text-caption text-fg-tertiary">
                                    {TICKET_GRADE_LABEL[grade]} · 설정 확률{' '}
                                    {TICKET_GRADE_ODDS[grade]}%
                                </span>
                                <span className="flex items-center gap-2">
                                    <span
                                        className={cn(
                                            'size-2.5 rounded-full',
                                            TICKET_GRADE_DOT[grade],
                                        )}
                                    />
                                    <span className="text-title-3 text-fg-primary tabular-nums">
                                        {formatNumber(count)}
                                    </span>
                                    <span className="text-body-sm text-fg-secondary tabular-nums">
                                        {percentOf(count, total)}%
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </DashboardPanel>
    );
}
