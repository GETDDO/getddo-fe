import { ClipboardList } from 'lucide-react';

import { MyEntryItem, useMyEntries } from '@entities/entry';
import { formatNumber } from '@shared/lib/format';

export function MyEntriesPage() {
    const { data: entries, isPending, isError } = useMyEntries();

    // 최신 응모가 위로. 같은 초에 소수 초가 있는 값과 없는 값이 섞일 수 있어 문자열이 아닌 시각으로 비교한다
    const sortedEntries = [...(entries ?? [])].sort(
        (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
    );
    // 거절된 응모는 접수 건수에서 뺀다
    const appliedEntries = sortedEntries.filter((entry) => entry.status === 'ACCEPTED');
    const usedTickets = appliedEntries.reduce((sum, entry) => sum + entry.deductedTicketCount, 0);

    return (
        <main className="mx-auto flex w-full max-w-300 flex-col gap-10 px-6 pt-20 pb-28">
            <h1 className="text-title-1 text-fg-primary">내 응모 내역</h1>

            <section className="bg-surface-page border-border-default flex flex-col gap-4 rounded-2xl border p-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-subhead text-fg-primary">응모한 이벤트</h2>
                    <ClipboardList className="text-fg-primary size-6" />
                </div>
                {isPending && <p className="text-body-sm text-fg-tertiary">불러오는 중…</p>}
                {isError && (
                    <p className="text-destructive text-body-sm">
                        응모 내역을 불러오지 못했습니다.
                    </p>
                )}
                {!isPending && !isError && (
                    <div className="flex flex-col gap-1">
                        <p className="text-display text-fg-primary">
                            {formatNumber(appliedEntries.length)}
                            <span className="text-title-3"> 건</span>
                        </p>
                        {usedTickets > 0 && (
                            <p className="text-body-sm text-fg-secondary">
                                응모권 {formatNumber(usedTickets)}장 사용
                            </p>
                        )}
                    </div>
                )}
            </section>

            <section className="flex flex-col gap-2">
                <h2 className="text-subhead text-fg-primary">응모 기록</h2>
                <p className="text-body-sm text-fg-tertiary">
                    당첨 결과는 발표 후 추첨 결과 화면에서 확인할 수 있어요
                </p>
                {isPending && <p className="text-body-sm text-fg-tertiary">불러오는 중…</p>}
                {isError && (
                    <p className="text-destructive text-body-sm">
                        응모 내역을 불러오지 못했습니다.
                    </p>
                )}
                {!isPending && !isError && sortedEntries.length === 0 && (
                    <p className="text-fg-tertiary text-body-sm py-6">아직 응모한 내역이 없어요.</p>
                )}
                {sortedEntries.length > 0 && (
                    <ul className="divide-border-default divide-y">
                        {sortedEntries.map((entry) => (
                            <MyEntryItem key={entry.id} entry={entry} />
                        ))}
                    </ul>
                )}
            </section>
        </main>
    );
}
