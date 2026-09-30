import { MotionConfig } from 'framer-motion';
import { useLayoutEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { GameGuideDialog, getGameContent, useGameList } from '@entities/game';
import { GameRail } from '@widgets/game-rail';

import { GameHero } from './GameHero';
import { GameStats } from './GameStats';

const CONTAINER = 'mx-auto w-full max-w-300 px-6';

/** 게임 상세 — 대표 영역(게임 시작·게임 방법), 내 기록, 다른 게임 */
export function GameDetailPage() {
    const { gameId } = useParams<{ gameId: string }>();
    const { data: games, isPending, isError } = useGameList();
    const [guideOpen, setGuideOpen] = useState(false);

    // 다른 화면에서 스크롤을 내린 채 들어와도, 들어올 때(다른 게임으로 바뀔 때 포함) 맨 위에서 시작한다
    useLayoutEffect(() => {
        window.scrollTo({ top: 0 });
    }, [gameId]);
    const game = games?.find((item) => item.id === gameId);

    // TODO: 미니게임 플레이 화면이 생기면 해당 게임을 시작한다
    const startGame = () => {
        setGuideOpen(false);
        toast.info('게임 화면은 준비 중이에요.');
    };

    if (isPending) {
        return (
            <main className={`${CONTAINER} text-body-sm text-fg-tertiary py-20`}>불러오는 중…</main>
        );
    }
    if (isError || !game) {
        return (
            <main className={`${CONTAINER} flex flex-col items-start gap-3 py-20`}>
                <p className="text-body text-fg-primary">
                    {isError ? '게임 정보를 불러오지 못했습니다.' : '게임을 찾을 수 없어요.'}
                </p>
                <Link to="/missions" className="text-body-sm text-fg-brand">
                    미션 페이지로 돌아가기
                </Link>
            </main>
        );
    }

    const content = getGameContent(game);

    return (
        // 운영체제의 동작 줄이기 설정을 켠 사용자에게는 진입 애니메이션을 끈다
        <MotionConfig reducedMotion="user">
            <main className="flex flex-col pt-20 pb-28">
                <div className={CONTAINER}>
                    <h1 className="text-title-1 text-fg-primary">게임</h1>
                    {/* 제목 아래 '게임 이름: 한 줄 소개' — 미션 페이지 '응모권' 아래 설명과 같은 스타일 */}
                    <p className="text-body text-fg-primary">
                        {content.tagline ? `${game.title}: ${content.tagline}` : game.title}
                    </p>
                </div>

                {/* 대표 영역 — 화면 폭 전체의 어두운 띠 안에 840px 너비로 둔다 */}
                <div className="bg-action-neutral-pressed mt-6 px-6 py-8">
                    <div className="mx-auto flex w-full max-w-210 flex-col gap-2.5">
                        <GameHero
                            title={game.title}
                            tagline={content.tagline}
                            image={content.heroImage}
                            onStart={startGame}
                            onGuide={() => setGuideOpen(true)}
                        />
                        <GameStats
                            bestScore={game.bestScore}
                            todayPlayCount={game.todayPlayCount}
                            rewardedToday={game.rewardedToday}
                        />
                    </div>
                </div>

                {/* 다른 게임 — 카드 목록은 오른쪽만 화면 끝까지 열어 넘긴다 */}
                <div className="@container mt-10 overflow-x-clip py-10 [--rail-inset:max(1.5rem,calc((100cqw-75rem)/2+1.5rem))]">
                    <div className={CONTAINER}>
                        <GameRail title="다른 게임" excludeGameId={game.id} />
                    </div>
                </div>

                <GameGuideDialog
                    open={guideOpen}
                    onOpenChange={setGuideOpen}
                    guide={content.guide}
                    onStart={startGame}
                />
            </main>
        </MotionConfig>
    );
}
