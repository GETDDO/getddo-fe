import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Event } from '@entities/event';

import { VirtualClockContext } from '@shared/lib/virtual-clock';

import { AnnounceCountdown } from './AnnounceCountdown';

const BASE_TIME = new Date('2026-09-30T05:00:00Z');

function makeEvent(overrides: Partial<Event> = {}): Event {
    return {
        id: 'evt-test',
        title: '테스트 래플',
        description: '테스트',
        bannerImageUrl: null,
        startsAt: '2026-09-30T04:00:00Z',
        endsAt: '2026-09-30T05:05:00Z',
        status: 'open',
        requiredTickets: 1,
        prizeName: '테스트 경품',
        winnerCount: 1,
        ...overrides,
    };
}

/** 오버라이드 없는 가상 시계 — 실제 시각(가짜 타이머가 조작한다)을 따라간다 */
function renderWithClock(event: Event) {
    return render(
        <VirtualClockContext.Provider
            value={{
                now: () => new Date(),
                setOverride: () => {},
                override: null,
                isOverridden: false,
            }}
        >
            <AnnounceCountdown event={event} />
        </VirtualClockContext.Provider>,
    );
}

describe('AnnounceCountdown', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(BASE_TIME);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('새로고침 없이 1초마다 남은 시간이 줄어든다', () => {
        // 발표까지 10초
        renderWithClock(makeEvent({ announceAt: '2026-09-30T05:00:10Z' }));

        expect(screen.getByRole('timer')).toHaveTextContent('00:00:10');

        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(screen.getByRole('timer')).toHaveTextContent('00:00:09');

        act(() => {
            vi.advanceTimersByTime(3000);
        });
        expect(screen.getByRole('timer')).toHaveTextContent('00:00:06');
    });

    it('발표 시각이 지나면 카운트다운 대신 안내 문구만 남는다', () => {
        renderWithClock(makeEvent({ announceAt: '2026-09-30T05:00:01Z' }));

        act(() => {
            vi.advanceTimersByTime(2000);
        });

        expect(screen.queryByRole('timer')).not.toBeInTheDocument();
        expect(screen.getByText('곧 당첨자를 발표합니다')).toBeInTheDocument();
    });

    it('발표 예정 시각이 없으면 아무것도 그리지 않는다', () => {
        const { container } = renderWithClock(makeEvent({ announceAt: null }));
        expect(container).toBeEmptyDOMElement();
    });
});
