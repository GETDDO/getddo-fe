import { useEffect, useRef, useState } from 'react';

const DURATION_MS = 600;

/**
 * 값이 바뀌면 이전 값에서 새 값까지 숫자를 굴려 올린다 (처음 받은 값은 그대로 보여준다).
 * 동작 줄이기 설정을 켠 사용자에게는 바로 새 값을 보여준다
 */
export function useCountUp(value: number | undefined): number | undefined {
    const [display, setDisplay] = useState(value);
    const previous = useRef(value);

    useEffect(() => {
        const from = previous.current;
        previous.current = value;
        if (value == null || from == null || from === value) {
            setDisplay(value);
            return;
        }
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setDisplay(value);
            return;
        }
        const start = performance.now();
        let frame = requestAnimationFrame(function step(time) {
            const progress = Math.min(1, (time - start) / DURATION_MS);
            const eased = 1 - (1 - progress) ** 3;
            setDisplay(Math.round(from + (value - from) * eased));
            if (progress < 1) frame = requestAnimationFrame(step);
        });
        return () => cancelAnimationFrame(frame);
    }, [value]);

    return display;
}
