import { Platform } from 'react-native';

export const theme = {
    colors: {
        primary: '#DC2626',
        background: '#1F2937',
        card: '#FFFFFF',
        text: Platform.select({
            ios: '#000000',
            android: '#121212',
        }),
        border: Platform.select({
            ios: '#E5E7EB',
            android: '#D1D5DB',
        }),
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
    },
    shadow: Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        },
        android: {
            elevation: 4,
        },
    }),
}; 