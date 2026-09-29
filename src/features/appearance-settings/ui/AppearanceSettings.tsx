import { Moon, Sun, SunMoon } from 'lucide-react';

import { useUiSettingsStore, type Theme } from '@shared/lib/ui-settings';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';

const THEME_OPTIONS = [
    { value: 'system', label: '시스템 설정', icon: SunMoon },
    { value: 'light', label: '라이트', icon: Sun },
    { value: 'dark', label: '다크', icon: Moon },
] as const;

export function AppearanceSettings() {
    const theme = useUiSettingsStore((state) => state.theme);
    const setTheme = useUiSettingsStore((state) => state.setTheme);
    const textScale = useUiSettingsStore((state) => state.textScale);
    const setTextScale = useUiSettingsStore((state) => state.setTextScale);
    const isLargeText = textScale === 'large';

    return (
        <section className="bg-surface-page border-border-default flex flex-col gap-4 rounded-2xl border p-5">
            <h2 className="text-subhead text-fg-primary">화면 설정</h2>

            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <p className="text-body-bold text-fg-primary">테마</p>
                    <p className="text-body-sm text-fg-tertiary">화면 색상 모드를 선택합니다.</p>
                </div>
                <Select value={theme} onValueChange={(value) => setTheme(value as Theme)}>
                    <SelectTrigger className="w-36" aria-label="테마 선택">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                            <SelectItem key={value} value={value}>
                                <Icon className="size-4" />
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <p className="text-body-bold text-fg-primary">큰글씨 모드</p>
                    <p className="text-body-sm text-fg-tertiary">
                        전체 글자 크기를 크게 표시합니다.
                    </p>
                </div>
                <Button
                    variant="outline"
                    aria-pressed={isLargeText}
                    onClick={() => setTextScale(isLargeText ? 'normal' : 'large')}
                    className={cn(
                        'w-20',
                        isLargeText && 'border-border-brand text-fg-brand hover:bg-brand-soft',
                    )}
                >
                    {isLargeText ? '켜짐' : '꺼짐'}
                </Button>
            </div>
        </section>
    );
}
