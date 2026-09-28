import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

import bakingSprite from '../assets/baking-sprite.png';

/** 스프라이트(피그마 image 88) — 가로로 이어진 12프레임, 한 프레임 240×270 */
const FRAME_COUNT = 12;

const BAKING_LABEL = '타코야끼 굽는 중…';

export { bakingSprite as BAKING_SPRITE_SRC };

/**
 * 출석 굽기 연출 — 타코야끼를 굽는 12프레임 스프라이트를 한 번 재생하고 마지막 프레임에서 멈춘다.
 * 프레임을 뚝뚝 넘기도록 steps() 타이밍을 쓰고, Web Animations API로 재생해 공용 CSS 키프레임이 필요 없다.
 * 동작 줄이기 설정이면 완성된 마지막 장면만 보여준다
 */
export function AttendanceBakingStage({
    durationMs,
    className,
}: {
    durationMs: number;
    className?: string;
}) {
    const spriteRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = spriteRef.current;
        if (!el) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            el.style.backgroundPosition = '100% 0';
            return;
        }
        // background-size가 12배라 0%→100%가 첫 프레임→마지막 프레임, 12단계로 끊어 넘긴다
        const animation = el.animate(
            [{ backgroundPosition: '0% 0' }, { backgroundPosition: '100% 0' }],
            { duration: durationMs, easing: `steps(${FRAME_COUNT}, jump-none)`, fill: 'forwards' },
        );
        return () => animation.cancel();
    }, [durationMs]);

    return (
        <div
            role="status"
            aria-label={BAKING_LABEL}
            className={`flex flex-col items-center justify-center gap-3 ${className ?? ''}`}
        >
            <div
                ref={spriteRef}
                aria-hidden
                className="aspect-[240/270] w-44 bg-no-repeat"
                style={{
                    backgroundImage: `url(${bakingSprite})`,
                    backgroundSize: `${FRAME_COUNT * 100}% 100%`,
                    backgroundPosition: '0% 0',
                }}
            />
            {/* 글자가 앞에서부터 한 글자씩 통통 튀어 오른다 (동작 줄이기 설정이면 멈춰 있다) */}
            <span aria-hidden className="text-body-bold text-fg-primary flex">
                {[...BAKING_LABEL].map((char, index) => (
                    <motion.span
                        key={index}
                        className="inline-block whitespace-pre"
                        animate={{ y: [0, -6, 0] }}
                        transition={{
                            duration: 0.5,
                            delay: index * 0.06,
                            repeat: Infinity,
                            repeatDelay: 0.3,
                            ease: 'easeOut',
                        }}
                    >
                        {char}
                    </motion.span>
                ))}
            </span>
        </div>
    );
}
