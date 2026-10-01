import { formatKst } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/format';
import { cn } from '@shared/lib/utils';

import type { EntryStatus, MyEntry } from '../model/types';

// 접수 상태만 표시한다 — 당첨 여부는 발표 화면에서 다룬다 (docs/CONTEXT.md: 발표 전 당첨 정보 비노출)
const STATUS_META: Record<EntryStatus, { label: string; chipClass: string }> = {
    applied: { label: '접수', chipClass: 'bg-semantic-success-soft text-semantic-success' },
    cancelled: { label: '취소', chipClass: 'bg-surface-sunken text-fg-tertiary' },
};

export function MyEntryItem({ entry }: { entry: MyEntry }) {
    const meta = STATUS_META[entry.status];

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
                    <p className="text-body-sm text-fg-primary truncate">{entry.eventTitle}</p>
                    <p className="text-caption text-fg-tertiary">{formatKst(entry.createdAt)}</p>
                </div>
            </div>
            <span className="text-body-sm-bold text-fg-primary shrink-0">
                {entry.ticketsUsed === 0
                    ? '응모권 미사용'
                    : `${formatNumber(entry.ticketsUsed)}장 사용`}
            </span>
        </li>
    );
}
