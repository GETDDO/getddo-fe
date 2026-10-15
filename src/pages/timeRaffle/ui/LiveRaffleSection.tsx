import type { Event } from '@entities/event';

import { Badge } from '@shared/ui/badge';

import { LiveRaffleCard } from './LiveRaffleCard';
import { LiveRaffleCompactCard } from './LiveRaffleCompactCard';

interface LiveRaffleSectionProps {
    /** 머리의 진행 칸이 스크롤해 올 위치 */
    id?: string;
    /** 마감이 임박한 순서로 정렬된 진행 중 래플 */
    events: Event[];
}

/**
 * 지금 진행 중인 래플.
 *
 * 마감이 가장 가까운 하나를 크게 두고 나머지는 작은 카드로 함께 보여 준다.
 * 넘겨 보는 방식에서는 보지 못한 래플이 그동안 마감될 수 있었다.
 * 대표는 운영자가 고르거나 무작위로 바꾸지 않고 '마감 임박'이라는 하나의 기준으로 정한다 — 기준을 제목 옆에 적어
 * 특정 래플을 밀어 주는 것처럼 보이지 않게 하고, 새로고침마다 카드가 바뀌어 찾던 래플을 놓치는 일도 없게 한다.
 */
export function LiveRaffleSection({ id, events }: LiveRaffleSectionProps) {
    const [first, ...rest] = events;

    return (
        <section id={id} className="flex scroll-mt-24 flex-col gap-6">
            <div className="flex items-center gap-2">
                <h2 className="text-title-3 text-fg-primary">지금 진행 중</h2>
                {events.length > 0 && (
                    <Badge variant="neutral" size="sm">
                        {events.length}
                    </Badge>
                )}
                {events.length > 1 && (
                    <span className="text-caption text-fg-tertiary">마감이 가까운 순</span>
                )}
            </div>

            {first ? (
                <div className="flex flex-col gap-4">
                    <LiveRaffleCard event={first} />
                    {rest.length > 0 && (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {rest.map((event) => (
                                <LiveRaffleCompactCard key={event.id} event={event} />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-body-sm text-fg-tertiary">지금 진행 중인 래플이 없어요.</p>
            )}
        </section>
    );
}
