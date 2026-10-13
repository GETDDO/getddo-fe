import { motion } from 'framer-motion';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

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
    // 아래 제출 줄의 답변 진행 — 고른 선택지나 공백 아닌 글이 있으면 답한 문항으로 센다
    const values = useWatch({ control });
    const answeredCount = ordered.filter((question) => {
        const draft = values[question.id];
        return !!draft?.selectedOptionId || !!draft?.answerText?.trim();
    }).length;

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
            {ordered.map((question, index) => (
                <Controller
                    key={question.id}
                    control={control}
                    name={question.id}
                    render={({ field }) => (
                        <MissionQuestionField
                            question={question}
                            number={index + 1}
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
            {/* 제출 줄 — 문항이 길어도 모달 아래에 붙어 있다. 모달 본문 좌우 여백(px-6)만큼 넓혀 가장자리까지 채운다 */}
            <div className="bg-surface-elevated border-border-default sticky bottom-0 -mx-6 mt-2 flex items-center gap-4 border-t px-6 py-4">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="text-caption text-fg-secondary">
                        <span className="text-body-sm-bold text-fg-primary tabular-nums">
                            {answeredCount} / {ordered.length}
                        </span>{' '}
                        답변
                    </span>
                    <span
                        aria-hidden
                        className="bg-surface-sunken h-1.5 overflow-hidden rounded-full"
                    >
                        <span
                            className="bg-action-neutral block h-full rounded-full transition-[width] duration-300"
                            style={{
                                width: `${ordered.length > 0 ? Math.round((answeredCount / ordered.length) * 100) : 0}%`,
                            }}
                        />
                    </span>
                </div>
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isPending}
                    className="px-8"
                >
                    {isPending ? pendingLabel : submitLabel}
                </Button>
            </div>
        </motion.form>
    );
}
