import { createColumnHelper, flexRender, tableFeatures, useTable } from '@tanstack/react-table';
import { useMemo } from 'react';

import { formatKst } from '@shared/lib/date';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui/table';

import type { AdminNotification, MockDeliveryStatus } from '../model/types';

import { MOCK_DELIVERY_STATUS_LABEL } from '../model/types';

const CHIP = 'text-caption rounded-md px-2 py-0.5 font-medium whitespace-nowrap';

const STATUS_CHIP: Record<MockDeliveryStatus, string> = {
    PENDING: 'bg-surface-sunken text-fg-secondary',
    SENT: 'bg-status-active text-status-active-text',
    FAILED: 'bg-status-rejected text-status-rejected-text',
};

// 정렬·필터는 서버 쿼리로 처리하므로 행 모델만 쓰는 표시용 테이블 — 기능 슬롯을 등록하지 않는다
const features = tableFeatures({});
const helper = createColumnHelper<typeof features, AdminNotification>();

/**
 * 개별 알림 모의 발송 이력 테이블. '발송 복구' 버튼은 retryable인 실패 건만 활성화하고
 * 실제 요청은 onRetry에 위임한다 (확인 다이얼로그는 feature 슬라이스의 책임).
 */
export function AdminNotificationTable({
    notifications,
    onRetry,
}: {
    notifications: AdminNotification[];
    onRetry?: (notification: AdminNotification) => void;
}) {
    const columns = useMemo(
        () =>
            helper.columns([
                helper.accessor('createdAt', {
                    header: '생성 시각',
                    cell: ({ getValue }) => (
                        <span className="text-fg-secondary text-body-sm whitespace-nowrap">
                            {formatKst(getValue())}
                        </span>
                    ),
                }),
                helper.accessor('title', {
                    header: '알림',
                    cell: ({ getValue, row }) => (
                        <div className="flex flex-col">
                            <span
                                title={getValue()}
                                className="text-body-sm text-fg-primary max-w-56 truncate"
                            >
                                {getValue()}
                            </span>
                            <span
                                title={row.original.id}
                                className="text-caption text-fg-tertiary max-w-56 truncate"
                            >
                                {row.original.id}
                            </span>
                        </div>
                    ),
                }),
                helper.accessor('userId', {
                    header: '사용자',
                    cell: ({ getValue }) => (
                        <span
                            title={getValue()}
                            className="text-body-sm text-fg-primary block max-w-32 truncate"
                        >
                            {getValue()}
                        </span>
                    ),
                }),
                helper.accessor('jobId', {
                    header: '작업',
                    cell: ({ getValue }) => (
                        <span
                            title={getValue()}
                            className="text-body-sm text-fg-secondary block max-w-32 truncate"
                        >
                            {getValue()}
                        </span>
                    ),
                }),
                helper.accessor('mockDeliveryStatus', {
                    header: '발송 상태',
                    cell: ({ getValue }) => (
                        <span className={cn(CHIP, STATUS_CHIP[getValue()])}>
                            {MOCK_DELIVERY_STATUS_LABEL[getValue()]}
                        </span>
                    ),
                }),
                helper.accessor('deliveryAttemptCount', {
                    header: '발송 차수',
                    cell: ({ getValue }) => (
                        <span className="text-body-sm text-fg-primary tabular-nums">
                            {getValue()}회
                        </span>
                    ),
                }),
                helper.accessor('mockSentAt', {
                    header: '발송 시각',
                    cell: ({ getValue }) => {
                        const sentAt = getValue();
                        return (
                            <span className="text-fg-secondary text-body-sm whitespace-nowrap">
                                {sentAt ? formatKst(sentAt) : '-'}
                            </span>
                        );
                    },
                }),
                // retryable은 서버가 계산한 복구 가능 여부 — FAILED라도 자동 재시도 대기·중지 건은 비활성이다
                helper.display({
                    id: 'retry',
                    header: '복구',
                    cell: ({ row }) => (
                        <Button
                            size="sm"
                            variant="secondary"
                            disabled={!row.original.retryable}
                            title={row.original.retryable ? undefined : '복구할 수 없는 상태입니다'}
                            onClick={() => onRetry?.(row.original)}
                        >
                            발송 복구
                        </Button>
                    ),
                }),
            ]),
        [onRetry],
    );

    const table = useTable({ features, columns, data: notifications });

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
