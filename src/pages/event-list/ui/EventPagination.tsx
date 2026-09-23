import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@shared/lib/utils';

export function EventPagination({
    page,
    totalPages,
    onPageChange,
}: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}) {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <nav aria-label="페이지" className="flex items-center justify-center gap-2">
            <button
                type="button"
                aria-label="이전 페이지"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="text-fg-tertiary disabled:opacity-50"
            >
                <ChevronLeft className="size-5" />
            </button>
            {pages.map((p) => (
                <button
                    key={p}
                    type="button"
                    aria-current={p === page ? 'page' : undefined}
                    onClick={() => onPageChange(p)}
                    className={cn(
                        'text-body-sm-bold rounded-sm px-3 py-2 leading-4',
                        p === page ? 'bg-surface-canvas text-fg-primary' : 'text-fg-tertiary',
                    )}
                >
                    {p}
                </button>
            ))}
            <button
                type="button"
                aria-label="다음 페이지"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="text-fg-tertiary disabled:opacity-50"
            >
                <ChevronRight className="size-5" />
            </button>
        </nav>
    );
}
