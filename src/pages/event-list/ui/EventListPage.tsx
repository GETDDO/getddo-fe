import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import type { Event } from '@entities/event';

import { useEventList } from '@entities/event';
import { cn } from '@shared/lib/utils';

import type { EventFilter } from '../model/event-filters';

import { EVENT_FILTERS, PAGE_SIZE } from '../model/event-filters';
import { EventListCard } from './EventListCard';
import { EventPagination } from './EventPagination';

function EventGrid({ events }: { events: Event[] }) {
    return (
        <div className="grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {events.map((event) => (
                <EventListCard key={event.id} event={event} />
            ))}
        </div>
    );
}

export function EventListPage() {
    const { data: events, isPending, isError } = useEventList();
    const [filter, setFilter] = useState<EventFilter>('전체');
    const [page, setPage] = useState(1);

    const openEvents = (events ?? []).filter((event) => event.status === 'open');
    // 응모권을 차감해 응모하는 이벤트와 응모권 없이 참여하는 이벤트를 나눠 보여준다
    const ticketEvents = openEvents.filter((event) => event.requiredTickets > 0);
    const freeEvents = openEvents.filter((event) => event.requiredTickets === 0);
    // 최신순 = 시작일 내림차순 (ISO 8601 UTC 문자열이라 문자열 비교로 정렬 가능)
    const filteredEvents = freeEvents
        .filter((event) => filter === '전체' || (event.tags ?? []).includes(filter))
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
    const pagedEvents = filteredEvents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const status = isPending ? (
        <p className="text-fg-tertiary text-body-sm">불러오는 중…</p>
    ) : isError ? (
        <p className="text-destructive text-body-sm">이벤트 목록을 불러오지 못했습니다.</p>
    ) : null;

    return (
        <main className="mx-auto flex w-full max-w-300 flex-col px-6 pt-20 pb-28">
            <h1 className="text-title-1 text-fg-primary">진행 중 이벤트</h1>

            <section className="mt-10 flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-subhead text-fg-primary">응모권 이벤트</h2>
                    <p className="text-body-sm text-fg-tertiary">모은 응모권을 사용해 응모해요</p>
                </div>
                {status}
                {!isPending && !isError && ticketEvents.length === 0 && (
                    <p className="text-fg-tertiary text-body-sm">
                        진행 중인 응모권 이벤트가 없습니다.
                    </p>
                )}
                {ticketEvents.length > 0 && <EventGrid events={ticketEvents} />}
            </section>

            <hr className="border-border-default my-20" />

            <section className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-subhead text-fg-primary">무료 응모 이벤트</h2>
                    <p className="text-body-sm text-fg-tertiary">응모권 없이 참여할 수 있어요</p>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        {EVENT_FILTERS.map((item) => (
                            <button
                                key={item}
                                type="button"
                                aria-pressed={item === filter}
                                onClick={() => {
                                    setFilter(item);
                                    setPage(1);
                                }}
                                className={cn(
                                    'bg-surface-page text-caption rounded-full border px-3 py-1',
                                    item === filter
                                        ? 'border-brand-primary text-brand-primary'
                                        : 'border-border-strong text-fg-tertiary',
                                )}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                    <span className="text-body-sm text-fg-secondary flex shrink-0 items-center gap-1">
                        최신순
                        <ChevronDown className="size-5" />
                    </span>
                </div>
                {status}
                {!isPending && !isError && pagedEvents.length === 0 && (
                    <p className="text-fg-tertiary text-body-sm">표시할 이벤트가 없습니다.</p>
                )}
                {pagedEvents.length > 0 && (
                    <div className="flex flex-col gap-10">
                        <EventGrid events={pagedEvents} />
                        <EventPagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </section>
        </main>
    );
}
