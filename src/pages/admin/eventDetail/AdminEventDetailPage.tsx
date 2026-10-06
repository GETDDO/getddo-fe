import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { EventActionKind } from '@features/manageEvent';

import {
    ADMIN_STATUS_META,
    EVENT_TYPE_LABEL,
    MEMBERSHIP_LABEL,
    useAdminEvent,
} from '@entities/event';
import { EventActionDialog } from '@features/manageEvent';
import { formatKst } from '@shared/lib/date';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui/table';

const KST_YMD_HM: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
};

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-6">
            <span className="text-body-sm text-fg-tertiary w-28 shrink-0 pt-0.5">{label}</span>
            <div className="text-body-sm text-fg-primary min-w-0">{children}</div>
        </div>
    );
}

export function AdminEventDetailPage() {
    const { eventId = '' } = useParams();
    const navigate = useNavigate();
    const { data: event, isPending, isError } = useAdminEvent(eventId);
    const [action, setAction] = useState<EventActionKind | null>(null);

    if (isPending) {
        return <p className="text-body-sm text-fg-tertiary pb-10">불러오는 중…</p>;
    }
    if (isError || !event) {
        return (
            <div className="flex flex-col gap-4 pb-10">
                <p className="text-destructive text-body-sm">이벤트를 불러오지 못했습니다.</p>
                <Button
                    variant="outline"
                    className="w-fit"
                    onClick={() => void navigate('/admin/events')}
                >
                    목록으로
                </Button>
            </div>
        );
    }

    // spec event.md 운영 규칙 — 수정·삭제는 진행 예정(SCHEDULED)만, 중단은 진행 관련 상태만, 취소는 종료 전까지
    const canEdit = event.status === 'SCHEDULED';
    const canSuspend = ['SCHEDULED', 'OPEN', 'CLOSED'].includes(event.status);
    const canResume = event.status === 'SUSPENDED';
    const canCancel = event.status !== 'CANCELED';
    const status = ADMIN_STATUS_META[event.status];

    return (
        <div className="flex max-w-280 flex-col gap-6 pr-10 pb-10">
            <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => void navigate('/admin/events')}>
                    ← 목록
                </Button>
                <h2 className="text-title-3 text-fg-primary truncate">{event.title}</h2>
                <span
                    className={cn(
                        'text-caption rounded-md px-2 py-0.5 font-medium',
                        status.chipClass,
                    )}
                >
                    {status.label}
                </span>
                <div className="ml-auto flex gap-2">
                    {canEdit && (
                        <Button
                            variant="outline"
                            onClick={() => void navigate(`/admin/events/${event.id}/edit`)}
                        >
                            수정
                        </Button>
                    )}
                    {canSuspend && (
                        <Button variant="outline" onClick={() => setAction('suspend')}>
                            중단
                        </Button>
                    )}
                    {canResume && (
                        <Button variant="outline" onClick={() => setAction('resume')}>
                            재개
                        </Button>
                    )}
                    {canEdit && (
                        <Button variant="outline" onClick={() => setAction('delete')}>
                            삭제
                        </Button>
                    )}
                    {canCancel && (
                        <Button
                            className="bg-destructive hover:bg-destructive/80"
                            onClick={() => setAction('cancel')}
                        >
                            취소
                        </Button>
                    )}
                </div>
            </div>

            <section className="bg-surface-page border-border-default flex flex-col gap-4 rounded-2xl border p-6">
                <h3 className="text-body-bold text-fg-primary">기본 정보</h3>
                <InfoRow label="이벤트 ID">{event.id}</InfoRow>
                <InfoRow label="설명">
                    <p className="whitespace-pre-wrap">{event.description}</p>
                </InfoRow>
                <InfoRow label="유형">
                    {EVENT_TYPE_LABEL[event.eventType]}
                    {event.eventType === 'TICKET' &&
                        ` · ${event.weightingEnabled ? '가중치' : '가중치 없음'} · ${
                            event.maxTicketsPerUser === null
                                ? '응모 상한 없음'
                                : `1인 최대 ${event.maxTicketsPerUser}장`
                        }`}
                </InfoRow>
                <InfoRow label="최소 등급">{MEMBERSHIP_LABEL[event.membershipRule]} 이상</InfoRow>
                <InfoRow label="응모 기간">
                    {formatKst(event.startsAt, KST_YMD_HM)} ~ {formatKst(event.endsAt, KST_YMD_HM)}{' '}
                    (KST)
                </InfoRow>
                <InfoRow label="이미지 키">{event.imageKey ?? '없음'}</InfoRow>
                <InfoRow label="등록일">{formatKst(event.createdAt, KST_YMD_HM)}</InfoRow>
            </section>

            <section className="bg-surface-page border-border-default flex flex-col gap-4 rounded-2xl border p-6">
                <h3 className="text-body-bold text-fg-primary">경품 ({event.prizes.length}종)</h3>
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-16">등수</TableHead>
                            <TableHead>경품명</TableHead>
                            <TableHead className="w-24">당첨 인원</TableHead>
                            <TableHead>설명</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {event.prizes.map((prize) => (
                            <TableRow key={prize.id} className="hover:bg-transparent">
                                <TableCell>{prize.rank}등</TableCell>
                                <TableCell className="font-medium">{prize.name}</TableCell>
                                <TableCell>{prize.winnerCount}명</TableCell>
                                <TableCell className="text-fg-tertiary">
                                    {prize.description ?? '—'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </section>

            <EventActionDialog
                event={event}
                action={action}
                open={action !== null}
                onOpenChange={(open) => {
                    if (!open) setAction(null);
                }}
                onDeleted={() => void navigate('/admin/events')}
            />
        </div>
    );
}
