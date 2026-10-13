import { useState } from 'react';

import {
    AdminTicketHistoryTable,
    TICKET_OPERATION_LABEL,
    useAdminTicketHistories,
} from '@entities/ticket';
import { kstDateStartUtcIso, kstNextDateStartUtcIso } from '@shared/lib/date';
import { ALL, orUndefined, PAGE_SIZE } from '@shared/lib/filterConstants';
import { Button } from '@shared/ui/button';
import { DateRangeFilter, OptionFilter, TextFilter } from '@shared/ui/filter-fields';
import { PagedResult } from '@shared/ui/paged-result';

const OPERATION_OPTIONS = [
    { value: ALL, label: '전체 처리' },
    ...Object.entries(TICKET_OPERATION_LABEL).map(([value, label]) => ({ value, label })),
];

const EMPTY = { userId: '', eventId: '', missionId: '', operationType: ALL, from: '', to: '' };

// AO05 — 전체 이력
export function HistoriesTab() {
    const [page, setPage] = useState(1);
    const [draft, setDraft] = useState(EMPTY);
    const [applied, setApplied] = useState(EMPTY);
    const patch = (value: Partial<typeof EMPTY>) => setDraft((d) => ({ ...d, ...value }));

    const query = useAdminTicketHistories({
        page,
        size: PAGE_SIZE,
        userId: applied.userId || undefined,
        eventId: applied.eventId || undefined,
        missionId: applied.missionId || undefined,
        operationType: orUndefined(applied.operationType),
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
                        missionId: draft.missionId.trim(),
                    });
                    setPage(1);
                }}
            >
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
                    value={draft.missionId}
                    onChange={(missionId) => patch({ missionId })}
                    placeholder="미션 ID"
                    label="미션 ID 필터"
                />
                <OptionFilter
                    value={draft.operationType}
                    onChange={(operationType) => patch({ operationType })}
                    options={OPERATION_OPTIONS}
                    label="처리 유형 필터"
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
                emptyText="해당하는 이력이 없습니다."
                errorText="이력을 불러오지 못했습니다."
            >
                {(rows) => <AdminTicketHistoryTable rows={rows} />}
            </PagedResult>
        </div>
    );
}
