import { GameTicketCard, useGameList } from '@entities/game';
import { useDragScroll } from '@shared/lib/use-drag-scroll';

import { SectionHeader } from './SectionHeader';

/**
 * 게임 섹션 — 게임별 하루 1회 응모권 1장. 오늘 보상을 이미 받은 게임은 뒤로 보낸다.
 * 카드 목록은 왼쪽은 콘텐츠 시작선에서 자르고 오른쪽만 화면 끝까지 열어 넘긴다 (--rail-inset은 페이지가 정한다)
 */
export function GameSection() {
    const { data: games, isPending, isError } = useGameList();
    const dragScroll = useDragScroll<HTMLDivElement>();
    const ordered = [...(games ?? [])].sort(
        (a, b) => Number(a.rewardedToday ?? false) - Number(b.rewardedToday ?? false),
    );

    return (
        <section className="flex flex-col gap-6">
            <SectionHeader
                title="게임"
                caption="게임마다 하루 한 번 응모권을 받을 수 있어요. 매일 오전 9시 초기화"
            />
            {isPending && <p className="text-body-sm text-fg-tertiary">불러오는 중…</p>}
            {isError && (
                <p className="text-body-sm text-destructive">게임 목록을 불러오지 못했습니다.</p>
            )}
            {games?.length === 0 && (
                <p className="text-body-sm text-fg-tertiary">지금 참여할 수 있는 게임이 없어요.</p>
            )}
            {ordered.length > 0 && (
                // 호버로 떠오르는 카드가 잘리지 않게 위아래 여백을 두고 같은 만큼 당긴다
                <div
                    {...dragScroll}
                    className="-my-3 -mr-(--rail-inset) flex cursor-grab [scrollbar-width:none] gap-4 overflow-x-auto py-3 pr-(--rail-inset) select-none active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
                >
                    {ordered.map((game) => (
                        <GameTicketCard
                            key={game.id}
                            game={game}
                            // TODO: 게임별 플레이 화면 라우트가 생기면 해당 게임으로 이동한다
                            href="/games"
                            className="transition-[translate] duration-200 motion-safe:hover:-translate-y-1"
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
