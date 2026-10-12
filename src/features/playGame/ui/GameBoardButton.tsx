import type { CSSProperties, ReactNode } from 'react';

import buttonHover from '../assets/colorWord/button-hover.png';
import buttonPressed from '../assets/colorWord/button-pressed.png';
import button from '../assets/colorWord/button.png';

/** 버튼 상태별 그림 — CSS 변수로 넘겨 hover·active에서 배경 그림만 바꾼다 */
const BUTTON_IMAGES = {
    '--btn': `url(${button})`,
    '--btn-hover': `url(${buttonHover})`,
    '--btn-pressed': `url(${buttonPressed})`,
} as CSSProperties;

/**
 * 판 위 도트 버튼 — 기본(image 170)·올렸을 때(image 172)·눌렀을 때(image 171) 그림을 상태별로 바꾼다.
 * 글자색깔 맞추기 색 버튼·타꼬 타이밍 맞추기 멈추기 버튼이 같이 쓴다. 안쪽 배치는 className으로 정한다
 */
export function GameBoardButton({
    disabled,
    onClick,
    className = '',
    children,
}: {
    disabled?: boolean;
    onClick: () => void;
    className?: string;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            // 시작·세기·멈춤·끝 화면에서는 위에 안내판이 덮여 있어 따로 흐리게 하지 않는다
            disabled={disabled}
            onClick={onClick}
            style={BUTTON_IMAGES}
            // 마우스로 눌러도 초점이 남지 않게 — 남으면 다음 스페이스바가 이 버튼을 누른다
            onMouseDown={(event) => event.preventDefault()}
            className={`text-fg-primary focus-visible:ring-border-focus relative flex aspect-[480/176] cursor-pointer items-center rounded-xl bg-(image:--btn) bg-size-[100%_100%] bg-no-repeat font-bold hover:bg-(image:--btn-hover) focus-visible:ring-2 focus-visible:outline-none active:bg-(image:--btn-pressed) disabled:cursor-default ${className}`}
        >
            {children}
        </button>
    );
}
