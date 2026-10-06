import { NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router-dom';

import { VirtualClockTicker } from '@features/controlVirtualClock';
import { cn } from '@shared/lib/utils';

import { ADMIN_NAV_ITEMS } from './adminNavItems';

export function AdminLayout() {
    const { pathname } = useLocation();
    const current = ADMIN_NAV_ITEMS.find((item) =>
        item.end
            ? pathname === item.to
            : pathname === item.to || pathname.startsWith(`${item.to}/`),
    );

    return (
        <div className="bg-surface-canvas flex min-h-screen">
            <ScrollRestoration />
            <aside className="border-border bg-surface-inverse hidden w-60 shrink-0 flex-col border-r md:flex">
                <div className="border-border flex h-16 items-center gap-2 border-b px-5">
                    <img src="/favicon.svg" alt="" className="size-[46px]" />
                    <span className="text-title-3 text-fg-inverse">
                        U <span className="text-fg-brand">+</span> GETDDO
                    </span>
                </div>
                <nav className="flex flex-1 flex-col gap-1 p-3">
                    {ADMIN_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                cn(
                                    'text-subhead flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors',
                                    isActive
                                        ? 'bg-surface-inverse-muted text-fg-inverse'
                                        : 'text-fg-secondary hover:bg-surface-sunken',
                                )
                            }
                        >
                            <Icon className="size-4" />
                            {label}
                        </NavLink>
                    ))}
                </nav>
                <div className="border-border border-t p-3">
                    <NavLink
                        to="/"
                        className="text-body-sm text-fg-tertiary hover:bg-surface-sunken flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors"
                    >
                        사용자 화면으로
                    </NavLink>
                </div>
            </aside>
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="border-border bg-surface-elevated flex h-16 items-center border-b px-8">
                    <h1 className="text-title-3">{current?.label ?? '관리자'}</h1>
                    <VirtualClockTicker className="ml-auto hidden md:flex" />
                </header>
                {/* 사이드바가 숨겨지는 md 미만에서는 가로 스크롤 탭으로 같은 이동 경로를 제공한다 */}
                <nav
                    aria-label="관리자 메뉴"
                    className="border-border bg-surface-elevated flex items-center gap-1 overflow-x-auto border-b px-3 py-2 md:hidden"
                >
                    {ADMIN_NAV_ITEMS.map(({ to, label, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                cn(
                                    'text-body-sm rounded-lg px-3 py-1.5 whitespace-nowrap transition-colors',
                                    isActive
                                        ? 'bg-surface-inverse text-fg-inverse font-medium'
                                        : 'text-fg-secondary hover:bg-surface-sunken',
                                )
                            }
                        >
                            {label}
                        </NavLink>
                    ))}
                    <NavLink
                        to="/"
                        className="text-body-sm text-fg-tertiary hover:bg-surface-sunken ml-auto rounded-lg px-3 py-1.5 whitespace-nowrap transition-colors"
                    >
                        사용자 화면으로
                    </NavLink>
                </nav>
                <main className="flex-1 p-4 md:pt-5 md:pr-0 md:pl-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
