import type { ReactNode } from 'react';

import { formatKst } from '@shared/lib/date';
import { Button } from '@shared/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui/table';

import type {
    AdminTicketHistory,
    TicketGrant,
    TicketInconsistency,
    TicketRefund,
} from '../model/admin';

import {
    TICKET_OPERATION_LABEL,
    TICKET_REFUND_REASON_LABEL,
    TICKET_SOURCE_TYPE_LABEL,
    TICKET_STATUS_LABEL,
} from '../model/admin';
import { TICKET_GRADE_LABEL } from '../model/grade';

// 관리자 응모권 조회 표 4종 — 모두 조회 전용이라 행에 변경 버튼이 없다 (스펙: 수동 지급·회수 경로 없음)

const CHIP = 'text-caption rounded-md px-2 py-0.5 font-medium whitespace-nowrap';
const TIME = 'text-fg-secondary text-body-sm whitespace-nowrap';

function Frame({ headers, children }: { headers: string[]; children: ReactNode }) {
    return (
        <div className="bg-surface-page border-border-default overflow-hidden rounded-2xl border">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        {headers.map((header) => (
                            <TableHead
                                key={header}
                                className="text-caption text-fg-tertiary h-11 px-4 font-semibold"
                            >
                                {header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>{children}</TableBody>
            </Table>
        </div>
    );
}

const Cell = ({ children }: { children: ReactNode }) => (
    <TableCell className="px-4 py-3 align-top">{children}</TableCell>
);

function UserCell({ name, id }: { name: string; id: string }) {
    return (
        <div className="flex flex-col">
            <span className="text-body-sm text-fg-primary">{name}</span>
            <span className="text-caption text-fg-tertiary">{id}</span>
        </div>
    );
}

const Gray = ({ children }: { children: ReactNode }) => (
    <span className={`${CHIP} bg-surface-sunken text-fg-secondary`}>{children}</span>
);

/** AO09 — 불일치 응모권 목록. 응모권 상태·버전이 마지막 이력과 다른 값을 강조한다 */
export function TicketInconsistencyTable({
    rows,
    onRowClick,
}: {
    rows: TicketInconsistency[];
    onRowClick?: (row: TicketInconsistency) => void;
}) {
    return (
        <Frame
            headers={['사용자', '응모권', '등급', '응모권 상태·버전', '마지막 이력 상태·버전', '']}
        >
            {rows.map((row) => (
                <TableRow
                    key={row.ticketId}
                    className="hover:bg-surface-canvas cursor-pointer"
                    onClick={() => onRowClick?.(row)}
                >
                    <Cell>
                        <UserCell name={row.userName} id={row.userId} />
                    </Cell>
                    <Cell>
                        <span className="text-body-sm text-fg-primary break-all">
                            {row.ticketId}
                        </span>
                    </Cell>
                    <Cell>
                        <Gray>{TICKET_GRADE_LABEL[row.grade]}</Gray>
                    </Cell>
                    <Cell>
                        <MismatchValue
                            status={row.ticketStatus}
                            version={row.ticketVersion}
                            differs={
                                row.ticketStatus !== row.latestHistoryStatus ||
                                row.ticketVersion !== row.latestHistoryVersion
                            }
                        />
                    </Cell>
                    <Cell>
                        <MismatchValue
                            status={row.latestHistoryStatus}
                            version={row.latestHistoryVersion}
                        />
                    </Cell>
                    <Cell>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRowClick?.(row);
                            }}
                        >
                            상세
                        </Button>
                    </Cell>
                </TableRow>
            ))}
        </Frame>
    );
}

/** 상태와 버전을 한 칸에 보인다. differs면 어긋난 쪽임을 색으로 구분한다 */
export function MismatchValue({
    status,
    version,
    differs = false,
}: {
    status: keyof typeof TICKET_STATUS_LABEL;
    version: number;
    differs?: boolean;
}) {
    return (
        <span
            className={
                differs ? 'text-semantic-error-strong text-body-sm' : 'text-body-sm text-fg-primary'
            }
        >
            {TICKET_STATUS_LABEL[status]} · v{version}
        </span>
    );
}

/** AO03 — 지급 이력 */
export function TicketGrantTable({ rows }: { rows: TicketGrant[] }) {
    return (
        <Frame headers={['지급 시각', '사용자', '구분', '등급', '출처 ID', '만료']}>
            {rows.map((row) => (
                <TableRow key={row.historyId} className="hover:bg-surface-canvas">
                    <Cell>
                        <span className={TIME}>{formatKst(row.grantedAt)}</span>
                    </Cell>
                    <Cell>
                        <UserCell name={row.userName} id={row.userId} />
                    </Cell>
                    <Cell>
                        <Gray>
                            {TICKET_SOURCE_TYPE_LABEL[row.sourceType]}
                            {row.missionId ? ` · ${row.missionId}` : ''}
                        </Gray>
                    </Cell>
                    <Cell>
                        <Gray>{TICKET_GRADE_LABEL[row.grade]}</Gray>
                    </Cell>
                    <Cell>
                        <span className="text-body-sm text-fg-tertiary break-all">
                            {row.sourceId}
                        </span>
                    </Cell>
                    <Cell>
                        <span className={TIME}>{formatKst(row.expiresAt)}</span>
                    </Cell>
                </TableRow>
            ))}
        </Frame>
    );
}

/** AO05 — 전체 이력 */
export function AdminTicketHistoryTable({ rows }: { rows: AdminTicketHistory[] }) {
    return (
        <Frame headers={['처리 시각', '사용자', '처리', '등급', '처리 후 상태', '이벤트·미션']}>
            {rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-surface-canvas">
                    <Cell>
                        <span className={TIME}>{formatKst(row.createdAt)}</span>
                    </Cell>
                    <Cell>
                        <UserCell name={row.userName} id={row.userId} />
                    </Cell>
                    <Cell>
                        <Gray>{TICKET_OPERATION_LABEL[row.operationType]}</Gray>
                    </Cell>
                    <Cell>
                        <Gray>{TICKET_GRADE_LABEL[row.grade]}</Gray>
                    </Cell>
                    <Cell>
                        <span className="text-body-sm text-fg-primary">
                            {TICKET_STATUS_LABEL[row.status]}
                        </span>
                    </Cell>
                    <Cell>
                        <span className="text-body-sm text-fg-primary">
                            {row.eventTitle ?? row.missionTitle ?? '-'}
                        </span>
                    </Cell>
                </TableRow>
            ))}
        </Frame>
    );
}

/** AO08 — 반환 이력. 반환은 이벤트 취소와 같은 트랜잭션에서 끝나므로 처리 상태 열이 없다 */
export function TicketRefundTable({ rows }: { rows: TicketRefund[] }) {
    return (
        <Frame headers={['반환 시각', '사용자', '이벤트', '등급', '사유', '반환분 만료']}>
            {rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-surface-canvas">
                    <Cell>
                        <span className={TIME}>{formatKst(row.refundedAt)}</span>
                    </Cell>
                    <Cell>
                        <UserCell name={row.userName} id={row.userId} />
                    </Cell>
                    <Cell>
                        <span className="text-body-sm text-fg-primary">{row.eventTitle}</span>
                    </Cell>
                    <Cell>
                        <Gray>{TICKET_GRADE_LABEL[row.grade]}</Gray>
                    </Cell>
                    <Cell>
                        <Gray>{TICKET_REFUND_REASON_LABEL[row.reasonType]}</Gray>
                    </Cell>
                    <Cell>
                        <span className={TIME}>{formatKst(row.targetExpiresAt)}</span>
                    </Cell>
                </TableRow>
            ))}
        </Frame>
    );
}
