import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import type { Event } from '@entities/event';

import { Button } from '@shared/ui/button';

import { LiveRaffleCard } from './LiveRaffleCard';

interface LiveRaffleSectionProps {
    events: Event[];
}

export function LiveRaffleSection({ events }: LiveRaffleSectionProps) {
    const [index, setIndex] = useState(0);

    // 폴링으로 목록이 줄면 보던 자리가 범위를 벗어난다.
    // effect로 되돌리면 범위 밖 인덱스로 한 번 그린 뒤 다시 그리므로 렌더 중에 잘라 쓴다
    const safeIndex = Math.min(index, Math.max(0, events.length - 1));
    const current = events[safeIndex];

    return (
        <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-title-3 text-fg-primary">지금 진행 중</h2>
                    {events.length > 0 && (
                        <span className="bg-surface-sunken text-label-sm text-fg-secondary rounded-full px-2.5 py-1">
                            {events.length}
                        </span>
                    )}
                </div>

                {events.length > 1 && (
                    <div className="flex items-center gap-2">
                        <p className="text-body-sm-bold text-fg-secondary tabular-nums">
                            {safeIndex + 1} / {events.length}
                        </p>
                        <Button
                            variant="secondary"
                            size="icon"
                            aria-label="이전 래플"
                            disabled={safeIndex === 0}
                            onClick={() => setIndex(safeIndex - 1)}
                            className="size-8 rounded-full"
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            aria-label="다음 래플"
                            disabled={safeIndex >= events.length - 1}
                            onClick={() => setIndex(safeIndex + 1)}
                            className="size-8 rounded-full"
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                )}
            </div>

            {current ? (
                <LiveRaffleCard event={current} />
            ) : (
                <p className="text-body-sm text-fg-tertiary">지금 진행 중인 래플이 없어요.</p>
            )}
        </section>
    );
}
