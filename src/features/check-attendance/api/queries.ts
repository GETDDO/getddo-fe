import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@shared/api/client';

import { attendanceStatusSchema } from '../model/types';

export function useAttendanceStatus() {
    return useQuery({
        queryKey: ['attendance', 'me'],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>('/attendance/me');
            return attendanceStatusSchema.parse(data);
        },
    });
}
