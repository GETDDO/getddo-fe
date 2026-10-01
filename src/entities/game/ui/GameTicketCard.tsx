import { Gamepad2, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@shared/lib/utils';

import type { Game } from '../model/types';

/** 게임 보상은 게임별 하루 1회 응모권 1장 (getddo-spec 게임 규칙) */
const DAILY_GAME_REWARD = 1;

/*
 * 티켓 모양 — 피그마 Group 633903 기준.
 * 카드(높이 360) 좌우 끝을 지름 26.8의 원으로 도려낸다(중심 = 위에서 258.5px, 절취선 높이).
 * 테두리는 CSS border 대신 도려낸 모양을 따라 1px 윤곽을 그려(CARD_OUTLINE) 구멍 둘레까지 한 줄로 이어지게 한다
 */
const PUNCH_CENTER_Y = '258.5px';
const PUNCH_MASK = {
    maskImage: [
        `radial-gradient(circle 13.4px at left ${PUNCH_CENTER_Y}, transparent 98%, black 100%)`,
        `radial-gradient(circle 13.4px at right ${PUNCH_CENTER_Y}, transparent 98%, black 100%)`,
    ].join(', '),
    maskComposite: 'intersect',
} as const;
/** 도려낸 카드 모양을 따라 상하좌우로 1px씩 border/default 색을 번지게 해 윤곽선을 만든다 */
const CARD_OUTLINE = ['1px 0', '-1px 0', '0 1px', '0 -1px']
    .map((offset) => `drop-shadow(${offset} 0 var(--color-border-default))`)
    .join(' ');
/** 피그마 카드 그림자 — 0 4 6 ink 8% + 0 2 4 ink 6% */
const CARD_SHADOW =
    'drop-shadow(0 4px 6px rgb(from var(--color-ink) r g b / 0.08)) drop-shadow(0 2px 4px rgb(from var(--color-ink) r g b / 0.06))';

/**
 * 게임 티켓 카드 — 썸네일, 설명, 오늘 받을 응모권, 플레이 버튼.
 * 게임은 횟수 제한 없이 플레이할 수 있어서, 오늘 보상을 받은 뒤에도 버튼은 계속 누를 수 있다.
 * 펀칭 구멍은 실제로 도려내서 어느 배경 위에 놓여도 그 배경이 비쳐 보인다
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
        // 그림자는 도려낸 카드 모양을 따라가도록 바깥 틀에 filter로 건다 (box-shadow는 마스크에 함께 잘린다)
        <div className={cn('shrink-0', className)} style={{ filter: CARD_SHADOW }}>
            <div style={{ filter: CARD_OUTLINE }}>
                <article
                    className="bg-surface-page relative flex h-90 w-66.25 flex-col rounded-2xl p-4"
                    style={PUNCH_MASK}
                >
                    <div className="bg-play-lavender-soft flex h-30 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                        {game.thumbnailUrl ? (
                            <img
                                src={game.thumbnailUrl}
                                alt=""
                                className="size-full object-cover"
                            />
                        ) : (
                            <Gamepad2 aria-hidden className="text-fg-tertiary size-8" />
                        )}
                    </div>

                    <div className="mt-3 flex flex-col gap-2">
                        <div className="flex flex-col">
                            <span className="text-caption text-fg-tertiary">GAME</span>
                            <h3 className="text-subhead text-fg-primary truncate">{game.title}</h3>
                        </div>
                        {game.description && (
                            <p className="text-body-sm text-fg-tertiary line-clamp-2">
                                {game.description}
                            </p>
                        )}
                    </div>

                    {/* 아래쪽 — 절취선(펀칭 중심 높이) · 응모권 줄 · 버튼. 높이를 고정해 절취선이 늘 같은 자리에 온다 */}
                    <div className="mt-auto flex flex-col">
                        <div
                            aria-hidden
                            className="border-border-default mx-3 border-t border-dashed"
                        />
                        <div className="mt-3.75 flex h-4.5 items-center justify-between gap-2">
                            <span className="text-caption text-fg-tertiary">응모권</span>
                            {rewarded ? (
                                <span className="text-caption text-fg-tertiary">오늘 받음</span>
                            ) : (
                                <span className="text-body-sm-bold text-brand-primary flex items-center gap-1">
                                    <Ticket aria-hidden className="size-4.5" />+{DAILY_GAME_REWARD}
                                </span>
                            )}
                        </div>

                        {/* 디자인 시스템 action/neutral 기본·호버·누름 색 */}
                        <Link
                            to={href}
                            className="bg-action-neutral hover:bg-action-neutral-hover active:bg-action-neutral-pressed text-fg-on-brand text-body-bold focus-visible:ring-border-focus mt-1 flex h-12 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
                        >
                            {rewarded ? '한 번 더 하기' : '게임하러 가기'}
                        </Link>
                    </div>
                </article>
            </div>
        </div>
    );
}
