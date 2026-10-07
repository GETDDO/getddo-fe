import { createColumnHelper, flexRender, tableFeatures, useTable } from '@tanstack/react-table';
import { useMemo } from 'react';

import { formatKst } from '@shared/lib/date';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui/table';

import type { AdminEvent } from '../model/adminTypes';

import { ADMIN_STATUS_META, EVENT_TYPE_LABEL, MEMBERSHIP_LABEL } from '../model/adminStatusMeta';

const CHIP = 'text-caption rounded-md px-2 py-0.5 font-medium whitespace-nowrap';

const KST_YMD_HM: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
};

// 정렬·필터 기능 없이 행 모델만 쓰는 표시용 테이블 — 필터·페이지는 페이지가 서버로 넘긴다
const features = tableFeatures({});
const helper = createColumnHelper<typeof features, AdminEvent>();

/**
 * 관리자 이벤트 목록 테이블 — 행 클릭으로 상세로 이동한다.
 * 운영 액션(수정·취소·삭제 등)은 상세 화면에 모아 목록 행을 가볍게 둔다
 * 행 onClick만으로는 키보드가 상세를 열 수 없으므로 '상세' 버튼 열로 동일 경로를 제공한다
 */
export function AdminEventTable({
    events,
    onRowClick,
}: {
    events: AdminEvent[];
    onRowClick?: (event: AdminEvent) => void;
}) {
    const columns = useMemo(
        () =>
            helper.columns([
                helper.accessor('title', {
                    header: '이벤트',
                    cell: ({ row, getValue }) => (
                        <div className="flex max-w-64 flex-col">
                            <span className="text-body-sm text-fg-primary truncate font-medium">
                                {getValue()}
                            </span>
                            <span className="text-caption text-fg-tertiary">{row.original.id}</span>
                        </div>
                    ),
                }),
                helper.accessor('eventType', {
                    header: '유형',
                    cell: ({ row, getValue }) => (
                        <div className="flex flex-col gap-1">
                            <span className={cn(CHIP, 'bg-surface-sunken text-fg-secondary w-fit')}>
                                {EVENT_TYPE_LABEL[getValue()]}
                            </span>
                            {getValue() === 'TICKET' && (
                                <span className="text-caption text-fg-tertiary">
                                    {row.original.weightingEnabled
                                        ? `가중치 · ${row.original.maxTicketsPerUser === null ? '상한 없음' : `최대 ${row.original.maxTicketsPerUser}장`}`
                                        : '가중치 없음 · 1장'}
                                </span>
                            )}
                        </div>
                    ),
                }),
                helper.accessor('membershipRule', {
                    header: '최소 등급',
                    cell: ({ getValue }) => (
                        <span className="text-body-sm text-fg-primary whitespace-nowrap">
                            {MEMBERSHIP_LABEL[getValue()]} 이상
                        </span>
                    ),
                }),
                helper.display({
                    id: 'period',
                    header: '응모 기간',
                    cell: ({ row }) => (
                        <div className="text-body-sm text-fg-secondary flex flex-col whitespace-nowrap">
                            <span>{formatKst(row.original.startsAt, KST_YMD_HM)}</span>
                            <span>~ {formatKst(row.original.endsAt, KST_YMD_HM)}</span>
                        </div>
                    ),
                }),
                helper.accessor('prizes', {
                    header: '경품',
                    cell: ({ getValue }) => {
                        const prizes = getValue();
                        const winners = prizes.reduce((sum, p) => sum + p.winnerCount, 0);
                        return (
                            <span
                                title={prizes.map((p) => `${p.rank}등 ${p.name}`).join(', ')}
                                className="text-body-sm text-fg-primary block max-w-44 truncate"
                            >
                                {prizes.length}종 · 총 {winners}명
                            </span>
                        );
                    },
                }),
                helper.accessor('status', {
                    header: '상태',
                    cell: ({ getValue }) => {
                        const status = ADMIN_STATUS_META[getValue()];
                        return <span className={cn(CHIP, status.chipClass)}>{status.label}</span>;
                    },
                }),
                helper.accessor('createdAt', {
                    header: '등록일',
                    cell: ({ getValue }) => (
                        <span className="text-body-sm text-fg-tertiary whitespace-nowrap">
                            {formatKst(getValue(), {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                            })}
                        </span>
                    ),
                }),
                helper.display({
                    id: 'detail',
                    header: '상세',
                    cell: ({ row }) =>
                        onRowClick ? (
                            <Button
                                size="sm"
                                variant="ghost"
                                aria-label={`${row.original.title} 상세`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRowClick(row.original);
                                }}
                            >
                                상세
                            </Button>
                        ) : null,
                }),
            ]),
        [onRowClick],
    );

    const table = useTable({ features, columns, data: events });

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
                            onClick={() => onRowClick?.(row.original)}
                            className={cn(
                                'hover:bg-surface-canvas',
                                onRowClick && 'cursor-pointer',
                            )}
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
