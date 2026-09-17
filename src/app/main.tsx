import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { env } from '@shared/config/env';

import { App } from './App';
import './styles/globals.css';

// MSW는 서비스워커 등록이 끝난 뒤 렌더링해야 첫 API 호출도 가로챌 수 있음
async function enableMocking() {
    if (!env.enableMsw) return;
    const { worker } = await import('@shared/api/mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
}

void enableMocking()
    .then(() => {
        createRoot(document.getElementById('root')!).render(
            <StrictMode>
                <App />
            </StrictMode>,
        );
    })
    .catch((error: unknown) => {
        console.error('앱 초기화 실패:', error);
    });
