import { useQueries, useQuery } from '@tanstack/react-query';

import { apiClient } from '@shared/api/client';
import { envelopeSchema, pageSchema } from '@shared/api/envelopeSchema';
import { queryPresets } from '@shared/api/queryPresets';

import type { DrawRunStatus } from '../model/types';

import { isDrawRunInProgress } from '../model/runStatus';
import {
    drawCandidateSchema,
    drawRunDetailSchema,
    drawRunSchema,
    drawVerificationSchema,
} from '../model/types';

const drawRunPageSchema = pageSchema(drawRunSchema);
const drawCandidatePageSchema = pageSchema(drawCandidateSchema);
const drawVerificationPageSchema = pageSchema(drawVerificationSchema);

export const DRAWS_KEY = ['admin', 'draws'] as const;

// 추첨 엔드포인트 — AD01~AD04·AD08·AD09 (getddo-spec 05-api/drawing.md 초안, 검토 대기)
export const eventDrawsApiPath = (eventId: string) => `/admin/events/${eventId}/draws`;
export const drawApiPath = (drawId: string) => `/admin/draws/${drawId}`;
export const drawParticipantsApiPath = (drawId: string) => `${drawApiPath(drawId)}/participants`;
// AD04(검증 실행)와 AD08(검증 이력)은 같은 경로를 메서드로 나눈다
export const drawChecksApiPath = (drawId: string) => `${drawApiPath(drawId)}/checks`;
export const cancellationRedrawsApiPath = (cancellationId: string) =>
    `/admin/cancellations/${cancellationId}/redraws`;

export interface PageParams {
    page: number;
    size: number;
}

// 서버가 선정하는 동안만 realtime 프리셋 주기로 폴링하고, 끝나면 멈춘다
const POLL_MS = queryPresets.realtime.refetchInterval;

// AD01 — 이벤트의 실행 목록(Page). 진행 중인 실행이 하나라도 있으면 폴링한다
export function useEventDraws(eventId: string, params: PageParams) {
    return useQuery({
        ...queryPresets.realtime,
        refetchInterval: (query) =>
            query.state.data?.items.some((run) => isDrawRunInProgress(run.status))
                ? POLL_MS
                : false,
        queryKey: [...DRAWS_KEY, 'list', eventId, params],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(eventDrawsApiPath(eventId), { params });
            return envelopeSchema(drawRunPageSchema).parse(data).data;
        },
        enabled: Boolean(eventId),
    });
}

async function fetchDrawRun(drawId: string) {
    const { data } = await apiClient.get<unknown>(drawApiPath(drawId));
    return envelopeSchema(drawRunDetailSchema).parse(data).data;
}

const drawRunOptions = (drawId: string | null) => ({
    ...queryPresets.realtime,
    refetchInterval: (query: { state: { data?: { status: DrawRunStatus } } }) =>
        query.state.data && isDrawRunInProgress(query.state.data.status) ? POLL_MS : false,
    queryKey: [...DRAWS_KEY, 'detail', drawId],
    queryFn: () => fetchDrawRun(drawId!),
    enabled: Boolean(drawId),
});

// AD02 — 실행 상세
export function useDrawRun(drawId: string | null) {
    return useQuery(drawRunOptions(drawId));
}

// 여러 실행의 상세를 한 번에 — 재추첨이 취소한 원본 결과의 공개 이력을 확인할 때 쓴다
export function useDrawRuns(drawIds: string[]) {
    return useQueries({ queries: drawIds.map((id) => drawRunOptions(id)) });
}

// AD03 — 해당 실행이 실제 사용한 후보 명단. 실행 시점에 고정된 스냅샷이다
export function useDrawCandidates(drawId: string | null, params: PageParams) {
    return useQuery({
        ...queryPresets.standard,
        queryKey: [...DRAWS_KEY, 'participants', drawId, params],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(drawParticipantsApiPath(drawId!), {
                params,
            });
            return envelopeSchema(drawCandidatePageSchema).parse(data).data;
        },
        enabled: Boolean(drawId),
    });
}

// AD08 — 정합성 검증 이력. 검증 실행(AD04) 직후 무효화돼 새 이력이 바로 보인다
export function useDrawVerifications(drawId: string | null, params: PageParams) {
    return useQuery({
        ...queryPresets.standard,
        queryKey: [...DRAWS_KEY, 'checks', drawId, params],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(drawChecksApiPath(drawId!), { params });
            return envelopeSchema(drawVerificationPageSchema).parse(data).data;
        },
        enabled: Boolean(drawId),
    });
}
