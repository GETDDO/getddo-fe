import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@shared/api/client';

import { ticketBalanceSchema } from '../model/types';

export const TICKETS_KEY = ['tickets'] as const;

// 응모권 도메인의 엔드포인트 — 경로가 바뀌면 여기만 고친다
export const TICKETS_API_PATH = '/tickets';
export const TICKET_BALANCE_API_PATH = `${TICKETS_API_PATH}/balance`;
export const TICKET_HISTORY_API_PATH = `${TICKETS_API_PATH}/history`;

export function useTicketBalance() {
    return useQuery({
        queryKey: [...TICKETS_KEY, 'balance'],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(TICKET_BALANCE_API_PATH);
            return ticketBalanceSchema.parse(data);
        },
    });
}
