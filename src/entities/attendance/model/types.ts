import { z } from 'zod';

// getddo-spec 05-api/attendance.md AT01~AT03 초안 DTO와 같은 필드명을 쓴다

/** 연속 출석 단계 — 단계 일수는 1~28, 보상 수량은 1장 이상 (02-domain/attendance.md) */
export const attendanceMilestoneSchema = z.object({
    milestoneDays: z.number().int().min(1).max(28),
    rewardTicketCount: z.number().int().positive(),
    claimed: z.boolean(),
    claimedAt: z.iso.datetime().nullable(),
});

/** AT01 `GET /attendances/today` 응답 */
export const attendanceTodaySchema = z.object({
    attendanceDate: z.string(),
    attended: z.boolean(),
    consecutiveDays: z.number().int().nonnegative(),
    dailyRewardTicketCount: z.number().int().nonnegative(),
    milestones: z.array(attendanceMilestoneSchema),
    nextResetAt: z.iso.datetime(),
    serverTime: z.iso.datetime(),
});

/** AT02 영수증의 보상 1건 — rewardType이 보상 구분 필드다 */
export const rewardReceiptSchema = z.object({
    claimId: z.string(),
    rewardType: z.enum(['DAILY', 'STREAK']),
    milestoneDays: z.number().int().min(1).max(28).nullable(),
    ticketCount: z.number().int().nonnegative(),
    grantedAt: z.iso.datetime().nullable(),
    expiresAt: z.iso.datetime().nullable(),
});

/** AT02 `POST /attendances` 응답 — 같은 날 재요청은 이미 확정한 rewards를 그대로 돌려준다 */
export const attendanceReceiptSchema = z.object({
    attendanceId: z.string(),
    attendanceDate: z.string(),
    consecutiveDays: z.number().int().nonnegative(),
    rewards: z.array(rewardReceiptSchema),
    createdAt: z.iso.datetime(),
});

/** AT03 `GET /attendances?month=YYYY-MM` 응답 */
export const attendanceMonthSchema = z.object({
    month: z.string(),
    attendanceDates: z.array(z.string()),
    milestones: z.array(attendanceMilestoneSchema),
    serverTime: z.iso.datetime(),
});

export type AttendanceMilestone = z.infer<typeof attendanceMilestoneSchema>;
export type AttendanceToday = z.infer<typeof attendanceTodaySchema>;
export type RewardReceipt = z.infer<typeof rewardReceiptSchema>;
export type AttendanceReceipt = z.infer<typeof attendanceReceiptSchema>;
export type AttendanceMonth = z.infer<typeof attendanceMonthSchema>;
