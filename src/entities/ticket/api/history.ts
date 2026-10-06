import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@shared/api/client';

import { ticketHistorySchema } from '../model/history';
import { TICKET_HISTORY_API_PATH, TICKETS_KEY } from './queries';

const ticketHistoryListSchema = z.array(ticketHistorySchema);

export function useTicketHistory() {
    return useQuery({
        queryKey: [...TICKETS_KEY, 'history'],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(TICKET_HISTORY_API_PATH);
            return ticketHistoryListSchema.parse(data);
        },
    });
}
