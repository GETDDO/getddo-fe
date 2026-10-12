import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@shared/api/client';
import { cursorSchema, envelopeSchema } from '@shared/api/envelopeSchema';

import { ticketHistorySchema } from '../model/history';
import { TICKET_HISTORIES_API_PATH, TICKETS_KEY } from './queries';

const ticketHistoriesSchema = envelopeSchema(cursorSchema(ticketHistorySchema));

// T02 — 커서 이력. 화면은 이력을 한 번에 그리므로 목업 한도(100)까지 넉넉히 요청하고 items만 꺼낸다
export function useTicketHistories() {
    return useQuery({
        queryKey: [...TICKETS_KEY, 'histories'],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(`${TICKET_HISTORIES_API_PATH}?size=100`);
            return ticketHistoriesSchema.parse(data).data.items;
        },
    });
}
