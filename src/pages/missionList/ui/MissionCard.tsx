import type { MissionSummary } from '@entities/mission';

import { formatKst } from '@shared/lib/date';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';

import { getMissionPhase, missionDeadlineLabel } from '../lib/missionBoard';
import { MissionKindReward } from './MissionKindReward';

const MISSION_COPY = {
    QUIZ: { description: '정답을 맞히면 받아요', action: '퀴즈 풀기' },
    SURVEY: { description: '필수 문항에 답하면 받아요', action: '설문 참여' },
} as const;

const START_FORMAT: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };

/**
 * 설문·퀴즈 카드 — 위에 설문/퀴즈 칩과 응모권 보상(+N), 오른쪽 위에 마감까지 남은 날, 제목, 짧은 설명,
 * 오른쪽에 Medium(40) 버튼. 완료한 미션은 '참여 완료' 버튼을 흐리게 둔다.
 * 테두리 없이 그림자만 둬 테두리 버튼과 선이 겹치지 않게 한다.
 * onOpen: 풀이 모달을 연다 (목록 페이지가 모달을 들고 있다)
 */
export function MissionCard({
    mission,
    now,
    onOpen,
}: {
    mission: MissionSummary;
    now: Date;
    onOpen: (missionId: string) => void;
}) {
    const copy = MISSION_COPY[mission.missionType];
    const phase = getMissionPhase(mission, now);
    const deadline = missionDeadlineLabel(mission.endsAt, now);

    return (
        <article
            // 위쪽 출석·내역·게임 카드와 같이 테두리를 둔다. 완료·종료 카드는 회색 바탕에 그림자 없이
            className={`border-border-default flex items-center justify-between gap-4 rounded-2xl border p-5 ${mission.completed || phase === 'ended' ? 'bg-surface-canvas' : 'bg-surface-page shadow-md'}`}
        >
            <div className="flex min-w-0 flex-col gap-1">
                <div className="flex items-center gap-2">
                    <MissionKindReward
                        missionType={mission.missionType}
                        rewardTicketCount={mission.rewardTicketCount}
                        muted={mission.completed || phase === 'ended'}
                    />
                    {/* 참여 완료한 미션에는 마감 정보가 필요 없다 */}
                    {!mission.completed &&
                        (phase === 'upcoming' ? (
                            <Badge variant="outline">
                                {formatKst(mission.startsAt, START_FORMAT)} 시작
                            </Badge>
                        ) : (
                            // 오늘 마감은 겟또타임·이벤트 카드의 D-day처럼 검정 알약, 그 밖에는 종류 칩(회색)과
                            // 겹치지 않게 흰 바탕+테두리
                            <Badge variant={deadline === '오늘 마감' ? 'inverse' : 'outline'}>
                                {deadline}
                            </Badge>
                        ))}
                </div>
                <h3
                    className={`text-body-bold ${mission.completed || phase === 'ended' ? 'text-fg-secondary' : 'text-fg-primary'}`}
                >
                    {mission.title}
                </h3>
                <p className="text-body-sm text-fg-tertiary">{copy.description}</p>
            </div>
            {mission.completed ? (
                <Button disabled className="px-7">
                    참여 완료
                </Button>
            ) : phase === 'open' ? (
                <Button
                    // 공용 secondary Medium(40) — 카드마다 반복되는 행동이라 한 단계 낮춘다 (화면의 주 행동은 출석하기). 참여를 마치면 흐린 '참여 완료'로 바뀐다
                    variant="secondary"
                    className="px-7"
                    onClick={() => onOpen(mission.id)}
                >
                    {copy.action}
                </Button>
            ) : (
                <Button disabled className="px-7">
                    {phase === 'upcoming' ? '곧 시작' : '기간 종료'}
                </Button>
            )}
        </article>
    );
}
