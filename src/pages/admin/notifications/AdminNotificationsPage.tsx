import { useSearchParams } from 'react-router-dom';

import { cn } from '@shared/lib/utils';

import { DeliveriesTab } from './DeliveriesTab';
import { JobsTab } from './JobsTab';

const TABS = [
    { id: 'jobs', label: '알림 작업', Panel: JobsTab },
    { id: 'deliveries', label: '발송 이력', Panel: DeliveriesTab },
] as const;

// 관리자 알림 운영 — 생성 작업(AN01~AN03)이 기본이고 개별 발송 이력(AN04·AN05)은 보조다.
// 선택한 탭은 ?tab= 에 두어 새로고침·링크 공유에서도 유지한다
export function AdminNotificationsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const active = TABS.find((tab) => tab.id === searchParams.get('tab')) ?? TABS[0];

    return (
        <div className="flex max-w-280 flex-col gap-6 pr-10 pb-10">
            <div role="tablist" aria-label="알림 운영" className="flex gap-1">
                {TABS.map((tab) => {
                    const selected = tab.id === active.id;
                    return (
                        <button
                            key={tab.id}
                            id={`notifications-tab-${tab.id}`}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            aria-controls="notifications-tabpanel"
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
            <div
                id="notifications-tabpanel"
                role="tabpanel"
                aria-labelledby={`notifications-tab-${active.id}`}
            >
                <active.Panel />
            </div>
        </div>
    );
}
