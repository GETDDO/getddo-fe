import { useState } from 'react';
import { Link } from 'react-router-dom';

import type { NotificationJob } from '@entities/adminNotification';

import {
    NOTIFICATION_TYPE_LABEL,
    NotificationJobDetailDrawer,
    useAdminNotificationJobs,
} from '@entities/adminNotification';
import { formatKst } from '@shared/lib/date';
import { cn } from '@shared/lib/utils';
import { badgeVariants } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { LoadingBlock, SkeletonRows } from '@shared/ui/skeleton';

const PREVIEW_SIZE = 5;
// 상태·분류 칩 — 사용자 화면과 같은 공용 배지 모양(둥근 알약, 높이 26·글자 12)에 색만 칩마다 입힌다
const CHIP = badgeVariants({ variant: null });

function FailedJobRow({ job, onClick }: { job: NotificationJob; onClick: () => void }) {
    return (
        <li className="border-border-default flex flex-col gap-1.5 rounded-xl border p-3">
            <div className="flex flex-wrap items-center gap-2">
                <span className={cn(CHIP, 'bg-surface-sunken text-fg-secondary')}>
                    {NOTIFICATION_TYPE_LABEL[job.notificationType]}
                </span>
                {job.generationStoppedBy && (
                    <span className={cn(CHIP, 'bg-surface-sunken text-fg-secondary')}>중지</span>
                )}
                {job.retryable && (
                    <span className={cn(CHIP, 'bg-status-revision text-status-revision-text')}>
                        복구 가능
                    </span>
                )}
                <Button
                    size="sm"
                    variant="ghost"
                    className="hover:bg-surface-pressed ml-auto"
                    aria-label={`${NOTIFICATION_TYPE_LABEL[job.notificationType]} 실패 알림 작업 상세`}
                    onClick={onClick}
                >
                    상세
                </Button>
            </div>
            <div className="text-caption text-fg-tertiary flex flex-wrap gap-x-3">
                <span>처리 {job.attemptCount}회</span>
                <span>다음 재시도 {job.nextAttemptAt ? formatKst(job.nextAttemptAt) : '없음'}</span>
            </div>
        </li>
    );
}

/**
 * 실패한 알림 생성 작업 미리보기 (AN01) — 전체 실패 건수는 totalElements로 정확히 표시하고
 * 복구는 목록 화면으로 이어준다. 미리보기 5건의 retryable 개수를 전체 복구 가능 수처럼 쓰지 않는다
 */
export function FailedNotificationJobsPanel() {
    const query = useAdminNotificationJobs({ page: 1, size: PREVIEW_SIZE, status: 'FAILED' });
    const [selected, setSelected] = useState<NotificationJob | null>(null);

    return (
        <section
            aria-labelledby="failed-jobs-title"
            className="bg-surface-page border-border-default flex flex-col gap-3 rounded-2xl border p-5"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                    <h2 id="failed-jobs-title" className="text-body-bold text-fg-primary">
                        실패한 알림 작업
                    </h2>
                    <p className="text-caption text-fg-tertiary">
                        생성에 실패한 알림 작업 {query.data?.totalElements ?? '-'}건
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        aria-label="목록 새로고침"
                        onClick={() => void query.refetch()}
                    >
                        새로고침
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                        <Link to="/admin/notifications?tab=jobs&status=FAILED">전체보기</Link>
                    </Button>
                </div>
            </div>

            {query.isPending && (
                <LoadingBlock>
                    <SkeletonRows rows={3} />
                </LoadingBlock>
            )}
            {query.isError && (
                <div className="flex items-center gap-3" role="alert">
                    <p className="text-semantic-error-strong text-body-sm">
                        실패 작업을 불러오지 못했습니다.
                    </p>
                    <Button size="sm" variant="secondary" onClick={() => void query.refetch()}>
                        다시 시도
                    </Button>
                </div>
            )}
            {query.data && query.data.items.length === 0 && (
                <p className="text-body-sm text-fg-tertiary py-4">실패한 알림 작업이 없습니다.</p>
            )}
            {query.data && query.data.items.length > 0 && (
                <ul className="flex flex-col gap-2">
                    {query.data.items.map((job) => (
                        <FailedJobRow key={job.id} job={job} onClick={() => setSelected(job)} />
                    ))}
                </ul>
            )}

            <NotificationJobDetailDrawer
                job={selected}
                open={selected !== null}
                onOpenChange={(open) => {
                    if (!open) setSelected(null);
                }}
            />
        </section>
    );
}
