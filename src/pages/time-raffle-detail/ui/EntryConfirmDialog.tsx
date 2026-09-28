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
    /** 응모 후 남는 응모권 — 잔액을 못 불러왔으면 null */
    remaining: number | null;
    onConfirm: () => void;
}

export function EntryConfirmDialog({
    open,
    onOpenChange,
    title,
    quantity,
    remaining,
    onConfirm,
}: EntryConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="bg-surface-page border-border-default gap-6 rounded-2xl border p-8 shadow-md ring-0 sm:max-w-120"
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
                        <dt className="text-fg-secondary">남은 응모권</dt>
                        <dd className="text-fg-primary">
                            {remaining == null ? '-' : `${remaining}장`}
                        </dd>
                    </div>
                </dl>

                <div className="flex gap-4">
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            className="bg-surface-sunken border-border-default text-fg-primary text-body-bold hover:bg-surface-pressed h-10 flex-1"
                        >
                            취소
                        </Button>
                    </DialogClose>
                    <Button
                        variant="secondary"
                        className="text-body-bold h-10 flex-1"
                        onClick={onConfirm}
                    >
                        응모하기
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
