import { ChevronDown, LayoutDashboard, Menu } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router-dom';

import { useSessionStore } from '@entities/user';
import { VirtualClockTicker } from '@features/controlVirtualClock';
import { VirtualUserSwitcher } from '@features/switchVirtualUser';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import { NotificationBell } from '@widgets/notificationBell';

import profileAvatar from './assets/profile-avatar.png';
import { FOOTER_AWARDS, FOOTER_LINKS } from './footerData';
import { USER_NAV_ITEMS } from './userNavItems';

export function UserLayout() {
    const navRef = useRef<HTMLElement>(null);
    const { pathname } = useLocation();
    // UserGuard가 미선택 상태를 먼저 걸러 주므로 여기서는 항상 있다
    const user = useSessionStore((state) => state.user)!;
    const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    // 맨 위에서는 피그마처럼 헤더 아래 선 없이, 스크롤하면 연한 그림자로 본문과 구분한다
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const update = () => setScrolled(window.scrollY > 0);
        update();
        window.addEventListener('scroll', update, { passive: true });
        return () => window.removeEventListener('scroll', update);
    }, []);
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

    return (
        <div className="bg-surface-page flex min-h-screen flex-col">
            {/* 라우트가 바뀌면 새 화면은 맨 위에서 시작하고, 뒤로 가기는 이전 위치를 복원한다 */}
            <ScrollRestoration />
            <header
                className={cn(
                    'bg-surface-page sticky top-0 z-30 transition-shadow duration-200',
                    scrolled && 'shadow-md',
                )}
            >
                {/* 피그마 홈 — 높이 76(위아래 20), 로고 24 Bold, 메뉴 16 */}
                <div className="mx-auto flex h-19 w-full max-w-312 items-center gap-7.5 px-6">
                    <NavLink to="/" className="text-title-2 text-fg-primary shrink-0">
                        U<span className="text-fg-brand">+</span> GETDDO
                    </NavLink>
                    <nav
                        ref={navRef}
                        className="relative hidden flex-1 items-stretch gap-7 self-stretch md:flex"
                    >
                        {USER_NAV_ITEMS.map(({ to, label, end }) => (
                            <NavLink
                                key={label}
                                to={to}
                                end={end}
                                className={({ isActive }) =>
                                    cn(
                                        'text-body relative flex items-center transition-colors',
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
                            className="bg-fg-primary pointer-events-none absolute bottom-4 h-0.5 rounded-full transition-all duration-300"
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
                            className="text-fg-primary focus-visible:ring-border-focus focus-visible:ring-offset-surface-page flex size-8 items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none md:hidden"
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
                                {user.role === 'ADMIN' && (
                                    <>
                                        <div
                                            aria-hidden
                                            className="border-border-default my-1 border-t"
                                        />
                                        <NavLink
                                            to="/admin"
                                            className="text-body-sm text-fg-tertiary hover:bg-surface-sunken hover:text-fg-primary rounded-lg px-3 py-2.5 transition-colors"
                                        >
                                            관리자 화면으로
                                        </NavLink>
                                    </>
                                )}
                            </nav>
                        </PopoverContent>
                    </Popover>
                    <div className="ml-auto flex items-center gap-5">
                        {/* 관리자 화면 진입은 관리자 계정에게만 보이는 버튼으로만 한다 — 로그인 시 자동 이동 없음 */}
                        {user.role === 'ADMIN' && (
                            <Button
                                variant="secondary"
                                size="sm"
                                asChild
                                className="hidden md:inline-flex"
                            >
                                <NavLink to="/admin">
                                    <LayoutDashboard aria-hidden />
                                    관리자 화면으로
                                </NavLink>
                            </Button>
                        )}
                        {/* 가상 시계 조작은 관리자만 — 일반 사용자는 시각 표시만 본다 */}
                        <VirtualClockTicker
                            className="hidden lg:flex"
                            readOnly={user.role !== 'ADMIN'}
                        />
                        <NotificationBell />
                        {/* 피그마 홈 — 아바타·이름·멤버십 알약(그림자) + 아래 화살표 */}
                        <VirtualUserSwitcher
                            trigger={
                                <button
                                    type="button"
                                    className="bg-surface-page focus-visible:ring-border-focus focus-visible:ring-offset-surface-page flex h-9 cursor-pointer items-center gap-2.5 rounded-full py-1 pr-2 pl-2 shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                >
                                    <span className="flex items-center gap-2">
                                        <img
                                            src={profileAvatar}
                                            alt=""
                                            className="size-7 rounded-full"
                                        />
                                        <span className="flex flex-col items-start">
                                            <span className="text-fg-primary text-xs leading-3.5 font-bold">
                                                {user.name}
                                            </span>
                                            {user.personaLabel && (
                                                <span className="text-fg-tertiary text-xs leading-3.5">
                                                    {user.personaLabel}
                                                </span>
                                            )}
                                        </span>
                                    </span>
                                    <ChevronDown aria-hidden className="text-fg-tertiary size-6" />
                                </button>
                            }
                        />
                    </div>
                </div>
            </header>
            <div className="flex-1">
                <Outlet />
            </div>
            {/* 피그마 홈 푸터 — 약관 줄, 회사 주소, 고객센터·가입문의, 저작권 (글자 12) */}
            <footer className="bg-surface-inverse text-caption">
                <div className="mx-auto flex w-full max-w-312 flex-col gap-10 px-6 pt-12.5 pb-18">
                    <div className="flex flex-col gap-7.5">
                        <p className="text-border-default flex flex-wrap gap-x-1">
                            {FOOTER_LINKS.map(({ label, strong }, index) => (
                                <span key={label} className={strong ? 'font-bold' : undefined}>
                                    {index > 0 && <span className="mr-1 font-medium">|</span>}
                                    {label}
                                </span>
                            ))}
                        </p>
                        <div className="flex flex-col gap-2">
                            <p className="text-fg-tertiary">
                                (주)얻어가유 서울특별시 멀티캠퍼스 선릉위워크
                            </p>
                            <p className="text-fg-tertiary">
                                <span className="text-border-default font-bold">고객센터</span>{' '}
                                1588-0000
                            </p>
                            <p className="text-fg-tertiary">
                                <span className="text-border-default font-bold">가입문의</span>{' '}
                                1588-0000
                            </p>
                            <p className="text-fg-tertiary">
                                Copyright ⓒ U+GETDDO Corp. All Rights Reserved.
                            </p>
                        </div>
                    </div>
                    <ul className="flex flex-wrap items-center gap-x-4 gap-y-3">
                        {FOOTER_AWARDS.map(({ icon, title, detail }) => (
                            <li key={title} className="flex items-center gap-2">
                                <img src={icon} alt="" className="h-10 w-12.5 opacity-80" />
                                <p className="text-fg-tertiary flex flex-col">
                                    <span>{title}</span>
                                    <span>{detail}</span>
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
            </footer>
        </div>
    );
}
