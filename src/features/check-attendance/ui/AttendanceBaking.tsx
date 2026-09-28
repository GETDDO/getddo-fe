import { cn } from '@shared/lib/utils';

import { BASIC_MASCOT } from './mascots';

/**
 * 출석 처리 중 타코야끼 굽는 연출 — 출석하기 버튼 자리에서 보여준다.
 * 전용 굽기 스프라이트가 나오기 전까지 기본 타코야끼를 꼬치로 굴리듯 돌린다
 */
export function AttendanceBaking({ compact = false }: { compact?: boolean }) {
    return (
        <div
            role="status"
            className={cn(
                'bg-play-yellow-soft flex items-center justify-center rounded-lg',
                // 펼친 출석판에서는 출석하기 버튼과 같은 너비(w-32)
                compact ? 'h-10 w-32 shrink-0 gap-2' : 'h-12 w-full gap-3',
            )}
        >
            <span className={compact ? 'size-6' : 'size-8'}>
                <span className="block size-full overflow-hidden motion-safe:animate-[spin_1.2s_linear_infinite]">
                    <img src={BASIC_MASCOT.src} alt="" className={cn('size-full object-contain')} />
                </span>
            </span>
            {/* Medium(40)·Large(48) 버튼 자리라 글자는 16px. 작은 자리(128px)에서는 넘치지 않게 문구를 줄인다 */}
            <span className="text-body-bold text-fg-primary whitespace-nowrap">
                {compact ? '굽는 중…' : '타코야끼 굽는 중…'}
            </span>
        </div>
    );
}
