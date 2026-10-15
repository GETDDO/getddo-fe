import { motion } from 'framer-motion';

/** 한 번 터질 때 조각 수 */
const PIECE_COUNT = 28;

/** 놀이 파스텔과 응모권 노랑 — "지금" 신호인 마젠타는 쓰지 않는다 */
const COLORS = [
    'bg-play-yellow',
    'bg-grade-gold',
    'bg-play-pink',
    'bg-play-lavender',
    'bg-grade-silver',
    'bg-surface-page',
];

/** 조각마다 늘 같은 값 — 렌더할 때마다 난수를 쓰면 다시 그릴 때 조각이 튄다 */
const seeded = (index: number, salt: number) => {
    const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
    return value - Math.floor(value);
};

/**
 * 조각은 누른 자리에서 살짝 위로 튀었다가 좌우로 하늘거리며 천천히 아래로 떨어진다.
 * 사방으로 퍼지면 폭죽처럼 급해 보여 — 떨어지는 쪽으로 몰아 느긋하게 둔다
 */
const PIECES = Array.from({ length: PIECE_COUNT }, (_, index) => {
    const spread = (seeded(index, 1) - 0.5) * 160;
    return {
        spread,
        sway: (seeded(index, 2) - 0.5) * 40,
        pop: 20 + seeded(index, 3) * 40,
        fall: 220 + seeded(index, 4) * 140,
        width: 6 + seeded(index, 5) * 5,
        height: 9 + seeded(index, 6) * 6,
        spin: (seeded(index, 7) > 0.5 ? 1 : -1) * (180 + seeded(index, 8) * 240),
        duration: 2.4 + seeded(index, 9) * 1.1,
        delay: seeded(index, 10) * 0.25,
        color: COLORS[index % COLORS.length],
    };
});

export interface Burst {
    id: number;
    /** 배너 왼쪽 위에서 잰 터지는 자리(px) */
    x: number;
    y: number;
}

/**
 * 당첨 배너의 종이 조각 — 터진 자리(마스코트·누른 곳)에서 아래로 하늘하늘 떨어진 뒤 사라진다.
 * 부모가 터질 때마다 bursts에 하나 넣고, 끝나면 뺀다.
 * 동작 줄이기 설정 판단은 부모가 한다 — 이 컴포넌트는 받은 것만 그린다
 */
export function ConfettiBurst({ bursts }: { bursts: Burst[] }) {
    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            {bursts.map((burst) =>
                PIECES.map((piece, index) => (
                    <motion.span
                        key={`${burst.id}-${index}`}
                        className={`absolute rounded-[2px] ${piece.color}`}
                        style={{
                            left: burst.x,
                            top: burst.y,
                            width: piece.width,
                            height: piece.height,
                        }}
                        initial={{ x: 0, y: 0, rotate: 0, opacity: 0, scale: 0.6 }}
                        animate={{
                            x: [
                                0,
                                piece.spread * 0.5,
                                piece.spread + piece.sway,
                                piece.spread - piece.sway,
                            ],
                            y: [0, -piece.pop, piece.fall * 0.5, piece.fall],
                            rotate: piece.spin,
                            opacity: [0, 1, 1, 0],
                            scale: 1,
                        }}
                        transition={{
                            duration: piece.duration,
                            delay: piece.delay,
                            times: [0, 0.15, 0.6, 1],
                            ease: ['easeOut', 'easeInOut', 'easeIn'],
                        }}
                    />
                )),
            )}
        </div>
    );
}
