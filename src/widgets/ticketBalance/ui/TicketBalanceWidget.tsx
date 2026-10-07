import type { LucideIcon } from 'lucide-react';

import { motion, useReducedMotion } from 'framer-motion';
import { CalendarCheck, ChevronRight, ClipboardList, Gamepad2, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAttendanceStatus } from '@entities/attendance';
import { useGameList } from '@entities/game';
import { useMissionList } from '@entities/mission';
import { useDragScroll } from '@shared/lib/useDragScroll';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import { TicketCard } from '@shared/ui/ticket-card';

interface EarnCard {
    id: string;
    category: string;
    title: string;
    description: string;
    rewardTickets: number;
    href: string;
    actionLabel: string;
    completed: boolean;
    /** 카드 상단 썸네일 — 이미지가 있으면 보여주고(게임), 없으면 임시로 회색 블록 + 아이콘 */
    thumbnailUrl: string | null;
    thumbnailIcon: LucideIcon;
}

/**
 * railClassName: 카드 가로 스크롤 영역에 덧붙일 클래스 (예: 화면 끝까지 펼치기)
 * cardClassName: 카드에 덧붙일 클래스 (예: 고정 너비) — 넘기지 않으면 기존 모양 그대로다
 * sortCompletedLast: 오늘 참여를 마친 카드(출석 완료 등)를 목록 맨 뒤로 보낸다
 * hideMoreLink: 제목 옆 '더보기' 링크를 숨긴다 (미션 페이지처럼 이미 전체 목록인 곳)
 */
export function TicketBalanceWidget({
    railClassName,
    cardClassName,
    sortCompletedLast = false,
    hideMoreLink = false,
}: {
    railClassName?: string;
    cardClassName?: string;
    sortCompletedLast?: boolean;
    hideMoreLink?: boolean;
} = {}) {
    const { data: attendance } = useAttendanceStatus();
    const { data: missions } = useMissionList();
    const { data: games } = useGameList();
    // 마우스 드래그 + 관성 스크롤은 공용 훅을 쓴다 (터치는 브라우저 네이티브 스크롤)
    const dragScroll = useDragScroll<HTMLDivElement>();

    const cards: EarnCard[] = [
        ...(attendance
            ? [
                  {
                      id: 'attendance',
                      category: 'ATTENDANCE',
                      title: '오늘 출석 체크',
                      description: '하루 한 번, 누르면 바로 받아요',
                      rewardTickets: 1,
                      href: '/missions',
                      actionLabel: '출석하러 가기',
                      completed: attendance.attended,
                      thumbnailUrl: null,
                      thumbnailIcon: CalendarCheck,
                  },
              ]
            : []),
        ...(missions ?? []).map((mission) => ({
            id: mission.id,
            category: 'MISSION',
            title: mission.title,
            description: '미션마다 1장씩, 한 번만 받을 수 있어요',
            rewardTickets: mission.rewardTicketCount,
            href: '/missions',
            actionLabel: '미션하러 가기',
            completed: mission.completed,
            thumbnailUrl: null,
            thumbnailIcon: ClipboardList,
        })),
        ...(games ?? []).map((game) => ({
            id: game.id,
            category: 'GAME',
            title: game.title,
            description: `하루 최대 ${game.dailyLimit}회, 참여마다 응모권을 받아요`,
            rewardTickets: 1,
            href: `/missions/games/${game.id}`,
            actionLabel: '게임하러 가기',
            completed: game.remainingPlays === 0,
            thumbnailUrl: game.thumbnailUrl ?? null,
            thumbnailIcon: Gamepad2,
        })),
    ];

    // 운영체제의 동작 줄이기 설정을 켠 사용자에게는 카드 이동 애니메이션을 끈다
    const reduceMotion = useReducedMotion();
    const orderedCards = sortCompletedLast
        ? [...cards.filter((card) => !card.completed), ...cards.filter((card) => card.completed)]
        : cards;

    if (cards.length === 0) {
        return null;
    }

    return (
        <section className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-title-3 text-fg-primary">오늘 받을 수 있는 응모권</h2>
                    <span className="text-fg-tertiary text-caption">
                        출석과 게임 보상은 매일 자정(00:00 KST)에 다시 받을 수 있어요.
                    </span>
                </div>
                {!hideMoreLink && (
                    <Button asChild variant="link" size="text">
                        <Link to="/missions">
                            더보기
                            <ChevronRight />
                        </Link>
                    </Button>
                )}
            </div>
            {/* 한 화면에 N.5장 — 반 장이 잘려 보이며 옆으로 더 있다는 암시를 준다. 마우스는 드래그로, 터치는 브라우저 네이티브 스크롤로 움직인다 */}
            <motion.div
                layoutScroll
                {...dragScroll}
                className={cn(
                    // 카드 그림자가 잘리지 않게 사방에 12px 여백을 두고 같은 만큼 당긴다
                    '-m-3 flex cursor-grab scroll-px-3 [scrollbar-width:none] gap-4 overflow-x-auto p-3 select-none active:cursor-grabbing [&::-webkit-scrollbar]:hidden',
                    railClassName,
                )}
            >
                {orderedCards.map((card) => (
                    // 순서가 바뀌면(완료 카드 뒤로 보내기 등) 카드가 새 자리로 미끄러져 이동한다
                    <motion.div
                        layout="position"
                        transition={{
                            layout: reduceMotion
                                ? { duration: 0 }
                                : { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                        }}
                        key={card.id}
                        className={cn(
                            // 게임 페이지 티켓 카드와 같은 크기 (너비 265, 높이 360)
                            'flex w-66.25 shrink-0',
                            cardClassName,
                        )}
                    >
                        {/* 공용 티켓 카드 — 펀칭은 절취선 높이에 맞춰 실제로 도려낸다 (피그마 Group 633903) */}
                        <TicketCard
                            className="w-full"
                            cardClassName="h-90"
                            stub={
                                <>
                                    <div className="mt-3.75 flex h-4.5 items-center justify-between gap-2">
                                        <span className="text-fg-tertiary text-caption">
                                            응모권
                                        </span>
                                        <span className="text-ticket-on text-body-sm-bold flex items-center gap-1">
                                            <Ticket className="size-4.5" />+{card.rewardTickets}
                                        </span>
                                    </div>
                                    {card.completed ? (
                                        <Button disabled size="lg" className="mt-2 w-full">
                                            오늘 참여 완료
                                        </Button>
                                    ) : (
                                        <Button
                                            asChild
                                            // 출석만 primary(검정), 게임·미션 카드는 secondary로 한 단계 낮춘다
                                            variant={
                                                card.id === 'attendance' ? 'primary' : 'secondary'
                                            }
                                            size="lg"
                                            className="mt-2 w-full"
                                        >
                                            <Link to={card.href}>{card.actionLabel}</Link>
                                        </Button>
                                    )}
                                </>
                            }
                        >
                            <div className="bg-surface-canvas flex h-30 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                                {card.thumbnailUrl ? (
                                    <img
                                        src={card.thumbnailUrl}
                                        alt=""
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <card.thumbnailIcon className="text-fg-disabled size-8" />
                                )}
                            </div>
                            <div className="mt-3 flex flex-col gap-2">
                                <div className="flex flex-col">
                                    <span className="text-fg-tertiary text-caption">
                                        {card.category}
                                    </span>
                                    <p className="text-body-bold text-fg-primary truncate">
                                        {card.title}
                                    </p>
                                </div>
                                <p className="text-fg-tertiary text-body-sm line-clamp-2">
                                    {card.description}
                                </p>
                            </div>
                        </TicketCard>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
}
