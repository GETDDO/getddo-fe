import { useState } from 'react';

import type { NotificationJob } from '@entities/adminNotification';

import {
    NOTIFICATION_JOB_STATUS_LABEL,
    NOTIFICATION_TYPE_LABEL,
    NotificationJobDetailDrawer,
    NotificationJobTable,
    useAdminNotificationJobs,
} from '@entities/adminNotification';
import { RetryJobDialog } from '@features/retryAdminNotification';
import { kstDateStartUtcIso, kstNextDateStartUtcIso } from '@shared/lib/date';
import { Button } from '@shared/ui/button';

import { ALL, orUndefined, PAGE_SIZE } from './filterConstants';
import { DateRangeFilter, OptionFilter, TextFilter } from './FilterFields';
import { PagedResult } from './PagedResult';

const STATUS_OPTIONS = [
    { value: ALL, label: '전체 상태' },
    ...Object.entries(NOTIFICATION_JOB_STATUS_LABEL).map(([value, label]) => ({ value, label })),
];

const TYPE_OPTIONS = [
    { value: ALL, label: '전체 유형' },
    ...Object.entries(NOTIFICATION_TYPE_LABEL).map(([value, label]) => ({ value, label })),
];

const EMPTY = {
    status: ALL,
    notificationType: ALL,
    eventId: '',
    from: '',
    to: '',
};

// AN01~AN03 — 알림 생성 작업 목록·상세·복구 접수. 기간은 생성 시각(createdAt) 기준 [from, to)
export function JobsTab() {
    const [page, setPage] = useState(1);
    const [draft, setDraft] = useState(EMPTY);
    // 검색 버튼으로 확정한 값만 쿼리에 넘긴다 — 입력마다 요청하지 않는다
    const [applied, setApplied] = useState(EMPTY);
    const [selectedJob, setSelectedJob] = useState<NotificationJob | null>(null);
    const [retryJob, setRetryJob] = useState<NotificationJob | null>(null);
    const patch = (value: Partial<typeof EMPTY>) => setDraft((d) => ({ ...d, ...value }));

    const query = useAdminNotificationJobs({
        page,
        size: PAGE_SIZE,
        status: orUndefined(applied.status),
        notificationType: orUndefined(applied.notificationType),
        eventId: applied.eventId || undefined,
        from: applied.from ? kstDateStartUtcIso(applied.from) : undefined,
        to: applied.to ? kstNextDateStartUtcIso(applied.to) : undefined,
    });

    return (
        <div className="flex flex-col gap-6">
            <form
                className="flex flex-wrap items-center gap-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    setApplied({ ...draft, eventId: draft.eventId.trim() });
                    setPage(1);
                }}
            >
                <OptionFilter
                    value={draft.status}
                    onChange={(status) => patch({ status })}
                    options={STATUS_OPTIONS}
                    label="상태 필터"
                />
                <OptionFilter
                    value={draft.notificationType}
                    onChange={(notificationType) => patch({ notificationType })}
                    options={TYPE_OPTIONS}
                    label="유형 필터"
                    className="w-40"
                />
                <TextFilter
                    value={draft.eventId}
                    onChange={(eventId) => patch({ eventId })}
                    placeholder="이벤트 ID"
                    label="이벤트 ID 필터"
                />
                <DateRangeFilter
                    from={draft.from}
                    to={draft.to}
                    onFromChange={(from) => patch({ from })}
                    onToChange={(to) => patch({ to })}
                />
                <Button type="submit" variant="secondary">
                    검색
                </Button>
            </form>

            <PagedResult
                data={query.data}
                isPending={query.isPending}
                isError={query.isError}
                page={page}
                onPageChange={setPage}
                emptyText="해당하는 알림 작업이 없습니다."
                errorText="알림 작업 목록을 불러오지 못했습니다."
            >
                {(rows) => <NotificationJobTable jobs={rows} onRowClick={setSelectedJob} />}
            </PagedResult>

            <NotificationJobDetailDrawer
                job={selectedJob}
                open={selectedJob !== null}
                onOpenChange={(open) => {
                    if (!open) setSelectedJob(null);
                }}
                action={(job) => (
                    <Button
                        variant="secondary"
                        className="mt-2"
                        disabled={!job.retryable}
                        title={job.retryable ? undefined : '복구할 수 없는 상태입니다'}
                        onClick={() => setRetryJob(job)}
                    >
                        생성 복구 재시도
                    </Button>
                )}
            />

            <RetryJobDialog
                job={retryJob}
                onOpenChange={(open) => {
                    if (!open) setRetryJob(null);
                }}
            />
        </div>
    );
}
