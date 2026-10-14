import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import type { PublishedPrize } from '@entities/drawResult';

import { formatNumber } from '@shared/lib/format';
import { cn } from '@shared/lib/utils';

/** 접었을 때 보여 주는 당첨자 줄 수 — 더 있으면 'N명 더 보기'로 펼친다 */
const COLLAPSED_COUNT = 5;

interface PrizeWinnerCardProps {
    prize: PublishedPrize;
    /** 조회로 찾은 내 뒷자리 — 같은 줄을 강조한다 */
    mySuffix?: string | null;
    /** 1등은 등수 칩을 채워 눈에 띄게 둔다 */
    highlighted?: boolean;
}

/**
 * 등수 하나의 당첨자 명단.
 *
 * 당첨자가 수십 명인 등수가 있어 전부 펼치면 카드 하나가 화면을 넘긴다. 다섯 줄만 두고
 * 나머지는 접는다 — 스크롤 영역으로 두면 안에 더 있다는 걸 눈치채기 어렵다.
 */
export function PrizeWinnerCard({ prize, mySuffix, highlighted = false }: PrizeWinnerCardProps) {
    const [expanded, setExpanded] = useState(false);

    // 강조할 줄이 접힌 자리에 있으면 펼쳐 둔다 — 찾아 준 줄을 다시 눌러야 보는 건 말이 안 된다
    const matchIndex =
        mySuffix == null
            ? -1
            : prize.winners.findIndex((winner) => winner.maskedPhoneNum === mySuffix);
    const matchHidden = matchIndex >= COLLAPSED_COUNT;

    const hiddenCount = Math.max(0, prize.winners.length - COLLAPSED_COUNT);
    const open = expanded || matchHidden;
    const visible = open ? prize.winners : prize.winners.slice(0, COLLAPSED_COUNT);

    return (
        <article className="bg-surface-page border-border-default flex flex-col gap-4 rounded-2xl border p-5">
            <div className="flex items-center justify-between gap-4">
                <span
                    className={cn(
                        'text-caption rounded-full px-3 py-1.5',
                        highlighted
                            ? 'bg-action-neutral text-fg-on-brand'
                            : 'bg-surface-sunken text-fg-primary',
                    )}
                >
                    {prize.rank}등
                </span>
                <p className="text-body-bold text-fg-primary">
                    {formatNumber(prize.winnerCount)}명
                </p>
            </div>

            <p className="text-title-3 text-fg-primary truncate">{prize.name}</p>

            <ul className="divide-border-default flex flex-col divide-y">
                {visible.map((winner, index) => {
                    // 뒷자리로 찾은 줄을 표시한다. 같은 뒷자리가 여럿일 수 있어 '나'는 후보 표시에 가깝다
                    const isMine = mySuffix != null && winner.maskedPhoneNum === mySuffix;
                    return (
                        <li
                            // 마스킹된 이름·뒷자리는 서로 겹칠 수 있고 응답에 당첨자 식별자가 없다.
                            // 명단은 다시 정렬되지 않으므로 순번을 키에 쓴다
                            key={`${prize.prizeId}-${index}`}
                            className={cn(
                                'flex items-center justify-between gap-4 px-4 py-2.5',
                                isMine && 'bg-ticket-accent rounded-lg',
                            )}
                        >
                            <span className="text-body-sm text-fg-secondary flex items-center gap-2">
                                {winner.maskedName}
                                {isMine && (
                                    <span className="bg-action-neutral text-fg-on-brand text-caption rounded-full px-2 py-0.5">
                                        나
                                    </span>
                                )}
                            </span>
                            <span className="text-body-sm text-fg-secondary tabular-nums">
                                {winner.maskedPhoneNum ? `…${winner.maskedPhoneNum}` : '-'}
                            </span>
                        </li>
                    );
                })}
            </ul>

            {hiddenCount > 0 && !matchHidden && (
                <button
                    type="button"
                    onClick={() => setExpanded((value) => !value)}
                    aria-expanded={expanded}
                    className="text-body-sm text-fg-secondary hover:text-fg-primary flex items-center justify-center gap-1 self-center"
                >
                    {expanded ? '접기' : `${formatNumber(hiddenCount)}명 더 보기`}
                    <ChevronDown
                        className={cn('size-4 transition-transform', expanded && 'rotate-180')}
                    />
                </button>
            )}

            {prize.unfilledCount > 0 && (
                <p className="text-caption text-fg-tertiary">
                    응모자가 모자라 {formatNumber(prize.unfilledCount)}자리는 채우지 못했어요.
                </p>
            )}
        </article>
    );
}
