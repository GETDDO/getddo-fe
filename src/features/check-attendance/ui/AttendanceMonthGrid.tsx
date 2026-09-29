import { motion } from 'framer-motion';
import { useRef, useState } from 'react';

import { cn } from '@shared/lib/utils';

import type { AttendanceMonthDay } from '../lib/attendance-week';

import { isStreakBonusDate } from '../lib/attendance-week';
import { BATTER_MASCOT, DIZZY_MASCOT, getAttendanceMascot } from './mascots';

/** 이 시간 안에 이만큼 누르면 타코야끼가 어지러워한다 */
const DIZZY_CLICKS = 5;
const DIZZY_WINDOW_MS = 2500;
const DIZZY_DURATION_MS = 2200;
/** 어지러움에서 돌아오는 연출 시간 — 얼굴이 스르르 바뀌며 가볍게 털어낸다 */
const RECOVER_MS = 700;

/**
 * 이번 달 출석판 — 한 줄 8칸, 1일부터 순서대로 채운다(요일과 무관). 28~31일 모두 4줄 안에 들어간다.
 * - 모든 칸은 회색 타코야끼 판이다
 *   · 출석한 날: 기본 타코야끼
 *   · 출석하지 않은 날(지난날·오늘·앞으로 올 날): 흐린 회색 반죽 + 날짜 — 모든 칸이 반죽에서 시작한다
 *   · 숫자가 있는 칸 = 아직 채우지 못한 날, 숫자 없이 캐릭터만 있는 칸 = 출석한 날
 * - 연속 출석 보상일(관리자 정책)은 보상 캐릭터 (출석 전 회색 → 출석하면 원본)
 * - 판 오른쪽 위에 작은 태그를 단다: '오늘'(응모권 노랑), 보상일 '+N'(옅은 회색). 둘 다면 한 알약으로 이어 붙인다
 * - 출석한 타코야끼를 누르면 뒤집히고, 너무 많이 누르면 잠깐 어지러워했다가 스르르 돌아온다
 */
export function AttendanceMonthGrid({
    days,
    bonusDays,
    bonusRewards,
    revealDate,
}: {
    days: AttendanceMonthDay[];
    bonusDays: ReadonlySet<number>;
    /** 보상일(일) → 추가로 주는 응모권 수 */
    bonusRewards?: ReadonlyMap<number, number>;
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
                const bonusTickets = isBonus ? bonusRewards?.get(day.day) : undefined;
                const isDizzy = dizzy.has(day.date);
                const isRecovering = recovering.has(day.date);
                const mascot = getAttendanceMascot(day.date, bonusDays);
                return (
                    <li
                        key={day.date}
                        aria-label={`${day.day}일 ${day.checked ? '출석' : '미출석'}${isBonus ? `, 연속 출석 보상일${bonusTickets != null ? ` 응모권 ${bonusTickets}장 추가` : ''}` : ''}`}
                        aria-current={day.isToday ? 'date' : undefined}
                        className="bg-border-default relative flex aspect-square w-full max-w-14 items-center justify-center justify-self-center rounded-full shadow-[inset_0_3px_6px_0_rgb(from_var(--color-ink)_r_g_b_/_0.1)]"
                    >
                        {/*
                          판 오른쪽 위 태그 — 오늘(응모권 노랑)과 보상일 추가 응모권 수(옅은 회색).
                          둘 다 있는 날은 겹치지 않게 한 알약 모양으로 이어 붙인다 (왼쪽 오늘, 오른쪽 +N)
                        */}
                        {(day.isToday || bonusTickets != null) && (
                            <span
                                aria-hidden
                                className="text-caption pointer-events-none absolute -top-2 -right-1 z-10 flex overflow-hidden rounded-full leading-4 whitespace-nowrap shadow-sm"
                            >
                                {day.isToday && (
                                    <span className="bg-ticket-primary text-ticket-on px-1.5">
                                        오늘
                                    </span>
                                )}
                                {bonusTickets != null && (
                                    <span className="bg-border-strong text-fg-secondary px-1.5">
                                        +{bonusTickets}
                                    </span>
                                )}
                            </span>
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
                                            'absolute inset-0 size-full object-contain drop-shadow-[0_2px_2px_rgb(from_var(--color-ink)_r_g_b_/_0.18)] transition-opacity duration-700 ease-out',
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
                                                'absolute inset-0 size-full object-contain drop-shadow-[0_2px_2px_rgb(from_var(--color-ink)_r_g_b_/_0.18)] transition-opacity duration-500 ease-out',
                                                isDizzy ? 'opacity-100' : 'opacity-0',
                                            )}
                                        />
                                    )}
                                </motion.span>
                            </button>
                        ) : (
                            // 출석하지 않은 날 — 흐린 회색 반죽 위에 날짜
                            <span className="relative flex size-[86%] items-center justify-center">
                                <img
                                    src={BATTER_MASCOT.src}
                                    alt=""
                                    className="absolute inset-0 size-full object-contain opacity-45 grayscale"
                                />
                                <span className="text-body-bold text-fg-secondary relative leading-4.5">
                                    {day.day}
                                </span>
                            </span>
                        )}
                    </li>
                );
            })}
        </ol>
    );
}
