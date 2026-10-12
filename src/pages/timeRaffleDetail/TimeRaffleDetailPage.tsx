import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

import type { EntryTickets, TicketsByGrade } from '@entities/entry';
import type { Event } from '@entities/event';

import { useEventResults } from '@entities/drawResult';
import { useEntryEligibility } from '@entities/entry';
import { useEvent } from '@entities/event';
import { ticketGradeSchema, useMyTickets } from '@entities/ticket';
import { useEnterEvent } from '@features/enterEvent';
import { Button } from '@shared/ui/button';

import { DrawResultSection } from './ui/DrawResultSection';
import { EntryCompleteDialog } from './ui/EntryCompleteDialog';
import { EntryConfirmDialog } from './ui/EntryConfirmDialog';
import { GradeTicketSteppers } from './ui/GradeTicketSteppers';
import { InsufficientTicketsDialog } from './ui/InsufficientTicketsDialog';
import { MyTicketCard } from './ui/MyTicketCard';
import { RaffleDetailHero } from './ui/RaffleDetailHero';
import { RaffleDetailsCard } from './ui/RaffleDetailsCard';
import { RaffleRulesCard } from './ui/RaffleRulesCard';

const CONTAINER = 'mx-auto w-full max-w-312 px-6 pt-20 pb-47.5';

/** 응모도 결과 확인도 할 수 없는 상태에서 버튼에 대신 표시하는 문구 */
const STATUS_LABEL: Record<Exclude<Event['status'], 'drawn'>, string> = {
    open: '응모하기',
    upcoming: '오픈 예정',
    closed: '추첨 진행 중',
};

export function TimeRaffleDetailPage() {
    const { id = '' } = useParams();
    const { data: event, isPending, isError } = useEvent(id);
    const { data: ticket } = useMyTickets();
    // 응모 자격은 서버 판정으로 받는다 — 진행 중일 때만 조회한다 (E07)
    const { data: eligibility } = useEntryEligibility(id, {
        enabled: event?.status === 'open',
    });
    // 마감 전에는 결과가 존재하지 않으므로 묻지 않는다
    const { data: results } = useEventResults(
        id,
        event?.status === 'closed' || event?.status === 'drawn',
    );
    const enterEvent = useEnterEvent(id);
    // 가중치 적용 이벤트에서 사용자가 등급별로 고르는 장수 — 기본은 브론즈 1장
    const [tickets, setTickets] = useState<TicketsByGrade>({ BRONZE: 1, SILVER: 0, GOLD: 0 });
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [shortfallOpen, setShortfallOpen] = useState(false);
    const [completeOpen, setCompleteOpen] = useState(false);
    // 완료 모달이 쓸 값 — 접수 직후에는 이벤트 쿼리가 아직 갱신 전이라 응답 기준으로 계산해 담아 둔다
    const [lastDeductedCount, setLastDeductedCount] = useState(0);
    const [lastRemaining, setLastRemaining] = useState<number | null>(0);
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
    const isFree = event.eventType === 'NO_TICKET';
    const isWeighted = event.eventType === 'TICKET' && event.weightingEnabled;
    const selectedTotal = tickets.BRONZE + tickets.SILVER + tickets.GOLD;

    // 자격 판정이 아직 안 왔으면 이벤트 카운터로 근사한다 — 서버 판정(E07)이 오면 그 값을 따른다
    const alreadyUsed =
        eligibility?.usedTicketCount ??
        event.myTicketCount ??
        (event.myEntryCount ?? 0) * event.requiredTickets;
    const remainingLimit =
        eligibility?.remainingTicketLimit ??
        (event.maxTicketsPerUser === null
            ? null
            : Math.max(0, event.maxTicketsPerUser - alreadyUsed));
    const canEnter = isOpen && (eligibility?.canEnter ?? (isFree || (remainingLimit ?? 0) >= 1));

    // 요청에 실을 장수 맵 — 미사용은 빈 맵, 미적용은 브론즈 1장 고정, 가중치는 등급별 선택
    const requestedTickets: EntryTickets = isFree ? {} : isWeighted ? tickets : { BRONZE: 1 };
    // 가중치 이벤트에서 아무 등급도 고르지 않으면 보낼 요청이 없다
    const needsSelection = isWeighted && selectedTotal < 1;

    // 잔액을 아직 못 받았으면 부족하다고 단정하지 않고 확인 모달로 보낸다 (최종 판정은 서버 응답)
    const hasEnoughTickets =
        ticket == null ||
        isFree ||
        (isWeighted
            ? ticketGradeSchema.options.every(
                  (grade) => tickets[grade] <= ticket.countByGrade[grade],
              )
            : ticket.countByGrade.BRONZE >= 1);

    return (
        <main className={CONTAINER}>
            <div className="flex flex-col gap-10">
                <RaffleDetailHero
                    event={event}
                    quantityControl={
                        !isOpen ? undefined : isWeighted ? (
                            <GradeTicketSteppers
                                value={tickets}
                                onChange={setTickets}
                                availableByGrade={ticket?.countByGrade ?? null}
                                remainingLimit={remainingLimit}
                            />
                        ) : isFree ? undefined : (
                            // 가중치 미적용 이벤트는 브론즈 1장 고정이라 고를 수량이 없다
                            <p className="text-body-bold text-fg-primary">
                                브론즈 응모권 1장으로 참여해요
                            </p>
                        )
                    }
                    cta={
                        isOpen ? (
                            <Button
                                ref={entryButtonRef}
                                size="lg"
                                disabled={!canEnter || needsSelection}
                                onClick={() =>
                                    hasEnoughTickets ? setConfirmOpen(true) : setShortfallOpen(true)
                                }
                                className="w-full"
                            >
                                {!canEnter
                                    ? '응모 완료'
                                    : needsSelection
                                      ? '응모권을 골라주세요'
                                      : alreadyUsed > 0
                                        ? '추가 응모하기'
                                        : '응모하기'}
                            </Button>
                        ) : // 발표가 끝난 래플은 결과가 바로 아래에 있어 따로 누를 것이 없다
                        event.status === 'drawn' ? undefined : (
                            <Button disabled size="lg" className="w-full">
                                {STATUS_LABEL[event.status]}
                            </Button>
                        )
                    }
                />
                {results && <DrawResultSection event={event} results={results} />}
                <MyTicketCard event={event} />
                <RaffleDetailsCard event={event} />
                <RaffleRulesCard event={event} />
            </div>

            <EntryConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title={event.title}
                tickets={requestedTickets}
                balance={ticket?.availableCount ?? null}
                returnFocusTo={entryButtonRef}
                pending={enterEvent.isPending}
                onConfirm={() => {
                    enterEvent.mutate(requestedTickets, {
                        onSuccess: (entry) => {
                            setConfirmOpen(false);
                            setLastDeductedCount(entry.deductedTicketCount);
                            setLastRemaining(
                                remainingLimit === null
                                    ? null
                                    : Math.max(0, remainingLimit - entry.deductedTicketCount),
                            );
                            // 한도가 줄어들어 지금 선택이 범위를 벗어날 수 있으므로 되돌린다
                            setTickets({ BRONZE: 1, SILVER: 0, GOLD: 0 });
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
                bronzeRequired={!isFree && !isWeighted}
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
