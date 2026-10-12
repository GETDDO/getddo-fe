import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Ticket } from 'lucide-react';

import type { TicketGrade } from '../model/types';

import { TICKET_GRADE_LABEL } from '../model/grade';

/** 등급별 카드 색 — 진한 색은 테두리·글자, soft는 바탕 (디자인 토큰 grade/*) */
const GRADE_STYLE: Record<TicketGrade, { card: string; text: string }> = {
    BRONZE: { card: 'bg-grade-bronze-soft border-grade-bronze', text: 'text-grade-bronze' },
    SILVER: { card: 'bg-grade-silver-soft border-grade-silver', text: 'text-grade-silver' },
    GOLD: { card: 'bg-grade-gold-soft border-grade-gold', text: 'text-grade-gold' },
};

/**
 * 등급 응모권 공개 — 뒷면(?) 카드가 뒤집히며 받은 등급을 보여 준다. 골드는 빛이 한 번 스치고 반짝인다.
 * 게임·미션 보상 모달이 같이 쓴다. 동작 줄이기 설정이면 뒤집지 않고 바로 앞면을 보여 준다.
 * 등급은 서버가 추첨한 값을 그대로 받는다 (getddo-spec 응모권 등급 추첨)
 */
export function TicketGradeReveal({ grade }: { grade: TicketGrade }) {
    const reduceMotion = useReducedMotion();
    const style = GRADE_STYLE[grade];
    const flip = reduceMotion
        ? { initial: false as const, animate: { rotateY: 0 } }
        : {
              initial: { rotateY: 180, scale: 0.85 },
              animate: { rotateY: 0, scale: 1 },
              transition: { delay: 0.35, duration: 0.55, ease: [0.2, 0.8, 0.3, 1.2] as const },
          };

    return (
        <div className="relative mt-2 h-28 w-44 [perspective:600px]" aria-hidden>
            <motion.div className="relative size-full [transform-style:preserve-3d]" {...flip}>
                {/* 앞면 — 받은 등급 */}
                <div
                    className={`absolute inset-0 flex flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border-2 shadow-md [backface-visibility:hidden] ${style.card}`}
                >
                    <Ticket className={`size-7 ${style.text}`} strokeWidth={2.4} />
                    <span className={`text-title-3 leading-none font-extrabold ${style.text}`}>
                        {TICKET_GRADE_LABEL[grade]}
                    </span>
                    <span className="text-caption text-fg-secondary">응모권 1장</span>
                    {/* 골드 — 빛이 한 번 스친다 */}
                    {grade === 'GOLD' && !reduceMotion && (
                        <motion.span
                            className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-linear-to-r from-transparent via-white/70 to-transparent"
                            initial={{ x: '0%' }}
                            animate={{ x: '400%' }}
                            transition={{ delay: 0.95, duration: 0.7, ease: 'easeOut' }}
                        />
                    )}
                </div>
                {/* 뒷면 — 아직 모르는 등급 */}
                <div className="bg-surface-inverse text-fg-on-brand absolute inset-0 flex [transform:rotateY(180deg)] items-center justify-center rounded-xl shadow-md [backface-visibility:hidden]">
                    <span className="text-title-1 font-extrabold">?</span>
                </div>
            </motion.div>
            {/* 골드 — 카드 둘레 반짝임 */}
            {grade === 'GOLD' && !reduceMotion && (
                <motion.span
                    className="text-grade-gold absolute -top-3 -right-3"
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
