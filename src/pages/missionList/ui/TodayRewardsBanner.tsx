import type { CSSProperties } from 'react';

import { ArrowDown, Check, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
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

import itemCup from '../assets/item-cup.png';
import itemFlag from '../assets/item-flag.png';
import itemJar from '../assets/item-jar.png';
import itemMayo from '../assets/item-mayo.png';
import itemSauce from '../assets/item-sauce.png';
import itemSkewer from '../assets/item-skewer.png';
import shopCounter from '../assets/shop-counter.jpg';
import shopWall from '../assets/shop-wall.jpg';
import stepAttendance from '../assets/step-attendance.png';
import stepGame from '../assets/step-game.png';
import stepMission from '../assets/step-mission.png';
import ticketCharacter from '../assets/ticket-character.png';
import { summarizeMonthlyTickets } from '../lib/monthlyTicketSummary';
import { isMissionOpen, summarizeTodayRewards } from '../lib/todayRewards';
import { useSlotNumber } from '../lib/useSlotNumber';
import { MISSION_SECTION_IDS } from '../model/sectionIds';
import { TicketGradeInfo } from './TicketGradeInfo';

/** 응모권 모양 — 양옆 절취선 높이를 반원으로 파낸다 (왼쪽 반·오른쪽 반에 각각 구멍 하나) */
// 홈은 절취선 높이에 판다 — 카드 아래 여백(p-5 1.25rem) + 내역 줄(body-sm 1.375rem) + 절취선 위 여백(pt-3 0.75rem)
const PERFORATION_FROM_BOTTOM = '3.375rem';
const TICKET_NOTCH_MASK: CSSProperties = {
    mask: `radial-gradient(circle at 0 calc(100% - ${PERFORATION_FROM_BOTTOM}), transparent 14px, #000 14.5px) left / 51% 100% no-repeat, radial-gradient(circle at 100% calc(100% - ${PERFORATION_FROM_BOTTOM}), transparent 14px, #000 14.5px) right / 51% 100% no-repeat`,
};

/** 기준 시각을 다시 읽는 간격 */
const NOW_REFRESH_MS = 60_000;

const DATE_FORMAT = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
});

const scrollToSection = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/** 진행 점은 이 개수까지만 그린다 — 넘으면 숫자만 둔다 */
const MAX_PROGRESS_DOTS = 8;

/** 오늘 할 일 한 칸 — 픽셀 아이콘(피그마 image 199·206·207)을 바탕 없이 둔다. 완료면 노란 테두리와 아이콘 귀퉁이에 노란 체크.
 * 숫자 옆 점(●●○)으로 진행을 보여 준다. 누르면 아래 해당 섹션으로 내려간다 — 누를 수 있다는 걸 알리도록
 * 오른쪽 위에 아래 화살표를 늘 두고(터치에서도 보이게), 마우스를 올리면 화살표가 진해지고 그림자가 깊어진다. 칸은 움직이지 않는다 */
