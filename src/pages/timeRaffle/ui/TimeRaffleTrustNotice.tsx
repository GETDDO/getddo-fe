// 불릿을 요약하는 도입 문장 — NOTICES의 항목을 여기에 다시 쓰면 같은 문구가 두 번 보인다
const INTRO = '겟또타임 추첨은 아래 기준에 따라 진행됩니다.';

// 기획서의 신뢰성 고지 문구 — 당첨 확률 비노출·근거 보존·상태 구분을 사용자에게 알린다
const NOTICES = [
    '추첨 결과는 관리자 승인 후 공개되며, 응모권 사용 이력과 추첨 근거는 보존됩니다.',
    '당첨 확률은 표시하지 않으며, 응모권 사용 여부와 참여 횟수에 따라 당첨 기회가 달라질 수 있습니다.',
    '예정·진행 중·마감·발표 대기·취소 등 상태가 목록에서 구분되며, 운영 정책에 따라 상태가 변경될 수 있습니다.',
];

export function TimeRaffleTrustNotice() {
    return (
        <section className="bg-surface-page border-border-default flex flex-col gap-4 rounded-2xl border p-6 shadow-md">
            <div className="flex flex-col gap-1">
                <h2 className="text-body-bold text-fg-primary">추첨 결과 안내</h2>
                <p className="text-body-sm text-fg-tertiary">{INTRO}</p>
            </div>
            <ul className="flex flex-col gap-2">
                {NOTICES.map((notice) => (
                    <li key={notice} className="flex items-center gap-2">
                        <span className="bg-brand-primary size-1.5 shrink-0 rounded-full" />
                        <span className="text-body-sm text-fg-primary">{notice}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
