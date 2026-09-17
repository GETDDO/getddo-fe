const KST_TIME_ZONE = 'Asia/Seoul';
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** UTC Date/ISO 문자열을 KST 기준으로 포맷한다 (기본: 2026. 9. 17. 오후 3:00) */
export function formatKst(
    date: Date | string,
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    },
) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('ko-KR', { timeZone: KST_TIME_ZONE, ...options }).format(d);
}

/**
 * epoch을 +9시간 이동시킨 Date를 반환한다.
 * 반환값의 UTC 메서드(getUTCFullYear, getUTCHours, getUTCDate 등)가 KST 시각을 가리키므로
 * "KST 기준 같은 날짜인가" 같은 비교에 사용한다. 화면 표시에는 formatKst를 쓸 것.
 */
export function toKst(date: Date | string): Date {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Date(d.getTime() + KST_OFFSET_MS);
}

/** 두 시각이 KST 기준으로 같은 날짜인지 비교한다 */
export function isSameKstDate(a: Date | string, b: Date | string): boolean {
    const ka = toKst(a);
    const kb = toKst(b);
    return (
        ka.getUTCFullYear() === kb.getUTCFullYear() &&
        ka.getUTCMonth() === kb.getUTCMonth() &&
        ka.getUTCDate() === kb.getUTCDate()
    );
}
