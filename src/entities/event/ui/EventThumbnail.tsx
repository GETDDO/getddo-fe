import { Gift } from 'lucide-react';

import { cn } from '@shared/lib/utils';

/**
 * 목록 줄 앞의 작은 경품 썸네일 — 비율이 제각각인 상품 사진이 잘리지 않게 회색 바탕에 contain으로 맞춘다.
 * 이미지는 서버 값이라 없을 수 있어 선물 아이콘으로 대신한다
 */
export function EventThumbnail({
    src,
    className,
}: {
    src: string | null | undefined;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'bg-surface-sunken flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg',
                className,
            )}
        >
            {src ? (
                <img src={src} alt="" loading="lazy" className="size-full object-contain" />
            ) : (
                <Gift aria-hidden className="text-fg-disabled size-5" />
            )}
        </div>
    );
}
