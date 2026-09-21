import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@shared/api/client';

import { ticketBalanceSchema } from '../model/types';

export function useTicketBalance() {
    return useQuery({
        queryKey: ['tickets', 'balance'],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>('/tickets/balance');
            return ticketBalanceSchema.parse(data);
        },
    });
}
