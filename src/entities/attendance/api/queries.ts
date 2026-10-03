import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@shared/api/client';

import { attendancePolicySchema, attendanceStatusSchema } from '../model/types';

export const ATTENDANCE_STATUS_KEY = ['attendance', 'me'] as const;
export const ATTENDANCE_POLICY_KEY = ['attendance', 'policy'] as const;

export function useAttendanceStatus() {
    return useQuery({
        queryKey: ATTENDANCE_STATUS_KEY,
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>('/attendances/today');
            return attendanceStatusSchema.parse(data);
        },
    });
}

/** 출석 정책(연속 출석 보상 단계 등) — 관리자 설정이 바뀔 수 있어 서버에서 받는다 */
export function useAttendancePolicy() {
    return useQuery({
        queryKey: ATTENDANCE_POLICY_KEY,
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>('/attendances/policy');
            return attendancePolicySchema.parse(data);
        },
    });
}
