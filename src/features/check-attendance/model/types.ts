import { z } from 'zod';

export const attendanceStatusSchema = z.object({
    attended: z.boolean(),
    consecutiveDays: z.number().int().nonnegative(),
    /** 출석 기준일(KST 날짜, YYYY-MM-DD) 목록 — AT03 조회 형태는 확정 전 임시 계약 */
    checkedDates: z.array(z.string()),
});

export const checkAttendanceResultSchema = z.object({
    attended: z.boolean(),
    consecutiveDays: z.number().int().nonnegative(),
    /** 이번 출석에서 확정한 보상 응모권 수 — 같은 날 재요청은 이미 확정한 값을 그대로 돌려준다 */
    ticketsGranted: z.number().int().nonnegative(),
});

/**
 * 출석 정책 — 관리자가 연속 출석 보상 단계(일수·보상 응모권 수)를 여러 개 설정한다.
 * 단계 일수는 1~28일 범위에서 중복 없이 오름차순 (getddo-spec 출석 규칙).
 * 조회 API(GET /attendances/policy)와 응답 형태는 백엔드와 확정 전 임시 계약이다
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
