import { toast } from 'sonner';

import type { Event } from '@entities/event';

import { Button } from '@shared/ui/button';

import { formatEntryRule, formatOpenChip } from '../lib/raffleFormat';
import { RaffleThumbnail } from './RaffleThumbnail';

interface UpcomingRaffleCardProps {
    event: Event;
    now: Date;
    /** ADR-010 누적 한도 — 여러 장 응모가 가능한지 판단한다 */
    ticketLimit: number;
}

export function UpcomingRaffleCard({ event, now, ticketLimit }: UpcomingRaffleCardProps) {
    return (
        <article className="bg-surface-elevated border-border-default flex flex-col gap-4 rounded-2xl border p-5 shadow-md">
            <RaffleThumbnail src={event.bannerImageUrl} className="h-39 w-full rounded-xl" />

            <div className="flex flex-col gap-2">
                <span className="bg-surface-sunken text-caption text-fg-secondary w-fit rounded-full px-2.5 py-1">
                    {formatOpenChip(event, now)}
                </span>
                <h3 className="text-subhead text-fg-primary line-clamp-2">{event.title}</h3>
                <p className="text-caption text-fg-tertiary">
                    {formatEntryRule(event, ticketLimit)}
                </p>
            </div>

            <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                    // TODO: 오픈 알림 구독은 API 계약이 없다 (getddo-spec 05-api/notification.md의 N01~N03은 조회·읽음뿐).
                    // 계약이 생기면 features/subscribeRaffleOpen으로 빼서 연결한다
                    toast.info('오픈 알림은 준비 중이에요.');
                }}
            >
                오픈 알림 받기
            </Button>
        </article>
    );
}
