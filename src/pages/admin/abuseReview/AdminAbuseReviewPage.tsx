import { useState } from 'react';

import type { AbuseCase, AbuseCaseStatus } from '@entities/abuseCase';

import { AbuseCaseCard, useAbuseCases } from '@entities/abuseCase';
import { ReviewAbuseDialog } from '@features/reviewAbuseCase';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';

const FILTERS: { value: 'all' | AbuseCaseStatus; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'pending', label: '검토 대기' },
    { value: 'allowed', label: '참여 허용' },
    { value: 'excluded', label: '추첨 대상 제외' },
];

export function AdminAbuseReviewPage() {
    const { data: cases, isPending, isError } = useAbuseCases();
    const [filter, setFilter] = useState<'all' | AbuseCaseStatus>('pending');
    const [reviewing, setReviewing] = useState<AbuseCase | null>(null);

    const sorted = [...(cases ?? [])].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
    const filtered = filter === 'all' ? sorted : sorted.filter((c) => c.status === filter);
    const pendingCount = sorted.filter((c) => c.status === 'pending').length;

    return (
        <div className="flex max-w-200 flex-col gap-6 pr-10 pb-10">
            <div className="flex items-center justify-between gap-4">
                <div className="flex gap-1">
                    {FILTERS.map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setFilter(value)}
                            className={cn(
                                'text-body-sm focus-visible:ring-border-focus rounded-lg px-3 py-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none',
                                filter === value
                                    ? 'bg-surface-inverse text-fg-inverse font-medium'
                                    : 'text-fg-secondary hover:bg-surface-sunken',
                            )}
                        >
                            {label}
                            {value === 'pending' && pendingCount > 0 ? ` ${pendingCount}` : ''}
                        </button>
                    ))}
                </div>
            </div>

            {isPending && <p className="text-body-sm text-fg-tertiary">불러오는 중…</p>}
            {isError && (
                <p className="text-destructive text-body-sm">탐지 목록을 불러오지 못했습니다.</p>
            )}
            {!isPending && !isError && filtered.length === 0 && (
                <p className="text-fg-tertiary text-body-sm py-6">
                    {filter === 'pending'
                        ? '검토 대기 중인 탐지 건이 없습니다.'
                        : '해당하는 탐지 건이 없습니다.'}
                </p>
            )}
            {filtered.length > 0 && (
                <ul className="flex flex-col gap-3">
                    {filtered.map((abuseCase) => (
                        <AbuseCaseCard
                            key={abuseCase.id}
                            abuseCase={abuseCase}
                            action={
                                abuseCase.status === 'pending' ? (
                                    <Button size="sm" onClick={() => setReviewing(abuseCase)}>
                                        검토
                                    </Button>
                                ) : undefined
                            }
                        />
                    ))}
                </ul>
            )}

            <ReviewAbuseDialog
                abuseCase={reviewing}
                open={reviewing !== null}
                onOpenChange={(open) => {
                    if (!open) setReviewing(null);
                }}
            />
        </div>
    );
}
