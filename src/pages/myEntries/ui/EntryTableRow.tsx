import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { MyEntryRow } from '@widgets/myEntryRows';

import { MyResultBadge } from '@entities/drawResult';
import { EventThumbnail } from '@entities/event';
import { TICKET_GRADES, TicketGradePill } from '@entities/ticket';
import { getErrorCodeMessage } from '@shared/api/errorMessage';
import { formatKst, formatKstDot, isSameKstDate, KST_HOUR_MINUTE } from '@shared/lib/date';
import { Badge } from '@shared/ui/badge';

/** 표 칸 너비 — 머리줄(EntryTableHead)과 줄이 같은 값을 쓴다 */
export const ENTRY_GRID = 'md:grid-cols-[minmax(0,1fr)_10.5rem_9rem_5.5rem_1.25rem]';

/** "1시간 40분 남음" — 발표 대기 줄에서만 쓴다 */
function remainingLabel(ms: number) {
    const minutes = Math.max(1, Math.ceil(ms / 60_000));
    const hours = Math.floor(minutes / 60);
    if (hours >= 24) return `${Math.floor(hours / 24)}일 남음`;
    return hours > 0 ? `${hours}시간 ${minutes % 60}분 남음` : `${minutes}분 남음`;
}

/**
 * 내 응모 내역 표의 한 줄 — 줄 전체가 이벤트·겟또타임 상세로 가는 링크다.
 * 넓은 화면에서는 응모·사용 응모권·발표·결과 칸으로 펼치고, 좁은 화면에서는 위아래로 쌓는다.
 * 발표 시각은 서버가 준 예정 시각만 쓴다 — 지연 안내 문구는 계약에 없어 만들지 않는다
 */
export function EntryTableRow({ row, now }: { row: MyEntryRow; now: Date }) {
    const { entry, event, isTimeRaffle, result } = row;
    const rejected = entry.status === 'REJECTED';
    const announceAt = event?.publicationScheduledAt;
    const untilAnnounce = announceAt ? new Date(announceAt).getTime() - now.getTime() : 0;
    const usedGrades = TICKET_GRADES.filter((grade) => entry.deductedTicketsByGrade[grade] > 0);
    const rejectionReason = rejected
        ? (getErrorCodeMessage(entry.rejectionCode) ?? entry.rejectionReason)
        : null;

    return (
        <li>
            <Link
                to={row.to}
                className={`hover:bg-surface-canvas focus-visible:ring-border-focus grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 rounded-xl px-3 py-3.5 transition-colors focus-visible:ring-2 focus-visible:outline-none ${ENTRY_GRID}`}
            >
                <div className="flex min-w-0 items-center gap-3">
                    <EventThumbnail src={event?.bannerImageUrl} className="size-13" />
                    <div className="flex min-w-0 flex-col">
                        <span className="text-body-bold text-fg-primary truncate">
                            {entry.eventTitle}
                        </span>
                        <span className="text-body-sm text-fg-tertiary">
                            {isTimeRaffle ? '겟또타임' : '이벤트'} ·{' '}
                            {formatKstDot(entry.requestedAt, true)} 응모
                        </span>
                        {rejectionReason && (
                            <span className="text-body-sm text-destructive">{rejectionReason}</span>
                        )}
                    </div>
                </div>

                {/* 좁은 화면에서는 결과 칩이 제목 오른쪽에 붙는다 */}
                <div className="flex items-center justify-end gap-3 md:hidden">
                    {rejected ? (
                        <Badge>접수 안 됨</Badge>
                    ) : (
                        result && <MyResultBadge result={result} />
                    )}
                </div>

                <div className="col-span-2 flex flex-wrap items-center gap-1 pl-16 md:col-span-1 md:pl-0">
                    {rejected ? (
                        <span className="text-caption text-fg-tertiary">—</span>
                    ) : usedGrades.length === 0 ? (
                        <span className="text-caption text-fg-tertiary">응모권 없이 참여</span>
                    ) : (
                        usedGrades.map((grade) => (
                            <TicketGradePill
                                key={grade}
                                grade={grade}
                                count={entry.deductedTicketsByGrade[grade]}
                            />
                        ))
                    )}
                </div>

                <div className="col-span-2 flex flex-col pl-16 md:col-span-1 md:pl-0">
                    {announceAt && !rejected ? (
                        <>
                            <span className="text-body-sm text-fg-primary">
                                {isSameKstDate(announceAt, now)
                                    ? `오늘 ${formatKst(announceAt, KST_HOUR_MINUTE)}`
                                    : formatKstDot(announceAt, true)}
                                <span className="md:hidden"> 발표</span>
                            </span>
                            {result === 'PENDING' && untilAnnounce > 0 && (
                                <span className="text-caption text-fg-tertiary">
                                    {remainingLabel(untilAnnounce)}
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-caption text-fg-tertiary hidden md:inline">—</span>
                    )}
                </div>

                <div className="hidden justify-end md:flex">
                    {rejected ? (
                        <Badge>접수 안 됨</Badge>
                    ) : (
                        result && <MyResultBadge result={result} />
                    )}
                </div>
                <ChevronRight aria-hidden className="text-fg-secondary hidden size-5 md:block" />
            </Link>
        </li>
    );
}
