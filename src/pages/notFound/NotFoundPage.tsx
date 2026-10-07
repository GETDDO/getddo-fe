import { Link } from 'react-router-dom';

import { Button } from '@shared/ui/button';

export function NotFoundPage() {
    return (
        <main className="mx-auto flex w-full max-w-312 flex-col items-center gap-4 px-6 pt-32 pb-28 text-center">
            <p className="text-display text-fg-primary">404</p>
            <h1 className="text-title-2 text-fg-primary">페이지를 찾을 수 없습니다</h1>
            <p className="text-body-sm text-fg-tertiary">
                주소가 바뀌었거나 삭제된 페이지입니다. 주소를 확인해 주세요.
            </p>
            <Button asChild className="mt-2">
                <Link to="/">홈으로 이동</Link>
            </Button>
        </main>
    );
}
