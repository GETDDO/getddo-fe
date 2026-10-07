import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@shared/api/client';
import { cursorSchema, envelopeSchema } from '@shared/api/envelopeSchema';

import { ticketHistorySchema } from '../model/history';
import { TICKET_LEDGER_API_PATH, TICKETS_KEY } from './queries';

const ticketLedgerSchema = envelopeSchema(cursorSchema(ticketHistorySchema));

// T02 초안 — 커서 원장. 화면은 이력을 한 번에 그리므로 목업 한도(100)까지 넉넉히 요청하고 items만 꺼낸다
export function useTicketHistory() {
    return useQuery({
        queryKey: [...TICKETS_KEY, 'ledger'],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(`${TICKET_LEDGER_API_PATH}?size=100`);
            return ticketLedgerSchema.parse(data).data.items;
        },
    });
}
