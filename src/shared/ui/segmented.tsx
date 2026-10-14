import { cn } from 'cn';

/**
 * 세그먼트 — 회색 홈 안에서 하나만 고르는 짧은 거르기 (피그마 "segmented", 높이 40).
 * 고른 칸은 흰 바탕 + 그림자로 떠오른다. 버튼마다 aria-pressed로 선택 상태를 알린다.
 * 글자 크기는 text-sm으로 둔다 — 커스텀 타이포 토큰은 공용 cn이 글자색과 같은 묶음으로 보고 지운다
 */
function Segmented<T extends string>({
    value,
    onValueChange,
    options,
    label,
    className,
}: {
    value: T;
    onValueChange: (value: T) => void;
    options: readonly { value: T; label: string }[];
    /** 묶음 이름 — 화면 낭독기에 읽힌다 */
    label: string;
    className?: string;
}) {
    return (
        <div
            role="group"
            aria-label={label}
            data-slot="segmented"
            className={cn('bg-surface-sunken inline-flex rounded-lg p-0.75', className)}
        >
            {options.map((option) => {
                const selected = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => onValueChange(option.value)}
                        className={cn(
                            'focus-visible:ring-border-focus h-8.5 cursor-pointer rounded-md px-4 text-sm leading-[1.375rem] whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none',
                            selected
                                ? 'bg-surface-page text-fg-primary font-semibold shadow-sm'
                                : 'text-fg-secondary hover:text-fg-primary',
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

export { Segmented };
