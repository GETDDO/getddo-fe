import type { Event } from '@entities/event';

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
 */
export function LiveRaffleSection({ id, events }: LiveRaffleSectionProps) {
    const [first, ...rest] = events;

    return (
        <section id={id} className="flex scroll-mt-24 flex-col gap-5">
            <div className="flex items-center gap-2">
                <h2 className="text-title-3 text-fg-primary">지금 진행 중</h2>
                {events.length > 0 && (
                    <span className="bg-surface-sunken text-label-sm text-fg-secondary rounded-full px-2.5 py-1">
                        {events.length}
                    </span>
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
