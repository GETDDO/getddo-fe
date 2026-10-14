import type { MyResult } from '@entities/drawResult';

/**
 * 발표를 기다리는 동안의 내 결과 카드 (E09 PENDING).
 *
 * 응모한 사람에게만 보인다. 공개 전에는 서버가 추첨이 끝났더라도 PENDING으로 고정해
 * 내려주므로(05-api/drawing.md), 화면이 발표 여부를 따로 판정하지 않는다.
 *
 * 발표가 끝난 뒤의 당첨·낙첨 표시는 결과 영역(DrawResultSection)의 배너가 맡는다.
 */
export function MyResultCard({ result }: { result: MyResult }) {
    if (result.result !== 'PENDING') return null;

    return (
        <section className="bg-surface-page border-border-default flex flex-col items-center gap-2 rounded-2xl border p-8 text-center">
            <p className="text-title-3 text-fg-primary">아직 발표 전이에요</p>
            {/* 발표 시점을 여기서 다시 약속하지 않는다 — 예정 시각은 히어로의 카운트다운이 맡는다 */}
            <p className="text-body text-fg-secondary">
                결과가 공개되면 이 자리에서 바로 확인할 수 있어요.
            </p>
        </section>
    );
}
