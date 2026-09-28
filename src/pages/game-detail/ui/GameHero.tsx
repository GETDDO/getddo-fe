import { motion } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';

/**
 * 게임 대표 영역 — 평소에는 대표 이미지만 보이고, 마우스를 올리거나 키보드로 버튼에 들어오면
 * 어두운 막 위에 제목·소개·게임 시작/게임 방법 버튼이 나타난다.
 * 마우스를 올릴 수 없는 기기(휴대폰 등)에서는 버튼을 누를 수 있도록 항상 보여준다.
 * 피그마 기준 840×546, 테두리 fg/primary 2px, 버튼은 Large(48)
 */
export function GameHero({
    title,
    tagline,
    image,
    onStart,
    onGuide,
}: {
    title: string;
    tagline: string;
    image: string | null;
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
                <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
                <div className="bg-play-lavender-soft absolute inset-0 flex items-center justify-center">
                    <Gamepad2 aria-hidden className="text-fg-tertiary size-16" />
                </div>
            )}
            <div className="bg-action-neutral-pressed/80 absolute inset-0 flex items-center justify-center px-6 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:opacity-0">
                <div className="flex flex-col items-center gap-4 text-center">
                    <h2 className="text-display text-fg-on-brand">{title}</h2>
                    {tagline && <p className="text-subhead text-fg-on-brand">{tagline}</p>}
                    <div className="flex items-center gap-4">
                        {/* 브랜드 버튼 Large(48) — brand/primary 기본·호버·누름 */}
                        <button
                            type="button"
                            onClick={onStart}
                            className="bg-brand-primary hover:bg-brand-primary-hover active:bg-brand-primary-pressed text-fg-on-brand text-body-bold focus-visible:ring-border-focus h-12 min-w-26.5 cursor-pointer rounded-lg px-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                        >
                            게임 시작
                        </button>
                        {/* 보조 버튼 Large(48) — 흰 바탕 + border/strong 테두리 */}
                        <button
                            type="button"
                            onClick={onGuide}
                            className="bg-surface-page border-border-strong text-fg-secondary text-body-bold hover:bg-surface-sunken active:bg-surface-pressed focus-visible:ring-border-focus h-12 min-w-26.5 cursor-pointer rounded-lg border px-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                        >
                            게임 방법
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
