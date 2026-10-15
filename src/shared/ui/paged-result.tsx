import type { ReactNode } from 'react';

import { Pager } from '@shared/ui/pager';

import { SkeletonList } from './skeleton';

interface PageData<T> {
    items: T[];
    size: number;
    totalElements: number;
}

// 탭마다 같은 로딩·오류·빈 목록·페이저 상태를 한 곳에서 그린다
function PagedResult<T>({
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
            {isPending && (
                // 스켈레톤은 낭독기에서 감추므로 불러오는 중임을 글로 알린다 (알림 목록과 같은 꼴)
                <div role="status">
                    <span className="sr-only">불러오는 중이에요</span>
                    <SkeletonList count={5} rowClassName="h-12" />
                </div>
            )}
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

export { PagedResult };
