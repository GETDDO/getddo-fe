import { useState } from 'react';

import type { AuditLogSummary } from '@entities/audit';

import {
    AUDIT_ACTION_LABEL,
    AUDIT_TARGET_TYPE_LABEL,
    AuditLogDetailDrawer,
    AuditLogTable,
    useAuditLogs,
} from '@entities/audit';
import { kstInputToUtcIso } from '@shared/lib/date';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Pager } from '@shared/ui/pager';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';

const PAGE_SIZE = 20;

const ACTION_OPTIONS = [
    { value: 'all', label: '전체 작업' },
    ...Object.entries(AUDIT_ACTION_LABEL).map(([value, label]) => ({ value, label })),
];

const TARGET_TYPE_OPTIONS = [
    { value: 'all', label: '전체 대상' },
    ...Object.entries(AUDIT_TARGET_TYPE_LABEL).map(([value, label]) => ({ value, label })),
];

// 종료일 입력(YYYY-MM-DD, KST)을 다음 날 00:00 UTC ISO로 변환해 [from, to) 구간의 상한을 만든다
const nextDay = (ymd: string) => {
    const d = new Date(`${ymd}T00:00:00+09:00`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString();
};

export function AdminAuditPage() {
    const [page, setPage] = useState(1);
    const [actorIdInput, setActorIdInput] = useState('');
    // 검색어는 검색 버튼으로 확정된 값만 쿼리에 넘긴다 — 입력마다 요청하지 않는다
    const [actorId, setActorId] = useState('');
    const [fromInput, setFromInput] = useState('');
    const [toInput, setToInput] = useState('');
    // 기간도 Select와 달리 즉시 적용되지 않고 검색 버튼으로 함께 적용된다 ([from, to), 처리 시각 기준)
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [action, setAction] = useState('all');
    const [targetType, setTargetType] = useState('all');
    const [selected, setSelected] = useState<AuditLogSummary | null>(null);

    const { data, isPending, isError } = useAuditLogs({
        page,
        size: PAGE_SIZE,
        actorId: actorId || undefined,
        action: action === 'all' ? undefined : action,
        targetType: targetType === 'all' ? undefined : targetType,
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
                        setActorId(actorIdInput.trim());
                        setFrom(fromInput ? kstInputToUtcIso(`${fromInput}T00:00`) : '');
                        setTo(toInput ? nextDay(toInput) : '');
                        resetPage();
                    }}
                >
                    <Input
                        value={actorIdInput}
                        onChange={(e) => setActorIdInput(e.target.value)}
                        placeholder="처리자 ID 검색"
                        className="w-64"
                        aria-label="처리자 검색"
                    />
                    <Input
                        type="date"
                        value={fromInput}
                        onChange={(e) => setFromInput(e.target.value)}
                        className="w-40"
                        aria-label="시작일 필터"
                    />
                    <span className="text-fg-tertiary self-center">~</span>
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
                    value={action}
                    onValueChange={(v) => {
                        setAction(v);
                        resetPage();
                    }}
                >
                    <SelectTrigger className="w-40" aria-label="작업 필터">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {ACTION_OPTIONS.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={targetType}
                    onValueChange={(v) => {
                        setTargetType(v);
                        resetPage();
                    }}
                >
                    <SelectTrigger className="w-36" aria-label="대상 유형 필터">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {TARGET_TYPE_OPTIONS.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isPending && <p className="text-body-sm text-fg-tertiary">불러오는 중…</p>}
            {isError && (
                <p className="text-destructive text-body-sm">감사 로그를 불러오지 못했습니다.</p>
            )}
            {!isPending && !isError && data && data.items.length === 0 && (
                <p className="text-fg-tertiary text-body-sm py-6">해당하는 감사 로그가 없습니다.</p>
            )}
            {data && data.items.length > 0 && (
                <>
                    <AuditLogTable logs={data.items} onRowClick={setSelected} />
                    <div className="flex items-center justify-between">
                        <span className="text-body-sm text-fg-tertiary">
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
                </>
            )}

            <AuditLogDetailDrawer
                summary={selected}
                open={selected !== null}
                onOpenChange={(open) => {
                    if (!open) setSelected(null);
                }}
            />
        </div>
    );
}
