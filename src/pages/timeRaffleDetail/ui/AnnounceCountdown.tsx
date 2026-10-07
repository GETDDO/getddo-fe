import { Timer } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { Event } from '@entities/event';

import { formatCountdown } from '@shared/lib/date';
import { useVirtualClock } from '@shared/lib/virtualClock';

/**
 * 당첨자 발표까지 남은 시간을 1초 간격으로 줄여 가며 보여준다.
 *
 * 기준은 서버가 준 발표 예정 시각(publicationScheduledAt)뿐이다 — 화면에서 마감 + 5분을 더하면
 * 새로고침마다 기준이 흔들린다. 남은 시간이 0이 돼도 결과는 보여주지 않는다.
 *
 * 예정 시각은 '원래 예정'이고 실제 공개는 늦어질 수 있다 (getddo-spec 05-api/drawing.md).
 * 그래서 0에 닿으면 발표 시점을 다시 약속하지 않고, 아직 공개되지 않았다는 사실만 알린다.
 */
export function AnnounceCountdown({ event }: { event: Event }) {
    const { now } = useVirtualClock();
    const publicationScheduledAt = event.publicationScheduledAt;
    const [remainingMs, setRemainingMs] = useState(() =>
        publicationScheduledAt ? new Date(publicationScheduledAt).getTime() - now().getTime() : 0,
    );

    useEffect(() => {
        if (!publicationScheduledAt) return;

        const target = new Date(publicationScheduledAt).getTime();
        const update = () => setRemainingMs(target - now().getTime());
        // 가상 시계를 옮기면 now가 새로 내려오므로, 다음 초를 기다리지 말고 바로 맞춘다
        update();

        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [publicationScheduledAt, now]);

    if (!publicationScheduledAt) return null;

    const isCountingDown = event.status !== 'drawn' && remainingMs > 0;
    // 예정 시각이 지났는데도 아직 발표되지 않은 상태 — '곧 발표한다'처럼 시점을 새로 약속하지 않는다.
    // TODO: 지연 안내 문구는 getddo-spec 00-requirements/pending-decisions.md에서 확정되면 교체한다
    const label =
        event.status === 'drawn'
            ? '당첨자 발표 완료'
            : remainingMs > 0
              ? '당첨자 발표까지'
              : '아직 발표되지 않았습니다';

    return (
        <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-fg-inverse/80 text-body-sm-bold flex items-center gap-1.5">
                <Timer className="size-4.5" />
                {label}
            </span>
            {isCountingDown && (
                <span
                    role="timer"
                    aria-live="off"
                    aria-label={`당첨자 발표까지 ${formatCountdown(remainingMs)} 남음`}
                    className="text-fg-inverse text-title-2 tabular-nums"
                >
                    {formatCountdown(remainingMs)}
                </span>
            )}
        </div>
    );
}
