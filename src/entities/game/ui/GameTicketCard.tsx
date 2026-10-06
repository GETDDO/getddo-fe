import { Gamepad2, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@shared/ui/button';
import { TicketCard } from '@shared/ui/ticket-card';

import type { Game } from '../model/types';

/** 게임 보상은 게임별 하루 1회 응모권 1장 (getddo-spec 게임 규칙) */
const DAILY_GAME_REWARD = 1;

/**
 * 게임 티켓 카드 — 썸네일, 설명, 오늘 받을 응모권, 플레이 버튼 (공용 TicketCard, 피그마 Group 633903).
 * 게임은 횟수 제한 없이 플레이할 수 있어서, 오늘 보상을 받은 뒤에도 버튼은 계속 누를 수 있다
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
        <TicketCard
            className={className}
            cardClassName="h-90 w-66.25"
            stub={
                <>
                    <div className="mt-3.75 flex h-4.5 items-center justify-between gap-2">
                        <span className="text-caption text-fg-tertiary">응모권</span>
                        {rewarded ? (
                            <span className="text-caption text-fg-tertiary">오늘 받음</span>
                        ) : (
                            <span className="text-body-sm-bold text-ticket-on flex items-center gap-1">
                                <Ticket aria-hidden className="size-4.5" />+{DAILY_GAME_REWARD}
                            </span>
                        )}
                    </div>
                    {/* 공용 버튼 primary Large(48) — 피그마 홈 응모권 카드와 같다 */}
                    <Button asChild size="lg" className="mt-2 w-full">
                        <Link to={href}>{rewarded ? '한 번 더 하기' : '게임하러 가기'}</Link>
                    </Button>
                </>
            }
        >
            <div className="bg-surface-canvas flex h-30 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                {game.thumbnailUrl ? (
                    <img src={game.thumbnailUrl} alt="" className="size-full object-cover" />
                ) : (
                    <Gamepad2 aria-hidden className="text-fg-disabled size-8" />
                )}
            </div>

            <div className="mt-3 flex flex-col gap-2">
                <div className="flex flex-col">
                    <span className="text-caption text-fg-tertiary">GAME</span>
                    <h3 className="text-body-bold text-fg-primary truncate">{game.title}</h3>
                </div>
                {game.description && (
                    <p className="text-body-sm text-fg-tertiary line-clamp-2">{game.description}</p>
                )}
            </div>
        </TicketCard>
    );
}
