import type { MissionSummary } from '@entities/mission';

import { Button } from '@shared/ui/button';

import { MissionKindReward } from './MissionKindReward';

const MISSION_COPY = {
    QUIZ: { description: '정답을 맞히면 받아요', action: '퀴즈 풀기' },
    SURVEY: { description: '필수 문항에 답하면 받아요', action: '설문 참여' },
} as const;

/**
 * 설문·퀴즈 카드 — 위에 설문/퀴즈 칩과 응모권 보상(+N), 제목, 짧은 설명, 오른쪽에 Medium(40) 버튼.
 * 테두리 없이 그림자만 둬 테두리 버튼과 선이 겹치지 않게 한다. 완료한 미션은 보상·버튼을 흐리게 둔다.
 * onOpen: 풀이 모달을 연다 (목록 페이지가 모달을 들고 있다)
 */
export function MissionCard({
    mission,
    onOpen,
}: {
    mission: MissionSummary;
    onOpen: (missionId: string) => void;
}) {
    const copy = MISSION_COPY[mission.missionType];

    return (
        <article className="bg-surface-page flex items-center justify-between gap-4 rounded-2xl p-5 shadow-md">
            <div className="flex min-w-0 flex-col gap-1">
                <MissionKindReward
                    missionType={mission.missionType}
                    rewardTicketCount={mission.rewardTicketCount}
                    muted={mission.completed}
                />
                <h3 className="text-body-bold text-fg-primary">{mission.title}</h3>
                <p className="text-body-sm text-fg-tertiary">{copy.description}</p>
            </div>
            {mission.completed ? (
                <Button disabled className="px-7">
                    참여 완료
                </Button>
            ) : (
                <Button
                    // 공용 secondary Medium(40) — 카드마다 반복되는 행동이라 한 단계 낮춘다 (화면의 주 행동은 출석하기)
                    variant="secondary"
                    className="px-7"
                    onClick={() => onOpen(mission.id)}
                >
                    {copy.action}
                </Button>
            )}
        </article>
    );
}
