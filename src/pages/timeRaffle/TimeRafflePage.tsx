import { Link } from 'react-router-dom';

import { useEventList } from '@entities/event';
import { Button } from '@shared/ui/button';

import { TimeRaffleHero } from './ui/TimeRaffleHero';
import { TimeRaffleSection } from './ui/TimeRaffleSection';
import { TimeRaffleTrustNotice } from './ui/TimeRaffleTrustNotice';

const CONTAINER = 'mx-auto w-full max-w-312 px-6 pt-20 pb-54';

export function TimeRafflePage() {
    const { data: events, isPending, isError } = useEventList();

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
    const openRaffles = raffles.filter((event) => event.status === 'open');
    const upcomingRaffles = raffles.filter((event) => event.status === 'upcoming');
    const closedRaffles = raffles.filter(
        (event) => event.status === 'closed' || event.status === 'drawn',
    );

    // 대표 래플 — 마감이 가장 임박한 진행 중 래플 (ISO 8601 UTC 문자열이라 문자열 비교로 정렬 가능)
    const [featured] = [...openRaffles].sort((a, b) => a.endsAt.localeCompare(b.endsAt));

    return (
        <main className={CONTAINER}>
            <div className="flex flex-col gap-2">
                <h1 className="text-title-1 text-fg-primary">타임래플</h1>
                <p className="text-body text-fg-tertiary">
                    정해진 시간에만 열리는 한정 굿즈 래플입니다. 응모권을 사용해 당첨 기회를
                    높이세요.
                </p>
                {featured && (
                    <TimeRaffleHero
                        event={featured}
                        cta={
                            <Button asChild variant="secondary" className="h-12 w-full">
                                <Link to={`/time-raffle/${featured.id}`}>
                                    <span className="text-body-bold">응모하러 가기</span>
                                </Link>
                            </Button>
                        }
                    />
                )}
            </div>

            <div className="mt-20 flex flex-col gap-20">
                <TimeRaffleSection
                    title="진행 중인 래플"
                    events={openRaffles.filter((event) => event.id !== featured?.id)}
                    emptyMessage="진행 중인 래플이 없습니다."
                />
                <TimeRaffleSection
                    title="오픈 예정인 래플"
                    events={upcomingRaffles}
                    emptyMessage="오픈 예정인 래플이 없습니다."
                />
                <TimeRaffleSection
                    title="마감한 래플"
                    events={closedRaffles}
                    emptyMessage="마감한 래플이 없습니다."
                />
            </div>

            <div className="mt-20">
                <TimeRaffleTrustNotice />
            </div>
        </main>
    );
}
