import { motion } from 'framer-motion';
import { type CSSProperties, useEffect, useEffectEvent, useRef, useState } from 'react';

import { formatNumber } from '@shared/lib/format';

import characterUrl from '../assets/takko-run/character.png';
import cloudsUrl from '../assets/takko-run/clouds.png';
import lanternsUrl from '../assets/takko-run/lanterns.png';
import saucesUrl from '../assets/takko-run/sauces.png';
import skewersUrl from '../assets/takko-run/skewers.png';
import skyUrl from '../assets/takko-run/sky.jpg';
import starsUrl from '../assets/takko-run/stars.png';
import townUrl from '../assets/takko-run/town.png';
import newBadge from '../assets/ui/badge-new.png';
import {
    createPalette,
    drawRun,
    type TakkoRunImageKey,
    type TakkoRunImages,
    type TakkoRunPalette,
} from '../lib/draw-takko-run';
import {
    createRun,
    pressJump,
    releaseJump,
    type RunPhase,
    scoreOf,
    stepRun,
    WORLD_HEIGHT,
    WORLD_WIDTH,
} from '../model/takko-run';
import { GameImageButton } from './GameImageButton';
import { RewardDialog } from './RewardDialog';
import { ScoreBoard } from './ScoreBoard';

const IMAGE_SOURCES: Record<TakkoRunImageKey, string> = {
    character: characterUrl,
    clouds: cloudsUrl,
    lanterns: lanternsUrl,
    sauces: saucesUrl,
    skewers: skewersUrl,
    sky: skyUrl,
    stars: starsUrl,
    town: townUrl,
};

async function loadImages(): Promise<TakkoRunImages> {
    const entries = await Promise.all(
        Object.entries(IMAGE_SOURCES).map(async ([key, src]) => {
            const image = new Image();
            image.src = src;
            await image.decode();
            return [key, image] as const;
        }),
    );
    return Object.fromEntries(entries) as TakkoRunImages;
}

/** 부딪힌 직후 누르고 있던 점프 키가 곧바로 '다시 하기'를 누르지 않도록 잠깐 막는다 */
const RESTART_GUARD_MS = 400;
/** 한 프레임에 진행할 최대 시간 — 탭을 다녀오는 등 오래 멈췄다 돌아와도 순간이동하지 않게 한다 */
const MAX_STEP_SECONDS = 1 / 30;

const JUMP_KEYS = new Set(['Space', 'ArrowUp']);
/** 점프에 쓰지 않지만 게임 중에 누르면 페이지가 스크롤되는 키 — 기본 동작만 막는다 */
const SCROLL_KEYS = new Set([
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'PageUp',
    'PageDown',
    'Home',
    'End',
]);
const isInteractive = (target: EventTarget | null) =>
    target instanceof HTMLElement &&
    (target.isContentEditable || !!target.closest('button, a, input, textarea, select'));

const padScore = (score: number) => String(score).padStart(5, '0');

/**
 * 게임 위에 떠 있는 안내 칩 — 마을 실루엣에서 뽑은 짙은 갈색(--takko-ink)을 반투명하게 깔아 노을 배경과 어우러지게 한다
 */
const HUD_CHIP = 'bg-(--takko-ink)/55 text-fg-on-brand rounded-lg backdrop-blur-sm';

/** 키보드 키 모양 표시 */
function Key({ children, className = '' }: { children: string; className?: string }) {
    return (
        <kbd
            className={`border-fg-on-brand/50 bg-fg-on-brand/15 text-caption inline-flex h-6 items-center rounded-md border border-b-2 px-2 ${className}`}
        >
            {children}
        </kbd>
    );
}

/**
 * 타꼬런 — 타코야끼가 소스병·꼬치를 뛰어넘으며 달리는 미니게임 (크롬 공룡 달리기 방식).
 * 스페이스바·위 화살표나 화면 누르기로 점프하고, 길게 누를수록 높이 뛴다.
 * 게임 대표 영역과 같은 840×546 비율의 캔버스에 그리고, 점수·안내·결과는 그 위에 겹친다
 */
