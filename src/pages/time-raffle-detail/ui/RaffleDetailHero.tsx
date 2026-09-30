import type { ReactNode } from 'react';

import { Clock, Gift, Ticket, UsersRound } from 'lucide-react';

import type { Event } from '@entities/event';

import { KST_HOUR_MINUTE, formatKst } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/format';

import { AnnounceCountdown } from './AnnounceCountdown';

const CHIP = 'text-caption bg-surface-sunken flex items-center gap-2.5 rounded-full px-3 py-1';

interface RaffleDetailHeroProps {
    event: Event;
    /** 응모 수량 스테퍼 — 진행 중일 때만 노출한다 */
    quantityControl?: ReactNode;
    cta: ReactNode;
}

/** 상세 화면 대표 카드 — 목록 히어로와 달리 이미지가 카드에 꽉 차고, 현황은 칩으로 줄어든다 */
export function RaffleDetailHero({ event, quantityControl, cta }: RaffleDetailHeroProps) {
    return (
        <article className="bg-surface-page border-border-brand flex flex-col items-center overflow-hidden rounded-2xl border lg:min-h-95 lg:flex-row lg:gap-5">
            {/* 마우스를 올리거나 키보드로 포커스하면 발표까지 남은 시간이 덮인다 */}
            <div
                tabIndex={0}
                role="group"
                aria-label="상품 이미지 — 당첨자 발표까지 남은 시간"
                className="bg-surface-canvas focus-visible:ring-border-focus group relative h-48 w-full self-stretch focus-visible:ring-2 focus-visible:outline-none lg:h-auto lg:w-130 lg:shrink-0"
            >
                {event.bannerImageUrl ? (
                    <img src={event.bannerImageUrl} alt="" className="size-full object-cover" />
                ) : (
                    <div className="flex size-full items-center justify-center">
                        <Gift className="text-fg-disabled size-12" />
                    </div>
                )}
                <div className="bg-surface-overlay pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <AnnounceCountdown event={event} />
                </div>
            </div>

            <div className="flex h-full min-w-0 flex-1 flex-col justify-between gap-5 px-4 py-5">
                <div className="flex flex-col gap-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-brand-primary text-fg-on-brand text-caption rounded-full px-3 py-1">
                            진행중
                        </span>
                        <span className="bg-surface-sunken text-fg-secondary text-body-sm-bold flex items-center gap-1 rounded-full px-3 py-1">
                            <Clock className="size-4.5" />
                            {formatKst(event.startsAt, KST_HOUR_MINUTE)} ~{' '}
                            {formatKst(event.endsAt, KST_HOUR_MINUTE)}
                        </span>
                        {/* 참여 현황은 담당 범위가 달라 디자인대로 값만 보여주고 갱신 로직은 두지 않는다 */}
                        {event.participantCount != null && (
                            <span className={`${CHIP} text-fg-primary`}>
                                <UsersRound className="size-5" />
                                {formatNumber(event.participantCount)}명 참여 중
                            </span>
                        )}
                        {event.usedTicketCount != null && (
                            <span className={`${CHIP} text-fg-primary`}>
                                <Ticket className="size-5" />
                                {formatNumber(event.usedTicketCount)}장 사용
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        <h2 className="text-title-1 text-fg-primary">{event.title}</h2>
                        <p className="text-body text-fg-primary">{event.description}</p>
                    </div>
                </div>

                <hr className="border-border-default" />

                {quantityControl}

                {cta}
            </div>
        </article>
    );
}
