import { Gift } from 'lucide-react';

import { cn } from '@shared/lib/utils';

interface RaffleThumbnailProps {
    src: string | null | undefined;
    className?: string;
    /** 아이콘 대체 이미지 크기 — 썸네일이 작을수록 줄인다 */
    fallbackIconClassName?: string;
}

/**
 * 래플 상품 썸네일.
 *
 * 상품 사진은 비율이 제각각이라 object-cover로 채우면 잘린다. 바탕을 깔고 contain으로 맞춘다.
 * 칸은 1:1로 둔다 — 상품 그림은 정사각(DESIGN-SYSTEM '이미지 비율'). 크기는 너비만 정해 넘긴다.
 * 상품 사진은 대개 흰 배경이라 회색 칸 위에 흰 사각형이 뜬다 — 곱하기 섞기로 흰 배경을 칸 색에 녹인다.
 * 이미지는 서버가 주는 값이라 없을 수 있어 대체 아이콘을 둔다.
 */
export function RaffleThumbnail({
    src,
    className,
    fallbackIconClassName = 'size-8',
}: RaffleThumbnailProps) {
    return (
        <div className={cn('bg-surface-sunken aspect-square shrink-0 overflow-hidden', className)}>
            {src ? (
                <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className="size-full object-contain p-[8%] mix-blend-multiply dark:mix-blend-normal"
                />
            ) : (
                <div className="flex size-full items-center justify-center">
                    <Gift className={cn('text-fg-disabled', fallbackIconClassName)} />
                </div>
            )}
        </div>
    );
}
