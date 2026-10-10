import type { MotionValue } from 'framer-motion';

import { motion, useReducedMotion, useTransform } from 'framer-motion';

import { TakkoFace } from './TakkoFace';

const FACE_SIZE = 30;

/**
 * 한 문제 제한 시간 게이지 — 타꼬런 진행도처럼 타코야끼 얼굴이 게이지 끝에 붙어 함께 줄어든다.
 * 얼마 안 남으면(hurry) 게이지가 빨개지고 얼굴이 동동 흔들린다 (동작 줄이기 설정이면 흔들리지 않는다)
 */
export function ColorWordTimer({
    timeLeft,
    hurry,
}: {
    /** 남은 시간 비율 1 → 0 */
    timeLeft: MotionValue<number>;
    hurry: boolean;
}) {
    const reduceMotion = useReducedMotion();
    // 게이지 전체 폭의 틀을 남은 비율만큼 옮겨, 그 왼쪽 끝에 붙은 얼굴이 게이지 끝을 따라가게 한다
    const faceX = useTransform(timeLeft, (value) => `${value * 100}%`);
    const wobble = hurry && !reduceMotion;

    return (
        <div aria-hidden className="pointer-events-none relative h-8">
            <div className="bg-surface-inverse/30 ring-surface-inverse/50 absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 overflow-hidden rounded-full ring-2">
                <motion.div
                    style={{ scaleX: timeLeft }}
                    className={`h-full origin-left rounded-full transition-colors duration-300 ${hurry ? 'bg-semantic-error' : 'bg-ticket-primary'}`}
                />
            </div>
            <motion.div style={{ x: faceX }} className="absolute inset-0">
                <motion.div
                    animate={wobble ? { rotate: [0, -12, 12, -8, 0] } : { rotate: 0 }}
                    transition={wobble ? { duration: 0.6, repeat: Infinity } : { duration: 0.2 }}
                    className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-[60%] drop-shadow-md"
                >
                    <TakkoFace size={FACE_SIZE} />
                </motion.div>
            </motion.div>
        </div>
    );
}
