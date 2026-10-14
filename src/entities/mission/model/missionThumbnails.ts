import missionOx from '../assets/mission-ox.webp';
import missionQuiz from '../assets/mission-quiz.webp';
import missionSurvey from '../assets/mission-survey.webp';

/** 미션 기본 그림 — 서버가 그림을 주지 않을 때 쓴다 (피그마 image 229 설문 · 231 OX 퀴즈 · 230 퀴즈, 16:9 투명 바탕) */
export const MISSION_THUMBNAILS = {
    SURVEY: missionSurvey,
    OX: missionOx,
    QUIZ: missionQuiz,
} as const;
