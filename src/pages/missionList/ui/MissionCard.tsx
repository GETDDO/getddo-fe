import { toast } from 'sonner';

import type { Mission } from '@entities/mission';

import { Button } from '@shared/ui/button';
import { StatusDot } from '@shared/ui/status-dot';

const MISSION_COPY = {
    quiz: {
        description: (tickets: number) => `정답을 맞히면 응모권 ${tickets}장을 받아요.`,
        action: '퀴즈 풀기',
    },
    survey: {
        description: (tickets: number) => `필수 문항에 모두 답하면 응모권 ${tickets}장을 받아요.`,
        action: '설문 참여',
    },
} as const;

export function MissionCard({ mission }: { mission: Mission }) {
    const completed = mission.status === 'completed';
    const copy = MISSION_COPY[mission.type];

    // 피그마 설문·퀴즈 카드 — 왼쪽에 상태·제목·설명, 오른쪽에 Medium(40) 버튼을 한 줄로 둔다
    // 호버하면 살짝 떠오른다 (동작 줄이기 설정이면 움직이지 않는다)
    return (
        <article className="bg-surface-page border-border-default flex items-center justify-between gap-4 rounded-2xl border p-5 shadow-md transition-[translate] duration-200 motion-safe:hover:-translate-y-1">
            <div className="flex min-w-0 flex-col gap-1">
                <StatusDot tone={completed ? 'muted' : 'brand'}>
                    {completed ? '참여 완료' : '참여 가능'}
                </StatusDot>
                <h3 className="text-title-3 text-fg-primary">{mission.title}</h3>
                <p className="text-body text-fg-tertiary">
                    {copy.description(mission.rewardTickets)}
                </p>
            </div>
            {completed ? (
                <Button disabled className="px-7">
                    참여 완료
                </Button>
            ) : (
                <Button
                    // 공용 기본 버튼 Medium(40) — 테두리 카드 안의 테두리 버튼은 선이 겹쳐 약해 보여 primary를 쓴다
                    className="px-7"
                    // TODO: 설문·퀴즈 풀이 화면과 라우트가 생기면 해당 화면으로 이동한다
                    onClick={() => toast.info(`${copy.action} 화면은 준비 중이에요.`)}
                >
                    {copy.action}
                </Button>
            )}
        </article>
    );
}
