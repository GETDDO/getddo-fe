import { Gift } from 'lucide-react';

import type { PublicResults, PublishedPrize } from '@entities/drawResult';
import type { Event } from '@entities/event';

import { formatNumber } from '@shared/lib/format';

import { WinnerLookupCard } from './WinnerLookupCard';

/** 발표가 끝났지만 보여 줄 명단이 없는 경우의 안내 — 사유를 구분해 적는다 */
const EMPTY_NOTICE: Record<string, string> = {
    NO_ENTRANTS: '응모한 사람이 없어 추첨을 진행하지 않았어요.',
    NO_ELIGIBLE_ENTRANTS: '추첨 대상 조건을 만족한 응모가 없어 당첨자가 없어요.',
    CANCELED: '이벤트가 취소되어 당첨자를 발표하지 않아요.',
};

interface DrawResultSectionProps {
    event: Event;
    results: PublicResults;
}

export function DrawResultSection({ event, results }: DrawResultSectionProps) {
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
            <TopPrizeCard event={event} prize={topPrize} />

            {restPrizes.length > 0 && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {restPrizes.map((prize) => (
                        <PrizeCard key={prize.prizeId} prize={prize} />
                    ))}
                </div>
            )}

            <WinnerLookupCard prizes={byRankAsc} />
        </section>
    );
}

/** 1등 카드 — 상품 이미지와 당첨자를 크게 두고, 응모한 래플이면 내 현황을 함께 보여 준다 */
function TopPrizeCard({ event, prize }: { event: Event; prize: PublishedPrize }) {
    const winner = prize.winners[0];
    const entryCount = event.myEntryCount ?? 0;
    const usedTickets = event.myTicketCount ?? entryCount * event.requiredTickets;
    // 응모하지 않은 래플에 '0회 · 0장'을 적으면 참여했는데 아무것도 쓰지 않은 것처럼 읽힌다
    const entered = entryCount > 0;

    return (
        <article className="bg-ticket-accent border-ticket-primary flex flex-col gap-5 rounded-2xl border-2 p-5 sm:flex-row">
            <div className="bg-surface-page/60 h-40 w-full shrink-0 overflow-hidden rounded-xl sm:size-50">
                {event.bannerImageUrl ? (
                    <img
                        src={event.bannerImageUrl}
                        alt=""
                        loading="lazy"
                        className="size-full object-contain"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center">
                        <Gift className="text-fg-disabled size-10" />
                    </div>
                )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                    <RankChip rank={prize.rank} highlighted />
                    <p className="text-subhead text-fg-primary">
                        {formatNumber(prize.winnerCount)}명
                    </p>
                </div>

                {/* 1등이 여러 명인 래플도 있어, 한 명만 적어 두면 나머지가 없는 것처럼 보인다 */}
                <p className="text-title-1 text-fg-primary truncate">
                    {winner
                        ? `${winner.maskedName}님${
                              prize.winnerCount > 1
                                  ? ` 외 ${formatNumber(prize.winnerCount - 1)}명`
                                  : ''
                          }`
                        : '당첨자 없음'}
                </p>

                <p className="text-title-3 text-fg-primary truncate">{prize.name}</p>

                {entered && (
                    <dl className="flex flex-col gap-1">
                        <StatLine
                            label="이번 이벤트 응모 횟수"
                            value={`${formatNumber(entryCount)} 회`}
                        />
                        <StatLine label="사용된 응모권" value={`${formatNumber(usedTickets)} 장`} />
                    </dl>
                )}
            </div>
        </article>
    );
}

function PrizeCard({ prize }: { prize: PublishedPrize }) {
    return (
        <article className="bg-surface-page border-border-default flex flex-col gap-4 rounded-2xl border p-5">
            <div className="flex items-center justify-between gap-4">
                <RankChip rank={prize.rank} />
                <p className="text-subhead text-fg-primary">{formatNumber(prize.winnerCount)}명</p>
            </div>

            <p className="text-title-3 text-fg-primary truncate">{prize.name}</p>

            {/*
             * 당첨자가 수십 명인 등수가 있어 전부 펼치면 카드 하나가 화면을 넘긴다.
             * 다섯 줄쯤 보이는 높이로 잘라 카드 안에서만 굴린다 — 등수끼리 높이도 맞는다.
             */}
            <ul
                // 스크롤 영역은 키보드로도 굴릴 수 있어야 한다
                tabIndex={0}
                aria-label={`${prize.rank}등 당첨자 명단`}
                className="focus-visible:ring-border-focus flex max-h-55 flex-col gap-2 overflow-y-auto focus-visible:ring-2 focus-visible:outline-none"
            >
                {prize.winners.map((winner, index) => (
                    <li
                        // 마스킹된 이름·뒷자리는 서로 겹칠 수 있고 응답에 당첨자 식별자가 없다.
                        // 명단은 다시 정렬되지 않으므로 순번을 키에 쓴다
                        key={`${prize.prizeId}-${index}`}
                        className="bg-surface-canvas flex shrink-0 items-center justify-between rounded-lg px-4 py-2"
                    >
                        <span className="text-caption text-fg-secondary">{winner.maskedName}</span>
                        <span className="text-body-sm-bold text-fg-secondary tabular-nums">
                            {winner.maskedPhoneNum ?? '-'}
                        </span>
                    </li>
                ))}
            </ul>

            {prize.unfilledCount > 0 && (
                <p className="text-caption text-fg-tertiary">
                    응모자가 모자라 {formatNumber(prize.unfilledCount)}자리는 채우지 못했어요.
                </p>
            )}
        </article>
    );
}

function RankChip({ rank, highlighted = false }: { rank: number; highlighted?: boolean }) {
    return (
        <span
            className={
                highlighted
                    ? 'bg-ticket-primary text-body-sm-bold text-fg-primary rounded-full px-3 py-1'
                    : 'bg-surface-sunken border-border-strong text-body-sm-bold text-fg-primary rounded-full border px-3 py-1'
            }
        >
            {rank}등
        </span>
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
