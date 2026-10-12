import { cn } from '@shared/lib/utils';

const STEP_BUTTON =
    'border-border-strong text-body-bold flex size-8 items-center justify-center rounded-lg border disabled:cursor-not-allowed';

interface QuantityStepperProps {
    value: number;
    min: number;
    max: number;
    onChange: (next: number) => void;
    /** 스크린 리더에 읽히는 수량 이름 — 등급별 선택에서는 '브론즈 응모 수량'처럼 구체적으로 넘긴다 */
    label?: string;
}

/** 응모 수량 조절 — 보유 응모권과 1인 한도 안에서만 오르내린다 */
export function QuantityStepper({
    value,
    min,
    max,
    onChange,
    label = '응모 수량',
}: QuantityStepperProps) {
    return (
        <div className="flex items-center gap-3">
            <button
                type="button"
                aria-label={`${label} 줄이기`}
                disabled={value <= min}
                onClick={() => onChange(value - 1)}
                className={cn(STEP_BUTTON, value <= min ? 'text-fg-disabled' : 'text-fg-primary')}
            >
                −
            </button>
            <span
                aria-live="polite"
                aria-label={label}
                className="text-body-bold text-fg-primary flex h-8 w-10 items-center justify-center"
            >
                {value}
            </span>
            <button
                type="button"
                aria-label={`${label} 늘리기`}
                disabled={value >= max}
                onClick={() => onChange(value + 1)}
                className={cn(STEP_BUTTON, value >= max ? 'text-fg-disabled' : 'text-fg-primary')}
            >
                +
            </button>
        </div>
    );
}
