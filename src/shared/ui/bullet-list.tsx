import type { ReactNode } from 'react';

const SIZE = {
    /** 안내 본문 — 겟또타임 '추첨 결과 안내'·상세 '응모 및 추첨 안내' */
    md: { text: 'text-body-sm text-fg-secondary', dot: 'size-1.5 mt-2', gap: 'gap-2' },
    /** 본문 아래 덧붙이는 작은 고지 — 운영 정책 등 */
    sm: { text: 'text-caption text-fg-tertiary', dot: 'size-1 mt-[0.4375rem]', gap: 'gap-1.5' },
} as const;

interface BulletListProps {
    items: ReactNode[];
    size?: keyof typeof SIZE;
    className?: string;
}

/**
 * 안내 문장 목록 — 화면마다 '•' 글자·점 크기·글자 크기가 달라 같은 성격의 안내가 달라 보였다.
 * 불릿은 연한 점(fg-tertiary)으로 통일하고, 여러 줄로 넘어가도 첫 줄에 맞도록 위에 붙인다
 */
export function BulletList({ items, size = 'md', className = '' }: BulletListProps) {
    const style = SIZE[size];
    return (
        <ul className={`flex flex-col ${style.gap} ${className}`}>
            {items.map((item, index) => (
                // 안내 문장은 다시 정렬되지 않는 고정 목록이라 순번을 키로 쓴다
                <li key={index} className={`flex items-start gap-2 ${style.text}`}>
                    <span
                        aria-hidden
                        className={`bg-fg-tertiary shrink-0 rounded-full ${style.dot}`}
                    />
                    <span className="min-w-0 flex-1">{item}</span>
                </li>
            ))}
        </ul>
    );
}
