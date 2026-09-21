import { CircleUserRound } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { cn } from '@shared/lib/utils';
import { NotificationBell } from '@widgets/notification-bell';

import { USER_NAV_ITEMS } from './user-nav-items';

export function UserLayout() {
    const navRef = useRef<HTMLElement>(null);
    const { pathname } = useLocation();
    const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

    // NavLink가 활성 시 자동으로 붙이는 aria-current="page"로 대상을 찾아 위치를 측정한다
    useLayoutEffect(() => {
        const update = () => {
            const nav = navRef.current;
            const active = nav?.querySelector<HTMLElement>('a[aria-current="page"]');
            if (!nav || !active) {
                setIndicator(null);
                return;
            }
            const navRect = nav.getBoundingClientRect();
            const rect = active.getBoundingClientRect();
            setIndicator({ left: rect.left - navRect.left, width: rect.width });
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [pathname]);

    return (
        <div className="bg-surface-page flex min-h-screen flex-col">
            <header className="border-border-default bg-surface-page sticky top-0 z-10 border-b">
                <div className="mx-auto flex h-16 w-full max-w-300 items-center gap-8 px-6">
                    <NavLink to="/" className="text-title-3 text-fg-primary shrink-0">
                        U<span className="text-fg-brand">+</span> GETDDO
                    </NavLink>
                    <nav
                        ref={navRef}
                        className="relative flex flex-1 items-stretch gap-6 self-stretch"
                    >
                        {USER_NAV_ITEMS.map(({ to, label, end }) => (
                            <NavLink
                                key={label}
                                to={to}
                                end={end}
                                className={({ isActive }) =>
                                    cn(
                                        'text-body-sm relative flex items-center transition-colors',
                                        isActive
                                            ? 'text-fg-primary font-semibold'
                                            : 'text-fg-tertiary hover:text-fg-primary',
                                    )
                                }
                            >
                                {label}
                            </NavLink>
                        ))}
                        {/* 활성 항목 밑줄은 텍스트 바닥과 프레임 하단의 중간 높이에 두고, 페이지 이동 시 미끄러지게 한다 */}
                        <span
                            aria-hidden
                            className="bg-brand-primary pointer-events-none absolute bottom-2.5 h-0.5 rounded-full transition-all duration-300"
                            style={{
                                left: indicator?.left ?? 0,
                                width: indicator?.width ?? 0,
                                opacity: indicator ? 1 : 0,
                            }}
                        />
                    </nav>
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <NavLink to="/mypage" aria-label="마이페이지">
                            <CircleUserRound className="text-fg-primary size-6" />
                        </NavLink>
                    </div>
                </div>
            </header>
            <div className="flex-1">
                <Outlet />
            </div>
            <footer className="bg-fg-primary text-fg-on-brand">
                <div className="mx-auto flex w-full max-w-300 flex-col gap-2 px-6 py-10">
                    <p className="text-title-3">U+ GETDDO</p>
                    <p className="text-caption text-fg-tertiary">
                        © U+ GETDDO. All Rights Reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
