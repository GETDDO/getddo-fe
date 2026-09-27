const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export interface AttendanceDay {
    /** 출석 기준일(UTC 날짜, YYYY-MM-DD) */
    date: string;
    label: string;
    isToday: boolean;
    checked: boolean;
}

/** 출석 기준일은 00:00 UTC(09:00 KST)에 바뀌므로 UTC 날짜로 키를 만든다 */
export function toAttendanceDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

/** 오늘을 마지막 칸으로 하는 최근 7일의 출석 여부를 만든다 */
export function buildAttendanceWeek(
    checkedDates: string[],
    checkedToday: boolean,
    now: Date,
): AttendanceDay[] {
    const checked = new Set(checkedDates);
    const today = toAttendanceDate(now);

    return Array.from({ length: 7 }, (_, index) => {
        const day = new Date(now.getTime() - (6 - index) * DAY_MS);
        const date = toAttendanceDate(day);
        const isToday = date === today;
        return {
            date,
            label: isToday ? '오늘' : (WEEKDAY_LABELS[day.getUTCDay()] ?? ''),
            isToday,
            checked: checked.has(date) || (isToday && checkedToday),
        };
    });
}

/** 이번 달(UTC 기준월) 출석일수 — 연속 출석과 같은 기준월로 센다 */
export function countMonthlyAttendance(
    checkedDates: string[],
    checkedToday: boolean,
    now: Date,
): number {
    const today = toAttendanceDate(now);
    const month = today.slice(0, 7);
    const dates = new Set(checkedDates.filter((date) => date.startsWith(month)));
    if (checkedToday) dates.add(today);
    return dates.size;
}

export interface AttendanceMonthDay {
    /** 출석 기준일(UTC 날짜, YYYY-MM-DD) */
    date: string;
    /** 달력에 표시할 일(1~31) */
    day: number;
    isToday: boolean;
    checked: boolean;
}

/** 이번 달(UTC 기준월) 1일부터 말일까지의 출석 여부를 만든다 */
export function buildAttendanceMonth(
    checkedDates: string[],
    checkedToday: boolean,
    now: Date,
): AttendanceMonthDay[] {
    const checked = new Set(checkedDates);
    const today = toAttendanceDate(now);
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    return Array.from({ length: lastDay }, (_, index) => {
        const date = toAttendanceDate(new Date(Date.UTC(year, month, index + 1)));
        const isToday = date === today;
        return {
            date,
            day: index + 1,
            isToday,
            checked: checked.has(date) || (isToday && checkedToday),
        };
    });
}

/** 출석 기준일(YYYY-MM-DD)이 연속 출석 보상일인지 — 보상 단계 일수는 관리자 정책에서 받는다 */
export function isStreakBonusDate(date: string, bonusDays: ReadonlySet<number>): boolean {
    return bonusDays.has(Number(date.slice(8, 10)));
}
