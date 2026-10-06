import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { AdminEventStatus, EventType } from '@entities/event';

import {
    ADMIN_STATUS_META,
    AdminEventTable,
    EVENT_TYPE_LABEL,
    useAdminEvents,
} from '@entities/event';
import { kstInputToUtcIso } from '@shared/lib/date';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Pager } from '@shared/ui/pager';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: 'all' | AdminEventStatus; label: string }[] = [
    { value: 'all', label: '전체 상태' },
    ...Object.entries(ADMIN_STATUS_META).map(([value, meta]) => ({
        value: value as AdminEventStatus,
        label: meta.label,
    })),
];

const TYPE_OPTIONS: { value: 'all' | EventType; label: string }[] = [
    { value: 'all', label: '전체 유형' },
    ...(Object.entries(EVENT_TYPE_LABEL) as [EventType, string][]).map(([value, label]) => ({
        value,
        label,
    })),
];

// 종료일 입력(YYYY-MM-DD, KST)을 다음 날 00:00 UTC ISO로 변환해 [from, to) 구간의 상한을 만든다
const nextDay = (ymd: string) => {
    const d = new Date(`${ymd}T00:00:00+09:00`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString();
};

export function AdminEventsPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [keywordInput, setKeywordInput] = useState('');
    // 검색어는 엔터·버튼으로 확정된 값만 쿼리에 넘긴다 — 입력마다 요청하지 않는다
    const [keyword, setKeyword] = useState('');
    const [fromInput, setFromInput] = useState('');
    const [toInput, setToInput] = useState('');
    // 기간도 Select와 달리 즉시 적용되지 않고 검색 버튼으로 함께 적용된다 (응모 시작 시각 기준 [from, to))
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [status, setStatus] = useState<'all' | AdminEventStatus>('all');
    const [eventType, setEventType] = useState<'all' | EventType>('all');

    const { data, isPending, isError } = useAdminEvents({
        page,
        size: PAGE_SIZE,
        keyword: keyword || undefined,
        status: status === 'all' ? undefined : status,
        eventType: eventType === 'all' ? undefined : eventType,
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
                        setKeyword(keywordInput.trim());
                        setFrom(fromInput ? kstInputToUtcIso(`${fromInput}T00:00`) : '');
                        setTo(toInput ? nextDay(toInput) : '');
                        resetPage();
                    }}
                >
                    <Input
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        placeholder="이벤트 이름·설명 검색"
                        className="w-64"
                        aria-label="이벤트 검색"
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
                    <Button type="submit" variant="outline">
                        검색
                    </Button>
                </form>

                <Select
                    value={status}
                    onValueChange={(v) => {
                        setStatus(v as 'all' | AdminEventStatus);
                        resetPage();
                    }}
                >
                    <SelectTrigger className="w-40" aria-label="상태 필터">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={eventType}
                    onValueChange={(v) => {
                        setEventType(v as 'all' | EventType);
                        resetPage();
                    }}
                >
                    <SelectTrigger className="w-36" aria-label="유형 필터">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {TYPE_OPTIONS.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button className="ml-auto" onClick={() => void navigate('/admin/events/new')}>
                    새 이벤트 등록
                </Button>
            </div>

            {isPending && <p className="text-body-sm text-fg-tertiary">불러오는 중…</p>}
            {isError && (
                <p className="text-destructive text-body-sm">이벤트 목록을 불러오지 못했습니다.</p>
            )}
            {!isPending && !isError && data && data.items.length === 0 && (
                <p className="text-fg-tertiary text-body-sm py-6">해당하는 이벤트가 없습니다.</p>
            )}
            {data && data.items.length > 0 && (
                <>
                    <AdminEventTable
                        events={data.items}
                        onRowClick={(event) => void navigate(`/admin/events/${event.id}`)}
                    />
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
        </div>
    );
}
