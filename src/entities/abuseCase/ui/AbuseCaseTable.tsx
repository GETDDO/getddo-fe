import { createColumnHelper, flexRender, tableFeatures, useTable } from '@tanstack/react-table';
import { useMemo } from 'react';

import { formatKst } from '@shared/lib/date';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui/table';

import type { AbuseCase, AbuseCaseStatus, AbuseCaseTarget, RewardSource } from '../model/types';

const TARGET_LABEL: Record<AbuseCaseTarget, string> = {
    entry: '이벤트 응모',
    'ticket-reward': '응모권 지급',
};

const REWARD_SOURCE_LABEL: Record<RewardSource, string> = {
    attendance: '출석',
    mission: '미션',
    game: '게임',
};

const STATUS_META: Record<AbuseCaseStatus, { label: string; chipClass: string }> = {
    pending: { label: '검토 대기', chipClass: 'bg-status-pending text-status-pending-text' },
    allowed: { label: '참여 허용', chipClass: 'bg-status-approved text-status-approved-text' },
    excluded: {
        label: '추첨 대상 제외',
        chipClass: 'bg-status-rejected text-status-rejected-text',
    },
};

const CHIP = 'text-caption rounded-md px-2 py-0.5 font-medium whitespace-nowrap';

const subjectOf = (abuseCase: AbuseCase) =>
    abuseCase.target === 'entry'
        ? (abuseCase.eventTitle ?? '-')
        : `${REWARD_SOURCE_LABEL[abuseCase.rewardSource ?? 'attendance']} 지급`;

// 정렬·필터 기능 없이 행 모델만 쓰는 표시용 테이블 — 기능 슬롯을 등록하지 않아 번들도 가볍다
const features = tableFeatures({});
const helper = createColumnHelper<typeof features, AbuseCase>();

/**
 * 어뷰징 탐지 목록 테이블 — 카드 나열보다 행 단위 비교·검토가 빠른 관리자 화면용 표시다.
 * onReview는 검토 대기 건의 액션 열에만 쓰인다
 */
export function AbuseCaseTable({
    cases,
    onReview,
}: {
    cases: AbuseCase[];
    onReview?: (abuseCase: AbuseCase) => void;
}) {
    const columns = useMemo(
        () =>
            helper.columns([
                helper.accessor('detectedAt', {
                    header: '탐지 시각',
                    cell: ({ getValue }) => (
                        <span className="text-fg-secondary text-body-sm whitespace-nowrap">
                            {formatKst(getValue())}
                        </span>
                    ),
                }),
                helper.accessor('target', {
                    header: '구분',
                    cell: ({ getValue }) => (
                        <span className={cn(CHIP, 'bg-surface-sunken text-fg-secondary')}>
                            {TARGET_LABEL[getValue()]}
                        </span>
                    ),
                }),
                helper.display({
                    id: 'user',
                    header: '사용자',
                    cell: ({ row }) => (
                        <div className="flex flex-col">
                            <span className="text-body-sm text-fg-primary">
                                {row.original.userNickname}
                            </span>
                            <span className="text-caption text-fg-tertiary">
                                {row.original.userId}
                            </span>
                        </div>
                    ),
                }),
                helper.display({
                    id: 'subject',
                    header: '대상',
                    cell: ({ row }) => (
                        <span className="text-body-sm text-fg-primary">
                            {subjectOf(row.original)}
                        </span>
                    ),
                }),
                helper.accessor('reason', {
                    header: '탐지 사유',
                    cell: ({ getValue }) => (
                        // 긴 사유는 말줄임으로 잘라 표를 찢지 않고, 전체 문구는 title로 본다
                        <span
                            title={getValue()}
                            className="text-body-sm text-fg-primary block max-w-60 truncate"
                        >
                            {getValue()}
                        </span>
                    ),
                }),
                helper.accessor('requestSummary', {
                    header: '관련 요청',
                    cell: ({ getValue }) => (
                        <span
                            title={getValue()}
                            className="text-body-sm text-fg-tertiary block max-w-50 truncate"
                        >
                            {getValue()}
                        </span>
                    ),
                }),
                helper.accessor('status', {
                    header: '상태',
                    cell: ({ getValue }) => {
                        const status = STATUS_META[getValue()];
                        return <span className={cn(CHIP, status.chipClass)}>{status.label}</span>;
                    },
                }),
                helper.display({
                    id: 'review',
                    header: '검토',
                    cell: ({ row }) => {
                        const abuseCase = row.original;
                        if (abuseCase.status === 'pending') {
                            return (
                                <Button size="sm" onClick={() => onReview?.(abuseCase)}>
                                    검토
                                </Button>
                            );
                        }
                        // 검토가 끝난 건은 검토자·시각과 사유(말줄임+툴팁)를 남긴다
                        if (!abuseCase.review) return null;
                        return (
                            <div
                                title={abuseCase.review.note}
                                className="text-caption text-fg-tertiary max-w-44 truncate"
                            >
                                {abuseCase.review.reviewer} ·{' '}
                                {formatKst(abuseCase.review.reviewedAt)}
                            </div>
                        );
                    },
                }),
            ]),
        [onReview],
    );

    const table = useTable({ features, columns, data: cases });

    return (
        <div className="bg-surface-page border-border-default overflow-hidden rounded-2xl border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="hover:bg-transparent">
                            {headerGroup.headers.map((header) => (
                                <TableHead
                                    key={header.id}
                                    className="text-caption text-fg-tertiary h-11 px-4 font-semibold"
                                >
                                    {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext(),
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} className="hover:bg-surface-canvas">
                            {row.getAllCells().map((cell) => (
                                <TableCell key={cell.id} className="px-4 py-3 align-top">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
