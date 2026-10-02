import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import * as React from 'react';

/**
 * 배지 — 상태·분류·수치를 짧게 보여주는 둥근 알약 (피그마 홈 기준).
 * variant: brand(진행중·모집중·D-day 등 강조, 핑크 채움) · info(카테고리, 파란 테두리) ·
 * neutral(시간 등 보조 정보, 회색) · accent(참여자 수 등 응모권 노란 바탕) · outline(흰 바탕+테두리) · surface(흰 바탕).
 * size: sm 24 · md 28 (글자 12 Medium) · lg 28 · xl 34 (글자 14 SemiBold). 아이콘은 children으로 넣는다.
 * 글자 크기는 text-xs/text-sm으로 둔다 — 커스텀 타이포 토큰은 공용 cn이 글자색과 같은 묶음으로 보고 색을 지운다
 */
const badgeVariants = cva(
    "inline-flex text-xs leading-[1.125rem] font-medium shrink-0 items-center gap-1 rounded-full border border-transparent px-3 whitespace-nowrap [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                brand: 'bg-brand-primary text-fg-on-brand',
                info: 'bg-status-active text-status-active-text border-status-active-text',
                neutral: 'bg-surface-sunken text-fg-secondary',
                accent: 'bg-ticket-accent text-fg-primary',
                outline: 'bg-surface-page text-fg-secondary border-border-default',
                // 흰 바탕 알약 — 배너 위 마감 시간처럼 색 배경 위에 띄울 때
                surface: 'bg-surface-page text-fg-primary',
            },
            size: {
                sm: 'h-6 py-0.5',
                md: 'h-7 py-1',
                // 시간 등 숫자를 또렷하게 — 높이 28, 글자 14 SemiBold
                lg: 'h-7 py-1 text-sm font-semibold',
                // 큰 알약 — 높이 34, 글자 14 SemiBold, 아이콘 18 (배너 마감 시간)
                xl: "h-8.5 py-2 text-sm leading-3.5 font-semibold [&_svg:not([class*='size-'])]:size-4.5",
            },
        },
        defaultVariants: {
            variant: 'neutral',
            size: 'sm',
        },
    },
);

function Badge({
    className,
    variant,
    size,
    ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
    return (
        <span
            data-slot="badge"
            className={cn(badgeVariants({ variant, size }), className)}
            {...props}
        />
    );
}

export { Badge, badgeVariants };
