import { useEffect, useState } from 'react';

import type { Event } from '@entities/event';

import shopCounter from '@shared/assets/shop/shop-counter.jpg';
import shopWall from '@shared/assets/shop/shop-wall.jpg';
import { KST_HOUR_MINUTE, formatKst } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/format';
import { useVirtualClock } from '@shared/lib/virtualClock';
import { StepTile } from '@shared/ui/step-tile';
import { TicketWallet } from '@widgets/ticketWallet';

import itemGift from '../assets/item-gift.webp';
import itemGumball from '../assets/item-gumball.webp';
import itemTickets from '../assets/item-tickets.webp';
import { kstDateHeadline } from '../lib/raffleFormat';
import { RAFFLE_SECTION_IDS } from '../model/sectionIds';

interface TimeRaffleHeroProps {
    live: Event[];
    upcoming: Event[];
    /** 마감했거나 발표까지 끝난 래플 — '오늘 발표' 집계에 쓴다 */
    closed: Event[];
    now: Date;
    /** 진행 칸을 눌렀을 때 — 지금 보이는 내용 칸에 그 섹션이 없으면 페이지가 칸을 바꾼 뒤 내려간다 */
    onSelectSection: (targetId: string) => void;
}

/**
 * 겟또타임 머리 — 오늘 무엇을 할 수 있는지 한 줄로 알려 주고 응모권 잔액을 함께 둔다.
 * 미션 "오늘의 적립"과 같은 틀이다 — 진행 칸(누르면 해당 섹션으로)과 같은 응모권 지갑(바로가기만 "응모권 모으러 가기").
 *
 * 래플은 시간이 지나면 사라지는 화면이라 '지금 몇 개가 열려 있는지'가 제목이어야 한다.
 * 응모권을 보려고 마이페이지로 나갔다 오지 않도록 잔액도 같은 줄에 둔다.
 */
