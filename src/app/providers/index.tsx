import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Provider as ReduxProvider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';

import { queryClient } from '@shared/api/query-client';
import { Toaster } from '@shared/ui/sonner';

import { router } from '../routes';
import { VirtualClockProvider } from '../virtual-clock';
import { store } from './store';

export function AppProviders() {
    return (
        <QueryClientProvider client={queryClient}>
            <ReduxProvider store={store}>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <VirtualClockProvider>
                        <RouterProvider router={router} />
                        <Toaster richColors position="top-center" />
                    </VirtualClockProvider>
                </ThemeProvider>
            </ReduxProvider>
        </QueryClientProvider>
    );
}
