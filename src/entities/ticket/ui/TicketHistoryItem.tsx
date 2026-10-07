import { formatKst } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/format';
import { cn } from '@shared/lib/utils';

import type { TicketHistory, TicketTransactionType } from '../model/history';

// 이력 유형별 표시 — 지급·차감·반환·만료·회수·정정을 별도 이력으로 기록한다 (getddo-spec ticket.md)
const TYPE_META: Record<TicketTransactionType, { label: string; chipClass: string }> = {
    GRANT: { label: '지급', chipClass: 'bg-semantic-success-soft text-semantic-success' },
    REFUND: { label: '반환', chipClass: 'bg-semantic-success-soft text-semantic-success' },
    SPEND: { label: '사용', chipClass: 'bg-surface-sunken text-fg-secondary' },
    EXPIRE: { label: '만료', chipClass: 'bg-surface-sunken text-fg-tertiary' },
    REVOKE: { label: '회수', chipClass: 'bg-status-rejected text-status-rejected-text' },
    CORRECTION: { label: '정정', chipClass: 'bg-surface-sunken text-fg-secondary' },
};

export function TicketHistoryItem({ history }: { history: TicketHistory }) {
    const meta = TYPE_META[history.transactionType];
    return (
        <li className="flex items-center justify-between gap-4 py-4">
            <div className="flex min-w-0 items-center gap-3">
                <span
                    className={cn(
                        'text-caption shrink-0 rounded-md px-2 py-0.5 font-medium',
                        meta.chipClass,
                    )}
                >
                    {meta.label}
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="text-body-sm text-fg-primary truncate">{history.reason}</p>
                    <p className="text-caption text-fg-tertiary">{formatKst(history.createdAt)}</p>
                </div>
            </div>
            <span
                className={cn(
                    'text-body-sm-bold shrink-0',
                    history.quantity > 0 ? 'text-semantic-success' : 'text-fg-primary',
                )}
            >
                {history.quantity > 0 ? '+' : ''}
                {formatNumber(history.quantity)}장
            </span>
        </li>
    );
}
