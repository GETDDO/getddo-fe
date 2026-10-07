import { Link } from 'react-router-dom';

import { useAbuseCases } from '@entities/abuseCase';
import { useAuditLogs } from '@entities/audit';
import { useAdminEvents } from '@entities/event';
import { formatNumber } from '@shared/lib/format';
import { cn } from '@shared/lib/utils';

interface StatCardProps {
    label: string;
    /** 아직 안 오면 —, 조회 실패도 —로 둔다 (지표 카드는 요약이라 개별 실패를 크게 다루지 않는다) */
    value?: number;
    description: string;
    to: string;
}

function StatCard({ label, value, description, to }: StatCardProps) {
    return (
        <Link
            to={to}
            className={cn(
                'bg-surface-page border-border-default flex flex-col gap-1 rounded-2xl border p-5 transition-colors',
                'hover:border-fg-brand focus-visible:ring-border-focus focus-visible:ring-offset-surface-page focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
            )}
        >
            <span className="text-body-sm text-fg-tertiary">{label}</span>
            <strong className="text-title-1 text-fg-primary">
                {value == null ? '—' : `${formatNumber(value)}건`}
            </strong>
            <span className="text-caption text-fg-tertiary">{description}</span>
        </Link>
    );
}

/**
 * 관리자 대시보드 지표 요약 — 운영 중 확인이 잦은 값을 모아 각 관리 화면으로 이어준다.
 * 건수는 Page.totalElements를 재사용하고(size=1로 본문을 가볍게), 어뷰징은 목업이 전체를 돌려주므로 pending만 센다
 */
export function AdminStatSummary() {
    const openEvents = useAdminEvents({ page: 1, size: 1, status: 'OPEN' });
    const scheduledEvents = useAdminEvents({ page: 1, size: 1, status: 'SCHEDULED' });
    const abuseCases = useAbuseCases();
    const auditLogs = useAuditLogs({ page: 1, size: 1 });

    const pendingAbuseCount = abuseCases.data?.filter((c) => c.status === 'pending').length;

    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
                label="진행 중 이벤트"
                value={openEvents.data?.totalElements}
                description="지금 응모를 받는 이벤트"
                to="/admin/events"
            />
            <StatCard
                label="진행 예정 이벤트"
                value={scheduledEvents.data?.totalElements}
                description="오픈을 기다리는 이벤트"
                to="/admin/events"
            />
            <StatCard
                label="검토 대기 어뷰징"
                value={pendingAbuseCount}
                description="관리자 판단이 필요한 탐지"
                to="/admin/abuse-review"
            />
            <StatCard
                label="감사 로그"
                value={auditLogs.data?.totalElements}
                description="기록된 운영 액션 전체"
                to="/admin/audit"
            />
        </div>
    );
}
