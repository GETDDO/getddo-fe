import { MotionConfig, motion } from 'framer-motion';
import { ChevronRight, ChevronUp } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';

import { useAttendancePolicy, useAttendanceStatus, useCheckAttendance } from '../api/queries';
import {
    buildAttendanceMonth,
    buildAttendanceWeek,
    countMonthlyAttendance,
    toAttendanceDate,
} from '../lib/attendance-week';
import { AttendanceBaking } from './AttendanceBaking';
import { AttendanceBakingStage, BAKING_SPRITE_SRC } from './AttendanceBakingStage';
import { AttendanceMonthGrid } from './AttendanceMonthGrid';
import { AttendanceWeekStrip } from './AttendanceWeekStrip';

// shared/ui/button의 cn이 커스텀 타이포 토큰(text-body-bold)을 text-sm과 같은 그룹으로 인식하지 못해,
// 버튼 기본 text-sm이 남지 않도록 important로 덮는다
// 디자인 시스템 버튼 크기는 Small 36 · Medium 40 · Large 48 고정 (Medium·Large 글자 16px SemiBold)
const LARGE_BUTTON_CLASS = 'text-body-bold! font-semibold h-12 w-full';

// 공용 Button(secondary)의 기본 호버·누름은 디자인 시스템과 달라(임의 호버색, 누름색 없음, 누를 때 1px 내려감)
// action/neutral 기본·호버·누름 토큰으로 덮고(테마와 상관없이 고정), 내려가는 움직임은 끄고, 손가락 커서를 쓴다
const NEUTRAL_BUTTON_STATE =
    'bg-action-neutral cursor-pointer hover:bg-action-neutral-hover active:bg-action-neutral-pressed active:not-aria-[haspopup]:translate-y-0';

/** 굽기 스프라이트 재생 시간 — 응답이 빨라도 이만큼은 보여주고 끝나면 출석판을 펼친다 */
const BAKING_MIN_MS = 1600;

/** 펼친 출석판 머리의 출석 버튼·완료 표시·굽는 중 표시가 모두 같은 너비를 쓰도록 고정한다 */
const COMPACT_CHECK_WIDTH = 'w-32';

/** 정책을 아직 못 받았거나 실패했을 때 쓰는 보상 단계(일 → 추가 응모권) — getddo-spec 출석 규칙의 초기 설정 */
const DEFAULT_BONUS_REWARDS: ReadonlyMap<number, number> = new Map([
    [7, 1],
    [14, 3],
    [28, 7],
]);

