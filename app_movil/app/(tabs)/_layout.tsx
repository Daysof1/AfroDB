// Página: _layout.tsx. vista de _layout del sistema.
/**
 * Define la barra de navegacion inferior (tab Bar) de app
 * expo Router usa este archivo como el contenedor de todas las
 * pantallas que viven de la carpeta (tabs)
 */

// tabs de expo roter que genera la barra de pestañas inferior
import { Tabs } from 'expo-router';
//React necesario para que JSX funcione correctamente
import React from 'react';
//hapticTab version personalizada del boton de la pestaña que agrefa vibracion tactl (haptic feedback) al precionar el tab
import { HapticTab } from '../../components/haptic-tab';
//IconSymbols componente que muestra iconos SF symbols IOS y material de android
import { IconSymbol } from '../../components/ui/icon-symbol';
// colors objeto de colores del tema de app modo claro y oscur
import { Colors } from '../../constants/theme';
// useColorShema hook que detecta si el dispositivo esta en modo claro u oscuro
import { useColorScheme } from '../../hooks/use-color-scheme';

//TabLayot componnete principl que configura toda la barra de navegacion
//expo Router lo exporta como default y lo monta automaticamente
// Renderiza la vista principal de este componente.
export default function TabLayout() {
    //ColorShema valor 'light' o dark segun la preferencia del sistema
    const colorSheme = useColorScheme();

    return (
        //Tabs renderiza la barra de estañas inferior y gestiona que la pantalla este activa en cada momento
        <Tabs
        screenOptions={{
            //tabbarActiveTintColor color de icono y texto de la pestaña activa 
            //si color Scheme es null (no detectado) usa light por defecto
            tabBarActiveTintColor: Colors[colorSheme ?? 'light'].tint,
            //headerShown false oculta el encabezado superior en todas las pantallas
            headerShown: false,
            //tabBarButton remplaza el boton estandar por hapticTab con vibracion
            tabBarButton: HapticTab,
        }}>

        {/** pestaña 1 tienda
         * name=index -> apunta al archivo /index.tsx (pantalla principal)
         */}
        <Tabs.Screen
            name="index"
            options={{
                //Texto que aparece debajo del icono de la barra 
                title: 'AfroDB',
                //tabBarIcon funcion que recibe el color activo o inactivo y devuelve el icono
                //house.fill = icono de casa rellena ( reprensenta el icono de la tienda)
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
            }}
            />

            {/** pestaña 2 carrito
             * name=carrito -> apunta al archivo /carrito.tsx
             */}
            <Tabs.Screen
                name="carrito"
                options={{
                    //Texto que aparece debajo del icono de la barra 
                    title: 'Carrito',
                    //tapBar que recibe el color activo o inactivo y devuelve el icono
                    //house.fill = icono de carrito rellena ( reprensenta el icono del carrito de compras)
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
                }}
                />

            {/** pestaña 3 cuenta
             * name=explore -> apunta al archivo /explore.tsx
             */}


            <Tabs.Screen
                name="agendar"
                options={{
                    //Texto que aparece debajo del icono de la barra 
                    title: 'Agendar',
                    //tapBar que recibe el color activo o inactivo y devuelve el icono
                    //house.fill = icono de carrito rellena ( reprensenta el icono del carrito de compras)
                    tabBarIcon: ({ color }) => <IconSymbol size={26} name="calendar" color={color} />,
                }}
                />

                <Tabs.Screen
                name="explore"
                options={{
                    //Texto que aparece debajo del icono de la barra 
                    title: 'Cuenta',
                    //tapBar que recibe el color activo o inactivo y devuelve el icono
                    //house.fill = icono de carrito rellena ( reprensenta el icono del carrito de compras)
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
                }}
                />
        </Tabs>
    )
}