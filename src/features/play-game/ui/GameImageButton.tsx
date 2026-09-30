import type { Ref } from 'react';

import exitImage from '../assets/ui/button-exit.png';
import guideImage from '../assets/ui/button-guide.png';
import retryImage from '../assets/ui/button-retry.png';
import startImage from '../assets/ui/button-start.png';

// 피그마 image 109의 도트 버튼 — 글자가 그림에 들어 있어 alt로 이름을 준다
const BUTTONS = {
    start: { image: startImage, label: '게임 시작' },
    guide: { image: guideImage, label: '게임 방법' },
    retry: { image: retryImage, label: '다시 하기' },
    exit: { image: exitImage, label: '나가기' },
} as const;

export type GameImageButtonKind = keyof typeof BUTTONS;

/**
 * 게임용 그림 버튼 — 높이는 버튼 규격을 따라 Large 48 / Small 36으로 고정하고 너비는 그림 비율대로.
 * 올리면 살짝 떠오르고 누르면 눌린다
 */
export function GameImageButton({
    kind,
    size = 'large',
    onClick,
    ref,
}: {
    kind: GameImageButtonKind;
    size?: 'large' | 'small';
    onClick: () => void;
    ref?: Ref<HTMLButtonElement>;
}) {
    const { image, label } = BUTTONS[kind];
    return (
        <button
            ref={ref}
            type="button"
            onClick={onClick}
            // 키보드 초점은 테두리 대신 올렸을 때처럼 살짝 떠오르고 밝아지는 것으로 보여준다 (그림 버튼에 선이 덧대지지 않게)
            className={`shrink-0 cursor-pointer rounded-lg transition-[translate,filter] duration-150 outline-none hover:-translate-y-0.5 hover:brightness-105 focus-visible:-translate-y-0.5 focus-visible:brightness-110 active:translate-y-0.5 active:brightness-95 ${size === 'large' ? 'h-12' : 'h-9'}`}
        >
            <img src={image} alt={label} draggable={false} className="h-full w-auto" />
        </button>
    );
}
