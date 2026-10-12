import { useState } from 'react';

import { TICKET_GRADE_LABEL, TicketGrantTable, useAdminTicketGrants } from '@entities/ticket';
import { kstDateStartUtcIso, kstNextDateStartUtcIso } from '@shared/lib/date';
import { Button } from '@shared/ui/button';

import { ALL, orUndefined, PAGE_SIZE } from './filterConstants';
import { DateRangeFilter, OptionFilter, TextFilter } from './FilterFields';
import { PagedResult } from './PagedResult';

const SOURCE_OPTIONS = [
    { value: ALL, label: '전체 구분' },
    { value: 'ATTENDANCE', label: '출석' },
    { value: 'MISSION', label: '미션' },
    { value: 'GAME', label: '게임' },
];

const GRADE_OPTIONS = [
    { value: ALL, label: '전체 등급' },
    ...Object.entries(TICKET_GRADE_LABEL).map(([value, label]) => ({ value, label })),
];

const EMPTY = {
    keyword: '',
    userId: '',
    missionId: '',
    sourceType: ALL,
    grade: ALL,
    from: '',
    to: '',
};

// AO03 — 지급 응모권 수는 totalElements다. 등급별 수는 등급 필터를 바꿔 조회한다
export function GrantsTab() {
    const [page, setPage] = useState(1);
    const [draft, setDraft] = useState(EMPTY);
    // 검색 버튼으로 확정한 값만 쿼리에 넘긴다 — 입력마다 요청하지 않는다
    const [applied, setApplied] = useState(EMPTY);
    const patch = (value: Partial<typeof EMPTY>) => setDraft((d) => ({ ...d, ...value }));

    const query = useAdminTicketGrants({
        page,
        size: PAGE_SIZE,
        keyword: applied.keyword || undefined,
        userId: applied.userId || undefined,
        missionId: applied.missionId || undefined,
        sourceType: orUndefined(applied.sourceType),
        grade: orUndefined(applied.grade),
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
                        keyword: draft.keyword.trim(),
                        userId: draft.userId.trim(),
                        missionId: draft.missionId.trim(),
                    });
                    setPage(1);
                }}
            >
                <TextFilter
                    value={draft.keyword}
                    onChange={(keyword) => patch({ keyword })}
                    placeholder="사용자 이름 검색"
                    label="사용자 이름 검색"
                />
                <TextFilter
                    value={draft.userId}
                    onChange={(userId) => patch({ userId })}
                    placeholder="사용자 ID"
                    label="사용자 ID 필터"
                />
                <TextFilter
                    value={draft.missionId}
                    onChange={(missionId) => patch({ missionId })}
                    placeholder="미션 ID"
                    label="미션 ID 필터"
                />
                <OptionFilter
                    value={draft.sourceType}
                    onChange={(sourceType) => patch({ sourceType })}
                    options={SOURCE_OPTIONS}
                    label="구분 필터"
                />
                <OptionFilter
                    value={draft.grade}
                    onChange={(grade) => patch({ grade })}
                    options={GRADE_OPTIONS}
                    label="등급 필터"
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
                emptyText="해당하는 지급 이력이 없습니다."
                errorText="지급 이력을 불러오지 못했습니다."
            >
                {(rows) => <TicketGrantTable rows={rows} />}
            </PagedResult>
        </div>
    );
}
