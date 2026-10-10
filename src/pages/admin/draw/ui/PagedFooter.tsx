import { Pager } from '@shared/ui/pager';

interface PagedFooterProps {
    page: number;
    size: number;
    totalElements: number;
    onPageChange: (page: number) => void;
}

// 번호형 Pager 공통 푸터 — ADR-0009 (관리자 테이블은 번호형)
export function PagedFooter({ page, size, totalElements, onPageChange }: PagedFooterProps) {
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    return (
        <div className="flex items-center justify-between">
            <span className="text-body-sm text-fg-tertiary">총 {totalElements}건</span>
            <Pager
                current={page - 1}
                total={totalPages}
                onPrev={() => onPageChange(page - 1)}
                onNext={() => onPageChange(page + 1)}
                prevDisabled={page <= 1}
                nextDisabled={page >= totalPages}
            />
        </div>
    );
}
