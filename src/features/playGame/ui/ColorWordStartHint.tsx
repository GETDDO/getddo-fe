import { GameKey } from './GameKey';

/**
 * 글자색깔 맞추기 시작 안내 — 따로 시작 버튼 없이 키나 판을 누르면 바로 시작한다
 * (게임 상세의 '게임 시작'과 겹치지 않게). 판 전체가 누를 수 있는 버튼이다
 */
export function ColorWordStartHint({ onStart }: { onStart: () => void }) {
    return (
        <button
            type="button"
            onClick={onStart}
            aria-label="게임 시작"
            className="focus-visible:ring-border-focus absolute inset-0 flex cursor-pointer items-center justify-center px-4 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset sm:px-6"
        >
            <span className="bg-surface-inverse/55 text-fg-on-brand flex flex-col items-center gap-2 rounded-2xl px-4 py-3 text-center backdrop-blur-sm sm:gap-3 sm:px-6 sm:py-4">
                <span className="text-body-bold sm:text-subhead flex flex-wrap items-center justify-center gap-2">
                    {/* 컴퓨터는 스페이스바·Enter와 화면 클릭, 터치 기기(마우스 올리기 없음)는 화면 누르기로 안내한다 */}
                    <span className="flex items-center gap-1 [@media(hover:none)]:hidden">
                        <GameKey className="motion-safe:animate-pulse">Space</GameKey>
                        <GameKey className="motion-safe:animate-pulse">Enter</GameKey>
                        <span className="ml-1">또는 화면을 눌러 시작</span>
                    </span>
                    <span className="hidden [@media(hover:none)]:inline">화면을 눌러 시작</span>
                </span>
                {/* 조작 — 컴퓨터는 버튼 클릭이나 숫자 키·일시정지 키, 터치 기기는 버튼 누르기 */}
                <span className="text-caption sm:text-body-sm flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
                    <span className="flex items-center gap-1.5 [@media(hover:none)]:hidden">
                        클릭 또는 <GameKey>1</GameKey>~<GameKey>4</GameKey> 색 고르기
                    </span>
                    <span className="hidden [@media(hover:none)]:inline">
                        버튼을 눌러 색 고르기
                    </span>
                    <span className="flex items-center gap-1.5 [@media(hover:none)]:hidden">
                        <GameKey>Esc</GameKey>·<GameKey>P</GameKey> 일시정지
                    </span>
                </span>
                <span className="text-caption sm:text-body-sm">목숨 3개 · 맞힐수록 빨라져요</span>
            </span>
        </button>
    );
}
