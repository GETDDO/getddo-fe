import { useState } from 'react';

import type { MyResult, PublicResults } from '@entities/drawResult';
import type { Event } from '@entities/event';

import { LoseBanner } from './LoseBanner';
import { PrizeWinnerCard } from './PrizeWinnerCard';
import { WinnerBanner } from './WinnerBanner';
import { WinnerLookupCard } from './WinnerLookupCard';

/** 발표가 끝났지만 보여 줄 명단이 없는 경우의 안내 — 사유를 구분해 적는다 */
const EMPTY_NOTICE: Record<string, string> = {
    NO_ENTRANTS: '응모한 사람이 없어 추첨을 진행하지 않았어요.',
    // 신규 결과에는 나오지 않는 과거 값 — 사유는 노출하지 않고 당첨자 없음만 안내한다 (ADR-018)
    NO_ELIGIBLE_ENTRANTS: '이번 추첨에는 당첨자가 없어요.',
    CANCELED: '이벤트가 취소되어 당첨자를 발표하지 않아요.',
};

interface DrawResultSectionProps {
    event: Event;
    results: PublicResults;
    /** 본인 결과(E09) — 당첨·낙첨 판정의 유일한 근거다 */
    myResult?: MyResult;
}

export function DrawResultSection({ event, results, myResult }: DrawResultSectionProps) {
    /**
     * 조회한 뒷자리.
     *
     * 뒷자리는 여러 사람이 같을 수 있어 '내가 당첨됐다'의 근거가 되지 못한다.
     * 명단에서 같은 줄을 찾아 주는 용도로만 쓰고, 당첨 여부는 myResult가 판정한다.
     */
    const [mySuffix, setMySuffix] = useState<string | null>(null);

    // 발표 전에는 아무것도 열지 않는다. 예정 시각이 지났다는 사실만으로는 공개하지 않는다
    if (!results.isPublished) return null;

    const notice = EMPTY_NOTICE[results.displayStatus];
    if (notice) {
        return (
            <section className="bg-surface-page border-border-default rounded-2xl border p-8">
                <p className="text-body text-fg-secondary text-center">{notice}</p>
            </section>
        );
    }

    // 서버는 하위 등수부터 연출하도록 내림차순으로 주지만, 화면은 1등을 가장 크게 둔다
    const byRankAsc = [...results.prizes].sort((a, b) => a.rank - b.rank);
    const [topPrize, ...restPrizes] = byRankAsc;
    if (!topPrize) return null;

    return (
        <section className="flex flex-col gap-4">
            {myResult?.result === 'WON' ? (
                <WinnerBanner prize={myResult.prize} />
            ) : myResult?.result === 'LOST' ? (
                <LoseBanner event={event} />
            ) : myResult?.result === 'CANCELED' ? (
                // 이벤트는 정상 발표됐어도 내 응모만 취소될 수 있다 — 그때 조회창을 띄우면 안 된다
                <section className="bg-surface-page border-border-default rounded-2xl border p-8">
                    <p className="text-body text-fg-secondary text-center">
                        {EMPTY_NOTICE.CANCELED}
                    </p>
                </section>
            ) : (
                // 응모하지 않은 사람도 명단을 확인할 수 있어야 한다 — 본인 결과가 없을 때만 연다
                <WinnerLookupCard prizes={byRankAsc} onLookup={setMySuffix} />
            )}

            <PrizeWinnerCard prize={topPrize} mySuffix={mySuffix} highlighted />

            {restPrizes.length > 0 && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {restPrizes.map((prize) => (
                        <PrizeWinnerCard key={prize.prizeId} prize={prize} mySuffix={mySuffix} />
                    ))}
                </div>
            )}

            <EntrySummary event={event} />
        </section>
    );
}

/** 응모한 래플에만 내 참여 현황을 적는다 — 0회·0장은 참여했는데 아무것도 쓰지 않은 것처럼 읽힌다 */
function EntrySummary({ event }: { event: Event }) {
    const entryCount = event.myEntryCount ?? 0;
    if (entryCount === 0) return null;

    const usedTickets = event.myTicketCount ?? entryCount * event.requiredTickets;

    return (
        <dl className="bg-surface-page border-border-default flex flex-col gap-1 rounded-2xl border p-5">
            <StatLine
                label="이번 이벤트 응모 횟수"
                value={`${entryCount.toLocaleString('ko-KR')} 회`}
            />
            <StatLine label="사용된 응모권" value={`${usedTickets.toLocaleString('ko-KR')} 장`} />
        </dl>
    );
}

function StatLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <dt className="text-body text-fg-secondary">{label}</dt>
            <dd className="text-body-bold text-fg-primary">{value}</dd>
        </div>
    );
}
