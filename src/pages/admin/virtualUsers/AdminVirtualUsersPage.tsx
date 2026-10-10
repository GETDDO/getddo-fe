import { useSessionStore, useVirtualUsers, VirtualUserTable } from '@entities/user';

export function AdminVirtualUsersPage() {
    const { data: users, isPending, isError } = useVirtualUsers();
    const currentUserId = useSessionStore((state) => state.user?.id);

    return (
        <div className="flex max-w-280 flex-col gap-6 pr-10 pb-10">
            <div className="bg-surface-sunken border-border-default flex flex-col gap-1 rounded-2xl border p-4">
                <p className="text-body-bold text-fg-primary">조회 전용 화면입니다</p>
                {/* 가상 사용자의 수정 가능 범위는 spec이 정하지 않아 생성·수정·삭제를 만들지 않는다 */}
                <p className="text-body-sm text-fg-secondary">
                    가상 사용자의 수정 범위가 아직 확정되지 않아 생성·수정·삭제 기능은 제공하지
                    않습니다. 목록과 현재 세션 사용 여부만 확인할 수 있습니다.
                </p>
            </div>

            {isPending && <p className="text-body-sm text-fg-tertiary">불러오는 중…</p>}
            {isError && (
                <p role="alert" className="text-destructive text-body-sm">
                    가상 사용자 목록을 불러오지 못했습니다.
                </p>
            )}
            {users && users.length === 0 && (
                <p className="text-fg-tertiary text-body-sm py-6">등록된 가상 사용자가 없습니다.</p>
            )}
            {users && users.length > 0 && (
                <>
                    <VirtualUserTable users={users} currentUserId={currentUserId} />
                    <span className="text-body-sm text-fg-tertiary">총 {users.length}명</span>
                </>
            )}
        </div>
    );
}
