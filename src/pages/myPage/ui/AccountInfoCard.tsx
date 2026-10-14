import type { VirtualUser } from '@entities/user';

import { MEMBERSHIP_LABEL } from '@entities/event';

import { SectionCard } from './SectionCard';

/**
 * 계정 정보 — 가상 사용자라 바꿀 수 없는 값만 보여 준다.
 * 이메일·휴대폰은 가상 사용자 계약에 없어 지어내지 않고 계정이 가진 값(ID·유형·멤버십)만 적는다
 */
export function AccountInfoCard({ user }: { user: VirtualUser }) {
    const rows = [
        { label: '사용자 ID', value: user.id },
        { label: '유형', value: user.personaLabel ?? '시스템 관리 계정' },
        { label: '멤버십', value: MEMBERSHIP_LABEL[user.membership] },
    ];
    return (
        <SectionCard title="계정 정보" description="가상 사용자 계정이라 정보는 바꿀 수 없어요.">
            <dl className="flex flex-col gap-3">
                {rows.map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-4">
                        <dt className="text-body-sm text-fg-tertiary">{label}</dt>
                        <dd className="text-body-sm-bold text-fg-primary truncate">{value}</dd>
                    </div>
                ))}
            </dl>
        </SectionCard>
    );
}
