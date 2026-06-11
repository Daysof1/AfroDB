// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVO: app/_layout.tsx
// PROPÓSITO: Layout raíz de la aplicación.
//   - Envuelve toda la app con los proveedores de contexto globales (Auth, Carrito).
//   - Configura el tema visual (claro / oscuro) con ThemeProvider.
//   - Define la navegación principal mediante un Stack Navigator de Expo Router.
//   - Cada <Stack.Screen> registra una ruta y le asigna el título de la cabecera.
// ─────────────────────────────────────────────────────────────────────────────

// ── IMPORTACIONES ────────────────────────────────────────────────────────────
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'; // Temas claro/oscuro.
import { Stack } from 'expo-router';          // Navegación por pila (Stack Navigator).
import { StatusBar } from 'expo-status-bar';  // Barra de estado del sistema operativo.
import 'react-native-reanimated';             // Requerido por Reanimated para funcionar antes de cualquier animación.

import { useColorScheme } from '../hooks/use-color-scheme'; // Hook que detecta si el dispositivo está en modo oscuro.
import { AuthProvider } from '../src/context/AuthContext';   // Proveedor de sesión de usuario (login/logout).
import { CarritoProvider } from '../src/context/CarritoContext'; // Proveedor del estado global del carrito.
import { AgendarProvider } from '../src/context/AgendarContext'; // Proveedor del estado global de citas.

// ── CONFIGURACIÓN DE EXPO ROUTER ──────────────────────────────────────────────
// unstable_settings.anchor define la pantalla inicial al abrir la app.
// '(tabs)' = la carpeta de tabs es la raíz de navegación por defecto.
export const unstable_settings = {
  anchor: '(tabs)',
};

// ── COMPONENTE RAÍZ ───────────────────────────────────────────────────────────
export default function RootLayout() {
  // Detecta si el dispositivo usa modo oscuro ('dark') o claro ('light').
  const colorScheme = useColorScheme();

  return (
    // AuthProvider: pone a disposición de toda la app el estado de sesión (usuario, token).
    <AuthProvider>
      {/* CarritoProvider: pone a disposición el carrito de compras en toda la app. */}
      <CarritoProvider>
        {/* AgendarProvider: pone a disposición el estado global de citas agendadas. */}
        <AgendarProvider>
          {/* ThemeProvider: aplica el tema visual según la preferencia del sistema. */}
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>

          {/* Stack: navegador de pila. Cada pantalla se apila sobre la anterior. */}
          <Stack>
            {/* (tabs): las 3 pestañas principales (Tienda, Carrito, Cuenta). Sin cabecera propia. */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* ── Pantallas del panel de administración ── */}
            <Stack.Screen name="admin/dashboard" options={{ title: 'Dashboard Admin' }} />
            <Stack.Screen name="admin/categorias" options={{ title: 'Categorías' }} />
            <Stack.Screen name="admin/productos" options={{ title: 'Productos' }} />
            <Stack.Screen name="admin/servicios" options={{ title: 'Servicios' }} />
            <Stack.Screen name="admin/producto-form" options={{ title: 'Crear/Editar Producto' }} />
            <Stack.Screen name="admin/subcategorias" options={{ title: 'Subcategorías' }} />
            <Stack.Screen name="admin/usuarios" options={{ title: 'Usuarios' }} />
            <Stack.Screen name="admin/pedidos" options={{ title: 'Pedidos' }} />
            <Stack.Screen name="admin/citas" options={{ title: 'Citas' }} />
            {/* Ruta dinámica: [id] se reemplaza por el ID real del pedido en tiempo de ejecución. */}
            <Stack.Screen name="admin/pedidos/[id]" options={{ title: 'Detalle Pedido' }} />

            {/* ── Panel profesional ── */}
            <Stack.Screen name="profesional/dashboard" options={{ title: 'Panel Profesional' }} />

            {/* ── Pantallas del flujo de compra del cliente ── */}
            <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
            <Stack.Screen name="mis-pedidos" options={{ title: 'Mis pedidos' }} />
            <Stack.Screen name="mis-citas" options={{ title: 'Mis citas' }} />
            {/* Ruta dinámica para el detalle de un pedido del cliente. */}
            <Stack.Screen name="pedidos/[id]" options={{ title: 'Detalle pedido' }} />

            {/* Modal global: se presenta sobre la pantalla actual con animación de hoja. */}
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>

          {/* StatusBar: ajusta automáticamente el color de los íconos (claro/oscuro) según el tema. */}
          <StatusBar style="auto" />
        </ThemeProvider>
        </AgendarProvider>
      </CarritoProvider>
    </AuthProvider>
  );
}
