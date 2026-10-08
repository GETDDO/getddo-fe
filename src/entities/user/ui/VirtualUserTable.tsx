import { createColumnHelper, flexRender, tableFeatures, useTable } from '@tanstack/react-table';
import { useMemo } from 'react';

import { cn } from '@shared/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui/table';

import type { UserRole, VirtualUser } from '../model/types';

const ROLE_LABEL: Record<UserRole, string> = {
    USER: '사용자',
    ADMIN: '관리자',
};

const CHIP = 'text-caption rounded-md px-2 py-0.5 font-medium whitespace-nowrap';

// 정렬·필터 기능 없이 행 모델만 쓰는 표시용 테이블 — 기능 슬롯을 등록하지 않아 번들도 가볍다
const features = tableFeatures({});
const helper = createColumnHelper<typeof features, VirtualUser>();

/**
 * 가상 사용자 조회 테이블 — 수정·삭제 기능이 없는 읽기 전용 표시다.
 * currentUserId는 지금 이 브라우저 세션으로 선택된 사용자를 표시하는 데 쓴다
 */
export function VirtualUserTable({
    users,
    currentUserId,
}: {
    users: VirtualUser[];
    currentUserId?: string | null;
}) {
    const columns = useMemo(
        () =>
            helper.columns([
                helper.accessor('name', {
                    header: '이름',
                    cell: ({ getValue }) => (
                        <span className="text-body-bold text-fg-primary">{getValue()}</span>
                    ),
                }),
                helper.accessor('id', {
                    header: '사용자 ID',
                    cell: ({ getValue }) => (
                        <span className="text-caption text-fg-tertiary">{getValue()}</span>
                    ),
                }),
                helper.accessor('role', {
                    header: '역할',
                    cell: ({ getValue }) => (
                        <span
                            className={cn(
                                CHIP,
                                getValue() === 'ADMIN'
                                    ? 'bg-status-approved text-status-approved-text'
                                    : 'bg-surface-sunken text-fg-secondary',
                            )}
                        >
                            {ROLE_LABEL[getValue()]}
                        </span>
                    ),
                }),
                helper.accessor('personaLabel', {
                    header: '페르소나',
                    cell: ({ getValue }) => (
                        <span className="text-body-sm text-fg-secondary">{getValue() ?? '-'}</span>
                    ),
                }),
                helper.display({
                    id: 'session',
                    header: '현재 세션',
                    cell: ({ row }) =>
                        row.original.id === currentUserId ? (
                            <span
                                className={cn(CHIP, 'bg-status-pending text-status-pending-text')}
                            >
                                사용 중
                            </span>
                        ) : (
                            <span className="text-body-sm text-fg-tertiary">-</span>
                        ),
                }),
            ]),
        [currentUserId],
    );

    const table = useTable({ features, columns, data: users });

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
                                <TableCell key={cell.id} className="px-4 py-3 align-middle">
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
