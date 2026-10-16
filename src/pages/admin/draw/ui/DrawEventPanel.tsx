import type { KeyboardEvent } from 'react';

import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useEventDraws } from '@entities/drawResult';
import { ADMIN_STATUS_META, useAdminEvent } from '@entities/event';
import { formatKst } from '@shared/lib/date';
import { cn } from '@shared/lib/utils';
import { badgeVariants } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { CardSkeleton, LoadingBlock } from '@shared/ui/skeleton';

import { DrawRunDetail } from './DrawRunDetail';
import { DRAW_RUN_PAGE_SIZE, DrawRunList } from './DrawRunList';
import { PolicyPendingChip } from './PolicyPendingNotice';
import { ResultChangesSection } from './ResultChangesSection';

type PanelTab = 'runs' | 'changes';

const TABS: { value: PanelTab; label: string }[] = [
    { value: 'runs', label: '추첨 실행' },
    { value: 'changes', label: '공개 명단 변경 이력' },
];

// 이벤트 하나의 추첨 관리 — 실행 목록(AD01)·상세(AD02)·변경 이력(AD07)
export function DrawEventPanel({ eventId }: { eventId: string }) {
    const {
        data: event,
        isPending: eventPending,
        isError: eventError,
        refetch: refetchEvent,
    } = useAdminEvent(eventId);
    // 사용자가 고르지 않으면 가장 최근 실행을 본다 — AD01 첫 페이지 캐시를 목록과 공유한다
    const latest = useEventDraws(eventId, { page: 1, size: DRAW_RUN_PAGE_SIZE });
    const [chosenId, setChosenId] = useState<string | null>(null);
    const [tab, setTab] = useState<PanelTab>('runs');

    // 이벤트가 바뀌면 부모가 key로 패널을 새로 만들어 선택·페이지·탭이 초기화된다
    const selectedId = chosenId ?? latest.data?.items[0]?.id ?? null;
    const select = (drawId: string) => setChosenId(drawId);

    const status = event ? ADMIN_STATUS_META[event.status] : null;
    const awaitingFirstPublication = event?.status === 'DRAW_CONFIRMED';
    // ADR-022 — 발표 예정 시각·카운트다운은 계약에서 제외됐다. 표시 시각은 최초 자동 추첨 기준이다
    const drawScheduledAt = event?.drawScheduledAt;

    // 비선택 탭은 tabIndex=-1이라 방향키로 이동한다 — APG 탭 패턴의 roving tabindex
    const handleTabKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        const index = TABS.findIndex((t) => t.value === tab);
        const nextIndex =
            e.key === 'ArrowRight'
                ? (index + 1) % TABS.length
                : (index - 1 + TABS.length) % TABS.length;
        const nextTab = TABS[nextIndex];
        if (!nextTab) return;
        setTab(nextTab.value);
        document.getElementById(`draw-tab-${nextTab.value}`)?.focus();
    };

    return (
        <div className="flex flex-col gap-6">
            {eventPending && (
                <LoadingBlock>
                    <CardSkeleton rows={2} />
                </LoadingBlock>
            )}
            {eventError && (
                <div className="flex items-center gap-3">
                    <p role="alert" className="text-semantic-error-strong text-body-sm">
                        이벤트 정보를 불러오지 못했습니다. 이벤트 상태를 확인할 때까지 당첨
                        취소·재추첨·공개 반영을 사용할 수 없습니다.
                    </p>
                    <Button size="sm" variant="secondary" onClick={() => void refetchEvent()}>
                        다시 시도
                    </Button>
                </div>
            )}
            {event && status && (
                <section className="bg-surface-page border-border-default flex flex-col gap-3 rounded-2xl border p-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-title-3 text-fg-primary truncate">{event.title}</h2>
                        <span className={cn(badgeVariants({ variant: null }), status.chipClass)}>
                            {status.label}
                        </span>
                        <Button size="sm" variant="secondary" className="ml-auto" asChild>
                            <Link to={`/admin/events/${event.id}`}>이벤트 상세</Link>
                        </Button>
                    </div>
                    <p className="text-body-sm text-fg-secondary">
                        최초 추첨 기준{' '}
                        {drawScheduledAt ? `${formatKst(drawScheduledAt)} (KST) · ` : ''}
                        마감 + 5분에 자동 추첨하고, 최초 공개는 명단 확인 후 수동 공개 요청으로
                        진행합니다.
                    </p>
                    {awaitingFirstPublication && (
                        <p className="text-body-sm text-fg-secondary">
                            결과 확정·확인 저장만으로는 공개되지 않으며, 공개 호출의 세부 계약은{' '}
                            <PolicyPendingChip /> 입니다. 서버가 공개하기 전에는 결과가 공개되지
                            않습니다.
                        </p>
                    )}
                </section>
            )}

            <div
                role="tablist"
                aria-label="추첨 관리 구분"
                className="flex gap-1"
                onKeyDown={handleTabKeyDown}
            >
                {TABS.map(({ value, label }) => (
                    <button
                        key={value}
                        type="button"
                        role="tab"
                        id={`draw-tab-${value}`}
                        aria-selected={tab === value}
                        aria-controls={`draw-panel-${value}`}
                        tabIndex={tab === value ? 0 : -1}
                        onClick={() => setTab(value)}
                        className={cn(
                            'text-body-sm focus-visible:ring-border-focus focus-visible:ring-offset-surface-page rounded-lg px-3 py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                            tab === value
                                ? 'bg-surface-inverse text-fg-inverse font-medium'
                                : 'text-fg-secondary hover:bg-surface-pressed hover:text-fg-primary',
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {tab === 'runs' && (
                <div
                    role="tabpanel"
                    id="draw-panel-runs"
                    aria-labelledby="draw-tab-runs"
                    className="flex flex-col gap-6"
                >
                    <DrawRunList eventId={eventId} selectedId={selectedId} onSelect={select} />
                    {selectedId && (
                        <DrawRunDetail
                            key={selectedId}
                            drawId={selectedId}
                            eventCanceled={event?.status === 'CANCELED'}
                            eventReady={event != null && !eventError}
                            onRunCreated={select}
                        />
                    )}
                </div>
            )}
            {tab === 'changes' && (
                <div role="tabpanel" id="draw-panel-changes" aria-labelledby="draw-tab-changes">
                    <ResultChangesSection eventId={eventId} />
                </div>
            )}
        </div>
    );
}
