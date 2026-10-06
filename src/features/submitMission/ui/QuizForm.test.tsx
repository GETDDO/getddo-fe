import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MissionDetail } from '@entities/mission';

import { apiClient } from '@shared/api/client';

import { QuizForm } from './QuizForm';

// 목업 시드 msn-quiz-1 — 정답은 O(opt-quiz-1-o)
const QUIZ_MISSION: MissionDetail = {
    id: 'msn-quiz-1',
    title: '5G 상식 OX 퀴즈',
    description: '퀴즈 설명',
    imageUrl: null,
    missionType: 'QUIZ',
    startsAt: '2026-10-01T00:00:00Z',
    endsAt: '2026-12-31T14:59:59Z',
    rewardTicketCount: 1,
    completed: false,
    serverTime: '2026-10-06T00:00:00Z',
    questions: [
        {
            id: 'q-quiz-1-1',
            questionType: 'OX',
            questionText: '5G는 LTE보다 데이터 전송 속도가 빠르다.',
            required: true,
            displayOrder: 1,
            options: [
                { id: 'opt-quiz-1-o', optionText: 'O', displayOrder: 1 },
                { id: 'opt-quiz-1-x', optionText: 'X', displayOrder: 2 },
            ],
        },
    ],
};

let userSeq = 0;

const renderForm = (onCompleted = vi.fn()) => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
        <QueryClientProvider client={queryClient}>
            <QuizForm mission={QUIZ_MISSION} onCompleted={onCompleted} />
        </QueryClientProvider>,
    );
    return onCompleted;
};

describe('QuizForm', () => {
    beforeEach(() => {
        // 목업은 사용자별 완료 상태를 들고 있다 — 테스트마다 다른 사용자로 격리한다
        apiClient.defaults.headers.common['X-User-ID'] = `quiz-form-${(userSeq += 1)}`;
    });

    it('오답이면 배너를 띄우고 고른 답을 유지한 채 재도전하게 한다', async () => {
        const user = userEvent.setup();
        const onCompleted = renderForm();

        await user.click(screen.getByRole('radio', { name: 'X' }));
        await user.click(screen.getByRole('button', { name: '정답 제출' }));

        expect(
            await screen.findByText('아쉽지만 오답이에요. 답을 고쳐서 다시 도전해 보세요.'),
        ).toBeInTheDocument();
        expect(onCompleted).not.toHaveBeenCalled();
        expect(screen.getByRole('radio', { name: 'X' })).toBeChecked();
    });

    it('답을 고치기 시작하면 오답 배너를 거둔다', async () => {
        const user = userEvent.setup();
        renderForm();

        await user.click(screen.getByRole('radio', { name: 'X' }));
        await user.click(screen.getByRole('button', { name: '정답 제출' }));
        await screen.findByText('아쉽지만 오답이에요. 답을 고쳐서 다시 도전해 보세요.');

        await user.click(screen.getByRole('radio', { name: 'O' }));
        await waitFor(() =>
            expect(
                screen.queryByText('아쉽지만 오답이에요. 답을 고쳐서 다시 도전해 보세요.'),
            ).not.toBeInTheDocument(),
        );
    });

    it('정답이면 완료 결과를 올린다', async () => {
        const user = userEvent.setup();
        const onCompleted = renderForm();

        await user.click(screen.getByRole('radio', { name: 'O' }));
        await user.click(screen.getByRole('button', { name: '정답 제출' }));

        await waitFor(() => expect(onCompleted).toHaveBeenCalledTimes(1));
        const [result, isNewSubmission] = onCompleted.mock.calls[0] as [
            { isCompleted: boolean },
            boolean,
        ];
        expect(result.isCompleted).toBe(true);
        expect(isNewSubmission).toBe(true);
    });
});
