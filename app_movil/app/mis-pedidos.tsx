// Página: mis-pedidos.tsx. vista de mis-pedidos del sistema.
// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVO: app/mis-pedidos.tsx
// PROPÓSITO: Lista todos los pedidos del cliente autenticado.
//   - Se recarga automáticamente cada vez que el usuario vuelve a esta pantalla
//     gracias a useFocusEffect (útil después de cancelar un pedido).
//   - Muestra un estado vacío si el cliente aún no tiene pedidos.
//   - Cada tarjeta de pedido navega al detalle en /pedidos/[id].
// ─────────────────────────────────────────────────────────────────────────────

// ── IMPORTACIONES ────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native'; // Hook que dispara un callback al enfocar la pantalla.
import { useCallback } from 'react';

import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { useAuth } from '../src/context/AuthContext';
import pedidoService from '../src/services/pedidoService';

// ── TIPO: Pedido ──────────────────────────────────────────────────────────────
// Solo los campos que se muestran en la lista (no incluye detalles completos).
type Pedido = {
  id?: string;
  _id?: string;        // MongoDB puede devolver _id en vez de id.
  estado?: string;
  total?: number;
  createdAt?: string;
  detalles?: unknown[]; // Arreglo de productos (solo se usa .length aquí).
};

// ── HELPERS DE NAVEGACIÓN ─────────────────────────────────────────────────────
// Cast necesario porque Expo Router tiifica estrictamente los paths.
const routerReplace = (path: string) => (router as unknown as { replace: (p: string) => void }).replace(path);
const routerPush    = (path: string) => (router as unknown as { push:    (p: string) => void }).push(path);

// ── HELPERS DE FORMATO ─────────────────────────────────────────────────────────
// Formatea un valor numérico a pesos colombianos.
// Define la l?gica espec?fica de esta funci?n.
function formatCOP(value: unknown) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`;
}

// Formatea una fecha ISO a formato legible en español colombiano.
// Define la l?gica espec?fica de esta funci?n.
function formatDate(value: unknown) {
  if (!value) {
    return '-';
  }
  return new Date(value as string).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
// Renderiza la vista principal de este componente.
export default function MisPedidosScreen() {

  // ── CONTEXTO Y ESTADO ─────────────────────────────────────────────────────
  const { isAuthenticated, user } = useAuth() as { isAuthenticated: boolean; user?: { rol?: string } | null };
  const [pedidos, setPedidos]           = useState<Pedido[]>([]);
  const [loading, setLoading]           = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // ── FUNCIÓN: loadPedidos ───────────────────────────────────────────────────
  // Consulta GET /pedidos/mis-pedidos y almacena los resultados en el estado.
  // Está envuelta en useCallback para poder pasarla a useFocusEffect y useEffect
  // sin crear una referencia nueva en cada render (evita bucles infinitos).
  const loadPedidos = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return; // No carga si no hay sesión (la guardia lo mostrará primero).
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const data = await pedidoService.getMisPedidos();
      // Garantiza que el estado siempre sea un arreglo, aunque la API devuelva null.
      setPedidos(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      setErrorMessage((error as { message?: string })?.message || 'No fue posible cargar tus pedidos.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // ── EFECTOS ───────────────────────────────────────────────────────────────
  // Carga inicial al montar el componente.
  useEffect(() => {
    // Si el usuario es administrador o auxiliar, usar la vista de admin (lista global de pedidos)
    if (isAuthenticated && (user?.rol === 'administrador' || user?.rol === 'auxiliar')) {
      routerReplace('/admin/pedidos');
      return;
    }

    loadPedidos();
  }, [loadPedidos]);

  // Recarga cada vez que el usuario navega de regreso a esta pantalla.
  // Útil por ejemplo después de cancelar un pedido desde /pedidos/[id].
  useFocusEffect(
    useCallback(() => {
      loadPedidos();
    }, [loadPedidos])
  );

  // ── GUARDIA: usuario no autenticado ───────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <View style={styles.centered}>
        <ThemedText type="title">Debes iniciar sesion</ThemedText>
        <ThemedText style={styles.subtitle}>Inicia sesion para ver tu historial de pedidos.</ThemedText>
        <Pressable style={styles.primaryButton} onPress={() => routerReplace('/(tabs)/explore')}>
          <ThemedText style={styles.primaryButtonText}>Ir a Cuenta</ThemedText>
        </Pressable>
      </View>
    );
  }

  // ── ESTADO DE CARGA ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText>Cargando pedidos...</ThemedText>
      </View>
    );
  }

  // ── RENDERIZADO PRINCIPAL ─────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedText type="title">Mis pedidos</ThemedText>

      {/* Mensaje de error si la petición falló */}
      {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}

      {pedidos.length === 0 ? (
        // ── Estado vacío ────────────────────────────────────────────────────
        <ThemedView style={styles.emptyState}>
          <ThemedText type="defaultSemiBold">Aun no tienes pedidos</ThemedText>
          <ThemedText style={styles.subtitle}>Cuando compres, apareceran aqui.</ThemedText>
          <Pressable style={styles.primaryButton} onPress={() => routerReplace('/(tabs)/')}>
            <ThemedText style={styles.primaryButtonText}>Ir a Tienda</ThemedText>
          </Pressable>
        </ThemedView>
      ) : (
        // ── Lista de tarjetas de pedido ──────────────────────────────────
        pedidos.map((pedido) => (
          <Pressable
            key={pedido.id}
            style={styles.card}
            // Navega al detalle del pedido pasando el ID en la URL dinámica.
            onPress={() => routerPush(`/pedidos/${pedido.id}`)}>
            <View style={styles.rowBetween}>
              <ThemedText type="defaultSemiBold">Pedido #{pedido.id}</ThemedText>
              {/* Badge del estado: capitalize lo pone con mayúscula inicial. */}
              <ThemedText style={styles.badge}>{pedido.estado || 'pendiente'}</ThemedText>
            </View>
            {/* Fecha de creación del pedido */}
            <ThemedText style={styles.meta}>{formatDate(pedido.createdAt)}</ThemedText>
            <View style={styles.rowBetween}>
              {/* Cantidad de productos (solo .length, no los detalles completos) */}
              <ThemedText style={styles.meta}>{pedido.detalles?.length || 0} producto(s)</ThemedText>
              <ThemedText type="defaultSemiBold">{formatCOP(pedido.total)}</ThemedText>
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f6f2' },
  content: { padding: 16, gap: 10 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16 },
  subtitle: { color: '#7b6758', textAlign: 'center' },
  error: { color: '#a56363' },
  emptyState: { borderRadius: 16, padding: 20, gap: 12, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  card: {
    borderWidth: 1,
    borderColor: '#e6d3b3',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fff',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  meta: { color: '#7b6758', fontSize: 12 },
  badge: {
    borderWidth: 1,
    borderColor: '#c8a27a',
    backgroundColor: '#f3e6d8',
    color: '#3e2f25',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
    textTransform: 'capitalize',
  },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c8a27a',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
});
