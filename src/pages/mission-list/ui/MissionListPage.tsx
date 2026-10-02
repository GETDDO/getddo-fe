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

const CONTAINER = 'mx-auto w-full max-w-312 px-6';

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
              게임 섹션 — 회색 띠 위에 놓인다 (티켓 펀칭은 실제로 도려내서 띠 색이 그대로 비친다).
              카드 목록은 홈 화면처럼 콘텐츠 폭(최대 1200px) 안에서 자르고 그 안에서 넘긴다
            */}
            <div className="bg-surface-canvas mt-20 py-10">
                <div className={CONTAINER}>
                    <GameRail
                        title="게임"
                        caption="게임마다 하루 한 번 응모권을 받을 수 있어요. 매일 오전 9시 초기화"
                    />
                </div>
            </div>

            {/* 설문·퀴즈 */}
            <section className={`${CONTAINER} mt-20 flex flex-col gap-6`}>
                <SectionHeader
                    title="설문 · 퀴즈"
                    caption="미션마다 한 번만 응모권을 받을 수 있어요."
                />
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
                        {missions.map((mission) => (
                            <MissionCard key={mission.id} mission={mission} />
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
