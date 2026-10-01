/**
 * 타꼬런 스프라이트 아틀라스 좌표 — assets/takko-run의 시트 이미지 안에서 각 그림의 [x, y, 너비, 높이].
 * 시트는 피그마 이미지(image 97·101~106)를 항목별로 잘라 가로로 이어 붙인 것이며, 게임 화면 크기의 2배로 저장했다
 */
import {
    STAGE2_OBSTACLE_RECTS,
    STAGE3_OBSTACLE_RECTS,
    STAGE4_OBSTACLE_RECTS,
} from './takko-run-stage-atlas';

export type AtlasRect = readonly [x: number, y: number, width: number, height: number];

/** 시트 픽셀 → 게임 좌표 배율 (시트는 레티나 대응으로 2배 크기) */
export const ATLAS_SCALE = 0.5;

/** 캐릭터(image 97) — 대기, 달리기 3, 점프 3, 기절 순서. 모든 칸이 같은 크기라 발 위치가 맞는다 */
export const CHARACTER_FRAMES: readonly AtlasRect[] = [0, 178, 356, 534, 712, 890, 1068, 1246].map(
    (x) => [x, 0, 176, 176] as const,
);
export const CHARACTER_FRAME = {
    idle: 0,
    run: [1, 2, 3],
    takeoff: 4,
    rise: 5,
    fall: 6,
    stunned: 7,
} as const;

/** 장애물 — 소스·마요 병(image 105)과 꼬치(image 106) */
export const SAUCE_RECTS: readonly AtlasRect[] = [
    [0, 0, 100, 195],
    [102, 0, 164, 128],
    [268, 0, 114, 136],
    [384, 0, 107, 178],
    [493, 0, 153, 67],
    [648, 0, 104, 225],
];
export const SKEWER_RECTS: readonly AtlasRect[] = [
    [0, 0, 35, 202],
    [37, 0, 114, 179],
    [153, 0, 79, 214],
    [234, 0, 115, 203],
    [351, 0, 129, 194],
    [482, 0, 112, 152],
];

/** 하늘 요소 — 별(image 102), 구름(image 103), 등불(image 104) */
export const STAR_RECTS: readonly AtlasRect[] = [
    [0, 0, 54, 54],
    [56, 0, 58, 61],
    [116, 0, 31, 30],
    [149, 0, 42, 57],
    [193, 0, 60, 57],
    [255, 0, 42, 41],
    [299, 0, 50, 54],
    [351, 0, 56, 50],
];
export const CLOUD_RECTS: readonly AtlasRect[] = [
    [0, 0, 84, 64],
    [86, 0, 150, 84],
    [238, 0, 181, 120],
    [421, 0, 159, 111],
    [582, 0, 187, 70],
    [771, 0, 82, 61],
];
export const LANTERN_RECTS: readonly AtlasRect[] = [
    [0, 0, 116, 134],
    [118, 0, 77, 139],
    [197, 0, 82, 134],
    [281, 0, 93, 117],
    [376, 0, 99, 136],
    [477, 0, 65, 120],
];

export type ObstacleSheet =
    'sauces' | 'skewers' | 'stage2Obstacles' | 'stage3Obstacles' | 'stage4Obstacles';

const STAGE_OBSTACLE_SHEETS = [
    [
        ...SAUCE_RECTS.map((rect) => ({ sheet: 'sauces' as const, rect })),
        ...SKEWER_RECTS.map((rect) => ({ sheet: 'skewers' as const, rect })),
    ],
    STAGE2_OBSTACLE_RECTS.map((rect) => ({ sheet: 'stage2Obstacles' as const, rect })),
    STAGE3_OBSTACLE_RECTS.map((rect) => ({ sheet: 'stage3Obstacles' as const, rect })),
    STAGE4_OBSTACLE_RECTS.map((rect) => ({ sheet: 'stage4Obstacles' as const, rect })),
];

/** 나올 수 있는 장애물 전체 목록 — 게임 좌표 크기로 환산해 충돌 판정에도 쓴다 */
export const OBSTACLE_SPRITES: readonly { sheet: ObstacleSheet; rect: AtlasRect }[] =
    STAGE_OBSTACLE_SHEETS.flat();

/** 스테이지별로 나오는 장애물 — OBSTACLE_SPRITES의 번호 목록 (스테이지 1이 0번) */
export const STAGE_OBSTACLE_POOLS: readonly (readonly number[])[] = STAGE_OBSTACLE_SHEETS.map(
    (sheet, stageIndex) => {
        const start = STAGE_OBSTACLE_SHEETS.slice(0, stageIndex).reduce(
            (sum, s) => sum + s.length,
            0,
        );
        return sheet.map((_, index) => start + index);
    },
);

/** 목록에서 번호로 꺼낸다 — 번호가 목록 길이를 넘으면 처음부터 다시 센다 */
export function pick<T>(list: readonly T[], index: number): T {
    const item = list[index % list.length];
    if (item === undefined) throw new Error('빈 스프라이트 목록');
    return item;
}
