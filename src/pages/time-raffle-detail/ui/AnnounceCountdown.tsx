import { Timer } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { Event } from '@entities/event';

import { formatCountdown } from '@shared/lib/date';
import { useVirtualClock } from '@shared/lib/virtual-clock';

/**
 * 당첨자 발표까지 남은 시간을 1초 간격으로 줄여 가며 보여준다.
 * 기준은 서버가 준 발표 예정 시각(announceAt)뿐이다 — 화면에서 마감 + 5분을 더하면
 * 새로고침마다 기준이 흔들린다. 남은 시간이 0이 돼도 결과는 보여주지 않는다.
 */
export function AnnounceCountdown({ event }: { event: Event }) {
    const { now } = useVirtualClock();
    const announceAt = event.announceAt;
    const [remainingMs, setRemainingMs] = useState(() =>
        announceAt ? new Date(announceAt).getTime() - now().getTime() : 0,
    );

    useEffect(() => {
        if (!announceAt) return;

        const target = new Date(announceAt).getTime();
        const update = () => setRemainingMs(target - now().getTime());
        // 가상 시계를 옮기면 now가 새로 내려오므로, 다음 초를 기다리지 말고 바로 맞춘다
        update();

        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [announceAt, now]);

    if (!announceAt) return null;

    const isCountingDown = event.status !== 'drawn' && remainingMs > 0;
    const label =
        event.status === 'drawn'
            ? '당첨자 발표 완료'
            : remainingMs > 0
              ? '당첨자 발표까지'
              : '곧 당첨자를 발표합니다';

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
