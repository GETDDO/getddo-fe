import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@shared/api/client';
import { envelopeSchema } from '@shared/api/envelopeSchema';

import { myWalletsSchema } from '../model/types';

export const TICKETS_KEY = ['tickets'] as const;

// 응모권 도메인의 엔드포인트 — 경로가 바뀌면 여기만 고친다
export const TICKETS_API_PATH = '/tickets';
export const TICKET_WALLETS_API_PATH = `${TICKETS_API_PATH}/wallets/me`;
export const TICKET_LEDGER_API_PATH = `${TICKETS_API_PATH}/ledger/me`;

// T01 초안 — 지갑별 잔액·만료를 담는 MyWallets
export function useTicketWallets() {
    return useQuery({
        queryKey: [...TICKETS_KEY, 'wallets'],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(TICKET_WALLETS_API_PATH);
            return envelopeSchema(myWalletsSchema).parse(data).data;
        },
    });
}
