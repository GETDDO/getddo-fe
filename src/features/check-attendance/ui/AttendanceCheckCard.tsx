import { MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { ChevronRight, ChevronUp } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { useAttendancePolicy, useAttendanceStatus } from '@entities/attendance';
import { cn } from '@shared/lib/utils';
import { useVirtualClock } from '@shared/lib/virtual-clock';
import { Button } from '@shared/ui/button';

import type { AttendanceExpandOptions } from '../model/attendance-motion';

import { useCheckAttendance } from '../api/queries';
import {
    buildAttendanceMonth,
    buildAttendanceWeek,
    countMonthlyAttendance,
    toAttendanceDate,
} from '../lib/attendance-week';
import { ATTENDANCE_WIDEN_MS } from '../model/attendance-motion';
import { AttendanceBaking } from './AttendanceBaking';
import { AttendanceBakingStage, BAKING_SPRITE_SRC } from './AttendanceBakingStage';
import { AttendanceMonthGrid } from './AttendanceMonthGrid';
import { AttendanceWeekStrip } from './AttendanceWeekStrip';

/** 굽기 스프라이트 재생 시간 — 응답이 빨라도 이만큼은 보여주고 끝나면 출석판을 펼친다 */
const BAKING_MIN_MS = 1600;

/** 카드가 넓어진 뒤 아래로 자라며 출석판을 드러내는 시간(초)과 곡선 */
const GROW_TRANSITION = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const };

/** 폭이 바뀌기 직전 카드 내용이 사라지는 시간(초) — 늘어나거나 눌리는 모습이 보이지 않게 한다 */
const CONTENT_FADE_MS = 80;

/** 접힌 카드 높이(px) — h-75 */
const COLLAPSED_HEIGHT = 300;

/** 두 카드가 옆으로 나란히 놓이는 너비(lg) — 이보다 좁으면 열 너비가 바뀌지 않으므로 넓어지기를 기다리지 않는다 */
const SIDE_BY_SIDE_QUERY = '(min-width: 64rem)';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 펼친 출석판 머리의 출석 버튼·완료 표시·굽는 중 표시가 모두 같은 너비를 쓰도록 고정한다 */
const COMPACT_CHECK_WIDTH = 'w-32';

/** 정책을 아직 못 받았거나 실패했을 때 쓰는 보상 단계(일 → 추가 응모권) — getddo-spec 출석 규칙의 초기 설정 */
const DEFAULT_BONUS_REWARDS: ReadonlyMap<number, number> = new Map([
    [7, 1],
    [14, 3],
    [28, 7],
]);

/**
 * 펼치거나 접은 직후 카드 안 요소가 위에서부터 차례로 살짝 올라오며 나타난다 (order가 클수록 늦게).
 * 페이지에 처음 들어올 때는 다른 페이지처럼 바로 보여준다 (enter가 false)
 */
