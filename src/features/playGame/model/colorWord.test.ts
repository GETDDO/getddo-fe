import { colorWordTimeLimitMs, createColorWordRound, isColorWordCorrect } from './colorWord';

/** 정해 둔 값을 차례로 돌려주는 난수 */
const sequence = (...values: number[]) => {
    let index = 0;
    return () => values[index++ % values.length]!;
};

describe('createColorWordRound', () => {
    it('뜻과 색이 다르게 나오면 다른 색 중에서 고른다', () => {
        // 뜻: 0 → 빨강, 0.1 < 0.75 → 다르게, 0.5 → 나머지(파랑·노랑·초록) 중 노랑
        expect(createColorWordRound(sequence(0, 0.1, 0.5))).toEqual({ word: 'red', ink: 'yellow' });
    });

    it('비율을 넘으면 뜻과 같은 색으로 낸다', () => {
        expect(createColorWordRound(sequence(0.3, 0.9))).toEqual({ word: 'blue', ink: 'blue' });
    });

    it('바로 앞 문제와 똑같으면 다시 뽑는다', () => {
        const previous = { word: 'blue', ink: 'blue' } as const;
        const next = createColorWordRound(sequence(0.3, 0.9, 0.6, 0.9), previous);
        expect(next).toEqual({ word: 'yellow', ink: 'yellow' });
    });
});

describe('colorWordTimeLimitMs', () => {
    it('3초에서 시작해 맞힐수록 줄고 1.2초 아래로는 내려가지 않는다', () => {
        expect(colorWordTimeLimitMs(0)).toBe(3000);
        expect(colorWordTimeLimitMs(10)).toBe(2200);
        expect(colorWordTimeLimitMs(100)).toBe(1200);
    });
});

describe('isColorWordCorrect', () => {
    it('글자 뜻이 아니라 글자 색이 정답이다', () => {
        const round = { word: 'red', ink: 'blue' } as const;
        expect(isColorWordCorrect(round, 'blue')).toBe(true);
        expect(isColorWordCorrect(round, 'red')).toBe(false);
    });
});
