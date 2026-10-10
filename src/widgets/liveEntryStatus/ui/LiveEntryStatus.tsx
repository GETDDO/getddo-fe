import { Ticket, UsersRound } from 'lucide-react';

import { useEntryStatistics } from '@entities/entry';
import { formatNumber } from '@shared/lib/format';
import { Badge } from '@shared/ui/badge';

interface LiveEntryStatusProps {
    eventId: string;
    /** 응모 진행 중(open) 이벤트인가 — true일 때만 30초 폴링한다 (ADR-0007) */
    isOpen: boolean;
    /** 여러 이벤트가 겹쳐 보이는 곳(홈 배너)에서 현재 보이는 항목만 true로 둔다 */
    enabled?: boolean;
}

// CONTEXT.md — 실시간 현황에는 응모자 수·총 차감 응모권 수·본인 차감 수까지만 표시하고 당첨 확률은 노출하지 않는다
export function LiveEntryStatus({ eventId, isOpen, enabled = true }: LiveEntryStatusProps) {
    const { data } = useEntryStatistics(eventId, { isOpen, enabled });

    if (!data) {
        return null;
    }

    return (
        // 폴링으로 수치가 바뀌면 보조 기술에 조용히 알린다
        <div className="flex flex-wrap items-center gap-2" aria-live="polite">
            <Badge variant="accent" size="md" className="gap-2.5">
                <UsersRound className="size-5" />
                {formatNumber(data.participantCount)}명 참여 중
            </Badge>
            <Badge variant="accent" size="md" className="gap-2.5">
                <Ticket className="size-5" />
                {formatNumber(data.totalSpentTicketCount)}장 사용
            </Badge>
            {data.mySpentTicketCount > 0 && (
                <Badge variant="accent" size="md" className="gap-2.5">
                    <Ticket className="size-5" />내 {formatNumber(data.mySpentTicketCount)}장
                </Badge>
            )}
        </div>
    );
}
