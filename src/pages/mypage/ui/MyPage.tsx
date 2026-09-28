import { CircleUserRound, Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useSessionStore } from '@entities/user';
import { Button } from '@shared/ui/button';

export function MyPage() {
    const navigate = useNavigate();
    const user = useSessionStore((state) => state.user);
    const signOut = useSessionStore((state) => state.signOut);

    const handleSwitch = () => {
        signOut();
        void navigate('/login', { replace: true });
    };

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
                                {user.role === 'admin' && (
                                    <span className="bg-brand-primary text-surface-page rounded-md px-2 py-0.5 text-xs font-medium">
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
                <Button variant="outline" className="self-start" onClick={handleSwitch}>
                    <Repeat className="size-4" />
                    가상 사용자 전환
                </Button>
            </section>
        </main>
    );
}
