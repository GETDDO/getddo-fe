import { cn } from '@shared/lib/utils';

const STEP_BUTTON =
    'border-border-strong text-body-bold flex size-8 items-center justify-center rounded-lg border disabled:cursor-not-allowed';

interface QuantityStepperProps {
    value: number;
    min: number;
    max: number;
    onChange: (next: number) => void;
}

/** 응모 수량 조절 — 보유 응모권과 1인 한도 안에서만 오르내린다 */
export function QuantityStepper({ value, min, max, onChange }: QuantityStepperProps) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-body-bold text-fg-secondary">응모 수량</span>
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    aria-label="응모 수량 줄이기"
                    disabled={value <= min}
                    onClick={() => onChange(value - 1)}
                    className={cn(
                        STEP_BUTTON,
                        value <= min ? 'text-fg-disabled' : 'text-fg-primary',
                    )}
                >
                    −
                </button>
                <span
                    aria-live="polite"
                    className="text-body-bold text-fg-primary flex h-8 w-10 items-center justify-center"
                >
                    {value}
                </span>
                <button
                    type="button"
                    aria-label="응모 수량 늘리기"
                    disabled={value >= max}
                    onClick={() => onChange(value + 1)}
                    className={cn(
                        STEP_BUTTON,
                        value >= max ? 'text-fg-disabled' : 'text-fg-primary',
                    )}
                >
                    +
                </button>
            </div>
        </div>
    );
}
