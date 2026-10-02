import { cn } from 'cn';
import { CircleArrowLeft, CircleArrowRight } from 'lucide-react';
import * as React from 'react';

const ARROW =
    'text-fg-primary hover:text-fg-secondary focus-visible:ring-border-focus disabled:text-fg-disabled flex size-6 cursor-pointer items-center justify-center rounded-full focus-visible:ring-2 focus-visible:outline-none disabled:cursor-default';

/**
 * 페이지 넘김 — 원형 화살표 사이에 '01 / 04' (피그마 홈 배너, 글자 12 Medium, 화살표 24).
 * current는 0부터. 끝에서 멈추는 목록은 prev/nextDisabled로 화살표를 흐리게 막는다.
 * children은 오른쪽 끝에 덧붙인다 (예: 배너 일시정지 버튼)
 */
function Pager({
    current,
    total,
    onPrev,
    onNext,
    prevDisabled = false,
    nextDisabled = false,
    prevLabel = '이전',
    nextLabel = '다음',
    className,
    children,
}: {
    current: number;
    total: number;
    onPrev: () => void;
    onNext: () => void;
    prevDisabled?: boolean;
    nextDisabled?: boolean;
    prevLabel?: string;
    nextLabel?: string;
    className?: string;
    children?: React.ReactNode;
}) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
        <div data-slot="pager" className={cn('flex items-center gap-2', className)}>
            <button
                type="button"
                aria-label={prevLabel}
                disabled={prevDisabled}
                onClick={onPrev}
                className={ARROW}
            >
                <CircleArrowLeft className="size-6" strokeWidth={1.5} />
            </button>
            <span className="text-fg-primary text-xs leading-[1.125rem] font-medium tabular-nums">
                {pad(current + 1)} / {pad(total)}
            </span>
            <button
                type="button"
                aria-label={nextLabel}
                disabled={nextDisabled}
                onClick={onNext}
                className={ARROW}
            >
                <CircleArrowRight className="size-6" strokeWidth={1.5} />
            </button>
            {children}
        </div>
    );
}

export { Pager };
