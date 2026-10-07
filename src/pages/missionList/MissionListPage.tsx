import { useEffect, useState } from 'react';

import { MissionRewardDialog, useMissionList } from '@entities/mission';
import {
    ATTENDANCE_WIDEN_MS,
    AttendanceCheckCard,
    type AttendanceExpandOptions,
} from '@features/checkAttendance';
import { cn } from '@shared/lib/utils';
import { GameRail } from '@widgets/gameRail';

import { MissionCard } from './ui/MissionCard';
import { MissionDialog } from './ui/MissionDialog';
import { SectionHeader } from './ui/SectionHeader';
import { TicketHistoryCard } from './ui/TicketHistoryCard';
import { TicketSummaryCard } from './ui/TicketSummaryCard';

const CONTAINER = 'mx-auto w-full max-w-312 px-6';

export function MissionListPage() {
    const { data: missions, isPending, isError } = useMissionList();
    // 출석 카드를 펼치면(펼쳐보기·출석 완료) 출석 카드가 넓어지고 응모권 내역 카드가 좁아진다.
    // 펼침 상태는 저장하지 않는다 — 페이지에 들어올 때마다 접힌 상태로 새로 시작한다
    const [attendanceExpanded, setAttendanceExpanded] = useState(false);

    // 설문·퀴즈 풀이 모달로 연 미션, 완료 직후 보상 모달에 보여줄 응모권 수
    const [openMissionId, setOpenMissionId] = useState<string | null>(null);
    // 응모권 수는 닫히는 동안에도 남겨 두어야 닫힘 애니메이션에서 0장으로 바뀌지 않는다
    const [reward, setReward] = useState({ open: false, tickets: 0 });

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

    return (
        <main className="flex flex-col pt-20 pb-28">
            <div className={CONTAINER}>
                {/* 피그마 미션 페이지 머리 — 왼쪽 제목·설명, 오른쪽 응모권 요약 카드 (좁은 화면에서는 아래로) */}
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-1.5">
                        <h1 className="text-title-1 text-fg-primary">응모권</h1>
                        <p className="text-body-sm text-fg-secondary">
                            출석, 미션, 게임에 참여하고 응모권을 획득하세요.
                        </p>
                    </div>
                    <TicketSummaryCard />
                </div>

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

            {/* 게임 섹션 — 홈과 같이 배경 띠 없이 다른 섹션과 같은 간격(80). 카드 목록은 콘텐츠 폭(최대 1200px) 안에서 넘긴다 */}
            <div className={`${CONTAINER} mt-20`}>
                <GameRail
                    title="게임"
                    caption="게임마다 하루 한 번 응모권을 받을 수 있어요. 매일 오전 9시 초기화"
                />
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
                    // 설문·퀴즈 카드는 넓은 화면에서 2열로 둔다
                    <div className="grid gap-4 md:grid-cols-2">
                        {missions.map((mission) => (
                            <MissionCard
                                key={mission.id}
                                mission={mission}
                                onOpen={setOpenMissionId}
                            />
                        ))}
                    </div>
                )}
            </section>

            <MissionDialog
                missionId={openMissionId}
                onClose={() => setOpenMissionId(null)}
                onRewarded={(tickets) => {
                    // 풀이 모달을 닫고 보상 모달을 띄운다
                    setOpenMissionId(null);
                    setReward({ open: true, tickets });
                }}
            />
            <MissionRewardDialog
                open={reward.open}
                onOpenChange={(open) => setReward((prev) => ({ ...prev, open }))}
                tickets={reward.tickets}
            />
        </main>
    );
}
