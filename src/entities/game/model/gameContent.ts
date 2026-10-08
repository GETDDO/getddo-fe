import type { LucideIcon } from 'lucide-react';

import { Gamepad2, Target, Ticket } from 'lucide-react';

import colorWordGuide from '../assets/color-word-guide.jpg';
import guideBanner from '../assets/guide-banner.jpg';
import takkoRunGuide from '../assets/takko-run-guide.jpg';
import takoyakiHero from '../assets/takoyaki-hero.jpg';

export interface GameGuideStep {
    icon: LucideIcon;
    text: string;
    /** 글 앞에 키 모양으로 보여 줄 조작 키 */
    keys?: string[];
}

/** 게임 상세 화면·게임 방법 모달에 쓰는 게임별 소개 콘텐츠 (미니게임 구현 쪽에서 관리) */
export interface GameContent {
    /** 대표 이미지 위 한 줄 소개 */
    tagline: string;
    heroImage: string | null;
    /** 대표 이미지가 대표 영역(840:546)보다 넓어 좌우가 잘릴 때 보여줄 기준점 — 기본은 가운데 */
    heroImagePosition?: string;
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
    text: '하루 한 번, 플레이하면 응모권 1장을 받아요.',
};

// 게임 종류·규칙은 게임 담당자 확정 전 임시 콘텐츠. 타꼬런 대표 이미지(image 107)와 타코야끼 대표 이미지(image 75)는 피그마 기준
const CONTENTS: Record<string, GameContent> = {
    'game-dino': {
        tagline: '소스병과 꼬치를 뛰어넘으며 멀리 달리세요.',
        heroImage: '/images/games/takoyaki-run.jpg',
        // 16:9 이미지라 좌우 약 7%씩 잘린다. 제목(타꼬런)이 오른쪽 끝에 붙어 있어 기준을 오른쪽으로 옮긴다
        heroImagePosition: '85% 50%',
        guide: {
            title: '게임 방법',
            subtitle: '점프만 하면 끝!',
            steps: [
                {
                    icon: Gamepad2,
                    keys: ['Space', '↑'],
                    text: '또는 화면을 눌러 점프해요.\n길게 누르면 높이 뛰어요.',
                },
                { icon: Target, text: '오래 버틸수록 점수가 쭉쭉 올라가요.' },
                REWARD_STEP,
            ],
            // 게임 방법 모달 이미지 — 피그마 image 178 (실제 게임 장면)
            image: takkoRunGuide,
        },
    },
    'game-color': {
        tagline: '글자 뜻에 속지 말고 글자 색깔을 고르세요.',
        // 대표 이미지 — 피그마 image 163 (16:9라 대표 영역 840:546에서 좌우가 조금 잘린다)
        heroImage: '/images/games/color-word.jpg',
        guide: {
            title: '게임 방법',
            subtitle: '글자 뜻이 아니라 글자 색이 정답!',
            steps: [
                {
                    icon: Gamepad2,
                    keys: ['1', '2', '3', '4'],
                    text: '또는 글자에 칠해진 색 버튼을 눌러요.',
                },
                { icon: Target, text: '목숨은 3개, 맞힐수록 제한 시간이 짧아져요.' },
                REWARD_STEP,
            ],
            // 게임 방법 모달 이미지 — 피그마 image 179 (실제 게임 장면)
            image: colorWordGuide,
        },
    },
    'game-takoyaki': {
        tagline: '60초 안에 타코야끼를 구워내세요.',
        heroImage: takoyakiHero,
        guide: {
            title: '게임 방법',
            subtitle: '타이밍 맞춰 누르기만 하면 돼요',
            steps: [
                { icon: Gamepad2, text: '노릇하게 익었을 때 눌러서 뒤집어요.' },
                { icon: Target, text: '많이 구울수록 점수가 올라가요.' },
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
                    { icon: Gamepad2, text: '화면 안내에 따라 플레이해요.' },
                    { icon: Target, text: '높은 점수에 도전해 보세요.' },
                    REWARD_STEP,
                ],
                image: guideBanner,
            },
        }
    );
}
