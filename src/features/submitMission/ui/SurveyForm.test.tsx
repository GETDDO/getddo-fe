import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MissionDetail } from '@entities/mission';

import { apiClient } from '@shared/api/client';

import { SurveyForm } from './SurveyForm';

// 목업 시드와 같은 문항 id를 써야 MSW 핸들러의 문항 검증을 통과한다
const SURVEY_MISSION: MissionDetail = {
    id: 'msn-survey-1',
    title: '서비스 이용 경험 설문',
    description: '설문 설명',
    imageUrl: null,
    missionType: 'SURVEY',
    startsAt: '2026-10-01T00:00:00Z',
    endsAt: '2026-12-31T14:59:59Z',
    rewardTicketCount: 1,
    completed: false,
    serverTime: '2026-10-06T00:00:00Z',
    questions: [
        {
            id: 'q-survey-1-1',
            questionType: 'SINGLE_CHOICE',
            questionText: '이벤트 결과 알림을 받고 싶은 채널은 무엇인가요?',
            required: true,
            displayOrder: 1,
            options: [
                { id: 'opt-survey-1-1', optionText: '앱 푸시', displayOrder: 1 },
                { id: 'opt-survey-1-2', optionText: '문자 메시지', displayOrder: 2 },
                { id: 'opt-survey-1-3', optionText: '받지 않는다', displayOrder: 3 },
            ],
        },
        {
            id: 'q-survey-1-2',
            questionType: 'FREE_TEXT',
            questionText: '서비스에서 개선을 바라는 점이 있다면 자유롭게 적어주세요.',
            required: false,
            displayOrder: 2,
            options: [],
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
            <SurveyForm mission={SURVEY_MISSION} onCompleted={onCompleted} />
        </QueryClientProvider>,
    );
    return onCompleted;
};

describe('SurveyForm', () => {
    beforeEach(() => {
        // 목업은 사용자별 완료 상태를 들고 있다 — 테스트마다 다른 사용자로 격리한다
        apiClient.defaults.headers.common['X-User-ID'] = `survey-form-${(userSeq += 1)}`;
    });

    it('필수 문항을 비우고 제출하면 확인 모달 없이 오류를 표시한다', async () => {
        const user = userEvent.setup();
        const onCompleted = renderForm();

        await user.click(screen.getByRole('button', { name: '제출하기' }));

        expect(await screen.findByText('필수 문항입니다. 답변해 주세요.')).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(onCompleted).not.toHaveBeenCalled();
    });

    it('필수 문항을 채우면 확인 모달을 거쳐 완료 결과를 올린다', async () => {
        const user = userEvent.setup();
        const onCompleted = renderForm();

        await user.click(screen.getByRole('radio', { name: '앱 푸시' }));
        await user.click(screen.getByRole('button', { name: '제출하기' }));

        const dialog = await screen.findByRole('dialog');
        expect(dialog).toHaveTextContent('제출 후에는 답변을 수정할 수 없어요.');
        await user.click(within(dialog).getByRole('button', { name: '제출하기' }));

        await waitFor(() => expect(onCompleted).toHaveBeenCalledTimes(1));
        const [result, isNewSubmission] = onCompleted.mock.calls[0] as [
            { isCompleted: boolean },
            boolean,
        ];
        expect(result.isCompleted).toBe(true);
        expect(isNewSubmission).toBe(true);
    });

    it('확인 모달에서 취소하면 제출하지 않는다', async () => {
        const user = userEvent.setup();
        const onCompleted = renderForm();

        await user.click(screen.getByRole('radio', { name: '앱 푸시' }));
        await user.click(screen.getByRole('button', { name: '제출하기' }));

        const dialog = await screen.findByRole('dialog');
        await user.click(within(dialog).getByRole('button', { name: '취소' }));

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(onCompleted).not.toHaveBeenCalled();
        // 취소해도 답변은 남아 있어 다시 제출할 수 있다
        expect(screen.getByRole('radio', { name: '앱 푸시' })).toBeChecked();
    });
});
