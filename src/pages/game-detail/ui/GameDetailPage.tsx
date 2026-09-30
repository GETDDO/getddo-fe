import { MotionConfig } from 'framer-motion';
import { useLayoutEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { GameGuideDialog, getGameContent, useGameList } from '@entities/game';
import { GamePlayer, hasGamePlayer, useSubmitGamePlay } from '@features/play-game';
import { GameRail } from '@widgets/game-rail';

import { GameHero } from './GameHero';
import { GameStats } from './GameStats';

const CONTAINER = 'mx-auto w-full max-w-300 px-6';

/**
 * 무대 폭 — 최대 960px(피그마 840보다 한 단계 크게)이고, 화면 높이가 모자라면 840:546 비율대로 줄어든다.
 * 16.5rem(264px)은 무대 높이 중 대표 영역을 뺀 나머지: 헤더 65 + 위아래 여백 64 + 제목 28 + 간격 35 + 기록 카드 72.
 * 너무 작아지지 않게 480px 아래로는 줄이지 않는다 (그보다 짧은 화면은 스크롤)
 */
const STAGE_WIDTH = 'w-[min(100%,60rem,max(30rem,calc((100svh-16.5rem)*840/546)))]';

/** 게임 상세 — 대표 영역(게임 시작·게임 방법), 내 기록, 다른 게임 */
export function GameDetailPage() {
    const { gameId } = useParams<{ gameId: string }>();
    const { data: games, isPending, isError } = useGameList();
    const [guideOpen, setGuideOpen] = useState(false);
    // 플레이 중인 게임 — 다른 게임 상세로 옮기면 자연히 플레이 화면이 닫힌다
    const [playingGameId, setPlayingGameId] = useState<string | null>(null);
    const submitPlay = useSubmitGamePlay();

    // 다른 화면에서 스크롤을 내린 채 들어와도, 들어올 때(다른 게임으로 바뀔 때 포함) 맨 위에서 시작한다
    useLayoutEffect(() => {
        window.scrollTo({ top: 0 });
    }, [gameId]);
    const game = games?.find((item) => item.id === gameId);

    // 플레이 화면이 있는 게임은 대표 영역 자리에서 바로 시작한다
    const startGame = () => {
        setGuideOpen(false);
        if (game && hasGamePlayer(game.id)) setPlayingGameId(game.id);
        else toast.info('게임 화면은 준비 중이에요.');
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
            <main className="flex flex-col pb-28">
                {/*
                  무대 — 헤더 바로 아래 어두운 띠에 제목·대표 영역·기록을 담는다.
                  띠는 내용 높이만큼만 차지하고, 화면이 짧으면 대표 영역이 줄어 노트북·윈도우(1080p)에서도 한 화면에 들어온다
                */}
                <div className="bg-action-neutral-pressed px-6 py-8">
                    <div className={`mx-auto flex flex-col gap-2.5 ${STAGE_WIDTH}`}>
                        {/* 게임 이름과 한 줄 소개 — 미션 페이지 '출석체크' 섹션 제목처럼 한 줄로 */}
                        <div className="mb-3.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <h1 className="text-subhead text-fg-on-brand">{game.title}</h1>
                            {content.tagline && (
                                <p className="text-body-sm text-border-strong">{content.tagline}</p>
                            )}
                        </div>
                        {playingGameId === game.id ? (
                            // 끝날 때마다 점수를 제출하면 아래 기록 카드(최고점·오늘 플레이·오늘 받은 응모권)가 새로 받아와진다
                            <GamePlayer
                                gameId={game.id}
                                bestScore={game.bestScore}
                                onExit={() => setPlayingGameId(null)}
                                onGameOver={(score) =>
                                    submitPlay.mutateAsync({ gameId: game.id, score }).catch(() => {
                                        toast.error('점수를 저장하지 못했어요.');
                                    })
                                }
                            />
                        ) : (
                            <GameHero
                                title={game.title}
                                tagline={content.tagline}
                                image={content.heroImage}
                                imagePosition={content.heroImagePosition}
                                onStart={startGame}
                                onGuide={() => setGuideOpen(true)}
                            />
                        )}
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
