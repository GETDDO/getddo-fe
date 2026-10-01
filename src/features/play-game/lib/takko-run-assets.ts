import type { TakkoRunImageKey, TakkoRunImages } from './draw-takko-run';

import completeUrl from '../assets/audio/complete.wav';
import bgmUrl from '../assets/audio/flowerbed_fields.m4a';
import bellUrl from '../assets/audio/pleasing-bell.wav';
import jumpUrl from '../assets/audio/slime_jump.wav';
import characterUrl from '../assets/takko-run/character.png';
import cloudsUrl from '../assets/takko-run/clouds.png';
import lanternsUrl from '../assets/takko-run/lanterns.png';
import saucesUrl from '../assets/takko-run/sauces.png';
import skewersUrl from '../assets/takko-run/skewers.png';
import skyUrl from '../assets/takko-run/sky.jpg';
import stage2DecorUrl from '../assets/takko-run/stage2/decor.webp';
import stage2GroundUrl from '../assets/takko-run/stage2/ground.webp';
import stage2ObstaclesUrl from '../assets/takko-run/stage2/obstacles.webp';
import stage2SkyUrl from '../assets/takko-run/stage2/sky.jpg';
import stage2TownUrl from '../assets/takko-run/stage2/town.webp';
import stage3DecorUrl from '../assets/takko-run/stage3/decor.webp';
import stage3GroundUrl from '../assets/takko-run/stage3/ground.webp';
import stage3ObstaclesUrl from '../assets/takko-run/stage3/obstacles.webp';
import stage3SkyUrl from '../assets/takko-run/stage3/sky.jpg';
import stage3TownUrl from '../assets/takko-run/stage3/town.webp';
import stage4DecorUrl from '../assets/takko-run/stage4/decor.webp';
import stage4GroundUrl from '../assets/takko-run/stage4/ground-1.webp';
import stage4Ground2Url from '../assets/takko-run/stage4/ground-2.webp';
import stage4ObstaclesUrl from '../assets/takko-run/stage4/obstacles.webp';
import stage4SkyUrl from '../assets/takko-run/stage4/sky.jpg';
import stage4TownUrl from '../assets/takko-run/stage4/town.webp';
import starsUrl from '../assets/takko-run/stars.png';
import townUrl from '../assets/takko-run/town.png';

export const TAKKO_RUN_BGM_URL = bgmUrl;

/** 효과음 — 점프, 스테이지가 바뀔 때, 게임이 끝날 때 */
export const TAKKO_RUN_SOUNDS = {
    jump: jumpUrl,
    stageUp: bellUrl,
    gameOver: completeUrl,
} as const;

const IMAGE_SOURCES: Record<TakkoRunImageKey, string> = {
    character: characterUrl,
    clouds: cloudsUrl,
    lanterns: lanternsUrl,
    sauces: saucesUrl,
    skewers: skewersUrl,
    sky: skyUrl,
    stars: starsUrl,
    town: townUrl,
    // 스테이지 2~4 배경·장애물 (피그마 image 123~143)
    stage2Decor: stage2DecorUrl,
    stage2Obstacles: stage2ObstaclesUrl,
    stage2Sky: stage2SkyUrl,
    stage2Town: stage2TownUrl,
    stage2Ground: stage2GroundUrl,
    stage3Decor: stage3DecorUrl,
    stage3Obstacles: stage3ObstaclesUrl,
    stage3Sky: stage3SkyUrl,
    stage3Town: stage3TownUrl,
    stage3Ground: stage3GroundUrl,
    stage4Decor: stage4DecorUrl,
    stage4Obstacles: stage4ObstaclesUrl,
    stage4Sky: stage4SkyUrl,
    stage4Town: stage4TownUrl,
    stage4Ground: stage4GroundUrl,
    stage4Ground2: stage4Ground2Url,
};

// 한 번 받은 그림은 다시 받지 않는다 — 썸네일 화면에서 미리 받아 두면 게임 시작이 바로 된다
let imagesPromise: Promise<TakkoRunImages> | null = null;

/** 게임 그림을 받아 풀어 둔다 (실패하면 다음에 다시 시도) */
export function loadTakkoRunImages(): Promise<TakkoRunImages> {
    imagesPromise ??= Promise.all(
        Object.entries(IMAGE_SOURCES).map(async ([key, src]) => {
            const image = new Image();
            image.src = src;
            await image.decode();
            return [key, image] as const;
        }),
    )
        .then((entries) => Object.fromEntries(entries) as TakkoRunImages)
        .catch((error: unknown) => {
            imagesPromise = null;
            throw error;
        });
    return imagesPromise;
}

/** 게임 그림과 배경 음악을 미리 받아 둔다 — 실패해도 게임을 열 때 다시 받으므로 조용히 넘긴다 */
export function preloadTakkoRun() {
    loadTakkoRunImages().catch(() => undefined);
    // 음악은 브라우저 캐시에 받아만 두고, 재생할 때 다시 요청하면 캐시에서 바로 온다
    fetch(TAKKO_RUN_BGM_URL).catch(() => undefined);
}
