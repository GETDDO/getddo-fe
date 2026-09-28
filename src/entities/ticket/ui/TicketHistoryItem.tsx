import { formatKst } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/format';
import { cn } from '@shared/lib/utils';

import type { TicketHistory, TicketHistoryType } from '../model/history';

// 이력 유형별 표시 — 지급·차감·반환·만료·회수를 별도 이력으로 기록한다 (getddo-spec ticket.md)
const TYPE_META: Record<TicketHistoryType, { label: string; chipClass: string }> = {
    earn: { label: '지급', chipClass: 'bg-semantic-success-soft text-semantic-success' },
    refund: { label: '반환', chipClass: 'bg-semantic-success-soft text-semantic-success' },
    use: { label: '사용', chipClass: 'bg-surface-sunken text-fg-secondary' },
    expire: { label: '만료', chipClass: 'bg-surface-sunken text-fg-tertiary' },
    revoke: { label: '회수', chipClass: 'bg-status-rejected text-status-rejected-text' },
};

export function TicketHistoryItem({ history }: { history: TicketHistory }) {
    const meta = TYPE_META[history.type];
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
                    history.amount > 0 ? 'text-semantic-success' : 'text-fg-primary',
                )}
            >
                {history.amount > 0 ? '+' : ''}
                {formatNumber(history.amount)}장
            </span>
        </li>
    );
}
