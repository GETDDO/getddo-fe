import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import type { MissionAnswerDraft, MissionDetail, MissionSubmissionResult } from '@entities/mission';

import { buildMissionAnswers, findMissingRequired, MissionQuestionField } from '@entities/mission';
import { ApiError } from '@shared/api/client';
import { Button } from '@shared/ui/button';

import { useSubmitQuiz } from '../api/queries';

/**
 * 퀴즈 미션 제출 폼 — 오답(isCompleted=false)이면 답변을 유지한 채 재도전할 수 있다.
 * 재도전 횟수 제한은 없다 (미션 도메인 규칙 — 빈도 제한은 서버의 몫).
 */
export function QuizForm({ mission }: { mission: MissionDetail }) {
    const submitQuiz = useSubmitQuiz(mission.id);
    const [missingIds, setMissingIds] = useState<Set<string>>(new Set());
    const [result, setResult] = useState<MissionSubmissionResult | null>(null);
    const { control, handleSubmit } = useForm<Record<string, MissionAnswerDraft>>({
        defaultValues: {},
    });

    const questions = [...mission.questions].sort((a, b) => a.displayOrder - b.displayOrder);

    const onSubmit = (values: Record<string, MissionAnswerDraft>) => {
        const missing = findMissingRequired(questions, values);
        if (missing.length > 0) {
            setMissingIds(new Set(missing.map((q) => q.id)));
            return;
        }
        submitQuiz.mutate(buildMissionAnswers(questions, values), {
            onSuccess: setResult,
            onError: (error) => {
                toast.error(
                    error instanceof ApiError
                        ? error.message
                        : '제출에 실패했습니다. 잠시 후 다시 시도해 주세요.',
                );
            },
        });
    };

    if (result?.isCompleted) {
        return (
            <section className="bg-surface-page border-border-default flex flex-col items-center gap-4 rounded-2xl border p-8 text-center">
                <h2 className="text-title-2 text-fg-primary">정답이에요!</h2>
                <p className="text-body text-fg-secondary">
                    응모권 {result.reward?.ticketCount ?? mission.rewardTicketCount}장을 받았어요.
                </p>
                <Button asChild variant="primary">
                    <Link to="/missions">미션 목록으로</Link>
                </Button>
            </section>
        );
    }

    return (
        <form
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            className="flex flex-col gap-4"
        >
            {result && !result.isCompleted && (
                <p className="bg-surface-sunken text-body-sm text-fg-secondary rounded-xl px-4 py-3">
                    아쉽지만 오답이에요. 답을 고쳐서 다시 도전해 보세요.
                </p>
            )}
            {questions.map((question) => (
                <Controller
                    key={question.id}
                    control={control}
                    name={question.id}
                    render={({ field }) => (
                        <MissionQuestionField
                            question={question}
                            value={field.value}
                            invalid={missingIds.has(question.id)}
                            onChange={(draft) => {
                                field.onChange(draft);
                                if (missingIds.has(question.id)) {
                                    setMissingIds((prev) => {
                                        const next = new Set(prev);
                                        next.delete(question.id);
                                        return next;
                                    });
                                }
                            }}
                        />
                    )}
                />
            ))}
            <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={submitQuiz.isPending}
                className="self-end"
            >
                {submitQuiz.isPending ? '채점 중…' : '정답 제출'}
            </Button>
        </form>
    );
}
