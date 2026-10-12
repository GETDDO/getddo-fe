import { GameBoardButton } from './GameBoardButton';

/** 색 버튼 하나 — 판 위 도트 버튼에 왼쪽 키보드 번호(키 모양) · 가운데 색 이름 */
export function ColorWordButton({
    number,
    name,
    disabled,
    onPick,
}: {
    number: number;
    name: string;
    disabled: boolean;
    onPick: () => void;
}) {
    return (
        <GameBoardButton
            disabled={disabled}
            onClick={onPick}
            className="px-[9%] text-sm sm:text-base"
        >
            <span
                aria-hidden
                // 키 모양 — 아래 두꺼운 테두리 대신 그림자로 입체감을 준다 (호버 때 테두리 칠이 깨져 보이던 문제)
                className="border-fg-primary bg-surface-page relative isolate flex size-6 items-center justify-center rounded-md border-2 text-sm leading-none font-extrabold shadow-[0_3px_0_0_var(--color-fg-primary)] sm:size-8 sm:text-base [@media(hover:none)]:invisible"
            >
                {number}
            </span>
            {/* 이름은 번호와 오른쪽 빈칸 사이의 가운데에 둔다.
                색 동그라미는 두지 않는다 — 있으면 글자를 읽지 않고 색만 맞춰 너무 쉬워진다 */}
            <span className="flex-1 text-center">{name}</span>
            {/* 오른쪽 빈칸(번호 폭의 절반) — 이름이 버튼 정가운데와 번호 옆 칸 가운데의 중간에 와서 어느 쪽으로도 치우쳐 보이지 않게 한다 */}
            <span aria-hidden className="w-3 shrink-0 sm:w-4" />
        </GameBoardButton>
    );
}
