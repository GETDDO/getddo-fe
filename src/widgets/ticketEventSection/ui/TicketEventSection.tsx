import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import type { Event } from '@entities/event';

import { FeaturedEventCard, UpcomingEventCard } from '@entities/event';
import { cn } from '@shared/lib/utils';
import { Card } from '@shared/ui/card';
import { Pager } from '@shared/ui/pager';

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
        <section className="flex flex-col gap-6">
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
                            <Card className="relative gap-0 self-stretch py-0">
                                <div className="absolute inset-0 flex flex-col gap-2 overflow-hidden p-4">
                                    <UpcomingEventCarousel events={upcomingEvents} fillHeight />
                                </div>
                            </Card>
                        ) : (
                            <Card className="gap-2 p-4">
                                <UpcomingEventCarousel events={upcomingEvents} />
                            </Card>
                        ))}
                </div>
            )}
        </section>
    );
}

const UPCOMING_PAGE_SIZE = 2;

/** 오픈 예정 이벤트 캐러셀 — 한 화면에 세로로 2장씩, 좌우 버튼으로 페이지 단위 슬라이드한다 */
function UpcomingEventCarousel({
    events,
    fillHeight = false,
}: {
    events: Event[];
    /** 부모 높이가 정해진 컨테이너(featured 카드 옆)에서 카드를 남은 높이로 늘릴지 여부 — 미지정 컨테이너에서 h-full은 높이를 0으로 붕괴시킨다 */
    fillHeight?: boolean;
}) {
    const [page, setPage] = useState(0);
    const totalPages = Math.ceil(events.length / UPCOMING_PAGE_SIZE);
    // 폴링으로 목록이 줄었을 때 현재 페이지가 범위를 벗어나지 않게 보정한다
    const current = Math.min(page, Math.max(totalPages - 1, 0));

    return (
        <>
            <div className="flex items-center justify-between">
                <h3 className="text-body-sm-bold text-fg-primary">오픈 예정</h3>
                {/* 넘길 게 있을 때만 — 제목 줄 오른쪽에 배너와 같은 공용 Pager */}
                {totalPages > 1 && (
                    <Pager
                        current={current}
                        total={totalPages}
                        prevLabel="이전 오픈 예정"
                        nextLabel="다음 오픈 예정"
                        prevDisabled={current === 0}
                        nextDisabled={current >= totalPages - 1}
                        onPrev={() => setPage(current - 1)}
                        onNext={() => setPage(current + 1)}
                    />
                )}
            </div>
            <div className={cn('relative', fillHeight && 'min-h-0 flex-1')}>
                <div className={cn('overflow-hidden', fillHeight && 'h-full')}>
                    <div
                        className={cn(
                            'flex transition-transform duration-300 ease-out motion-reduce:transition-none',
                            fillHeight && 'h-full',
                        )}
                        style={{ transform: `translateX(-${current * 100}%)` }}
                    >
                        {Array.from({ length: totalPages }, (_, pageIndex) => (
                            <div
                                key={pageIndex}
                                // 화면 밖 슬라이드도 렌더되므로 Tab 포커스·보조 기술 접근을 inert로 차단한다
                                inert={pageIndex !== current}
                                className={cn(
                                    'flex w-full shrink-0 flex-col gap-2 px-1',
                                    fillHeight && 'h-full',
                                )}
                            >
                                {events
                                    .slice(
                                        pageIndex * UPCOMING_PAGE_SIZE,
                                        (pageIndex + 1) * UPCOMING_PAGE_SIZE,
                                    )
                                    .map((event) => (
                                        <UpcomingEventCard key={event.id} event={event} />
                                    ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
