import { Link } from 'react-router-dom';

import { useAbuseCases } from '@entities/abuseCase';
import { useAuditLogs } from '@entities/audit';
import { useAdminEvents } from '@entities/event';
import { formatNumber } from '@shared/lib/format';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import { Skeleton } from '@shared/ui/skeleton';

interface StatCardProps {
    label: string;
    /** 아직 안 오면 —, 조회 실패는 error로 구분해 짧게 표시한다 */
    value?: number;
    /** 초기 조회 중이면 값 자리에 스켈레톤 — 카드 껍데기(제목·설명·링크)는 그대로 둔다 */
    pending?: boolean;
    /** 조회 실패 — 값 자리에 실패 문구를 두고 재시도 버튼을 연다 */
    error?: boolean;
    onRetry?: () => void;
    description: string;
    to: string;
}

function StatCard({
    label,
    value,
    pending = false,
    error,
    onRetry,
    description,
    to,
}: StatCardProps) {
    return (
        <div
            className={cn(
                'bg-surface-page border-border-default relative flex flex-col gap-1 rounded-2xl border p-5 transition-colors',
                'hover:border-fg-brand',
            )}
        >
            {/* 카드 전체를 덮는 링크 — 재시도 버튼은 relative로 링크 위에 띄운다 */}
            <Link
                to={to}
                aria-label={`${label} 화면으로 이동`}
                className={cn(
                    'absolute inset-0 rounded-2xl',
                    'focus-visible:ring-border-focus focus-visible:ring-offset-surface-page focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                )}
            />
            <span className="text-body-sm text-fg-tertiary">{label}</span>
            <div className="text-title-1 text-fg-primary">
                {pending ? (
                    <>
                        <Skeleton className="h-8 w-20" />
                        <span className="sr-only">불러오는 중…</span>
                    </>
                ) : error ? (
                    <span className="text-semantic-error-strong text-body-sm font-medium">
                        조회 실패
                    </span>
                ) : value == null ? (
                    '—'
                ) : (
                    `${formatNumber(value)}건`
                )}
            </div>
            <span className="text-caption text-fg-tertiary">{description}</span>
            {error && onRetry && (
                <Button size="sm" variant="ghost" className="relative self-start" onClick={onRetry}>
                    다시 시도
                </Button>
            )}
        </div>
    );
}

/**
 * 관리자 대시보드 지표 요약 — 운영 중 확인이 잦은 값을 모아 각 관리 화면으로 이어준다.
 * 건수는 Page.totalElements를 재사용한다(size=1로 본문을 가볍게)
 */
export function AdminStatSummary() {
    const openEvents = useAdminEvents({ page: 1, size: 1, status: 'OPEN' });
    const scheduledEvents = useAdminEvents({ page: 1, size: 1, status: 'SCHEDULED' });
    const abuseCases = useAbuseCases({ page: 1, size: 1 });
    const auditLogs = useAuditLogs({ page: 1, size: 1 });

    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
                label="진행 중 이벤트"
                value={openEvents.data?.totalElements}
                pending={openEvents.isPending}
                error={openEvents.isError}
                onRetry={() => void openEvents.refetch()}
                description="지금 응모를 받는 이벤트"
                to="/admin/events?status=OPEN"
            />
            <StatCard
                label="진행 예정 이벤트"
                value={scheduledEvents.data?.totalElements}
                pending={scheduledEvents.isPending}
                error={scheduledEvents.isError}
                onRetry={() => void scheduledEvents.refetch()}
                description="오픈을 기다리는 이벤트"
                to="/admin/events?status=SCHEDULED"
            />
            <StatCard
                label="어뷰징 차단 내역"
                value={abuseCases.data?.totalElements}
                pending={abuseCases.isPending}
                error={abuseCases.isError}
                onRetry={() => void abuseCases.refetch()}
                description="지급 전 차단된 요청"
                to="/admin/abuse-cases"
            />
            <StatCard
                label="감사 로그"
                value={auditLogs.data?.totalElements}
                pending={auditLogs.isPending}
                error={auditLogs.isError}
                onRetry={() => void auditLogs.refetch()}
                description="기록된 운영 액션 전체"
                to="/admin/audit"
            />
        </div>
    );
}
