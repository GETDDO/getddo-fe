import { Link, useNavigate } from 'react-router-dom';

import type { EntryStatistics } from '@entities/entry';
import type { AdminEvent } from '@entities/event';

import { useAdminEvents } from '@entities/event';
import { formatKstDot, formatRemaining } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/format';
import { cn } from '@shared/lib/utils';
import { useVirtualClock } from '@shared/lib/virtualClock';
import { badgeVariants } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { LoadingBlock, SkeletonRows } from '@shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui/table';

import { useOpenEventStats } from '../model/useOpenEventStats';
import { DashboardPanel } from './DashboardPanel';

const PREVIEW = 5;
/** 진행 중 이벤트는 최대치(100)로 받아 마감이 가까운 순으로 고른다 */
const OPEN_EVENTS_SIZE = 100;
/** 1시간 안에 마감하면 남은 시간 칩을 강조한다 */
const URGENT_MS = 60 * 60 * 1000;

/** 이벤트 한 줄 — 마감까지 남은 시간, 응모자 수, 쓰인 응모권(E03)과 목록 안 최댓값 대비 막대 */
function OpenEventRow({
    index,
    event,
    remainingMs,
    stats,
    maxSpent,
}: {
    index: number;
    event: AdminEvent;
    remainingMs: number;
    /** undefined 불러오는 중, null 조회 실패 */
    stats: EntryStatistics | null | undefined;
    maxSpent: number;
}) {
    const navigate = useNavigate();
    const to = `/admin/events/${encodeURIComponent(event.id)}`;
    const spent = stats?.totalSpentTicketCount ?? 0;
    const ratio = maxSpent > 0 ? spent / maxSpent : 0;
    const urgent = remainingMs <= URGENT_MS;
    const fallback = stats === null ? '—' : '…';

    return (
        <TableRow
            className="hover:bg-surface-sunken cursor-pointer"
            onClick={() => void navigate(to)}
        >
            <TableCell className="text-fg-tertiary w-10 tabular-nums">{index + 1}</TableCell>
            <TableCell className="max-w-64">
                {/* 줄 전체 클릭과 별개로 키보드·화면 낭독기용 링크를 둔다 */}
                <Link
                    to={to}
                    onClick={(e) => e.stopPropagation()}
                    className="text-body-sm-bold text-fg-primary focus-visible:ring-border-focus block truncate rounded focus-visible:ring-2 focus-visible:outline-none"
                >
                    {event.title}
                </Link>
                <span className="text-caption text-fg-tertiary tabular-nums">
                    {formatKstDot(event.endsAt, true)} 마감
                </span>
            </TableCell>
            <TableCell>
                <span
                    className={cn(
                        badgeVariants({ variant: null }),
                        urgent
                            ? 'bg-status-pending text-status-pending-text'
                            : 'bg-surface-sunken text-fg-secondary',
                    )}
                >
                    {formatRemaining(remainingMs, 'minute')} 남음
                </span>
            </TableCell>
            <TableCell className="text-body-sm text-right tabular-nums">
                {stats ? `${formatNumber(stats.participantCount)}명` : fallback}
            </TableCell>
            <TableCell className="w-56">
                <span className="flex items-center gap-3">
                    <span className="bg-surface-sunken h-1.5 flex-1 overflow-hidden rounded-full">
                        <span
                            className="bg-chart-line block h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
                            style={{ width: `${Math.max(ratio * 100, spent ? 2 : 0)}%` }}
                        />
                    </span>
                    <span className="text-body-sm w-16 text-right tabular-nums">
                        {stats ? `${formatNumber(spent)}장` : fallback}
                    </span>
                </span>
            </TableCell>
        </TableRow>
    );
}

/** 진행 중 이벤트 응모 현황 — 마감이 가까운 순 표. 어느 이벤트에 응모가 몰리는지 막대로 비교한다 */
export function OpenEventsPanel({ className }: { className?: string }) {
    const now = useVirtualClock().now();
    const query = useAdminEvents({ page: 1, size: OPEN_EVENTS_SIZE, status: 'OPEN' });

    const events = (query.data?.items ?? [])
        .map((event) => ({ event, remainingMs: new Date(event.endsAt).getTime() - now.getTime() }))
        .filter(({ remainingMs }) => remainingMs > 0)
        .sort((a, b) => a.remainingMs - b.remainingMs)
        .slice(0, PREVIEW);
    const stats = useOpenEventStats(events.map(({ event }) => event.id));
    const maxSpent = Math.max(0, ...stats.map((item) => item?.totalSpentTicketCount ?? 0));

    return (
        <DashboardPanel
            title="진행 중 이벤트 응모 현황"
            caption={
                query.data
                    ? `진행 중 ${formatNumber(query.data.totalElements)}개 중 마감이 가까운 ${events.length}개`
                    : '마감이 가까운 순'
            }
            actions={
                <Button size="sm" variant="ghost" asChild>
                    <Link to="/admin/events?status=OPEN">전체보기</Link>
                </Button>
            }
            error={query.isError}
            onRetry={() => void query.refetch()}
            className={className}
        >
            {query.isPending ? (
                <LoadingBlock>
                    <SkeletonRows rows={4} />
                </LoadingBlock>
            ) : events.length === 0 ? (
                <p className="text-body-sm text-fg-tertiary py-6 text-center">
                    진행 중인 이벤트가 없습니다.
                </p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="text-fg-tertiary">No</TableHead>
                            <TableHead className="text-fg-tertiary">이벤트</TableHead>
                            <TableHead className="text-fg-tertiary">마감까지</TableHead>
                            <TableHead className="text-fg-tertiary text-right">응모자</TableHead>
                            <TableHead className="text-fg-tertiary">사용 응모권</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {events.map(({ event, remainingMs }, index) => (
                            <OpenEventRow
                                key={event.id}
                                index={index}
                                event={event}
                                remainingMs={remainingMs}
                                stats={stats[index]}
                                maxSpent={maxSpent}
                            />
                        ))}
                    </TableBody>
                </Table>
            )}
        </DashboardPanel>
    );
}
