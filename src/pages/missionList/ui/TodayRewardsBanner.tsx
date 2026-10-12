import type { LucideIcon } from 'lucide-react';

import { CalendarCheck, Check, ChevronRight, ClipboardList, Gamepad2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useAttendanceToday } from '@entities/attendance';
import { useGameList } from '@entities/game';
import { useMissionList } from '@entities/mission';
import {
    TICKET_GRADE_IMAGE,
    TICKET_GRADE_LABEL,
    TICKET_GRADES,
    useMyTickets,
    useTicketHistories,
} from '@entities/ticket';
import { hasGamePlayer } from '@features/playGame';
import { formatNumber } from '@shared/lib/format';
import { useCountUp } from '@shared/lib/useCountUp';
import { useVirtualClock } from '@shared/lib/virtualClock';

import ticketCharacter from '../assets/ticket-character.png';
import { summarizeMonthlyTickets } from '../lib/monthlyTicketSummary';
import { summarizeTodayRewards } from '../lib/todayRewards';
import { MISSION_SECTION_IDS } from '../model/sectionIds';

const DATE_FORMAT = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
});

const scrollToSection = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/** 오늘 할 일 한 칸 — 완료면 노란 테두리와 체크, 아니면 진행 막대 */
function TodayStep({
    icon: Icon,
    label,
    value,
    ratio,
    done,
    sectionId,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    /** 진행 비율 0~1 (모르면 undefined) */
    ratio: number | undefined;
    done: boolean;
    sectionId: string;
}) {
    return (
        <button
            type="button"
            onClick={() => scrollToSection(sectionId)}
            className={`bg-surface-page focus-visible:ring-border-focus relative flex min-w-0 cursor-pointer flex-col gap-2 rounded-2xl p-3 text-left shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none sm:gap-3 sm:p-4 ${done ? 'ring-ticket-primary ring-2' : ''}`}
        >
            <span className="flex items-center justify-between">
                <span
                    className={`flex size-8 items-center justify-center rounded-full sm:size-9 ${done ? 'bg-ticket-primary text-ticket-on' : 'bg-surface-canvas text-fg-primary'}`}
                >
                    {done ? (
                        <Check className="size-5" strokeWidth={3} />
                    ) : (
                        <Icon className="size-5" />
                    )}
                </span>
                <ChevronRight aria-hidden className="text-fg-tertiary hidden size-4 sm:block" />
            </span>
            <span className="flex flex-col gap-0.5">
                <span className="text-caption sm:text-body-sm text-fg-secondary">{label}</span>
                <span className="text-body-sm-bold sm:text-body-bold text-fg-primary truncate tabular-nums">
                    {value}
                </span>
            </span>
            <span aria-hidden className="bg-surface-canvas h-1.5 overflow-hidden rounded-full">
                <span
                    className="bg-ticket-primary block h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${Math.round((ratio ?? 0) * 100)}%` }}
                />
            </span>
        </button>
    );
}

/**
 * 미션 페이지 머리 — "오늘의 적립".
 * 왼쪽: 오늘 날짜와 오늘 더 받을 수 있는 응모권 수, 출석·게임·설문퀴즈 진행 세 칸(누르면 해당 섹션으로)
 * 오른쪽: 내 응모권 지갑 — 사용 가능 장수, 등급별 보유(피그마 image 193 응모권 그림), 이번 달 적립·사용, 내역 바로가기
 */
