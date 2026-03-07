import Colors from './Colors';
import { lightTheme } from '../theme/tokens';

const Theme = {
    shadows: {
        small: lightTheme.shadows.soft,
        medium: lightTheme.shadows.medium,
        large: lightTheme.shadows.medium,
    },
    spacing: {
        xs: lightTheme.spacing.xs,
        sm: lightTheme.spacing.sm,
        md: lightTheme.spacing.md,
        lg: lightTheme.spacing.lg,
        xl: lightTheme.spacing.xl,
    },
    borderRadius: {
        sm: lightTheme.radius.sm,
        md: lightTheme.radius.md,
        lg: lightTheme.radius.lg,
        full: lightTheme.radius.pill,
    },
    typography: {
        h1: { fontSize: lightTheme.typography.title.fontSize, fontWeight: lightTheme.typography.title.fontWeight },
        h2: { fontSize: lightTheme.typography.section.fontSize, fontWeight: lightTheme.typography.section.fontWeight },
        body: { fontSize: lightTheme.typography.body.fontSize, fontWeight: lightTheme.typography.body.fontWeight },
        caption: { fontSize: 12, color: Colors.text.secondary },
    },
} as const;

export default Theme;
