import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useEntryStatistics } from './queries';

function setup() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return { client, wrapper };
}

describe('useEntryStatistics', () => {
    it('E03 응답을 EntryStatistics로 파싱한다', async () => {
        const { wrapper } = setup();
        const { result } = renderHook(() => useEntryStatistics('evt-001'), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data?.eventId).toBe('evt-001');
        expect(result.current.data?.participantCount).toBeGreaterThan(0);
    });

    it('open 이벤트만 30초 폴링하고 그 외에는 폴링하지 않는다', async () => {
        const { client, wrapper } = setup();
        const open = renderHook(() => useEntryStatistics('evt-001', { isOpen: true }), { wrapper });
        const other = renderHook(() => useEntryStatistics('evt-002'), { wrapper });

        await waitFor(() => expect(open.result.current.isSuccess).toBe(true));
        await waitFor(() => expect(other.result.current.isSuccess).toBe(true));

        const intervalOf = (id: string) =>
            client.getQueryCache().find({ queryKey: ['entries', 'statistics', id] })?.observers[0]
                ?.options.refetchInterval;
        expect(intervalOf('evt-001')).toBe(30_000);
        expect(intervalOf('evt-002')).toBe(false);
    });

    it('enabled가 false면 요청하지 않는다', () => {
        const { wrapper } = setup();
        const { result } = renderHook(() => useEntryStatistics('evt-001', { enabled: false }), {
            wrapper,
        });
        expect(result.current.fetchStatus).toBe('idle');
    });
});
