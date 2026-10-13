import { cn } from '@shared/lib/utils';
import { Input } from '@shared/ui/input';
import { RadioGroup, RadioGroupItem } from '@shared/ui/radio-group';
import { Textarea } from '@shared/ui/textarea';

import type { MissionAnswerDraft } from '../lib/missionAnswers';
import type { MissionQuestion } from '../model/types';

/** 고른 칸 표시 — Radix 라디오의 data-state로 판단한다 */
const CHOICE_ROW =
    'border-border-default hover:bg-surface-canvas has-[[data-state=checked]]:border-fg-primary has-[[data-state=checked]]:bg-surface-canvas has-[:focus-visible]:ring-border-focus flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-colors has-[:focus-visible]:ring-2';

const OX_TILE =
    'border-border-default text-fg-tertiary hover:bg-surface-canvas has-[[data-state=checked]]:border-fg-primary has-[[data-state=checked]]:bg-surface-canvas has-[[data-state=checked]]:text-fg-primary has-[:focus-visible]:ring-border-focus flex h-24 cursor-pointer items-center justify-center rounded-2xl border-2 transition-colors has-[:focus-visible]:ring-2';

interface MissionQuestionFieldProps {
    question: MissionQuestion;
    value: MissionAnswerDraft | undefined;
    onChange: (draft: MissionAnswerDraft) => void;
    /** 제출 시도 후 필수 문항이 비어 있으면 true — 오류 표시용 */
    invalid?: boolean;
    /** 제출 처리 중이면 true — 전송 중 답변이 바뀌지 않게 입력을 잠근다 */
    disabled?: boolean;
    /** 문항 번호(1부터) — 있으면 문항 위에 Q1처럼 보여 준다 */
    number?: number;
}

/**
 * 미션 문항 하나의 입력 UI — OX는 큰 O·X 두 칸, 단일 선택은 선택지 카드, 서술형(단답·자유 서술)은 텍스트 입력.
 * 고른 칸은 진한 테두리와 옅은 회색 바탕으로 표시한다 — 노랑은 응모권·보상에만 쓴다.
 * 제출 변환·검증은 lib/missionAnswers가 담당하고, 여기는 표시와 입력만 한다.
 */
export function MissionQuestionField({
    question,
    value,
    onChange,
    invalid = false,
    disabled = false,
    number,
}: MissionQuestionFieldProps) {
    const options = [...question.options].sort((a, b) => a.displayOrder - b.displayOrder);

    return (
        <fieldset
            disabled={disabled}
            className={cn(
                'bg-surface-page border-border-default flex flex-col gap-3 rounded-2xl border p-5',
                invalid && 'border-destructive',
            )}
        >
            <legend className="sr-only">{question.questionText}</legend>
            <div className="flex flex-col gap-1.5">
                {number !== undefined && (
                    <span className="text-caption text-fg-tertiary font-semibold">
                        Q{number}
                        {!question.required && ' · 선택'}
                    </span>
                )}
                <p className="text-title-3 text-fg-primary">
                    {question.questionText}
                    {question.required && <span className="text-destructive ml-1">*</span>}
                </p>
            </div>

            {question.questionType === 'OX' || question.questionType === 'SINGLE_CHOICE' ? (
                <RadioGroup
                    name={question.id}
                    // 미선택은 ''로 고정 — undefined로 두면 비제어→제어 전환 경고가 난다
                    value={value?.selectedOptionId ?? ''}
                    onValueChange={(selectedOptionId) => onChange({ selectedOptionId })}
                    className={question.questionType === 'OX' ? 'grid-cols-2 gap-3' : 'gap-2'}
                >
                    {options.map((option) =>
                        question.questionType === 'OX' ? (
                            // OX — 동그라미는 라디오를 숨기고 큰 글자 칸 전체를 누르게 한다
                            <label key={option.id} htmlFor={option.id} className={OX_TILE}>
                                <RadioGroupItem
                                    id={option.id}
                                    value={option.id}
                                    className="sr-only"
                                />
                                <span className="text-[2.5rem] leading-none font-extrabold">
                                    {option.optionText}
                                </span>
                            </label>
                        ) : (
                            <label key={option.id} htmlFor={option.id} className={CHOICE_ROW}>
                                <RadioGroupItem id={option.id} value={option.id} />
                                <span className="text-body text-fg-primary">
                                    {option.optionText}
                                </span>
                            </label>
                        ),
                    )}
                </RadioGroup>
            ) : question.questionType === 'SHORT_ANSWER' ? (
                <Input
                    name={question.id}
                    value={value?.answerText ?? ''}
                    onChange={(event) => onChange({ answerText: event.target.value })}
                    placeholder="정답을 입력하세요"
                    aria-invalid={invalid || undefined}
                />
            ) : (
                <Textarea
                    name={question.id}
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
