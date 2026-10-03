import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@shared/api/client';

import { ticketBalanceSchema } from '../model/types';

export const TICKETS_KEY = ['tickets'] as const;

export function useTicketBalance() {
    return useQuery({
        queryKey: [...TICKETS_KEY, 'balance'],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>('/tickets/balance');
            return ticketBalanceSchema.parse(data);
        },
    });
}
