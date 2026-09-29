import { Menu } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';

import { useSessionStore } from '@entities/user';
import { VirtualClockTicker } from '@features/control-virtual-clock';
import { VirtualUserSwitcher } from '@features/switch-virtual-user';
import { cn } from '@shared/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import { NotificationBell } from '@widgets/notification-bell';

import { USER_NAV_ITEMS } from './user-nav-items';

export function UserLayout() {
    const navRef = useRef<HTMLElement>(null);
    const { pathname } = useLocation();
    const user = useSessionStore((state) => state.user);
    const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    // 모바일 메뉴 — 페이지가 바뀌면 렌더 단계에서 닫는다 (클릭 핸들러보다 전환이 확실하다)
    const [prevPathname, setPrevPathname] = useState(pathname);
    if (prevPathname !== pathname) {
        setPrevPathname(pathname);
        setMenuOpen(false);
    }

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

    // 가상 사용자 미선택 상태에서는 로그인 화면으로 보낸다 (시연 로그인 흐름)
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="bg-surface-page flex min-h-screen flex-col">
            <header className="border-border-default bg-surface-page sticky top-0 z-10 border-b">
                <div className="mx-auto flex h-16 w-full max-w-300 items-center gap-4 px-6">
                    <NavLink to="/" className="text-title-3 text-fg-primary shrink-0">
                        U<span className="text-fg-brand">+</span> GETDDO
                    </NavLink>
                    <nav
                        ref={navRef}
                        className="relative hidden flex-1 items-stretch gap-6 self-stretch md:flex"
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
                    {/* nav가 숨겨지는 md 미만에서는 햄버거 메뉴로 이동 경로를 제공한다 */}
                    <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                        <PopoverTrigger
                            aria-label="메뉴"
                            className="text-fg-primary focus-visible:ring-border-focus flex size-8 items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:outline-none md:hidden"
                        >
                            <Menu className="size-6" />
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-48 p-1.5">
                            <nav aria-label="모바일 메뉴" className="flex flex-col">
                                {USER_NAV_ITEMS.map(({ to, label, end }) => (
                                    <NavLink
                                        key={label}
                                        to={to}
                                        end={end}
                                        className={({ isActive }) =>
                                            cn(
                                                'text-body-sm rounded-lg px-3 py-2.5 transition-colors',
                                                isActive
                                                    ? 'text-fg-primary font-semibold'
                                                    : 'text-fg-tertiary hover:bg-surface-sunken hover:text-fg-primary',
                                            )
                                        }
                                    >
                                        {label}
                                    </NavLink>
                                ))}
                            </nav>
                        </PopoverContent>
                    </Popover>
                    <div className="ml-auto flex items-center gap-4">
                        <VirtualClockTicker className="hidden lg:flex" />
                        <NotificationBell />
                        <VirtualUserSwitcher />
                    </div>
                </div>
            </header>
            <div className="flex-1">
                <Outlet />
            </div>
            <footer className="bg-surface-inverse text-fg-inverse">
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
