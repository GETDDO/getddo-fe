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
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <Input
                    type="date"
                    value={from}
                    onChange={(e) => onFromChange(e.target.value)}
                    className="w-40"
                    aria-label={basis ? `${basis} 시작일` : '시작일 필터'}
                    aria-invalid={Boolean(error)}
                />
                <span className="text-fg-tertiary self-center">~</span>
                <Input
                    type="date"
                    value={to}
                    onChange={(e) => onToChange(e.target.value)}
                    className="w-40"
                    aria-label={basis ? `${basis} 종료일` : '종료일 필터'}
                    aria-invalid={Boolean(error)}
                />
            </div>
            {basis && <span className="text-caption text-fg-tertiary">{basis} 기준 · KST</span>}
            {error && (
                <p role="alert" className="text-semantic-error-strong text-caption">
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
