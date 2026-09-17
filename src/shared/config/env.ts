// import.meta.env 접근은 이 파일로만 허용한다 (eslint no-restricted-syntax로 강제)
export const env = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string,
    enableMsw: import.meta.env.VITE_ENABLE_MSW === 'true',
    isDev: import.meta.env.DEV,
} as const;