function Rise({
    order,
    enter,
    className,
    children,
}: {
    order: number;
    enter: boolean;
    className?: string;
    children: ReactNode;
}) {
    return (
        <motion.div
            initial={enter ? { opacity: 0, y: 12 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: order * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// 공용 cn은 커스텀 글자 토큰(text-caption 등)과 색 토큰(text-fg-*)을 같은 그룹으로 보고 앞의 것을 지우므로 cn 없이 이어 붙인다
function AttendanceStat({
    label,
    value,
    compact,
}: {
    label: string;
    value: string;
    compact: boolean;
}) {
    return (
        <div className="flex flex-col gap-2">
            <span className={`text-fg-tertiary ${compact ? 'text-caption' : 'text-body-sm'}`}>
                {label}
            </span>
            <span
                className={`text-fg-primary ${compact ? 'text-body-sm-bold' : 'text-title-3 tracking-normal'}`}
            >
                {value}
            </span>
        </div>
    );
}

/**
 * 출석 카드. 접힌 상태는 최근 7일 스트립과 출석 버튼, 펼친 상태는 이번 달 달력을 보여준다.
 * 펼침 여부는 옆 카드의 너비도 바뀌므로 페이지가 관리한다.
 */
export function AttendanceCheckCard({
    expanded,
    onExpandedChange,
    className,
}: {
    expanded: boolean;
    onExpandedChange: (expanded: boolean, options?: AttendanceExpandOptions) => void;
    className?: string;
}) {
    const { data: status, isPending, isError } = useAttendanceStatus();
    const checkAttendance = useCheckAttendance();
    const { data: policy } = useAttendancePolicy();
    // 연속 출석 보상일과 추가 응모권 수는 관리자가 여러 개 설정할 수 있어 정책에서 받는다
    const bonusRewards: ReadonlyMap<number, number> = policy
        ? new Map(policy.streakBonuses.map((bonus) => [bonus.days, bonus.rewardTickets]))
        : DEFAULT_BONUS_REWARDS;
    const bonusDays: ReadonlySet<number> = new Set(bonusRewards.keys());
    // 출석 판정은 서버가 하고, 여기서는 표시용 날짜 계산에만 쓴다
    const clock = useVirtualClock();
    const [now] = useState(() => clock.now());
    const today = toAttendanceDate(now);
    const [baking, setBaking] = useState(false);
    // 접힌 카드에서 출석했을 때 굽기 장면이 카드 전체를 채운다 (넓어지는 동안에도 유지)
    const [stageFull, setStageFull] = useState(false);
    // 펼치기: 옆으로 넓어짐(widening) → 아래로 자람 / 접기: 위로 줄어듦(shrinking) → 옆으로 좁아짐
    const [widening, setWidening] = useState(false);
    // 펼치기·접기를 한 번이라도 했는지 — 그 뒤에만 내용이 차례로 올라온다 (처음 들어올 때는 애니메이션 없음)
    const [contentEnter, setContentEnter] = useState(false);
    const [shrinking, setShrinking] = useState(false);
    const [narrowing, setNarrowing] = useState(false);
    const [heightAnimating, setHeightAnimating] = useState(false);
    const reduceMotion = useReducedMotion();
    // 넓어지는 동안에는 접힌 내용(또는 굽기 장면)을 그대로 두고, 다 넓어진 뒤 펼친 출석판을 보여준다
    const showExpanded = expanded && !widening;
    const [revealDate, setRevealDate] = useState<string | null>(null);
    const handleRevealEnd = useCallback(() => setRevealDate(null), []);

    // 출석하기를 누른 순간 스프라이트가 늦게 떠서 깜빡이지 않도록 미리 불러 둔다
    useEffect(() => {
        const image = new Image();
        image.src = BAKING_SPRITE_SRC;
    }, []);

    /**
     * 펼치기 — 카드가 먼저 옆으로 넓어지고, 다 넓어지면 아래로 자라며 출석판을 드러낸다.
     * beforeGrow는 자라기 직전에 같이 바꿀 상태(굽기 장면 끄기 등)를 넣는다
     */
    const expandWithMotion = async (beforeGrow?: () => void) => {
        setContentEnter(true);
        if (reduceMotion) {
            beforeGrow?.();
            onExpandedChange(true);
            return;
        }
        // 내용이 먼저 사라진 뒤 폭이 바뀌기 시작해야 늘어나는 모습이 보이지 않는다
        setWidening(true);
        await wait(CONTENT_FADE_MS);
        onExpandedChange(true, { animate: true });
        if (window.matchMedia(SIDE_BY_SIDE_QUERY).matches) {
            await wait(ATTENDANCE_WIDEN_MS);
        }
        beforeGrow?.();
        setWidening(false);
        setHeightAnimating(true);
    };

    // 접기 — 펼친 출석판이 먼저 위로 줄어들고, 다 줄어들면(onAnimationComplete) 옆으로 좁아진다
    const collapseWithMotion = () => {
        setContentEnter(true);
        if (reduceMotion) {
            onExpandedChange(false);
            return;
        }
        setShrinking(true);
        setHeightAnimating(true);
    };

    const handleHeightAnimationComplete = async () => {
        setHeightAnimating(false);
        if (!shrinking) return;
        setShrinking(false);
        // 좁아지는 동안에는 내용을 숨겼다가, 다 좁아지면 접힌 내용이 올라온다
        setNarrowing(true);
        onExpandedChange(false, { animate: true });
        if (window.matchMedia(SIDE_BY_SIDE_QUERY).matches) {
            await wait(ATTENDANCE_WIDEN_MS);
        }
        setNarrowing(false);
    };

    // 굽기 스프라이트 → (접혀 있었다면) 카드가 옆으로 넓어지고 아래로 자라며 출석판을 펼침 → 오늘 칸에 타코야끼가 올라오는 순서
    const handleCheck = async () => {
        const fromCollapsed = !expanded;
        const endBaking = () => {
            setBaking(false);
            setStageFull(false);
        };
        setBaking(true);
        setStageFull(fromCollapsed);
        try {
            const { ticketsGranted } = await checkAttendance.mutateAsync({
                minDurationMs: BAKING_MIN_MS,
            });
            setRevealDate(today);
            toast.success(`출석 완료! 응모권 ${ticketsGranted}장을 받았어요.`);
            // 굽기 장면을 띄운 채로 카드가 넓어지고, 자라기 시작할 때 굽기 장면을 출석판으로 바꾼다
            if (fromCollapsed) await expandWithMotion(endBaking);
        } catch {
            toast.error('출석 처리에 실패했어요. 잠시 후 다시 시도해 주세요.');
        } finally {
            endBaking();
        }
    };

    // 펼친 출석판 머리의 작은 출석 버튼 — 이번 달 출석일수 옆에 둔다
    const compactCheckButton = baking ? (
        <AttendanceBaking compact />
    ) : status?.attended ? (
        <Button disabled className={COMPACT_CHECK_WIDTH}>
            오늘 출석 완료
        </Button>
    ) : (
        <Button className={COMPACT_CHECK_WIDTH} onClick={() => void handleCheck()}>
            출석하기
        </Button>
    );

    // 굽는 동안에는 결과를 미리 보여주지 않도록 오늘을 출석 전으로 둔다
    const shownDates = baking
        ? (status?.checkedDates ?? []).filter((date) => date !== today)
        : (status?.checkedDates ?? []);
    const shownCheckedToday = !!status?.attended && !baking;

    const checkButton = status?.attended ? (
        <Button disabled size="lg" className="w-full">
            오늘 출석 완료
        </Button>
    ) : (
        <Button size="lg" className="w-full" onClick={() => void handleCheck()}>
            출석하기
        </Button>
    );

    const stats = status && (
        <AttendanceStatPair
            streak={status.consecutiveDays}
            monthly={countMonthlyAttendance(status.checkedDates, status.attended, now)}
            compact={showExpanded}
        />
    );

    return (
        // 운영체제의 동작 줄이기 설정을 켠 사용자에게는 요소 등장 효과를 끈다
        <MotionConfig reducedMotion="user">
            <motion.div
                initial={false}
                // 펼칠 때는 접힌 높이에서 펼친 높이로 자라고, 접을 때는 거꾸로 줄어든다 (그 밖에는 바로 맞춘다)
                animate={{
                    height: showExpanded && !stageFull && !shrinking ? 'auto' : COLLAPSED_HEIGHT,
                }}
                transition={heightAnimating ? GROW_TRANSITION : { duration: 0 }}
                onAnimationComplete={() => void handleHeightAnimationComplete()}
                className={cn(
                    'bg-surface-page border-border-default flex flex-col rounded-2xl border p-4 shadow-md',
                    heightAnimating && 'overflow-hidden',
                    className,
                )}
            >
                {stageFull ? (
                    // 접힌 카드에서 출석하기 — 카드가 넓어지는 동안까지 굽기 장면이 카드 전체를 채운다
                    <AttendanceBakingStage durationMs={BAKING_MIN_MS} className="flex-1" />
                ) : narrowing ? (
                    // 좁아지는 동안에는 빈 카드 틀만 움직인다
                    <div className="flex-1" />
                ) : (
                    // 넓어지는 동안에는 접힌 내용을 빠르게 숨겨 늘어나는 모습이 보이지 않게 하고,
                    // 다 넓어지면 펼친 내용으로 바뀌며(key) 위에서부터 차례로 올라온다
                    <motion.div
                        key={showExpanded ? 'expanded' : 'collapsed'}
                        initial={false}
                        animate={{ opacity: widening ? 0 : 1 }}
                        transition={{ duration: CONTENT_FADE_MS / 1000 }}
                        className={cn(
                            'flex flex-1 flex-col',
                            showExpanded ? 'gap-4' : 'justify-between',
                        )}
                    >
                        {showExpanded ? (
                            <Rise
                                order={0}
                                enter={contentEnter}
                                className="flex items-start justify-between gap-4"
                            >
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                                    {stats}
                                    {status && compactCheckButton}
                                </div>
                                <button
                                    type="button"
                                    aria-expanded="true"
                                    onClick={collapseWithMotion}
                                    className="text-body-sm text-fg-primary focus-visible:ring-border-focus flex shrink-0 cursor-pointer items-center rounded-sm focus-visible:ring-2 focus-visible:outline-none"
                                >
                                    접기
                                    <ChevronUp className="size-5" />
                                </button>
                            </Rise>
                        ) : (
                            // 펼쳐보기 버튼은 제자리에 그대로 둔다 (등장 효과 없음)
                            <div className="self-end">
                                <button
                                    type="button"
                                    aria-expanded="false"
                                    onClick={() => void expandWithMotion()}
                                    className="text-body-sm text-fg-primary focus-visible:ring-border-focus flex cursor-pointer items-center rounded-sm focus-visible:ring-2 focus-visible:outline-none"
                                >
                                    펼쳐보기
                                    <ChevronRight className="size-5" />
                                </button>
                            </div>
                        )}

                        {isPending && (
                            <p className="text-body-sm text-fg-tertiary self-center">
                                불러오는 중…
                            </p>
                        )}
                        {isError && (
                            <p className="text-body-sm text-destructive self-center">
                                출석 정보를 불러오지 못했습니다.
                            </p>
                        )}

                        {status &&
                            (showExpanded ? (
                                baking ? (
                                    // 펼친 출석판에서 출석하기 — 출석판 자리만 굽기 장면으로 바뀐다
                                    <AttendanceBakingStage
                                        durationMs={BAKING_MIN_MS}
                                        className="bg-surface-canvas min-h-80 rounded-lg"
                                    />
                                ) : (
                                    <Rise order={1} enter={contentEnter}>
                                        <AttendanceMonthGrid
                                            days={buildAttendanceMonth(
                                                shownDates,
                                                shownCheckedToday,
                                                now,
                                            )}
                                            bonusDays={bonusDays}
                                            bonusRewards={bonusRewards}
                                            revealDate={revealDate}
                                            onRevealEnd={handleRevealEnd}
                                        />
                                    </Rise>
                                )
                            ) : (
                                <>
                                    <Rise order={1} enter={contentEnter} className="p-4">
                                        {stats}
                                    </Rise>
                                    <Rise order={2} enter={contentEnter}>
                                        <AttendanceWeekStrip
                                            week={buildAttendanceWeek(
                                                shownDates,
                                                shownCheckedToday,
                                                now,
                                            )}
                                            bonusDays={bonusDays}
                                        />
                                    </Rise>
                                    <Rise order={3} enter={contentEnter}>
                                        {checkButton}
                                    </Rise>
                                </>
                            ))}
                    </motion.div>
                )}
            </motion.div>
        </MotionConfig>
    );
}

function AttendanceStatPair({
    streak,
    monthly,
    compact,
}: {
    streak: number;
    monthly: number;
    compact: boolean;
}) {
    return (
        <div className={cn('grid grid-cols-2', compact ? 'gap-4' : 'w-full')}>
            <AttendanceStat label="연속 출석일수" value={`연속 ${streak}일`} compact={compact} />
            <div className="border-border-strong border-l pl-4">
                <AttendanceStat label="이번 달 출석일수" value={`${monthly}일`} compact={compact} />
            </div>
        </div>
    );
}