function TodayStep({
    icon,
    iconScale,
    label,
    value,
    count,
    done,
    sectionId,
}: {
    /** 픽셀 아이콘 그림 */
    icon: string;
    /** 그림마다 여백이 달라 크기가 달라 보일 때 맞추는 배율 클래스 */
    iconScale?: string;
    label: string;
    value: string;
    /** 진행 (모르면 undefined) */
    count: { done: number; total: number } | undefined;
    done: boolean;
    sectionId: string;
}) {
    return (
        <button
            type="button"
            onClick={() => scrollToSection(sectionId)}
            className={`group/step bg-surface-page focus-visible:ring-border-focus relative flex min-w-0 cursor-pointer flex-col gap-2 rounded-2xl p-3 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:outline-none sm:gap-3 sm:p-4 ${done ? 'ring-ticket-primary ring-2' : ''}`}
        >
            <ArrowDown
                aria-hidden
                className="text-fg-disabled group-hover/step:text-fg-primary absolute top-3 right-3 size-4 transition-colors sm:top-4 sm:right-4"
            />
            <span className="relative size-8 sm:size-9">
                <img src={icon} alt="" className={`size-full object-contain ${iconScale ?? ''}`} />
                {done && (
                    <span className="bg-ticket-primary text-ticket-on ring-surface-page absolute -right-1 -bottom-1 flex size-4.5 items-center justify-center rounded-full ring-2">
                        <Check className="size-3" strokeWidth={3} />
                    </span>
                )}
            </span>
            <span className="flex flex-col gap-0.5">
                <span className="text-caption sm:text-body-sm text-fg-secondary">{label}</span>
                <span className="flex min-w-0 items-center gap-2">
                    <span className="text-body-sm-bold sm:text-body-bold text-fg-primary truncate tabular-nums">
                        {value}
                    </span>
                    {count && count.total > 0 && count.total <= MAX_PROGRESS_DOTS && (
                        <span aria-hidden className="flex shrink-0 gap-1">
                            {Array.from({ length: count.total }, (_, index) => (
                                <span
                                    key={index}
                                    className={`size-1.5 rounded-full ${index >= count.done ? 'bg-border-strong' : done ? 'bg-ticket-primary' : 'bg-fg-primary'}`}
                                />
                            ))}
                        </span>
                    )}
                </span>
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
    // 날짜·이번 달·진행 중 미션 판정 기준 시각 — 페이지를 열어 둔 채 기준일이 바뀌어도
    // 출석 상태(주기적으로 다시 받는다)와 같은 날을 보도록 1분마다 다시 읽는다
    const clock = useVirtualClock();
    const [now, setNow] = useState(() => clock.now());
    useEffect(() => {
        const timer = setInterval(() => setNow(clock.now()), NOW_REFRESH_MS);
        return () => clearInterval(timer);
    }, [clock]);
    const monthly = history ? summarizeMonthlyTickets(history, now) : undefined;
    const balance = useCountUp(tickets?.availableCount);

    const progress = summarizeTodayRewards({
        attended: today?.attended,
        // 준비 중인 게임은 보상을 받을 수 없어 세지 않는다
        games: games?.filter((game) => hasGamePlayer(game.id)),
        // 지금 참여할 수 있는 미션만 센다 — 목록 카드는 기간이 지난 미션도 그대로 보여 준다
        missions: missions?.filter((mission) => isMissionOpen(mission, now)),
    });
    // 출석·게임·미션을 다 불러오기 전에는 남은 장수가 0으로 잡혀 틀린 숫자가 보이니 '-'로 둔다
    const ready =
        progress.attendance !== undefined &&
        progress.games !== undefined &&
        progress.missions !== undefined;
    const allDone = ready && progress.attendance?.done === true && progress.remaining === 0;
    // 오늘 더 받을 장수는 슬롯처럼 무작위 숫자가 잠깐 돌다가 멈춘다 — 작은 수를 세어 올리면 너무 빨리 끝나 어색하다
    const remaining = useSlotNumber(progress.remaining);
    const format = (n: number | undefined) => (n == null ? '-' : formatNumber(n));

    return (
        <section
            aria-labelledby="today-rewards-title"
            // 타코야끼 가게 — 벽(피그마 image 197 벽 부분)을 배경으로 깔고 아래에 카운터 띠(image 198)를 둔다. --counter는 카운터 띠 높이
            className="bg-play-yellow-soft relative overflow-hidden rounded-3xl bg-cover bg-top [--counter:clamp(4.5rem,8vw,6rem)]"
            style={{ backgroundImage: `url(${shopWall})` }}
        >
            {/* 벽 그림이 어두운 웜톤이라 흰 막을 얇게 덮어 페이지 바탕과 어울리게 밝힌다 */}
            <div aria-hidden className="bg-surface-page/45 absolute inset-0" />
            {/* 카운터 띠 — 이음매 없이 이어지도록 자른 타일·나무를 가로로 반복한다 */}
            <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-(--counter) bg-size-[auto_100%] bg-left bg-repeat-x"
                style={{ backgroundImage: `url(${shopCounter})` }}
            />
            {/* 카운터 위 소품(image 105 소스병, image 106 꼬치) — 왼쪽 끝 소스·마요·잼병, 오른쪽 끝 꼬치·이쑤시개 통·깃발.
                가장 큰 깃발도 카운터 띠 높이의 1.5배 안에 들어와, 내용 아래 여백(--counter의 1.5배)에 가려지지 않는다 */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-3 bottom-[calc(var(--counter)*0.5)] flex items-end justify-between md:inset-x-5"
            >
                <div className="flex items-end gap-1">
                    <img src={itemSauce} alt="" className="h-[calc(var(--counter)*0.7)] w-auto" />
                    <img src={itemMayo} alt="" className="h-[calc(var(--counter)*0.7)] w-auto" />
                    <img
                        src={itemJar}
                        alt=""
                        className="hidden h-[calc(var(--counter)*0.5)] w-auto sm:block"
                    />
                </div>
                <div className="flex items-end gap-1">
                    <img
                        src={itemSkewer}
                        alt=""
                        className="hidden h-[calc(var(--counter)*0.75)] w-auto sm:block"
                    />
                    <img src={itemCup} alt="" className="h-[calc(var(--counter)*0.5)] w-auto" />
                    <img src={itemFlag} alt="" className="h-[calc(var(--counter)*0.95)] w-auto" />
                </div>
            </div>

            <div className="relative grid items-center gap-8 p-6 pb-[calc(var(--counter)*1.5+0.5rem)] md:p-10 md:pb-[calc(var(--counter)*1.5+0.5rem)] lg:grid-cols-[1fr_22rem]">
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
                                <span className="text-display text-fg-primary tabular-nums">
                                    {ready ? remaining : '-'}장
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
                            icon={stepAttendance}
                            // 타코야끼는 그림 안 여백이 적어 다른 두 아이콘보다 커 보여 조금 줄인다
                            iconScale="scale-[0.82]"
                            label="출석체크"
                            value={
                                progress.attendance
                                    ? progress.attendance.done
                                        ? '완료'
                                        : '출석하기'
                                    : '-'
                            }
                            count={undefined}
                            done={progress.attendance?.done === true}
                            sectionId={MISSION_SECTION_IDS.attendance}
                        />
                        <TodayStep
                            icon={stepGame}
                            label="게임 보상"
                            value={
                                progress.games
                                    ? `${progress.games.done} / ${progress.games.total}`
                                    : '-'
                            }
                            count={progress.games}
                            done={
                                !!progress.games &&
                                progress.games.total > 0 &&
                                progress.games.done === progress.games.total
                            }
                            sectionId={MISSION_SECTION_IDS.games}
                        />
                        <TodayStep
                            icon={stepMission}
                            label="설문 · 퀴즈"
                            value={
                                progress.missions
                                    ? `${progress.missions.done} / ${progress.missions.total}`
                                    : '-'
                            }
                            count={progress.missions}
                            done={
                                !!progress.missions &&
                                progress.missions.total > 0 &&
                                progress.missions.done === progress.missions.total
                            }
                            sectionId={MISSION_SECTION_IDS.missions}
                        />
                    </div>
                </div>

                {/* 내 응모권 지갑 — 응모권 모양(양옆 반원 홈·절취선). 응모권을 든 캐릭터가 오른쪽 위에 걸터앉는다 */}
                <div className="relative mt-8 lg:mt-0">
                    <img
                        src={ticketCharacter}
                        alt=""
                        className="pointer-events-none absolute -top-9 right-2 z-10 size-28 object-contain"
                    />
                    <div
                        className="bg-surface-page border-border-default rounded-2xl border p-5 pt-6"
                        style={TICKET_NOTCH_MASK}
                    >
                        <p className="text-body-sm text-fg-secondary flex items-center gap-1">
                            사용 가능 응모권
                            <TicketGradeInfo />
                        </p>
                        <p className="text-title-2 text-fg-primary tabular-nums">
                            {format(balance)}장
                        </p>

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

                        {/* 절취선 */}
                        <div className="border-border-default mt-4 flex items-center justify-between gap-3 border-t border-dashed pt-3">
                            <span className="text-caption text-fg-tertiary whitespace-nowrap">
                                이번 달 적립 {format(monthly?.earned)} · 사용{' '}
                                {format(monthly?.used)}
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
            </div>
        </section>
    );
}