export function TakkoRunGame({
    bestScore = 0,
    onExit,
    onGameOver,
}: {
    bestScore?: number;
    onExit: () => void;
    /**
     * 부딪혀 끝났을 때의 점수 — 결과 제출은 쓰는 쪽에서 하고, 받은 응모권 수를 돌려주면 결과 화면에 보여준다
     */
    onGameOver?: (score: number) => Promise<{ ticketsGranted: number } | void> | void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scoreRef = useRef<HTMLSpanElement>(null);
    const restartRef = useRef<HTMLButtonElement>(null);
    const runRef = useRef(createRun());
    const overAtRef = useRef(0);

    const [assets, setAssets] = useState<{
        images: TakkoRunImages;
        palette: TakkoRunPalette;
    } | null>(null);
    const images = assets?.images ?? null;
    const [loadFailed, setLoadFailed] = useState(false);
    const [phase, setPhase] = useState<RunPhase>('ready');
    const [lastScore, setLastScore] = useState(0);
    const [best, setBest] = useState(bestScore);
    const [newBest, setNewBest] = useState(false);
    /** 이번 판으로 받은 응모권 수 — 제출 응답에 있으면 적립 안내 모달을 한 번 띄운다 */
    const [ticketsGranted, setTicketsGranted] = useState(0);
    const [rewardOpen, setRewardOpen] = useState(false);
    const playRef = useRef(0);

    useEffect(() => {
        let cancelled = false;
        loadImages()
            .then(
                (loaded) =>
                    !cancelled && setAssets({ images: loaded, palette: createPalette(loaded) }),
            )
            .catch(() => !cancelled && setLoadFailed(true));
        return () => {
            cancelled = true;
        };
    }, []);

    const finish = useEffectEvent((score: number) => {
        overAtRef.current = performance.now();
        setPhase('over');
        setLastScore(score);
        setNewBest(score > best);
        setBest((prev) => Math.max(prev, score));
        // 응답이 늦게 와도 그사이 다시 시작한 판에는 띄우지 않는다
        const play = playRef.current;
        void Promise.resolve(onGameOver?.(score)).then((result) => {
            if (!result || playRef.current !== play || result.ticketsGranted <= 0) return;
            setTicketsGranted(result.ticketsGranted);
            setRewardOpen(true);
        });
    });

    // 그리기 — 화면 크기에 맞춰 캔버스 해상도를 바꾸고 매 프레임 한 칸씩 진행한다
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!assets || !canvas || !ctx) return;
        const { images, palette } = assets;

        const fit = () => {
            const ratio = window.devicePixelRatio || 1;
            canvas.width = Math.round(canvas.clientWidth * ratio);
            canvas.height = Math.round(canvas.clientHeight * ratio);
            ctx.setTransform(canvas.width / WORLD_WIDTH, 0, 0, canvas.height / WORLD_HEIGHT, 0, 0);
            ctx.imageSmoothingQuality = 'high';
        };
        fit();
        const observer = new ResizeObserver(fit);
        observer.observe(canvas);

        let frame = 0;
        let last = performance.now();
        const tick = (now: number) => {
            const dt = Math.min((now - last) / 1000, MAX_STEP_SECONDS);
            last = now;
            const run = runRef.current;
            if (stepRun(run, dt)) finish(scoreOf(run));
            if (scoreRef.current) scoreRef.current.textContent = padScore(scoreOf(run));
            drawRun(ctx, run, images, palette);
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [assets]);

    const jump = () => {
        const run = runRef.current;
        if (!images || run.phase === 'over') return;
        pressJump(run);
        if (phase === 'ready') setPhase('running');
    };

    const restart = () => {
        if (performance.now() - overAtRef.current < RESTART_GUARD_MS) return;
        const run = createRun();
        run.phase = 'running';
        runRef.current = run;
        setPhase('running');
        setNewBest(false);
        setTicketsGranted(0);
        playRef.current += 1;
        containerRef.current?.focus();
    };

    // 키보드 — 게임이 떠 있는 동안 스페이스바·위 화살표로 점프하고 페이지가 스크롤되지 않게 막는다
    const handleKey = useEffectEvent((event: KeyboardEvent, down: boolean) => {
        if (isInteractive(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
        if (SCROLL_KEYS.has(event.code)) {
            event.preventDefault();
            return;
        }
        if (!JUMP_KEYS.has(event.code)) return;
        event.preventDefault();
        if (!down) releaseJump(runRef.current);
        else if (!event.repeat) jump();
    });
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => handleKey(event, true);
        const onKeyUp = (event: KeyboardEvent) => handleKey(event, false);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, []);

    // 끝나면 '다시 하기'에 초점을 옮겨 키보드로 바로 다시 시작할 수 있게 한다
    useEffect(() => {
        if (phase === 'over') restartRef.current?.focus();
    }, [phase]);

    return (
        <div
            ref={containerRef}
            tabIndex={-1}
            role="group"
            aria-label="타꼬런 게임"
            // 마우스 클릭으로는 뛰지 않고 키보드로만 한다. 키보드가 없는 휴대폰·태블릿만 화면을 눌러 뛴다
            onPointerDown={(event) => {
                if (event.pointerType !== 'touch' || isInteractive(event.target)) return;
                event.preventDefault();
                jump();
            }}
            onPointerUp={() => releaseJump(runRef.current)}
            onPointerCancel={() => releaseJump(runRef.current)}
            style={assets ? ({ '--takko-ink': assets.palette.ground } as CSSProperties) : undefined}
            className="bg-surface-page border-fg-primary relative aspect-[840/546] w-full touch-none overflow-hidden rounded-2xl border-2 shadow-md outline-none select-none"
        >
            <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full" />

            {!images && (
                <p className="text-body-sm text-fg-tertiary absolute inset-0 flex items-center justify-center">
                    {loadFailed ? '게임을 불러오지 못했어요.' : '불러오는 중…'}
                </p>
            )}

            {/* 나가기 — 도트 버튼 Small(36) */}
            <div className="absolute top-3 left-3">
                <GameImageButton kind="exit" size="small" onClick={onExit} />
            </div>

            {/* 점수판 (image 112) */}
            <div className="absolute top-3 right-3">
                <ScoreBoard valueRef={scoreRef} value={padScore(0)} />
            </div>

            {/* 시작 안내 — 조작키와 짧게·길게 점프 */}
            {images && phase === 'ready' && (
                <div className="pointer-events-none absolute inset-x-0 top-[26%] flex justify-center px-6 sm:top-[22%]">
                    <div
                        className={`${HUD_CHIP} flex flex-col items-center gap-2 rounded-2xl px-4 py-3 text-center sm:gap-3 sm:px-6 sm:py-4`}
                    >
                        <p className="text-body-bold sm:text-subhead flex flex-wrap items-center justify-center gap-2">
                            {/* 컴퓨터는 스페이스바, 터치 기기(마우스 올리기 없음)는 화면 누르기로 안내한다 */}
                            <span className="flex items-center gap-1 [@media(hover:none)]:hidden">
                                <Key className="motion-safe:animate-pulse">Space</Key>를 눌러 시작
                            </span>
                            <span className="hidden [@media(hover:none)]:inline">
                                화면을 눌러 시작
                            </span>
                        </p>
                        <p className="text-caption sm:text-body-sm flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
                            <span className="flex items-center gap-1.5">
                                <Key>짧게</Key> 낮게 점프
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Key>길게</Key> 높게 점프
                            </span>
                        </p>
                    </div>
                </div>
            )}

            {phase === 'over' && (
                <div className="absolute inset-0 flex items-center justify-center bg-(--takko-ink)/60 px-6">
                    <div className="flex flex-col items-center gap-5 text-center">
                        <p className="text-title-3 text-ticket-accent">앗, 부딪혔어요!</p>
                        <div className="flex flex-col items-center gap-2">
                            <div className="relative">
                                <ScoreBoard value={padScore(lastScore)} size="large" />
                                {/* 최고 기록이면 점수판 오른쪽 위에 NEW 배지(피그마 image 113)가 톡 붙는다 */}
                                {newBest && (
                                    <motion.img
                                        src={newBadge}
                                        alt="최고 기록"
                                        initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
                                        animate={{ opacity: 1, scale: 1, rotate: 8 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 420,
                                            damping: 14,
                                            delay: 0.15,
                                        }}
                                        className="absolute -top-4 -right-7 h-7 w-auto"
                                    />
                                )}
                            </div>
                            <p className="text-body-sm text-ticket-accent">
                                {newBest
                                    ? `최고 점수 ${formatNumber(best)}점을 기록했어요.`
                                    : `최고 점수 ${formatNumber(best)}점`}
                            </p>
                        </div>
                        <div className="mt-1 flex items-center gap-4">
                            <GameImageButton kind="retry" onClick={restart} ref={restartRef} />
                            <GameImageButton kind="exit" onClick={onExit} />
                        </div>
                    </div>
                </div>
            )}

            {/* 닫으면 초점을 다시 '다시 하기'로 돌려 스페이스바로 바로 이어 할 수 있게 한다 */}
            <RewardDialog
                open={rewardOpen}
                onOpenChange={setRewardOpen}
                onClosed={() => restartRef.current?.focus()}
                tickets={ticketsGranted}
            />

            <p aria-live="polite" className="sr-only">
                {phase === 'over' ? `게임 끝. ${lastScore}점` : ''}
            </p>
        </div>
    );
}
