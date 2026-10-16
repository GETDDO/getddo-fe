import type { MyResultStatus } from '@entities/drawResult';
import type { Entry } from '@entities/entry';
import type { Event } from '@entities/event';

import { useMyResults } from '@entities/drawResult';
import { useMyEntries } from '@entities/entry';
import { useEventList } from '@entities/event';

/** 내 응모 한 건을 화면에 그리는 데 필요한 값 — 응모(E06) + 이벤트(E01) + 본인 결과(E09) */
export interface MyEntryRow {
    entry: Entry;
    event: Event | undefined;
    /** 겟또타임(타임 래플)인가 — 상세 경로와 종류 이름이 갈린다 */
    isTimeRaffle: boolean;
    /** 본인 결과 — 접수되지 않은 응모(REJECTED)는 결과가 없고, 아직 못 받았으면 undefined */
    result: MyResultStatus | undefined;
    /** 상세 화면 경로 */
    to: string;
}

/**
 * 내 응모 내역을 이벤트 정보·본인 결과와 합쳐 최신 응모순으로 돌려준다.
 * 결과(E09)는 이벤트 단위라 접수된 응모가 있는 이벤트만 한 번씩 묻는다.
 * 당첨 여부는 서버가 공개한 본인 결과만 쓴다 — 화면에서 추측하지 않는다
 */
export function useMyEntryRows() {
    const entriesQuery = useMyEntries();
    const { data: events } = useEventList();
    const entries = entriesQuery.data ?? [];

    const acceptedEventIds = [
        ...new Set(entries.filter((e) => e.status === 'ACCEPTED').map((e) => e.eventId)),
    ];
    const resultQueries = useMyResults(acceptedEventIds);
    const resultByEvent = new Map<string, MyResultStatus>();
    resultQueries.forEach((query, index) => {
        const eventId = acceptedEventIds[index];
        if (eventId && query.data) resultByEvent.set(eventId, query.data.result);
    });

    const eventById = new Map((events ?? []).map((event) => [event.id, event]));
    const rows: MyEntryRow[] = entries
        .map((entry) => {
            const event = eventById.get(entry.eventId);
            const isTimeRaffle = event?.isTimeRaffle === true;
            return {
                entry,
                event,
                isTimeRaffle,
                result: entry.status === 'ACCEPTED' ? resultByEvent.get(entry.eventId) : undefined,
                to: `${isTimeRaffle ? '/time-raffle' : '/events'}/${entry.eventId}`,
            };
        })
        // 같은 초에 소수 초가 있는 값과 없는 값이 섞일 수 있어 문자열이 아닌 시각으로 비교한다
        .sort(
            (a, b) =>
                new Date(b.entry.requestedAt).getTime() - new Date(a.entry.requestedAt).getTime(),
        );

    return {
        rows,
        isPending: entriesQuery.isPending,
        isError: entriesQuery.isError,
        // 일부 이벤트의 본인 결과(E09)만 실패하면 그 줄은 결과 없이 남고 결과별 개수에서 빠진다 — 쓰는 쪽이 안내를 띄운다
        isResultError: resultQueries.some((query) => query.isError),
    };
}

/**
 * 당첨 줄 중 가장 최근 마감 시각 — 계약에 발표 시각이 없어(ADR-022) 마감 시각을 '최근 당첨' 근사로 쓴다.
 * 이벤트 정보가 없으면 응모 시각으로 대신한다
 */
export function latestWonAt(rows: readonly MyEntryRow[]): string | undefined {
    return rows
        .filter((row) => row.result === 'WON')
        .map((row) => row.event?.endsAt ?? row.entry.requestedAt)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}
