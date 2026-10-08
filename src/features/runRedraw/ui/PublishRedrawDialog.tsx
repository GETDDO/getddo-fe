import { useRef, useState } from 'react';
import { toast } from 'sonner';

import type { DrawRun } from '@entities/drawResult';

import { drawErrorMessage } from '@entities/drawResult';
import { Button } from '@shared/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@shared/ui/dialog';
import { Textarea } from '@shared/ui/textarea';

import { usePublishRedraw } from '../api/queries';

interface PublishRedrawDialogProps {
    run: DrawRun | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// 재추첨 결과 공개 반영 — 반영 사유는 변경 이력(AD07)에 남는다
export function PublishRedrawDialog({ run, open, onOpenChange }: PublishRedrawDialogProps) {
    const [reason, setReason] = useState('');
    const publish = usePublishRedraw();
    const submitting = useRef(false);

    if (!run) {
        return null;
    }

    const trimmed = reason.trim();
    const canSubmit = !publish.isPending && trimmed.length > 0;

    const reset = () => {
        setReason('');
        publish.reset();
    };

    const submit = () => {
        if (submitting.current || !trimmed) return;
        submitting.current = true;
        publish.mutate(
            { drawId: run.id, reason: trimmed },
            {
                onSuccess: (data) => {
                    toast.success(`공개 명단을 갱신했습니다 (버전 ${data.revision})`);
                    onOpenChange(false);
                    reset();
                },
                onSettled: () => {
                    submitting.current = false;
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
                    <DialogTitle className="text-title-3 text-fg-primary">
                        공개 명단에 반영
                    </DialogTitle>
                    <DialogDescription className="text-body-sm text-fg-secondary">
                        재추첨 {run.runNumber}회차 결과를 확인하고 공개 명단을 갱신합니다.
                    </DialogDescription>
                </DialogHeader>

                <p className="text-body-sm text-fg-secondary">
                    반영하면 취소자와 새 당첨자에게만 안내가 생성되며 전체 재발표 알림은 보내지
                    않습니다. 같은 실행을 다시 반영해도 버전이 중복으로 생기지 않습니다.
                </p>

                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="publish-redraw-reason"
                        className="text-body-bold text-fg-primary"
                    >
                        반영 사유 (필수)
                    </label>
                    <Textarea
                        id="publish-redraw-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="재추첨 결과를 확인한 근거를 입력하세요"
                        aria-describedby={publish.isError ? 'publish-redraw-error' : undefined}
                    />
                </div>

                {publish.isError && (
                    <p
                        id="publish-redraw-error"
                        role="alert"
                        className="text-destructive text-body-sm"
                    >
                        {drawErrorMessage(
                            publish.error,
                            '공개 명단 반영에 실패했습니다. 잠시 후 다시 시도해주세요.',
                        )}
                    </p>
                )}

                <div className="flex gap-4">
                    <DialogClose asChild>
                        <Button
                            variant="secondary"
                            className="bg-surface-sunken border-border-default text-fg-primary text-body-bold hover:bg-surface-pressed h-10 flex-1"
                        >
                            닫기
                        </Button>
                    </DialogClose>
                    <Button className="h-10 flex-1" disabled={!canSubmit} onClick={submit}>
                        {publish.isPending ? '반영 중…' : '공개 명단 반영'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
