import type { RefObject } from 'react';

import { Button } from '@shared/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@shared/ui/dialog';

interface EntryConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    /** 이번 응모에 쓰는 응모권 수 */
    quantity: number;
    /** 지금 보유 중인 응모권 — 잔액을 못 불러왔으면 null */
    balance: number | null;
    onConfirm: () => void;
    /** 접수 요청이 진행 중이면 버튼을 잠근다 — 연타로 중복 요청이 나가지 않게 한다 */
    pending?: boolean;
    /** 닫은 뒤 포커스를 되돌릴 요소 — 트리거 없이 상태로 여는 모달이라 Radix가 포커스를 body로 떨어뜨린다 */
    returnFocusTo?: RefObject<HTMLElement | null>;
}

export function EntryConfirmDialog({
    open,
    onOpenChange,
    title,
    quantity,
    balance,
    onConfirm,
    pending = false,
    returnFocusTo,
}: EntryConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                onCloseAutoFocus={(event) => {
                    if (!returnFocusTo?.current) return;
                    event.preventDefault();
                    returnFocusTo.current.focus();
                }}
                className="bg-surface-page border-border-default gap-6 rounded-2xl border p-6 shadow-md ring-0 sm:max-w-120 sm:p-8"
            >
                <DialogHeader className="gap-2">
                    <DialogTitle className="text-title-3 text-fg-primary">
                        응모하시겠습니까?
                    </DialogTitle>
                    <DialogDescription className="text-body text-fg-secondary">
                        응모권 {quantity}장을 사용하여 {title}에 참여합니다.
                    </DialogDescription>
                </DialogHeader>

                <dl className="flex flex-col gap-3">
                    <div className="text-body-bold text-brand-primary flex items-center justify-between">
                        <dt>응모권 사용</dt>
                        <dd>{quantity}장</dd>
                    </div>
                    <div className="text-body-bold flex items-center justify-between">
                        <dt className="text-fg-secondary">보유 응모권</dt>
                        <dd className="text-fg-primary">
                            {balance == null ? '-' : `${balance}장`}
                        </dd>
                    </div>
                </dl>

                <div className="flex gap-4">
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            className="bg-surface-sunken border-border-default hover:bg-surface-pressed h-10 flex-1"
                        >
                            <span className="text-body-bold text-fg-primary">취소</span>
                        </Button>
                    </DialogClose>
                    <Button
                        variant="secondary"
                        className="h-10 flex-1"
                        disabled={pending}
                        onClick={onConfirm}
                    >
                        <span className="text-body-bold">{pending ? '처리 중…' : '응모하기'}</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
