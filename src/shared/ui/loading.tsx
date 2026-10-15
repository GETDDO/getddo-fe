import { cn } from 'cn';

import takoyakiDizzy from '@shared/assets/loading/takoyaki-dizzy.webp';

const SIZE = {
    /** 버튼·작은 칸 안 */
    sm: { image: 'size-8', gap: 'gap-2', padding: 'py-4' },
    /** 카드·모달 안 */
    md: { image: 'size-14', gap: 'gap-3', padding: 'py-10' },
    /** 페이지 전체 */
    lg: { image: 'size-20', gap: 'gap-4', padding: 'min-h-[50vh]' },
} as const;

/**
 * 로딩 — 눈이 빙글빙글한 타코야키(피그마 image 83)가 돈다.
 * 모양을 미리 알 수 있는 목록·카드는 스켈레톤(Skeleton)을 쓰고, 이것은 페이지·모달처럼 모양을 알 수 없는 자리에 쓴다.
 * 동작 줄이기 설정이면 돌지 않고 글자로 알린다
 */
function Loading({
    label = '불러오는 중이에요',
    size = 'md',
    className,
}: {
    label?: string;
    size?: keyof typeof SIZE;
    className?: string;
}) {
    const style = SIZE[size];
    return (
        <div
            role="status"
            data-slot="loading"
            className={cn(
                'flex flex-col items-center justify-center',
                style.gap,
                style.padding,
                className,
            )}
        >
            <img
                src={takoyakiDizzy}
                alt=""
                className={cn(style.image, 'motion-safe:animate-[spin_1.6s_linear_infinite]')}
            />
            <span className="text-body-sm text-fg-tertiary">{label}</span>
        </div>
    );
}

export { Loading };
