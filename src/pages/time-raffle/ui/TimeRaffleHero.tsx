import type { ReactNode } from 'react';

import { Clock, Gift, Ticket, UsersRound } from 'lucide-react';

import type { Event } from '@entities/event';

import { formatKst } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/format';

const TIME_ONLY: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
};

interface TimeRaffleHeroProps {
    event: Event;
    /** 하단 CTA — 목록에서는 상세로 보내는 링크, 상세에서는 상태별 응모 버튼이 들어온다 */
    cta: ReactNode;
}

/** 타임래플 대표 카드 — 목록의 최상단과 상세 화면 상단에서 같은 모양으로 쓴다 */
export function TimeRaffleHero({ event, cta }: TimeRaffleHeroProps) {
    const stats = [
        {
            key: 'participants',
            label: '응모자 수',
            value: event.participantCount,
            unit: '명',
            icon: UsersRound,
        },
        {
            key: 'tickets',
            label: '응모권 사용',
            value: event.usedTicketCount,
            unit: '장',
            icon: Ticket,
        },
    ];

    return (
        <article className="bg-surface-page border-border-brand flex min-h-95 items-center gap-5 rounded-2xl border p-4 shadow-md">
            <div className="bg-surface-canvas flex-[0_0_488px] self-stretch overflow-hidden rounded-2xl">
                {event.bannerImageUrl ? (
                    <img src={event.bannerImageUrl} alt="" className="size-full object-cover" />
                ) : (
                    <div className="flex size-full items-center justify-center">
                        <Gift className="text-fg-disabled size-12" />
                    </div>
                )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch px-4 py-5">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <span className="bg-brand-primary text-fg-on-brand text-caption rounded-full px-3 py-1">
                            진행중
                        </span>
                        <span className="bg-surface-sunken text-fg-secondary text-body-sm-bold flex items-center gap-1 rounded-full px-3 py-1">
                            <Clock className="size-4.5" />
                            {formatKst(event.startsAt, TIME_ONLY)} ~{' '}
                            {formatKst(event.endsAt, TIME_ONLY)}
                        </span>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h2 className="text-title-1 text-fg-primary">{event.title}</h2>
                        <p className="text-body text-fg-primary">{event.description}</p>
                    </div>
                </div>

                {/* 응모자 수·응모권 사용 — 실시간 참여 현황은 담당이 따로 있어 디자인대로 값만 보여주고 갱신 로직은 두지 않는다 */}
                <div className="flex gap-3">
                    {stats.map(({ key, label, value, unit, icon: Icon }) => (
                        <div
                            key={key}
                            className="bg-surface-sunken flex flex-1 flex-col gap-1.5 rounded-xl p-4"
                        >
                            <span className="text-caption text-fg-tertiary flex items-center gap-2">
                                <Icon className="size-5" />
                                {label}
                            </span>
                            <span className="text-body-bold text-fg-primary">
                                {value == null ? '-' : `${formatNumber(value)}${unit}`}
                            </span>
                        </div>
                    ))}
                </div>

                {cta}
            </div>
        </article>
    );
}
