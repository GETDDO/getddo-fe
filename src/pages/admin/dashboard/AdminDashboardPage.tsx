import { useState } from 'react';

import { Segmented } from '@shared/ui/segmented';
import { AdminStatSummary } from '@widgets/adminStatSummary';

import type { TrendPeriod } from './model/useTicketTrend';

import { TREND_PERIODS, useTicketTrend } from './model/useTicketTrend';
import { ActionQueuePanel } from './ui/ActionQueuePanel';
import { FailedNotificationJobsPanel } from './ui/FailedNotificationJobsPanel';
import { GradeDistributionPanel } from './ui/GradeDistributionPanel';
import { OpenEventsPanel } from './ui/OpenEventsPanel';
import { RecentAuditLogsPanel } from './ui/RecentAuditLogsPanel';
import { TicketTrendPanel } from './ui/TicketTrendPanel';

/**
 * 관리자 대시보드 — 위에 오늘 숫자, 가운데 추이 그래프와 지금 처리할 일, 그 아래 등급 분포·이벤트 응모 현황 표, 맨 아래 미리보기.
 * 기간 전환은 추이 그래프와 등급 분포에 함께 적용한다
 */
export function AdminDashboardPage() {
    const [period, setPeriod] = useState<TrendPeriod>('7');
    const days = Number(period);
    const { rows, grades, trend, gradeStatus } = useTicketTrend(days);

    return (
        <div className="flex flex-col gap-6 pb-10 md:pr-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-body-sm text-fg-secondary">
                    운영 중 확인이 잦은 지표를 모았습니다. 카드를 눌러 각 관리 화면으로 이동하세요.
                </p>
                <Segmented
                    label="그래프 기간"
                    value={period}
                    onValueChange={setPeriod}
                    options={TREND_PERIODS}
                />
            </div>
            <AdminStatSummary />
            <div className="grid gap-4 lg:grid-cols-3">
                <TicketTrendPanel
                    rows={rows}
                    isPending={trend.isPending}
                    isError={trend.isError}
                    onRetry={trend.refetch}
                    className="lg:col-span-2"
                />
                <ActionQueuePanel />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
                <GradeDistributionPanel
                    days={days}
                    grades={grades}
                    isPending={gradeStatus.isPending}
                    isError={gradeStatus.isError}
                    onRetry={gradeStatus.refetch}
                />
                <OpenEventsPanel className="lg:col-span-2" />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <FailedNotificationJobsPanel />
                <RecentAuditLogsPanel />
            </div>
        </div>
    );
}
