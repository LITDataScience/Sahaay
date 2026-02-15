import { Platform } from 'react-native';
import Colors from './Colors';

export const Theme = {
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },
    borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        round: 9999,
    },
    shadows: {
        small: {
            shadowColor: Colors.shadow,
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2,
        },
        medium: {
            shadowColor: Colors.shadow,
            shadowOffset: {
                width: 0,
                height: 4,
            },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 4,
        },
        large: {
            shadowColor: Colors.shadow,
            shadowOffset: {
                width: 0,
                height: 8,
            },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 8,
        },
    },
    typography: {
        h1: {
            fontSize: 32,
            fontWeight: 'bold',
            color: Colors.text.primary,
        },
        h2: {
            fontSize: 24,
            fontWeight: 'bold',
            color: Colors.text.primary,
        },
        h3: {
            fontSize: 20,
            fontWeight: '600',
            color: Colors.text.primary,
        },
        body: {
            fontSize: 16,
            color: Colors.text.primary,
        },
        caption: {
            fontSize: 14,
            color: Colors.text.secondary,
        },
        button: {
            fontSize: 16,
            fontWeight: '600',
            color: Colors.text.white,
        },
    },
};

export default Theme;
