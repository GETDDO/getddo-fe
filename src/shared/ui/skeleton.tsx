import { cn } from 'cn';
import * as React from 'react';

/**
 * 스켈레톤 — 불러오는 동안 내용 자리에 회색 모양을 둔다 (shadcn skeleton).
 *
 * 기준 (모든 화면 공통)
 * - 모양을 미리 아는 곳(페이지·목록·카드)은 스켈레톤, 모양이 없거나 기다림 자체가 내용인 곳(게임 준비 등)은 Loading
 * - 실제 화면을 1:1로 따라 그리지 않는다. 카드·그림 자리는 큰 둥근 면(SkeletonCard), 글자 자리는 둥근 막대(SkeletonText)
 * - 글 막대는 16px보다 얇게 두지 않는다 — 가는 선이 여러 줄이면 지저분해 보인다
 * - 데이터 없이 쓰는 고정 제목·설명은 스켈레톤으로 가리지 않고 그대로 보인다
 * - 바깥 크기는 실제 내용과 맞춰 다 불러온 뒤 자리가 밀리지 않게 한다
 *
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

/**
 * 글 막대 — 제목·설명·숫자 자리. 높이로 글 크기, 너비로 길이를 대강 흉내 낸다 (기본 16px, 제목은 h-6~h-8).
 * 숫자 하나만 비는 자리(예: "-장" 대신)에도 글 속에 넣을 수 있게 span·inline-block으로 그린다
 */
function SkeletonText({ className }: { className?: string }) {
    return (
        <span
            data-slot="skeleton"
            aria-hidden
            className={cn(
                'bg-surface-sunken inline-block h-4 w-full rounded-full align-middle motion-safe:animate-pulse',
                className,
            )}
        />
    );
}

/** 섹션 머리 — 제목 막대와 (있으면) 옆 설명 막대. 제목이 데이터에 따라 바뀌는 화면에서만 쓴다 */
function SkeletonHeading({
    caption = false,
    className,
}: {
    caption?: boolean;
    className?: string;
}) {
    return (
        <div aria-hidden className={cn('flex items-center gap-3', className)}>
            <SkeletonText className="h-7 w-32" />
            {caption && <SkeletonText className="w-48" />}
        </div>
    );
}

/** 카드 자리 — 큰 둥근 면 하나. 크기(높이·너비)만 실제 카드와 맞춘다 */
function SkeletonCard({ className }: { className?: string }) {
    return <Skeleton className={cn('w-full rounded-2xl', className)} />;
}

/** 줄 목록 — 내역·알림처럼 같은 꼴의 줄이 이어지는 목록. 줄마다 제목·보조 막대와 오른쪽 짧은 값 막대 */
function SkeletonList({
    count = 3,
    rowClassName = 'h-14',
    thumbnailClassName,
    className,
}: {
    count?: number;
    /** 한 줄의 높이 — 실제 줄과 맞춘다 */
    rowClassName?: string;
    /** 줄 왼쪽 그림 자리 (예: 'size-10 rounded-full') — 없으면 그리지 않는다 */
    thumbnailClassName?: string;
    className?: string;
}) {
    return (
        <div aria-hidden className={cn('flex flex-col gap-3', className)}>
            {Array.from({ length: count }, (_, index) => (
                <div key={index} className={cn('flex w-full items-center gap-3', rowClassName)}>
                    {thumbnailClassName && (
                        <Skeleton className={cn('shrink-0', thumbnailClassName)} />
                    )}
                    <div className="flex flex-1 flex-col gap-2">
                        <SkeletonText className="h-5 w-2/5" />
                        <SkeletonText className="w-1/4" />
                    </div>
                    <SkeletonText className="h-5 w-10 shrink-0" />
                </div>
            ))}
        </div>
    );
}

/**
 * 상세 페이지 — 그림 면 + 제목·설명 막대·버튼 면, 아래 안내 카드 면.
 * 래플·게임·미션 상세가 함께 쓴다 (media=null이면 그림 없이 머리만)
 */
function SkeletonDetail({
    media = 'square',
    className,
}: {
    media?: 'square' | 'video' | null;
    className?: string;
}) {
    return (
        <div aria-hidden className={cn('flex flex-col gap-10', className)}>
            <div className={cn('grid gap-8', media && 'md:grid-cols-2')}>
                {media && (
                    <SkeletonCard
                        className={media === 'square' ? 'aspect-square max-h-110' : 'aspect-video'}
                    />
                )}
                <div className="flex flex-col gap-4">
                    <SkeletonText className="h-6 w-20" />
                    <SkeletonText className="h-9 w-4/5" />
                    <SkeletonText className="h-5 w-full" />
                    <SkeletonText className="h-5 w-2/3" />
                    <Skeleton className="mt-4 h-12 w-full rounded-xl md:mt-auto" />
                </div>
            </div>
            <SkeletonCard className="h-48" />
        </div>
    );
}

export { Skeleton, SkeletonCard, SkeletonDetail, SkeletonHeading, SkeletonList, SkeletonText };
