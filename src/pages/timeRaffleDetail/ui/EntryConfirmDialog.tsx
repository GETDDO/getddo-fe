import type { RefObject } from 'react';

import type { EntryTickets } from '@entities/entry';

import { TICKET_GRADE_LABEL, ticketGradeSchema } from '@entities/ticket';
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
    /** 이번 응모에 쓰는 등급별 장수 — 생략된 등급은 0이다 */
    tickets: EntryTickets;
    /** 지금 보유 중인 응모권 — 잔액을 못 불러왔으면 null */
    balance: number | null;
    onConfirm: () => void;
    /** 접수 요청이 진행 중이면 버튼을 잠근다 — 연타로 중복 요청이 나가지 않게 한다 */
    pending?: boolean;
    /** 닫은 뒤 포커스를 되돌릴 요소 — 트리거 없이 상태로 여는 모달이라 Radix가 포커스를 body로 떨어뜨린다 */
    returnFocusTo?: RefObject<HTMLElement | null>;
}

/** 등급별 장수를 '브론즈 1장·골드 2장'처럼 읽히게 만든다 — 0인 등급은 뺀다 */
function summarizeTickets(tickets: EntryTickets) {
    const parts = ticketGradeSchema.options
        .filter((grade) => (tickets[grade] ?? 0) > 0)
        .map((grade) => `${TICKET_GRADE_LABEL[grade]} ${tickets[grade]}장`);
    return parts.length > 0 ? parts.join('·') : '0장';
}

export function EntryConfirmDialog({
    open,
    onOpenChange,
    title,
    tickets,
    balance,
    onConfirm,
    pending = false,
    returnFocusTo,
}: EntryConfirmDialogProps) {
    const summary = summarizeTickets(tickets);
    const total = ticketGradeSchema.options.reduce((sum, grade) => sum + (tickets[grade] ?? 0), 0);

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
                        응모권 {total}장을 사용하여 {title}에 참여합니다.
                    </DialogDescription>
                </DialogHeader>

                <dl className="flex flex-col gap-3">
                    <div className="text-body-bold text-brand-primary flex items-center justify-between">
                        <dt>응모권 사용</dt>
                        <dd>{summary}</dd>
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
                        <Button variant="secondary" className="flex-1">
                            취소
                        </Button>
                    </DialogClose>
                    <Button className="flex-1" disabled={pending} onClick={onConfirm}>
                        {pending ? '처리 중…' : '응모하기'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
