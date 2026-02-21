import { Tabs } from 'expo-router';
import Colors from '../../src/constants/Colors';
import { Home, PlusSquare, User } from 'lucide-react-native';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: Colors.primary,
            tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 8 }
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
