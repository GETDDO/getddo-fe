import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import type { EventWriteRequest } from '@entities/event';

import {
    ADMIN_EVENTS_API_PATH,
    ADMIN_EVENTS_KEY,
    adminEventApiPath,
    adminEventSchema,
    eventOperationResultSchema,
} from '@entities/event';
import { apiClient } from '@shared/api/client';
import { envelopeSchema } from '@shared/api/envelopeSchema';

type EventAction = 'cancel';

interface EventActionInput {
    eventId: string;
    reason: string;
}

export function useCreateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (body: EventWriteRequest) => {
            const { data } = await apiClient.post<unknown>(ADMIN_EVENTS_API_PATH, body);
            return envelopeSchema(adminEventSchema).parse(data).data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ADMIN_EVENTS_KEY });
        },
    });
}

export function useUpdateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ eventId, body }: { eventId: string; body: EventWriteRequest }) => {
            const { data } = await apiClient.put<unknown>(adminEventApiPath(eventId), body);
            return envelopeSchema(adminEventSchema).parse(data).data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ADMIN_EVENTS_KEY });
        },
    });
}

export function useDeleteEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (eventId: string) => {
            const { data } = await apiClient.delete<unknown>(adminEventApiPath(eventId));
            return envelopeSchema(z.nullable(z.unknown())).parse(data).data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ADMIN_EVENTS_KEY });
        },
    });
}

// 취소는 POST .../cancel {reason} 요청에 EventOperationResult 응답을 돌려준다
export function useEventAction(action: EventAction) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ eventId, reason }: EventActionInput) => {
            const { data } = await apiClient.post<unknown>(
                `${adminEventApiPath(eventId)}/${action}`,
                { reason },
            );
            return envelopeSchema(eventOperationResultSchema).parse(data).data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ADMIN_EVENTS_KEY });
        },
    });
}
