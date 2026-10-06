import { AnimatePresence, motion, useAnimate } from 'framer-motion';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import type { MissionAnswerDraft, MissionDetail, MissionSubmissionResult } from '@entities/mission';

import { buildMissionAnswers, findMissingRequired, MissionQuestionField } from '@entities/mission';
import { ApiError } from '@shared/api/client';
import { Button } from '@shared/ui/button';

import { useSubmitQuiz } from '../api/queries';

/**
 * 퀴즈 미션 제출 폼 — 오답(isCompleted=false)이면 카드를 흔들며 답변을 유지한 채 재도전할 수 있다.
 * 재도전 횟수 제한은 없다 (미션 도메인 규칙 — 빈도 제한은 서버의 몫).
 * 정답 완료 결과는 onCompleted로 올려 페이지가 결과 패널·보상 모달을 띄운다
 * (상세 쿼리 무효화로 이 폼이 언마운트되기 때문).
 */
export function QuizForm({
    mission,
    onCompleted,
}: {
    mission: MissionDetail;
    /** isNewSubmission: 이번 제출로 막 완료됐으면 true — 재제출 재생(200)에는 보상 연출을 하지 않는다 */
    onCompleted: (result: MissionSubmissionResult, isNewSubmission: boolean) => void;
}) {
    const submitQuiz = useSubmitQuiz(mission.id);
    const [missingIds, setMissingIds] = useState<Set<string>>(new Set());
    const [lastResult, setLastResult] = useState<MissionSubmissionResult | null>(null);
    const [scope, animate] = useAnimate();
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
            onSuccess: (outcome) => {
                if (outcome.result.isCompleted) {
                    onCompleted(outcome.result, outcome.isNewSubmission);
                } else {
                    setLastResult(outcome.result);
                    // 오답 — 폼을 remount하면 입력이 날아가므로 scope만 좌우로 흔든다
                    void animate(scope.current, { x: [0, -10, 8, -6, 4, 0] }, { duration: 0.45 });
                }
            },
            onError: (error) => {
                toast.error(
                    error instanceof ApiError
                        ? error.message
                        : '제출에 실패했습니다. 잠시 후 다시 시도해 주세요.',
                );
            },
        });
    };

    return (
        <div ref={scope}>
            <motion.form
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                onSubmit={(event) => void handleSubmit(onSubmit)(event)}
                className="flex flex-col gap-4"
            >
                <AnimatePresence>
                    {lastResult && !lastResult.isCompleted && (
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-surface-sunken text-body-sm text-fg-secondary overflow-hidden rounded-xl px-4 py-3"
                        >
                            아쉽지만 오답이에요. 답을 고쳐서 다시 도전해 보세요.
                        </motion.p>
                    )}
                </AnimatePresence>
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
                                disabled={submitQuiz.isPending}
                                onChange={(draft) => {
                                    field.onChange(draft);
                                    // 답을 고치기 시작하면 오답 배너는 거둔다
                                    if (lastResult && !lastResult.isCompleted) setLastResult(null);
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
            </motion.form>
        </div>
    );
}
