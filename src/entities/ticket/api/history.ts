import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@shared/api/client';
import { cursorSchema, envelopeSchema } from '@shared/api/envelopeSchema';

import type { TicketHistory } from '../model/history';

import { ticketHistorySchema } from '../model/history';
import { TICKET_HISTORIES_API_PATH, TICKETS_KEY } from './queries';

const ticketHistoriesSchema = envelopeSchema(cursorSchema(ticketHistorySchema));

// T02 — 커서 이력. 화면은 이력을 한 번에 그리므로 nextCursor가 없을 때까지 전부 모아 items를 반환한다
export function useTicketHistories() {
    return useQuery({
        queryKey: [...TICKETS_KEY, 'histories'],
        queryFn: async () => {
            const items: TicketHistory[] = [];
            let cursor: string | null = null;
            do {
                const params = new URLSearchParams({ size: '100' });
                if (cursor) params.set('cursor', cursor);
                const { data } = await apiClient.get<unknown>(
                    `${TICKET_HISTORIES_API_PATH}?${params.toString()}`,
                );
                const page = ticketHistoriesSchema.parse(data).data;
                items.push(...page.items);
                cursor = page.nextCursor ?? null;
            } while (cursor);
            return items;
        },
    });
}
