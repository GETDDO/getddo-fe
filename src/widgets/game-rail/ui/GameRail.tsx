import { GameTicketCard, useGameList } from '@entities/game';
import { useDragScroll } from '@shared/lib/use-drag-scroll';

import { gameDetailPath } from '../lib/game-path';

/**
 * 게임 티켓 카드 가로 목록 섹션 — 게임별 하루 1회 응모권 1장. 오늘 보상을 이미 받은 게임은 뒤로 보낸다.
 * 카드 목록은 왼쪽은 콘텐츠 시작선에서 자르고 오른쪽만 화면 끝까지 열어 넘긴다 (--rail-inset은 놓이는 페이지가 정한다)
 */
export function GameRail({
    title,
    caption,
    excludeGameId,
}: {
    title: string;
    caption?: string;
    /** 목록에서 뺄 게임 — 게임 상세의 '다른 게임'에서 지금 보고 있는 게임을 뺀다 */
    excludeGameId?: string;
}) {
    const { data: games, isPending, isError } = useGameList();
    const dragScroll = useDragScroll<HTMLDivElement>();
    const ordered = (games ?? [])
        .filter((game) => game.id !== excludeGameId)
        .sort((a, b) => Number(a.rewardedToday ?? false) - Number(b.rewardedToday ?? false));

    return (
        <section className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="text-subhead text-fg-primary">{title}</h2>
                {caption && <p className="text-body-sm text-fg-tertiary">{caption}</p>}
            </div>
            {isPending && <p className="text-body-sm text-fg-tertiary">불러오는 중…</p>}
            {isError && (
                <p className="text-body-sm text-destructive">게임 목록을 불러오지 못했습니다.</p>
            )}
            {!isPending && !isError && ordered.length === 0 && (
                <p className="text-body-sm text-fg-tertiary">지금 참여할 수 있는 게임이 없어요.</p>
            )}
            {ordered.length > 0 && (
                // 호버로 떠오르는 카드와 카드 그림자가 잘리지 않게 위아래·좌우 여백을 두고 같은 만큼 당긴다
                <div
                    {...dragScroll}
                    className="-mx-3 -my-3 -mr-[calc(var(--rail-inset,0px)+0.75rem)] flex cursor-grab scroll-px-3 [scrollbar-width:none] gap-4 overflow-x-auto px-3 py-3 pr-[calc(var(--rail-inset,0px)+0.75rem)] select-none active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
                >
                    {ordered.map((game) => (
                        <div key={game.id} className="shrink-0">
                            <GameTicketCard
                                game={game}
                                href={gameDetailPath(game.id)}
                                className="transition-[translate] duration-200 motion-safe:hover:-translate-y-1"
                            />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
