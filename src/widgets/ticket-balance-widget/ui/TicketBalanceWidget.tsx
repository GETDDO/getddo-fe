import type { LucideIcon } from 'lucide-react';

import { motion, useReducedMotion } from 'framer-motion';
import { CalendarCheck, ChevronRight, ClipboardList, Gamepad2, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useGameList } from '@entities/game';
import { useMissionList } from '@entities/mission';
import { useTicketBalance } from '@entities/ticket';
import { useAttendanceStatus } from '@features/check-attendance';
import { formatNumber } from '@shared/lib/format';
import { useDragScroll } from '@shared/lib/use-drag-scroll';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';

interface EarnCard {
    id: string;
    category: string;
    title: string;
    description: string;
    rewardTickets: number;
    href: string;
    actionLabel: string;
    completed: boolean;
    /** 카드 상단 썸네일 — 이미지 에셋이 없어 카테고리별 색상 블록 + 아이콘으로 표시한다 */
    thumbnailClass: string;
    thumbnailIcon: LucideIcon;
}

/**
 * railClassName: 카드 가로 스크롤 영역에 덧붙일 클래스 (예: 화면 끝까지 펼치기)
 * cardClassName: 카드에 덧붙일 클래스 (예: 고정 너비) — 넘기지 않으면 기존 모양 그대로다
 * sortCompletedLast: 오늘 참여를 마친 카드(출석 완료 등)를 목록 맨 뒤로 보낸다
 * hideMoreLink: 제목 옆 '전체보기' 링크를 숨긴다 (미션 페이지처럼 이미 전체 목록인 곳)
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
    const { data: balance } = useTicketBalance();
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
                      href: '/attendance',
                      actionLabel: '출석하러 가기',
                      completed: attendance.checkedToday,
                      thumbnailClass: 'bg-play-lavender-soft',
                      thumbnailIcon: CalendarCheck,
                  },
              ]
            : []),
        ...(missions ?? []).map((mission) => ({
            id: mission.id,
            category: mission.type === 'quiz' ? 'MISSION · 퀴즈' : 'MISSION · 설문',
            title: mission.title,
            description: '미션마다 1장씩, 한 번만 받을 수 있어요',
            rewardTickets: mission.rewardTickets,
            href: '/missions',
            actionLabel: '미션하러 가기',
            completed: mission.status === 'completed',
            thumbnailClass: 'bg-play-pink-soft',
            thumbnailIcon: ClipboardList,
        })),
        ...(games ?? []).map((game) => ({
            id: game.id,
            category: 'GAME',
            title: game.title,
            description: `하루 최대 ${game.dailyLimit}회, 참여마다 응모권을 받아요`,
            rewardTickets: 1,
            href: '/games',
            actionLabel: '게임하러 가기',
            completed: game.remainingPlays === 0,
            thumbnailClass: 'bg-play-yellow-soft',
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
        <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-subhead text-fg-primary">오늘 받을 수 있는 응모권</h2>
                    {balance && (
                        <span className="text-fg-tertiary text-caption">
                            보유 응모권 {formatNumber(balance.balance)}장
                        </span>
                    )}
                    <span className="text-fg-tertiary text-caption">
                        출석과 게임 보상은 매일 오전 9시(KST)에 다시 받을 수 있어요.
                    </span>
                </div>
                {!hideMoreLink && (
                    <Link
                        to="/missions"
                        className="text-fg-primary text-body-sm flex items-center gap-0.5"
                    >
                        전체보기
                        <ChevronRight className="size-5" />
                    </Link>
                )}
            </div>
            {/* 한 화면에 N.5장 — 반 장이 잘려 보이며 옆으로 더 있다는 암시를 준다. 마우스는 드래그로, 터치는 브라우저 네이티브 스크롤로 움직인다 */}
            <motion.div
                layoutScroll
                {...dragScroll}
                className={cn(
                    'flex cursor-grab [scrollbar-width:none] gap-4 overflow-x-auto select-none active:cursor-grabbing [&::-webkit-scrollbar]:hidden',
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
                            'bg-surface-page border-border-default flex w-[calc((100%-1rem)/1.5)] shrink-0 flex-col gap-3 rounded-2xl border p-4 sm:w-[calc((100%-2rem)/2.5)] lg:w-[calc((100%-3rem)/3.7)]',
                            cardClassName,
                        )}
                    >
                        <div
                            className={`flex h-28 items-center justify-center rounded-lg ${card.thumbnailClass}`}
                        >
                            <card.thumbnailIcon className="text-fg-tertiary size-8" />
                        </div>
                        <span className="text-fg-tertiary text-caption">{card.category}</span>
                        <div className="flex flex-col gap-1">
                            <p className="text-subhead text-fg-primary">{card.title}</p>
                            <p className="text-fg-tertiary text-body-sm">{card.description}</p>
                        </div>
                        {/* 티켓 펀칭 효과 — 페이지 배경색 반원을 카드 좌우 끝에 올려 테두리·점선을 끊는다. 배경이 흰색이 아닌 곳에서는 --ticket-punch-bg로 구멍 색을 맞춘다 */}
                        <div className="border-border-default relative -mx-4 mt-auto border-t border-dashed">
                            <span
                                aria-hidden
                                className="border-border-default absolute top-0 -left-px h-4 w-2 -translate-y-1/2 rounded-r-full border border-l-0 bg-(--ticket-punch-bg,var(--color-surface-page)) shadow-[inset_-2px_0_3px_-1px_rgb(from_var(--color-ink)_r_g_b_/_0.12)]"
                            />
                            <span
                                aria-hidden
                                className="border-border-default absolute top-0 -right-px h-4 w-2 -translate-y-1/2 rounded-l-full border border-r-0 bg-(--ticket-punch-bg,var(--color-surface-page)) shadow-[inset_2px_0_3px_-1px_rgb(from_var(--color-ink)_r_g_b_/_0.12)]"
                            />
                            <div className="flex items-center justify-between gap-2 px-4 pt-3">
                                <span className="text-fg-tertiary text-caption">응모권</span>
                                <span className="text-brand-primary text-body-sm-bold flex items-center gap-1">
                                    <Ticket className="size-4" />+{card.rewardTickets}
                                </span>
                            </div>
                        </div>
                        {card.completed ? (
                            <span className="bg-surface-sunken text-fg-disabled flex h-9 items-center justify-center rounded-lg text-center text-sm font-medium">
                                오늘 참여 완료
                            </span>
                        ) : (
                            <Button asChild variant="secondary" className="w-full">
                                <Link to={card.href}>{card.actionLabel}</Link>
                            </Button>
                        )}
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
}
