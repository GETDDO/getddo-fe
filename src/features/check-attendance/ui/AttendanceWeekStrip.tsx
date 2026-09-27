import { cn } from '@shared/lib/utils';

import type { AttendanceDay } from '../lib/attendance-week';

import { isStreakBonusDate } from '../lib/attendance-week';
import { getAttendanceMascot } from './mascots';

/** 최근 7일 출석 스트립 — 안 한 날은 회색, 출석한 날은 원본 타코야끼 (보상일은 세 마리 타코야끼) */
export function AttendanceWeekStrip({
    week,
    bonusDays,
}: {
    week: AttendanceDay[];
    bonusDays: ReadonlySet<number>;
}) {
    return (
        <ol className="bg-surface-canvas flex w-full items-center justify-between rounded-lg px-4 py-2">
            {week.map((day) => {
                const mascot = getAttendanceMascot(isStreakBonusDate(day.date, bonusDays));
                return (
                    <li
                        key={day.date}
                        className="flex w-7 flex-col items-center gap-1"
                        aria-label={`${day.label} ${day.checked ? '출석' : '미출석'}`}
                    >
                        <span className="size-6">
                            <img
                                src={mascot.src}
                                alt=""
                                className={cn(
                                    'size-full object-contain',
                                    !day.checked && 'opacity-50 grayscale',
                                )}
                            />
                        </span>
                        <span
                            className={`text-caption ${day.isToday ? 'text-fg-brand' : 'text-fg-tertiary'}`}
                        >
                            {day.label}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}
