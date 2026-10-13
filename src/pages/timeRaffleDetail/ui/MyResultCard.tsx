import { Gift, PartyPopper } from 'lucide-react';

import type { MyResult } from '@entities/drawResult';

/**
 * 내 결과 카드 (E09).
 *
 * 공개 명단에서 뒷자리로 찾아보는 조회(WinnerLookupCard)와 달리 서버가 본인 것만 답해 준다.
 * 뒷자리는 겹칠 수 있어 '축하합니다'를 띄워 놓고도 누가 본인인지 알 수 없는데, 여기는 그 문제가 없다.
 *
 * 공개 전에는 서버가 PENDING으로 고정해 내려주므로(05-api/drawing.md) 화면이 발표 여부를
 * 따로 판정하지 않는다 — 받은 값을 그대로 그린다.
 */
export function MyResultCard({ result }: { result: MyResult }) {
    // 응모하지 않은 래플에 결과 영역을 띄우면 참여했는데 비어 있는 것처럼 보인다
    if (result.result === 'NOT_ENTERED') return null;

    if (result.result === 'CANCELED') {
        return (
            <Shell>
                <p className="text-body text-fg-secondary">
                    이벤트가 취소되어 당첨자를 발표하지 않아요.
                </p>
            </Shell>
        );
    }

    if (result.result === 'PENDING') {
        return (
            <Shell>
                <p className="text-title-3 text-fg-primary">아직 발표 전이에요</p>
                {/* 발표 시점을 여기서 다시 약속하지 않는다 — 예정 시각은 히어로의 카운트다운이 맡는다 */}
                <p className="text-body text-fg-secondary">
                    결과가 공개되면 이 자리에서 바로 확인할 수 있어요.
                </p>
            </Shell>
        );
    }

    if (result.result === 'LOST') {
        return (
            <Shell>
                <p className="text-title-3 text-fg-primary">이번에는 아쉽게 되었어요</p>
                <p className="text-body text-fg-secondary">
                    응모해 주셔서 감사해요. 다음 래플에서 다시 만나요.
                </p>
            </Shell>
        );
    }

    const prize = result.prize;
    return (
        <section className="bg-ticket-accent border-ticket-primary flex flex-col items-center gap-4 rounded-2xl border-2 p-8 text-center">
            <PartyPopper className="text-fg-primary size-8" />
            <p className="text-title-2 text-fg-primary">당첨을 축하드려요!</p>

            {prize && (
                <div className="flex flex-col items-center gap-2">
                    <span className="bg-ticket-primary text-body-sm-bold text-fg-primary rounded-full px-3 py-1">
                        {prize.rank}등
                    </span>
                    <p className="text-title-3 text-fg-primary">{prize.name}</p>
                    {prize.description && (
                        <p className="text-body text-fg-secondary">{prize.description}</p>
                    )}
                </div>
            )}

            <p className="text-caption text-fg-tertiary flex items-center gap-1.5">
                <Gift className="size-4" />
                경품 수령 안내는 가입하신 연락처로 따로 보내 드려요.
            </p>
        </section>
    );
}

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <section className="bg-surface-page border-border-default flex flex-col items-center gap-2 rounded-2xl border p-8 text-center">
            {children}
        </section>
    );
}
