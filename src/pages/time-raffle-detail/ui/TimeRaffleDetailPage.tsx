import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import type { Event } from '@entities/event';

import { useEvent } from '@entities/event';
import { useTicketBalance } from '@entities/ticket';
import { Button } from '@shared/ui/button';

import { EntryConfirmDialog } from './EntryConfirmDialog';
import { InsufficientTicketsDialog } from './InsufficientTicketsDialog';
import { MyTicketCard } from './MyTicketCard';
import { QuantityStepper } from './QuantityStepper';
import { RaffleDetailHero } from './RaffleDetailHero';
import { RaffleDetailsCard } from './RaffleDetailsCard';
import { RaffleRulesCard } from './RaffleRulesCard';

const CONTAINER = 'mx-auto w-full max-w-300 px-6 pt-20 pb-47.5';

/** ADR-010 — 가중치 적용 이벤트는 사용자·이벤트별 누적 5장까지만 쓸 수 있다 */
const ENTRY_TICKET_LIMIT = 5;

/** 진행 중이 아닐 때 버튼에 상태를 대신 표시한다 */
const STATUS_LABEL: Record<Event['status'], string> = {
    open: '응모하기',
    upcoming: '오픈 예정',
    closed: '추첨 진행 중',
    drawn: '추첨 완료',
};

export function TimeRaffleDetailPage() {
    const { id = '' } = useParams();
    const { data: event, isPending, isError } = useEvent(id);
    const { data: ticket } = useTicketBalance();
    const [quantity, setQuantity] = useState(1);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [shortfallOpen, setShortfallOpen] = useState(false);
    // 모달을 닫으면 방금 누른 응모 버튼으로 포커스를 되돌린다
    const entryButtonRef = useRef<HTMLButtonElement>(null);

    if (isPending) {
        return (
            <main className={CONTAINER}>
                <p className="text-fg-tertiary text-body-sm">불러오는 중…</p>
            </main>
        );
    }

    if (isError) {
        return (
            <main className={CONTAINER}>
                <p className="text-destructive text-body-sm">래플을 불러오지 못했습니다.</p>
            </main>
        );
    }

    const isOpen = event.status === 'open';
    // 이미 쓴 만큼을 빼고 남은 한도까지 고를 수 있다.
    // 보유 잔액으로는 막지 않는다 — 여기서 잘라 버리면 부족한 수량을 고를 수 없어 안내 모달을 띄울 일이 없어진다
    const alreadyUsed = (event.myEntryCount ?? 0) * event.requiredTickets;
    const maxQuantity = Math.max(0, ENTRY_TICKET_LIMIT - alreadyUsed);
    const canEnter = isOpen && maxQuantity >= 1;
    // 잔액을 아직 못 받았으면 부족하다고 단정하지 않고 확인 모달로 보낸다 (최종 판정은 서버 응답)
    const hasEnoughTickets = ticket == null || ticket.balance >= quantity;

    return (
        <main className={CONTAINER}>
            <div className="flex flex-col gap-10">
                <RaffleDetailHero
                    event={event}
                    quantityControl={
                        isOpen ? (
                            <QuantityStepper
                                value={quantity}
                                min={1}
                                max={Math.max(1, maxQuantity)}
                                onChange={setQuantity}
                            />
                        ) : undefined
                    }
                    cta={
                        isOpen ? (
                            <Button
                                ref={entryButtonRef}
                                variant="secondary"
                                disabled={!canEnter}
                                onClick={() =>
                                    hasEnoughTickets ? setConfirmOpen(true) : setShortfallOpen(true)
                                }
                                className="h-12 w-full"
                            >
                                <span className="text-body-bold">
                                    {canEnter ? '응모하기' : '응모 한도 도달'}
                                </span>
                            </Button>
                        ) : (
                            <Button
                                disabled
                                className="bg-surface-disabled h-12 w-full disabled:opacity-100"
                            >
                                <span className="text-body-bold text-fg-disabled">
                                    {STATUS_LABEL[event.status]}
                                </span>
                            </Button>
                        )
                    }
                />
                <MyTicketCard event={event} />
                <RaffleDetailsCard event={event} />
                <RaffleRulesCard event={event} />
            </div>

            <EntryConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title={event.title}
                quantity={quantity}
                balance={ticket?.balance ?? null}
                returnFocusTo={entryButtonRef}
                onConfirm={() => {
                    // TODO: 실제 응모 요청은 GD-25 「응모 페이지 프론트 화면 개발」에서 features/enter-event로 붙인다
                    setConfirmOpen(false);
                }}
            />

            <InsufficientTicketsDialog
                open={shortfallOpen}
                onOpenChange={setShortfallOpen}
                returnFocusTo={entryButtonRef}
            />
        </main>
    );
}
