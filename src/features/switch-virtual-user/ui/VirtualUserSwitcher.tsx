import { Check, CircleUserRound, ShieldCheck } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { useSessionStore, useVirtualUsers } from '@entities/user';
import { cn } from '@shared/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';

interface VirtualUserSwitcherProps {
    /** 트리거를 바꾸고 싶을 때 넘긴다 (기본: 프로필 아이콘 버튼) */
    trigger?: ReactNode;
}

// 헤더 프로필 아이콘 등에서 가상 사용자를 즉시 전환하는 팝오버 — 최초 진입만 /login, 이후 전환은 이 컴포넌트로 처리한다
export function VirtualUserSwitcher({ trigger }: VirtualUserSwitcherProps) {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const current = useSessionStore((state) => state.user);
    const selectUser = useSessionStore((state) => state.selectUser);
    const { data: users, isPending, isError } = useVirtualUsers();

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                asChild={!!trigger}
                aria-label="가상 사용자 전환"
                className={
                    trigger
                        ? undefined
                        : 'text-fg-primary relative flex size-6 items-center justify-center'
                }
            >
                {trigger ?? <CircleUserRound className="size-6" />}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
                <div className="flex items-center justify-between">
                    <p className="text-body-sm-bold text-fg-primary">가상 사용자 전환</p>
                    {current && (
                        <p className="text-fg-tertiary text-caption">현재: {current.name}</p>
                    )}
                </div>
                <div className="border-border-default border-t" />
                <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
                    {isPending && (
                        <p className="text-fg-tertiary text-body-sm py-4 text-center">
                            불러오는 중…
                        </p>
                    )}
                    {isError && (
                        <p className="text-destructive text-body-sm py-4 text-center">
                            사용자 목록을 불러오지 못했습니다.
                        </p>
                    )}
                    {users?.map((user) => {
                        const isCurrent = user.id === current?.id;
                        return (
                            <button
                                key={user.id}
                                type="button"
                                disabled={isCurrent}
                                onClick={() => {
                                    selectUser(user);
                                    setOpen(false);
                                    // 관리자 계정으로 전환하면 관리자 대시보드로 바로 이동한다
                                    if (user.role === 'admin') {
                                        void navigate('/admin');
                                    }
                                }}
                                className={cn(
                                    'hover:bg-surface-sunken flex items-center gap-3 rounded-lg p-2.5 text-left transition-colors',
                                    isCurrent && 'cursor-default',
                                )}
                            >
                                {user.role === 'admin' ? (
                                    <ShieldCheck className="text-fg-brand size-5 shrink-0" />
                                ) : (
                                    <CircleUserRound className="text-fg-primary size-5 shrink-0" />
                                )}
                                <div className="flex flex-1 flex-col">
                                    <span className="text-body-sm-bold text-fg-primary flex items-center gap-1.5">
                                        {user.name}
                                        {user.role === 'admin' && (
                                            <span className="bg-brand-primary text-surface-page rounded px-1.5 py-0.5 text-xs font-medium">
                                                관리자
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-fg-tertiary text-caption">
                                        {user.personaLabel ?? '시스템 관리 계정'}
                                    </span>
                                </div>
                                {isCurrent && <Check className="text-fg-brand size-4 shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}
