import { createColumnHelper, flexRender, tableFeatures, useTable } from '@tanstack/react-table';
import { useMemo } from 'react';

import { formatKst } from '@shared/lib/date';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui/table';

import type { NotificationJob, NotificationJobStatus } from '../model/types';

import { NOTIFICATION_JOB_STATUS_LABEL, NOTIFICATION_TYPE_LABEL } from '../model/types';

const CHIP = 'text-caption rounded-md px-2 py-0.5 font-medium whitespace-nowrap';

const STATUS_CHIP: Record<NotificationJobStatus, string> = {
    PENDING: 'bg-surface-sunken text-fg-secondary',
    PROCESSING: 'bg-status-active text-status-active-text',
    COMPLETED: 'bg-surface-sunken text-fg-secondary',
    FAILED: 'bg-status-rejected text-status-rejected-text',
};

// 정렬·필터는 서버 쿼리로 처리하므로 행 모델만 쓰는 표시용 테이블 — 기능 슬롯을 등록하지 않는다
const features = tableFeatures({});
const helper = createColumnHelper<typeof features, NotificationJob>();

const kstOrDash = (iso: string | null) => (iso ? formatKst(iso) : '-');

/**
 * 알림 생성 작업 테이블 — 행 클릭은 상세 드로어를 여는 onRowClick에 위임한다.
 * generationStoppedBy가 있는 작업은 상태 옆에 '중지'를 함께 표시한다.
 */
export function NotificationJobTable({
    jobs,
    onRowClick,
}: {
    jobs: NotificationJob[];
    onRowClick?: (job: NotificationJob) => void;
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
                helper.accessor('notificationType', {
                    header: '유형',
                    cell: ({ getValue }) => (
                        <span className={cn(CHIP, 'bg-surface-sunken text-fg-secondary')}>
                            {NOTIFICATION_TYPE_LABEL[getValue()]}
                        </span>
                    ),
                }),
                helper.accessor('status', {
                    header: '상태',
                    cell: ({ getValue, row }) => (
                        <span className="flex items-center gap-1.5">
                            <span className={cn(CHIP, STATUS_CHIP[getValue()])}>
                                {NOTIFICATION_JOB_STATUS_LABEL[getValue()]}
                            </span>
                            {row.original.generationStoppedBy && (
                                <span className={cn(CHIP, 'bg-surface-sunken text-fg-secondary')}>
                                    중지
                                </span>
                            )}
                        </span>
                    ),
                }),
                helper.accessor('eventId', {
                    header: '이벤트',
                    cell: ({ getValue }) => {
                        const eventId = getValue();
                        return (
                            <span
                                title={eventId ?? undefined}
                                className="text-body-sm text-fg-primary block max-w-36 truncate"
                            >
                                {eventId ?? '-'}
                            </span>
                        );
                    },
                }),
                helper.accessor('attemptCount', {
                    header: '처리 차수',
                    cell: ({ getValue }) => (
                        <span className="text-body-sm text-fg-primary tabular-nums">
                            {getValue()}회
                        </span>
                    ),
                }),
                helper.accessor('nextAttemptAt', {
                    header: '다음 재시도',
                    cell: ({ getValue }) => (
                        <span className="text-fg-secondary text-body-sm whitespace-nowrap">
                            {kstOrDash(getValue())}
                        </span>
                    ),
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

    const table = useTable({ features, columns, data: jobs });

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
