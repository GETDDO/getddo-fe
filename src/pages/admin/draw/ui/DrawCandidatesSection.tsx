import { useState } from 'react';

import { useDrawCandidates } from '@entities/drawResult';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui/table';

import { PagedFooter } from './PagedFooter';

const PAGE_SIZE = 10;

const GRADES = [
    ['bronze', '브론즈'],
    ['silver', '실버'],
    ['gold', '골드'],
] as const;

// 등급별 실제 차감 장수 — entrySnapshot은 계약상 자유 객체라 알려진 키만 읽는다
const gradeSummary = (snapshot: Record<string, unknown>) =>
    GRADES.filter(([key]) => typeof snapshot[key] === 'number' && snapshot[key] > 0)
        .map(([key, label]) => `${label} ${snapshot[key] as number}`)
        .join(' · ') || '—';

// AD03 — 이 실행이 실제 사용한 후보 명단 (실행 시점에 고정된 스냅샷)
export function DrawCandidatesSection({ drawId }: { drawId: string }) {
    const [page, setPage] = useState(1);
    const { data, isPending, isError } = useDrawCandidates(drawId, { page, size: PAGE_SIZE });

    return (
        <section
            aria-labelledby="draw-candidates-title"
            className="bg-surface-page border-border-default flex flex-col gap-4 rounded-2xl border p-6"
        >
            <div className="flex flex-col gap-1">
                <h3 id="draw-candidates-title" className="text-body-bold text-fg-primary">
                    후보 명단
                </h3>
                <p className="text-caption text-fg-tertiary">
                    응모권 수는 실제 차감 장수, 가중치는 등급별 값(브론즈 1·실버 3·골드 5)을 곱해
                    합산한 값입니다. 재추첨 후보는 기존 당첨자·취소자를 제외하며 최초 후보의
                    스냅샷을 재사용합니다.
                </p>
            </div>

            {isPending && <p className="text-body-sm text-fg-tertiary">불러오는 중…</p>}
            {isError && (
                <p role="alert" className="text-destructive text-body-sm">
                    후보 명단을 불러오지 못했습니다.
                </p>
            )}
            {data && data.items.length === 0 && (
                <p className="text-body-sm text-fg-tertiary">후보가 없습니다.</p>
            )}
            {data && data.items.length > 0 && (
                <>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>사용자</TableHead>
                                <TableHead>응모권 수</TableHead>
                                <TableHead>가중치</TableHead>
                                <TableHead>등급별 차감</TableHead>
                                <TableHead>멤버십</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.items.map((candidate) => (
                                <TableRow key={candidate.id} className="hover:bg-transparent">
                                    <TableCell className="font-medium">
                                        {candidate.userId}
                                    </TableCell>
                                    <TableCell>{candidate.ticketCount}장</TableCell>
                                    <TableCell>{candidate.weight}</TableCell>
                                    <TableCell className="text-fg-secondary">
                                        {gradeSummary(candidate.entrySnapshot)}
                                    </TableCell>
                                    <TableCell className="text-fg-secondary">
                                        {typeof candidate.eligibilitySnapshot.membership ===
                                        'string'
                                            ? candidate.eligibilitySnapshot.membership
                                            : '—'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <PagedFooter
                        page={page}
                        size={PAGE_SIZE}
                        totalElements={data.totalElements}
                        onPageChange={setPage}
                    />
                </>
            )}
        </section>
    );
}
