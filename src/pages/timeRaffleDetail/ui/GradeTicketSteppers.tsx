import type { TicketsByGrade } from '@entities/entry';
import type { TicketGrade } from '@entities/ticket';

import { TICKET_GRADE_LABEL, ticketGradeSchema } from '@entities/ticket';

import { QuantityStepper } from './QuantityStepper';

interface GradeTicketSteppersProps {
    /** 등급별로 고른 장수 */
    value: TicketsByGrade;
    onChange: (next: TicketsByGrade) => void;
    /** 등급별 사용 가능 보유 장수 — 잔액을 못 불러왔으면 null */
    availableByGrade: Record<TicketGrade, number> | null;
    /** 이 이벤트에 앞으로 더 낼 수 있는 합계 상한 — 사용자당 상한이 없는 이벤트는 null */
    remainingLimit: number | null;
}

/**
 * 가중치 적용 이벤트의 등급별 장수 선택 — spec은 사용자가 등급별 장수를 고르게 한다.
 * 각 등급은 보유 장수까지만, 합계는 남은 누적 상한까지만 오른다.
 */
export function GradeTicketSteppers({
    value,
    onChange,
    availableByGrade,
    remainingLimit,
}: GradeTicketSteppersProps) {
    const total = value.BRONZE + value.SILVER + value.GOLD;

    // 다른 등급이 이미 쓴 만큼을 뺀 잔여 상한이 이 등급의 실질 상한이다
    const maxOf = (grade: TicketGrade) => {
        const owned = availableByGrade?.[grade] ?? 0;
        const allowance =
            remainingLimit === null ? owned : Math.max(0, remainingLimit - (total - value[grade]));
        return Math.min(owned, allowance);
    };

    return (
        <div className="flex flex-col gap-3" role="group" aria-label="등급별 응모권 장수">
            {ticketGradeSchema.options.map((grade) => (
                <div key={grade} className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-body-bold text-fg-primary">
                            {TICKET_GRADE_LABEL[grade]}
                        </span>
                        <span className="text-caption text-fg-tertiary">
                            보유 {availableByGrade ? `${availableByGrade[grade]}장` : '-'}
                        </span>
                    </div>
                    <QuantityStepper
                        value={value[grade]}
                        min={0}
                        max={maxOf(grade)}
                        onChange={(next) => onChange({ ...value, [grade]: next })}
                        label={`${TICKET_GRADE_LABEL[grade]} 응모 수량`}
                    />
                </div>
            ))}
            <p className="text-caption text-fg-tertiary" aria-live="polite">
                합계 {total}장
                {remainingLimit !== null && ` · ${remainingLimit}장까지 더 응모할 수 있어요`}
            </p>
        </div>
    );
}
