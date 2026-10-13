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
    // 구독이 아니라 '눈여겨봐 둔 래플' 표시다 — 새로고침하면 사라진다
    const [marked, setMarked] = useState(false);

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

            {/*
             * TODO: 오픈 알림 구독은 API 계약이 없다 (getddo-spec 05-api/notification.md의 N01~N03은 조회·읽음뿐).
             * 계약이 생기면 features/subscribeRaffleOpen으로 빼서 연결한다.
             *
             * 그때까지는 '신청됐다'고 말하지 않는다 — 버튼만 눌린 모양으로 두고 알림이 갈 것처럼
             * 적으면 사용자가 기다리다 오픈을 놓친다. 표시와 안내가 같은 말을 하도록 맞춘다.
             */}
            <Button
                variant={marked ? 'ghost' : 'secondary'}
                className={marked ? 'bg-surface-sunken w-full' : 'w-full'}
                aria-pressed={marked}
                onClick={() => {
                    const next = !marked;
                    setMarked(next);
                    toast.info(
                        next
                            ? '오픈 알림 기능은 준비 중이에요. 지금은 표시만 해 둘게요.'
                            : '표시를 해제했어요.',
                    );
                }}
            >
                {marked ? (
                    <>
                        <Check className="size-4" />
                        관심 표시함
                    </>
                ) : (
                    '관심 표시하기'
                )}
            </Button>
        </article>
    );
}
