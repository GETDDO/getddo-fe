import {
    ATLAS_SCALE,
    CHARACTER_FRAME,
    OBSTACLE_SPRITES,
    pick,
    STAGE_OBSTACLE_POOLS,
} from './takkoRunAtlas';

/**
 * 타꼬런 규칙 — 크롬 공룡 달리기처럼 점프로 장애물을 피하며 멀리 달린다.
 * 화면 그리기와 떼어 둔 순수 계산이라 시간(dt)만 넣으면 같은 결과가 나온다.
 * 좌표는 게임 화면(840×546) 기준, 높이·속도는 위쪽이 +다
 */
export const WORLD_WIDTH = 840;
export const WORLD_HEIGHT = 546;
/** 땅 윗면의 y — 캐릭터 발과 장애물 바닥이 여기에 닿는다 */
export const GROUND_Y = 474;
export const RUNNER_X = 96;
export const RUNNER_SIZE = 88;

const GRAVITY = 2800;
const JUMP_VELOCITY = 1000;
/** 점프 키를 일찍 떼면 이 속도로 줄여 낮게 뛴다 */
const JUMP_CUT_VELOCITY = 420;
/** 착지 직전에 누른 점프를 기억해 두는 시간 */
const JUMP_BUFFER_SECONDS = 0.12;
const TAKEOFF_SECONDS = 0.08;
/** 점수 1점당 달린 거리 */
const DISTANCE_PER_POINT = 10;

/**
 * 스테이지 — 점수가 기준을 넘으면 다음 스테이지로 올라가고 달리는 속도가 빨라진다.
 * 지금은 속도만 다르고, 나중에 배경·장애물 난이도도 스테이지별로 바꿀 예정이다
 */
export const STAGES = [
    // 장애물·배경은 스테이지마다 다른 그림 (피그마 image 100~106 / 123~127 / 128~132 / 136·139~143)
    // 1: 노을 마을, 높이 90 이하 장애물만
    { fromScore: 0, speed: 420, tallObstacles: false, doubleChance: 0 },
    // 2: 분홍 노을 축제, 높은 장애물도 나옴
    { fromScore: 400, speed: 540, tallObstacles: true, doubleChance: 0 },
    // 3: 밤 골목, 가끔 낮은 장애물 두 개가 붙어서 나옴
    { fromScore: 1000, speed: 660, tallObstacles: true, doubleChance: 0.25 },
    // 4: 보랏빛 축제, 두 개짜리가 더 자주
    { fromScore: 1800, speed: 800, tallObstacles: true, doubleChance: 0.4 },
] as const;
/** 1스테이지에 나오는 장애물의 최대 높이 — 높은 병·꼬치는 2스테이지부터 */
const EASY_OBSTACLE_MAX_HEIGHT = 90;
/** 두 개짜리에 쓰는 낮은 장애물의 최대 높이 */
const LOW_OBSTACLE_MAX_HEIGHT = 80;
/** 두 개짜리 장애물 사이 틈 — 길게 뛰면 한 번에 넘을 수 있는 폭 */
const DOUBLE_GAP = 46;
/** 스테이지가 바뀔 때 새 속도로 따라붙는 빠르기 (1초에 남은 차이의 몇 배만큼) */
const SPEED_EASE_PER_SECOND = 5;
/** 스테이지가 바뀔 때 새 배경이 오른쪽에서 밀려 들어오는 시간 */
const THEME_FADE_SECONDS = 0.5;

/**
 * 진행도 게이지의 끝 점수 — 스테이지 4 구간도 다른 구간처럼 보이도록 스테이지 4 시작(1,800)에서
 * 스테이지 3 길이(800점)만큼 더 간 2,600점까지 그린다. 그 뒤로는 얼굴이 끝에 머문다
 */
export const GAUGE_END_SCORE = STAGES[3].fromScore + (STAGES[3].fromScore - STAGES[2].fromScore);

/** 스테이지 시작점의 진행도 위치 (0~1) */
export const STAGE_MARKS = STAGES.map((stage) => stage.fromScore / GAUGE_END_SCORE);

/** 점수 → 진행도 (0~1, 게이지 끝 점수에 닿으면 1) */
export const progressOf = (score: number) => Math.min(1, score / GAUGE_END_SCORE);

