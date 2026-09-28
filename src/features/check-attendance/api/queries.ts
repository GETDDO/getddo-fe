import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@shared/api/client';
import { createIdempotencyKey } from '@shared/lib/idempotency-key';

import {
    attendancePolicySchema,
    attendanceStatusSchema,
    checkAttendanceResultSchema,
} from '../model/types';

const ATTENDANCE_STATUS_KEY = ['attendance', 'me'] as const;

export function useAttendanceStatus() {
    return useQuery({
        queryKey: ATTENDANCE_STATUS_KEY,
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>('/attendance/me');
            return attendanceStatusSchema.parse(data);
        },
    });
}

/** 출석 정책(연속 출석 보상 단계 등) — 관리자 설정이 바뀔 수 있어 서버에서 받는다 */
export function useAttendancePolicy() {
    return useQuery({
        queryKey: ['attendance', 'policy'],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>('/attendance/policy');
            return attendancePolicySchema.parse(data);
        },
    });
}

/**
 * 오늘 출석 — 연타·재시도로 중복 지급되지 않도록 멱등키를 붙인다 (ADR-0005).
 * minDurationMs를 주면 응답이 빨라도 그 시간이 지난 뒤에 완료·갱신된다 — 굽는 연출이 끝나기 전에 화면 곳곳이 먼저 바뀌지 않게 한다
 */
export function useCheckAttendance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ minDurationMs = 0 }: { minDurationMs?: number } = {}) => {
            const [{ data }] = await Promise.all([
                apiClient.post<unknown>('/attendance/check', undefined, {
                    headers: { 'X-Idempotency-Key': createIdempotencyKey() },
                }),
                new Promise((resolve) => setTimeout(resolve, minDurationMs)),
            ]);
            return checkAttendanceResultSchema.parse(data);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ATTENDANCE_STATUS_KEY });
            // 출석 보상이 응모권으로 지급되므로 잔액·이력도 다시 받아온다
            void queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
    });
}
