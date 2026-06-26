// Página: modal.tsx. vista de modal del sistema.
// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVO: app/modal.tsx
// PROPÓSITO: Pantalla modal de ejemplo/genérica.
//   - Se presenta sobre la pantalla actual (no reemplaza la pila de navegación).
//   - Registrada en _layout.tsx con presentation: 'modal' para la animación de hoja.
//   - Contiene un enlace con 'dismissTo' que cierra el modal y regresa a la raíz.
// ─────────────────────────────────────────────────────────────────────────────

// ── IMPORTACIONES ────────────────────────────────────────────────────────────
import { Link } from 'expo-router';  // Componente de enlace de Expo Router.
import { StyleSheet } from 'react-native';

import { ThemedText } from '../components/themed-text'; // Texto que respeta el tema claro/oscuro.
import { ThemedView } from '../components/themed-view'; // Vista que respeta el tema claro/oscuro.

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
// Renderiza la vista principal de este componente.
export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      {/* Título del modal */}
      <ThemedText type="title">This is a modal</ThemedText>

      {/*
        Link con dismissTo="/":
        - href="/" navega a la pantalla raíz (Tienda).
        - dismissTo cierra el modal antes de navegar, en lugar de apilarlo.
      */}
      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">Go to home screen</ThemedText>
      </Link>
    </ThemedView>
  );
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Centra el contenido tanto vertical como horizontalmente.
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  // Separación vertical del enlace respecto al título.
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