/** 점수에 맞는 스테이지 (1부터) */
export function stageForScore(score: number) {
    let stage = 1;
    STAGES.forEach((item, index) => {
        if (score >= item.fromScore) stage = index + 1;
    });
    return stage;
}

// 그림의 투명한 가장자리까지 부딪힌 것으로 치지 않도록 판정 영역을 안쪽으로 줄인다
const RUNNER_HITBOX = { left: 22, right: 22, top: 20, bottom: 8 };
const OBSTACLE_INSET_X = 0.2;
const OBSTACLE_INSET_TOP = 0.1;

export type RunPhase = 'ready' | 'running' | 'paused' | 'over';

export interface Obstacle {
    /** OBSTACLE_SPRITES의 번호 */
    sprite: number;
    x: number;
    width: number;
    height: number;
}

export interface RunState {
    phase: RunPhase;
    /** 발이 땅에서 떨어진 높이 */
    height: number;
    velocity: number;
    /** 이번 점프를 시작한 뒤 흐른 시간 */
    airTime: number;
    /** 남은 점프 예약 시간 (0이면 예약 없음) */
    jumpBuffer: number;
    distance: number;
    speed: number;
    /** 지금 스테이지 (1부터) */
    stage: number;
    /** 지금까지 뛴 횟수 — 점프할 때마다 1씩 늘어 효과음 신호로 쓴다 */
    jumps: number;
    /** 바로 전 스테이지 — 배경이 이 스테이지에서 지금 스테이지로 서서히 바뀐다 */
    previousStage: number;
    /** 배경이 지금 스테이지로 바뀐 정도 (0~1) */
    themeBlend: number;
    /** 화면이 떠 있던 전체 시간 — 대기 중 흔들림·별 반짝임에 쓴다 */
    elapsed: number;
    obstacles: Obstacle[];
    /** 다음 장애물이 나올 거리 */
    nextObstacleAt: number;
}

export function createRun(): RunState {
    return {
        phase: 'ready',
        height: 0,
        velocity: 0,
        airTime: 0,
        jumpBuffer: 0,
        distance: 0,
        speed: STAGES[0].speed,
        stage: 1,
        jumps: 0,
        previousStage: 1,
        themeBlend: 1,
        elapsed: 0,
        obstacles: [],
        nextObstacleAt: WORLD_WIDTH * 0.6,
    };
}

const onGround = (run: RunState) => run.height <= 0 && run.velocity <= 0;

function launch(run: RunState) {
    run.velocity = JUMP_VELOCITY;
    run.jumps += 1;
    run.airTime = 0;
    run.jumpBuffer = 0;
}

/** 점프 키를 눌렀을 때 — 대기 중이면 출발하며 뛰고, 공중이면 착지 직후 뛰도록 예약한다 */
export function pressJump(run: RunState) {
    if (run.phase === 'over' || run.phase === 'paused') return;
    if (run.phase === 'ready') run.phase = 'running';
    if (onGround(run)) launch(run);
    else run.jumpBuffer = JUMP_BUFFER_SECONDS;
}

/** 점프 키를 뗐을 때 — 올라가는 중이면 낮게 끊는다 */
export function releaseJump(run: RunState) {
    if (run.velocity > JUMP_CUT_VELOCITY) run.velocity = JUMP_CUT_VELOCITY;
}

function overlaps(run: RunState, obstacle: Obstacle) {
    const runnerLeft = RUNNER_X + RUNNER_HITBOX.left;
    const runnerRight = RUNNER_X + RUNNER_SIZE - RUNNER_HITBOX.right;
    const runnerBottom = run.height + RUNNER_HITBOX.bottom;
    const insetX = obstacle.width * OBSTACLE_INSET_X;
    const obstacleTop = obstacle.height * (1 - OBSTACLE_INSET_TOP);
    return (
        runnerRight > obstacle.x + insetX &&
        runnerLeft < obstacle.x + obstacle.width - insetX &&
        runnerBottom < obstacleTop
    );
}

const obstacleSize = (sprite: number) => {
    const [, , width, height] = pick(OBSTACLE_SPRITES, sprite).rect;
    return { width: width * ATLAS_SCALE, height: height * ATLAS_SCALE };
};
const isEasy = (sprite: number) => obstacleSize(sprite).height <= EASY_OBSTACLE_MAX_HEIGHT;
const isLow = (sprite: number) => obstacleSize(sprite).height <= LOW_OBSTACLE_MAX_HEIGHT;

