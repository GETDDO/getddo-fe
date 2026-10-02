import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import { Slot } from 'radix-ui';
import * as React from 'react';

/**
 * 버튼 — 피그마 01 Design System > 04 Button 기준.
 * 이름은 색이 아니라 역할로 붙인다 (색이 바뀌어도 쓰는 곳은 그대로):
 * primary(기본, 화면의 주된 행동 — action/neutral 검정) · secondary(보조 행동 — 흰 바탕+border/strong 테두리)
 * · emphasis(드물게 쓰는 아주 중요한 행동 — brand/primary 핑크).
 * 크기: sm 36(글자 14) · default 40(글자 16) · lg 48(글자 16), 모두 SemiBold·모서리 8·좌우 12.
 * 각 색은 기본·호버·누름 토큰을 쓰고, 비활성은 surface/disabled 바탕에 fg/disabled 글자다.
 * 글자 크기는 text-sm/text-base(14/16px)로 둔다 — 커스텀 타이포 토큰(text-body-bold 등)은 공용 cn이 글자색과 같은 묶음으로 보고 색을 지운다
 */
const buttonVariants = cva(
    "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-transparent bg-clip-padding whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:pointer-events-none disabled:border-transparent disabled:bg-surface-disabled disabled:text-fg-disabled aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                // 주된 행동 — action/neutral (피그마 Button/*/active)
                primary:
                    'bg-action-neutral text-fg-on-brand hover:bg-action-neutral-hover active:bg-action-neutral-pressed',
                // 보조 행동 — outline (피그마 Button/*/outline)
                secondary:
                    'bg-surface-page border-border-strong text-fg-secondary hover:bg-surface-sunken active:bg-surface-pressed',
                // 강조 — brand (피그마 Button/*/brand), 자주 쓰지 않는다
                emphasis:
                    'bg-brand-primary text-fg-on-brand hover:bg-brand-primary-hover active:bg-brand-primary-pressed',
                /** @deprecated primary와 같다 — 예전 이름 호환 (쓰는 곳을 primary로 바꾸면 지운다) */
                default:
                    'bg-action-neutral text-fg-on-brand hover:bg-action-neutral-hover active:bg-action-neutral-pressed',
                /** @deprecated secondary와 같다 — 예전 이름 호환 (쓰는 곳을 secondary로 바꾸면 지운다) */
                outline:
                    'bg-surface-page border-border-strong text-fg-secondary hover:bg-surface-sunken active:bg-surface-pressed',
                ghost: 'text-fg-secondary hover:bg-surface-sunken hover:text-fg-primary active:bg-surface-pressed aria-expanded:bg-surface-sunken',
                destructive:
                    'bg-semantic-error text-fg-on-brand hover:bg-semantic-error-strong active:bg-semantic-error-strong',
                link: 'text-fg-brand underline-offset-4 hover:underline',
            },
            size: {
                sm: 'h-9 px-3 text-sm font-semibold',
                default: 'h-10 px-3 text-base font-semibold',
                lg: 'h-12 px-3 text-base font-semibold',
                // 아이콘만 있는 버튼 (정사각형)
                icon: 'size-10',
                'icon-sm': 'size-7 rounded-md',
                'icon-xs': "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
                'icon-lg': 'size-12',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'default',
        },
    },
);

function Button({
    className,
    variant = 'primary',
    size = 'default',
    asChild = false,
    ...props
}: React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
    }) {
    const Comp = asChild ? Slot.Root : 'button';

    return (
        <Comp
            data-slot="button"
            data-variant={variant}
            data-size={size}
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Button, buttonVariants };
