import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useGlobalStore } from '../app/store';
import { AppTheme, createTheme, ThemeMode } from './tokens';

type ThemeContextValue = {
    theme: AppTheme;
    mode: ThemeMode;
    setTheme: (mode: ThemeMode) => void;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemMode = useColorScheme();
    const preferredMode = useGlobalStore((state) => state.theme);
    const setTheme = useGlobalStore((state) => state.setTheme);
    const toggleTheme = useGlobalStore((state) => state.toggleTheme);

    const mode: ThemeMode = preferredMode ?? (systemMode === 'dark' ? 'dark' : 'light');
    const theme = useMemo(() => createTheme(mode), [mode]);

    const value = useMemo(
        () => ({
            theme,
            mode,
            setTheme,
            toggleTheme,
        }),
        [mode, setTheme, theme, toggleTheme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error('useAppTheme must be used within ThemeProvider');
    }

    return context;
}
