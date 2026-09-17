import { QueryClient } from '@tanstack/react-query';

// TanStack Query 기본 옵션은 이 파일 한 곳에서 관리한다
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 0,
        },
    },
});
