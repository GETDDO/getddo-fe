import { motion } from 'framer-motion';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import type {
    MissionAnswer,
    MissionAnswerDraft,
    MissionDetail,
    MissionSubmissionResult,
} from '@entities/mission';

import { buildMissionAnswers, findMissingRequired, MissionQuestionField } from '@entities/mission';
import { ApiError } from '@shared/api/client';
import { Button } from '@shared/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@shared/ui/dialog';

import { useSubmitSurvey } from '../api/queries';

/**
 * 설문 미션 제출 폼 — 제출이 곧 완료 확정이라 마지막 확인 모달을 거친 뒤 제출한다.
 * 완료 결과는 onCompleted로 올려 페이지가 결과 패널·보상 모달을 띄운다
 * (상세 쿼리 무효화로 이 폼이 언마운트되기 때문).
 */
export function SurveyForm({
    mission,
    onCompleted,
}: {
    mission: MissionDetail;
    /** isNewSubmission: 이번 제출로 막 완료됐으면 true — 재제출 재생(200)에는 보상 연출을 하지 않는다 */
    onCompleted: (result: MissionSubmissionResult, isNewSubmission: boolean) => void;
}) {
    const submitSurvey = useSubmitSurvey(mission.id);
    const [missingIds, setMissingIds] = useState<Set<string>>(new Set());
    // 확인 모달에 걸어둔 제출 payload — '제출하기'를 누르면 이 값으로 요청한다
    const [pendingAnswers, setPendingAnswers] = useState<MissionAnswer[] | null>(null);
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
        setPendingAnswers(buildMissionAnswers(questions, values));
    };

    const confirmSubmit = () => {
        if (!pendingAnswers) return;
        submitSurvey.mutate(pendingAnswers, {
            onSuccess: (outcome) => {
                if (outcome.result.isCompleted)
                    onCompleted(outcome.result, outcome.isNewSubmission);
            },
            onError: (error) => {
                toast.error(
                    error instanceof ApiError
                        ? error.message
                        : '제출에 실패했습니다. 잠시 후 다시 시도해 주세요.',
                );
            },
        });
        setPendingAnswers(null);
    };

    return (
        <>
            <motion.form
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
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
                                disabled={submitSurvey.isPending}
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
            </motion.form>

            <Dialog
                open={pendingAnswers !== null}
                onOpenChange={(open) => {
                    if (!open) setPendingAnswers(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>설문을 제출할까요?</DialogTitle>
                        <DialogDescription>제출 후에는 답변을 수정할 수 없어요.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPendingAnswers(null)}>
                            취소
                        </Button>
                        <Button variant="primary" onClick={confirmSubmit}>
                            제출하기
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
