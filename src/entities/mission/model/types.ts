import { z } from 'zod';

export const missionTypeSchema = z.enum(['survey', 'quiz']);
export const missionStatusSchema = z.enum(['available', 'completed']);

export const missionSchema = z.object({
    id: z.string(),
    title: z.string(),
    type: missionTypeSchema,
    rewardTickets: z.number().int().nonnegative(),
    status: missionStatusSchema,
});

export type MissionType = z.infer<typeof missionTypeSchema>;
export type MissionStatus = z.infer<typeof missionStatusSchema>;
export type Mission = z.infer<typeof missionSchema>;
