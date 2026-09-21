import type { LucideIcon } from 'lucide-react';

import { CalendarCheck, ChevronRight, ClipboardList, Gamepad2, Ticket } from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';

import { useGameList } from '@entities/game';
import { useMissionList } from '@entities/mission';
import { useTicketBalance } from '@entities/ticket';
import { useAttendanceStatus } from '@features/check-attendance';
import { formatNumber } from '@shared/lib/format';
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

export function TicketBalanceWidget() {
    const { data: balance } = useTicketBalance();
    const { data: attendance } = useAttendanceStatus();
    const { data: missions } = useMissionList();
    const { data: games } = useGameList();
    const drag = useRef<{
        startX: number;
        scrollLeft: number;
        dragged: boolean;
        lastX: number;
        lastT: number;
        velocity: number;
    } | null>(null);
    const momentumRaf = useRef<number | null>(null);
    const suppressClick = useRef(false);

    // 드래그를 놓은 순간의 속도로 감속 스크롤 — 새 드래그가 시작되면 즉시 중단된다
    const startMomentum = (el: HTMLDivElement, velocity: number) => {
        let v = Math.max(-40, Math.min(40, velocity));
        const step = () => {
            if (Math.abs(v) < 0.3) {
                momentumRaf.current = null;
                return;
            }
            el.scrollLeft += v;
            v *= 0.94;
            momentumRaf.current = requestAnimationFrame(step);
        };
        momentumRaf.current = requestAnimationFrame(step);
    };

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
                <Link
                    to="/missions"
                    className="text-fg-primary text-body-sm flex items-center gap-0.5"
                >
                    전체보기
                    <ChevronRight className="size-5" />
                </Link>
            </div>
            {/* 한 화면에 N.5장 — 반 장이 잘려 보이며 옆으로 더 있다는 암시를 준다. 마우스는 드래그로, 터치는 브라우저 네이티브 스크롤로 움직인다 */}
            <div
                onPointerDown={(e) => {
                    if (e.pointerType !== 'mouse' || e.button !== 0) return;
                    if (momentumRaf.current) {
                        cancelAnimationFrame(momentumRaf.current);
                        momentumRaf.current = null;
                    }
                    drag.current = {
                        startX: e.clientX,
                        scrollLeft: e.currentTarget.scrollLeft,
                        dragged: false,
                        lastX: e.clientX,
                        lastT: performance.now(),
                        velocity: 0,
                    };
                }}
                onPointerMove={(e) => {
                    const d = drag.current;
                    if (!d) return;
                    const dx = e.clientX - d.startX;
                    if (!d.dragged) {
                        if (Math.abs(dx) < 4) return;
                        d.dragged = true;
                        e.currentTarget.setPointerCapture(e.pointerId);
                    }
                    const t = performance.now();
                    const dt = t - d.lastT;
                    if (dt > 0) {
                        // 최근 이동 속도(px/frame)를 지수 평활해 놓을 때 관성에 쓴다
                        d.velocity = d.velocity * 0.7 + ((d.lastX - e.clientX) / dt) * 16 * 0.3;
                        d.lastX = e.clientX;
                        d.lastT = t;
                    }
                    e.currentTarget.scrollLeft = d.scrollLeft - dx;
                }}
                onPointerUp={(e) => {
                    if (drag.current?.dragged) {
                        suppressClick.current = true;
                        startMomentum(e.currentTarget, drag.current.velocity);
                    }
                    drag.current = null;
                }}
                onPointerCancel={() => (drag.current = null)}
                // 드래그로 이동한 뒤 발생하는 클릭은 카드 링크로 전파되지 않게 차단한다
                onClickCapture={(e) => {
                    if (!suppressClick.current) return;
                    e.preventDefault();
                    e.stopPropagation();
                    suppressClick.current = false;
                }}
                className="flex cursor-grab [scrollbar-width:none] gap-4 overflow-x-auto select-none active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
            >
                {cards.map((card) => (
                    <div
                        key={card.id}
                        className="bg-surface-page border-border-default flex w-[calc((100%-1rem)/1.5)] shrink-0 flex-col gap-3 rounded-2xl border p-4 sm:w-[calc((100%-2rem)/2.5)] lg:w-[calc((100%-3rem)/3.7)]"
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
                        {/* 티켓 펀칭 효과 — 페이지 배경색 반원을 카드 좌우 끝에 올려 테두리·점선을 끊는다 */}
                        <div className="border-border-default relative -mx-4 mt-auto border-t border-dashed">
                            <span
                                aria-hidden
                                className="bg-surface-page border-border-default absolute top-0 -left-px h-4 w-2 -translate-y-1/2 rounded-r-full border border-l-0 shadow-[inset_-2px_0_3px_-1px_rgb(18_22_27_/_0.12)]"
                            />
                            <span
                                aria-hidden
                                className="bg-surface-page border-border-default absolute top-0 -right-px h-4 w-2 -translate-y-1/2 rounded-l-full border border-r-0 shadow-[inset_2px_0_3px_-1px_rgb(18_22_27_/_0.12)]"
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
                    </div>
                ))}
            </div>
        </section>
    );
}
