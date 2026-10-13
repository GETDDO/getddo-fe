import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
    ADMIN_NOTIFICATIONS_KEY,
    adminNotificationSchema,
    notificationDeliveryRetriesApiPath,
    notificationJobRetryApiPath,
    notificationJobSchema,
} from '@entities/adminNotification';
import { apiClient } from '@shared/api/client';
import { envelopeSchema } from '@shared/api/envelopeSchema';

// AN03 — 생성 최종 실패 작업의 복구 접수. 본문 없음.
// 202는 워커 처리 접수이며 최종 성공이 아니다 — 처리 차수는 0으로 초기화되지 않고 유지된다
export function useRetryNotificationJob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (jobId: string) => {
            const { data } = await apiClient.post<unknown>(notificationJobRetryApiPath(jobId));
            return envelopeSchema(notificationJobSchema).parse(data).data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ADMIN_NOTIFICATIONS_KEY });
        },
    });
}

// AN05 — 개별 알림 모의 발송 최종 실패의 복구 접수. 본문 없음.
// 이미 생성된 동일 알림의 발송 처리만 재시도한다 — 새 알림 생성·읽음 상태 변경 없음
export function useRetryNotificationDelivery() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            const { data } = await apiClient.post<unknown>(
                notificationDeliveryRetriesApiPath(notificationId),
            );
            return envelopeSchema(adminNotificationSchema).parse(data).data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ADMIN_NOTIFICATIONS_KEY });
        },
    });
}
