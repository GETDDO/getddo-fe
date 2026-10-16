/**
 * 글자색깔 맞추기(스트룹) 규칙 — 글자 뜻이 아니라 글자에 칠해진 색을 고른다.
 * 목숨 3개, 틀리거나 시간이 지나면 하나씩 줄고, 맞힐수록 한 문제 제한 시간이 짧아진다.
 */

/**
 * 문제에 쓰는 색 — 피그마 썸네일(image 163)의 빨강·파랑·노랑·초록 순서.
 * name은 글자·버튼 이름, textClass는 글자색 — 게임 전용 색(game/*)
 */
export const COLOR_WORD_COLORS = [
    { id: 'red', name: '빨강', textClass: 'text-game-red' },
    { id: 'blue', name: '파랑', textClass: 'text-game-blue' },
    { id: 'yellow', name: '노랑', textClass: 'text-game-yellow' },
    { id: 'green', name: '초록', textClass: 'text-game-green' },
] as const;

export type ColorWordColorId = (typeof COLOR_WORD_COLORS)[number]['id'];

export interface ColorWordRound {
    /** 글자 뜻 */
    word: ColorWordColorId;
    /** 글자에 칠한 색 — 이것이 정답 */
    ink: ColorWordColorId;
}

export const COLOR_WORD_LIVES = 3;
/** 맞힌 한 문제당 점수 */
export const COLOR_WORD_POINTS = 10;

/** 글자 뜻과 색이 일부러 다르게 나오는 비율 — 같게 나오는 문제도 섞어야 습관적으로 뜻을 피하는 요령이 안 통한다 */
const MISMATCH_RATE = 0.75;

/**
 * 다음 문제를 만든다. 바로 앞 문제와 뜻·색이 모두 같으면 다시 뽑아 같은 화면이 이어지지 않게 한다.
 * random은 0 이상 1 미만을 돌려주는 함수(테스트에서 고정값을 넣는다)
 */
export function createColorWordRound(
    random: () => number,
    previous?: ColorWordRound,
): ColorWordRound {
    const pick = () => COLOR_WORD_COLORS[Math.floor(random() * COLOR_WORD_COLORS.length)]!.id;
    for (let attempt = 0; attempt < 10; attempt += 1) {
        const word = pick();
        let ink = word;
        if (random() < MISMATCH_RATE) {
            const others = COLOR_WORD_COLORS.filter((color) => color.id !== word);
            ink = others[Math.floor(random() * others.length)]!.id;
        }
        if (!previous || previous.word !== word || previous.ink !== ink) return { word, ink };
    }
    // 같은 문제만 계속 나오는 비정상 난수에서도 멈추지 않게 앞 문제와 다른 색으로 바꾼다
    const fallback = COLOR_WORD_COLORS.find((color) => color.id !== previous?.ink)!.id;
    return { word: previous?.word ?? fallback, ink: fallback };
}

/** 한 문제 제한 시간(ms) — 3초에서 시작해 맞힐 때마다 0.08초씩 줄고 1.2초 아래로는 내려가지 않는다 */
export function colorWordTimeLimitMs(correctCount: number): number {
    return Math.max(1200, 3000 - correctCount * 80);
}

export const isColorWordCorrect = (round: ColorWordRound, answer: ColorWordColorId) =>
    round.ink === answer;
