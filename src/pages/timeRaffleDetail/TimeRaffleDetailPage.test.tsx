import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { apiClient } from '@shared/api/client';
import { VirtualClockContext } from '@shared/model/virtualClock';
import { createIdempotencyKey, IDEMPOTENCY_HEADER } from '@shared/utils/idempotencyKey';

import { TimeRaffleDetailPage } from './TimeRaffleDetailPage';

// 진행 중 이벤트 — evt-011은 미사용, evt-003은 브론즈 1장 미적용, evt-014는 vip 제한이다
const FREE_EVENT_ID = 'evt-011';
const BRONZE_ONLY_EVENT_ID = 'evt-003';
const VIP_EVENT_ID = 'evt-014';

function renderPage(eventId: string) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
        <QueryClientProvider client={client}>
            <VirtualClockContext.Provider
                value={{
                    now: () => new Date(),
                    setOverride: () => {},
                    override: null,
                    isOverridden: false,
                }}
            >
                <MemoryRouter initialEntries={[`/time-raffle/${eventId}`]}>
                    <Routes>
                        <Route path="/time-raffle/:id" element={<TimeRaffleDetailPage />} />
                    </Routes>
                </MemoryRouter>
            </VirtualClockContext.Provider>
        </QueryClientProvider>,
    );
    return { client };
}

// 화면의 모든 쿼리가 가라앉을 때까지 — E07 도착 후 상태를 단정하려면 기다려야 한다
async function settle(client: QueryClient) {
    await waitFor(() => expect(client.isFetching()).toBe(0));
}

/** 관리자 목업으로 진행 중 이벤트를 만든다 — 사용자의 브론즈를 소진할 상한 없는 이벤트용 */
async function createOpenWeightedEvent() {
    const res = await apiClient.post('/v1/admin/events', {
        title: '브론즈 소진용 이벤트',
        description: '테스트용 이벤트입니다',
        imageKey: null,
        eventType: 'TICKET',
        weightingEnabled: true,
        maxTicketsPerUser: null,
        membershipRule: 'excellent',
        startsAt: '2026-01-01T00:00:00Z',
        endsAt: '2026-12-31T00:00:00Z',
        prizes: [
            { rank: 1, name: '테스트 경품', winnerCount: 1, description: null, imageKey: null },
        ],
    });
    return (res.data as { data: { id: string } }).data.id;
}

describe('TimeRaffleDetailPage의 E07 사유별 버튼', () => {
    it('멤버십이 미달이면 버튼이 "응모할 수 없어요"로 잠긴다', async () => {
        const { client } = renderPage(VIP_EVENT_ID);

        // E07 도착 전에는 로컬 근사로 열려 있다가, 판정이 오면 잠긴다
        await settle(client);
        const button = screen.getByRole('button', { name: '응모할 수 없어요' });
        expect(button).toBeDisabled();
    });

    it('이미 응모한 이벤트는 "응모 완료"로 잠긴다', async () => {
        await apiClient.post(
            `/v1/events/${FREE_EVENT_ID}/entries`,
            { tickets: {} },
            { headers: { [IDEMPOTENCY_HEADER]: createIdempotencyKey() } },
        );

        const { client } = renderPage(FREE_EVENT_ID);
        await settle(client);

        const button = screen.getByRole('button', { name: '응모 완료' });
        expect(button).toBeDisabled();
    });

    it('브론즈가 모자라도 버튼은 열려 있고 누르면 브론즈 필요 안내가 뜬다', async () => {
        // 익명 사용자의 브론즈 7장을 상한 없는 이벤트로 전부 소진한다
        const drainId = await createOpenWeightedEvent();
        await apiClient.post(
            `/v1/events/${drainId}/entries`,
            { tickets: { BRONZE: 7 } },
            { headers: { [IDEMPOTENCY_HEADER]: createIdempotencyKey() } },
        );

        const { client } = renderPage(BRONZE_ONLY_EVENT_ID);
        await settle(client);

        // E07이 BRONZE_REQUIRED를 돌려줘도 '응모 완료'가 아니라 열려 있어야 한다
        const button = screen.getByRole('button', { name: '응모하기' });
        expect(button).toBeEnabled();

        const user = userEvent.setup();
        await user.click(button);
        expect(await screen.findByText('브론즈 응모권이 필요해요')).toBeInTheDocument();
    });
});
