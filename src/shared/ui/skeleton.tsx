import type { ComponentProps, ReactNode } from 'react';

import { cn } from 'cn';

// shadcn 스타일 스켈레톤 — 모양만 담당하고 스크린리더에는 숨긴다.
// 로딩 안내 문구는 사용부가 role="status" + sr-only로 별도 제공해야 한다.
// motion-safe: prefers-reduced-motion 사용자에게는 펄스를 끈다.
function Skeleton({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            aria-hidden="true"
            data-slot="skeleton"
            className={cn('bg-surface-sunken rounded-lg motion-safe:animate-pulse', className)}
            {...props}
        />
    );
}

/**
 * 스켈레톤 조각 + 스크린리더 로딩 안내를 함께 둔다.
 * 스켈레톤이 aria-hidden이라 이 래퍼 없이 쓰면 보조공학은 로딩을 알 수 없다.
 */
function LoadingBlock({
    label = '불러오는 중…',
    className,
    children,
}: {
    label?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div role="status" className={className}>
            <span className="sr-only">{label}</span>
            {children}
        </div>
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
        <div aria-hidden="true" className={cn('flex flex-col gap-3', className)}>
            {Array.from({ length: count }, (_, index) => (
                <Skeleton key={index} className={cn('w-full', rowClassName)} />
            ))}
        </div>
    );
}

/** 카드·섹션 안쪽의 세로 막대 스택 — 카드 프레임이 이미 있는 곳에 쓴다 */
function SkeletonRows({ rows = 3, className }: { rows?: number; className?: string }) {
    return (
        <div aria-hidden="true" className={cn('flex flex-col gap-3', className)}>
            {Array.from({ length: rows }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
            ))}
        </div>
    );
}

/** 관리자 목록 테이블 로딩 모양 — 카드 프레임 안에 헤더 바 + 본문 행 막대를 그린다 */
function TableSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
    return (
        <div
            aria-hidden="true"
            className={cn(
                'bg-surface-page border-border-default overflow-hidden rounded-2xl border',
                className,
            )}
        >
            <div className="border-border-default flex h-11 items-center gap-6 border-b px-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-3 w-16" />
                ))}
            </div>
            <div className="flex flex-col">
                {Array.from({ length: rows }).map((_, i) => (
                    <div
                        key={i}
                        className="border-border-default flex items-center gap-6 border-b px-4 py-3.5 last:border-b-0"
                    >
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/** 카드형 콘텐츠 로딩 모양 — 제목 바 + 필드 행들. 상세·폼 초기 로딩에 쓴다 */
function CardSkeleton({ rows = 6, className }: { rows?: number; className?: string }) {
    return (
        <div
            aria-hidden="true"
            className={cn(
                'bg-surface-page border-border-default rounded-2xl border p-6',
                className,
            )}
        >
            <Skeleton className="h-5 w-40" />
            <div className="mt-6 flex flex-col gap-4">
                {Array.from({ length: rows }).map((_, i) => (
                    <Skeleton key={i} className={cn('h-4', i % 3 === 0 ? 'w-2/3' : 'w-full')} />
                ))}
            </div>
        </div>
    );
}

export { Skeleton, LoadingBlock, SkeletonList, SkeletonRows, TableSkeleton, CardSkeleton };
