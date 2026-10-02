/**
 * 목업이 보는 현재 시각.
 *
 * 관리자 가상 시계로 시간을 옮기면 이벤트 상태도 함께 움직여야 시연에서
 * 마감 → 발표 대기 → 발표 완료를 보여줄 수 있다. 화면만 시간을 따라가고
 * 서버 응답이 멈춰 있으면 흐름이 끊긴다.
 *
 * 저장 키는 app/providers/VirtualClockProvider가 쓰는 값과 같다.
 * shared는 app을 참조할 수 없어 상수를 공유하지 못하므로 값을 맞춰 둔다.
 */
const VIRTUAL_CLOCK_STORAGE_KEY = 'getddo-virtual-clock-override';

export function mockNow(): Date {
    try {
        const raw = sessionStorage.getItem(VIRTUAL_CLOCK_STORAGE_KEY);
        if (raw) {
            const at = new Date(raw);
            if (!Number.isNaN(at.getTime())) return at;
        }
    } catch {
        // 저장소를 쓸 수 없는 환경(테스트 등)에서는 실제 시각을 쓴다
    }
    return new Date();
}
