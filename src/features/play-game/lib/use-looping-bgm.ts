import { useCallback, useEffect, useRef, useState } from 'react';

/** 소리 단계별 음량 — 0은 음소거, 1~5단계 */
export const BGM_VOLUME_STEPS = [0, 0.1, 0.2, 0.35, 0.5, 0.7] as const;
export const BGM_MAX_LEVEL = BGM_VOLUME_STEPS.length - 1;
const DEFAULT_LEVEL = 3;

/** 소리 단계 — 다음에 들어와도 유지되도록 이 브라우저에 기억한다 */
const LEVEL_KEY = 'getddo:game-bgm-level';
const FADE_SECONDS = 0.6;

// 개인 정보 보호 모드 등에서는 저장소 접근이 막힐 수 있어, 실패하면 기본 단계로 시작한다
function readLevel() {
    try {
        const raw = localStorage.getItem(LEVEL_KEY);
        const saved = Number(raw);
        return raw !== null && Number.isInteger(saved) && saved >= 0 && saved <= BGM_MAX_LEVEL
            ? saved
            : DEFAULT_LEVEL;
    } catch {
        return DEFAULT_LEVEL;
    }
}

function saveLevel(level: number) {
    try {
        localStorage.setItem(LEVEL_KEY, String(level));
    } catch {
        // 저장하지 못해도 이번 화면에서는 반영된다
    }
}

/**
 * 배경 음악을 끊김 없이 반복 재생한다 (Web Audio — <audio loop>는 반복 지점에서 틈이 생길 수 있다).
 * 브라우저는 사용자가 누르기 전에는 소리를 막으므로, play는 키·터치 같은 입력 처리 안에서 불러야 한다.
 * 화면을 떠나면 멈추고, 다른 탭으로 가면 잠시 멈췄다가 돌아오면 이어서 재생한다
 */
export function useLoopingBgm(src: string) {
    const [level, setLevelState] = useState(readLevel);
    const ctxRef = useRef<AudioContext | null>(null);
    const gainRef = useRef<GainNode | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const bufferRef = useRef<Promise<AudioBuffer> | null>(null);
    /** 부딪혔을 때 줄이는 배율 — 다시 시작하면 1로 되돌린다 */
    const duckRef = useRef(1);
    const levelRef = useRef(level);
    /** 게임을 일시정지한 동안에는 탭을 다녀와도 다시 틀지 않는다 */
    const pausedRef = useRef(false);

    // 첫 재생이 늦지 않도록 화면에 들어오면 음원을 미리 받아 둔다 (풀기는 재생할 때)
    const bytesRef = useRef<Promise<ArrayBuffer> | null>(null);
    useEffect(() => {
        bytesRef.current = fetch(src).then((response) => response.arrayBuffer());
    }, [src]);

    /** 지금 단계·줄임 배율에 맞는 음량으로 서서히 옮긴다 */
    const applyVolume = useCallback((seconds = FADE_SECONDS) => {
        const ctx = ctxRef.current;
        const gain = gainRef.current;
        if (!ctx || !gain) return;
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(
            (BGM_VOLUME_STEPS[levelRef.current] ?? 0) * duckRef.current,
            now + seconds,
        );
    }, []);

    /** 재생(이미 재생 중이면 원래 음량으로 되돌림) — 입력 처리 안에서 부른다 */
    const play = useCallback(() => {
        duckRef.current = 1;
        pausedRef.current = false;
        if (!ctxRef.current) {
            const ctx = new AudioContext();
            const gain = ctx.createGain();
            gain.gain.value = 0;
            gain.connect(ctx.destination);
            ctxRef.current = ctx;
            gainRef.current = gain;
        }
        const ctx = ctxRef.current;
        void ctx.resume();
        if (sourceRef.current) {
            applyVolume();
            return;
        }
        bufferRef.current ??= (bytesRef.current ?? fetch(src).then((r) => r.arrayBuffer())).then(
            (bytes) => ctx.decodeAudioData(bytes),
        );
        void bufferRef.current
            .then((buffer) => {
                if (sourceRef.current || ctxRef.current !== ctx || !gainRef.current) return;
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.loop = true;
                source.connect(gainRef.current);
                source.start();
                sourceRef.current = source;
                applyVolume();
            })
            .catch(() => {
                // 음원을 못 불러와도 게임은 소리 없이 계속한다
            });
    }, [applyVolume, src]);

    /** 음량을 배율만큼 줄인다 (예: 부딪혔을 때 0.3) */
    const duck = useCallback(
        (ratio: number) => {
            duckRef.current = ratio;
            applyVolume();
        },
        [applyVolume],
    );

    /** 일시정지 — 곡 위치를 그대로 두고 멈춘다 */
    const pause = useCallback(() => {
        pausedRef.current = true;
        void ctxRef.current?.suspend();
    }, []);

    /** 일시정지한 곳부터 이어서 재생한다 — 입력 처리 안에서 부른다 */
    const resume = useCallback(() => {
        pausedRef.current = false;
        if (sourceRef.current) void ctxRef.current?.resume();
    }, []);

    /** 소리 단계를 바꾼다 (0이면 음소거) */
    const setLevel = useCallback((next: number) => {
        const clamped = Math.min(BGM_MAX_LEVEL, Math.max(0, Math.round(next)));
        setLevelState(clamped);
        saveLevel(clamped);
    }, []);

    useEffect(() => {
        levelRef.current = level;
        applyVolume(0.2);
    }, [level, applyVolume]);

    // 다른 탭으로 가면 멈추고, 돌아오면 이어서 재생한다
    useEffect(() => {
        const onVisibility = () => {
            const ctx = ctxRef.current;
            if (!ctx) return;
            if (document.hidden) void ctx.suspend();
            else if (sourceRef.current && !pausedRef.current) void ctx.resume();
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, []);

    // 게임 화면을 떠나면 완전히 멈추고 정리한다
    useEffect(
        () => () => {
            sourceRef.current?.stop();
            sourceRef.current = null;
            void ctxRef.current?.close();
            ctxRef.current = null;
            gainRef.current = null;
            bufferRef.current = null;
        },
        [],
    );

    return { play, duck, pause, resume, level, setLevel };
}
