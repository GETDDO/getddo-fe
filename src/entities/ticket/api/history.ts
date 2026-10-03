import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@shared/api/client';

import { ticketHistorySchema } from '../model/history';
import { TICKETS_KEY } from './queries';

const ticketHistoryListSchema = z.array(ticketHistorySchema);

export function useTicketHistory() {
    return useQuery({
        queryKey: [...TICKETS_KEY, 'history'],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>('/tickets/history');
            return ticketHistoryListSchema.parse(data);
        },
    });
}
