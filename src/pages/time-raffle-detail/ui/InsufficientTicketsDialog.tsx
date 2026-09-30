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

interface InsufficientTicketsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/** 고른 수량보다 보유 응모권이 적을 때 안내한다 — 응모는 접수하지 않고 적립 경로만 알려준다 */
export function InsufficientTicketsDialog({ open, onOpenChange }: InsufficientTicketsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="bg-surface-page border-border-default gap-6 rounded-2xl border p-6 shadow-md ring-0 sm:max-w-120 sm:p-8"
            >
                <DialogHeader className="gap-2">
                    <DialogTitle className="text-title-3 text-fg-primary">
                        응모권이 부족해요
                    </DialogTitle>
                    <DialogDescription className="text-body text-fg-secondary">
                        출석 체크, 게임 등 미션에 참여하면 응모권을 모을 수 있어요.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-4">
                    <DialogClose asChild>
                        {/* outline 변형은 다크 전용 배경을 함께 얹어서, 시안대로 테두리만 두려고 ghost를 쓴다 */}
                        <Button
                            variant="ghost"
                            className="border-border-strong bg-surface-page hover:bg-surface-sunken h-10 flex-1"
                        >
                            <span className="text-body-bold text-fg-primary">닫기</span>
                        </Button>
                    </DialogClose>
                    <Button asChild variant="secondary" className="h-10 flex-1">
                        <Link to="/missions">
                            <span className="text-body-bold">응모권 모으러 가기</span>
                        </Link>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
