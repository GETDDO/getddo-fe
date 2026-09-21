import { z } from 'zod';

export const gameSchema = z.object({
    id: z.string(),
    title: z.string(),
    dailyLimit: z.number().int().positive(),
    remainingPlays: z.number().int().nonnegative(),
});

export type Game = z.infer<typeof gameSchema>;
