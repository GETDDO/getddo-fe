// import.meta.env 접근은 이 파일로만 허용한다 (eslint no-restricted-syntax로 강제)
export const env = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string,
    enableMsw: import.meta.env.VITE_ENABLE_MSW === 'true',
    isDev: import.meta.env.DEV,
    // 시연용 가상 사용자 목록(JSON 배열) — 실서버 DB에 등록된 UUID로 주입할 때 쓴다
    virtualUsersJson: import.meta.env.VITE_VIRTUAL_USERS_JSON as string | undefined,
} as const;
