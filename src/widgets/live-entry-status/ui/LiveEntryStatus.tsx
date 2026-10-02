import { Ticket, UsersRound } from 'lucide-react';

import type { Event } from '@entities/event';

import { formatNumber } from '@shared/lib/format';
import { Badge } from '@shared/ui/badge';

// CONTEXT.md — 실시간 현황에는 응모자 수(중복 제거)·사용 응모권 수까지만 표시하고 당첨 확률은 노출하지 않는다
export function LiveEntryStatus({ event }: { event: Event }) {
    if (event.participantCount == null && event.usedTicketCount == null) {
        return null;
    }

    return (
        // 목록 폴링으로 수치가 바뀌면 보조 기술에 조용히 알린다
        <div className="flex flex-wrap items-center gap-2" aria-live="polite">
            {event.participantCount != null && (
                <Badge variant="accent" size="md" className="gap-2.5">
                    <UsersRound className="size-5" />
                    {formatNumber(event.participantCount)}명 참여 중
                </Badge>
            )}
            {event.usedTicketCount != null && (
                <Badge variant="accent" size="md" className="gap-2.5">
                    <Ticket className="size-5" />
                    {formatNumber(event.usedTicketCount)}장 사용
                </Badge>
            )}
        </div>
    );
}
