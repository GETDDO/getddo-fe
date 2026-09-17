import { configureStore } from '@reduxjs/toolkit';

// 여러 화면에 걸친 복잡한 전역 플로우가 실제로 필요해질 때 슬라이스 리듀서를 여기에 추가한다.
// 그 전까지는 서버 상태는 TanStack Query, 화면 국한 상태는 Zustand를 우선 사용 (팀 합의 사항).
export const store = configureStore({
    reducer: {},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
