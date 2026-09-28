import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TextScale = 'normal' | 'large';

interface UiSettingsState {
    textScale: TextScale;
    setTextScale: (textScale: TextScale) => void;
}

export const useUiSettingsStore = create<UiSettingsState>()(
    persist(
        (set) => ({
            textScale: 'normal',
            setTextScale: (textScale) => set({ textScale }),
        }),
        { name: 'getddo-ui-settings' },
    ),
);
