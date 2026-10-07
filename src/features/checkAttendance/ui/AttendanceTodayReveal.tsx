import { motion } from 'framer-motion';

import { REVEAL_BAKE_MS, REVEAL_HIT_AT, REVEAL_LAND_MS } from '../model/attendanceMotion';
import { BATTER_MASCOT } from '../model/mascots';

export type TodayRevealStage = 'baking' | 'landing';

/**
 * 출석 직후 오늘 칸 연출.
 * 1) baking — 옅은 회색 반죽이 통통 흔들리며 점점 진한 색으로 구워진다
 * 2) landing — 오늘의 타코야끼가 위에서 곧장 떨어져 '쾅' 찍히며 납작하게 눌렸다 돌아온다
 */
export function AttendanceTodayReveal({
    stage,
    day,
    mascotSrc,
}: {
    stage: TodayRevealStage;
    day: number;
    mascotSrc: string;
}) {
    const baking = stage === 'baking';
    return (
        <span aria-hidden className="relative flex size-[86%] items-center justify-center">
            <motion.img
                src={BATTER_MASCOT.src}
                alt=""
                className="absolute inset-0 size-full object-contain"
                initial={{ opacity: 0.45, filter: 'grayscale(1) brightness(1.1)' }}
                animate={
                    baking
                        ? {
                              opacity: 1,
                              filter: 'grayscale(0) brightness(0.95)',
                              y: [0, -2.5, 0, -2, 0, -1.5, 0],
                              rotate: [0, -3, 3, -2, 2, -1, 0],
                          }
                        : { opacity: 0, scale: 0.7 }
                }
                transition={
                    baking
                        ? { duration: REVEAL_BAKE_MS / 1000, ease: 'easeInOut' }
                        : { duration: 0.15 }
                }
            />
            <motion.span
                className="text-body-bold text-fg-secondary relative leading-4.5"
                animate={{ opacity: baking ? [1, 1, 0] : 0 }}
                transition={{ duration: REVEAL_BAKE_MS / 1000, times: [0, 0.5, 1] }}
            >
                {day}
            </motion.span>
            {!baking && (
                <motion.img
                    src={mascotSrc}
                    alt=""
                    className="absolute inset-0 size-full object-contain drop-shadow-[0_2px_2px_rgb(from_var(--color-ink)_r_g_b_/_0.18)]"
                    style={{ originY: 1 }}
                    initial={{ opacity: 0, y: -40 }}
                    animate={{
                        opacity: 1,
                        y: [-40, 0, 0],
                        // 판에 닿는 순간 옆으로 퍼지며 납작해졌다가 살짝 튀어 제 모양으로 돌아온다
                        scaleX: [1, 1, 1.18, 0.96, 1],
                        scaleY: [1, 1, 0.78, 1.06, 1],
                    }}
                    transition={{
                        duration: REVEAL_LAND_MS / 1000,
                        opacity: { duration: 0.08 },
                        // 떨어질 때는 점점 빨라진다(ease-in)
                        y: {
                            duration: REVEAL_LAND_MS / 1000,
                            times: [0, REVEAL_HIT_AT, 1],
                            ease: ['easeIn', 'linear'],
                        },
                        scaleX: {
                            duration: REVEAL_LAND_MS / 1000,
                            times: [0, REVEAL_HIT_AT, 0.65, 0.85, 1],
                        },
                        scaleY: {
                            duration: REVEAL_LAND_MS / 1000,
                            times: [0, REVEAL_HIT_AT, 0.65, 0.85, 1],
                        },
                    }}
                />
            )}
        </span>
    );
}
