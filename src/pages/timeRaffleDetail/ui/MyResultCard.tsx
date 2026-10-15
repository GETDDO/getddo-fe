import type { Event } from '@entities/event';

import { AnnounceCountdown } from './AnnounceCountdown';

/**
 * 발표를 기다리는 동안의 카드 — 마감 뒤 결과가 공개되기 전까지 보인다.
 *
 * 발표까지 남은 시간을 늘 보여 준다(예전에는 상품 이미지에 마우스를 올려야 보였다).
 * 응모한 사람(E09 PENDING)에게는 결과가 이 자리에 뜬다는 안내를 덧붙인다. 공개 전에는 서버가
 * 추첨이 끝났더라도 PENDING으로 고정해 내려주므로(05-api/drawing.md), 화면이 발표 여부를 따로 판정하지 않는다.
 *
 * 발표가 끝난 뒤의 당첨·낙첨 표시는 결과 영역(DrawResultSection)의 배너가 맡는다.
 */
export function MyResultCard({ event, entered }: { event: Event; entered: boolean }) {
    return (
        <section className="bg-surface-page border-border-default flex flex-col items-center gap-4 rounded-2xl border p-8 text-center">
            <AnnounceCountdown event={event} />
            <div className="flex flex-col gap-1">
                <p className="text-title-3 text-fg-primary">아직 발표 전이에요</p>
                <p className="text-body text-fg-secondary">
                    {entered
                        ? '결과가 공개되면 이 자리에서 바로 확인할 수 있어요.'
                        : '당첨자 명단이 공개되면 이 자리에서 확인할 수 있어요.'}
                </p>
            </div>
        </section>
    );
}