export function TimeRaffleHero({
    live,
    upcoming,
    closed,
    now,
    onSelectSection,
}: TimeRaffleHeroProps) {
    return (
        <section
            aria-labelledby="time-raffle-title"
            // 미션 페이지 "오늘의 적립"과 같은 가게 — 벽(image 197)을 깔고 아래에 카운터 띠(image 211)를 둔다. --counter는 카운터 띠 높이
            className="force-light bg-play-yellow-soft relative overflow-hidden rounded-3xl bg-cover bg-top [--counter:clamp(4.5rem,8vw,6rem)]"
            style={{ backgroundImage: `url(${shopWall})` }}
        >
            {/* 벽 그림이 어두운 웜톤이라 흰 막을 얇게 덮어 페이지 바탕과 어울리게 밝힌다 */}
            <div aria-hidden className="bg-surface-page/45 absolute inset-0" />
            {/* 카운터 띠 — 이음매 없이 이어지도록 자른 타일·상판·나무를 가로로 반복한다 */}
            <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-(--counter) bg-size-[auto_100%] bg-left bg-repeat-x"
                style={{ backgroundImage: `url(${shopCounter})` }}
            />
            {/* 카운터 위 소품(image 221 픽셀 소품) — 왼쪽 끝 응모권·선물 상자(둘 다 좌우를 뒤집어 안쪽을 보게 한다), 오른쪽 끝 뽑기 기계.
                뽑기 기계 꼭대기(0.6+0.9배)도 내용 아래 여백(--counter의 1.5배) 안에 들어와 내용을 가리지 않는다 */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-3 bottom-[calc(var(--counter)*0.6)] flex items-end justify-between md:inset-x-5"
            >
                <div className="flex items-end gap-1">
                    <img
                        src={itemTickets}
                        alt=""
                        className="h-[calc(var(--counter)*0.5)] w-auto -scale-x-100"
                    />
                    <img
                        src={itemGift}
                        alt=""
                        className="hidden h-[calc(var(--counter)*0.65)] w-auto -scale-x-100 sm:block"
                    />
                </div>
                <img src={itemGumball} alt="" className="h-[calc(var(--counter)*0.9)] w-auto" />
            </div>

            {/* 왼쪽 진행 칸과 오른쪽 지갑의 아래 끝을 맞춘다 — 가운데 맞춤이면 높이 차이만큼 5px 어긋났다 */}
            <div className="relative grid items-end gap-8 p-6 pb-[calc(var(--counter)*1.5+0.5rem)] md:p-10 md:pb-[calc(var(--counter)*1.5+0.5rem)] lg:grid-cols-[1fr_22rem]">
                <div className="flex min-w-0 flex-col">
                    <p className="text-body-sm-bold text-fg-secondary">
                        {kstDateHeadline(now)} · 겟또타임
                    </p>
                    <h1
                        id="time-raffle-title"
                        className="text-title-1 text-fg-primary mt-2 break-keep"
                    >
                        {live.length > 0 ? (
                            <>
                                지금 응모할 수 있는 래플{' '}
                                <span className="text-display text-fg-primary tabular-nums">
                                    {formatNumber(live.length)}개
                                </span>
                            </>
                        ) : (
                            '지금 열린 래플이 없어요'
                        )}
                    </h1>
                    <p className="text-body text-fg-secondary mt-2 break-keep">
                        마감 직후 바로 추첨해요. 응모권을 많이 쓸수록 당첨 기회가 커져요.
                    </p>

                    {/* 좁은 화면에서도 세 칸을 가로로 둔다 — 세로로 쌓으면 머리가 화면을 다 차지한다 */}
                    <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
                        <StepCard
                            label="진행 중"
                            live
                            count={live.length}
                            targetId={RAFFLE_SECTION_IDS.live}
                            onSelect={onSelectSection}
                            hint={
                                live[0]
                                    ? `가장 빠른 마감 ${formatKst(live[0].endsAt, KST_HOUR_MINUTE)}`
                                    : '열린 래플 없음'
                            }
                        />
                        <StepCard
                            label="오픈 예정"
                            count={upcoming.length}
                            targetId={RAFFLE_SECTION_IDS.upcoming}
                            onSelect={onSelectSection}
                            hint={
                                upcoming[0]
                                    ? `다음 오픈 ${formatKst(upcoming[0].startsAt, KST_HOUR_MINUTE)}`
                                    : '예정된 래플 없음'
                            }
                        />
                        <AnnouncementStep closed={closed} onSelect={onSelectSection} />
                    </div>
                </div>

                <TicketWallet now={now} action={{ to: '/missions', label: '응모권 모으러 가기' }} />
            </div>
        </section>
    );
}

/** 발표 예정 시각을 지났는지 판정하려면 흘러가는 시각이 필요하다 — 분 단위면 충분하다 */
const ANNOUNCE_TICK_MS = 30 * 1000;

function useTickingNow(): Date {
    const { now } = useVirtualClock();
    const [value, setValue] = useState(() => now());

    useEffect(() => {
        const update = () => setValue(now());
        // 가상 시계를 옮기면 now가 새로 내려온다 — 다음 주기를 기다리지 않고 바로 맞춘다
        update();
        const id = setInterval(update, ANNOUNCE_TICK_MS);
        return () => clearInterval(id);
    }, [now]);

    return value;
}

/** 진행 칸 하나 — 개수와 다음 시각 한 줄. 미션과 달리 아이콘 없이 숫자만 둔다. 진행 중은 "지금" 신호로 마젠타 점을 붙인다 */
function StepCard({
    label,
    count,
    hint,
    targetId,
    onSelect,
    live = false,
}: {
    label: string;
    count: number;
    hint: string;
    targetId: string;
    onSelect: (targetId: string) => void;
    live?: boolean;
}) {
    return (
        <StepTile
            label={label}
            labelPrefix={
                live ? <span className="bg-brand-primary size-1.5 rounded-full" /> : undefined
            }
            value={`${formatNumber(count)}개`}
            hint={hint}
            targetId={targetId}
            onSelect={onSelect}
        />
    );
}

/**
 * 오늘 발표되는 래플 수.
 *
 * 발표 예정 시각이 오늘인 래플을 센다. 예정 시각은 '원래 예정'이라 실제 공개는 늦을 수 있으므로
 * 아직 발표되지 않은 것 중 가장 이른 시각만 알려 주고, 새 시각을 약속하지 않는다.
 */
function AnnouncementStep({
    closed,
    onSelect,
}: {
    closed: Event[];
    onSelect: (targetId: string) => void;
}) {
    // 마운트 시각으로 고정하면 가상 시계가 자정을 넘기거나 화면을 오래 열어 둘 때 '오늘'이 어긋난다
    const now = useTickingNow();

    const today = closed.filter(
        (event) =>
            event.publicationScheduledAt != null &&
            formatKst(event.publicationScheduledAt, { dateStyle: 'short' }) ===
                formatKst(now, { dateStyle: 'short' }),
    );
    // 예정 시각이 이미 지났는데 아직 발표되지 않은 건은 '몇 시 발표'로 적을 수 없다 —
    // 그 시각은 틀린 약속이고, 새 시각을 임의로 만들지 않는다 (05-api/drawing.md)
    const waiting = today
        .filter(
            (event) =>
                event.status !== 'drawn' &&
                new Date(event.publicationScheduledAt ?? 0).getTime() > now.getTime(),
        )
        .sort(
            (a, b) =>
                new Date(a.publicationScheduledAt ?? 0).getTime() -
                new Date(b.publicationScheduledAt ?? 0).getTime(),
        );
    const next = waiting[0];

    return (
        <StepCard
            label="오늘 발표"
            count={today.length}
            targetId={RAFFLE_SECTION_IDS.closed}
            onSelect={onSelect}
            hint={
                next?.publicationScheduledAt
                    ? `${formatNumber(waiting.length)}개는 ${formatKst(next.publicationScheduledAt, KST_HOUR_MINUTE)} 발표`
                    : today.length > 0
                      ? '모두 발표 완료'
                      : '오늘 발표 없음'
            }
        />
    );
}
