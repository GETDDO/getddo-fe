import {
    TICKET_GRADE_LABEL,
    TICKET_GRADE_ODDS,
    TICKET_GRADE_WEIGHT,
    TICKET_GRADES,
} from '@entities/ticket';

/**
 * 등급 안내 — 등급별 받을 확률(게임·미션 보상)과 겟또타임 당첨 기회(브론즈 1장 대비 몇 배로 추첨에 들어가는지).
 * 받을 확률은 보상 규칙이라 알리지만, 당첨 확률은 응모자 수에 따라 달라 보여 주지 않는다 (요구사항 §7)
 */
export function GradeGuideCard() {
    return (
        <section className="bg-surface-page border-border-default flex flex-col gap-4 rounded-2xl border p-6 shadow-md">
            <h2 className="text-title-3 text-fg-primary">등급 안내</h2>
            <table className="w-full table-fixed text-left">
                <thead>
                    <tr className="text-caption text-fg-tertiary border-border-default border-b">
                        <th scope="col" className="pb-2 font-medium">
                            등급
                        </th>
                        <th scope="col" className="pb-2 font-medium">
                            받을 확률
                        </th>
                        <th scope="col" className="pb-2 font-medium">
                            당첨 기회
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-border-default text-body-sm text-fg-primary divide-y">
                    {TICKET_GRADES.map((grade) => (
                        <tr key={grade}>
                            <th scope="row" className="py-2 font-normal">
                                {TICKET_GRADE_LABEL[grade]}
                            </th>
                            <td className="py-2">{TICKET_GRADE_ODDS[grade]}%</td>
                            <td className="py-2">{TICKET_GRADE_WEIGHT[grade]}배</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="text-caption text-fg-tertiary break-keep">
                받을 확률은 게임·미션 보상 기준이에요(출석은 브론즈 고정). 당첨 확률은 응모자 수에
                따라 달라 알려 드리지 않아요.
            </p>
        </section>
    );
}
