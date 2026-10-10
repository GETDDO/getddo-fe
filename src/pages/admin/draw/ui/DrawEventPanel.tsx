import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useEventDraws } from '@entities/drawResult';
import { ADMIN_STATUS_META, useAdminEvent } from '@entities/event';
import { formatKst } from '@shared/lib/date';
import { cn } from '@shared/lib/utils';
import { useVirtualClock } from '@shared/lib/virtualClock';
import { Button } from '@shared/ui/button';

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
    const { now } = useVirtualClock();
    const { data: event } = useAdminEvent(eventId);
    // 사용자가 고르지 않으면 가장 최근 실행을 본다 — AD01 첫 페이지 캐시를 목록과 공유한다
    const latest = useEventDraws(eventId, { page: 1, size: DRAW_RUN_PAGE_SIZE });
    const [chosenId, setChosenId] = useState<string | null>(null);
    const [tab, setTab] = useState<PanelTab>('runs');

    // 이벤트가 바뀌면 부모가 key로 패널을 새로 만들어 선택·페이지·탭이 초기화된다
    const selectedId = chosenId ?? latest.data?.items[0]?.id ?? null;
    const select = (drawId: string) => setChosenId(drawId);

    const status = event ? ADMIN_STATUS_META[event.status] : null;
    const awaitingFirstPublication = event?.status === 'DRAW_CONFIRMED';
    const scheduledPassed = event ? now() >= new Date(event.publicationScheduledAt) : false;

    return (
        <div className="flex flex-col gap-6">
            {event && status && (
                <section className="bg-surface-page border-border-default flex flex-col gap-3 rounded-2xl border p-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-title-3 text-fg-primary truncate">{event.title}</h2>
                        <span
                            className={cn(
                                'text-caption rounded-md px-2 py-0.5 font-medium',
                                status.chipClass,
                            )}
                        >
                            {status.label}
                        </span>
                        <Button size="sm" variant="secondary" className="ml-auto" asChild>
                            <Link to={`/admin/events/${event.id}`}>이벤트 상세</Link>
                        </Button>
                    </div>
                    <p className="text-body-sm text-fg-secondary">
                        최초 발표 예정 {formatKst(event.publicationScheduledAt)} (KST) · 마감 +
                        5분에 자동 발표하며 수동 승인은 없습니다.
                    </p>
                    {awaitingFirstPublication && (
                        <p className="text-body-sm text-fg-secondary">
                            {scheduledPassed
                                ? '예정 시각이 지났지만 아직 공개되지 않았습니다. 지연 안내 문구와 새 예정 시각의 제공 여부는 '
                                : '준비·확인이 늦어 발표가 지연될 때의 안내 문구와 새 예정 시각의 제공 여부는 '}
                            <PolicyPendingChip /> 입니다. 서버가 공개하기 전에는 결과가 공개되지
                            않습니다.
                        </p>
                    )}
                </section>
            )}

            <div role="tablist" aria-label="추첨 관리 구분" className="flex gap-1">
                {TABS.map(({ value, label }) => (
                    <button
                        key={value}
                        type="button"
                        role="tab"
                        id={`draw-tab-${value}`}
                        aria-selected={tab === value}
                        aria-controls={`draw-panel-${value}`}
                        onClick={() => setTab(value)}
                        className={cn(
                            'text-body-sm focus-visible:ring-border-focus focus-visible:ring-offset-surface-page rounded-lg px-3 py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                            tab === value
                                ? 'bg-surface-inverse text-fg-inverse font-medium'
                                : 'text-fg-secondary hover:bg-surface-sunken',
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
