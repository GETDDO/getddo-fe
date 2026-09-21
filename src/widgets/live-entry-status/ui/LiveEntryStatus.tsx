import { Ticket, UsersRound } from 'lucide-react';

import type { Event } from '@entities/event';

import { formatNumber } from '@shared/lib/format';

// CONTEXT.md — 실시간 현황에는 응모자 수(중복 제거)·사용 응모권 수까지만 표시하고 당첨 확률은 노출하지 않는다
export function LiveEntryStatus({ event }: { event: Event }) {
    if (event.participantCount == null && event.usedTicketCount == null) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            {event.participantCount != null && (
                <span className="bg-surface-page text-fg-primary text-caption flex items-center gap-1.5 rounded-full px-3 py-1 font-medium">
                    <UsersRound className="size-4" />
                    {formatNumber(event.participantCount)}명 참여 중
                </span>
            )}
            {event.usedTicketCount != null && (
                <span className="bg-surface-page text-fg-primary text-caption flex items-center gap-1.5 rounded-full px-3 py-1 font-medium">
                    <Ticket className="size-4" />
                    {formatNumber(event.usedTicketCount)}장 사용
                </span>
            )}
        </div>
    );
}
