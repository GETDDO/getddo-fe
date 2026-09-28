import type { LucideIcon } from 'lucide-react';

import { Gamepad2, Target, Ticket } from 'lucide-react';

import guideBanner from '../assets/guide-banner.jpg';
import takoyakiHero from '../assets/takoyaki-hero.jpg';

export interface GameGuideStep {
    icon: LucideIcon;
    text: string;
}

/** 게임 상세 화면·게임 방법 모달에 쓰는 게임별 소개 콘텐츠 (미니게임 구현 쪽에서 관리) */
export interface GameContent {
    /** 대표 이미지 위 한 줄 소개 */
    tagline: string;
    heroImage: string | null;
    guide: {
        title: string;
        subtitle: string;
        steps: GameGuideStep[];
        image: string;
    };
}

// 모든 게임 공통 — 게임별 하루 1회 응모권 1장 (getddo-spec 게임 규칙)
const REWARD_STEP: GameGuideStep = {
    icon: Ticket,
    text: '하루 한 번, 플레이하면 응모권 1장을 받아요',
};

// 게임 종류·규칙은 게임 담당자 확정 전 임시 콘텐츠. 공룡 달리기 안내·대표 이미지(image 76)와 타코야끼 대표 이미지(image 75)는 피그마 기준
const CONTENTS: Record<string, GameContent> = {
    'game-dino': {
        tagline: '장애물을 피해 멀리 달리세요.',
        heroImage: '/images/games/takoyaki-run.jpg',
        guide: {
            title: '달리고, 피하고, 응모권까지',
            subtitle: '조작은 스페이스바 하나면 끝나요',
            steps: [
                { icon: Gamepad2, text: '스페이스바로 점프해서 장애물을 피해요' },
                { icon: Target, text: '오래 버틸수록 점수가 쭉쭉 올라가요' },
                REWARD_STEP,
            ],
            image: guideBanner,
        },
    },
    'game-takoyaki': {
        tagline: '60초 안에 타코야끼를 구워내세요.',
        heroImage: takoyakiHero,
        guide: {
            title: '뒤집고, 굽고, 응모권까지',
            subtitle: '타이밍 맞춰 누르기만 하면 돼요',
            steps: [
                { icon: Gamepad2, text: '노릇하게 익었을 때 눌러서 뒤집어요' },
                { icon: Target, text: '많이 구울수록 점수가 올라가요' },
                REWARD_STEP,
            ],
            image: guideBanner,
        },
    },
};

/** 콘텐츠가 등록되지 않은 게임은 게임 설명과 공통 안내로 채운다 */
export function getGameContent(game: { id: string; description?: string }): GameContent {
    return (
        CONTENTS[game.id] ?? {
            tagline: game.description ?? '',
            heroImage: null,
            guide: {
                title: '게임 방법',
                subtitle: game.description ?? '',
                steps: [
                    { icon: Gamepad2, text: '화면 안내에 따라 플레이해요' },
                    { icon: Target, text: '높은 점수에 도전해 보세요' },
                    REWARD_STEP,
                ],
                image: guideBanner,
            },
        }
    );
}
