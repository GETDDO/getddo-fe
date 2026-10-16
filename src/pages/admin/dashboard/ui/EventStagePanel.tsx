import type { PieSectorDataItem } from 'recharts';

import { useReducedMotion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from 'recharts';

import { formatNumber } from '@shared/lib/format';
import { cn } from '@shared/lib/utils';
import { LoadingBlock, Skeleton } from '@shared/ui/skeleton';

import type { EventStageKey } from '../model/useEventStageCounts';

import { useEventStageCounts } from '../model/useEventStageCounts';
import { DashboardPanel } from './DashboardPanel';
import { ViewAllLink } from './ViewAllLink';

/** 단계 색 — 손이 가야 하는 단계(추첨 필요·발표 대기)를 진하게, 시작 전·종료는 회색으로 물린다 */
const STAGE_FILL: Record<EventStageKey, string> = {
    scheduled: 'var(--color-chart-compare)',
    open: 'var(--color-chart-line)',
    draw: 'var(--color-chart-highlight)',
    publish: 'var(--color-status-active-text)',
    done: 'var(--color-chart-axis)',
};
const STAGE_DOT: Record<EventStageKey, string> = {
    scheduled: 'bg-chart-compare',
    open: 'bg-chart-line',
    draw: 'bg-chart-highlight',
    publish: 'bg-status-active-text',
    done: 'bg-chart-axis',
};
/** 올린 칸이 바깥으로 튀어나오는 길이 */
const POP_OUT = 8;

/**
 * 이벤트 운영 단계 분포 — 예정·진행·추첨 필요·발표 대기·종료가 각각 몇 개인지 도넛으로 본다.
 * 칸이나 범례를 누르면 그 단계의 관리 화면이 열린다
 */
export function EventStagePanel() {
    const reduceMotion = useReducedMotion() === true;
    const navigate = useNavigate();
    const { stages, isPending, isError, refetch } = useEventStageCounts();
    const [hovered, setHovered] = useState<number | null>(null);
    const total = stages.reduce((sum, stage) => sum + stage.count, 0);
    const active = hovered == null ? undefined : stages[hovered];

    const renderActive = (props: PieSectorDataItem) => (
        <Sector
            {...props}
            outerRadius={(props.outerRadius ?? 0) + POP_OUT}
            stroke="var(--color-surface-page)"
            strokeWidth={2}
        />
    );

    return (
        <DashboardPanel
            title="이벤트 운영 단계"
            caption="전체 이벤트를 다음에 할 일 기준으로 묶었어요"
            actions={<ViewAllLink to="/admin/events" />}
            error={isError}
            onRetry={refetch}
        >
            {isPending ? (
                <LoadingBlock>
                    <Skeleton className="mx-auto size-40 rounded-full" />
                </LoadingBlock>
            ) : total === 0 ? (
                <p className="text-body-sm text-fg-tertiary py-10 text-center">
                    등록된 이벤트가 없습니다.
                </p>
            ) : (
                <div className="flex flex-1 flex-col items-center gap-4">
                    <figure
                        className="relative size-44 shrink-0"
                        aria-label="운영 단계별 이벤트 수 도넛 그래프"
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
                                    data={stages}
                                    dataKey="count"
                                    nameKey="label"
                                    innerRadius="62%"
                                    outerRadius="100%"
                                    startAngle={90}
                                    endAngle={-270}
                                    stroke="var(--color-surface-page)"
                                    strokeWidth={2}
                                    activeShape={renderActive}
                                    onMouseEnter={(_, index) => setHovered(index)}
                                    onMouseLeave={() => setHovered(null)}
                                    onClick={(_, index) => {
                                        const stage = stages[index];
                                        if (stage) void navigate(stage.to);
                                    }}
                                    className="cursor-pointer"
                                    isAnimationActive={!reduceMotion}
                                >
                                    {stages.map(({ key }) => (
                                        <Cell key={key} fill={STAGE_FILL[key]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        {/* 가운데 — 평소엔 전체 수, 칸을 올리면 그 단계 이름과 수 */}
                        <figcaption className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-title-2 text-fg-primary tabular-nums">
                                {formatNumber(active?.count ?? total)}
                            </span>
                            <span className="text-caption text-fg-tertiary">
                                {active?.label ?? '전체 이벤트'}
                            </span>
                        </figcaption>
                    </figure>
                    <ul className="flex w-full flex-col">
                        {stages.map((stage, index) => (
                            <li key={stage.key}>
                                <Link
                                    to={stage.to}
                                    onMouseEnter={() => setHovered(index)}
                                    onMouseLeave={() => setHovered(null)}
                                    className={cn(
                                        'hover:bg-surface-sunken focus-visible:ring-border-focus flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none',
                                        index === hovered && 'bg-surface-sunken',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'size-2.5 shrink-0 rounded-full',
                                            STAGE_DOT[stage.key],
                                        )}
                                    />
                                    <span className="text-body-sm text-fg-primary">
                                        {stage.label}
                                    </span>
                                    <span className="text-caption text-fg-tertiary truncate">
                                        {stage.hint}
                                    </span>
                                    <span className="text-body-sm-bold text-fg-primary ml-auto tabular-nums">
                                        {formatNumber(stage.count)}개
                                    </span>
                                    <ChevronRight
                                        aria-hidden
                                        className="text-fg-tertiary size-4 shrink-0"
                                    />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </DashboardPanel>
    );
}
