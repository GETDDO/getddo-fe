import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { useId } from 'react';
import { Link } from 'react-router-dom';

import type { TicketHistory } from '@entities/ticket';

import { formatKst } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/format';
import { cn } from '@shared/lib/utils';

import { getTicketHistoryLink } from '../lib/ticketHistoryLink';
import { TICKET_HISTORY_META } from '../model/ticketHistoryMeta';

const FOCUS =
    'focus-visible:ring-border-focus focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none';

const signed = (n: number) => (n > 0 ? `+${formatNumber(n)}` : formatNumber(n));

/**
 * 응모권 내역 한 줄 — 누르면 아래로 상세(구분·사유·일시·변동·잔액)가 펼쳐지는 아코디언.
 * 래플 응모처럼 이어서 볼 화면이 있으면 상세 맨 아래에 링크를 둔다 (연결된 래플이 있으면 그 래플로)
 */
export function TicketHistoryRow({
    item,
    open,
    onToggle,
    fresh = false,
}: {
    item: TicketHistory;
    open: boolean;
    onToggle: () => void;
    /** 방금 받은 내역 — 잠깐 강조한다 */
    fresh?: boolean;
}) {
    const detailId = useId();
    const meta = TICKET_HISTORY_META[item.transactionType];
    const link = getTicketHistoryLink(item);

    return (
        <li
            // 방금 받은 내역 강조 — play/yellow-soft 배경을 위아래로 4px 들여 그려 구분선에 닿지 않게 하고, 끝나면 서서히 사라진다
            className={cn(
                'before:bg-play-yellow-soft relative isolate before:absolute before:inset-x-0 before:inset-y-1 before:-z-10 before:rounded-lg before:transition-opacity before:duration-700',
                fresh
                    ? 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-3 before:opacity-100 motion-safe:duration-500'
                    : 'before:opacity-0',
            )}
        >
            <button
                type="button"
                aria-expanded={open}
                aria-controls={detailId}
                onClick={onToggle}
                className={`flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg p-4 text-left ${FOCUS}`}
            >
                <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-body-sm-bold text-fg-primary truncate">
                        {item.reason}
                    </span>
                    <span className="text-caption text-fg-tertiary truncate">
                        {meta.label} · {formatKst(item.createdAt)}
                    </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                    <span className="text-body-bold text-fg-primary tabular-nums">
                        {signed(item.quantity)}
                    </span>
                    <ChevronDown
                        aria-hidden
                        className={cn(
                            'text-fg-secondary size-5 motion-safe:transition-transform motion-safe:duration-200',
                            open && 'rotate-180',
                        )}
                    />
                </span>
            </button>
            {open && (
                <div id={detailId} className="flex flex-col gap-2 px-4 pb-4">
                    <dl className="text-caption grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                        <dt className="text-fg-tertiary">구분</dt>
                        <dd className="text-fg-primary text-right">{meta.label}</dd>
                        <dt className="text-fg-tertiary">사유</dt>
                        <dd className="text-fg-primary text-right break-keep">{item.reason}</dd>
                        <dt className="text-fg-tertiary">일시</dt>
                        <dd className="text-fg-primary text-right">{formatKst(item.createdAt)}</dd>
                        <dt className="text-fg-tertiary">응모권 변동</dt>
                        <dd className="text-fg-primary text-right tabular-nums">
                            {signed(item.quantity)}장
                        </dd>
                        {/* balanceAfter는 전체 합계가 아니라 이 거래가 속한 월 지갑의 잔액이다 */}
                        <dt className="text-fg-tertiary">처리 후 지갑 잔액</dt>
                        <dd className="text-fg-primary text-right tabular-nums">
                            {formatNumber(item.balanceAfter)}장
                        </dd>
                    </dl>
                    {link && (
                        <Link
                            to={link.to}
                            className={`text-body-sm-bold text-fg-primary flex w-fit items-center gap-0.5 rounded-sm underline underline-offset-4 ${FOCUS}`}
                        >
                            {link.label}
                            <ArrowUpRight aria-hidden className="size-4" />
                        </Link>
                    )}
                </div>
            )}
        </li>
    );
}
