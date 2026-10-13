import { useState } from 'react';

import type { AdminNotification } from '@entities/adminNotification';

import {
    AdminNotificationTable,
    MOCK_DELIVERY_STATUS_LABEL,
    useAdminNotifications,
} from '@entities/adminNotification';
import { RetryDeliveryDialog } from '@features/retryAdminNotification';
import { kstDateStartUtcIso, kstNextDateStartUtcIso } from '@shared/lib/date';
import { ALL, orUndefined, PAGE_SIZE } from '@shared/lib/filterConstants';
import { Button } from '@shared/ui/button';
import { DateRangeFilter, OptionFilter, TextFilter } from '@shared/ui/filter-fields';
import { PagedResult } from '@shared/ui/paged-result';

const STATUS_OPTIONS = [
    { value: ALL, label: '전체 발송 상태' },
    ...Object.entries(MOCK_DELIVERY_STATUS_LABEL).map(([value, label]) => ({ value, label })),
];

const EMPTY = {
    userId: '',
    eventId: '',
    jobId: '',
    mockDeliveryStatus: ALL,
    from: '',
    to: '',
};

// AN04·AN05 — 개별 알림 모의 발송 이력과 발송 복구 접수. 기간은 생성 시각 기준 [from, to)
export function DeliveriesTab() {
    const [page, setPage] = useState(1);
    const [draft, setDraft] = useState(EMPTY);
    // 검색 버튼으로 확정한 값만 쿼리에 넘긴다 — 입력마다 요청하지 않는다
    const [applied, setApplied] = useState(EMPTY);
    const [retryTarget, setRetryTarget] = useState<AdminNotification | null>(null);
    const patch = (value: Partial<typeof EMPTY>) => setDraft((d) => ({ ...d, ...value }));

    const query = useAdminNotifications({
        page,
        size: PAGE_SIZE,
        userId: applied.userId || undefined,
        eventId: applied.eventId || undefined,
        jobId: applied.jobId || undefined,
        mockDeliveryStatus: orUndefined(applied.mockDeliveryStatus),
        from: applied.from ? kstDateStartUtcIso(applied.from) : undefined,
        to: applied.to ? kstNextDateStartUtcIso(applied.to) : undefined,
    });

    return (
        <div className="flex flex-col gap-6">
            <form
                className="flex flex-wrap items-center gap-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    setApplied({
                        ...draft,
                        userId: draft.userId.trim(),
                        eventId: draft.eventId.trim(),
                        jobId: draft.jobId.trim(),
                    });
                    setPage(1);
                }}
            >
                <OptionFilter
                    value={draft.mockDeliveryStatus}
                    onChange={(mockDeliveryStatus) => patch({ mockDeliveryStatus })}
                    options={STATUS_OPTIONS}
                    label="발송 상태 필터"
                    className="w-40"
                />
                <TextFilter
                    value={draft.userId}
                    onChange={(userId) => patch({ userId })}
                    placeholder="사용자 ID"
                    label="사용자 ID 필터"
                />
                <TextFilter
                    value={draft.eventId}
                    onChange={(eventId) => patch({ eventId })}
                    placeholder="이벤트 ID"
                    label="이벤트 ID 필터"
                />
                <TextFilter
                    value={draft.jobId}
                    onChange={(jobId) => patch({ jobId })}
                    placeholder="작업 ID"
                    label="작업 ID 필터"
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
                emptyText="해당하는 발송 이력이 없습니다."
                errorText="발송 이력을 불러오지 못했습니다."
            >
                {(rows) => <AdminNotificationTable notifications={rows} onRetry={setRetryTarget} />}
            </PagedResult>

            <RetryDeliveryDialog
                notification={retryTarget}
                onOpenChange={(open) => {
                    if (!open) setRetryTarget(null);
                }}
            />
        </div>
    );
}
