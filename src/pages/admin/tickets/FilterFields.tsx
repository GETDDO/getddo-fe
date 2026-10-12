import { Input } from '@shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';

export function TextFilter({
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

export function DateRangeFilter({
    from,
    to,
    onFromChange,
    onToChange,
}: {
    from: string;
    to: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
}) {
    return (
        <>
            <Input
                type="date"
                value={from}
                onChange={(e) => onFromChange(e.target.value)}
                className="w-40"
                aria-label="시작일 필터"
            />
            <span className="text-fg-tertiary self-center">~</span>
            <Input
                type="date"
                value={to}
                onChange={(e) => onToChange(e.target.value)}
                className="w-40"
                aria-label="종료일 필터"
            />
        </>
    );
}

export function OptionFilter({
    value,
    onChange,
    options,
    label,
}: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    label: string;
}) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-36" aria-label={label}>
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
