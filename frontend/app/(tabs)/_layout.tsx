import { Tabs } from 'expo-router';
import { Home, PlusSquare, User } from 'lucide-react-native';
import { useAppTheme } from '../../src/theme/provider';

export default function TabLayout() {
    const { theme } = useAppTheme();

    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.colors.accent,
            tabBarInactiveTintColor: theme.colors.textSecondary,
            tabBarStyle: {
                height: 72,
                paddingBottom: 10,
                paddingTop: 10,
                backgroundColor: theme.colors.tabBar,
                borderTopColor: theme.colors.border,
            }
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Home color={color} size={24} />
                }}
            />
            <Tabs.Screen
                name="create"
                options={{
                    title: 'Create',
                    tabBarIcon: ({ color }) => <PlusSquare color={color} size={24} />
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <User color={color} size={24} />
                }}
            />
        </Tabs>
    );
}
