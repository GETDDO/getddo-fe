import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';

import { queryClient } from '@shared/api/query-client';
import { useUiSettingsStore } from '@shared/lib/ui-settings';
import { Toaster } from '@shared/ui/sonner';

import { router } from '../routes';
import { VirtualClockProvider } from '../virtual-clock';
import { store } from './store';

// 큰글씨 모드 — 스토어 값을 html data-text-scale 속성에 동기화 (globals.css에서 스케일 적용)
function TextScaleSync() {
    const textScale = useUiSettingsStore((state) => state.textScale);

    useEffect(() => {
        document.documentElement.dataset.textScale = textScale;
    }, [textScale]);

    return null;
}

export function AppProviders() {
    return (
        <QueryClientProvider client={queryClient}>
            <ReduxProvider store={store}>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <VirtualClockProvider>
                        <TextScaleSync />
                        <RouterProvider router={router} />
                        <Toaster richColors position="top-center" />
                    </VirtualClockProvider>
                </ThemeProvider>
            </ReduxProvider>
        </QueryClientProvider>
    );
}
