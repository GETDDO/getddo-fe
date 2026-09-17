import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@shared/api/client';

import { eventSchema } from '../model/types';

const eventListSchema = z.array(eventSchema);

export function useEventList() {
    return useQuery({
        queryKey: ['events', 'list'],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>('/events');
            return eventListSchema.parse(data);
        },
    });
}

export function useEvent(eventId: string) {
    return useQuery({
        queryKey: ['events', 'detail', eventId],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(`/events/${eventId}`);
            return eventSchema.parse(data);
        },
    });
}
