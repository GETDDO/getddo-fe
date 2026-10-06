/**
 * 쿼리 캐싱 프리셋 — 도메인 데이터의 성격별 정책을 한곳에서 정의한다.
 * 쿼리마다 staleTime·refetchInterval을 제각각 적으면 같은 데이터가 화면마다 다르게 동작한다.
 * 사용: useQuery({ ...queryPresets.realtime, queryKey, queryFn })
 */
export const queryPresets = {
    /** 실시간 현황(참여자 수·응모권 사용 수 등) — 30초 폴링으로 서버 값을 계속 따라간다 */
    realtime: {
        staleTime: 0,
        refetchInterval: 30_000,
    },
    /**
     * 세션 동안 자주 바뀌지 않는 읽기 데이터 — 전역 기본값(staleTime 30초)을 명시적으로 쓸 때.
     * 옵션을 그대로 두는 것과 동일하며, "이 데이터는 이 정책"이라는 의도 표시용이다
     */
    standard: {
        staleTime: 30_000,
    },
    /** 캐싱하면 안 되는 데이터(관리자 검토 목록 등) — 화면에 들어올 때마다 서버에서 새로 받는다 */
    noCache: {
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: 'always',
    },
} as const;
