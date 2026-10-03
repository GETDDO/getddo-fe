import type { ReactNode } from 'react';

import { formatKst } from '@shared/lib/date';
import { cn } from '@shared/lib/utils';

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

interface AbuseCaseCardProps {
    abuseCase: AbuseCase;
    /** 검토 대기 건에 표시할 액션 영역 (features/review-abuse-case의 검토 버튼 등) */
    action?: ReactNode;
}

export function AbuseCaseCard({ abuseCase, action }: AbuseCaseCardProps) {
    const status = STATUS_META[abuseCase.status];
    const subject =
        abuseCase.target === 'entry'
            ? (abuseCase.eventTitle ?? '-')
            : `${REWARD_SOURCE_LABEL[abuseCase.rewardSource ?? 'attendance']} 지급`;

    return (
        <li className="bg-surface-page border-border-default flex flex-col gap-3 rounded-2xl border p-5">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="bg-surface-sunken text-caption text-fg-secondary rounded-md px-2 py-0.5 font-medium">
                        {TARGET_LABEL[abuseCase.target]}
                    </span>
                    <span
                        className={cn(
                            'text-caption rounded-md px-2 py-0.5 font-medium',
                            status.chipClass,
                        )}
                    >
                        {status.label}
                    </span>
                </div>
                {action}
            </div>

            <dl className="text-body-sm flex flex-col gap-1.5">
                <div className="flex gap-3">
                    <dt className="text-fg-tertiary w-20 shrink-0">사용자</dt>
                    <dd className="text-fg-primary">
                        {abuseCase.userNickname}
                        <span className="text-fg-tertiary"> ({abuseCase.userId})</span>
                    </dd>
                </div>
                <div className="flex gap-3">
                    <dt className="text-fg-tertiary w-20 shrink-0">대상</dt>
                    <dd className="text-fg-primary">{subject}</dd>
                </div>
                <div className="flex gap-3">
                    <dt className="text-fg-tertiary w-20 shrink-0">탐지 사유</dt>
                    <dd className="text-fg-primary">{abuseCase.reason}</dd>
                </div>
                <div className="flex gap-3">
                    <dt className="text-fg-tertiary w-20 shrink-0">관련 요청</dt>
                    <dd className="text-fg-secondary">{abuseCase.requestSummary}</dd>
                </div>
                <div className="flex gap-3">
                    <dt className="text-fg-tertiary w-20 shrink-0">탐지 시각</dt>
                    <dd className="text-fg-secondary">{formatKst(abuseCase.detectedAt)}</dd>
                </div>
            </dl>

            {abuseCase.review && (
                <div className="border-border-default text-body-sm flex flex-col gap-1 border-t pt-3">
                    <p className="text-fg-secondary">
                        검토자 {abuseCase.review.reviewer} ·{' '}
                        {formatKst(abuseCase.review.reviewedAt)}
                    </p>
                    <p className="text-fg-primary">사유: {abuseCase.review.note}</p>
                </div>
            )}
        </li>
    );
}
