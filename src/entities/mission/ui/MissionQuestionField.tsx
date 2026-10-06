import { cn } from '@shared/lib/utils';
import { Input } from '@shared/ui/input';
import { RadioGroup, RadioGroupItem } from '@shared/ui/radio-group';
import { Textarea } from '@shared/ui/textarea';

import type { MissionAnswerDraft } from '../lib/missionAnswers';
import type { MissionQuestion } from '../model/types';

interface MissionQuestionFieldProps {
    question: MissionQuestion;
    value: MissionAnswerDraft | undefined;
    onChange: (draft: MissionAnswerDraft) => void;
    /** 제출 시도 후 필수 문항이 비어 있으면 true — 오류 표시용 */
    invalid?: boolean;
}

/**
 * 미션 문항 하나의 입력 UI — 선택형(OX·단일 선택)은 라디오, 서술형(단답·자유 서술)은 텍스트 입력.
 * 제출 변환·검증은 lib/missionAnswers가 담당하고, 여기는 표시와 입력만 한다.
 */
export function MissionQuestionField({
    question,
    value,
    onChange,
    invalid = false,
}: MissionQuestionFieldProps) {
    const options = [...question.options].sort((a, b) => a.displayOrder - b.displayOrder);

    return (
        <fieldset
            className={cn(
                'bg-surface-page border-border-default flex flex-col gap-3 rounded-2xl border p-5',
                invalid && 'border-destructive',
            )}
        >
            <legend className="sr-only">{question.questionText}</legend>
            <p className="text-title-3 text-fg-primary">
                {question.questionText}
                {question.required && <span className="text-destructive ml-1">*</span>}
            </p>

            {question.questionType === 'OX' || question.questionType === 'SINGLE_CHOICE' ? (
                <RadioGroup
                    // 미선택은 ''로 고정 — undefined로 두면 비제어→제어 전환 경고가 난다
                    value={value?.selectedOptionId ?? ''}
                    onValueChange={(selectedOptionId) => onChange({ selectedOptionId })}
                    className="gap-2"
                >
                    {options.map((option) => (
                        <label
                            key={option.id}
                            htmlFor={option.id}
                            className="border-border-default has-checked:border-primary has-checked:bg-brand-primary/10 flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors"
                        >
                            <RadioGroupItem id={option.id} value={option.id} />
                            <span className="text-body text-fg-primary">{option.optionText}</span>
                        </label>
                    ))}
                </RadioGroup>
            ) : question.questionType === 'SHORT_ANSWER' ? (
                <Input
                    value={value?.answerText ?? ''}
                    onChange={(event) => onChange({ answerText: event.target.value })}
                    placeholder="정답을 입력하세요"
                    aria-invalid={invalid || undefined}
                />
            ) : (
                <Textarea
                    value={value?.answerText ?? ''}
                    onChange={(event) => onChange({ answerText: event.target.value })}
                    placeholder="답변을 입력하세요"
                    aria-invalid={invalid || undefined}
                    rows={4}
                />
            )}

            {invalid && (
                <p className="text-body-sm text-destructive">필수 문항입니다. 답변해 주세요.</p>
            )}
        </fieldset>
    );
}
