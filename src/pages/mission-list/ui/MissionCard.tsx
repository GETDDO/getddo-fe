import { toast } from 'sonner';

import type { Mission } from '@entities/mission';

import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';

const MISSION_COPY = {
    quiz: {
        description: (tickets: number) => `정답을 맞히면 응모권 ${tickets}장을 받아요.`,
        action: '퀴즈 풀기',
    },
    survey: {
        description: (tickets: number) => `필수 문항에 모두 답하면 응모권 ${tickets}장을 받아요.`,
        action: '설문 참여하기',
    },
} as const;

export function MissionCard({ mission }: { mission: Mission }) {
    const completed = mission.status === 'completed';
    const copy = MISSION_COPY[mission.type];

    // 호버하면 살짝 떠오른다 (동작 줄이기 설정이면 움직이지 않는다)
    return (
        <article className="bg-surface-page border-border-default flex flex-col gap-2 rounded-2xl border p-4 shadow-md transition-[translate] duration-200 motion-safe:hover:-translate-y-1">
            <div className="flex items-center gap-2">
                <span
                    aria-hidden
                    className={cn(
                        'size-1.25 rounded-full',
                        completed ? 'bg-fg-disabled' : 'bg-brand-primary',
                    )}
                />
                <span
                    className={`text-caption ${completed ? 'text-fg-tertiary' : 'text-brand-primary'}`}
                >
                    {completed ? '참여 완료' : '참여 가능'}
                </span>
            </div>
            <h3 className="text-title-3 text-fg-primary">{mission.title}</h3>
            <p className="text-body text-fg-tertiary">{copy.description(mission.rewardTickets)}</p>
            {completed ? (
                <span className="bg-surface-disabled text-fg-disabled text-body-bold flex h-10 items-center justify-center rounded-lg">
                    참여 완료
                </span>
            ) : (
                <Button
                    variant="secondary"
                    // 디자인 시스템 action/neutral 호버·누름 색, 누를 때 내려가지 않게, 손가락 커서
                    className="text-body-bold! bg-action-neutral hover:bg-action-neutral-hover active:bg-action-neutral-pressed h-10 w-full cursor-pointer font-semibold active:not-aria-[haspopup]:translate-y-0"
                    // TODO: 설문·퀴즈 풀이 화면과 라우트가 생기면 해당 화면으로 이동한다
                    onClick={() => toast.info(`${copy.action} 화면은 준비 중이에요.`)}
                >
                    {copy.action}
                </Button>
            )}
        </article>
    );
}
