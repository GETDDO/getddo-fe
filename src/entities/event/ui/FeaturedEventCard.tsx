import { Clock, Gift, Ticket, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import { formatKst } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/format';
import { Badge } from '@shared/ui/badge';
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
        // 피그마 홈 — brand 테두리 1px·그림자, 왼쪽 정보 / 오른쪽 이미지·버튼(250)
        <Card className="border-border-brand flex-col gap-4 p-4 sm:flex-row">
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-6">
                <div className="flex flex-col gap-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="brand" size="md">
                            진행중
                        </Badge>
                        <Badge variant="neutral" size="lg">
                            <Clock className="size-4.5" />
                            {formatKst(event.startsAt, TIME_ONLY)} ~{' '}
                            {formatKst(event.endsAt, TIME_ONLY)}
                        </Badge>
                    </div>
                    <div className="flex flex-col gap-3">
                        <p className="text-title-2 text-fg-primary">
                            {event.title}{' '}
                            <span className="text-fg-tertiary">({event.winnerCount}명)</span>
                        </p>
                        <p className="text-body text-fg-primary line-clamp-2">
                            {event.description}
                        </p>
                    </div>
                </div>
                {stats.length > 0 && (
                    <div className="flex flex-wrap items-center gap-4">
                        {stats.map(({ key, label, value, unit, icon: Icon, accent }, index) => (
                            <div key={key} className="flex items-center gap-2">
                                {/* 내 응모는 아이콘 없이 앞 칸과 짧은 세로선으로 구분한다 (피그마) */}
                                {accent && index > 0 ? (
                                    <span
                                        aria-hidden
                                        className="bg-border-default -ml-2 h-9 w-px"
                                    />
                                ) : (
                                    <Icon aria-hidden className="text-fg-primary size-6" />
                                )}
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-caption text-fg-tertiary">{label}</span>
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
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex w-full shrink-0 flex-col gap-5 sm:w-62.5">
                {event.bannerImageUrl ? (
                    <img
                        src={event.bannerImageUrl}
                        alt=""
                        className="h-46.5 w-full rounded-2xl object-cover"
                    />
                ) : (
                    <div className="bg-surface-canvas flex h-46.5 items-center justify-center rounded-2xl">
                        <Gift className="text-fg-disabled size-8" />
                    </div>
                )}
                <Button asChild size="lg" className="w-full">
                    <Link to={`/events/${event.id}`}>응모하러 가기</Link>
                </Button>
            </div>
        </Card>
    );
}
