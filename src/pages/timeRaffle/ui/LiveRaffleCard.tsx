import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { Event } from '@entities/event';

import { useEntryStatistics } from '@entities/entry';
import { queryPresets } from '@shared/api/queryPresets';
import { KST_HOUR_MINUTE, formatKst } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/format';
import { useVirtualClock } from '@shared/lib/virtualClock';
import { Button } from '@shared/ui/button';

import { formatRunningRange } from '../lib/raffleFormat';
import { CloseCountdownChip } from './CloseCountdownChip';
import { RaffleThumbnail } from './RaffleThumbnail';

/** 참여 현황을 다시 받아오는 주기(초) — 폴링 설정과 문구가 따로 놀지 않게 같은 값을 쓴다 */
const REFRESH_SECONDS = queryPresets.realtime.refetchInterval / 1000;

interface LiveRaffleCardProps {
    event: Event;
}

export function LiveRaffleCard({ event }: LiveRaffleCardProps) {
    // 이 카드는 현재 보이는 진행 중 래플 1건이라 이 이벤트의 E03만 폴링한다 (ADR-0007)
    const { data: statistics, dataUpdatedAt } = useEntryStatistics(event.id, { isOpen: true });
    const { override } = useVirtualClock();
    // 참여 현황은 폴링으로 따라가는 값이라 지금 이 순간의 수가 아니다 — 언제 기준인지 시각으로 적는다.
    // updatedAt은 쿼리가 실제 시각으로 적는 값이다. 관리자가 가상 시계로 시간을 멈춰 두면
    // 화면의 다른 시각과 어긋나지 않게 그 시각을 기준으로 적는다.
    // 매초 바뀌는 'n초 전'은 눈에 걸려 분 단위 기준 시각과 갱신 주기만 적는다
    const fetchedAt = dataUpdatedAt ? (override ?? new Date(dataUpdatedAt)) : null;

    // 숫자는 회색 상자 셋 대신 한 줄로 낮춘다 — 작은 카드의 '당첨 3명 · 2,048명 참여 중'과 같은 말투다
    const stats = [
        `당첨 ${formatNumber(event.winnerCount)}명`,
        statistics && `${formatNumber(statistics.participantCount)}명 참여 중`,
        statistics && `응모권 ${formatNumber(statistics.totalSpentTicketCount)}장 사용`,
    ].filter(Boolean);

    return (
        <article className="bg-surface-elevated border-border-default flex flex-col gap-8 rounded-2xl border py-6 pr-8 pl-6 shadow-md lg:flex-row lg:items-center">
            <RaffleThumbnail
                src={event.bannerImageUrl}
                className="w-full max-w-72 self-center rounded-xl lg:w-72 lg:self-auto"
                fallbackIconClassName="size-12"
            />

            <div className="flex min-w-0 flex-1 flex-col gap-3.5">
                {/* 윗줄은 점·글자 한 결로 맞춘다 — 시간만 회색 알약이면 셋의 꼴이 제각각이었다 */}
                <div className="text-body-sm flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-fg-primary flex items-center gap-1.5">
                        <span className="bg-brand-primary size-1.5 rounded-full" />
                        진행중
                    </span>
                    <span className="text-fg-secondary flex items-center gap-1 tabular-nums">
                        <Clock className="size-3.5" />
                        {formatRunningRange(event)}
                    </span>
                    <CloseCountdownChip endsAt={event.endsAt} />
                </div>

                <div className="flex flex-col gap-1.5">
                    <h3 className="text-title-2 text-fg-primary">{event.title}</h3>
                    <p className="text-body-sm text-fg-secondary line-clamp-2">
                        {event.description}
                    </p>
                </div>

                <div className="flex flex-col gap-0.5">
                    <p className="text-body-sm-bold text-fg-primary">{stats.join(' · ')}</p>
                    {statistics && fetchedAt && (
                        <p className="text-caption text-fg-tertiary">
                            {formatKst(fetchedAt, KST_HOUR_MINUTE)} 기준 · {REFRESH_SECONDS}초마다
                            갱신돼요
                        </p>
                    )}
                </div>

                <Button asChild size="lg" className="w-full">
                    <Link to={`/time-raffle/${event.id}`}>응모하러 가기</Link>
                </Button>
            </div>
        </article>
    );
}
