import { useState } from 'react';
import { toast } from 'sonner';

import type { AbuseCase, AbuseDecision } from '@entities/abuseCase';

import { formatKst } from '@shared/lib/date';
import { Button } from '@shared/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@shared/ui/dialog';
import { Input } from '@shared/ui/input';

import { useReviewAbuseCase } from '../api/queries';

const DECISIONS: { value: AbuseDecision; label: string }[] = [
    { value: 'allow', label: '참여 허용' },
    { value: 'exclude', label: '추첨 대상 제외' },
];

interface ReviewAbuseDialogProps {
    abuseCase: AbuseCase | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ReviewAbuseDialog({ abuseCase, open, onOpenChange }: ReviewAbuseDialogProps) {
    const [decision, setDecision] = useState<AbuseDecision>('allow');
    const [note, setNote] = useState('');
    const review = useReviewAbuseCase();

    if (!abuseCase) {
        return null;
    }

    // 제외 확정 전에는 사유를 반드시 기록한다 (getddo-spec entry.md)
    const noteRequired = decision === 'exclude';
    const canSubmit = !review.isPending && (!noteRequired || note.trim().length > 0);

    const reset = () => {
        setDecision('allow');
        setNote('');
        review.reset();
    };

    const submit = () => {
        review.mutate(
            { caseId: abuseCase.id, decision, note: note.trim() },
            {
                onSuccess: () => {
                    toast.success('검토 결과를 기록했습니다');
                    onOpenChange(false);
                    reset();
                },
            },
        );
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                onOpenChange(next);
                if (!next) reset();
            }}
        >
            <DialogContent
                showCloseButton={false}
                className="bg-surface-page border-border-default gap-6 rounded-2xl border p-8 shadow-md ring-0 sm:max-w-140"
            >
                <DialogHeader className="gap-2">
                    <DialogTitle className="text-title-3 text-fg-primary">어뷰징 검토</DialogTitle>
                    <DialogDescription className="text-body-sm text-fg-secondary">
                        {abuseCase.userNickname} · {abuseCase.reason} ·{' '}
                        {formatKst(abuseCase.detectedAt)}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2">
                    <p className="text-body-bold text-fg-primary">검토 결과</p>
                    <div className="flex gap-2">
                        {DECISIONS.map(({ value, label }) => (
                            <Button
                                key={value}
                                type="button"
                                variant={
                                    decision === value
                                        ? value === 'exclude'
                                            ? 'destructive'
                                            : 'primary'
                                        : 'secondary'
                                }
                                className="flex-1"
                                onClick={() => setDecision(value)}
                            >
                                {label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="abuse-review-note" className="text-body-bold text-fg-primary">
                        검토 사유{noteRequired ? ' (필수)' : ' (선택)'}
                    </label>
                    <Input
                        id="abuse-review-note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={
                            noteRequired
                                ? '제외 사유를 입력하세요 (제외된 본인에게 안내됩니다)'
                                : '검토 사유를 입력하세요'
                        }
                    />
                </div>

                {review.isError && (
                    <p className="text-destructive text-body-sm">
                        검토 결과를 기록하지 못했습니다. 다시 시도해주세요.
                    </p>
                )}

                <div className="flex gap-4">
                    <DialogClose asChild>
                        <Button
                            variant="secondary"
                            className="bg-surface-sunken border-border-default text-fg-primary text-body-bold hover:bg-surface-pressed h-10 flex-1"
                        >
                            취소
                        </Button>
                    </DialogClose>
                    <Button
                        className="text-body-bold h-10 flex-1"
                        disabled={!canSubmit}
                        onClick={submit}
                    >
                        {review.isPending ? '기록 중…' : '검토 완료'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
