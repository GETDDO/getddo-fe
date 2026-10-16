import { toast } from 'sonner';

import type { AdminNotification } from '@entities/adminNotification';

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

import { useRetryNotificationDelivery } from '../api/queries';

interface RetryDeliveryDialogProps {
    notification: AdminNotification | null;
    onOpenChange: (open: boolean) => void;
}

/**
 * 개별 알림 모의 발송 복구 확인 — notification이 있을 때만 열린다.
 * 202는 복구 접수다. 같은 알림의 발송 처리만 재시도하며 새 알림을 만들지 않는다.
 */
export function RetryDeliveryDialog({ notification, onOpenChange }: RetryDeliveryDialogProps) {
    const retryDelivery = useRetryNotificationDelivery();

    const submit = () => {
        if (!notification) return;
        retryDelivery.mutate(notification.id, {
            onSuccess: () => {
                toast.success('발송 복구를 접수했습니다.');
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog
            open={notification !== null}
            onOpenChange={(next) => {
                onOpenChange(next);
                if (!next) retryDelivery.reset();
            }}
        >
            <DialogContent
                showCloseButton={false}
                className="bg-surface-page border-border-default gap-6 rounded-2xl border p-8 shadow-md ring-0 sm:max-w-140"
            >
                <DialogHeader className="gap-2">
                    <DialogTitle className="text-title-3 text-fg-primary">발송 복구</DialogTitle>
                    <DialogDescription className="text-body-sm text-fg-secondary">
                        {notification
                            ? `‘${notification.title}’ 알림의 모의 발송을 다시 시도하도록 접수합니다. 같은 알림의 발송만 재시도하며 읽음 상태는 바뀌지 않습니다.`
                            : ''}
                    </DialogDescription>
                </DialogHeader>

                {retryDelivery.isError && (
                    <p role="alert" className="text-semantic-error-strong text-body-sm">
                        {getErrorMessage(
                            retryDelivery.error,
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
                    <Button
                        className="h-10 flex-1"
                        disabled={retryDelivery.isPending}
                        onClick={submit}
                    >
                        {retryDelivery.isPending ? '접수 중…' : '복구 접수'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
