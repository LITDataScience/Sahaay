import { create } from 'zustand';

interface GlobalState {
    theme: 'light' | 'dark';
    language: 'en' | 'hi';
    toggleTheme: () => void;
    setLanguage: (lang: 'en' | 'hi') => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
    theme: 'light',
    language: 'en',
    toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    setLanguage: (lang) => set({ language: lang }),
}));
