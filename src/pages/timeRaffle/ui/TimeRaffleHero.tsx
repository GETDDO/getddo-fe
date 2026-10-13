import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { Event } from '@entities/event';

import { useMyTickets, useTicketHistories } from '@entities/ticket';
import { KST_HOUR_MINUTE, formatKst } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/format';

import heroMascot from '../assets/hero-mascot.png';
import { isSameKstMonth, kstDateHeadline } from '../lib/raffleFormat';

interface TimeRaffleHeroProps {
    live: Event[];
    upcoming: Event[];
    /** 마감했거나 발표까지 끝난 래플 — '오늘 발표' 집계에 쓴다 */
    closed: Event[];
    now: Date;
}

/**
 * 겟또타임 머리 — 오늘 무엇을 할 수 있는지 한 줄로 알려 주고 응모권 잔액을 함께 둔다.
 *
 * 래플은 시간이 지나면 사라지는 화면이라 '지금 몇 개가 열려 있는지'가 제목이어야 한다.
 * 응모권을 보려고 마이페이지로 나갔다 오지 않도록 잔액도 같은 줄에 둔다.
 */
export function TimeRaffleHero({ live, upcoming, closed, now }: TimeRaffleHeroProps) {
    return (
        <section className="bg-surface-canvas flex flex-col gap-10 rounded-2xl p-10 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-col gap-2">
                <p className="text-body-sm-bold text-fg-secondary">
                    {kstDateHeadline(now)} · 겟또타임
                </p>
                <h1 className="text-display text-fg-primary">
                    {live.length > 0
                        ? `지금 응모할 수 있는 래플 ${formatNumber(live.length)}개`
                        : '지금 열린 래플이 없어요'}
                </h1>
                <p className="text-body text-fg-secondary">
                    마감 직후 바로 추첨해요. 응모권을 많이 쓸수록 당첨 기회가 커져요.
                </p>

                <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <StepCard
                        label="진행 중"
                        live
                        count={live.length}
                        hint={
                            live[0]
                                ? `가장 빠른 마감 ${formatKst(live[0].endsAt, KST_HOUR_MINUTE)}`
                                : '열린 래플 없음'
                        }
                    />
                    <StepCard
                        label="오픈 예정"
                        count={upcoming.length}
                        hint={
                            upcoming[0]
                                ? `다음 오픈 ${formatKst(upcoming[0].startsAt, KST_HOUR_MINUTE)}`
                                : '예정된 래플 없음'
                        }
                    />
                    <AnnouncementStep closed={closed} now={now} />
                </dl>
            </div>

            <TicketWallet now={now} />
        </section>
    );
}

function StepCard({
    label,
    count,
    hint,
    live = false,
}: {
    label: string;
    count: number;
    hint: string;
    live?: boolean;
}) {
    return (
        <div className="bg-surface-page flex flex-col gap-1 rounded-xl px-4 py-3.5">
            <dt className="text-body-sm text-fg-secondary flex items-center gap-1.5">
                {live && <span className="bg-brand-primary size-1.5 rounded-full" />}
                {label}
            </dt>
            <dd className="text-title-3 text-fg-primary">{formatNumber(count)}개</dd>
            <p className="text-caption text-fg-tertiary">{hint}</p>
        </div>
    );
}

/**
 * 오늘 발표되는 래플 수.
 *
 * 발표 예정 시각이 오늘인 래플을 센다. 예정 시각은 '원래 예정'이라 실제 공개는 늦을 수 있으므로
 * 아직 발표되지 않은 것 중 가장 이른 시각만 알려 주고, 새 시각을 약속하지 않는다.
 */
function AnnouncementStep({ closed, now }: { closed: Event[]; now: Date }) {
    const today = closed.filter(
        (event) =>
            event.publicationScheduledAt != null &&
            formatKst(event.publicationScheduledAt, { dateStyle: 'short' }) ===
                formatKst(now, { dateStyle: 'short' }),
    );
    const waiting = today
        .filter((event) => event.status !== 'drawn')
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

/**
 * 응모권 지갑 — 절취선과 양옆 홈으로 티켓 모양을 만든다.
 *
 * '이번 달 사용'은 이력(T02)에서 센다. 보유 조회(T01)는 지금 남은 장수만 주기 때문이다.
 * 이력은 미션 화면과 같은 쿼리 키를 쓰므로 화면을 오가도 다시 받지 않는다.
 */
function TicketWallet({ now }: { now: Date }) {
    const { data: tickets } = useMyTickets();
    const { data: histories } = useTicketHistories();

    const usedThisMonth = (histories ?? []).filter(
        (history) => history.operationType === 'USE' && isSameKstMonth(history.createdAt, now),
    ).length;

    return (
        <div className="bg-surface-page relative shrink-0 rounded-2xl px-6 py-7 lg:w-85">
            {/* 티켓 가장자리의 반원 홈 — 배경과 같은 색으로 덮어 파인 것처럼 보이게 한다 */}
            <span className="bg-surface-canvas absolute bottom-19 -left-2 size-4 rounded-full" />
            <span className="bg-surface-canvas absolute -right-2 bottom-19 size-4 rounded-full" />

            {/* 카드 위로 걸쳐 올라오는 장식 — 잔액은 아래 글에서 읽히므로 읽어 줄 내용이 없다 */}
            <img
                src={heroMascot}
                alt=""
                className="pointer-events-none absolute -top-11 -right-2 size-26 object-contain"
            />

            <p className="text-body-sm text-fg-secondary">사용 가능 응모권</p>
            <p className="text-title-1 text-fg-primary">
                {tickets ? `${formatNumber(tickets.availableCount)}장` : '-'}
            </p>
            <p className="text-caption text-fg-tertiary mt-1">응모 1회에 1장부터 쓸 수 있어요</p>

            <div className="border-border-default mt-4 flex items-center justify-between gap-4 border-t border-dashed pt-4">
                <p className="text-caption text-fg-tertiary">
                    이번 달 사용 {formatNumber(usedThisMonth)}장
                </p>
                <Link
                    to="/missions"
                    className="text-body-sm-bold text-fg-primary flex items-center gap-1"
                >
                    응모권 모으러 가기
                    <ChevronRight className="size-4" />
                </Link>
            </div>
        </div>
    );
}
