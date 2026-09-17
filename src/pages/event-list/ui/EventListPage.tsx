import { EventCard, useEventList } from '@entities/event';

export function EventListPage() {
    const { data: events, isPending, isError } = useEventList();

    return (
        <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
            <h1 className="text-2xl font-bold">진행 중인 이벤트</h1>
            {isPending && <p className="text-muted-foreground">불러오는 중…</p>}
            {isError && <p className="text-destructive">이벤트 목록을 불러오지 못했습니다.</p>}
            {events?.map((event) => (
                <EventCard key={event.id} event={event} />
            ))}
        </main>
    );
}
