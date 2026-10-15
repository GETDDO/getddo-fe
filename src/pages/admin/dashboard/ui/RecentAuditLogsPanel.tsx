import { useState } from 'react';
import { Link } from 'react-router-dom';

import type { AuditLogSummary } from '@entities/audit';

import {
    auditActionLabel,
    AuditLogDetailDrawer,
    auditTargetTypeLabel,
    useAuditLogs,
} from '@entities/audit';
import { formatKst } from '@shared/lib/date';
import { Button } from '@shared/ui/button';
import { SkeletonRows } from '@shared/ui/skeleton';

const PREVIEW_SIZE = 5;

/**
 * 감사 로그 미리보기 — 감사 조회는 서버 정렬 보장이 계약에 없어 '최근'으로 단정하지 않는다.
 * 실서버에서 최신순 정렬이 확인되면 제목을 '최근 감사 로그'로 바꾼다 (GD-198 계획 메모).
 */
export function RecentAuditLogsPanel() {
    const query = useAuditLogs({ page: 1, size: PREVIEW_SIZE });
    const [selected, setSelected] = useState<AuditLogSummary | null>(null);

    return (
        <section
            aria-labelledby="audit-preview-title"
            className="bg-surface-page border-border-default flex flex-col gap-3 rounded-2xl border p-5"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                    <h2 id="audit-preview-title" className="text-body-bold text-fg-primary">
                        감사 로그 미리보기
                    </h2>
                    <p className="text-caption text-fg-tertiary">
                        기록된 운영 액션 {query.data?.totalElements ?? '-'}건 중 {PREVIEW_SIZE}건
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        aria-label="목록 새로고침"
                        onClick={() => void query.refetch()}
                    >
                        새로고침
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                        <Link to="/admin/audit">전체보기</Link>
                    </Button>
                </div>
            </div>

            {query.isPending && <SkeletonRows rows={3} />}
            {query.isError && (
                <div className="flex items-center gap-3" role="alert">
                    <p className="text-semantic-error-strong text-body-sm">
                        감사 로그를 불러오지 못했습니다.
                    </p>
                    <Button size="sm" variant="secondary" onClick={() => void query.refetch()}>
                        다시 시도
                    </Button>
                </div>
            )}
            {query.data && query.data.items.length === 0 && (
                <p className="text-body-sm text-fg-tertiary py-4">기록된 감사 로그가 없습니다.</p>
            )}
            {query.data && query.data.items.length > 0 && (
                <ul className="flex flex-col gap-2">
                    {query.data.items.map((log) => (
                        <li
                            key={log.id}
                            className="border-border-default flex flex-col gap-1 rounded-xl border p-3"
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-body-sm text-fg-primary font-medium">
                                    {auditActionLabel(log.action)}
                                </span>
                                <span className="text-caption text-fg-tertiary">
                                    {auditTargetTypeLabel(log.targetType)}
                                </span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="hover:bg-surface-pressed ml-auto"
                                    aria-label={`감사 로그 ${log.id} 상세`}
                                    onClick={() => setSelected(log)}
                                >
                                    상세
                                </Button>
                            </div>
                            <div className="text-caption text-fg-tertiary flex flex-wrap gap-x-3">
                                <span>{log.actorId ?? '시스템'}</span>
                                <span>{formatKst(log.createdAt)}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <AuditLogDetailDrawer
                summary={selected}
                open={selected !== null}
                onOpenChange={(open) => {
                    if (!open) setSelected(null);
                }}
            />
        </section>
    );
}
