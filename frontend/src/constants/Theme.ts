import Colors from './Colors';

const Theme = {
    shadows: {
        small: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2,
        },
        medium: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 4,
        },
        large: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 8,
        }
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
    },
    borderRadius: {
        sm: 8,
        md: 12,
        lg: 20,
        full: 9999,
    },
    typography: {
        h1: { fontSize: 28, fontWeight: '800' },
        h2: { fontSize: 22, fontWeight: '700' },
        body: { fontSize: 16, fontWeight: '400' },
        caption: { fontSize: 12, color: Colors.text.secondary },
    }
} as const;

export default Theme;
