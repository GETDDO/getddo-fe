import { motion } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';

import { GameImageButton } from '@features/play-game';

/**
 * 게임 대표 영역 — 평소에는 대표 이미지만 보이고, 마우스를 올리거나 키보드로 버튼에 들어오면
 * 어두운 막 위에 제목·소개·게임 시작/게임 방법 버튼이 나타난다.
 * 마우스를 올릴 수 없는 기기(휴대폰 등)에서는 버튼을 누를 수 있도록 항상 보여준다.
 * 피그마 기준 840×546, 테두리 fg/primary 2px. 버튼은 도트 그림 버튼 Large(48)
 */
export function GameHero({
    title,
    tagline,
    image,
    imagePosition,
    onStart,
    onGuide,
}: {
    title: string;
    tagline: string;
    image: string | null;
    /** 대표 이미지가 비율 차이로 잘릴 때 보여줄 기준점 (CSS object-position) */
    imagePosition?: string;
    onStart: () => void;
    onGuide: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="group bg-surface-page border-fg-primary relative aspect-[840/546] w-full overflow-hidden rounded-2xl border-2 shadow-md"
        >
            {image ? (
                <img
                    src={image}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                    style={{ objectPosition: imagePosition }}
                />
            ) : (
                <div className="bg-play-lavender-soft absolute inset-0 flex items-center justify-center">
                    <Gamepad2 aria-hidden className="text-fg-tertiary size-16" />
                </div>
            )}
            <div className="bg-action-neutral-pressed/80 absolute inset-0 flex items-center justify-center px-6 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:opacity-0">
                {/* 제목·소개와 버튼 사이는 32px로 띄워 버튼이 따로 보이게 한다 */}
                <div className="flex flex-col items-center gap-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <h2 className="text-display text-fg-on-brand">{title}</h2>
                        {tagline && <p className="text-subhead text-fg-on-brand">{tagline}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                        {/* 도트 버튼 Large(48) — 피그마 image 109 */}
                        <GameImageButton kind="start" onClick={onStart} />
                        <GameImageButton kind="guide" onClick={onGuide} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
