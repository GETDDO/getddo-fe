import { ArrowDownRight, ArrowUpRight, ChevronRight, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAbuseCases } from '@entities/abuseCase';
import { useAdminEvents } from '@entities/event';
import { useAdminTicketGrantCounts, useAdminTicketHistoryCounts } from '@entities/ticket';
import { recentKstDays } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/format';
import { cn } from '@shared/lib/utils';
import { useVirtualClock } from '@shared/lib/virtualClock';
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
    /** 값 뒤 단위 — 이벤트·차단은 건, 응모권은 장 */
    unit?: string;
    /** 어제 같은 지표 — 있으면 설명 대신 어제보다 늘었는지·줄었는지 적는다 */
    previous?: number;
}

/** 어제와 비교 — 늘고 준 것이 좋고 나쁨을 뜻하지 않으므로 색 대신 화살표로만 구분한다 */
function Delta({ value, previous, unit }: { value: number; previous: number; unit: string }) {
    const diff = value - previous;
    const Icon = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;
    return (
        <span className="text-caption text-fg-tertiary flex items-center gap-1 tabular-nums">
            <span className="text-fg-primary flex items-center gap-0.5 font-semibold">
                <Icon aria-hidden className="size-3.5" />
                {diff === 0
                    ? '변화 없음'
                    : `${diff > 0 ? '+' : '−'}${formatNumber(Math.abs(diff))}${unit}`}
            </span>
            어제 대비
        </span>
    );
}

/** 숫자 카드 — 흰 카드에 이름·큰 숫자·어제 대비만. 색 막대 없이 숫자가 먼저 읽히고, 오른쪽 위 > 로 누를 수 있음을 알린다 */
function StatCard({
    label,
    value,
    pending = false,
    error,
    onRetry,
    description,
    to,
    unit = '건',
    previous,
}: StatCardProps) {
    return (
        <div
            className={cn(
                'group bg-surface-page border-border-default relative flex flex-col gap-1 rounded-2xl border p-5 transition-colors',
                // 1px 테두리 + 1px 링 — 크기를 바꾸지 않고 2px로 또렷하게
                'hover:border-fg-brand hover:ring-fg-brand hover:ring-1',
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
            {/* 누르면 관리 화면으로 간다는 표시 — 움직임 없이 올리면 색만 진해진다 */}
            <ChevronRight
                aria-hidden
                className="text-fg-tertiary group-hover:text-fg-primary absolute top-5 right-5 size-5"
            />
            <span className="text-body-sm text-fg-tertiary">{label}</span>
            <div className="text-title-1 text-fg-primary tabular-nums">
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
                    `${formatNumber(value)}${unit}`
                )}
            </div>
            {!pending && !error && value != null && previous != null ? (
                <Delta value={value} previous={previous} unit={unit} />
            ) : (
                <span className="text-caption text-fg-tertiary">{description}</span>
            )}
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
 * 건수는 Page.totalElements를 재사용한다(size=1로 본문을 가볍게). 오늘·어제는 가상 시계 기준 KST 날짜다
 */
export function AdminStatSummary() {
    const days = recentKstDays(useVirtualClock().now(), 2);
    const [yesterday, today] = days.map(({ from, to }) => ({ from, to }));
    // 카드를 누르면 오늘 조건이 걸린 채 목록이 열린다
    const todayYmd = days[1]?.ymd ?? '';

    const openEvents = useAdminEvents({ page: 1, size: 1, status: 'OPEN' });
    // 응모권 건수는 [어제, 오늘] 순서로 받는다
    const granted = useAdminTicketGrantCounts([{ ...yesterday }, { ...today }]);
    const used = useAdminTicketHistoryCounts([
        { ...yesterday, operationType: 'USE' },
        { ...today, operationType: 'USE' },
    ]);
    const abuseToday = useAbuseCases({ page: 1, size: 1, ...today });
    const abuseYesterday = useAbuseCases({ page: 1, size: 1, ...yesterday });

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
                label="오늘 지급한 응모권"
                value={granted.counts[1]}
                previous={granted.counts[0]}
                unit="장"
                pending={granted.isPending}
                error={granted.isError}
                onRetry={granted.refetch}
                description="출석·미션·게임 보상"
                to={`/admin/tickets?tab=grants&date=${todayYmd}`}
            />
            <StatCard
                label="오늘 응모에 쓴 응모권"
                value={used.counts[1]}
                previous={used.counts[0]}
                unit="장"
                pending={used.isPending}
                error={used.isError}
                onRetry={used.refetch}
                description="이벤트 응모로 차감된 응모권"
                to={`/admin/tickets?tab=histories&date=${todayYmd}&operationType=USE`}
            />
            <StatCard
                label="오늘 어뷰징 차단"
                value={abuseToday.data?.totalElements}
                previous={abuseYesterday.data?.totalElements}
                pending={abuseToday.isPending}
                error={abuseToday.isError}
                onRetry={() => void abuseToday.refetch()}
                description="지급 전 차단된 요청"
                to={`/admin/abuse-cases?date=${todayYmd}`}
            />
        </div>
    );
}
