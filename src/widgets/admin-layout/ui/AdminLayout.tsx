import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { cn } from '@shared/lib/utils';

import { ADMIN_NAV_ITEMS } from '../model/nav-items';

export function AdminLayout() {
    const { pathname } = useLocation();
    const current = ADMIN_NAV_ITEMS.find((item) =>
        item.end
            ? pathname === item.to
            : pathname === item.to || pathname.startsWith(`${item.to}/`),
    );

    return (
        <div className="bg-surface-canvas flex min-h-screen">
            <aside className="border-border bg-fg-primary flex w-60 shrink-0 flex-col border-r">
                <div className="border-border flex h-16 items-center gap-2 border-b px-5">
                    <img src="/logo.png" alt="logo" className="h-46px w-46px" />
                    <span className="text-title-3 text-fg-on-brand">
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
                                        ? 'bg-fg-secondary text-fg-on-brand'
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
                </header>
                <main className="flex-1 pt-5 pl-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
