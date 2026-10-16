import { cn } from 'cn';
import { useId } from 'react';

import { Input } from '@shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';

function TextFilter({
    value,
    onChange,
    placeholder,
    label,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    label: string;
}) {
    return (
        <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-48"
            aria-label={label}
        />
    );
}

/** 칸 안 날짜 입력 — 테두리는 바깥 상자가 그린다 */
const DATE_INPUT =
    'text-fg-primary md:text-body-sm h-full w-32 min-w-0 bg-transparent text-base outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100';

/**
 * 기간 필터 — 시작·종료 날짜를 테두리 하나로 묶은 높이 40 상자. 기준(예: 응모 시작일·KST)은 상자 안 앞머리에 둬서
 * 아래 줄이 생기지 않게 한다 — 옆의 검색창·버튼과 윗선이 맞는다. 순서 오류 문구도 상자 아래에 띄워 줄을 밀지 않는다
 */
function DateRangeFilter({
    from,
    to,
    onFromChange,
    onToChange,
    basis,
    error,
}: {
    from: string;
    to: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
    /** 이 기간 필터가 거는 시각의 의미 — "응모 시작일"·"생성일" 등 */
    basis?: string;
    /** 시작일이 종료일보다 늦은 등 순서 오류 문구 */
    error?: string | null;
}) {
    const errorId = useId();
    return (
        <div className="relative">
            <div
                className={cn(
                    'border-border-default bg-surface-page hover:border-border-strong focus-within:border-border-focus focus-within:ring-border-focus/10 flex h-10 items-center gap-2 rounded-lg border px-3 transition-colors focus-within:ring-3',
                    error &&
                        'border-semantic-error-strong hover:border-semantic-error-strong focus-within:border-semantic-error-strong',
                )}
            >
                {basis && (
                    <span className="text-caption text-fg-tertiary border-border-default shrink-0 border-r pr-2 whitespace-nowrap">
                        {basis} · KST
                    </span>
                )}
                <input
                    type="date"
                    value={from}
                    onChange={(e) => onFromChange(e.target.value)}
                    className={DATE_INPUT}
                    aria-label={basis ? `${basis} 시작일` : '시작일 필터'}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : undefined}
                />
                <span aria-hidden className="text-fg-tertiary">
                    ~
                </span>
                <input
                    type="date"
                    value={to}
                    onChange={(e) => onToChange(e.target.value)}
                    className={DATE_INPUT}
                    aria-label={basis ? `${basis} 종료일` : '종료일 필터'}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : undefined}
                />
            </div>
            {error && (
                <p
                    id={errorId}
                    role="alert"
                    className="text-semantic-error-strong text-caption absolute top-full left-0 mt-1 whitespace-nowrap"
                >
                    {error}
                </p>
            )}
        </div>
    );
}

function OptionFilter({
    value,
    onChange,
    options,
    label,
    className = 'w-36',
}: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    label: string;
    className?: string;
}) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={className} aria-label={label}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export { DateRangeFilter, OptionFilter, TextFilter };
