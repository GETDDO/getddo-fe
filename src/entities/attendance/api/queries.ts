import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@shared/api/client';
import { queryPresets } from '@shared/api/queryPresets';

import { attendancePolicySchema, attendanceStatusSchema } from '../model/types';

export const ATTENDANCE_STATUS_KEY = ['attendance', 'me'] as const;
export const ATTENDANCE_POLICY_KEY = ['attendance', 'policy'] as const;

// 출석 도메인의 엔드포인트 — 출석 처리(POST)를 하는 feature/checkAttendance도 이 상수를 재사용한다
export const ATTENDANCES_API_PATH = '/attendances';
export const ATTENDANCE_TODAY_API_PATH = `${ATTENDANCES_API_PATH}/today`;
export const ATTENDANCE_POLICY_API_PATH = `${ATTENDANCES_API_PATH}/policy`;

export function useAttendanceStatus() {
    return useQuery({
        // 화면을 열어 둔 채 기준일(00:00 KST)이 지나면 어제의 attended가 남아 버튼이 계속 비활성된다 — 주기적으로 다시 받는다
        ...queryPresets.realtime,
        queryKey: ATTENDANCE_STATUS_KEY,
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(ATTENDANCE_TODAY_API_PATH);
            return attendanceStatusSchema.parse(data);
        },
    });
}

/** 출석 정책(연속 출석 보상 단계 등) — 관리자 설정이 바뀔 수 있어 서버에서 받는다 */
export function useAttendancePolicy() {
    return useQuery({
        queryKey: ATTENDANCE_POLICY_KEY,
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(ATTENDANCE_POLICY_API_PATH);
            return attendancePolicySchema.parse(data);
        },
    });
}
