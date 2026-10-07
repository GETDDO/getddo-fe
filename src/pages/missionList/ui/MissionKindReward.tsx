import { Ticket } from 'lucide-react';

import type { MissionSummary } from '@entities/mission';

import { Badge } from '@shared/ui/badge';

const KIND_LABEL = { QUIZ: '퀴즈', SURVEY: '설문' } as const;

/** 설문·퀴즈 구분 칩과 응모권 보상(🎟 +N)을 한 줄로 — 미션 카드와 풀이 모달 머리가 같이 쓴다. 완료한 미션은 보상을 흐리게 */
export function MissionKindReward({
    missionType,
    rewardTicketCount,
    muted = false,
}: {
    missionType: MissionSummary['missionType'];
    rewardTicketCount: number;
    muted?: boolean;
}) {
    return (
        <div className="flex items-center gap-2">
            <Badge variant="neutral">{KIND_LABEL[missionType]}</Badge>
            <span
                aria-label={`보상 응모권 ${rewardTicketCount}장`}
                className={`text-body-sm-bold flex items-center gap-0.5 ${muted ? 'text-fg-disabled' : 'text-ticket-on'}`}
            >
                <Ticket aria-hidden className="size-4" />+{rewardTicketCount}
            </span>
        </div>
    );
}
