import { motion } from 'framer-motion';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import type { MissionAnswer, MissionAnswerDraft, MissionQuestion } from '@entities/mission';

import { buildMissionAnswers, findMissingRequired, MissionQuestionField } from '@entities/mission';
import { Button } from '@shared/ui/button';

/**
 * 설문·퀴즈 공통 문항 폼 — 문항 렌더링과 필수 문항 검증만 담당한다.
 * 유효한 제출 payload는 onSubmit으로 올리고, 제출 전 확인(설문)·채점 재도전(퀴즈) 같은
 * 제출 정책은 사용처가 정한다.
 */
export function MissionAnswersForm({
    questions,
    isPending,
    submitLabel,
    pendingLabel,
    onSubmit,
    onAnswersChange,
}: {
    questions: MissionQuestion[];
    isPending: boolean;
    submitLabel: string;
    pendingLabel: string;
    onSubmit: (answers: MissionAnswer[]) => void;
    /** 답변이 하나라도 바뀔 때 호출 — 오답 배너 거두기 같은 부수 처리용 */
    onAnswersChange?: () => void;
}) {
    const [missingIds, setMissingIds] = useState<Set<string>>(new Set());
    const { control, handleSubmit } = useForm<Record<string, MissionAnswerDraft>>({
        defaultValues: {},
    });

    const ordered = [...questions].sort((a, b) => a.displayOrder - b.displayOrder);

    const submit = (values: Record<string, MissionAnswerDraft>) => {
        const missing = findMissingRequired(ordered, values);
        if (missing.length > 0) {
            setMissingIds(new Set(missing.map((q) => q.id)));
            return;
        }
        onSubmit(buildMissionAnswers(ordered, values));
    };

    return (
        <motion.form
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            onSubmit={(event) => void handleSubmit(submit)(event)}
            className="flex flex-col gap-4"
        >
            {ordered.map((question) => (
                <Controller
                    key={question.id}
                    control={control}
                    name={question.id}
                    render={({ field }) => (
                        <MissionQuestionField
                            question={question}
                            value={field.value}
                            invalid={missingIds.has(question.id)}
                            disabled={isPending}
                            onChange={(draft) => {
                                field.onChange(draft);
                                onAnswersChange?.();
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
                disabled={isPending}
                className="self-end"
            >
                {isPending ? pendingLabel : submitLabel}
            </Button>
        </motion.form>
    );
}
