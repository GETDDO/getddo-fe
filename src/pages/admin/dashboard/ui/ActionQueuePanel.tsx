import type { LucideIcon } from 'lucide-react';

import { BellOff, ChevronRight, Hourglass, Megaphone, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAdminNotificationJobs } from '@entities/adminNotification';
import { useAdminEvents } from '@entities/event';
import { useTicketInconsistencies } from '@entities/ticket';
import { formatRemaining } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/format';
import { cn } from '@shared/lib/utils';
import { useVirtualClock } from '@shared/lib/virtualClock';
import { Button } from '@shared/ui/button';
import { LoadingBlock, SkeletonRows } from '@shared/ui/skeleton';

import { DashboardPanel } from './DashboardPanel';

const PUBLISH_PREVIEW = 3;
/** 이 시간 안에 마감하는 진행 중 이벤트를 '곧 마감'으로 본다 */
const CLOSING_SOON_MS = 24 * 60 * 60 * 1000;
/** 진행 중 이벤트는 한 번에 최대치(100)로 받아 마감 순으로 고른다 */
const OPEN_EVENTS_SIZE = 100;

/**
 * 결과 발표 대기 — 이제 결과는 관리자가 직접 발표하므로(ADR-022) 가장 먼저 처리할 일로 진하게 띄운다.
 * 이벤트를 누르면 추첨 관리에서 그 이벤트가 열린 채로 간다
 */
function PublishWaitingCard() {
    const query = useAdminEvents({ page: 1, size: PUBLISH_PREVIEW, status: 'DRAW_CONFIRMED' });
    const total = query.data?.totalElements ?? 0;

    return (
        <div className="bg-surface-inverse text-fg-inverse flex flex-col gap-3 rounded-xl p-4">
            <div className="flex items-center gap-2">
                <Megaphone aria-hidden className="size-4" />
                <span className="text-body-sm-bold">결과 발표 대기</span>
                <span className="text-title-3 ml-auto tabular-nums">
                    {query.isPending ? '—' : query.isError ? '!' : `${formatNumber(total)}건`}
                </span>
            </div>
            {query.isError ? (
                <button
                    type="button"
                    className="text-caption text-fg-inverse/70 self-start underline"
                    onClick={() => void query.refetch()}
                >
                    불러오지 못했어요 · 다시 시도
                </button>
            ) : total === 0 && !query.isPending ? (
                <p className="text-caption text-fg-inverse/70">발표를 기다리는 이벤트가 없어요.</p>
            ) : (
                <ul className="flex flex-col gap-1">
                    {query.data?.items.map((event) => (
                        <li key={event.id}>
                            <Link
                                to={`/admin/draw?eventId=${encodeURIComponent(event.id)}`}
                                className="text-body-sm hover:bg-surface-inverse-muted focus-visible:ring-fg-inverse -mx-2 flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                            >
                                <span className="truncate">{event.title}</span>
                                <ChevronRight aria-hidden className="ml-auto size-4 shrink-0" />
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
            <Button size="sm" variant="secondary" asChild className="self-stretch">
                <Link to="/admin/draw">추첨 관리로 가기</Link>
            </Button>
        </div>
    );
}

function QueueRow({
    icon: Icon,
    label,
    detail,
    count,
    unit,
    to,
}: {
    icon: LucideIcon;
    label: string;
    detail: string;
    count: number;
    unit: string;
    to: string;
}) {
    const empty = count === 0;
    return (
        <li>
            <Link
                to={to}
                className="hover:bg-surface-sunken focus-visible:ring-border-focus -mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
                <span
                    className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-full',
                        empty
                            ? 'bg-surface-sunken text-fg-tertiary'
                            : 'bg-brand-soft text-fg-brand',
                    )}
                >
                    <Icon aria-hidden className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col">
                    <span className="text-body-sm-bold text-fg-primary">{label}</span>
                    <span className="text-caption text-fg-tertiary truncate">{detail}</span>
                </span>
                <span
                    className={cn(
                        'text-body-bold ml-auto tabular-nums',
                        empty ? 'text-fg-tertiary' : 'text-fg-primary',
                    )}
                >
                    {formatNumber(count)}
                    {unit}
                </span>
            </Link>
        </li>
    );
}

/** 지금 처리할 일 — 발표 대기를 맨 위에, 그 아래 실패 알림·정합성 불일치·곧 마감을 건수와 함께 모은다 */
export function ActionQueuePanel() {
    const now = useVirtualClock().now();
    const failedJobs = useAdminNotificationJobs({ page: 1, size: 1, status: 'FAILED' });
    const mismatches = useTicketInconsistencies({ page: 1, size: 1 });
    const openEvents = useAdminEvents({ page: 1, size: OPEN_EVENTS_SIZE, status: 'OPEN' });

    const closingSoon = (openEvents.data?.items ?? [])
        .map((event) => ({ event, remainingMs: new Date(event.endsAt).getTime() - now.getTime() }))
        .filter(({ remainingMs }) => remainingMs > 0 && remainingMs <= CLOSING_SOON_MS)
        .sort((a, b) => a.remainingMs - b.remainingMs);
    const nearest = closingSoon[0];

    const queries = [failedJobs, mismatches, openEvents];
    const isPending = queries.some((query) => query.isPending);
    const isError = queries.some((query) => query.isError);

    return (
        <DashboardPanel
            title="지금 처리할 일"
            caption="누르면 해당 관리 화면으로 이동해요"
            error={isError}
            onRetry={() => queries.forEach((query) => void query.refetch())}
        >
            <PublishWaitingCard />
            {isPending ? (
                <LoadingBlock>
                    <SkeletonRows rows={3} />
                </LoadingBlock>
            ) : (
                <ul className="flex flex-col">
                    <QueueRow
                        icon={BellOff}
                        label="실패한 알림 작업"
                        detail="복구 가능 여부를 확인해 주세요"
                        count={failedJobs.data?.totalElements ?? 0}
                        unit="건"
                        to="/admin/notifications?tab=jobs&status=FAILED"
                    />
                    <QueueRow
                        icon={TriangleAlert}
                        label="응모권 정합성 불일치"
                        detail="응모권 상태와 마지막 이력이 달라요"
                        count={mismatches.data?.totalElements ?? 0}
                        unit="장"
                        to="/admin/tickets?tab=consistency"
                    />
                    <QueueRow
                        icon={Hourglass}
                        label="24시간 안에 마감"
                        detail={
                            nearest
                                ? `${nearest.event.title} · ${formatRemaining(nearest.remainingMs, 'minute')} 남음`
                                : '곧 마감하는 이벤트가 없어요'
                        }
                        count={closingSoon.length}
                        unit="개"
                        to="/admin/events?status=OPEN"
                    />
                </ul>
            )}
        </DashboardPanel>
    );
}
