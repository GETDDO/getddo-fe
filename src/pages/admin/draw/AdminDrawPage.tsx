import { useSearchParams } from 'react-router-dom';

import type { AdminEventStatus } from '@entities/event';

import { ADMIN_STATUS_META, useAdminEvents } from '@entities/event';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';

import { DrawEventPanel } from './ui/DrawEventPanel';
import { PolicyPendingNotice } from './ui/PolicyPendingNotice';

// 추첨이 확정됐거나 이후 단계(발표·재추첨)에 있는 이벤트만 관리 대상으로 고른다
const DRAW_STATUSES: ReadonlySet<AdminEventStatus> = new Set([
    'DRAW_CONFIRMED',
    'PUBLISHED',
    'REDRAWING',
]);
// 이벤트 선택 목록은 한 번에 담는다 — 목업 규모(관리 이벤트 33건 내외)를 덮는 AE01 최대 크기
const EVENT_PICKER_SIZE = 100;

export function AdminDrawPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const eventId = searchParams.get('eventId') ?? '';
    const { data, isPending, isError } = useAdminEvents({ page: 1, size: EVENT_PICKER_SIZE });

    const events = (data?.items ?? []).filter((e) => DRAW_STATUSES.has(e.status));
    // 상세 화면 등에서 URL로 들어온 이벤트는 목록 조건과 무관하게 열 수 있어야 한다
    const selectedInList = events.some((e) => e.id === eventId);

    return (
        <div className="flex max-w-280 flex-col gap-6 pb-10 md:pr-10">
            <PolicyPendingNotice />

            <div className="flex flex-wrap items-center gap-3">
                <label htmlFor="draw-event-select" className="text-body-bold text-fg-primary">
                    이벤트
                </label>
                <Select
                    value={eventId}
                    onValueChange={(next) => setSearchParams({ eventId: next })}
                    disabled={isPending || isError}
                >
                    <SelectTrigger id="draw-event-select" className="w-96 max-w-full">
                        <SelectValue placeholder="추첨을 관리할 이벤트를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                        {!selectedInList && eventId && (
                            <SelectItem value={eventId}>{eventId}</SelectItem>
                        )}
                        {events.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                                {e.title} · {ADMIN_STATUS_META[e.status].label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isPending && <p className="text-body-sm text-fg-tertiary">불러오는 중…</p>}
            {isError && (
                <p role="alert" className="text-destructive text-body-sm">
                    이벤트 목록을 불러오지 못했습니다.
                </p>
            )}
            {!isPending && !isError && events.length === 0 && !eventId && (
                <p className="text-fg-tertiary text-body-sm py-6">
                    추첨이 확정된 이벤트가 없습니다. 이벤트가 마감되고 추첨이 확정되면 이곳에서
                    관리할 수 있습니다.
                </p>
            )}
            {!eventId && events.length > 0 && (
                <p className="text-fg-tertiary text-body-sm py-6">
                    이벤트를 선택하면 추첨 실행·후보 명단·정합성 검증·변경 이력을 볼 수 있습니다.
                </p>
            )}

            {eventId && <DrawEventPanel key={eventId} eventId={eventId} />}
        </div>
    );
}
