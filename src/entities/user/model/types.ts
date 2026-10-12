import { z } from 'zod';

export const userRoleSchema = z.enum(['USER', 'ADMIN']);

// 멤버십 등급 — excellent < vip < vvip. 이벤트의 membershipRule과 비교해 응모 자격을 판정한다
export const membershipSchema = z.enum(['excellent', 'vip', 'vvip']);

// 가상 사용자는 고정된 사용자 ID로 식별한다 (docs/product-context.md '운영 및 시연 범위')
export const virtualUserSchema = z.object({
    id: z.string(),
    name: z.string(),
    role: userRoleSchema,
    membership: membershipSchema,
    personaLabel: z.string().nullable(),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type Membership = z.infer<typeof membershipSchema>;
export type VirtualUser = z.infer<typeof virtualUserSchema>;
