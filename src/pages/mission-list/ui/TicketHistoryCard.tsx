import { Ticket } from 'lucide-react';
import { Fragment, useState } from 'react';

import { useTicketBalance, useTicketHistory } from '@entities/ticket';
import { formatKst } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/format';
import { useCountUp } from '@shared/lib/use-count-up';
import { cn } from '@shared/lib/utils';

import { summarizeMonthlyTickets } from '../lib/monthly-ticket-summary';
import { useFreshIds } from '../lib/use-fresh-ids';

function SummaryItem({ label, value }: { label: string; value: number | undefined }) {
    return (
        <p className="text-caption text-fg-primary whitespace-nowrap">
            <span className="text-fg-tertiary">{label} </span>
            <span className="text-body-sm-bold">{value == null ? '-' : formatNumber(value)}</span>장
        </p>
    );
}

/**
 * 보유 응모권·이번 달 적립/사용 요약과 최근 지급·차감 이력.
 * 높이는 옆 출석 카드를 따라가도록 내용을 absolute로 띄우고, compact면 좁은 폭에 맞춰 요약 라벨을 줄인다.
 */
export function TicketHistoryCard({
    compact = false,
    className,
}: {
    compact?: boolean;
    className?: string;
}) {
    const { data: balance } = useTicketBalance();
    const { data: history, isPending, isError } = useTicketHistory();
    // pages에서는 app/virtual-clock을 참조할 수 없다 — 이번 달 판정은 표시용이므로 마운트 시각을 쓴다
    const [now] = useState(() => new Date());
    const monthly = history ? summarizeMonthlyTickets(history, now) : undefined;
    // 출석 등으로 응모권을 받으면 숫자가 굴러 올라가고, 새 내역이 위에서 들어오며 잠깐 강조된다
    const balanceDisplay = useCountUp(balance?.balance);
    const earnedDisplay = useCountUp(monthly?.earned);
    const freshIds = useFreshIds(history?.map((item) => item.id));

    return (
        <div
            className={cn(
                'bg-surface-page border-border-default relative min-h-75 overflow-hidden rounded-2xl border shadow-md',
                className,
            )}
        >
            <div className="absolute inset-0 flex flex-col gap-2 p-4">
                <div
                    className={cn(
                        'bg-surface-canvas flex flex-wrap items-center gap-y-2 rounded-lg p-4',
                        compact ? 'gap-x-4.5' : 'gap-x-5',
                    )}
                >
                    {!compact && <Ticket className="text-fg-primary size-4.5" aria-hidden />}
                    <SummaryItem label={compact ? '보유' : '보유 응모권'} value={balanceDisplay} />
                    <span aria-hidden className="bg-border-strong h-4 w-px rounded-full" />
                    <SummaryItem label={compact ? '적립' : '이번 달 적립'} value={earnedDisplay} />
                    <span aria-hidden className="bg-border-strong h-4 w-px rounded-full" />
                    <SummaryItem label={compact ? '사용' : '이번 달 사용'} value={monthly?.used} />
                </div>

                {/*
                  항상 보이는 얇은 border/strong 색 스크롤바(4px, 손잡이 최소 64px).
                  크롬·사파리는 ::-webkit-scrollbar로 그리면 macOS에서도 숨겨지지 않는다 — 표준 scrollbar-* 속성을 함께 주면 이 설정이 무시되므로 파이어폭스에만 준다.
                  마지막 항목이 페이드에 가리지 않게 아래 여백을 둔다
                */}
                <div className="[&::-webkit-scrollbar-thumb]:bg-border-strong min-h-0 flex-1 overflow-y-auto pr-1 pb-12 supports-[-moz-appearance:none]:[scrollbar-width:thin] supports-[-moz-appearance:none]:[scrollbar-color:var(--color-border-strong)_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:min-h-16 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                    {isPending && <p className="text-body-sm text-fg-tertiary p-4">불러오는 중…</p>}
                    {isError && (
                        <p className="text-body-sm text-destructive p-4">
                            응모권 내역을 불러오지 못했습니다.
                        </p>
                    )}
                    {history?.length === 0 && (
                        <p className="text-body-sm text-fg-tertiary p-4">
                            아직 응모권 내역이 없어요.
                        </p>
                    )}
                    {history && history.length > 0 && (
                        <ul>
                            {history.map((item, index) => {
                                // 처음 보일 때 내역 줄이 위에서부터 차례로 살짝 올라온다 (보이는 앞쪽 8줄까지만 간격을 둔다)
                                const enter =
                                    'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-400 motion-safe:fill-mode-both';
                                const enterDelay = {
                                    animationDelay: `${Math.min(index, 8) * 50}ms`,
                                };
                                return (
                                    <Fragment key={item.id}>
                                        {index > 0 && (
                                            <li
                                                aria-hidden
                                                className={cn('bg-border-default h-px', enter)}
                                                style={enterDelay}
                                            />
                                        )}
                                        <li
                                            style={freshIds.has(item.id) ? undefined : enterDelay}
                                            className={cn(
                                                'flex items-center justify-between gap-4 rounded-lg p-4 transition-colors duration-700',
                                                freshIds.has(item.id)
                                                    ? 'bg-ticket-accent motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-3 motion-safe:duration-500'
                                                    : enter,
                                            )}
                                        >
                                            <div className="flex min-w-0 flex-col gap-1">
                                                <p className="text-body-sm-bold text-fg-primary truncate">
                                                    {item.reason}
                                                </p>
                                                <p className="text-caption text-fg-tertiary">
                                                    {formatKst(item.createdAt)}
                                                </p>
                                            </div>
                                            <span className="text-body-bold text-fg-primary shrink-0">
                                                {item.amount > 0 ? `+${item.amount}` : item.amount}
                                            </span>
                                        </li>
                                    </Fragment>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {/* 아래로 내역이 더 있음을 암시하는 페이드 */}
            <div
                aria-hidden
                className="to-surface-page pointer-events-none absolute inset-x-0 bottom-0 h-19.25 rounded-b-2xl bg-linear-to-b from-transparent to-62%"
            />
        </div>
    );
}
