/** 배너는 최대 5개까지 등록한다 (getddo-spec 기능 요구사항 13절 — 확정) */
export const BANNER_MAX_COUNT = 5;

/** imageKey 길이 — spec 초안 BannerWrite(1~500) */
export const BANNER_IMAGE_KEY_MAX_LENGTH = 500;

/**
 * [담당자 확정 대기] 배너 이미지 허용 형식·파일당 용량 제한.
 * spec은 JPG·PNG·WebP·5MB 제안 수치를 채택하지 않았다(pending-decisions.md '배너').
 * 아래 값은 화면 안내 문구용 임시값일 뿐이며 어느 곳에서도 업로드를 막는 검증에 쓰지 않는다.
 * 확정되면 이 한 곳만 고친다.
 */
export const BANNER_IMAGE_TEMP_POLICY = {
    formats: ['JPG', 'PNG', 'WebP'],
    maxMegabytes: 5,
} as const;
