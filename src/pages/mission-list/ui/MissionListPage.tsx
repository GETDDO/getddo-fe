import { useLayoutEffect, useState } from 'react';

import { useMissionList } from '@entities/mission';
import { AttendanceCheckCard } from '@features/check-attendance';
import { cn } from '@shared/lib/utils';
import { GameRail } from '@widgets/game-rail';

import { MissionCard } from './MissionCard';
import { SectionHeader } from './SectionHeader';
import { TicketHistoryCard } from './TicketHistoryCard';

const CONTAINER = 'mx-auto w-full max-w-300 px-6';

export function MissionListPage() {
    const { data: missions, isPending, isError } = useMissionList();
    // 출석 카드를 펼치면(펼쳐보기·출석 완료) 출석 카드가 넓어지고 응모권 내역 카드가 좁아진다
    const [attendanceExpanded, setAttendanceExpanded] = useState(false);

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
                >
                    <section className="flex min-w-0 flex-col gap-6">
                        {/* 출석 기준일은 00:00 UTC(09:00 KST)에 바뀐다 — getddo-spec 출석 규칙 */}
                        <SectionHeader title="출석체크" caption="하루 1회 · 오전 9시 초기화" />
                        <AttendanceCheckCard
                            expanded={attendanceExpanded}
                            onExpandedChange={setAttendanceExpanded}
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
                    <div className="grid gap-4 md:grid-cols-2">
                        {missions.map((mission) => (
                            <MissionCard key={mission.id} mission={mission} />
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
