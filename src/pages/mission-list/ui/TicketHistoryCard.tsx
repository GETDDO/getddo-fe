import { Ticket } from 'lucide-react';
import { Fragment, useState } from 'react';

import { useTicketBalance, useTicketHistory } from '@entities/ticket';
import { formatKst } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/format';
import { useCountUp } from '@shared/lib/use-count-up';
import { cn } from '@shared/lib/utils';

import { summarizeMonthlyTickets } from '../lib/monthly-ticket-summary';
import { useFreshIds } from '../lib/use-fresh-ids';

// 처음 보일 때 위에서부터 차례로 살짝 올라오는 등장 효과 (내역 줄·요약 항목이 함께 쓴다)
const RISE_IN =
    'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-400 motion-safe:fill-mode-both';
const riseDelay = (order: number) => ({ animationDelay: `${order * 50}ms` });

function SummaryItem({
    label,
    value,
    order,
}: {
    label: string;
    value: number | undefined;
    order: number;
}) {
    return (
        <p
            className={`text-caption text-fg-primary whitespace-nowrap ${RISE_IN}`}
            style={riseDelay(order)}
        >
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
                    {/* 보유 → 적립 → 사용 순서로 차례로 올라온다 */}
                    {!compact && (
                        <Ticket
                            className={`text-fg-primary size-4.5 ${RISE_IN}`}
                            style={riseDelay(0)}
                            aria-hidden
                        />
                    )}
                    <SummaryItem
                        label={compact ? '보유' : '보유 응모권'}
                        value={balanceDisplay}
                        order={0}
                    />
                    <span
                        aria-hidden
                        className={`bg-border-strong h-4 w-px rounded-full ${RISE_IN}`}
                        style={riseDelay(1)}
                    />
                    <SummaryItem
                        label={compact ? '적립' : '이번 달 적립'}
                        value={earnedDisplay}
                        order={1}
                    />
                    <span
                        aria-hidden
                        className={`bg-border-strong h-4 w-px rounded-full ${RISE_IN}`}
                        style={riseDelay(2)}
                    />
                    <SummaryItem
                        label={compact ? '사용' : '이번 달 사용'}
                        value={monthly?.used}
                        order={2}
                    />
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
                                // 보이는 앞쪽 8줄까지만 간격을 둔다
                                const enter = RISE_IN;
                                // 요약 세 항목 다음 차례부터 이어서 올라온다
                                const enterDelay = riseDelay(Math.min(index, 8) + 3);
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
                                            // 방금 받은 내역 강조 — play/yellow-soft 배경을 위아래로 4px 들여 그려 구분선에 닿지 않게 하고, 끝나면 서서히 사라진다
                                            className={cn(
                                                'before:bg-play-yellow-soft relative isolate flex items-center justify-between gap-4 p-4 before:absolute before:inset-x-0 before:inset-y-1 before:-z-10 before:rounded-lg before:transition-opacity before:duration-700',
                                                freshIds.has(item.id)
                                                    ? 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-3 before:opacity-100 motion-safe:duration-500'
                                                    : `before:opacity-0 ${enter}`,
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
