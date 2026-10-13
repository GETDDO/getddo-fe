import type { ReactNode } from 'react';

import { Pager } from '@shared/ui/pager';

interface PageData<T> {
    items: T[];
    size: number;
    totalElements: number;
}

// 탭마다 같은 로딩·오류·빈 목록·페이저 상태를 한 곳에서 그린다
export function PagedResult<T>({
    data,
    isPending,
    isError,
    page,
    onPageChange,
    emptyText,
    errorText,
    children,
}: {
    data: PageData<T> | undefined;
    isPending: boolean;
    isError: boolean;
    page: number;
    onPageChange: (page: number) => void;
    emptyText: string;
    errorText: string;
    children: (items: T[]) => ReactNode;
}) {
    const totalPages = data ? Math.max(1, Math.ceil(data.totalElements / data.size)) : 0;

    return (
        <div className="flex flex-col gap-4">
            {isPending && <p className="text-body-sm text-fg-tertiary">불러오는 중…</p>}
            {isError && <p className="text-destructive text-body-sm">{errorText}</p>}
            {!isPending && !isError && data && data.items.length === 0 && (
                <p className="text-fg-tertiary text-body-sm py-6">{emptyText}</p>
            )}
            {data && data.items.length > 0 && children(data.items)}
            {data && data.totalElements > 0 && (
                <div className="flex items-center justify-between">
                    <span className="text-body-sm text-fg-tertiary">총 {data.totalElements}건</span>
                    <Pager
                        current={page - 1}
                        total={totalPages}
                        onPrev={() => onPageChange(page - 1)}
                        onNext={() => onPageChange(page + 1)}
                        prevDisabled={page <= 1}
                        nextDisabled={page >= totalPages}
                    />
                </div>
            )}
        </div>
    );
}
