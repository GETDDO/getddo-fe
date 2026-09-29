import { Gamepad2, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@shared/lib/utils';

import type { Game } from '../model/types';

/** 게임 보상은 게임별 하루 1회 응모권 1장 (getddo-spec 게임 규칙) */
const DAILY_GAME_REWARD = 1;

/**
 * 게임 티켓 카드 — 썸네일, 설명, 오늘 받을 응모권, 플레이 버튼.
 * 게임은 횟수 제한 없이 플레이할 수 있어서, 오늘 보상을 받은 뒤에도 버튼은 계속 누를 수 있다.
 * 티켓 구멍 색은 놓인 배경에 맞춰 --ticket-punch-bg로 바꿀 수 있다
 */
export function GameTicketCard({
    game,
    href,
    className,
}: {
    game: Game;
    href: string;
    className?: string;
}) {
    const rewarded = game.rewardedToday ?? false;

    return (
        <article
            className={cn(
                'bg-surface-page border-border-default flex h-90 w-66.25 shrink-0 flex-col gap-3 rounded-2xl border p-4',
                className,
            )}
        >
            <div className="bg-play-lavender-soft flex h-30 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                {game.thumbnailUrl ? (
                    <img src={game.thumbnailUrl} alt="" className="size-full object-cover" />
                ) : (
                    <Gamepad2 aria-hidden className="text-fg-tertiary size-8" />
                )}
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex flex-col">
                    <span className="text-caption text-fg-tertiary">GAME</span>
                    <h3 className="text-subhead text-fg-primary truncate">{game.title}</h3>
                </div>
                {game.description && (
                    <p className="text-body-sm text-fg-tertiary line-clamp-2">{game.description}</p>
                )}
            </div>

            {/* 티켓 절취선 — 좌우 끝에 배경색 반원을 올려 구멍처럼 보이게 한다 */}
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
                    <span className="text-caption text-fg-tertiary">응모권</span>
                    {rewarded ? (
                        <span className="text-caption text-fg-tertiary">오늘 받음</span>
                    ) : (
                        <span className="text-body-sm-bold text-brand-primary flex items-center gap-1">
                            <Ticket aria-hidden className="size-4.5" />+{DAILY_GAME_REWARD}
                        </span>
                    )}
                </div>
            </div>

            {/* 디자인 시스템 action/neutral 기본·호버·누름 색 */}
            <Link
                to={href}
                className="bg-action-neutral hover:bg-action-neutral-hover active:bg-action-neutral-pressed text-fg-on-brand text-body-bold focus-visible:ring-border-focus flex h-12 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
                {rewarded ? '한 번 더 하기' : '게임하러 가기'}
            </Link>
        </article>
    );
}
