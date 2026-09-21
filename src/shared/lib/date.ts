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

/** 남은 밀리초를 "HH:MM:SS" 형태의 카운트다운 문자열로 변환한다 (표시용 — 마감 판정에는 사용하지 않는다) */
export function formatCountdown(remainingMs: number): string {
    const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** now 기준 상대 시간 문자열을 만든다. "지금"의 기준은 호출부가 useVirtualClock().now()로 넘겨준다 */
export function formatRelativeFromNow(date: Date | string, now: Date): string {
    const target = typeof date === 'string' ? new Date(date) : date;
    const diffMinutes = Math.floor((now.getTime() - target.getTime()) / 60_000);
    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${Math.floor(diffHours / 24)}일 전`;
}
