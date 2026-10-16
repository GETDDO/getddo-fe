import { cn } from 'cn';
import * as React from 'react';

/**
 * 카드 — 디자인 시스템(피그마 05 Card) 기준: 흰 바탕(surface/page)·모서리 16px·그림자 md·안쪽 여백 16.
 * size: default(여백 16 — 그리드 속 좁은 카드) · lg(여백 20 — 폭 500 이상 넓은 카드) · sm(여백 12).
 * 안쪽 여백은 --card-spacing 변수라, 카드에 직접 p-(--card-spacing)을 주면 size를 따라간다
 * variant: outlined(기본, border/default 1px) · elevated(테두리 없이 그림자만 — 홈 이벤트 카드 등)
 * 색은 테마 변수(bg-card 등) 대신 토큰으로 고정해, OS가 다크 모드여도 까맣게 바뀌지 않는다
 */
function Card({
    className,
    size = 'default',
    variant = 'outlined',
    ...props
}: React.ComponentProps<'div'> & {
    size?: 'default' | 'sm' | 'lg';
    variant?: 'outlined' | 'elevated';
}) {
    return (
        <div
            data-slot="card"
            data-size={size}
            data-variant={variant}
            className={cn(
                'group/card bg-surface-page text-fg-primary border-border-default flex flex-col gap-(--card-spacing) overflow-hidden rounded-2xl border py-(--card-spacing) text-sm shadow-md [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=lg]:[--card-spacing:--spacing(5)] data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 data-[variant=elevated]:border-transparent *:[img:first-child]:rounded-t-2xl *:[img:last-child]:rounded-b-2xl',
                className,
            )}
            {...props}
        />
    );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-header"
            className={cn(
                'group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-2xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)',
                className,
            )}
            {...props}
        />
    );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-title"
            className={cn(
                'font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm',
                className,
            )}
            {...props}
        />
    );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-description"
            className={cn('text-fg-tertiary text-sm', className)}
            {...props}
        />
    );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-action"
            className={cn(
                'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
                className,
            )}
            {...props}
        />
    );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div data-slot="card-content" className={cn('px-(--card-spacing)', className)} {...props} />
    );
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-footer"
            className={cn(
                'bg-surface-sunken border-border-default flex items-center rounded-b-2xl border-t p-(--card-spacing)',
                className,
            )}
            {...props}
        />
    );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
