import { useState } from 'react';
import { toast } from 'sonner';

import type { AdminEvent } from '@entities/event';

import { ApiError } from '@shared/api/client';
import { formatKst } from '@shared/lib/date';
import { cn } from '@shared/lib/utils';
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

import { useDeleteEvent, useEventAction } from '../api/queries';

export type EventActionKind = 'suspend' | 'resume' | 'cancel' | 'delete';

const ACTION_META: Record<
    EventActionKind,
    { title: string; description: string; submitLabel: string; pendingLabel: string }
> = {
    suspend: {
        title: '이벤트 중단',
        description: '응모를 일시 정지합니다. 마감 시각 전에는 재개할 수 있습니다.',
        submitLabel: '중단',
        pendingLabel: '중단 중…',
    },
    resume: {
        title: '이벤트 재개',
        description: '중단을 해제하고 응모를 다시 받습니다.',
        submitLabel: '재개',
        pendingLabel: '재개 중…',
    },
    cancel: {
        title: '이벤트 취소',
        description: '이벤트를 최종 종료합니다. 취소 후에는 재개할 수 없으며 응모권이 반환됩니다.',
        submitLabel: '취소',
        pendingLabel: '취소 중…',
    },
    delete: {
        title: '이벤트 삭제',
        description:
            '이벤트와 경품 정보를 삭제합니다. 시작 전이며 응모 이력이 없는 이벤트만 삭제할 수 있습니다.',
        submitLabel: '삭제',
        pendingLabel: '삭제 중…',
    },
};

const DESTRUCTIVE: ReadonlySet<EventActionKind> = new Set(['cancel', 'delete']);

interface EventActionDialogProps {
    event: AdminEvent | null;
    action: EventActionKind | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** 삭제 후에는 상세 화면이 유효하지 않으므로 호출부에서 목록으로 보낸다 */
    onDeleted?: () => void;
}

// 사유 입력 다이얼로그 — spec상 중단·재개·취소는 사유가 필수, 삭제는 확인만 거친다
export function EventActionDialog({
    event,
    action,
    open,
    onOpenChange,
    onDeleted,
}: EventActionDialogProps) {
    const [reason, setReason] = useState('');
    const eventAction = useEventAction(action === 'delete' || !action ? 'suspend' : action);
    const deleteEvent = useDeleteEvent();

    if (!event || !action) {
        return null;
    }

    const meta = ACTION_META[action];
    const mutation = action === 'delete' ? deleteEvent : eventAction;
    // 마감(CLOSED) 이벤트의 중단은 서버에서 즉시 취소+응모권 반환으로 전환되므로 취소급 경고를 띄운다
    const closedSuspend = action === 'suspend' && event.status === 'CLOSED';
    const description = closedSuspend
        ? '이미 마감된 이벤트입니다. 중단하면 즉시 취소되고 응모권이 반환되며 되돌릴 수 없습니다.'
        : meta.description;
    const reasonRequired = action !== 'delete';
    const canSubmit = !mutation.isPending && (!reasonRequired || reason.trim().length > 0);

    const reset = () => {
        setReason('');
        eventAction.reset();
        deleteEvent.reset();
    };

    const submit = () => {
        const onSuccess = () => {
            toast.success(`${meta.title}했습니다`);
            onOpenChange(false);
            reset();
            if (action === 'delete') onDeleted?.();
        };
        if (action === 'delete') {
            deleteEvent.mutate(event.id, { onSuccess });
        } else {
            eventAction.mutate({ eventId: event.id, reason: reason.trim() }, { onSuccess });
        }
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
                    <DialogTitle className="text-title-3 text-fg-primary">{meta.title}</DialogTitle>
                    <DialogDescription className="text-body-sm text-fg-secondary">
                        {event.title} · {formatKst(event.startsAt)} ~ {formatKst(event.endsAt)}
                    </DialogDescription>
                </DialogHeader>

                <p className="text-body-sm text-fg-secondary">{description}</p>

                {reasonRequired && (
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="event-action-reason"
                            className="text-body-bold text-fg-primary"
                        >
                            사유 (필수)
                        </label>
                        <Input
                            id="event-action-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="운영 사유를 입력하세요"
                        />
                    </div>
                )}

                {mutation.isError && (
                    <p className="text-destructive text-body-sm">
                        {mutation.error instanceof ApiError
                            ? mutation.error.message
                            : `${meta.title}에 실패했습니다. 상태를 확인한 뒤 다시 시도해주세요.`}
                    </p>
                )}

                <div className="flex gap-4">
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            className="bg-surface-sunken border-border-default text-fg-primary text-body-bold hover:bg-surface-pressed h-10 flex-1"
                        >
                            닫기
                        </Button>
                    </DialogClose>
                    <Button
                        className={cn(
                            'text-body-bold h-10 flex-1',
                            (DESTRUCTIVE.has(action) || closedSuspend) &&
                                'bg-destructive hover:bg-destructive/80',
                        )}
                        disabled={!canSubmit}
                        onClick={submit}
                    >
                        {mutation.isPending ? meta.pendingLabel : meta.submitLabel}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
