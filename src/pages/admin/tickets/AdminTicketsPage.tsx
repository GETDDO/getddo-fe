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

    return (
        <div className="flex max-w-280 flex-col gap-6 pr-10 pb-10">
            <div role="tablist" aria-label="응모권 관리" className="flex gap-1">
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
                                'text-body-sm rounded-full px-4 py-2 font-medium transition-colors',
                                selected
                                    ? 'bg-action-neutral text-fg-on-brand'
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
