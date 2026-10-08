import characterUrl from '../assets/takkoRun/character.png';
import { CHARACTER_FRAMES, pick } from '../model/takkoRunAtlas';

// 타코야끼 대기 얼굴 — 캐릭터 시트의 첫 칸만 보이도록 배경 위치를 맞춘다
const [, , frameWidth, frameHeight] = pick(CHARACTER_FRAMES, 0);
const SHEET_WIDTH = 1422;

/** 타꼬런 캐릭터의 대기 얼굴 — 진행·시간 게이지 위를 오가는 표시로 쓴다 */
export function TakkoFace({ size, className = '' }: { size: number; className?: string }) {
    return (
        <div
            aria-hidden
            className={className}
            style={{
                width: size,
                height: size,
                backgroundImage: `url(${characterUrl})`,
                backgroundSize: `${(SHEET_WIDTH * size) / frameWidth}px ${(frameHeight * size) / frameWidth}px`,
                backgroundPosition: '0 0',
            }}
        />
    );
}
