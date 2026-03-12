import { create } from 'zustand';

interface GlobalState {
    theme: 'light' | 'dark';
    language: 'en' | 'hi';
    toggleTheme: () => void;
    setTheme: (theme: 'light' | 'dark') => void;
    setLanguage: (lang: 'en' | 'hi') => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
    theme: 'light',
    language: 'en',
    toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    setTheme: (theme) => set({ theme }),
    setLanguage: (lang) => set({ language: lang }),
}));
