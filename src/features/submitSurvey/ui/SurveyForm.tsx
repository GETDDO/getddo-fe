import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import type { MissionAnswerDraft, MissionDetail, MissionSubmissionResult } from '@entities/mission';

import { buildMissionAnswers, findMissingRequired, MissionQuestionField } from '@entities/mission';
import { ApiError } from '@shared/api/client';
import { Button } from '@shared/ui/button';

import { useSubmitSurvey } from '../api/queries';

/** 설문 미션 제출 폼 — 모든 필수 문항을 채우면 제출할 수 있고, 완료되면 결과 패널로 바뀐다 */
export function SurveyForm({ mission }: { mission: MissionDetail }) {
    const submitSurvey = useSubmitSurvey(mission.id);
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
        submitSurvey.mutate(buildMissionAnswers(questions, values), {
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
                <h2 className="text-title-2 text-fg-primary">설문 참여가 완료됐어요</h2>
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
                                // 답이 바뀐 문항은 필수 누락 표시를 바로 거둔다
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
                disabled={submitSurvey.isPending}
                className="self-end"
            >
                {submitSurvey.isPending ? '제출 중…' : '제출하기'}
            </Button>
        </form>
    );
}
