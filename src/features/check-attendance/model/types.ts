import { z } from 'zod';

export const attendanceStatusSchema = z.object({
    checkedToday: z.boolean(),
    streak: z.number().int().nonnegative(),
    /** 출석 기준일(UTC 날짜, YYYY-MM-DD) 목록 */
    checkedDates: z.array(z.string()),
});

export const checkAttendanceResultSchema = z.object({
    checkedToday: z.boolean(),
    streak: z.number().int().nonnegative(),
    ticketsGranted: z.number().int().nonnegative(),
});

/**
 * 출석 정책 — 관리자가 연속 출석 보상 단계(일수·보상 응모권 수)를 여러 개 설정한다.
 * 단계 일수는 1~28일 범위에서 중복 없이 오름차순 (getddo-spec 출석 규칙).
 * 조회 API(GET /attendance/policy)와 응답 형태는 백엔드와 확정 전 임시 계약이다
 */
export const attendancePolicySchema = z.object({
    dailyRewardTickets: z.number().int().nonnegative(),
    streakBonuses: z.array(
        z.object({
            days: z.number().int().min(1).max(28),
            rewardTickets: z.number().int().positive(),
        }),
    ),
});

export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;
export type AttendancePolicy = z.infer<typeof attendancePolicySchema>;
export type CheckAttendanceResult = z.infer<typeof checkAttendanceResultSchema>;
