import {
    motion,
    useAnimate,
    useMotionValue,
    useMotionValueEvent,
    useTransform,
} from 'framer-motion';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

import type { TakkoTimingResult, TakkoTimingRound } from '../model/takkoTiming';

import background from '../assets/colorWord/background.jpg';
import mascotCorrect from '../assets/colorWord/mascot-correct.png';
import mascotIdle from '../assets/colorWord/mascot-idle.png';
import mascotWrong from '../assets/colorWord/mascot-wrong.png';
import toothpick from '../assets/colorWord/toothpick.png';
import wordBoard from '../assets/colorWord/word-board.png';
import { PAUSE_SOUNDS } from '../lib/gameSounds';
import { isInteractive } from '../lib/isInteractive';
import { TAKKO_TIMING_BGM, TAKKO_TIMING_SOUNDS } from '../lib/takkoTimingAssets';
import { useLoopingBgm } from '../lib/useLoopingBgm';
import {
    createTakkoTimingRound,
    judgeTakkoTiming,
    TAKKO_TIMING_LIVES,
    TAKKO_TIMING_TIME_LIMIT_MS,
    takkoTimingPoints,
    takkoTimingPosition,
} from '../model/takkoTiming';
import { GameBoardButton } from './GameBoardButton';
import { GameCountdown } from './GameCountdown';
import { GameImageButton } from './GameImageButton';
import { GameKey } from './GameKey';
import {
    GameLives,
    GameOverOverlay,
    GamePauseKeysHint,
    GamePauseOverlay,
    GameStartHint,
    GameStartHintLine,
} from './GameOverlays';
import { GameTimer } from './GameTimer';
import { RewardDialog } from './RewardDialog';
import { ScoreBoard } from './ScoreBoard';
import { VolumeControl } from './VolumeControl';

type Phase = 'ready' | 'countdown' | 'playing' | 'paused' | 'over';

/** 시작·이어 하기 전에 3, 2, 1을 센다 */
const COUNTDOWN_FROM = 3;
const COUNTDOWN_STEP_MS = 700;
/** 결과를 보여 주는 시간 — 성공해도 다음 판 전에 숨 돌릴 틈을 두고, 실패는 조금 더 길게 */
const REVEAL_SUCCESS_MS = 700;
const REVEAL_FAIL_MS = 900;
/** 남은 시간이 이 비율 이하면 시간 게이지를 빨갛게 바꾼다 */
const HURRY_RATIO = 1 / 3;
const PAUSE_KEYS = new Set(['Escape', 'KeyP']);
const STOP_KEYS = new Set([' ', 'Enter']);

/** 방금 멈춘 결과 — result가 null이면 시간 초과 */
interface Reveal {
    result: TakkoTimingResult | null;
    points: number;
}

const padScore = (score: number) => String(score).padStart(5, '0');
const percent = (value: number) => `${value * 100}%`;

const RESULT_CHIP: Record<TakkoTimingResult | 'timeUp', string> = {
    perfect: '퍼펙트! +20',
    hit: '콕! +10',
    miss: '빗나갔어요!',
    timeUp: '시간 초과!',
};

/**
 * 타꼬 타이밍 맞추기 — 좌우로 오가는 타꼬가 금색 구간에 왔을 때 이쑤시개로 콕 꽂는다 (화면 클릭·터치, 스페이스바·Enter).
 * 구간 안이면 +10점, 가운데 가까이면 퍼펙트 +20점. 구간 밖이거나 제한 시간이 지나면 목숨이 하나 줄고,
 * 성공할수록 타코야끼가 빨라지고 금색 구간이 좁아진다.
 * 시작·이어 하기 3·2·1, 일시정지(Esc·P, 다른 탭·창으로 가면 자동), 결과 표시는 글자색깔 맞추기와 같은 틀이다
 */
