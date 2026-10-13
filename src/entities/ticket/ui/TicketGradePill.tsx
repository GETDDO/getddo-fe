import type { TicketGrade } from '../model/types';

import { TICKET_GRADE_LABEL } from '../model/grade';

// 등급 알약 — 등급 soft 바탕 + 등급 진한 색 점 (DESIGN-SYSTEM "Grade — 응모권 등급")
const GRADE_CLASS: Record<TicketGrade, { pill: string; dot: string }> = {
    BRONZE: { pill: 'bg-grade-bronze-soft', dot: 'bg-grade-bronze' },
    SILVER: { pill: 'bg-grade-silver-soft', dot: 'bg-grade-silver' },
    GOLD: { pill: 'bg-grade-gold-soft', dot: 'bg-grade-gold' },
};

/**
 * 응모권 등급 알약 — "● 브론즈 3"처럼 등급과 (있으면) 장수를 함께 보인다.
 * 등급 바탕은 다크 모드에도 그대로라 글자는 바탕에 맞춰 고정 잉크색을 쓴다
 */
export function TicketGradePill({
    grade,
    count,
    unit = '',
}: {
    grade: TicketGrade;
    count?: number;
    /** 장수 뒤에 붙일 단위 — 예: '장' */
    unit?: string;
}) {
    const tone = GRADE_CLASS[grade];
    return (
        <span
            className={`${tone.pill} text-ink inline-flex h-5.5 shrink-0 items-center gap-1.5 rounded-full px-2 text-xs leading-[1.125rem] font-medium whitespace-nowrap`}
        >
            <span aria-hidden className={`${tone.dot} size-1.75 rounded-full`} />
            {TICKET_GRADE_LABEL[grade]}
            {count !== undefined && ` ${count}${unit}`}
        </span>
    );
}
