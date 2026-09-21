import { Ticket, UsersRound } from 'lucide-react';

import { formatNumber } from '@shared/lib/format';

import type { Event } from '../model/types';

// CONTEXT.md — 실시간 현황에는 응모자 수(중복 제거)·사용 응모권 수·본인 응모 수까지만 표시하고 당첨 확률은 노출하지 않는다
export function EventLiveStats({ event }: { event: Event }) {
    const hasLiveStats = event.participantCount != null || event.usedTicketCount != null;

    if (!hasLiveStats && !(event.myEntryCount != null && event.myEntryCount > 0)) {
        return null;
    }

    return (
        <div className="text-caption text-fg-tertiary flex flex-wrap items-center gap-4">
            {event.participantCount != null && (
                <span className="flex items-center gap-1">
                    <UsersRound className="size-4" />총 참여자{' '}
                    {formatNumber(event.participantCount)}명
                </span>
            )}
            {event.usedTicketCount != null && (
                <span className="flex items-center gap-1">
                    <Ticket className="size-4" />
                    사용된 응모권 {formatNumber(event.usedTicketCount)}장
                </span>
            )}
            {event.myEntryCount != null && event.myEntryCount > 0 && (
                <span className="text-fg-brand font-medium">내 응모 {event.myEntryCount}장</span>
            )}
        </div>
    );
}