function spawnObstacle(run: RunState, random: () => number) {
    const stage = pick(STAGES, run.stage - 1);
    const stagePool = pick(STAGE_OBSTACLE_POOLS, run.stage - 1);
    const pool = stage.tallObstacles ? stagePool : stagePool.filter(isEasy);
    const first = pick(pool, Math.floor(random() * pool.length));
    const firstSize = obstacleSize(first);
    run.obstacles.push({ sprite: first, x: WORLD_WIDTH + 20, ...firstSize });
    // 스테이지 3부터는 낮은 장애물 두 개가 붙어서 나오기도 한다
    if (random() < stage.doubleChance) {
        const lowPool = stagePool.filter(isLow);
        const second = pick(lowPool, Math.floor(random() * lowPool.length));
        run.obstacles.push({
            sprite: second,
            x: WORLD_WIDTH + 20 + firstSize.width + DOUBLE_GAP,
            ...obstacleSize(second),
        });
    }
    // 빨라질수록 거리 간격도 넓혀 반응할 시간(약 0.9~1.6초)을 남긴다 — 점프 한 번(약 0.7초)보다는 항상 길다
    run.nextObstacleAt = run.distance + run.speed * (0.65 + random() * 0.7) + 180;
}

/** dt초만큼 진행한다. 이번 진행에서 부딪혀 끝났으면 true */
export function stepRun(run: RunState, dt: number, random: () => number = Math.random) {
    run.elapsed += dt;
    if (run.phase !== 'running') return false;

    // 스테이지를 올리고, 속도는 한 번에 튀지 않게 새 스테이지 속도로 부드럽게 따라붙는다
    const nextStage = stageForScore(scoreOf(run));
    if (nextStage !== run.stage) {
        run.previousStage = run.stage;
        run.stage = nextStage;
        run.themeBlend = 0;
    }
    run.themeBlend = Math.min(1, run.themeBlend + dt / THEME_FADE_SECONDS);
    const target = pick(STAGES, run.stage - 1).speed;
    run.speed += (target - run.speed) * Math.min(1, SPEED_EASE_PER_SECOND * dt);
    const moved = run.speed * dt;
    run.distance += moved;

    // 점프
    run.jumpBuffer = Math.max(0, run.jumpBuffer - dt);
    if (!onGround(run) || run.velocity > 0) {
        run.airTime += dt;
        run.velocity -= GRAVITY * dt;
        run.height = Math.max(0, run.height + run.velocity * dt);
        if (run.height === 0) run.velocity = 0;
    }
    if (onGround(run) && run.jumpBuffer > 0) launch(run);

    // 장애물
    for (const obstacle of run.obstacles) obstacle.x -= moved;
    run.obstacles = run.obstacles.filter((obstacle) => obstacle.x + obstacle.width > 0);
    if (run.distance >= run.nextObstacleAt) spawnObstacle(run, random);

    if (run.obstacles.some((obstacle) => overlaps(run, obstacle))) {
        run.phase = 'over';
        return true;
    }
    return false;
}

export const scoreOf = (run: RunState) => Math.floor(run.distance / DISTANCE_PER_POINT);

/** 지금 그릴 캐릭터 칸 — 땅에서는 달리기 3칸을 거리에 맞춰 돌리고, 공중에서는 도약·상승·하강 */
export function runnerFrame(run: RunState): number {
    if (run.phase === 'over') return CHARACTER_FRAME.stunned;
    if (run.phase === 'ready') return CHARACTER_FRAME.idle;
    if (!onGround(run)) {
        if (run.airTime < TAKEOFF_SECONDS) return CHARACTER_FRAME.takeoff;
        return run.velocity > 0 ? CHARACTER_FRAME.rise : CHARACTER_FRAME.fall;
    }
    const steps = CHARACTER_FRAME.run;
    return pick(steps, Math.floor(run.distance / 36));
}

/** 달리는 중이면 멈춘다 */
export function pauseRun(run: RunState) {
    if (run.phase === 'running') run.phase = 'paused';
}

/** 멈춘 판을 이어서 달린다 */
export function resumeRun(run: RunState) {
    if (run.phase === 'paused') run.phase = 'running';
}
