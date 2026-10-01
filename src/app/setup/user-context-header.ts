import { useSessionStore } from '@entities/user';
import { apiClient } from '@shared/api/client';

// 확정 API 공통 사용자 문맥(getddo-spec/05-api/common.md) — BE 공통 처리 위치는 담당자 후속 작업이다
apiClient.interceptors.request.use((config) => {
    const user = useSessionStore.getState().user;
    if (user) {
        config.headers['X-User-ID'] = user.id;
    }
    return config;
});
