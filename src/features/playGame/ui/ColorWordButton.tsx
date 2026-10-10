import type { CSSProperties } from 'react';

import buttonHover from '../assets/colorWord/button-hover.png';
import buttonPressed from '../assets/colorWord/button-pressed.png';
import button from '../assets/colorWord/button.png';

/** 색 버튼 상태별 그림 — CSS 변수로 넘겨 hover·active에서 배경 그림만 바꾼다 */
const BUTTON_IMAGES = {
    '--btn': `url(${button})`,
    '--btn-hover': `url(${buttonHover})`,
    '--btn-pressed': `url(${buttonPressed})`,
} as CSSProperties;

/**
 * 색 버튼 하나 — 기본(image 170)·올렸을 때(image 172)·눌렀을 때(image 171) 그림 위에
 * 왼쪽 키보드 번호(키 모양) · 가운데 색 이름.
 */
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
        <button
            type="button"
            // 시작·세기·멈춤·끝 화면에서는 위에 안내판이 덮여 있어 따로 흐리게 하지 않는다
            disabled={disabled}
            onClick={onPick}
            style={BUTTON_IMAGES}
            // 마우스로 눌러도 초점이 남지 않게 — 남으면 다음 스페이스바가 이 버튼을 누른다
            onMouseDown={(event) => event.preventDefault()}
            className={`text-fg-primary focus-visible:ring-border-focus relative flex aspect-[480/176] cursor-pointer items-center rounded-xl bg-(image:--btn) bg-size-[100%_100%] bg-no-repeat px-[9%] text-sm font-bold hover:bg-(image:--btn-hover) focus-visible:ring-2 focus-visible:outline-none active:bg-(image:--btn-pressed) disabled:cursor-default sm:text-base`}
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
        </button>
    );
}
