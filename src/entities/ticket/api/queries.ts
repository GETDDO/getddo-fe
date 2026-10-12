import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@shared/api/client';
import { envelopeSchema } from '@shared/api/envelopeSchema';

import { myTicketsSchema } from '../model/types';

export const TICKETS_KEY = ['tickets'] as const;

// 응모권 도메인의 엔드포인트 — 경로가 바뀌면 여기만 고친다
export const TICKETS_API_PATH = '/tickets';
export const MY_TICKETS_API_PATH = `${TICKETS_API_PATH}/me`;
export const TICKET_HISTORIES_API_PATH = `${TICKETS_API_PATH}/histories/me`;

// T01 — 보유 응모권 합계·등급별 장수·만료별 묶음을 담는 MyTickets
export function useMyTickets() {
    return useQuery({
        queryKey: [...TICKETS_KEY, 'me'],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(MY_TICKETS_API_PATH);
            return envelopeSchema(myTicketsSchema).parse(data).data;
        },
    });
}
