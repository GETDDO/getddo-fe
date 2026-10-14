import { useState } from 'react';

import type { AbuseCase } from '@entities/abuseCase';

import { AbuseCaseDetailDrawer, AbuseCaseTable, useAbuseCases } from '@entities/abuseCase';
import { kstDateStartUtcIso, kstNextDateStartUtcIso } from '@shared/lib/date';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Pager } from '@shared/ui/pager';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { LoadingBlock, TableSkeleton } from '@shared/ui/skeleton';

const PAGE_SIZE = 20;

// spec AR01의 sourceType 제안 값 — ENTRY는 이벤트 응모, 나머지는 응모권 지급 경로다
const SOURCE_TYPE_OPTIONS = [
    { value: 'all', label: '전체 구분' },
    { value: 'ENTRY', label: '이벤트 응모' },
    { value: 'ATTENDANCE', label: '출석 지급' },
    { value: 'MISSION', label: '미션 지급' },
    { value: 'GAME', label: '게임 지급' },
];

export function AdminAbuseCasesPage() {
    const [page, setPage] = useState(1);
    const [userIdInput, setUserIdInput] = useState('');
    // 검색어는 검색 버튼으로 확정된 값만 쿼리에 넘긴다 — 입력마다 요청하지 않는다
    const [userId, setUserId] = useState('');
    const [fromInput, setFromInput] = useState('');
    const [toInput, setToInput] = useState('');
    // 기간도 Select와 달리 즉시 적용되지 않고 검색 버튼으로 함께 적용된다 ([from, to), 발생 시각 기준)
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [sourceType, setSourceType] = useState('all');
    const [selected, setSelected] = useState<AbuseCase | null>(null);

    const { data, isPending, isError } = useAbuseCases({
        page,
        size: PAGE_SIZE,
        userId: userId || undefined,
        sourceType: sourceType === 'all' ? undefined : sourceType,
        from: from || undefined,
        to: to || undefined,
    });

    const totalPages = data ? Math.max(1, Math.ceil(data.totalElements / data.size)) : 0;
    const resetPage = () => setPage(1);

    return (
        <div className="flex max-w-280 flex-col gap-6 pr-10 pb-10">
            <div className="flex flex-wrap items-center gap-3">
                <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        setUserId(userIdInput.trim());
                        setFrom(fromInput ? kstDateStartUtcIso(fromInput) : '');
                        setTo(toInput ? kstNextDateStartUtcIso(toInput) : '');
                        resetPage();
                    }}
                >
                    <Input
                        value={userIdInput}
                        onChange={(e) => setUserIdInput(e.target.value)}
                        placeholder="사용자 ID 검색"
                        className="w-64"
                        aria-label="사용자 검색"
                    />
                    <Input
                        type="date"
                        value={fromInput}
                        onChange={(e) => setFromInput(e.target.value)}
                        className="w-40"
                        aria-label="시작일 필터"
                    />
                    <span className="text-fg-secondary self-center">~</span>
                    <Input
                        type="date"
                        value={toInput}
                        onChange={(e) => setToInput(e.target.value)}
                        className="w-40"
                        aria-label="종료일 필터"
                    />
                    <Button type="submit" variant="secondary">
                        검색
                    </Button>
                </form>

                <Select
                    value={sourceType}
                    onValueChange={(v) => {
                        setSourceType(v);
                        resetPage();
                    }}
                >
                    <SelectTrigger className="w-36" aria-label="구분 필터">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {SOURCE_TYPE_OPTIONS.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isPending && (
                <LoadingBlock>
                    <TableSkeleton />
                </LoadingBlock>
            )}
            {isError && (
                <p className="text-semantic-error-strong text-body-sm">
                    차단 내역을 불러오지 못했습니다.
                </p>
            )}
            {!isPending && !isError && data && data.items.length === 0 && (
                <p className="text-fg-secondary text-body-sm py-6">
                    해당하는 차단 내역이 없습니다.
                </p>
            )}
            {data && data.items.length > 0 && (
                <AbuseCaseTable cases={data.items} onRowClick={setSelected} />
            )}
            {data && data.totalElements > 0 && (
                <div className="flex items-center justify-between">
                    <span className="text-body-sm text-fg-secondary">
                        총 {data.totalElements}건
                    </span>
                    <Pager
                        current={page - 1}
                        total={totalPages}
                        onPrev={() => setPage((p) => p - 1)}
                        onNext={() => setPage((p) => p + 1)}
                        prevDisabled={page <= 1}
                        nextDisabled={page >= totalPages}
                    />
                </div>
            )}

            <AbuseCaseDetailDrawer
                abuseCase={selected}
                open={selected !== null}
                onOpenChange={(open) => {
                    if (!open) setSelected(null);
                }}
            />
        </div>
    );
}
