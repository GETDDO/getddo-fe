import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { Event } from '@entities/event';

import { FeaturedEventCard, UpcomingEventCard } from '@entities/event';

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
                            // featured 카드가 행 높이를 결정하고 목록은 그 안에서 스크롤 — 내용물 높이가 행을 밀지 않도록 absolute로 띄운다
                            <div className="border-border-default bg-surface-page relative self-stretch overflow-hidden rounded-2xl border">
                                <div className="absolute inset-0 flex flex-col gap-2 overflow-hidden p-4">
                                    <h3 className="text-body-sm-bold text-fg-primary">오픈 예정</h3>
                                    {upcomingEvents.map((event) => (
                                        <UpcomingEventCard key={event.id} event={event} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="border-border-default bg-surface-page flex flex-col gap-2 rounded-2xl border p-4">
                                <h3 className="text-body-sm-bold text-fg-primary">오픈 예정</h3>
                                {upcomingEvents.map((event) => (
                                    <UpcomingEventCard key={event.id} event={event} />
                                ))}
                            </div>
                        ))}
                </div>
            )}
        </section>
    );
}
