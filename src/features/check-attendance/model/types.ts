import { z } from 'zod';

export const attendanceStatusSchema = z.object({
    checkedToday: z.boolean(),
    streak: z.number().int().nonnegative(),
    checkedDates: z.array(z.string()),
});

export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;
