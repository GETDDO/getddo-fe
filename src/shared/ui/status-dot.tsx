import { cn } from 'cn';
import * as React from 'react';

const TONES = {
    // 진행·참여 가능 등 지금 할 수 있는 상태 — 점과 글자 모두 브랜드색
    brand: { dot: 'bg-brand-primary', text: 'text-fg-brand' },
    // 오픈 예정 등 안내 — 점은 브랜드색, 글자는 보조색
    info: { dot: 'bg-brand-primary', text: 'text-fg-secondary' },
    // 종료·완료 — 점과 글자 모두 흐리게
    muted: { dot: 'bg-fg-disabled', text: 'text-fg-tertiary' },
} as const;

/**
 * 상태 점 — '● 응모 마감 · 발표 예정'처럼 작은 점(5px) 뒤에 상태 글자를 붙인다 (피그마 홈, 글자 12 Medium).
 * tone: brand(지금 가능) · info(예정 안내) · muted(종료·완료)
 */
function StatusDot({
    tone = 'brand',
    className,
    children,
    ...props
}: React.ComponentProps<'span'> & { tone?: keyof typeof TONES }) {
    const { dot, text } = TONES[tone];
    return (
        <span
            data-slot="status-dot"
            className={cn(
                'flex items-center gap-2 text-xs leading-[1.125rem] font-medium',
                text,
                className,
            )}
            {...props}
        >
            <span aria-hidden className={cn('size-1.25 shrink-0 rounded-full', dot)} />
            {children}
        </span>
    );
}

export { StatusDot };
