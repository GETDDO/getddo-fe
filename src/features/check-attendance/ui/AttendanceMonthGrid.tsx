import { motion } from 'framer-motion';
import { useRef, useState } from 'react';

import { cn } from '@shared/lib/utils';

import type { AttendanceMonthDay } from '../lib/attendance-week';

import { isStreakBonusDate } from '../lib/attendance-week';
import { DIZZY_MASCOT, getAttendanceMascot } from './mascots';

/** 이 시간 안에 이만큼 누르면 타코야끼가 어지러워한다 */
const DIZZY_CLICKS = 5;
const DIZZY_WINDOW_MS = 2500;
const DIZZY_DURATION_MS = 2200;
/** 어지러움에서 돌아오는 연출 시간 — 얼굴이 스르르 바뀌며 가볍게 털어낸다 */
const RECOVER_MS = 700;

/**
 * 이번 달 출석판 — 한 줄 8칸, 1일부터 순서대로 채운다(요일과 무관). 28~31일 모두 4줄 안에 들어간다.
 * - 모든 칸은 회색 타코야끼 판이고, 출석한 날은 그 판 위에 기본 타코야끼가 올라간다
 * - 연속 출석 보상일(관리자 정책)은 날짜 대신 세 마리 타코야끼 (출석 전 회색 → 출석하면 원본)
 * - 출석한 타코야끼를 누르면 뒤집히고, 너무 많이 누르면 잠깐 어지러워했다가 스르르 돌아온다
 */
export function AttendanceMonthGrid({
    days,
    bonusDays,
    revealDate,
}: {
    days: AttendanceMonthDay[];
    bonusDays: ReadonlySet<number>;
    /** 방금 출석한 날 — 판 위에 타코야끼가 톡 올라오는 연출을 준다 */
    revealDate?: string | null;
}) {
    const [flips, setFlips] = useState<Record<string, number>>({});
    const [dizzy, setDizzy] = useState<ReadonlySet<string>>(() => new Set());
    const [recovering, setRecovering] = useState<ReadonlySet<string>>(() => new Set());
    const clicks = useRef<Record<string, number[]>>({});

    // 누른 시각은 클릭 이벤트의 발생 시각(timeStamp)을 쓴다
    const handlePress = (date: string, now: number) => {
        if (dizzy.has(date)) return;
        setFlips((prev) => ({ ...prev, [date]: (prev[date] ?? 0) + 1 }));
        const recent = [...(clicks.current[date] ?? []), now].filter(
            (time) => now - time < DIZZY_WINDOW_MS,
        );
        clicks.current[date] = recent;
        if (recent.length < DIZZY_CLICKS) return;
        clicks.current[date] = [];
        setDizzy((prev) => new Set(prev).add(date));
        const without = (prev: ReadonlySet<string>) => {
            const next = new Set(prev);
            next.delete(date);
            return next;
        };
        setTimeout(() => {
            setDizzy(without);
            setRecovering((prev) => new Set(prev).add(date));
            setTimeout(() => setRecovering(without), RECOVER_MS);
        }, DIZZY_DURATION_MS);
    };

    return (
        <ol className="bg-surface-canvas grid w-full grid-cols-8 gap-x-1.5 gap-y-3 rounded-lg p-4 sm:gap-x-4">
            {days.map((day) => {
                const isBonus = isStreakBonusDate(day.date, bonusDays);
                const isDizzy = dizzy.has(day.date);
                const isRecovering = recovering.has(day.date);
                const mascot = getAttendanceMascot(isBonus);
                return (
                    <li
                        key={day.date}
                        aria-label={`${day.day}일 ${day.checked ? '출석' : '미출석'}${isBonus ? ', 연속 출석 보상일' : ''}`}
                        aria-current={day.isToday ? 'date' : undefined}
                        className="bg-border-default relative flex aspect-square w-full max-w-14 items-center justify-center justify-self-center rounded-full shadow-[inset_0_3px_6px_0_rgb(18_22_27_/_0.1)]"
                    >
                        {/* 출석 전 오늘 칸 — 테두리가 천천히 숨 쉬듯 깜빡인다 */}
                        {day.isToday && !day.checked && (
                            <span
                                aria-hidden
                                className="ring-brand-primary pointer-events-none absolute inset-0 rounded-full ring-2 motion-safe:animate-pulse"
                            />
                        )}
                        {day.checked || isBonus ? (
                            <button
                                type="button"
                                disabled={!day.checked}
                                aria-label={
                                    day.checked ? `${day.day}일 타코야끼 뒤집기` : undefined
                                }
                                onClick={(event) => handlePress(day.date, event.timeStamp)}
                                className={cn(
                                    // 판(최대 56px)의 86% = 48px — 좁은 화면에서는 판에 맞춰 함께 줄어든다
                                    'focus-visible:ring-border-focus relative size-[86%] rounded-full [perspective:320px] focus-visible:ring-2 focus-visible:outline-none enabled:cursor-pointer',
                                    day.date === revealDate &&
                                        'motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:spin-in-45 motion-safe:fade-in motion-safe:duration-700',
                                )}
                            >
                                {/*
                                  원래 타코야끼와 어지러운 타코야끼를 겹쳐 두고 투명도로 바꾼다.
                                  어지러울 때는 휘청이고, 돌아올 때는 흔들림이 잦아들며 원래 얼굴로 스르르 바뀐다
                                */}
                                <motion.span
                                    className="absolute inset-0"
                                    initial={false}
                                    animate={{
                                        rotateY: (flips[day.date] ?? 0) * 360,
                                        rotate: isDizzy
                                            ? [0, -14, 12, -10, 8, -6, 4, 0]
                                            : isRecovering
                                              ? [0, 5, -3, 1.5, 0]
                                              : 0,
                                        scale: isRecovering ? [1, 1.06, 0.98, 1] : 1,
                                    }}
                                    transition={{
                                        rotateY: { duration: 0.6, ease: 'easeOut' },
                                        rotate: {
                                            duration: isDizzy ? 1.6 : RECOVER_MS / 1000,
                                            ease: 'easeInOut',
                                        },
                                        scale: { duration: RECOVER_MS / 1000, ease: 'easeOut' },
                                    }}
                                >
                                    <img
                                        src={mascot.src}
                                        alt=""
                                        className={cn(
                                            'absolute inset-0 size-full object-contain drop-shadow-[0_2px_2px_rgb(18_22_27_/_0.18)] transition-opacity duration-700 ease-out',
                                            !day.checked && 'opacity-50 grayscale',
                                            isDizzy && 'opacity-0',
                                        )}
                                    />
                                    {day.checked && (
                                        <img
                                            src={DIZZY_MASCOT.src}
                                            alt=""
                                            aria-hidden
                                            className={cn(
                                                'absolute inset-0 size-full object-contain drop-shadow-[0_2px_2px_rgb(18_22_27_/_0.18)] transition-opacity duration-500 ease-out',
                                                isDizzy ? 'opacity-100' : 'opacity-0',
                                            )}
                                        />
                                    )}
                                </motion.span>
                            </button>
                        ) : (
                            <span
                                className={`text-body-bold leading-4.5 ${day.isToday ? 'text-fg-brand' : 'text-fg-tertiary'}`}
                            >
                                {day.day}
                            </span>
                        )}
                    </li>
                );
            })}
        </ol>
    );
}