export function TodayRewardsBanner() {
    const { data: today } = useAttendanceToday();
    const { data: games } = useGameList();
    const { data: missions } = useMissionList();
    const { data: tickets } = useMyTickets();
    const { data: history } = useTicketHistories();
    // 날짜·이번 달 판정은 표시용이므로 마운트 시각을 쓴다
    const clock = useVirtualClock();
    const [now] = useState(() => clock.now());
    const monthly = history ? summarizeMonthlyTickets(history, now) : undefined;
    const balance = useCountUp(tickets?.availableCount);

    const progress = summarizeTodayRewards({
        attended: today?.attended,
        // 준비 중인 게임은 보상을 받을 수 없어 세지 않는다
        games: games?.filter((game) => hasGamePlayer(game.id)),
        missions,
    });
    const allDone =
        progress.attendance?.done === true &&
        progress.games !== undefined &&
        progress.missions !== undefined &&
        progress.remaining === 0;
    const format = (n: number | undefined) => (n == null ? '-' : formatNumber(n));

    return (
        <section
            aria-labelledby="today-rewards-title"
            className="bg-play-yellow-soft relative overflow-hidden rounded-3xl"
        >
            {/* 배경 장식 — 응모권 노랑·분홍 동그라미 */}
            <span
                aria-hidden
                className="bg-ticket-primary/25 absolute -top-24 -right-20 size-80 rounded-full"
            />
            <span
                aria-hidden
                className="bg-play-pink-soft absolute -bottom-28 left-1/3 size-64 rounded-full"
            />

            <div className="relative grid items-center gap-8 p-6 md:p-10 lg:grid-cols-[1fr_22rem]">
                <div className="flex min-w-0 flex-col">
                    <p className="text-body-sm-bold text-fg-secondary">
                        {DATE_FORMAT.format(now)} · 오늘의 적립
                    </p>
                    <h1 id="today-rewards-title" className="text-title-1 text-fg-primary mt-2">
                        {allDone ? (
                            '오늘 받을 응모권을 다 모았어요!'
                        ) : (
                            <>
                                오늘 응모권{' '}
                                <span className="decoration-ticket-primary underline decoration-8 underline-offset-[-2px] [text-decoration-skip-ink:none]">
                                    {progress.remaining}장
                                </span>{' '}
                                더 받을 수 있어요
                            </>
                        )}
                    </h1>
                    <p className="text-body text-fg-secondary mt-2">
                        {allDone
                            ? '내일 또 출석하고 게임하러 와요.'
                            : '출석하고, 게임하고, 퀴즈를 풀면 응모권이 쌓여요.'}
                    </p>

                    {/* 좁은 화면에서도 세 칸을 가로로 둔다 — 세로로 쌓으면 머리가 화면을 다 차지한다 */}
                    <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
                        <TodayStep
                            icon={CalendarCheck}
                            label="출석체크"
                            value={
                                progress.attendance
                                    ? progress.attendance.done
                                        ? '완료'
                                        : '출석하기'
                                    : '-'
                            }
                            ratio={progress.attendance?.done ? 1 : 0}
                            done={progress.attendance?.done === true}
                            sectionId={MISSION_SECTION_IDS.attendance}
                        />
                        <TodayStep
                            icon={Gamepad2}
                            label="게임 보상"
                            value={
                                progress.games
                                    ? `${progress.games.done} / ${progress.games.total}`
                                    : '-'
                            }
                            ratio={
                                progress.games && progress.games.total > 0
                                    ? progress.games.done / progress.games.total
                                    : undefined
                            }
                            done={
                                !!progress.games &&
                                progress.games.total > 0 &&
                                progress.games.done === progress.games.total
                            }
                            sectionId={MISSION_SECTION_IDS.games}
                        />
                        <TodayStep
                            icon={ClipboardList}
                            label="설문 · 퀴즈"
                            value={
                                progress.missions
                                    ? `${progress.missions.done} / ${progress.missions.total}`
                                    : '-'
                            }
                            ratio={
                                progress.missions && progress.missions.total > 0
                                    ? progress.missions.done / progress.missions.total
                                    : undefined
                            }
                            done={
                                !!progress.missions &&
                                progress.missions.total > 0 &&
                                progress.missions.done === progress.missions.total
                            }
                            sectionId={MISSION_SECTION_IDS.missions}
                        />
                    </div>
                </div>

                {/* 내 응모권 지갑 — 응모권을 든 캐릭터가 오른쪽 위에 걸터앉는다 (사용 가능 장수 오른쪽 빈자리) */}
                <div className="bg-surface-page relative mt-8 rounded-2xl p-5 pt-6 shadow-md lg:mt-0">
                    <img
                        src={ticketCharacter}
                        alt=""
                        className="pointer-events-none absolute -top-9 right-2 size-28 object-contain drop-shadow-sm"
                    />
                    <p className="text-body-sm text-fg-secondary">사용 가능 응모권</p>
                    <p className="text-title-1 text-fg-primary tabular-nums">{format(balance)}장</p>

                    <ul className="mt-4 grid grid-cols-3 gap-2" aria-label="등급별 보유 응모권">
                        {TICKET_GRADES.map((grade) => (
                            <li
                                key={grade}
                                className="bg-surface-canvas flex flex-col items-center gap-1 rounded-xl px-1.5 pt-2 pb-1.5"
                            >
                                <img
                                    src={TICKET_GRADE_IMAGE[grade]}
                                    alt=""
                                    className="h-auto w-full max-w-11"
                                />
                                <span className="text-caption text-fg-secondary">
                                    {TICKET_GRADE_LABEL[grade]}
                                </span>
                                <span className="text-body-sm-bold text-fg-primary tabular-nums">
                                    {format(tickets?.countByGrade[grade])}장
                                </span>
                            </li>
                        ))}
                    </ul>

                    <div className="border-border-default mt-4 flex items-center justify-between gap-3 border-t pt-3">
                        <span className="text-caption text-fg-tertiary whitespace-nowrap">
                            이번 달 적립 {format(monthly?.earned)} · 사용 {format(monthly?.used)}
                        </span>
                        <Link
                            to="/my-tickets"
                            className="text-body-sm-bold text-fg-primary focus-visible:ring-border-focus flex shrink-0 items-center gap-0.5 rounded-sm whitespace-nowrap hover:underline focus-visible:ring-2 focus-visible:outline-none"
                        >
                            내역
                            <ChevronRight className="size-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
