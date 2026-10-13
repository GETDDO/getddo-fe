import { useState } from 'react';

import { useMissionList } from '@entities/mission';
import emptyMascot from '@shared/assets/ui/reward-mascot.png';
import { useVirtualClock } from '@shared/lib/virtualClock';

import {
    filterMissions,
    MISSION_FILTERS,
    type MissionFilter,
    sortMissions,
} from '../lib/missionBoard';
import { isMissionOpen } from '../lib/todayRewards';
import { MissionCard } from './MissionCard';
import { SectionHeader } from './SectionHeader';

/**
 * 설문·퀴즈 섹션 — 머리에 지금 참여할 수 있는 미션의 완료 진행, 종류·참여 완료 거르기 칩,
 * 참여 가능한 미션부터 놓은 카드 목록. 미션이 없으면 타꼬가 다음 미션을 알려 준다
 */
export function MissionBoard({
    id,
    className,
    onOpen,
}: {
    id: string;
    className?: string;
    onOpen: (missionId: string) => void;
}) {
    const { data: missions, isPending, isError } = useMissionList();
    const now = useVirtualClock().now();
    const [filter, setFilter] = useState<MissionFilter>('ALL');

    // 진행은 배너와 같이 지금 참여할 수 있는 미션만 센다
    const openMissions = missions?.filter((mission) => isMissionOpen(mission, now)) ?? [];
    const doneCount = openMissions.filter((mission) => mission.completed).length;
    const shown = missions ? sortMissions(filterMissions(missions, filter), now) : [];

    return (
        <section id={id} className={`flex scroll-mt-24 flex-col gap-6 ${className ?? ''}`}>
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
                <SectionHeader
                    title="설문 · 퀴즈"
                    caption="미션마다 한 번만 응모권을 받을 수 있어요."
                />
                {openMissions.length > 0 && (
                    <div className="flex items-center gap-3">
                        <span className="text-body-sm text-fg-secondary whitespace-nowrap">
                            <span className="text-body-sm-bold text-fg-primary tabular-nums">
                                {doneCount} / {openMissions.length}
                            </span>{' '}
                            완료
                        </span>
                        <span
                            aria-hidden
                            className="bg-surface-sunken h-2 w-28 overflow-hidden rounded-full"
                        >
                            <span
                                className={`block h-full rounded-full transition-[width] duration-500 ${doneCount === openMissions.length ? 'bg-ticket-primary' : 'bg-action-neutral'}`}
                                style={{
                                    width: `${Math.round((doneCount / openMissions.length) * 100)}%`,
                                }}
                            />
                        </span>
                    </div>
                )}
            </div>

            {missions && missions.length > 0 && (
                // 이벤트 목록의 거르기 칩과 같은 모양 — 고른 칩은 검정 테두리 (마젠타는 "지금" 신호에만, DESIGN-SYSTEM 색 역할 규칙)
                <div className="flex flex-wrap items-center gap-2">
                    {MISSION_FILTERS.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            aria-pressed={item.value === filter}
                            onClick={() => setFilter(item.value)}
                            className={`bg-surface-page text-caption focus-visible:ring-border-focus focus-visible:ring-offset-surface-page cursor-pointer rounded-full border px-3 py-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${item.value === filter ? 'border-fg-primary text-fg-primary' : 'border-border-strong text-fg-tertiary'}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}

            {isPending && <p className="text-body-sm text-fg-tertiary">불러오는 중…</p>}
            {isError && (
                <p className="text-body-sm text-destructive">미션 목록을 불러오지 못했습니다.</p>
            )}

            {missions && shown.length === 0 && (
                <div className="bg-surface-canvas flex flex-col items-center gap-3 rounded-2xl px-6 py-10 text-center">
                    <img src={emptyMascot} alt="" className="h-24 w-auto" />
                    <p className="text-body-bold text-fg-primary">
                        {missions.length === 0
                            ? '새 미션이 곧 올라와요'
                            : filter === 'DONE'
                              ? '아직 참여한 미션이 없어요'
                              : '이 종류의 미션이 아직 없어요'}
                    </p>
                    <p className="text-body-sm text-fg-tertiary">
                        {missions.length === 0
                            ? '그동안 출석하고 게임하면서 응모권을 모아 두세요.'
                            : '다른 미션부터 참여해 보세요.'}
                    </p>
                </div>
            )}

            {shown.length > 0 && (
                // 설문·퀴즈 카드는 넓은 화면에서 2열로 둔다
                <div className="grid gap-4 md:grid-cols-2">
                    {shown.map((mission) => (
                        <MissionCard key={mission.id} mission={mission} now={now} onOpen={onOpen} />
                    ))}
                </div>
            )}
        </section>
    );
}
