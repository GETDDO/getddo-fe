import mascotBasic from '../assets/mascot-basic.png';
import mascotBonus from '../assets/mascot-bonus.png';
import mascotDizzy from '../assets/mascot-dizzy.png';

/** 이미지는 캐릭터 경계에 맞춰 잘라 둔 정사각형이라, 같은 크기 상자에 넣으면 모두 가운데에 같은 크기로 보인다 */
export interface Mascot {
    src: string;
}

/** 기본 타코야끼 — 출석하면 판에 채워진다 (출석 전에는 회색으로 보여준다) */
export const BASIC_MASCOT: Mascot = { src: mascotBasic };

/** 연속 출석 보상일의 세 마리 타코야끼 (피그마 image 84) — 출석 전 회색, 출석하면 원본 */
export const BONUS_MASCOT: Mascot = { src: mascotBonus };

/** 출석판 타코야끼를 너무 많이 누르면 잠깐 보여주는 어지러운 타코야끼 (피그마 image 83) */
export const DIZZY_MASCOT: Mascot = { src: mascotDizzy };

export function getAttendanceMascot(isBonusDay: boolean): Mascot {
    return isBonusDay ? BONUS_MASCOT : BASIC_MASCOT;
}
