import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

import type { TicketGrade } from '../model/types';

import { TICKET_GRADE_IMAGE } from '../model/gradeImage';

/**
 * 등급 응모권 공개 — 뒷면(?) 카드가 뒤집히며 받은 등급의 응모권 그림(피그마 image 193)을 보여 준다.
 * 골드는 응모권 모양을 따라 빛이 한 번 스치고 반짝인다.
 * 게임·미션 보상 모달이 같이 쓴다. 동작 줄이기 설정이면 뒤집지 않고 바로 앞면을 보여 준다.
 * 등급은 서버가 추첨한 값을 그대로 받는다 (getddo-spec 응모권 등급 추첨)
 */
export function TicketGradeReveal({ grade }: { grade: TicketGrade }) {
    const reduceMotion = useReducedMotion();
    const image = TICKET_GRADE_IMAGE[grade];
    const flip = reduceMotion
        ? { initial: false as const, animate: { rotateY: 0 } }
        : {
              initial: { rotateY: 180, scale: 0.85 },
              animate: { rotateY: 0, scale: 1 },
              transition: { delay: 0.35, duration: 0.55, ease: [0.2, 0.8, 0.3, 1.2] as const },
          };

    return (
        // 응모권 그림 비율(가로 5 : 세로 3)
        <div className="relative mt-2 aspect-[5/3] w-36 [perspective:600px]" aria-hidden>
            <motion.div className="relative size-full [transform-style:preserve-3d]" {...flip}>
                {/* 앞면 — 받은 등급의 응모권 */}
                <div className="absolute inset-0 [backface-visibility:hidden]">
                    <img
                        src={image}
                        alt=""
                        draggable={false}
                        className="size-full object-contain drop-shadow-md"
                    />
                    {/* 골드 — 응모권 모양 안에서만 빛이 한 번 스친다 */}
                    {grade === 'GOLD' && !reduceMotion && (
                        <span
                            className="absolute inset-0 overflow-hidden"
                            style={{
                                maskImage: `url(${image})`,
                                maskSize: 'contain',
                                maskRepeat: 'no-repeat',
                                maskPosition: 'center',
                            }}
                        >
                            <motion.span
                                className="absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-linear-to-r from-transparent via-white/80 to-transparent"
                                initial={{ x: '0%' }}
                                animate={{ x: '400%' }}
                                transition={{ delay: 0.95, duration: 0.7, ease: 'easeOut' }}
                            />
                        </span>
                    )}
                </div>
                {/* 뒷면 — 아직 모르는 등급 (같은 응모권 모양을 어둡게) */}
                <div className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                    <img
                        src={image}
                        alt=""
                        draggable={false}
                        className="size-full object-contain brightness-[0.25] grayscale"
                    />
                    <span className="text-fg-on-brand text-title-1 absolute inset-0 flex items-center justify-center font-extrabold">
                        ?
                    </span>
                </div>
            </motion.div>
            {/* 골드 — 응모권 둘레 반짝임 */}
            {grade === 'GOLD' && !reduceMotion && (
                <motion.span
                    className="text-grade-gold absolute -top-3 -right-2"
                    initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
                    animate={{ opacity: [0, 1, 1, 0.9], scale: [0.4, 1.2, 1, 1], rotate: 0 }}
                    transition={{ delay: 0.9, duration: 0.6 }}
                >
                    <Sparkles className="size-7" />
                </motion.span>
            )}
        </div>
    );
}
