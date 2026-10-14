import type { KeyboardEvent } from 'react';

import { useSearchParams } from 'react-router-dom';

import { cn } from '@shared/lib/utils';

import { GrantsTab } from './GrantsTab';
import { HistoriesTab } from './HistoriesTab';
import { InconsistencyTab } from './InconsistencyTab';
import { RefundsTab } from './RefundsTab';

const TABS = [
    { id: 'consistency', label: '정합성', Panel: InconsistencyTab },
    { id: 'grants', label: '지급 이력', Panel: GrantsTab },
    { id: 'histories', label: '전체 이력', Panel: HistoriesTab },
    { id: 'refunds', label: '반환 이력', Panel: RefundsTab },
] as const;

// 한 페이지 안의 탭 4개 — 정합성(AO09·AO04)이 기본이고 나머지는 보조 목록(AO03·AO05·AO08)이다.
// 선택한 탭은 ?tab= 에 두어 새로고침·링크 공유에서도 유지한다
export function AdminTicketsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const active = TABS.find((tab) => tab.id === searchParams.get('tab')) ?? TABS[0];

    // 비선택 탭은 tabIndex=-1이라 방향키로 이동한다 — APG 탭 패턴의 roving tabindex
    const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        const index = TABS.findIndex((tab) => tab.id === active.id);
        const nextIndex =
            event.key === 'ArrowRight'
                ? (index + 1) % TABS.length
                : (index - 1 + TABS.length) % TABS.length;
        const nextTab = TABS[nextIndex];
        if (!nextTab) return;
        setSearchParams({ tab: nextTab.id });
        document.getElementById(`tickets-tab-${nextTab.id}`)?.focus();
    };

    return (
        <div className="flex max-w-280 flex-col gap-6 pr-10 pb-10">
            <div
                role="tablist"
                aria-label="응모권 관리"
                className="flex gap-1"
                onKeyDown={handleTabKeyDown}
            >
                {TABS.map((tab) => {
                    const selected = tab.id === active.id;
                    return (
                        <button
                            key={tab.id}
                            id={`tickets-tab-${tab.id}`}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            aria-controls="tickets-tabpanel"
                            tabIndex={selected ? 0 : -1}
                            onClick={() => setSearchParams({ tab: tab.id })}
                            className={cn(
                                'text-body-sm focus-visible:ring-border-focus focus-visible:ring-offset-surface-canvas rounded-full px-4 py-2 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                                selected
                                    ? 'bg-action-neutral text-fg-on-brand hover:bg-action-neutral-hover active:bg-action-neutral-pressed'
                                    : 'text-fg-secondary hover:bg-surface-sunken',
                            )}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>
            <div id="tickets-tabpanel" role="tabpanel" aria-labelledby={`tickets-tab-${active.id}`}>
                <active.Panel />
            </div>
        </div>
    );
}
