import { Ticket } from 'lucide-react';
import { Fragment, useState } from 'react';

import { useTicketWallets, useTicketHistory } from '@entities/ticket';
import { formatNumber } from '@shared/lib/format';
import { useCountUp } from '@shared/lib/useCountUp';
import { cn } from '@shared/lib/utils';
import { useVirtualClock } from '@shared/lib/virtualClock';

import { summarizeMonthlyTickets } from '../lib/monthlyTicketSummary';
import { useFreshIds } from '../lib/useFreshIds';
import { TicketHistoryRow } from './TicketHistoryRow';

/** 요약 한 칸 — 넓을 때는 '사용 가능 10장' 한 줄, 좁을 때(stacked)는 이름 아래 수량 두 줄(가운데 정렬) */
function SummaryItem({
    label,
    value,
    stacked,
}: {
    label: string;
    value: number | undefined;
    stacked: boolean;
}) {
    return (
        // 공용 cn은 글자 크기 토큰(text-caption)과 글자색 토큰을 같은 묶음으로 보고 크기를 지우므로 cn 없이 이어 붙인다
        <p
            className={`text-caption text-fg-primary whitespace-nowrap ${stacked ? 'flex flex-col items-center text-center' : ''}`}
        >
            <span className="text-fg-tertiary">
                {label}
                {!stacked && ' '}
            </span>
            <span className="whitespace-nowrap">
                <span className="text-body-sm-bold">
                    {value == null ? '-' : formatNumber(value)}
                </span>
                장
            </span>
        </p>
    );
}

/**
 * 사용 가능 응모권·이번 달 적립/사용 요약과 최근 지급·차감 이력(누르면 상세가 펼쳐지는 아코디언).
 * 높이는 옆 출석 카드를 따라가도록 내용을 absolute로 띄우고, compact(좁은 폭)면 요약을 이름·수량 두 줄로 나눈다.
 */
export function TicketHistoryCard({
    compact = false,
    className,
}: {
    compact?: boolean;
    className?: string;
}) {
    const { data: wallets } = useTicketWallets();
    const { data: history, isPending, isError } = useTicketHistory();
    // 이번 달 판정은 표시용이므로 마운트 시각을 쓴다
    const clock = useVirtualClock();
    const [now] = useState(() => clock.now());
    const monthly = history ? summarizeMonthlyTickets(history, now) : undefined;
    // 출석 등으로 응모권을 받으면 숫자가 굴러 올라가고, 새 내역이 위에서 들어오며 잠깐 강조된다
    const balanceDisplay = useCountUp(wallets?.availableBalance);
    const earnedDisplay = useCountUp(monthly?.earned);
    const freshIds = useFreshIds(history?.map((item) => item.id));
    const summaryItems = [
        { label: '사용 가능', value: balanceDisplay },
        // 좁을 때는 '이번 달'이 칸을 넘어 레이아웃이 깨져 '이달'로 줄인다
        { label: compact ? '이달 적립' : '이번 달 적립', value: earnedDisplay },
        { label: compact ? '이달 사용' : '이번 달 사용', value: monthly?.used },
    ];
    // 상세는 한 번에 하나만 펼친다
    const [openId, setOpenId] = useState<string | null>(null);

    return (
        <div
            className={cn(
                'bg-surface-page border-border-default relative min-h-75 overflow-hidden rounded-2xl border shadow-md',
                className,
            )}
        >
            <div className="absolute inset-0 flex flex-col gap-2 p-4">
                {compact ? (
                    // 좁을 때 — 세 칸을 같은 폭으로 나란히 두고, 칸마다 이름 아래 수량 두 줄
                    <div className="bg-surface-canvas divide-border-strong grid grid-cols-3 divide-x rounded-lg py-3">
                        {summaryItems.map(({ label, value }) => (
                            <div key={label} className="min-w-0 px-1">
                                <SummaryItem label={label} value={value} stacked />
                            </div>
                        ))}
                    </div>
                ) : (
                    // 넓을 때 — '사용 가능 10장 | 이번 달 적립 0장 | 이번 달 사용 0장' 한 줄
                    <div className="bg-surface-canvas flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg p-4">
                        <Ticket className="text-fg-primary size-4.5" aria-hidden />
                        {summaryItems.map(({ label, value }, index) => (
                            <Fragment key={label}>
                                {index > 0 && (
                                    <span
                                        aria-hidden
                                        className="bg-border-strong h-4 w-px rounded-full"
                                    />
                                )}
                                <SummaryItem label={label} value={value} stacked={false} />
                            </Fragment>
                        ))}
                    </div>
                )}

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
                            {history.map((item, index) => (
                                <Fragment key={item.id}>
                                    {index > 0 && (
                                        <li aria-hidden className="bg-border-default h-px" />
                                    )}
                                    <TicketHistoryRow
                                        item={item}
                                        open={openId === item.id}
                                        onToggle={() =>
                                            setOpenId((prev) => (prev === item.id ? null : item.id))
                                        }
                                        fresh={freshIds.has(item.id)}
                                    />
                                </Fragment>
                            ))}
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
