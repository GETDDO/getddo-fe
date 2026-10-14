import type { ReactNode } from 'react';

import { Pager } from '@shared/ui/pager';
import { LoadingBlock, TableSkeleton } from '@shared/ui/skeleton';

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
    loadingContent,
    children,
}: {
    data: PageData<T> | undefined;
    isPending: boolean;
    isError: boolean;
    page: number;
    onPageChange: (page: number) => void;
    emptyText: string;
    errorText: string;
    /** 초기 로딩 모양 — 생략 시 테이블형 스켈레톤. 재조회에는 나타나지 않는다 */
    loadingContent?: ReactNode;
    children: (items: T[]) => ReactNode;
}) {
    const totalPages = data ? Math.max(1, Math.ceil(data.totalElements / data.size)) : 0;

    return (
        <div className="flex flex-col gap-4">
            {isPending &&
                (loadingContent ?? (
                    <LoadingBlock>
                        <TableSkeleton rows={4} />
                    </LoadingBlock>
                ))}
            {isError && <p className="text-semantic-error-strong text-body-sm">{errorText}</p>}
            {!isPending && !isError && data && data.items.length === 0 && (
                <p className="text-fg-secondary text-body-sm py-6">{emptyText}</p>
            )}
            {data && data.items.length > 0 && children(data.items)}
            {data && data.totalElements > 0 && (
                <div className="flex items-center justify-between">
                    <span className="text-body-sm text-fg-secondary">
                        총 {data.totalElements}건
                    </span>
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
