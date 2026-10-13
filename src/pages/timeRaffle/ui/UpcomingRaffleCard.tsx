import { Check } from 'lucide-react';
import { useState } from 'react';
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
    const [subscribed, setSubscribed] = useState(false);

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
                // 신청을 마친 버튼은 한 단계 내려 둔다 — 다시 누르면 취소라 계속 강조할 이유가 없다
                variant={subscribed ? 'ghost' : 'secondary'}
                className={subscribed ? 'bg-surface-sunken w-full' : 'w-full'}
                aria-pressed={subscribed}
                onClick={() => {
                    // TODO: 오픈 알림 구독은 API 계약이 없다 (getddo-spec 05-api/notification.md의 N01~N03은 조회·읽음뿐).
                    // 계약이 생기면 features/subscribeRaffleOpen으로 빼서 연결한다.
                    // 그때까지는 신청 상태를 이 화면 안에서만 들고 있다 — 새로고침하면 사라진다
                    setSubscribed((value) => !value);
                    toast.info(
                        subscribed
                            ? '오픈 알림을 취소했어요.'
                            : '오픈 알림은 준비 중이에요. 연결되면 알려 드릴게요.',
                    );
                }}
            >
                {subscribed ? (
                    <>
                        <Check className="size-4" />
                        알림 신청됨
                    </>
                ) : (
                    '오픈 알림 받기'
                )}
            </Button>
        </article>
    );
}
