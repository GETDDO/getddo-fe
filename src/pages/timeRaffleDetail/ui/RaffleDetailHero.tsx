import type { ReactNode } from 'react';

import { Clock, Gift, Ticket, UsersRound } from 'lucide-react';

import type { Event } from '@entities/event';

import { useEntryStatistics } from '@entities/entry';
import { KST_HOUR_MINUTE, formatKst } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/format';

const CHIP = 'text-caption bg-surface-sunken flex items-center gap-2.5 rounded-full px-3 py-1';

/**
 * 히어로 상단 상태 칩.
 *
 * 마감·발표 완료 래플도 목록에서 상세로 들어올 수 있으므로 '진행중'으로 고정할 수 없다.
 * 강조는 지금 응모할 수 있는 래플에만 둔다 — 끝난 래플까지 핑크로 띄우면 위계가 사라진다.
 */
const STATUS_CHIP: Record<Event['status'], { label: string; emphasized: boolean }> = {
    open: { label: '진행중', emphasized: true },
    upcoming: { label: '오픈 예정', emphasized: false },
    closed: { label: '발표 대기', emphasized: false },
    drawn: { label: '발표 완료', emphasized: false },
};

interface RaffleDetailHeroProps {
    event: Event;
    /** 응모 수량 스테퍼 — 진행 중일 때만 노출한다 */
    quantityControl?: ReactNode;
    cta: ReactNode;
}

/** 상세 화면 대표 카드 — 목록 히어로와 달리 이미지가 카드에 꽉 차고, 현황은 칩으로 줄어든다 */
export function RaffleDetailHero({ event, quantityControl, cta }: RaffleDetailHeroProps) {
    // 응모 현황은 E03 전용 조회로 받는다 — 진행 중일 때만 30초 폴링 (ADR-0007)
    const { data: statistics } = useEntryStatistics(event.id, { isOpen: event.status === 'open' });

    return (
        <article className="bg-surface-page flex flex-col overflow-hidden rounded-2xl lg:min-h-95 lg:flex-row lg:gap-5">
            {/* 상품 이미지 — 그림 크기가 카드 높이를 바꾸지 않게 칸을 채워 담는다. 발표까지 남은 시간은 아래 발표 대기 카드가 늘 보여 준다 */}
            <div className="bg-surface-canvas relative h-48 w-full shrink-0 self-stretch overflow-hidden rounded-2xl lg:h-auto lg:w-130">
                {event.bannerImageUrl ? (
                    <img
                        src={event.bannerImageUrl}
                        alt=""
                        className="absolute inset-0 size-full object-contain p-6 mix-blend-multiply dark:mix-blend-normal"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center">
                        <Gift className="text-fg-disabled size-12" />
                    </div>
                )}
            </div>

            {/* 피그마 시안처럼 글은 위에서부터 쌓고, 수량·버튼은 아래쪽에 붙인다 */}
            <div className="flex min-w-0 flex-1 flex-col gap-5 px-4 py-5">
                <div className="flex flex-col gap-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={
                                STATUS_CHIP[event.status].emphasized
                                    ? 'bg-brand-primary text-fg-on-brand text-caption rounded-full px-3 py-1'
                                    : 'bg-surface-sunken text-fg-secondary text-caption rounded-full px-3 py-1'
                            }
                        >
                            {STATUS_CHIP[event.status].label}
                        </span>
                        {/* 시간 칩도 옆 칩들과 같은 글자(caption)·아이콘 크기를 쓴다 */}
                        <span className={`${CHIP} text-fg-primary`}>
                            <Clock className="size-5" />
                            {formatKst(event.startsAt, KST_HOUR_MINUTE)} ~{' '}
                            {formatKst(event.endsAt, KST_HOUR_MINUTE)}
                        </span>
                        {statistics && (
                            <>
                                <span className={`${CHIP} text-fg-primary`}>
                                    <UsersRound className="size-5" />
                                    {formatNumber(statistics.participantCount)}명 참여 중
                                </span>
                                <span className={`${CHIP} text-fg-primary`}>
                                    <Ticket className="size-5" />
                                    {formatNumber(statistics.totalSpentTicketCount)}장 사용
                                </span>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        <h2 className="text-title-1 text-fg-primary">{event.title}</h2>
                        <p className="text-body text-fg-primary">{event.description}</p>
                    </div>
                </div>

                {/* 구분선·수량·버튼은 카드 아래쪽에 붙인다 — 상태가 달라 위 글 길이가 달라도 버튼 위치는 늘 같다 */}
                {(quantityControl || cta) && (
                    <div className="mt-auto flex flex-col gap-5">
                        <hr className="border-border-default" />
                        {quantityControl}
                        {cta}
                    </div>
                )}
            </div>
        </article>
    );
}
