/** 게임 시작 안내에 쓰는 키보드 키 모양 표시 */
export function GameKey({ children, className = '' }: { children: string; className?: string }) {
    return (
        <kbd
            className={`border-fg-on-brand/50 bg-fg-on-brand/15 text-caption inline-flex h-6 items-center rounded-md border border-b-2 px-2 ${className}`}
        >
            {children}
        </kbd>
    );
}
