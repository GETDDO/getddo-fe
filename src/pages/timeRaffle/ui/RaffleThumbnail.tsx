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
 * 이미지는 서버가 주는 값이라 없을 수 있어 대체 아이콘을 둔다.
 */
export function RaffleThumbnail({
    src,
    className,
    fallbackIconClassName = 'size-8',
}: RaffleThumbnailProps) {
    return (
        <div className={cn('bg-surface-sunken shrink-0 overflow-hidden', className)}>
            {src ? (
                <img src={src} alt="" loading="lazy" className="size-full object-contain" />
            ) : (
                <div className="flex size-full items-center justify-center">
                    <Gift className={cn('text-fg-disabled', fallbackIconClassName)} />
                </div>
            )}
        </div>
    );
}
