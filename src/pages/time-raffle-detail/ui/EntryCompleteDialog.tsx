import type { RefObject } from 'react';

import { Link } from 'react-router-dom';

import { Button } from '@shared/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@shared/ui/dialog';

interface EntryCompleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** 이번 응모로 쓴 응모권 수 */
    deductedTicketCount: number;
    /** 한도까지 더 쓸 수 있는 응모권 수 — 0이면 추가 응모 안내를 빼고 한도 도달로 알린다 */
    remainingAllowance: number;
    /** 닫은 뒤 포커스를 되돌릴 요소 — 트리거 없이 상태로 여는 모달이라 Radix가 포커스를 body로 떨어뜨린다 */
    returnFocusTo?: RefObject<HTMLElement | null>;
}

export function EntryCompleteDialog({
    open,
    onOpenChange,
    deductedTicketCount,
    remainingAllowance,
    returnFocusTo,
}: EntryCompleteDialogProps) {
    const canEnterMore = remainingAllowance >= 1;

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
                    {/* 한도가 남아 있으면 아직 '접수'다 — 추가 응모까지 마쳐야 '완료'로 알린다 */}
                    <DialogTitle className="text-title-3 text-fg-primary">
                        {canEnterMore ? '응모가 접수되었습니다' : '응모가 완료되었습니다'}
                    </DialogTitle>
                    <DialogDescription className="text-body text-fg-secondary">
                        응모권 {deductedTicketCount}장을 사용했어요.{' '}
                        {canEnterMore
                            ? `${remainingAllowance}장까지 추가로 응모할 수 있어요.`
                            : '이 이벤트에 쓸 수 있는 응모권을 모두 사용했어요.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-4">
                    <DialogClose asChild>
                        {/* outline 변형은 다크 전용 배경을 함께 얹어서, 시안대로 테두리만 두려고 ghost를 쓴다 */}
                        <Button
                            variant="ghost"
                            className="border-border-strong bg-surface-page hover:bg-surface-sunken h-10 flex-1"
                        >
                            <span className="text-body-bold text-fg-primary">
                                {canEnterMore ? '닫기' : '확인'}
                            </span>
                        </Button>
                    </DialogClose>
                    {canEnterMore ? (
                        <DialogClose asChild>
                            <Button variant="secondary" className="h-10 flex-1">
                                <span className="text-body-bold">추가 응모하기</span>
                            </Button>
                        </DialogClose>
                    ) : (
                        <Button asChild variant="secondary" className="h-10 flex-1">
                            <Link to="/my-entries">
                                <span className="text-body-bold">내 응모 내역</span>
                            </Link>
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
