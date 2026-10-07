import { createColumnHelper, flexRender, tableFeatures, useTable } from '@tanstack/react-table';
import { useMemo } from 'react';

import { formatKst } from '@shared/lib/date';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui/table';

import type { AuditLogSummary } from '../model/types';

import { auditActionLabel, auditTargetTypeLabel } from '../model/types';

const CHIP = 'text-caption rounded-md px-2 py-0.5 font-medium whitespace-nowrap';

// 정렬·필터는 서버 쿼리로 처리하므로 행 모델만 쓰는 표시용 테이블 — 기능 슬롯을 등록하지 않는다
const features = tableFeatures({});
const helper = createColumnHelper<typeof features, AuditLogSummary>();

/**
 * 감사 로그 목록 테이블 — 시각·작업·처리자·대상·사유를 행 단위로 비교한다.
 * 행 클릭은 상세 드로어를 여는 onRowClick에 위임한다
 */
export function AuditLogTable({
    logs,
    onRowClick,
}: {
    logs: AuditLogSummary[];
    onRowClick?: (log: AuditLogSummary) => void;
}) {
    const columns = useMemo(
        () =>
            helper.columns([
                helper.accessor('createdAt', {
                    header: '시각',
                    cell: ({ getValue }) => (
                        <span className="text-fg-secondary text-body-sm whitespace-nowrap">
                            {formatKst(getValue())}
                        </span>
                    ),
                }),
                helper.accessor('action', {
                    header: '작업',
                    cell: ({ getValue }) => (
                        <span className={cn(CHIP, 'bg-surface-sunken text-fg-secondary')}>
                            {auditActionLabel(getValue())}
                        </span>
                    ),
                }),
                helper.accessor('actorId', {
                    header: '처리자',
                    cell: ({ getValue }) => (
                        <span className="text-body-sm text-fg-primary">
                            {getValue() ?? '시스템'}
                        </span>
                    ),
                }),
                helper.display({
                    id: 'target',
                    header: '대상',
                    cell: ({ row }) => (
                        <div className="flex flex-col">
                            <span className="text-body-sm text-fg-primary">
                                {auditTargetTypeLabel(row.original.targetType)}
                            </span>
                            <span
                                title={row.original.targetId}
                                className="text-caption text-fg-tertiary max-w-44 truncate"
                            >
                                {row.original.targetId}
                            </span>
                        </div>
                    ),
                }),
                helper.accessor('reason', {
                    header: '사유',
                    cell: ({ getValue }) => {
                        const reason = getValue();
                        if (!reason)
                            return <span className="text-fg-tertiary text-body-sm">-</span>;
                        // 긴 사유는 말줄임으로 잘라 표를 찢지 않고, 전체 문구는 title로 본다
                        return (
                            <span
                                title={reason}
                                className="text-body-sm text-fg-primary block max-w-60 truncate"
                            >
                                {reason}
                            </span>
                        );
                    },
                }),
                // 행 onClick만으로는 키보드가 상세를 열 수 없다 — 이름 있는 버튼으로 동일 경로를 제공한다
                helper.display({
                    id: 'detail',
                    header: '상세',
                    cell: ({ row }) => (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRowClick?.(row.original);
                            }}
                        >
                            상세
                        </Button>
                    ),
                }),
            ]),
        [onRowClick],
    );

    const table = useTable({ features, columns, data: logs });

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
                        <TableRow
                            key={row.id}
                            className={cn(
                                'hover:bg-surface-canvas',
                                onRowClick && 'cursor-pointer',
                            )}
                            onClick={() => onRowClick?.(row.original)}
                        >
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
