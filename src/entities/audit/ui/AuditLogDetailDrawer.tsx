import type { ReactNode } from 'react';

import { formatKst } from '@shared/lib/date';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@shared/ui/sheet';

import type { AuditLogSummary } from '../model/types';

import { useAuditLog } from '../api/queries';
import { auditActionLabel, auditTargetTypeLabel } from '../model/types';

const FIELD = 'text-caption text-fg-tertiary';
const VALUE = 'text-body-sm text-fg-primary break-all';

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <span className={FIELD}>{label}</span>
            <span className={VALUE}>{children}</span>
        </div>
    );
}

// beforeData/afterData는 서버가 "관리자가 검토할 변경 근거"만 싣는다 — 원문 JSON을 그대로 보여준다
function DataBlock({ title, data }: { title: string; data: Record<string, unknown> | null }) {
    if (!data) return null;
    return (
        <div className="flex flex-col gap-1">
            <span className={FIELD}>{title}</span>
            <pre className="bg-surface-sunken text-fg-secondary text-caption overflow-x-auto rounded-lg p-3">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
}

/**
 * 감사 로그 상세 드로어 — 목록 요약을 먼저 보여주고, AU02 상세가 오면
 * 변경 전·후 데이터를 덧붙인다. 감사 로그는 조회 전용이라 액션 버튼이 없다.
 */
export function AuditLogDetailDrawer({
    summary,
    open,
    onOpenChange,
}: {
    summary: AuditLogSummary | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data: detail, isPending } = useAuditLog(open ? (summary?.id ?? null) : null);
    // 요약 필드는 목록 값으로 먼저 채우고, 변경 전·후 데이터는 상세 응답이 와야 붙는다
    const shown: AuditLogSummary | null = detail ?? summary;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="overflow-y-auto sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>감사 로그 상세</SheetTitle>
                    <SheetDescription>
                        {summary ? formatKst(summary.createdAt) : ''}
                    </SheetDescription>
                </SheetHeader>
                {shown && (
                    <div className="flex flex-col gap-4 px-4 pb-6">
                        <Field label="작업">
                            {auditActionLabel(shown.action)}{' '}
                            <span className="text-fg-tertiary">({shown.action})</span>
                        </Field>
                        <Field label="처리자">{shown.actorId ?? '시스템'}</Field>
                        <Field label="대상">
                            {auditTargetTypeLabel(shown.targetType)} · {shown.targetId}
                        </Field>
                        <Field label="사유">{shown.reason ?? '-'}</Field>
                        <Field label="요청 ID">{shown.requestId ?? '-'}</Field>
                        <Field label="로그 ID">{shown.id}</Field>
                        {detail ? (
                            <>
                                <DataBlock title="변경 전" data={detail.beforeData} />
                                <DataBlock title="변경 후" data={detail.afterData} />
                            </>
                        ) : (
                            isPending && (
                                <p className="text-body-sm text-fg-tertiary">
                                    상세 정보를 불러오는 중…
                                </p>
                            )
                        )}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
