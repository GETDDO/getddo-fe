import { describe, expect, it } from 'vitest';

import {
    createRun,
    pauseRun,
    pressJump,
    releaseJump,
    resumeRun,
    runnerFrame,
    RUNNER_X,
    scoreOf,
    stageForScore,
    STAGES,
    stepRun,
} from './takkoRun';
import { CHARACTER_FRAME, OBSTACLE_SPRITES } from './takkoRunAtlas';

const STEP = 1 / 60;
const run = (seconds: number, state = createRun(), random = () => 0.5) => {
    for (let t = 0; t < seconds; t += STEP) stepRun(state, STEP, random);
    return state;
};

describe('타꼬런 규칙', () => {
    it('대기 중에는 움직이지 않고, 점프 키로 출발한다', () => {
        const state = run(1);
        expect(state.phase).toBe('ready');
        expect(state.distance).toBe(0);

        pressJump(state);
        expect(state.phase).toBe('running');
        expect(runnerFrame(state)).toBe(CHARACTER_FRAME.takeoff);
    });

    it('점프하면 올라갔다가 땅으로 돌아온다', () => {
        const state = createRun();
        pressJump(state);
        for (let t = 0; t < 0.2; t += STEP) stepRun(state, STEP, () => 0.99);
        expect(state.height).toBeGreaterThan(100);
        for (let t = 0; t < 1; t += STEP) stepRun(state, STEP, () => 0.99);
        expect(state.height).toBe(0);
        expect(CHARACTER_FRAME.run).toContain(runnerFrame(state));
    });

    it('점프 키를 일찍 떼면 낮게 뛴다', () => {
        const peak = (release: boolean) => {
            const state = createRun();
            pressJump(state);
            stepRun(state, STEP);
            if (release) releaseJump(state);
            let top = 0;
            for (let t = 0; t < 1; t += STEP) {
                stepRun(state, STEP, () => 0.99);
                top = Math.max(top, state.height);
            }
            return top;
        };
        expect(peak(true)).toBeLessThan(peak(false) / 2);
    });

    it('장애물에 부딪히면 끝나고 기절한다', () => {
        const state = createRun();
        pressJump(state);
        state.velocity = 0;
        state.height = 0;
        state.obstacles.push({ sprite: 0, x: RUNNER_X + 30, width: 40, height: 80 });
        expect(stepRun(state, STEP)).toBe(true);
        expect(state.phase).toBe('over');
        expect(runnerFrame(state)).toBe(CHARACTER_FRAME.stunned);
    });

    it('달린 거리만큼 점수가 오르고 장애물이 나온다', () => {
        const state = createRun();
        pressJump(state);
        // 점프 없이 달리다 보면 첫 장애물에 부딪힌다
        run(10, state);
        expect(state.phase).toBe('over');
        expect(scoreOf(state)).toBeGreaterThan(0);
    });

    it('점수가 기준을 넘으면 스테이지가 오르고 그 스테이지 속도로 달린다', () => {
        expect(stageForScore(0)).toBe(1);
        expect(stageForScore(STAGES[1].fromScore)).toBe(2);
        expect(stageForScore(99999)).toBe(STAGES.length);

        const state = createRun();
        pressJump(state);
        state.height = 0;
        state.velocity = 0;
        state.distance = STAGES[2].fromScore * 10;
        state.nextObstacleAt = Infinity;
        for (let t = 0; t < 3; t += STEP) stepRun(state, STEP);
        expect(state.stage).toBe(3);
        expect(state.speed).toBeCloseTo(STAGES[2].speed, 0);
    });

    it('일시정지하면 멈추고 점프도 안 되며, 이어 하면 다시 달린다', () => {
        const state = createRun();
        pressJump(state);
        run(0.5, state, () => 0.99);
        pauseRun(state);
        const distance = state.distance;
        pressJump(state);
        run(1, state, () => 0.99);
        expect(state.phase).toBe('paused');
        expect(state.distance).toBe(distance);

        resumeRun(state);
        run(0.2, state, () => 0.99);
        expect(state.phase).toBe('running');
        expect(state.distance).toBeGreaterThan(distance);
    });

    it('1스테이지는 높이 90 이하 장애물만, 3스테이지부터는 두 개짜리도 나온다', () => {
        const stageOne = createRun();
        pressJump(stageOne);
        stageOne.nextObstacleAt = 0;
        for (let i = 0; i < 12; i++) {
            stageOne.obstacles = [];
            stageOne.nextObstacleAt = stageOne.distance;
            stepRun(stageOne, STEP, () => i / 12);
            for (const obstacle of stageOne.obstacles)
                expect(obstacle.height).toBeLessThanOrEqual(90);
        }

        const stageThree = createRun();
        pressJump(stageThree);
        stageThree.distance = STAGES[2].fromScore * 10;
        stageThree.nextObstacleAt = stageThree.distance;
        // random 0 → 첫 장애물, 두 개짜리 판정 통과(0 < 0.25), 두 번째 장애물
        stepRun(stageThree, STEP, () => 0);
        expect(stageThree.stage).toBe(3);
        expect(stageThree.obstacles).toHaveLength(2);
    });

    it('스테이지마다 그 스테이지의 장애물 그림만 나온다', () => {
        const sheets = ['', '', 'stage2Obstacles', 'stage3Obstacles', 'stage4Obstacles'];
        for (const stage of [2, 3, 4]) {
            const state = createRun();
            pressJump(state);
            state.distance = (STAGES[stage - 1]?.fromScore ?? 0) * 10;
            for (let i = 0; i < 10; i++) {
                state.obstacles = [];
                state.nextObstacleAt = state.distance;
                stepRun(state, STEP, () => i / 10);
                for (const obstacle of state.obstacles) {
                    expect(OBSTACLE_SPRITES[obstacle.sprite]?.sheet).toBe(sheets[stage]);
                }
            }
        }
    });
});
