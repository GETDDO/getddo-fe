import { useState } from 'react';

import { MissionRewardDialog } from '@entities/mission';
import { TICKET_GRADE_LABEL, type TicketGrade, TicketGradeReveal } from '@entities/ticket';
import { AttendanceCheckCard } from '@features/checkAttendance';
import { cn } from '@shared/lib/utils';
import { GameRail } from '@widgets/gameRail';

import { MISSION_SECTION_IDS } from './model/sectionIds';
import { MissionBoard } from './ui/MissionBoard';
import { MissionDialog } from './ui/MissionDialog';
import { SectionHeader } from './ui/SectionHeader';
import { TicketHistoryCard } from './ui/TicketHistoryCard';
import { TodayRewardsBanner } from './ui/TodayRewardsBanner';

const CONTAINER = 'mx-auto w-full max-w-312 px-6';

export function MissionListPage() {
    // 출석 카드를 펼치면(펼쳐보기·출석 완료) 출석 카드가 넓어지고 응모권 내역 카드가 좁아진다.
    // 펼침 상태는 저장하지 않는다 — 페이지에 들어올 때마다 접힌 상태로 새로 시작한다
    const [attendanceExpanded, setAttendanceExpanded] = useState(false);

    // 설문·퀴즈 풀이 모달로 연 미션, 완료 직후 보상 모달에 보여줄 응모권 수
    const [openMissionId, setOpenMissionId] = useState<string | null>(null);
    // 응모권 수는 닫히는 동안에도 남겨 두어야 닫힘 애니메이션에서 0장으로 바뀌지 않는다
    const [reward, setReward] = useState<{
        open: boolean;
        tickets: number;
        grade: TicketGrade | null;
    }>({ open: false, tickets: 0, grade: null });

    return (
        <main className="flex flex-col pt-12 pb-28">
            <div className={CONTAINER}>
                {/* 페이지 머리 — 오늘의 적립: 오늘 더 받을 응모권·진행 세 칸과 내 응모권 지갑 */}
                <TodayRewardsBanner />

                <div
                    className={cn(
                        'mt-14 grid gap-x-4 gap-y-10',
                        attendanceExpanded
                            ? 'lg:grid-cols-[885fr_300fr]'
                            : 'lg:grid-cols-[393fr_791fr]',
                    )}
                >
                    <section
                        id={MISSION_SECTION_IDS.attendance}
                        className="flex min-w-0 scroll-mt-24 flex-col gap-6"
                    >
                        {/* 출석 기준일은 00:00 UTC(09:00 KST)에 바뀐다 — getddo-spec 출석 규칙 */}
                        <SectionHeader title="출석체크" caption="하루 1회 · 오전 9시 초기화" />
                        <AttendanceCheckCard
                            expanded={attendanceExpanded}
                            onExpandedChange={setAttendanceExpanded}
                        />
                    </section>
                    <section className="flex min-w-0 flex-col gap-6">
                        <SectionHeader title="응모권 적립 · 사용 내역" />
                        <TicketHistoryCard className="flex-1" />
                    </section>
                </div>
            </div>

            {/* 게임 섹션 — 홈과 같이 배경 띠 없이 다른 섹션과 같은 간격(80). 카드 목록은 콘텐츠 폭(최대 1200px) 안에서 넘긴다 */}
            <div id={MISSION_SECTION_IDS.games} className={`${CONTAINER} mt-20 scroll-mt-24`}>
                <GameRail
                    title="게임"
                    caption="게임마다 하루 한 번 응모권을 받을 수 있어요. 매일 오전 9시 초기화"
                />
            </div>

            {/* 설문·퀴즈 */}
            <MissionBoard
                id={MISSION_SECTION_IDS.missions}
                className={`${CONTAINER} mt-20`}
                onOpen={setOpenMissionId}
            />

            <MissionDialog
                missionId={openMissionId}
                onClose={() => setOpenMissionId(null)}
                onRewarded={(tickets, grade) => {
                    // 풀이 모달을 닫고 보상 모달을 띄운다
                    setOpenMissionId(null);
                    setReward({ open: true, tickets, grade });
                }}
            />
            <MissionRewardDialog
                open={reward.open}
                onOpenChange={(open) => setReward((prev) => ({ ...prev, open }))}
                tickets={reward.tickets}
                // 받은 등급을 응모권 카드가 뒤집히며 보여 준다 (게임 보상 모달과 같은 연출)
                gradeLabel={reward.grade ? TICKET_GRADE_LABEL[reward.grade] : undefined}
                reveal={reward.grade ? <TicketGradeReveal grade={reward.grade} /> : undefined}
            />
        </main>
    );
}
