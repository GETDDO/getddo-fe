import { MotionConfig, motion } from 'framer-motion';
import { useEffect, useLayoutEffect, useState } from 'react';

import { useMissionList } from '@entities/mission';
import {
    ATTENDANCE_WIDEN_MS,
    AttendanceCheckCard,
    type AttendanceExpandOptions,
} from '@features/check-attendance';
import { cn } from '@shared/lib/utils';
import { GameRail } from '@widgets/game-rail';

import { MissionCard } from './MissionCard';
import { SectionHeader } from './SectionHeader';
import { TicketHistoryCard } from './TicketHistoryCard';

const CONTAINER = 'mx-auto w-full max-w-300 px-6';

/** 출석 카드 펼침 여부 — 새로고침해도 유지하도록 이 탭의 세션 저장소에 둔다 */
const ATTENDANCE_EXPANDED_KEY = 'getddo:attendance-expanded';

// 개인 정보 보호 모드 등에서는 저장소 접근이 막힐 수 있어, 실패하면 접힌 상태로 시작한다
function readAttendanceExpanded() {
    try {
        return sessionStorage.getItem(ATTENDANCE_EXPANDED_KEY) === 'true';
    } catch {
        return false;
    }
}

/** 스크롤로 화면에 들어오면 한 번 살짝 올라오며 나타난다 (order가 클수록 늦게) */
const riseInView = (order: number) => ({
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.45, delay: order * 0.06, ease: [0.22, 1, 0.36, 1] as const },
});

export function MissionListPage() {
    const { data: missions, isPending, isError } = useMissionList();
    // 출석 카드를 펼치면(펼쳐보기·출석 완료) 출석 카드가 넓어지고 응모권 내역 카드가 좁아진다
    const [attendanceExpanded, setAttendanceExpanded] = useState(readAttendanceExpanded);

    // 출석 카드를 펼치고 접을 때 두 카드의 열 너비가 부드럽게 바뀐다
    const [widening, setWidening] = useState(false);
    const handleAttendanceExpandedChange = (
        expanded: boolean,
        options?: AttendanceExpandOptions,
    ) => {
        setAttendanceExpanded(expanded);
        setWidening(!!options?.animate);
    };
    useEffect(() => {
        if (!widening) return;
        const timer = setTimeout(() => setWidening(false), ATTENDANCE_WIDEN_MS + 50);
        return () => clearTimeout(timer);
    }, [widening]);

    useEffect(() => {
        try {
            sessionStorage.setItem(ATTENDANCE_EXPANDED_KEY, String(attendanceExpanded));
        } catch {
            // 저장하지 못해도 화면 동작에는 영향이 없다
        }
    }, [attendanceExpanded]);

    // 다른 화면에서 스크롤을 내린 채 들어와도 맨 위에서 시작한다
    useLayoutEffect(() => {
        window.scrollTo({ top: 0 });
    }, []);

    return (
        <main className="flex flex-col pt-20 pb-28">
            <div className={CONTAINER}>
                <h1 className="text-title-1 text-fg-primary">응모권</h1>
                <p className="text-body text-fg-primary">
                    출석, 미션, 게임에 참여하고 응모권을 획득하세요.
                </p>

                <div
                    className={cn(
                        'mt-7.5 grid gap-x-4 gap-y-10',
                        attendanceExpanded
                            ? 'lg:grid-cols-[885fr_300fr]'
                            : 'lg:grid-cols-[393fr_791fr]',
                    )}
                    style={
                        widening
                            ? {
                                  transition: `grid-template-columns ${ATTENDANCE_WIDEN_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                              }
                            : undefined
                    }
                >
                    <section className="flex min-w-0 flex-col gap-6">
                        {/* 출석 기준일은 00:00 UTC(09:00 KST)에 바뀐다 — getddo-spec 출석 규칙 */}
                        <SectionHeader title="출석체크" caption="하루 1회 · 오전 9시 초기화" />
                        <AttendanceCheckCard
                            expanded={attendanceExpanded}
                            onExpandedChange={handleAttendanceExpandedChange}
                        />
                    </section>
                    <section className="flex min-w-0 flex-col gap-6">
                        <SectionHeader title="응모권 적립 · 사용 내역" />
                        <TicketHistoryCard compact={attendanceExpanded} className="flex-1" />
                    </section>
                </div>
            </div>

            {/*
              게임 섹션 — 회색 띠 위에 놓이므로 티켓 구멍도 띠 배경색으로 맞춘다.
              카드 목록은 왼쪽은 콘텐츠 시작선에서 자르고 오른쪽만 화면 끝까지 열어 스크롤한다(피그마).
              오른쪽으로 늘릴 폭(--rail-inset)은 100cqw로 띠 너비를 재서 스크롤바 폭 오차 없이 계산한다
            */}
            <div className="bg-surface-canvas @container mt-20 overflow-x-clip py-10 [--rail-inset:max(1.5rem,calc((100cqw-75rem)/2+1.5rem))] [--ticket-punch-bg:var(--color-surface-canvas)]">
                <div className={CONTAINER}>
                    <GameRail
                        title="게임"
                        caption="게임마다 하루 한 번 응모권을 받을 수 있어요. 매일 오전 9시 초기화"
                    />
                </div>
            </div>

            {/* 설문·퀴즈 — 스크롤해 보이면 제목, 카드 순서로 올라온다 (동작 줄이기 설정이면 끔) */}
            <MotionConfig reducedMotion="user">
                <section className={`${CONTAINER} mt-20 flex flex-col gap-6`}>
                    <motion.div {...riseInView(0)}>
                        <SectionHeader
                            title="설문 · 퀴즈"
                            caption="미션마다 한 번만 응모권을 받을 수 있어요."
                        />
                    </motion.div>
                    {isPending && <p className="text-body-sm text-fg-tertiary">불러오는 중…</p>}
                    {isError && (
                        <p className="text-body-sm text-destructive">
                            미션 목록을 불러오지 못했습니다.
                        </p>
                    )}
                    {missions?.length === 0 && (
                        <p className="text-body-sm text-fg-tertiary">
                            지금 참여할 수 있는 미션이 없어요.
                        </p>
                    )}
                    {missions && missions.length > 0 && (
                        <div className="flex flex-col gap-4">
                            {missions.map((mission, index) => (
                                // 위 카드부터 차례로 올라온다 (앞쪽 4장까지만 간격을 둔다)
                                <motion.div
                                    key={mission.id}
                                    {...riseInView(1 + Math.min(index, 3))}
                                >
                                    <MissionCard mission={mission} />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>
            </MotionConfig>
        </main>
    );
}