/** 카드 안 요소가 위에서부터 차례로 살짝 올라오며 나타난다 (order가 클수록 늦게) */
function Rise({
    order,
    className,
    children,
}: {
    order: number;
    className?: string;
    children: ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
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
    onExpandedChange: (expanded: boolean) => void;
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
    // features에서는 app/virtual-clock을 참조할 수 없다 — 출석 판정은 서버가 하고, 여기서는 표시용 날짜 계산에만 쓴다
    const [now] = useState(() => new Date());
    const today = toAttendanceDate(now);
    const [baking, setBaking] = useState(false);
    const [revealDate, setRevealDate] = useState<string | null>(null);

    // 출석하기를 누른 순간 스프라이트가 늦게 떠서 깜빡이지 않도록 미리 불러 둔다
    useEffect(() => {
        const image = new Image();
        image.src = BAKING_SPRITE_SRC;
    }, []);

    // 굽기 스프라이트(카드 전체 또는 출석판 자리) → 출석판 펼치기 → 오늘 칸에 타코야끼가 올라오는 순서로 보여준다
    const handleCheck = async () => {
        setBaking(true);
        try {
            const { ticketsGranted } = await checkAttendance.mutateAsync({
                minDurationMs: BAKING_MIN_MS,
            });
            setRevealDate(today);
            onExpandedChange(true);
            toast.success(`출석 완료! 응모권 ${ticketsGranted}장을 받았어요.`);
        } catch {
            toast.error('출석 처리에 실패했어요. 잠시 후 다시 시도해 주세요.');
        } finally {
            setBaking(false);
        }
    };

    // 펼친 출석판 머리의 작은 출석 버튼 — 이번 달 출석일수 옆에 둔다
    const compactCheckButton = baking ? (
        <AttendanceBaking compact />
    ) : status?.checkedToday ? (
        <span
            className={`bg-surface-disabled text-fg-disabled text-body-bold flex h-10 shrink-0 items-center justify-center rounded-lg ${COMPACT_CHECK_WIDTH}`}
        >
            오늘 출석 완료
        </span>
    ) : (
        <Button
            variant="secondary"
            className={`text-body-bold! h-10 shrink-0 font-semibold ${COMPACT_CHECK_WIDTH} ${NEUTRAL_BUTTON_STATE}`}
            onClick={() => void handleCheck()}
        >
            출석하기
        </Button>
    );

    // 굽는 동안에는 결과를 미리 보여주지 않도록 오늘을 출석 전으로 둔다
    const shownDates = baking
        ? (status?.checkedDates ?? []).filter((date) => date !== today)
        : (status?.checkedDates ?? []);
    const shownCheckedToday = !!status?.checkedToday && !baking;

    const checkButton = status?.checkedToday ? (
        <span className="bg-surface-disabled text-fg-disabled text-body-bold flex h-12 w-full items-center justify-center rounded-lg">
            오늘 출석 완료
        </span>
    ) : (
        <Button
            variant="secondary"
            className={`${LARGE_BUTTON_CLASS} ${NEUTRAL_BUTTON_STATE}`}
            onClick={() => void handleCheck()}
        >
            출석하기
        </Button>
    );

    const stats = status && (
        <AttendanceStatPair
            streak={status.streak}
            monthly={countMonthlyAttendance(status.checkedDates, status.checkedToday, now)}
            compact={expanded}
        />
    );

    return (
        // 운영체제의 동작 줄이기 설정을 켠 사용자에게는 요소 등장 효과를 끈다
        <MotionConfig reducedMotion="user">
            <div
                className={cn(
                    'bg-surface-page border-border-default flex flex-col rounded-2xl border p-4 shadow-md',
                    // 펼치기·접기 자체는 높이·폭 애니메이션 없이 바로 바뀐다
                    expanded ? 'h-auto' : 'h-75',
                    className,
                )}
            >
                {!expanded && baking ? (
                    // 접힌 카드에서 출석하기 — 카드 전체가 굽기 장면으로 바뀌었다가 끝나면 출석판이 펼쳐진다
                    <AttendanceBakingStage durationMs={BAKING_MIN_MS} className="flex-1" />
                ) : (
                    <div
                        className={cn(
                            'flex flex-1 flex-col',
                            expanded ? 'gap-4' : 'justify-between',
                        )}
                    >
                        {expanded ? (
                            <Rise order={0} className="flex items-start justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                                    {stats}
                                    {status && compactCheckButton}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onExpandedChange(false)}
                                    className="text-body-sm text-fg-primary flex shrink-0 cursor-pointer items-center"
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
                                    onClick={() => onExpandedChange(true)}
                                    className="text-body-sm text-fg-primary flex cursor-pointer items-center"
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
                            (expanded ? (
                                baking ? (
                                    // 펼친 출석판에서 출석하기 — 출석판 자리만 굽기 장면으로 바뀐다
                                    <AttendanceBakingStage
                                        durationMs={BAKING_MIN_MS}
                                        className="bg-surface-canvas min-h-80 rounded-lg"
                                    />
                                ) : (
                                    <Rise order={1}>
                                        <AttendanceMonthGrid
                                            days={buildAttendanceMonth(
                                                shownDates,
                                                shownCheckedToday,
                                                now,
                                            )}
                                            bonusDays={bonusDays}
                                            bonusRewards={bonusRewards}
                                            revealDate={revealDate}
                                        />
                                    </Rise>
                                )
                            ) : (
                                <>
                                    <Rise order={1} className="p-4">
                                        {stats}
                                    </Rise>
                                    <Rise order={2}>
                                        <AttendanceWeekStrip
                                            week={buildAttendanceWeek(
                                                shownDates,
                                                shownCheckedToday,
                                                now,
                                            )}
                                            bonusDays={bonusDays}
                                        />
                                    </Rise>
                                    <Rise order={3}>{checkButton}</Rise>
                                </>
                            ))}
                    </div>
                )}
            </div>
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
