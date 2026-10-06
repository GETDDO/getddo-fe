import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EventResultRow, useEventList } from '@entities/event';
import { Button } from '@shared/ui/button';
import { BannerSlider } from '@widgets/bannerSlider';
import { EventCardList } from '@widgets/eventCardList';
import { LiveEntryStatus } from '@widgets/liveEntryStatus';
import { TicketBalanceWidget } from '@widgets/ticketBalance';
import { TicketEventSection } from '@widgets/ticketEventSection';

/** 피그마 홈 본문 폭 1200 (좌우 여백 24 포함 1248) — 헤더와 같은 폭 */
const CONTAINER = 'mx-auto w-full max-w-312 px-6';

/** 응모권 없이 참여할 이벤트·발표 대기·결과는 한 줄(4개)까지만 보여주고 나머지는 '더보기'로 넘긴다 */
const FREE_EVENT_LIMIT = 4;
const RESULT_LIMIT = 4;

export function HomePage() {
    const { data: events, isPending, isError } = useEventList();

    const ticketEvents = (events ?? []).filter((event) => event.requiredTickets > 0);
    const freeEvents = (events ?? []).filter((event) => event.requiredTickets === 0);
    const resultEvents = (events ?? []).filter(
        (event) => event.status === 'closed' || event.status === 'drawn',
    );

    return (
        // 피그마 홈 간격 — 헤더 아래 80, 섹션 사이 80, 섹션 제목과 내용 24, 마지막 섹션과 푸터도 섹션 사이와 같은 80
        <main className="flex w-full flex-col gap-20 pt-20 pb-20">
            <div className={`${CONTAINER} flex flex-col gap-20`}>
                <BannerSlider renderStatus={(event) => <LiveEntryStatus event={event} />} />
                <TicketEventSection events={ticketEvents} isPending={isPending} isError={isError} />
            </div>
            <div className={CONTAINER}>
                <TicketBalanceWidget />
            </div>
            <div className={`${CONTAINER} flex flex-col gap-20`}>
                <EventCardList
                    title="응모권 없이 참여할 수 있는 이벤트"
                    moreHref="/events"
                    moreLabel="더보기"
                    events={freeEvents.slice(0, FREE_EVENT_LIMIT)}
                    isPending={isPending}
                    isError={isError}
                    emptyMessage="현재 응모권 없이 참여할 수 있는 이벤트가 없습니다."
                />
                {resultEvents.length > 0 && (
                    <section className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-title-3 text-fg-primary">발표 대기 · 결과</h2>
                            <Button asChild variant="link" size="text">
                                <Link to="/events">
                                    더보기
                                    <ChevronRight />
                                </Link>
                            </Button>
                        </div>
                        {/* 피그마 홈 — 바깥 테두리 없이 행 사이에만 구분선, 4개까지 보여주고 나머지는 '더보기'. 구분선은 호버 배경과 같은 8px 안쪽에서 시작해 좌우 끝을 맞춘다 */}
                        <div className="[&>*+*]:before:bg-border-default flex flex-col [&>*+*]:relative [&>*+*]:before:absolute [&>*+*]:before:inset-x-2 [&>*+*]:before:top-0 [&>*+*]:before:h-px">
                            {resultEvents.slice(0, RESULT_LIMIT).map((event) => (
                                <EventResultRow key={event.id} event={event} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
