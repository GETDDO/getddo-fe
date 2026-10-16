import { z } from 'zod';

// spec 공통 계약의 성공 응답 봉투 — data만 꺼내는 최소 검증 (code/message는 소비하지 않는다)
export const envelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({ success: z.literal(true), data: dataSchema });

// spec 공통 계약의 Page<T> — items/page/size/totalElements (페이지는 1부터)
export const pageSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
    z.object({
        items: z.array(itemSchema),
        page: z.number().int(),
        size: z.number().int(),
        totalElements: z.number().int(),
    });

// spec 공통 계약의 Cursor<T> — items/nextCursor/totalElements
export const cursorSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
    z.object({
        items: z.array(itemSchema),
        nextCursor: z.string().nullish(),
        totalElements: z.number().int(),
    });
