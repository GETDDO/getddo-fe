import type { MouseEvent } from 'react';

import speakerMuted from '../assets/ui/volume/speaker-0.png';
import speakerLow from '../assets/ui/volume/speaker-1.png';
import speakerMid from '../assets/ui/volume/speaker-3.png';
import speakerHigh from '../assets/ui/volume/speaker-5.png';
import gaugeMuted from '../assets/ui/volume/volume-0.png';
import gaugeLow from '../assets/ui/volume/volume-1.png';
import gaugeMid from '../assets/ui/volume/volume-3.png';
import gaugeHigh from '../assets/ui/volume/volume-5.png';

/**
 * 누를 때마다 도는 소리 단계 — 음소거 → 1칸 → 3칸 → 5칸 → 음소거 (피그마 image 117 중 네 가지만 쓴다).
 * level은 useLoopingBgm의 0~5단계
 */
const STEPS = [
    { level: 0, speaker: speakerMuted, gauge: gaugeMuted, label: '음소거' },
    { level: 1, speaker: speakerLow, gauge: gaugeLow, label: '소리 작게' },
    { level: 3, speaker: speakerMid, gauge: gaugeMid, label: '소리 보통' },
    { level: 5, speaker: speakerHigh, gauge: gaugeHigh, label: '소리 크게' },
] as const;

// 이전에 다른 단계(2·4)로 저장돼 있으면 가까운 단계로 보여준다
const stepIndexOf = (level: number) => {
    let nearest = 0;
    STEPS.forEach((step, index) => {
        if (Math.abs(step.level - level) < Math.abs((STEPS[nearest]?.level ?? 0) - level))
            nearest = index;
    });
    return nearest;
};

// 마우스로 눌러도 초점이 버튼에 남지 않게 한다 — 남으면 다음 스페이스바가 점프 대신 이 버튼을 누른다
const keepFocus = (event: MouseEvent) => event.preventDefault();

/** 배경 음악 소리 버튼 — 스피커와 단계 게이지를 한 덩어리로 보여준다 (스피커 32 + 게이지 16) */
export function VolumeControl({
    level,
    onLevelChange,
}: {
    level: number;
    onLevelChange: (level: number) => void;
}) {
    const index = stepIndexOf(level);
    const current = STEPS[index] ?? STEPS[2];
    const next = STEPS[(index + 1) % STEPS.length] ?? STEPS[0];

    return (
        <button
            type="button"
            onMouseDown={keepFocus}
            onClick={() => onLevelChange(next.level)}
            aria-label={`${current.label} — 눌러서 ${next.label}`}
            className="flex shrink-0 cursor-pointer flex-col items-center gap-0.5 transition-[translate,filter] duration-150 outline-none hover:-translate-y-0.5 hover:brightness-105 focus-visible:-translate-y-0.5 focus-visible:brightness-110 active:translate-y-0.5"
        >
            <img src={current.speaker} alt="" draggable={false} className="h-6 w-auto sm:h-8" />
            <img src={current.gauge} alt="" draggable={false} className="h-3 w-auto sm:h-4" />
        </button>
    );
}
