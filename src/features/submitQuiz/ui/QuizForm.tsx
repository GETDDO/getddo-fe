import { AnimatePresence, motion, useAnimate } from 'framer-motion';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import type { MissionAnswerDraft, MissionDetail, MissionSubmissionResult } from '@entities/mission';

import {
    buildMissionAnswers,
    findMissingRequired,
    MissionQuestionField,
    MissionResultPanel,
    MissionRewardDialog,
} from '@entities/mission';
import { ApiError } from '@shared/api/client';
import { Button } from '@shared/ui/button';

import { useSubmitQuiz } from '../api/queries';

/**
 * 퀴즈 미션 제출 폼 — 오답(isCompleted=false)이면 카드를 흔들며 답변을 유지한 채 재도전할 수 있다.
 * 재도전 횟수 제한은 없다 (미션 도메인 규칙 — 빈도 제한은 서버의 몫).
 */
export function QuizForm({ mission }: { mission: MissionDetail }) {
    const submitQuiz = useSubmitQuiz(mission.id);
    const [missingIds, setMissingIds] = useState<Set<string>>(new Set());
    const [result, setResult] = useState<MissionSubmissionResult | null>(null);
    const [rewardOpen, setRewardOpen] = useState(false);
    const [scope, animate] = useAnimate();
    const { control, handleSubmit } = useForm<Record<string, MissionAnswerDraft>>({
        defaultValues: {},
    });

    const questions = [...mission.questions].sort((a, b) => a.displayOrder - b.displayOrder);
    const rewardTickets = result?.reward?.ticketCount ?? mission.rewardTicketCount;

    const onSubmit = (values: Record<string, MissionAnswerDraft>) => {
        const missing = findMissingRequired(questions, values);
        if (missing.length > 0) {
            setMissingIds(new Set(missing.map((q) => q.id)));
            return;
        }
        submitQuiz.mutate(buildMissionAnswers(questions, values), {
            onSuccess: (submitted) => {
                setResult(submitted);
                if (submitted.isCompleted) {
                    setRewardOpen(true);
                } else {
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
        <>
            <AnimatePresence mode="wait" initial={false}>
                {result?.isCompleted ? (
                    <MissionResultPanel key="result" title="정답이에요!" tickets={rewardTickets} />
                ) : (
                    <div key="form" ref={scope}>
                        <motion.form
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
                            className="flex flex-col gap-4"
                        >
                            <AnimatePresence>
                                {result && !result.isCompleted && (
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
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>

            <MissionRewardDialog
                open={rewardOpen}
                onOpenChange={setRewardOpen}
                tickets={rewardTickets}
            />
        </>
    );
}
