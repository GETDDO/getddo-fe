import { useState } from 'react';

import { useEventList } from '@entities/event';
import { useVirtualClock } from '@shared/lib/virtualClock';

import { ClosedRaffleList } from './ui/ClosedRaffleList';
import { LiveRaffleSection } from './ui/LiveRaffleSection';
import { TimeRaffleTrustNotice } from './ui/TimeRaffleTrustNotice';
import { UpcomingRaffleCard } from './ui/UpcomingRaffleCard';

const CONTAINER = 'mx-auto w-full max-w-312 px-6 pt-20 pb-54';

/** ADR-010 — 가중치 적용 이벤트는 사용자·이벤트별 누적 5장까지만 쓸 수 있다 */
const ENTRY_TICKET_LIMIT = 5;

export function TimeRafflePage() {
    const { data: events, isPending, isError, dataUpdatedAt } = useEventList();
    const clock = useVirtualClock();
    // 날짜 머리말('오늘/어제') 표기 전용이라 마운트 시각으로 충분하다 — 마감 판정에는 쓰지 않는다
    const [now] = useState(() => clock.now());

    if (isPending) {
        return (
            <main className={CONTAINER}>
                <p className="text-fg-tertiary text-body-sm">불러오는 중…</p>
            </main>
        );
    }

    if (isError) {
        return (
            <main className={CONTAINER}>
                <p className="text-destructive text-body-sm">래플을 불러오지 못했습니다.</p>
            </main>
        );
    }

    const raffles = events.filter((event) => event.isTimeRaffle);
    const liveRaffles = raffles.filter((event) => event.status === 'open');
    const upcomingRaffles = raffles.filter((event) => event.status === 'upcoming');
    // 마감 이후는 한 목록에 두되 줄마다 발표 대기·발표 완료를 적는다 (시안 '마감한 래플')
    const closedRaffles = raffles.filter(
        (event) => event.status === 'closed' || event.status === 'drawn',
    );

    // 마감이 임박한 래플을 먼저 보여 준다.
    // 같은 시각을 소수점 자리수만 다르게 받으면 문자열 비교가 어긋나므로 시각으로 비교한다
    const byEndsAtAsc = [...liveRaffles].sort(
        (a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime(),
    );
    const byOpensAtAsc = [...upcomingRaffles].sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
    // 마감 목록은 최근에 끝난 것이 위로 온다
    const byEndsAtDesc = [...closedRaffles].sort(
        (a, b) => new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime(),
    );

    return (
        <main className={CONTAINER}>
            <div className="flex flex-col gap-18">
                <div className="flex flex-col gap-2">
                    <h1 className="text-title-1 text-fg-primary">겟또타임</h1>
                    <p className="text-body-sm text-fg-tertiary">
                        정해진 시간에만 열리는 응모예요. 응모권을 쓸수록 당첨 기회가 높아져요.
                    </p>
                </div>

                <LiveRaffleSection events={byEndsAtAsc} updatedAt={dataUpdatedAt} />

                <section className="flex flex-col gap-5">
                    <h2 className="text-title-3 text-fg-primary">오픈 예정</h2>
                    {byOpensAtAsc.length === 0 ? (
                        <p className="text-body-sm text-fg-tertiary">오픈 예정인 래플이 없어요.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {byOpensAtAsc.map((event) => (
                                <UpcomingRaffleCard
                                    key={event.id}
                                    event={event}
                                    now={now}
                                    ticketLimit={ENTRY_TICKET_LIMIT}
                                />
                            ))}
                        </div>
                    )}
                </section>

                <ClosedRaffleList events={byEndsAtDesc} now={now} />

                <TimeRaffleTrustNotice />
            </div>
        </main>
    );
}
