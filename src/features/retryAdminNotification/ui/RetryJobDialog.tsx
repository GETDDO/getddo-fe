import { toast } from 'sonner';

import type { NotificationJob } from '@entities/adminNotification';

import { NOTIFICATION_TYPE_LABEL } from '@entities/adminNotification';
import { getErrorMessage } from '@shared/api/errorMessage';
import { Button } from '@shared/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@shared/ui/dialog';

import { useRetryNotificationJob } from '../api/queries';

interface RetryJobDialogProps {
    job: NotificationJob | null;
    onOpenChange: (open: boolean) => void;
}

/**
 * 알림 생성 복구 확인 — job이 있을 때만 열린다.
 * 202는 복구 접수다. 최종 성공이 아니므로 성공 문구도 '접수'로 표현한다.
 */
export function RetryJobDialog({ job, onOpenChange }: RetryJobDialogProps) {
    const retryJob = useRetryNotificationJob();

    const submit = () => {
        if (!job) return;
        retryJob.mutate(job.id, {
            onSuccess: () => {
                toast.success('알림 생성 복구를 접수했습니다.');
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog
            open={job !== null}
            onOpenChange={(next) => {
                onOpenChange(next);
                if (!next) retryJob.reset();
            }}
        >
            <DialogContent
                showCloseButton={false}
                className="bg-surface-page border-border-default gap-6 rounded-2xl border p-8 shadow-md ring-0 sm:max-w-140"
            >
                <DialogHeader className="gap-2">
                    <DialogTitle className="text-title-3 text-fg-primary">
                        알림 생성 복구
                    </DialogTitle>
                    <DialogDescription className="text-body-sm text-fg-secondary">
                        {job
                            ? `‘${NOTIFICATION_TYPE_LABEL[job.notificationType]}’ 작업의 알림 생성을 다시 시도하도록 접수합니다. 기존에 생성된 알림은 유지되고 아직 생성하지 못한 건만 처리합니다.`
                            : ''}
                    </DialogDescription>
                </DialogHeader>

                {retryJob.isError && (
                    <p role="alert" className="text-semantic-error-strong text-body-sm">
                        {getErrorMessage(
                            retryJob.error,
                            '복구를 접수하지 못했습니다. 다시 시도해주세요.',
                        )}
                    </p>
                )}

                <div className="flex gap-4">
                    <DialogClose asChild>
                        <Button variant="secondary" className="h-10 flex-1">
                            취소
                        </Button>
                    </DialogClose>
                    <Button className="h-10 flex-1" disabled={retryJob.isPending} onClick={submit}>
                        {retryJob.isPending ? '접수 중…' : '복구 접수'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
