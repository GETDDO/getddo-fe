import { Pagination } from '@shared/ui/pagination';

interface PagedFooterProps {
    page: number;
    size: number;
    totalElements: number;
    onPageChange: (page: number) => void;
}

// 번호형 페이지네이션 공통 푸터 — ADR-0009 (관리자 테이블은 번호형)
export function PagedFooter({ page, size, totalElements, onPageChange }: PagedFooterProps) {
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    return (
        <div className="flex items-center justify-between">
            <span className="text-body-sm text-fg-secondary">총 {totalElements}건</span>
            <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
    );
}
