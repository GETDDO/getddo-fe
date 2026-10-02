import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

import type { Event } from '@entities/event';

import { useEvent } from '@entities/event';
import { useTicketWallets } from '@entities/ticket';
import { useEnterEvent } from '@features/enterEvent';
import { Button } from '@shared/ui/button';

import { EntryCompleteDialog } from './ui/EntryCompleteDialog';
import { EntryConfirmDialog } from './ui/EntryConfirmDialog';
import { InsufficientTicketsDialog } from './ui/InsufficientTicketsDialog';
import { MyTicketCard } from './ui/MyTicketCard';
import { QuantityStepper } from './ui/QuantityStepper';
import { RaffleDetailHero } from './ui/RaffleDetailHero';
import { RaffleDetailsCard } from './ui/RaffleDetailsCard';
import { RaffleRulesCard } from './ui/RaffleRulesCard';

const CONTAINER = 'mx-auto w-full max-w-312 px-6 pt-20 pb-47.5';

/** ADR-010 — 가중치 적용 이벤트는 사용자·이벤트별 누적 5장까지만 쓸 수 있다 */
const ENTRY_TICKET_LIMIT = 5;

/** 응모도 결과 확인도 할 수 없는 상태에서 버튼에 대신 표시하는 문구 */
const STATUS_LABEL: Record<Exclude<Event['status'], 'drawn'>, string> = {
    open: '응모하기',
    upcoming: '오픈 예정',
    closed: '추첨 진행 중',
};

export function TimeRaffleDetailPage() {
    const { id = '' } = useParams();
    const { data: event, isPending, isError } = useEvent(id);
    const { data: ticket } = useTicketWallets();
    const enterEvent = useEnterEvent(id);
    const [quantity, setQuantity] = useState(1);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [shortfallOpen, setShortfallOpen] = useState(false);
    const [completeOpen, setCompleteOpen] = useState(false);
    // 완료 모달이 쓸 값 — 접수 직후에는 이벤트 쿼리가 아직 갱신 전이라 응답 기준으로 계산해 담아 둔다
    const [lastDeductedCount, setLastDeductedCount] = useState(0);
    const [lastRemaining, setLastRemaining] = useState(0);
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
    const alreadyUsed = event.myTicketCount ?? (event.myEntryCount ?? 0) * event.requiredTickets;
    const maxQuantity = Math.max(0, ENTRY_TICKET_LIMIT - alreadyUsed);
    const canEnter = isOpen && maxQuantity >= 1;
    // 잔액을 아직 못 받았으면 부족하다고 단정하지 않고 확인 모달로 보낸다 (최종 판정은 서버 응답)
    const hasEnoughTickets = ticket == null || ticket.availableBalance >= quantity;

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
                                size="lg"
                                disabled={!canEnter}
                                onClick={() =>
                                    hasEnoughTickets ? setConfirmOpen(true) : setShortfallOpen(true)
                                }
                                className="w-full"
                            >
                                {!canEnter
                                    ? '응모 완료'
                                    : alreadyUsed > 0
                                      ? '추가 응모하기'
                                      : '응모하기'}
                            </Button>
                        ) : event.status === 'drawn' ? (
                            // 발표 여부는 서버가 내려준 status로만 판단한다 —
                            // 화면의 카운트다운이 0이 됐다고 결과를 열어 주지 않는다 (docs/CONTEXT.md)
                            <Button
                                variant="emphasis"
                                size="lg"
                                onClick={() => {
                                    // TODO: 결과 화면은 GD-24 「추첨 결과 페이지 프론트 화면 개발」에서 연결한다
                                    toast.info('당첨 결과 발표 화면은 준비 중이에요.');
                                }}
                                className="w-full"
                            >
                                당첨 결과 발표 보기
                            </Button>
                        ) : (
                            <Button disabled size="lg" className="w-full">
                                {STATUS_LABEL[event.status]}
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
                balance={ticket?.availableBalance ?? null}
                returnFocusTo={entryButtonRef}
                pending={enterEvent.isPending}
                onConfirm={() => {
                    enterEvent.mutate(quantity, {
                        onSuccess: (entry) => {
                            setConfirmOpen(false);
                            setLastDeductedCount(entry.deductedTicketCount);
                            setLastRemaining(Math.max(0, maxQuantity - entry.deductedTicketCount));
                            // 한도가 줄어들어 지금 수량이 범위를 벗어날 수 있으므로 되돌린다
                            setQuantity(1);
                            setCompleteOpen(true);
                        },
                        onError: () => {
                            setConfirmOpen(false);
                            toast.error('응모에 실패했어요. 잠시 후 다시 시도해 주세요.');
                        },
                    });
                }}
            />

            <InsufficientTicketsDialog
                open={shortfallOpen}
                onOpenChange={setShortfallOpen}
                returnFocusTo={entryButtonRef}
            />

            <EntryCompleteDialog
                open={completeOpen}
                onOpenChange={setCompleteOpen}
                deductedTicketCount={lastDeductedCount}
                remainingAllowance={lastRemaining}
                returnFocusTo={entryButtonRef}
            />
        </main>
    );
}
