import type { EntryStatusFilter } from '../lib/filterEntries';

/** 결과 칸 하나의 표시 값 */
export interface StatusTile {
    value: EntryStatusFilter;
    label: string;
    count: number;
    note: string;
}

/**
 * 결과 칸 4개(전체·발표 대기·당첨·미당첨) — 요약이자 거르기 버튼이다.
 * 고른 칸은 잉크색 2px 테두리로 표시하고 aria-pressed로 알린다
 */
export function EntryStatusTiles({
    tiles,
    value,
    onChange,
}: {
    tiles: StatusTile[];
    value: EntryStatusFilter;
    onChange: (value: EntryStatusFilter) => void;
}) {
    return (
        <div
            role="group"
            aria-label="결과로 거르기"
            className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
            {tiles.map((tile) => {
                const selected = tile.value === value;
                return (
                    <button
                        key={tile.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => onChange(tile.value)}
                        className={`bg-surface-page focus-visible:ring-border-focus flex min-h-29 cursor-pointer flex-col items-start gap-1 rounded-2xl p-5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
                            selected
                                ? 'border-fg-primary border-2 p-[calc(1.25rem-1px)]'
                                : 'border-border-default hover:bg-surface-canvas border'
                        }`}
                    >
                        <span className="text-body-sm text-fg-secondary">{tile.label}</span>
                        <span className="text-title-2 text-fg-primary">{tile.count}건</span>
                        <span className="text-caption text-fg-tertiary">{tile.note}</span>
                    </button>
                );
            })}
        </div>
    );
}
