import { CircleUserRound, ClipboardList, Repeat, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useSessionStore } from '@entities/user';
import { AppearanceSettings } from '@features/appearance-settings';
import { VirtualUserSwitcher } from '@features/switch-virtual-user';
import { Button } from '@shared/ui/button';

export function MyPage() {
    const user = useSessionStore((state) => state.user);

    return (
        <main className="mx-auto flex w-full max-w-300 flex-col gap-10 px-6 pt-20 pb-28">
            <h1 className="text-title-1 text-fg-primary">마이페이지</h1>

            <section className="bg-surface-page border-border-default flex flex-col gap-4 rounded-2xl border p-5">
                <h2 className="text-subhead text-fg-primary">현재 가상 사용자</h2>
                {user && (
                    <div className="flex items-center gap-4">
                        <CircleUserRound className="text-fg-primary size-10 shrink-0" />
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="text-title-3 text-fg-primary">{user.name}</span>
                                {user.role === 'ADMIN' && (
                                    <span className="bg-brand-primary text-fg-on-brand rounded-md px-2 py-0.5 text-xs font-medium">
                                        관리자
                                    </span>
                                )}
                            </div>
                            <span className="text-body-sm text-fg-tertiary">
                                {user.personaLabel ?? '시스템 관리 계정'} · {user.id}
                            </span>
                        </div>
                    </div>
                )}
                <VirtualUserSwitcher
                    trigger={
                        <Button variant="outline" className="self-start">
                            <Repeat className="size-4" />
                            가상 사용자 전환
                        </Button>
                    }
                />
            </section>

            <section className="bg-surface-page border-border-default flex flex-col gap-4 rounded-2xl border p-5">
                <h2 className="text-subhead text-fg-primary">내 활동</h2>
                <div className="flex flex-wrap gap-3">
                    <Button asChild variant="outline">
                        <Link to="/my-tickets">
                            <Ticket className="size-4" />내 응모권
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link to="/my-entries">
                            <ClipboardList className="size-4" />내 응모 내역
                        </Link>
                    </Button>
                </div>
            </section>

            <AppearanceSettings />
        </main>
    );
}
