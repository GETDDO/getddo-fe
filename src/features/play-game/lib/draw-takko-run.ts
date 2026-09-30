import {
    GROUND_Y,
    RUNNER_SIZE,
    RUNNER_X,
    runnerFrame,
    type RunState,
    WORLD_HEIGHT,
    WORLD_WIDTH,
} from '../model/takko-run';
import {
    ATLAS_SCALE,
    type AtlasRect,
    CHARACTER_FRAMES,
    CLOUD_RECTS,
    LANTERN_RECTS,
    OBSTACLE_SPRITES,
    pick,
    STAR_RECTS,
} from '../model/takko-run-atlas';

export type TakkoRunImageKey =
    'character' | 'clouds' | 'lanterns' | 'sauces' | 'skewers' | 'sky' | 'stars' | 'town';
export type TakkoRunImages = Record<TakkoRunImageKey, HTMLImageElement>;

/** 땅 색 — 따로 정한 색 없이 그림(마을 실루엣·하늘)에서 뽑아 배경과 어울리게 한다 */
export interface TakkoRunPalette {
    ground: string;
    groundDetail: string;
}

// 하늘 요소 배치 — 매 판 같은 풍경이 되도록 고정값으로 둔다. span은 반복되는 폭
const STARS = [
    { sprite: 0, x: 60, y: 40, twinkle: 0 },
    { sprite: 4, x: 210, y: 96, twinkle: 1.3 },
    { sprite: 2, x: 330, y: 30, twinkle: 2.1 },
    { sprite: 6, x: 470, y: 120, twinkle: 0.6 },
    { sprite: 5, x: 590, y: 52, twinkle: 2.8 },
    { sprite: 1, x: 720, y: 104, twinkle: 1.9 },
    { sprite: 3, x: 820, y: 36, twinkle: 0.2 },
    { sprite: 7, x: 930, y: 84, twinkle: 3.4 },
];
const STAR_SPAN = 1000;
const CLOUDS = [
    { sprite: 2, x: 40, y: 130 },
    { sprite: 0, x: 300, y: 70 },
    { sprite: 4, x: 480, y: 170 },
    { sprite: 3, x: 760, y: 110 },
    { sprite: 5, x: 1000, y: 60 },
    { sprite: 1, x: 1150, y: 150 },
];
const CLOUD_SPAN = 1320;
const LANTERNS = [
    { sprite: 0, x: 120, string: 18, sway: 0 },
    { sprite: 2, x: 360, string: 44, sway: 1.7 },
    { sprite: 4, x: 610, string: 26, sway: 0.9 },
    { sprite: 1, x: 860, string: 52, sway: 2.4 },
    { sprite: 5, x: 1080, string: 34, sway: 1.2 },
];
const LANTERN_SPAN = 1240;
const TOWN_HEIGHT = 120;
const PEBBLE_SPAN = 420;
const PEBBLES = [
    [20, 16, 6],
    [96, 34, 4],
    [170, 12, 8],
    [238, 46, 5],
    [300, 24, 4],
    [372, 58, 6],
] as const;

/** 왼쪽으로 흐르는 배경의 x — 거리에 factor를 곱한 만큼 밀리고 span마다 반복된다 */
function scroll(x: number, distance: number, factor: number, span: number, margin: number) {
    const shifted = (x - distance * factor) % span;
    return (shifted < 0 ? shifted + span : shifted) - margin;
}

function drawSprite(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    [sx, sy, sw, sh]: AtlasRect,
    x: number,
    y: number,
) {
    ctx.drawImage(image, sx, sy, sw, sh, x, y, sw * ATLAS_SCALE, sh * ATLAS_SCALE);
}

/** 그림 한 줄에서 가장 어둡거나 밝은 픽셀의 색 */
function sampleRow(image: HTMLImageElement, row: number, pick: 'darkest' | 'middle') {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 'transparent';
    ctx.drawImage(image, 0, row, image.naturalWidth, 1, 0, 0, image.naturalWidth, 1);
    const data = ctx.getImageData(0, 0, canvas.width, 1).data;
    let best = pick === 'middle' ? Math.floor(canvas.width / 2) * 4 : -1;
    if (pick === 'darkest') {
        let darkest = Infinity;
        for (let i = 0; i < data.length; i += 4) {
            const light = (data[i] ?? 0) + (data[i + 1] ?? 0) + (data[i + 2] ?? 0);
            if ((data[i + 3] ?? 0) > 200 && light < darkest) {
                darkest = light;
                best = i;
            }
        }
    }
    if (best < 0) return 'transparent';
    return `rgb(${data[best] ?? 0} ${data[best + 1] ?? 0} ${data[best + 2] ?? 0})`;
}

