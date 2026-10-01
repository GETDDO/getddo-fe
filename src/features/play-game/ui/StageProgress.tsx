import type { Ref } from 'react';

import characterUrl from '../assets/takko-run/character.png';
import { STAGE_MARKS } from '../model/takko-run';
import { CHARACTER_FRAMES, pick } from '../model/takko-run-atlas';

// 타코야끼 대기 얼굴 — 캐릭터 시트의 첫 칸만 보이도록 배경 위치를 맞춘다
const FACE_SIZE = 34;
const [, , frameWidth, frameHeight] = pick(CHARACTER_FRAMES, 0);
const SHEET_WIDTH = 1422;
const FACE_STYLE = {
    width: FACE_SIZE,
    height: FACE_SIZE,
    backgroundImage: `url(${characterUrl})`,
    backgroundSize: `${(SHEET_WIDTH * FACE_SIZE) / frameWidth}px ${(frameHeight * FACE_SIZE) / frameWidth}px`,
    backgroundPosition: '0 0',
};

/** 스테이지별 게이지 색 — 스테이지 배지(피그마 image 118)의 노랑·분홍·파랑·보라에 맞춘 토큰 */
const STAGE_COLORS = [
    'var(--color-play-yellow)',
    'var(--color-play-pink)',
    'var(--color-status-active-text)',
    'var(--color-play-lavender)',
];

// 스테이지마다 한 구간 — 1·2·3·4 스테이지를 각 색으로 칠한 게이지 (구간 사이는 2px 띄워 경계를 보여준다)
const GAUGE_BACKGROUND = `linear-gradient(to right, ${STAGE_MARKS.map((start, index) => {
    const end = STAGE_MARKS[index + 1] ?? 1;
    const color = STAGE_COLORS[index] ?? STAGE_COLORS[0];
    const gapStart = index > 0 ? 'calc(' + start * 100 + '% + 1px)' : '0%';
    const gapEnd = index < STAGE_MARKS.length - 1 ? 'calc(' + end * 100 + '% - 1px)' : '100%';
    return `transparent ${start * 100}%, transparent ${gapStart}, ${color} ${gapStart}, ${color} ${gapEnd}, transparent ${gapEnd}`;
}).join(', ')})`;

/**
 * 스테이지 진행도 — 숫자 없이 스테이지 색 게이지로만 보여준다. 지나온 구간은 또렷하게, 남은 구간은 흐리게.
 * 타코야끼 대기 얼굴이 지금 위치를 달려간다.
 * 매 프레임 바뀌는 값은 다시 그리지 않고 restRef·faceRef의 스타일만 바꾼다 (TakkoRunGame이 갱신)
 */
export function StageProgress({
    stage,
    restRef,
    faceRef,
}: {
    stage: number;
    restRef: Ref<HTMLDivElement>;
    faceRef: Ref<HTMLDivElement>;
}) {
    return (
        <div
            role="img"
            aria-label={`스테이지 진행도 — 지금 스테이지 ${stage}`}
            className="pointer-events-none relative h-7 w-full"
        >
            <div className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 overflow-hidden rounded-full">
                <div className="absolute inset-0" style={{ backgroundImage: GAUGE_BACKGROUND }} />
                {/* 아직 못 간 구간 — 위에 어두운 막을 덮어 흐리게 한다 */}
                <div
                    ref={restRef}
                    className="absolute inset-0 bg-(--takko-ink)/70 will-change-transform"
                />
            </div>
            {/* 지금 위치 — 타코야끼 대기 얼굴 */}
            {/* 길 전체 폭의 틀을 진행도만큼 옮겨, 그 왼쪽 끝에 붙은 얼굴이 따라가게 한다 */}
            <div ref={faceRef} aria-hidden className="absolute inset-0 will-change-transform">
                <div
                    className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-[62%] drop-shadow-md"
                    style={FACE_STYLE}
                />
            </div>
        </div>
    );
}
