/**
 * 타꼬 주문 규칙 — 손님 주문(타코야끼 순서)을 잠깐 보여 주고, 가린 뒤 같은 순서로 내준다 (순서 기억 게임).
 * 목숨 3개, 틀리면 하나 줄고 같은 길이의 새 주문을 받는다. 맞히면 주문이 하나씩 길어진다.
 * 시간 제한이 없어 손이 느려도 할 수 있다 — 다른 게임(반응·타이밍·순간 판단)과 쓰는 능력이 다르다
 */

/** 메뉴 — 토핑 색이 확실히 다른 네 가지 (피그마 image 237: 파 초록 · 치즈 노랑 · 새우 주황 · 김 검정) */
export const TAKKO_ORDER_MENU = [
    { id: 'scallion', name: '파' },
    { id: 'cheese', name: '치즈' },
    { id: 'shrimp', name: '새우' },
    { id: 'nori', name: '김' },
] as const;

export type TakkoOrderItemId = (typeof TAKKO_ORDER_MENU)[number]['id'];

export const TAKKO_ORDER_LIVES = 3;
/** 첫 주문 길이 — 맞힐 때마다 하나씩 늘고 최대 길이에서 멈춘다 */
export const TAKKO_ORDER_START_LENGTH = 3;
export const TAKKO_ORDER_MAX_LENGTH = 8;

/** 다음 주문 길이 — 맞혔으면 하나 늘리고, 틀렸으면 그대로 */
export function nextTakkoOrderLength(length: number, ok: boolean): number {
    return ok ? Math.min(TAKKO_ORDER_MAX_LENGTH, length + 1) : length;
}

/** 맞힌 주문 점수 — 주문 길이만큼 (긴 주문일수록 많이) */
export const takkoOrderPoints = (length: number) => length;

/**
 * 주문을 보여 주는 시간(ms) — 한 개당 0.6초 + 훑어볼 여유 0.8초.
 * 길어질수록 외울 게 많아지는 만큼만 늘려 난이도는 길이로 올린다
 */
export function takkoOrderShowMs(length: number): number {
    return 800 + length * 600;
}

/**
 * 주문을 만든다. 같은 메뉴가 세 번 연달아 나오지 않게 한다 (너무 쉽거나 단조로워진다).
 * random은 0 이상 1 미만을 돌려주는 함수(테스트에서 고정값을 넣는다)
 */
export function createTakkoOrder(length: number, random: () => number): TakkoOrderItemId[] {
    const order: TakkoOrderItemId[] = [];
    while (order.length < length) {
        const id = TAKKO_ORDER_MENU[Math.floor(random() * TAKKO_ORDER_MENU.length)]!.id;
        const [a, b] = order.slice(-2);
        if (a === id && b === id) continue;
        order.push(id);
    }
    return order;
}

/** 지금까지 고른 것이 주문 앞부분과 맞는지 — 하나라도 다르면 그 자리에서 틀린 것으로 친다 */
export function isTakkoOrderPrefix(
    order: readonly TakkoOrderItemId[],
    picked: readonly TakkoOrderItemId[],
) {
    return picked.length <= order.length && picked.every((id, index) => order[index] === id);
}

const ORDINAL_WORDS = ['첫', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];

/** 손님 순서 — "첫 번째 손님"처럼 열 번째까지는 말로, 그 뒤는 숫자로 적는다 */
export function takkoOrderCustomerLabel(n: number): string {
    const word = ORDINAL_WORDS[n - 1];
    return word ? `${word} 번째 손님` : `${n}번째 손님`;
}
