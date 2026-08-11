// app/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import { HapticTab } from '../../components/haptic-tab';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

// ─────────────────────────────────────────────────────────────
// COMPONENTE DE ICONO MEMOIZADO
// ─────────────────────────────────────────────────────────────

type TabBarIconProps = {
    color: string;
    size: number;
    name: React.ComponentProps<typeof IconSymbol>['name'];
};

const TabBarIcon = React.memo(({ color, size, name }: TabBarIconProps) => {
    return <IconSymbol size={size} name={name} color={color} />;
});

TabBarIcon.displayName = 'TabBarIcon';

// ─────────────────────────────────────────────────────────────
// ICONOS PRECONFIGURADOS (definidos UNA sola vez)
// ─────────────────────────────────────────────────────────────

const HomeIcon = React.memo(({ color }: { color: string }) => (
    <TabBarIcon size={28} name="house.fill" color={color} />
));
HomeIcon.displayName = 'HomeIcon';

const CartIcon = React.memo(({ color }: { color: string }) => (
    <TabBarIcon size={28} name="cart.fill" color={color} />
));
CartIcon.displayName = 'CartIcon';

const CalendarIcon = React.memo(({ color }: { color: string }) => (
    <TabBarIcon size={26} name="calendar" color={color} />
));
CalendarIcon.displayName = 'CalendarIcon';

const ProfileIcon = React.memo(({ color }: { color: string }) => (
    <TabBarIcon size={28} name="person.fill" color={color} />
));
ProfileIcon.displayName = 'ProfileIcon';

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                headerShown: false,
                tabBarButton: HapticTab,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'AfroDB',
                    tabBarIcon: HomeIcon,
                }}
            />

            <Tabs.Screen
                name="carrito"
                options={{
                    title: 'Carrito',
                    tabBarIcon: CartIcon,
                }}
            />

            <Tabs.Screen
                name="agendar"
                options={{
                    title: 'Agendar',
                    tabBarIcon: CalendarIcon,
                }}
            />

            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Cuenta',
                    tabBarIcon: ProfileIcon,
                }}
            />
        </Tabs>
    );
}