export function TakkoTimingGame({
    bestScore = 0,
    onExit,
    onGameOver,
}: {
    bestScore?: number;
    onExit: () => void;
    onGameOver?: (score: number) => Promise<{ ticketsGranted: number } | void> | void;
}) {
    const [phase, setPhase] = useState<Phase>('ready');
    const [countdown, setCountdown] = useState(COUNTDOWN_FROM);
    const [round, setRound] = useState<TakkoTimingRound>(() =>
        createTakkoTimingRound(Math.random, 0),
    );
    // 한 판마다 바뀌는 번호 — 움직임과 제한 시간을 처음부터 다시 잰다
    const [roundKey, setRoundKey] = useState(0);
    const [successes, setSuccesses] = useState(0);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(TAKKO_TIMING_LIVES);
    const [reveal, setReveal] = useState<Reveal | null>(null);
    const [hurry, setHurry] = useState(false);
    const [best, setBest] = useState(bestScore);
    const [newBest, setNewBest] = useState(false);
    const [rewardOpen, setRewardOpen] = useState(false);
    const [ticketsGranted, setTicketsGranted] = useState(0);
    const [boardScope, animateBoard] = useAnimate();
    const restartRef = useRef<HTMLButtonElement>(null);
    // 이번 판 — 보상 응답이 늦게 와도 그사이 다시 시작한 판에는 띄우지 않는다
    const playRef = useRef(0);
    // 결과를 보여 주는 동안 멈추라고 하면, 다음 판으로 넘어가면서 멈춘다
    const pauseRequestedRef = useRef(false);
    // 이번 판에서 흐른 시간(ms) — 일시정지 후 이어 할 때 여기서부터 다시 움직인다
    const elapsedRef = useRef(0);
    const bgm = useLoopingBgm(TAKKO_TIMING_BGM);

    // 타코야끼 위치(0~1)와 남은 시간(1 → 0) — 매 프레임 바뀌므로 다시 그리지 않고 값만 옮긴다
    const position = useMotionValue(0);
    const runnerX = useTransform(position, percent);
    const timeLeft = useMotionValue(1);
    useMotionValueEvent(timeLeft, 'change', (value) => setHurry(value <= HURRY_RATIO));

    const playSound = (key: keyof typeof TAKKO_TIMING_SOUNDS) =>
        bgm.playEffect(TAKKO_TIMING_SOUNDS[key]);

    const resetRound = () => {
        elapsedRef.current = 0;
        position.set(0);
        timeLeft.set(1);
    };

    const start = () => {
        playRef.current += 1;
        pauseRequestedRef.current = false;
        // 시작은 항상 키·클릭 입력 안에서 불리므로 여기서 음악을 튼다 (브라우저 자동 재생 제한)
        bgm.play();
        bgm.preloadEffects([...Object.values(TAKKO_TIMING_SOUNDS), ...Object.values(PAUSE_SOUNDS)]);
        setSuccesses(0);
        setScore(0);
        setLives(TAKKO_TIMING_LIVES);
        setReveal(null);
        setNewBest(false);
        setRound((prev) => createTakkoTimingRound(Math.random, 0, prev));
        setRoundKey((key) => key + 1);
        resetRound();
        setCountdown(COUNTDOWN_FROM);
        setPhase('countdown');
    };

    const finish = (finalScore: number) => {
        setPhase('over');
        bgm.duck(0.3);
        playSound('gameOver');
        setNewBest(finalScore > best);
        setBest((prev) => Math.max(prev, finalScore));
        const play = playRef.current;
        // 저장 요청이 실패하거나 바로 오류를 던져도 게임 화면은 그대로 둔다 (실패 안내는 게임 상세 페이지가 한다)
        Promise.resolve()
            .then(() => onGameOver?.(finalScore))
            .then((result) => {
                if (!result || playRef.current !== play || result.ticketsGranted <= 0) return;
                setTicketsGranted(result.ticketsGranted);
                setRewardOpen(true);
            })
            .catch(() => undefined);
    };

    /** 일시정지 — 결과를 보여 주는 중이면 다음 판으로 넘어가며 멈춘다 */
    const pause = () => {
        if (phase !== 'playing' && phase !== 'countdown') return;
        if (reveal) {
            pauseRequestedRef.current = true;
            return;
        }
        setPhase('paused');
        bgm.pause(PAUSE_SOUNDS.pause);
    };

    /** 이어 하기 — 음악을 이어 틀고 3, 2, 1을 센 뒤 멈췄던 자리부터 다시 움직인다 */
    const resume = () => {
        if (phase !== 'paused') return;
        bgm.resume(PAUSE_SOUNDS.resume);
        setCountdown(COUNTDOWN_FROM);
        setPhase('countdown');
    };

    // 멈추기(stopped) 또는 시간 초과(false) — 채점하고 잠깐 결과를 보여 준다
    const judge = (stopped: boolean) => {
        if (phase !== 'playing' || reveal) return;
        const result = stopped ? judgeTakkoTiming(position.get(), round) : null;
        const points = result ? takkoTimingPoints(result) : 0;
        setReveal({ result, points });
        if (points > 0) {
            setScore((n) => n + points);
            setSuccesses((n) => n + 1);
            playSound('hit');
            if (result === 'perfect') playSound('perfect');
            return;
        }
        playSound(result === null ? 'timeUp' : 'miss');
        setLives((n) => n - 1);
        // 실패하면 판이 좌우로 짧게 흔들린다 (동작 줄이기 설정이면 흔들리지 않는다)
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            void animateBoard(boardScope.current, { x: [0, -8, 7, -5, 3, 0] }, { duration: 0.35 });
        }
    };

    // 3, 2, 1 — 다 세면 움직이기 시작한다
    useEffect(() => {
        if (phase !== 'countdown') return;
        const timer = setTimeout(() => {
            if (countdown > 1) setCountdown(countdown - 1);
            else setPhase('playing');
        }, COUNTDOWN_STEP_MS);
        return () => clearTimeout(timer);
    }, [phase, countdown]);

    // 움직임·제한 시간 — 매 프레임 위치와 남은 시간을 옮기고, 시간이 다 되면 실패로 친다.
    // 한 프레임에서 오류가 나도 다음 프레임은 반드시 이어 간다 (타꼬런 tick과 같은 방식)
    const timeUp = useEffectEvent(() => judge(false));
    useEffect(() => {
        if (phase !== 'playing' || reveal) return;
        const base = performance.now() - elapsedRef.current;
        let frame = 0;
        let errorLogged = false;
        const tick = (now: number) => {
            let done = false;
            try {
                const elapsed = Math.min(now - base, TAKKO_TIMING_TIME_LIMIT_MS);
                elapsedRef.current = elapsed;
                position.set(takkoTimingPosition(elapsed, round.sweepMs));
                timeLeft.set(1 - elapsed / TAKKO_TIMING_TIME_LIMIT_MS);
                if (elapsed >= TAKKO_TIMING_TIME_LIMIT_MS) {
                    done = true;
                    timeUp();
                }
            } catch (error) {
                if (!errorLogged) {
                    errorLogged = true;
                    console.error('타꼬 타이밍 맞추기 프레임 처리 중 오류가 발생했어요.', error);
                }
            } finally {
                if (!done) frame = requestAnimationFrame(tick);
            }
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [phase, reveal, roundKey, round, position, timeLeft]);

    // 결과를 보여 준 뒤 다음 판으로 (목숨을 다 쓰면 끝)
    const next = useEffectEvent(() => {
        setReveal(null);
        if (lives <= 0) {
            finish(score);
            return;
        }
        resetRound();
        setRound((prev) => createTakkoTimingRound(Math.random, successes, prev));
        setRoundKey((key) => key + 1);
        if (pauseRequestedRef.current) {
            pauseRequestedRef.current = false;
            setPhase('paused');
            bgm.pause(PAUSE_SOUNDS.pause);
        }
    });
    useEffect(() => {
        if (!reveal) return;
        const timer = setTimeout(
            () => next(),
            reveal.points > 0 ? REVEAL_SUCCESS_MS : REVEAL_FAIL_MS,
        );
        return () => clearTimeout(timer);
    }, [reveal]);

    // 다른 탭이나 창으로 가면 저절로 멈춘다 — 돌아왔을 때 시간 초과로 목숨이 줄어 있지 않게
    const autoPause = useEffectEvent(() => pause());
    useEffect(() => {
        const onVisibility = () => {
            if (document.hidden) autoPause();
        };
        const onBlur = () => autoPause();
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('blur', onBlur);
        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('blur', onBlur);
        };
    }, []);

    // 키보드 — 스페이스바·Enter로 시작·멈추기·이어 하기, Esc·P로 일시정지
    const handleKey = useEffectEvent((event: KeyboardEvent) => {
        // 게임이 떠 있는 동안 스페이스바로 페이지가 내려가지 않게 한다 (버튼에 초점이 있으면 그 버튼을 누르게 둔다)
        if (event.key === ' ' && !isInteractive(event.target)) event.preventDefault();
        if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
        if (PAUSE_KEYS.has(event.code)) {
            if (phase === 'paused') resume();
            else if (phase === 'playing' || phase === 'countdown') pause();
            else return;
            event.preventDefault();
            return;
        }
        if (!STOP_KEYS.has(event.key) || isInteractive(event.target)) return;
        if (phase === 'playing') judge(true);
        else if (phase === 'ready') start();
        else if (phase === 'paused') resume();
        else return;
        event.preventDefault();
    });
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => handleKey(event);
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    useEffect(() => {
        if (phase === 'over') restartRef.current?.focus();
    }, [phase]);

    const mascot = !reveal
        ? { key: 'idle', src: mascotIdle }
        : reveal.points > 0
          ? { key: 'correct', src: mascotCorrect }
          : { key: 'wrong', src: mascotWrong };
    const chip = reveal ? RESULT_CHIP[reveal.result ?? 'timeUp'] : null;

    return (
        <div
            // 판 배경 — 글자색깔 맞추기와 같은 피그마 image 175 (노을 하늘과 구름 위 타코야끼)
            className="border-fg-primary relative aspect-[840/546] w-full overflow-hidden rounded-2xl border-2 bg-cover bg-center shadow-md select-none"
            style={{ backgroundImage: `url(${background})` }}
        >
            <div className="absolute inset-0 flex flex-col">
                {/* 위 — 나가기·소리·일시정지 · 목숨 · 점수판. 멈춤·세기 화면 위에서도 누를 수 있게 앞에 둔다 */}
                <div
                    className={`flex items-start justify-between gap-3 p-3 ${phase === 'over' ? '' : 'relative z-10'}`}
                >
                    <div className="flex items-start gap-2 sm:gap-3">
                        <GameImageButton kind="exit" size="small" onClick={onExit} />
                        <VolumeControl level={bgm.level} onLevelChange={bgm.setLevel} />
                        {(phase === 'playing' || phase === 'countdown' || phase === 'paused') && (
                            <GameImageButton
                                kind="pause"
                                size="small"
                                onClick={phase === 'paused' ? resume : pause}
                            />
                        )}
                    </div>
                    <GameLives lives={lives} max={TAKKO_TIMING_LIVES} />
                    <ScoreBoard value={padScore(score)} />
                </div>

                {/* 시간 게이지 — 한 판 제한 시간 동안 줄고, 1/3 이하로 남으면 빨개진다 */}
                <div className="mx-6">
                    <GameTimer timeLeft={timeLeft} hurry={hurry && phase !== 'ready'} />
                </div>

                {/* 가운데 — 결과 한마디, 판(image 170) 위 길과 금색 구간·타코야끼, 꽂기 버튼. 실패하면 이 부분이 흔들린다 */}
                <div
                    ref={boardScope}
                    className="flex flex-1 flex-col items-center justify-center gap-[3%] px-3 pb-[6%]"
                >
                    <div className="flex h-7 items-center justify-center">
                        {chip && reveal && (
                            <motion.span
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`text-body-sm-bold text-fg-on-brand rounded-full px-3 py-0.5 shadow-sm ${reveal.points > 0 ? 'bg-semantic-success' : 'bg-semantic-error'}`}
                            >
                                {chip}
                            </motion.span>
                        )}
                    </div>

                    {/* 판을 누르면 꽂는다 (위 버튼들은 제외) */}
                    <div
                        className="relative aspect-[900/229] w-[min(82%,44rem)] cursor-pointer"
                        onPointerDown={(event) => {
                            if (isInteractive(event.target)) return;
                            if (phase === 'playing') {
                                event.preventDefault();
                                judge(true);
                            }
                        }}
                    >
                        <img
                            src={wordBoard}
                            alt=""
                            draggable={false}
                            className="pointer-events-none absolute inset-0 size-full"
                        />
                        {/* 길 — 판 그림의 크림색 안쪽(높이 28~84%)에 맞춰 둔다 */}
                        <div className="absolute inset-x-[9%] top-[70%] h-[9%]">
                            <div className="bg-surface-inverse/20 ring-surface-inverse/40 absolute inset-0 rounded-full ring-2" />
                            {/* 금색 구간과 가운데 퍼펙트 줄 */}
                            <motion.div
                                key={`zone-${roundKey}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="border-game-yellow bg-ticket-primary/70 absolute -top-[260%] -bottom-[60%] rounded-md border-[3px] shadow-[0_0_12px_var(--color-ticket-primary)]"
                                style={{
                                    left: percent(round.center - round.width / 2),
                                    width: percent(round.width),
                                }}
                            >
                                <span className="bg-game-yellow absolute inset-y-1 left-1/2 w-1 -translate-x-1/2 rounded-full" />
                            </motion.div>
                            {/* 이쑤시개(피그마 image 182) — 금색 구간 가운데 위에서 기다리다가, 누르면 끝이 길에 닿도록 콕 꽂힌다.
                                그림의 왼쪽 아래 끝이 이쑤시개 끝이라 그 점을 구간 가운데에 맞춘다. 시간 초과면 꽂지 않는다 */}
                            <motion.img
                                key={`pick-${roundKey}`}
                                src={toothpick}
                                alt=""
                                aria-hidden
                                draggable={false}
                                initial={false}
                                animate={reveal?.result ? { x: 0, y: 0 } : { x: '45%', y: '-45%' }}
                                transition={
                                    reveal?.result
                                        ? { duration: 0.09, ease: 'easeIn' }
                                        : { type: 'spring', stiffness: 260, damping: 20 }
                                }
                                className="pointer-events-none absolute bottom-[40%] z-10 w-[clamp(2.25rem,7vw,4rem)] drop-shadow-md [image-rendering:pixelated]"
                                style={{ left: percent(round.center) }}
                            />
                            {/* 타코야끼 — 길 전체 폭의 틀을 위치만큼 옮겨, 그 왼쪽 끝에 붙은 타코야끼가 따라가게 한다 */}
                            <motion.div
                                aria-hidden
                                className="pointer-events-none absolute inset-0 will-change-transform"
                                style={{ x: runnerX }}
                            >
                                <div className="absolute bottom-[40%] left-0 w-[clamp(2.75rem,9vw,5rem)] -translate-x-1/2">
                                    <motion.img
                                        key={mascot.key}
                                        src={mascot.src}
                                        alt=""
                                        draggable={false}
                                        initial={reveal ? { y: -6, scale: 0.9 } : false}
                                        animate={{ y: 0, scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 420, damping: 14 }}
                                        className="w-full [image-rendering:pixelated]"
                                    />
                                    {/* 화살표 — 이 끝이 금색 구간 안에 있어야 성공 */}
                                    <span className="bg-brand-primary mx-auto block size-2.5 [clip-path:polygon(0_0,100%_0,50%_100%)]" />
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    <GameBoardButton
                        disabled={phase !== 'playing'}
                        onClick={() => judge(true)}
                        className="w-[min(36%,15rem)] justify-center gap-2 text-sm sm:text-base"
                    >
                        지금 꽂기!
                        {/* 키 모양 — 글자색깔 맞추기 번호 키와 같은 모양 */}
                        <span
                            aria-hidden
                            className="border-fg-primary bg-surface-page text-caption rounded-md border-2 px-1.5 leading-5 font-extrabold shadow-[0_2px_0_0_var(--color-fg-primary)] [@media(hover:none)]:hidden"
                        >
                            Space
                        </span>
                    </GameBoardButton>
                </div>
            </div>

            {/* 성공·실패 — 게임 판 테두리를 초록·빨강으로 잠깐 바꾼다 */}
            {reveal && (
                <div
                    aria-hidden
                    className={`pointer-events-none absolute inset-0 rounded-2xl border-4 ${reveal.points > 0 ? 'border-semantic-success' : 'border-semantic-error'}`}
                />
            )}

            {phase === 'ready' && (
                <GameStartHint onStart={start}>
                    <GameStartHintLine>
                        <span className="flex items-center gap-1.5 [@media(hover:none)]:hidden">
                            화면 클릭 또는 <GameKey>Space</GameKey> 꽂기
                        </span>
                        <span className="hidden [@media(hover:none)]:inline">화면을 눌러 꽂기</span>
                        <GamePauseKeysHint />
                    </GameStartHintLine>
                    <GameStartHintLine>
                        금색 구간에서 꽂으면 성공 · 가운데면 퍼펙트 2배
                    </GameStartHintLine>
                    <GameStartHintLine>목숨 3개 · 성공할수록 빨라져요</GameStartHintLine>
                </GameStartHint>
            )}

            {/* 3, 2, 1 */}
            {phase === 'countdown' && (
                <div className="bg-surface-inverse/40 absolute inset-0 flex items-center justify-center">
                    <GameCountdown value={countdown} />
                </div>
            )}

            {phase === 'paused' && <GamePauseOverlay onResume={resume} />}

            {phase === 'over' && (
                <GameOverOverlay
                    title="목숨을 다 썼어요!"
                    score={padScore(score)}
                    best={best}
                    newBest={newBest}
                    onRetry={start}
                    onExit={onExit}
                    retryRef={restartRef}
                />
            )}

            <RewardDialog
                open={rewardOpen}
                onOpenChange={setRewardOpen}
                onClosed={() => restartRef.current?.focus()}
                tickets={ticketsGranted}
            />

            {/* 스크린리더 — 결과를 알린다 */}
            <p aria-live="polite" className="sr-only">
                {phase === 'playing' && !reveal ? '타꼬가 달려요. 금색 구간에 오면 꽂으세요' : ''}
                {chip ?? ''}
                {phase === 'paused' ? '일시정지' : ''}
                {phase === 'over' ? `게임 끝. ${score}점` : ''}
            </p>
        </div>
    );
}
