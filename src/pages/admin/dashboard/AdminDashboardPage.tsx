import { AdminStatSummary } from '@widgets/adminStatSummary';

export function AdminDashboardPage() {
    return (
        <div className="flex max-w-280 flex-col gap-6 pb-10 md:pr-10">
            <p className="text-body-sm text-fg-tertiary">
                운영 중 확인이 잦은 지표를 모았습니다. 카드를 눌러 각 관리 화면으로 이동하세요.
            </p>
            <AdminStatSummary />
        </div>
    );
}
