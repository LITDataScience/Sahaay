export type ThemeMode = 'light' | 'dark';

const palette = {
    light: {
        background: '#FAF7F2',
        backgroundMuted: '#F3EEE6',
        surface: '#FFFFFF',
        surfaceElevated: '#FFFDFC',
        surfaceAlt: '#F8F2E8',
        textPrimary: '#181411',
        textSecondary: '#6F655C',
        textMuted: '#9A8E82',
        accent: '#C9A227',
        accentStrong: '#A17F17',
        accentSoft: '#EADCA8',
        border: '#E8DEC9',
        borderStrong: '#D6C6A8',
        success: '#2E7D32',
        danger: '#B3261E',
        bhasm: '#8C8277',
        shadow: '#1A120A',
        tabBar: '#FFF9F0',
        overlay: 'rgba(24, 20, 17, 0.08)',
    },
    dark: {
        background: '#0F0D0B',
        backgroundMuted: '#171411',
        surface: '#171411',
        surfaceElevated: '#211C17',
        surfaceAlt: '#2A231C',
        textPrimary: '#F8F3EB',
        textSecondary: '#B8AEA3',
        textMuted: '#8F8479',
        accent: '#D4AF37',
        accentStrong: '#F1CF64',
        accentSoft: '#6D5521',
        border: '#3A3027',
        borderStrong: '#564638',
        success: '#6FCF97',
        danger: '#FF8A80',
        bhasm: '#A89C8D',
        shadow: '#000000',
        tabBar: '#120F0C',
        overlay: 'rgba(248, 243, 235, 0.08)',
    },
} as const;

const spacing = {
    xxs: 2,
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
} as const;

const radius = {
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
    pill: 999,
} as const;

const typography = {
    hero: {
        fontSize: 34,
        fontWeight: '800' as const,
        letterSpacing: -0.8,
    },
    title: {
        fontSize: 28,
        fontWeight: '800' as const,
        letterSpacing: -0.4,
    },
    section: {
        fontSize: 20,
        fontWeight: '700' as const,
        letterSpacing: -0.2,
    },
    body: {
        fontSize: 15,
        fontWeight: '400' as const,
        lineHeight: 22,
    },
    label: {
        fontSize: 12,
        fontWeight: '600' as const,
        letterSpacing: 0.4,
        textTransform: 'uppercase' as const,
    },
} as const;

export const getShadows = (mode: ThemeMode) => ({
    soft: {
        shadowColor: mode === 'light' ? palette.light.shadow : palette.dark.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: mode === 'light' ? 0.08 : 0.24,
        shadowRadius: 20,
        elevation: 8,
    },
    medium: {
        shadowColor: mode === 'light' ? palette.light.shadow : palette.dark.shadow,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: mode === 'light' ? 0.12 : 0.3,
        shadowRadius: 28,
        elevation: 12,
    },
}) as const;

export const createTheme = (mode: ThemeMode) => ({
    mode,
    colors: palette[mode],
    spacing,
    radius,
    typography,
    shadows: getShadows(mode),
}) as const;

export type AppTheme = ReturnType<typeof createTheme>;
export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');
