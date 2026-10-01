import { ATLAS_SCALE, CHARACTER_FRAME, OBSTACLE_SPRITES, pick } from './takko-run-atlas';

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
    { fromScore: 0, speed: 420 },
    { fromScore: 400, speed: 540 },
    { fromScore: 1000, speed: 660 },
    { fromScore: 1800, speed: 800 },
] as const;
/** 스테이지가 바뀔 때 새 속도로 따라붙는 빠르기 (1초에 남은 차이의 몇 배만큼) */
const SPEED_EASE_PER_SECOND = 2.5;

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

export type RunPhase = 'ready' | 'running' | 'over';

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
        elapsed: 0,
        obstacles: [],
        nextObstacleAt: WORLD_WIDTH * 0.6,
    };
}

const onGround = (run: RunState) => run.height <= 0 && run.velocity <= 0;

function launch(run: RunState) {
    run.velocity = JUMP_VELOCITY;
    run.airTime = 0;
    run.jumpBuffer = 0;
}

/** 점프 키를 눌렀을 때 — 대기 중이면 출발하며 뛰고, 공중이면 착지 직후 뛰도록 예약한다 */
export function pressJump(run: RunState) {
    if (run.phase === 'over') return;
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

function spawnObstacle(run: RunState, random: () => number) {
    const sprite = Math.floor(random() * OBSTACLE_SPRITES.length);
    const [, , width, height] = pick(OBSTACLE_SPRITES, sprite).rect;
    run.obstacles.push({
        sprite,
        x: WORLD_WIDTH + 20,
        width: width * ATLAS_SCALE,
        height: height * ATLAS_SCALE,
    });
    // 빨라질수록 거리 간격도 넓혀 반응할 시간(약 0.9~1.6초)을 남긴다 — 점프 한 번(약 0.7초)보다는 항상 길다
    run.nextObstacleAt = run.distance + run.speed * (0.65 + random() * 0.7) + 180;
}

/** dt초만큼 진행한다. 이번 진행에서 부딪혀 끝났으면 true */
export function stepRun(run: RunState, dt: number, random: () => number = Math.random) {
    run.elapsed += dt;
    if (run.phase !== 'running') return false;

    // 스테이지를 올리고, 속도는 한 번에 튀지 않게 새 스테이지 속도로 부드럽게 따라붙는다
    run.stage = stageForScore(scoreOf(run));
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
