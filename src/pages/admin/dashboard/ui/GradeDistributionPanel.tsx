import { useReducedMotion } from 'framer-motion';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

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

const percent = (count: number, total: number) =>
    total === 0 ? 0 : Math.round((count / total) * 1000) / 10;

/**
 * 기간 중 지급한 응모권의 등급 분포 — 무작위 등급 추첨(ADR-014)이 설정한 확률대로 나가는지 본다.
 * 도넛 왼쪽, 오른쪽에 등급별 장수(크게)와 실제 비율·설정 확률을 나란히 둔다
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
    const total = grades.reduce((sum, item) => sum + item.count, 0);

    return (
        <DashboardPanel
            title="지급 등급 분포"
            caption={`최근 ${days}일 지급 응모권 · 실제 비율과 설정 확률 비교`}
            error={isError}
            onRetry={onRetry}
        >
            {isPending ? (
                <LoadingBlock>
                    <Skeleton className="size-40 rounded-full" />
                </LoadingBlock>
            ) : total === 0 ? (
                <p className="text-body-sm text-fg-tertiary py-10 text-center">
                    기간 중 지급한 응모권이 없습니다.
                </p>
            ) : (
                <div className="flex flex-1 flex-wrap content-center items-center justify-center gap-x-10 gap-y-5 py-4">
                    <figure
                        className="relative size-40 shrink-0"
                        aria-label="등급별 지급 비율 도넛 그래프"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                {/* 바탕 고리 — 조각 사이 틈으로 비치는 연한 원 */}
                                <Pie
                                    data={[{ value: 1 }]}
                                    dataKey="value"
                                    innerRadius="62%"
                                    outerRadius="100%"
                                    fill="var(--color-surface-sunken)"
                                    stroke="none"
                                    isAnimationActive={false}
                                />
                                <Pie
                                    data={grades}
                                    dataKey="count"
                                    nameKey="grade"
                                    innerRadius="62%"
                                    outerRadius="100%"
                                    paddingAngle={3}
                                    cornerRadius={6}
                                    stroke="none"
                                    startAngle={90}
                                    endAngle={-270}
                                    isAnimationActive={!reduceMotion}
                                >
                                    {grades.map(({ grade }) => (
                                        <Cell key={grade} fill={GRADE_FILL[grade]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <figcaption className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-title-2 text-fg-primary tabular-nums">
                                {formatNumber(total)}
                            </span>
                            <span className="text-caption text-fg-tertiary">지급 장수</span>
                        </figcaption>
                    </figure>
                    <ul className="flex flex-col gap-3">
                        {grades.map(({ grade, count }) => (
                            <li key={grade} className="flex flex-col">
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
                                        {percent(count, total)}%
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
