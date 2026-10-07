import type { Event } from '@entities/event';

import { KST_HOUR_MINUTE, formatKst } from '@shared/lib/date';

// 운영 정책 고지 — 앞 두 항목만 이벤트 값이 들어가고 나머지는 모든 래플에 공통이다
const COMMON_RULES = [
    '비정상적이거나 대리 응모 등 불공정한 방법으로 참여가 적발될 시, 당첨이 자동 취소되며 향후 서비스 이용이 제한될 수 있습니다.',
    '추첨 후보·조건 스냅샷과 결과 정합성이 보존되며, 관리자 승인 후 결과가 공개됩니다.',
    '상태는 모집 중·마감·발표 대기·취소 등으로 구분되며, 운영 정책에 따라 상태가 변경될 수 있습니다.',
    '취소 시에는 연결된 반환 이력이 별도로 보존되며, 제외·응모자 없음·추첨 대상자 없음 등 예외 상황 발생 시 운영 정책에 따라 처리됩니다.',
];

export function RaffleRulesCard({ event }: { event: Event }) {
    const rules = [
        `KST 기준 ${formatKst(event.startsAt, KST_HOUR_MINUTE)} 시작 · ${formatKst(event.endsAt, KST_HOUR_MINUTE)} 마감. 마감 이후에는 추가 응모가 불가하며, 중복 요청 시 이중 차감되지 않습니다.`,
        event.requiredTickets === 0
            ? '응모권 없이 참여할 수 있으며, 중복 요청 시 이중으로 접수되지 않습니다.'
            : `1회 응모 시 ${event.requiredTickets}장만 차감되며, 응모권이 부족하면 응모가 제한됩니다.`,
        ...COMMON_RULES,
    ];

    return (
        <section className="bg-surface-page border-border-default flex flex-col gap-5 rounded-2xl border p-5 sm:p-8">
            <h2 className="text-subhead text-fg-primary">응모 및 추첨 안내</h2>
            <ul className="flex flex-col gap-2.5">
                {rules.map((rule) => (
                    <li key={rule} className="flex items-start gap-2">
                        <span className="text-body-sm text-brand-primary leading-normal">•</span>
                        <span className="text-body text-fg-secondary min-w-0 flex-1">{rule}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
