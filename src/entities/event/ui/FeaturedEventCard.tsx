import { Clock, Gift, Ticket, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import { formatKst } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';

import type { Event } from '../model/types';

const TIME_ONLY: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
};

/** 홈 '타임 래플 · 응모권 사용' 섹션의 대표 진행 이벤트 카드 — 마감이 가장 임박한 open 이벤트 1개를 크게 노출한다 */
export function FeaturedEventCard({ event }: { event: Event }) {
    const stats = [
        {
            key: 'participants',
            label: '총 참여자',
            value: event.participantCount,
            unit: '명',
            icon: UsersRound,
            accent: false,
        },
        {
            key: 'tickets',
            label: '사용된 응모권',
            value: event.usedTicketCount,
            unit: '장',
            icon: Ticket,
            accent: false,
        },
        {
            key: 'mine',
            label: '내 응모',
            value: event.myEntryCount,
            unit: '장',
            icon: Ticket,
            accent: true,
        },
    ].filter((stat) => stat.value != null && stat.value > 0);

    return (
        <Card className="bg-surface-page ring-border-brand flex-row gap-0 py-0 ring-2">
            <div className="flex flex-1 flex-col gap-3 p-4 sm:p-6">
                <div className="flex items-center gap-2">
                    <span className="bg-brand-primary text-fg-on-brand text-caption rounded-sm px-2 py-0.5">
                        모집중
                    </span>
                    <span className="bg-surface-sunken text-fg-secondary text-caption flex items-center gap-1 rounded-full px-2.5 py-1">
                        <Clock className="size-3.5" />
                        {formatKst(event.startsAt, TIME_ONLY)} ~{' '}
                        {formatKst(event.endsAt, TIME_ONLY)}
                    </span>
                </div>
                <div className="flex flex-col gap-1">
                    <p className="text-subhead text-fg-primary">
                        {event.title} ({event.winnerCount}명)
                    </p>
                    <p className="text-body-sm text-fg-tertiary">{event.description}</p>
                </div>
                {stats.length > 0 && (
                    <div className="mt-auto flex gap-6">
                        {stats.map(({ key, label, value, unit, icon: Icon, accent }) => (
                            <div key={key} className="flex flex-col gap-0.5">
                                <span className="text-caption text-fg-tertiary flex items-center gap-1">
                                    <Icon className="size-3.5" />
                                    {label}
                                </span>
                                <span
                                    className={
                                        accent
                                            ? 'text-body-sm-bold text-fg-brand'
                                            : 'text-body-sm-bold text-fg-primary'
                                    }
                                >
                                    {formatNumber(value!)}
                                    {unit}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex w-36 shrink-0 flex-col gap-3 p-3 sm:w-44">
                {event.bannerImageUrl ? (
                    <img
                        src={event.bannerImageUrl}
                        alt=""
                        className="min-h-0 flex-1 rounded-lg object-cover"
                    />
                ) : (
                    <div className="bg-surface-sunken flex min-h-0 flex-1 items-center justify-center rounded-lg">
                        <Gift className="text-fg-disabled size-8" />
                    </div>
                )}
                <Button asChild variant="secondary" className="w-full">
                    <Link to={`/events/${event.id}`}>응모하러 가기</Link>
                </Button>
            </div>
        </Card>
    );
}
