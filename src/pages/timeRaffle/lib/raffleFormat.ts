import type { Event } from '@entities/event';

import { KST_HOUR_MINUTE, formatKst, kstDayDiff } from '@shared/lib/date';

const MONTH_DAY: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };

/**
 * 마감까지 남은 시간 — "13분 48초"처럼 읽는 단위로 쓴다.
 *
 * 시각 포맷(00:13:48)은 한 시간을 넘는 래플에서 앞자리가 늘 0이라 읽기 어렵다.
 * 한 시간이 넘으면 초는 떼고 시간·분만 남긴다 — 초 단위가 의미를 갖는 구간이 아니다.
 */
export function formatCloseCountdown(remainingMs: number): string {
    const total = Math.max(0, Math.floor(remainingMs / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    if (hours > 0) return `${hours}시간 ${minutes}분`;
    if (minutes > 0) return `${minutes}분 ${seconds}초`;
    return `${seconds}초`;
}

/** KST 날짜를 '오늘 / 어제 / 내일 / 10월 3일'로 적는다 */
export function kstDayLabel(iso: string, now: Date): string {
    const diff = kstDayDiff(iso, now);
    if (diff === 0) return '오늘';
    if (diff === -1) return '어제';
    if (diff === 1) return '내일';
    return formatKst(iso, MONTH_DAY);
}

/** 오픈 예정 칩 — "오늘 20:00 오픈" */
export function formatOpenChip(event: Event, now: Date): string {
    return `${kstDayLabel(event.startsAt, now)} ${formatKst(event.startsAt, KST_HOUR_MINUTE)} 오픈`;
}

/** 진행 중 래플의 운영 시간 칩 — "18:00 ~ 19:00" */
export function formatRunningRange(event: Event): string {
    return `${formatKst(event.startsAt, KST_HOUR_MINUTE)} ~ ${formatKst(event.endsAt, KST_HOUR_MINUTE)}`;
}

/**
 * 오픈 예정·마감 카드의 보조 설명.
 *
 * 응모권을 여러 장 쓸 수 있는지는 ADR-010의 누적 한도에 달려 있다.
 * 1회 차감량이 한도와 같으면 한 번뿐이므로 '여러 장'이라고 적을 수 없다.
 */
export function formatEntryRule(event: Event, ticketLimit: number): string {
    const winners = `당첨 ${event.winnerCount.toLocaleString('ko-KR')}명`;
    if (event.requiredTickets === 0) return `${winners} · 응모권 없이 참여`;
    if (event.requiredTickets * 2 > ticketLimit) {
        return `${winners} · 응모권 ${event.requiredTickets}장으로 응모`;
    }
    return `${winners} · 여러 장 응모 가능`;
}
