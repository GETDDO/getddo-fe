import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
    ATTENDANCE_STATUS_KEY,
    ATTENDANCES_API_PATH,
    checkAttendanceResultSchema,
} from '@entities/attendance';
import { TICKETS_KEY } from '@entities/ticket';
import { apiClient } from '@shared/api/client';
import { envelopeSchema } from '@shared/api/envelopeSchema';

/**
 * 오늘 출석 — 출석은 사용자·KST 기준일로 재처리하므로 멱등키를 쓰지 않는다 (ADR-0005, spec 공통 계약).
 * 같은 날 재요청은 서버가 200으로 기존 결과를 돌려준다.
 * minDurationMs를 주면 응답이 빨라도 그 시간이 지난 뒤에 완료·갱신된다 — 굽는 연출이 끝나기 전에 화면 곳곳이 먼저 바뀌지 않게 한다
 */
export function useCheckAttendance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ minDurationMs = 0 }: { minDurationMs?: number } = {}) => {
            const [{ data }] = await Promise.all([
                apiClient.post<unknown>(ATTENDANCES_API_PATH),
                new Promise((resolve) => setTimeout(resolve, minDurationMs)),
            ]);
            return envelopeSchema(checkAttendanceResultSchema).parse(data).data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ATTENDANCE_STATUS_KEY });
            // 출석 보상이 응모권으로 지급되므로 잔액·이력도 다시 받아온다
            void queryClient.invalidateQueries({ queryKey: TICKETS_KEY });
        },
    });
}
