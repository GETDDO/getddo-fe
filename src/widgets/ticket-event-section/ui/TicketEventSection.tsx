import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import type { Event } from '@entities/event';

import { FeaturedEventCard, UpcomingEventCard } from '@entities/event';
import { cn } from '@shared/lib/utils';

/**
 * 홈 '타임 래플 · 응모권 사용' 섹션 — 좌측에 대표 진행 이벤트 카드,
 * 우측 컨테이너 카드에 오픈 예정 이벤트를 세로로 쌓는다 (그리드 stretch로 양쪽 높이가 맞는다)
 */
export function TicketEventSection({
    events,
    isPending,
    isError,
}: {
    events: Event[];
    isPending?: boolean;
    isError?: boolean;
}) {
    const openEvents = events
        .filter((event) => event.status === 'open')
        .sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime());
    const upcomingEvents = events
        .filter((event) => event.status === 'upcoming')
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

    const featured = openEvents[0];

    return (
        <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-subhead text-fg-primary">타임 래플 · 응모권 사용</h2>
                <Link
                    to="/events"
                    className="text-fg-primary text-body-sm flex items-center gap-0.5"
                >
                    전체보기
                    <ChevronRight className="size-5" />
                </Link>
            </div>
            {isPending && <p className="text-fg-tertiary text-body-sm">불러오는 중…</p>}
            {isError && (
                <p className="text-destructive text-body-sm">이벤트 목록을 불러오지 못했습니다.</p>
            )}
            {!isPending && !isError && events.length === 0 && (
                <p className="text-fg-tertiary text-body-sm">표시할 이벤트가 없습니다.</p>
            )}
            {(featured || upcomingEvents.length > 0) && (
                <div className="grid items-stretch gap-4 lg:grid-cols-2">
                    {featured && <FeaturedEventCard event={featured} />}
                    {upcomingEvents.length > 0 &&
                        (featured ? (
                            // featured 카드가 행 높이를 결정하고 캐러셀은 그 안에서 늘어난다 — 내용물 높이가 행을 밀지 않도록 absolute로 띄운다
                            <div className="border-border-default bg-surface-page relative self-stretch overflow-hidden rounded-2xl border">
                                <div className="absolute inset-0 flex flex-col gap-2 overflow-hidden p-4">
                                    <UpcomingEventCarousel events={upcomingEvents} />
                                </div>
                            </div>
                        ) : (
                            <div className="border-border-default bg-surface-page flex flex-col gap-2 rounded-2xl border p-4">
                                <UpcomingEventCarousel events={upcomingEvents} />
                            </div>
                        ))}
                </div>
            )}
        </section>
    );
}

const UPCOMING_PAGE_SIZE = 2;

/** 오픈 예정 이벤트 캐러셀 — 한 화면에 2장씩, 좌우 버튼으로 페이지 단위 슬라이드한다 */
function UpcomingEventCarousel({ events }: { events: Event[] }) {
    const [page, setPage] = useState(0);
    const totalPages = Math.ceil(events.length / UPCOMING_PAGE_SIZE);
    // 폴링으로 목록이 줄었을 때 현재 페이지가 범위를 벗어나지 않게 보정한다
    const current = Math.min(page, Math.max(totalPages - 1, 0));

    return (
        <>
            <div className="flex items-center justify-between">
                <h3 className="text-body-sm-bold text-fg-primary">오픈 예정</h3>
                {totalPages > 1 && (
                    <span className="text-caption text-fg-tertiary tabular-nums">
                        ({current + 1}/{totalPages})
                    </span>
                )}
            </div>
            <div className="relative min-h-0 flex-1">
                <div className="h-full overflow-hidden">
                    <div
                        className="flex h-full transition-transform duration-300 ease-out"
                        style={{ transform: `translateX(-${current * 100}%)` }}
                    >
                        {events.map((event) => (
                            <div key={event.id} className="flex h-full w-1/2 shrink-0 px-1">
                                <UpcomingEventCard event={event} />
                            </div>
                        ))}
                    </div>
                </div>
                {current > 0 && <CarouselButton side="left" onClick={() => setPage(current - 1)} />}
                {current < totalPages - 1 && (
                    <CarouselButton side="right" onClick={() => setPage(current + 1)} />
                )}
            </div>
        </>
    );
}

/** 양 끝 카드 가장자리에 띄우는 이동 버튼 — 평소 반투명, 호버 시 진해진다 */
function CarouselButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
    const Icon = side === 'left' ? ChevronLeft : ChevronRight;
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={side === 'left' ? '이전 오픈 예정' : '다음 오픈 예정'}
            className={cn(
                'border-border-default bg-surface-page text-fg-primary absolute top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border opacity-50 shadow-sm transition-opacity hover:opacity-100',
                side === 'left' ? 'left-1' : 'right-1',
            )}
        >
            <Icon className="size-5" />
        </button>
    );
}