export function createPalette(images: TakkoRunImages): TakkoRunPalette {
    return {
        ground: sampleRow(images.town, images.town.naturalHeight - 2, 'darkest'),
        groundDetail: sampleRow(images.sky, images.sky.naturalHeight - 1, 'middle'),
    };
}

export function drawRun(
    ctx: CanvasRenderingContext2D,
    run: RunState,
    images: TakkoRunImages,
    palette: TakkoRunPalette,
) {
    const { distance, elapsed } = run;
    ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // 하늘 그라데이션
    ctx.drawImage(images.sky, 0, 0, WORLD_WIDTH, GROUND_Y);

    // 별 — 거의 움직이지 않고 반짝인다
    for (const star of STARS) {
        ctx.globalAlpha = 0.55 + 0.45 * Math.sin(elapsed * 2 + star.twinkle);
        const x = scroll(star.x, distance, 0.03, STAR_SPAN, 40);
        drawSprite(ctx, images.stars, pick(STAR_RECTS, star.sprite), x, star.y);
    }
    ctx.globalAlpha = 1;

    // 구름
    for (const cloud of CLOUDS) {
        const x = scroll(cloud.x, distance, 0.12, CLOUD_SPAN, 100);
        drawSprite(ctx, images.clouds, pick(CLOUD_RECTS, cloud.sprite), x, cloud.y);
    }

    // 등불 — 화면 위에서 줄에 매달려 살랑인다
    ctx.strokeStyle = palette.ground;
    ctx.lineWidth = 2;
    for (const lantern of LANTERNS) {
        const [, , sw] = pick(LANTERN_RECTS, lantern.sprite);
        const width = sw * ATLAS_SCALE;
        const x = scroll(lantern.x, distance, 0.25, LANTERN_SPAN, 80) + width / 2;
        ctx.save();
        ctx.translate(x, 0);
        ctx.rotate(Math.sin(elapsed * 1.6 + lantern.sway) * 0.06);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, lantern.string + 2);
        ctx.stroke();
        drawSprite(
            ctx,
            images.lanterns,
            pick(LANTERN_RECTS, lantern.sprite),
            -width / 2,
            lantern.string,
        );
        ctx.restore();
    }

    // 마을 실루엣 — 땅에 붙여 가로로 이어 그린다
    const townWidth = (images.town.naturalWidth * TOWN_HEIGHT) / images.town.naturalHeight;
    const townX = -((distance * 0.4) % townWidth);
    for (let x = townX; x < WORLD_WIDTH; x += townWidth) {
        ctx.drawImage(images.town, x, GROUND_Y - TOWN_HEIGHT + 4, townWidth, TOWN_HEIGHT);
    }

    // 땅과 흘러가는 자갈
    ctx.fillStyle = palette.ground;
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
    ctx.fillStyle = palette.groundDetail;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 3);
    ctx.globalAlpha = 0.3;
    const pebbleStart = scroll(0, distance, 1, PEBBLE_SPAN, PEBBLE_SPAN);
    for (let base = pebbleStart; base < WORLD_WIDTH; base += PEBBLE_SPAN) {
        for (const [px, py, size] of PEBBLES) ctx.fillRect(base + px, GROUND_Y + 10 + py, size, 3);
    }
    ctx.globalAlpha = 1;

    // 장애물 — 바닥을 땅에 살짝 묻는다
    for (const obstacle of run.obstacles) {
        const { sheet, rect } = pick(OBSTACLE_SPRITES, obstacle.sprite);
        drawSprite(ctx, images[sheet], rect, obstacle.x, GROUND_Y - obstacle.height + 4);
    }

    // 캐릭터 — 대기 중에는 제자리에서 통통 튄다
    const bob = run.phase === 'ready' ? Math.abs(Math.sin(elapsed * 4)) * 4 : 0;
    const [sx, sy, sw, sh] = pick(CHARACTER_FRAMES, runnerFrame(run));
    ctx.drawImage(
        images.character,
        sx,
        sy,
        sw,
        sh,
        RUNNER_X,
        GROUND_Y - run.height - RUNNER_SIZE + 2 - bob,
        RUNNER_SIZE,
        RUNNER_SIZE,
    );
}
