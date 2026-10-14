import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import type { Event } from '@entities/event';

import { useEntryStatistics } from '@entities/entry';
import { KST_HOUR_MINUTE, formatKst } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/format';
import { Button } from '@shared/ui/button';

import { kstDayLabel } from '../lib/raffleFormat';
import { RaffleThumbnail } from './RaffleThumbnail';

/** 기본 화면에서 미리 보여 주는 줄 수 — 나머지는 '마감한 래플' 화면에서 본다 */
const PREVIEW_COUNT = 3;
/** 마감한 래플 화면에서 '더 보기'를 누를 때마다 늘리는 줄 수 */
const PAGE_SIZE = 10;

const ROW_CHIP = 'text-caption rounded-full px-2.5 py-1';

interface ClosedRaffleListProps {
    /** 머리의 진행 칸이 스크롤해 올 위치 */
    id?: string;
    events: Event[];
    now: Date;
    /**
     * preview — 기본 화면 아래에 최근 몇 줄만 두고 '전체보기'로 마감한 래플 화면으로 넘긴다.
     * full — 마감한 래플 화면. 전부를 날짜별로 묶고 '더 보기'로 이어 붙인다
     */
    mode: 'preview' | 'full';
    /** preview의 '전체보기' — 페이지를 옮기지 않고 내용 칸만 마감한 래플로 바꾼다 */
    onShowAll?: () => void;
    /** full의 '뒤로' — 기본 화면으로 칸을 되돌린다 */
    onBack?: () => void;
}

export function ClosedRaffleList({
    id,
    events,
    now,
    mode,
    onShowAll,
    onBack,
}: ClosedRaffleListProps) {
    const [shown, setShown] = useState(PAGE_SIZE);

    const limit = mode === 'preview' ? PREVIEW_COUNT : shown;
    const visible = events.slice(0, limit);

    // 날짜가 바뀌는 자리에만 '오늘 / 어제' 머리말을 넣는다
    const groups: { label: string; rows: Event[] }[] = [];
    for (const event of visible) {
        const label = kstDayLabel(event.endsAt, now);
        const last = groups.at(-1);
        if (last?.label === label) last.rows.push(event);
        else groups.push({ label, rows: [event] });
    }

    return (
        <section id={id} className="flex scroll-mt-24 flex-col gap-5">
            {mode === 'full' && (
                <div className="flex flex-col items-start gap-3">
                    <Button variant="link" size="text" onClick={onBack}>
                        <ChevronLeft />
                        진행 중인 래플 보기
                    </Button>
                    <div className="flex items-center gap-2">
                        <h2 className="text-title-3 text-fg-primary">마감한 래플</h2>
                        <span className="bg-surface-sunken text-label-sm text-fg-secondary rounded-full px-2.5 py-1">
                            {formatNumber(events.length)}
                        </span>
                    </div>
                </div>
            )}
            {mode === 'preview' && (
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-title-3 text-fg-primary">마감한 래플</h2>
                    {events.length > PREVIEW_COUNT && (
                        <Button variant="link" size="text" onClick={onShowAll}>
                            전체보기
                            <ChevronRight />
                        </Button>
                    )}
                </div>
            )}

            {events.length === 0 ? (
                <p className="text-body-sm text-fg-tertiary">마감한 래플이 없어요.</p>
            ) : (
                <div className="flex flex-col">
                    {groups.map((group) => (
                        <div key={group.label} className="flex flex-col">
                            {/* 머리말·줄 모두 안쪽 여백 없이 제목과 같은 왼쪽 선에 맞춘다 */}
                            <p className="text-caption text-fg-tertiary pt-3.5 pb-0.5">
                                {group.label}
                            </p>
                            <ul className="divide-border-default flex flex-col divide-y">
                                {group.rows.map((event) => (
                                    <ClosedRaffleRow key={event.id} event={event} now={now} />
                                ))}
                            </ul>
                        </div>
                    ))}
                    {mode === 'full' && events.length > shown && (
                        <Button
                            variant="secondary"
                            className="mt-4 self-center"
                            onClick={() => setShown((count) => count + PAGE_SIZE)}
                        >
                            더 보기
                        </Button>
                    )}
                </div>
            )}
        </section>
    );
}

function ClosedRaffleRow({ event, now }: { event: Event; now: Date }) {
    // 마감 이후라 값이 더 늘지 않는다 — 폴링 없이 행마다 1회 조회한다.
    // TODO: 행마다 E03을 부르는 구조는 최적화 대상이다 (Obsidian 20261008-progress-roadmap 참조)
    const { data: statistics } = useEntryStatistics(event.id);
    const isDrawn = event.status === 'drawn';
    // 예정 시각은 '원래 예정'이고 실제 공개는 늦어질 수 있다 (getddo-spec 05-api/drawing.md).
    // 그 시각이 지났는데 아직 발표 전이면 '19:10 발표 예정'은 이미 틀린 말이다 —
    // 상세 화면이 같은 상태를 '아직 발표되지 않았습니다'로 적는 것과도 어긋난다
    const scheduledAt = event.publicationScheduledAt;
    // 발표 여부는 status로만 판단한다. 시각이 지났다고 발표된 것으로 적지 않는다
    const statusLabel = isDrawn
        ? '발표 완료'
        : scheduledAt == null || new Date(scheduledAt).getTime() <= now.getTime()
          ? '발표 대기'
          : `${formatKst(scheduledAt, KST_HOUR_MINUTE)} 발표 예정`;

    const meta = [
        `${kstDayLabel(event.endsAt, now)} ${formatKst(event.endsAt, KST_HOUR_MINUTE)} 마감`,
        `당첨 ${formatNumber(event.winnerCount)}명`,
        statistics ? `${formatNumber(statistics.participantCount)}명 참여` : null,
    ].filter(Boolean);

    return (
        <li className="flex items-center gap-4 py-4">
            <RaffleThumbnail
                src={event.bannerImageUrl}
                className="w-20 rounded-lg"
                fallbackIconClassName="size-6"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                {/*
                 * 내 당첨 여부는 결과 화면에서 본다 — 목록에는 발표 상태만 둔다.
                 * 발표 완료가 대부분이라 모든 줄에 칩을 달면 정보가 되지 않는다. 아직 발표 전인 줄만 칩으로 띄우고
                 * 발표 완료는 오른쪽 '결과 보기' 버튼이 대신 알린다
                 */}
                {!isDrawn && (
                    <span className={`${ROW_CHIP} bg-surface-sunken text-fg-secondary w-fit`}>
                        {statusLabel}
                    </span>
                )}
                <p className="text-body-bold text-fg-primary truncate">{event.title}</p>
                <p className="text-caption text-fg-tertiary">{meta.join(' · ')}</p>
            </div>
            {/*
             * 발표 전이라도 상세로 들어갈 수 있어야 한다 — 상세 화면은 마감 상태를 지원하고
             * 발표까지 남은 시간과 내 응모 현황을 보여 준다. 버튼을 막으면 그 경로가 끊긴다
             */}
            <Button asChild variant="secondary" size="sm" className="shrink-0">
                <Link to={`/time-raffle/${event.id}`}>{isDrawn ? '결과 보기' : '상세 보기'}</Link>
            </Button>
        </li>
    );
}
