import { cn } from 'cn';
import * as React from 'react';

/**
 * 스켈레톤 — 불러오는 동안 실제 내용 자리에 같은 크기의 회색 덩어리를 둔다 (shadcn skeleton).
 * 다 불러온 뒤 자리가 밀리지 않도록 크기·모서리는 그 자리에 올 내용과 맞춘다.
 * 동작 줄이기 설정이면 깜빡이지 않고 회색으로만 둔다. 내용이 아니라 화면 낭독기에서는 감춘다
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="skeleton"
            aria-hidden
            className={cn('bg-surface-sunken rounded-lg motion-safe:animate-pulse', className)}
            {...props}
        />
    );
}

/** 줄 목록 스켈레톤 — 내역·알림처럼 같은 높이의 줄이 이어지는 목록 */
function SkeletonList({
    count = 3,
    rowClassName = 'h-14',
    className,
}: {
    count?: number;
    /** 한 줄의 높이·모양 — 실제 줄과 맞춘다 */
    rowClassName?: string;
    className?: string;
}) {
    return (
        <div aria-hidden className={cn('flex flex-col gap-3', className)}>
            {Array.from({ length: count }, (_, index) => (
                <Skeleton key={index} className={cn('w-full', rowClassName)} />
            ))}
        </div>
    );
}

export { Skeleton, SkeletonList };
