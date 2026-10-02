import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EventResultRow, useEventList } from '@entities/event';
import { BannerSlider } from '@widgets/banner-slider';
import { EventCardList } from '@widgets/event-card-list';
import { LiveEntryStatus } from '@widgets/live-entry-status';
import { TicketBalanceWidget } from '@widgets/ticket-balance-widget';
import { TicketEventSection } from '@widgets/ticket-event-section';

/** 피그마 홈 본문 폭 1200 (좌우 여백 24 포함 1248) — 헤더와 같은 폭 */
const CONTAINER = 'mx-auto w-full max-w-312 px-6';

/** 발표 대기·결과는 피그마처럼 4개까지만 보여준다 */
const RESULT_LIMIT = 4;

export function HomePage() {
    const { data: events, isPending, isError } = useEventList();

    const ticketEvents = (events ?? []).filter((event) => event.requiredTickets > 0);
    const freeEvents = (events ?? []).filter((event) => event.requiredTickets === 0);
    const resultEvents = (events ?? []).filter(
        (event) => event.status === 'closed' || event.status === 'drawn',
    );

    return (
        // 본문은 1200px 폭 컨테이너, 응모권 카드 섹션만 화면 폭 전체 회색 띠(피그마 홈)
        // 피그마 홈 간격 — 헤더 아래 80, 섹션 사이 80, 섹션 제목과 내용 24, 마지막 섹션과 푸터 224
        <main className="flex w-full flex-col gap-20 pt-20 pb-56">
            <div className={`${CONTAINER} flex flex-col gap-20`}>
                <BannerSlider renderStatus={(event) => <LiveEntryStatus event={event} />} />
                <TicketEventSection events={ticketEvents} isPending={isPending} isError={isError} />
            </div>
            <div className="bg-surface-canvas py-10">
                <div className={CONTAINER}>
                    <TicketBalanceWidget />
                </div>
            </div>
            <div className={`${CONTAINER} flex flex-col gap-20`}>
                <EventCardList
                    title="응모권 없이 참여할 수 있는 이벤트"
                    moreHref="/events"
                    moreLabel="더보기"
                    twoRowsOnly
                    events={freeEvents}
                    isPending={isPending}
                    isError={isError}
                    emptyMessage="현재 응모권 없이 참여할 수 있는 이벤트가 없습니다."
                />
                {resultEvents.length > 0 && (
                    <section className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-subhead text-fg-primary">발표 대기 · 결과</h2>
                            <Link
                                to="/events"
                                className="text-fg-primary text-body-sm flex items-center gap-0.5"
                            >
                                더보기
                                <ChevronRight className="size-5" />
                            </Link>
                        </div>
                        {/* 피그마 홈 — 바깥 테두리 없이 행 사이에만 좌우 16px 들인 구분선, 4개까지 보여주고 나머지는 '더보기' */}
                        <div className="[&>*+*]:before:bg-border-default flex flex-col [&>*+*]:relative [&>*+*]:before:absolute [&>*+*]:before:inset-x-4 [&>*+*]:before:top-0 [&>*+*]:before:h-px">
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
