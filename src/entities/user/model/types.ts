import { z } from 'zod';

export const userRoleSchema = z.enum(['USER', 'ADMIN']);

// 가상 사용자는 고정된 사용자 ID로 식별한다 (docs/product-context.md '운영 및 시연 범위')
export const virtualUserSchema = z.object({
    id: z.string(),
    name: z.string(),
    role: userRoleSchema,
    personaLabel: z.string().nullable(),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type VirtualUser = z.infer<typeof virtualUserSchema>;
