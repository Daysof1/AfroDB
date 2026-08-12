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
import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

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
// Cast necesario porque Expo Router tipifica estrictamente los paths.
const routerReplace = (path: string) => (router as unknown as { replace: (p: string) => void }).replace(path);
const routerPush    = (path: string) => (router as unknown as { push:    (p: string) => void }).push(path);

// ── HELPERS DE FORMATO ─────────────────────────────────────────────────────────
// Formatea un valor numérico a pesos colombianos.
const formatCOP = (value: unknown): string => {
  return `$${Number(value || 0).toLocaleString('es-CO')}`;
};

// Formatea una fecha ISO a formato legible en español colombiano.
const formatDate = (value: unknown): string => {
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
};

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function MisPedidosScreen() {

  // ── CONTEXTO Y ESTADO ─────────────────────────────────────────────────────
  const { isAuthenticated, user } = useAuth() as { isAuthenticated: boolean; user?: { rol?: string } | null };
  const [pedidos, setPedidos]           = useState<Pedido[]>([]);
  const [loading, setLoading]           = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // ── FUNCIÓN: loadPedidos ───────────────────────────────────────────────────
  const loadPedidos = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const data = await pedidoService.getMisPedidos();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      setErrorMessage((error as { message?: string })?.message || 'No fue posible cargar tus pedidos.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // ── EFECTOS ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && (user?.rol === 'administrador' || user?.rol === 'auxiliar')) {
      routerReplace('/admin/pedidos');
      return;
    }

    loadPedidos();
  }, [loadPedidos, isAuthenticated, user?.rol]);

  useFocusEffect(
    useCallback(() => {
      loadPedidos();
    }, [loadPedidos])
  );

  // ── GUARDIA: usuario no autenticado ───────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <View style={styles.centered}>
        <ThemedText type="title">Debes iniciar sesión</ThemedText>
        <ThemedText style={styles.subtitle}>Inicia sesión para ver tu historial de pedidos.</ThemedText>
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

      {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}

      {pedidos.length === 0 ? (
        <ThemedView style={styles.emptyState}>
          <ThemedText type="defaultSemiBold">Aún no tienes pedidos</ThemedText>
          <ThemedText style={styles.subtitle}>Cuando compres, aparecerán aquí.</ThemedText>
          <Pressable style={styles.primaryButton} onPress={() => routerReplace('/(tabs)/')}>
            <ThemedText style={styles.primaryButtonText}>Ir a Tienda</ThemedText>
          </Pressable>
        </ThemedView>
      ) : (
        pedidos.map((pedido) => (
          <Pressable
            key={pedido.id}
            style={styles.card}
            onPress={() => routerPush(`/pedidos/${pedido.id}`)}
          >
            <View style={styles.rowBetween}>
              <ThemedText type="defaultSemiBold">Pedido #{pedido.id}</ThemedText>
              <ThemedText style={styles.badge}>{pedido.estado || 'pendiente'}</ThemedText>
            </View>
            <ThemedText style={styles.meta}>{formatDate(pedido.createdAt)}</ThemedText>
            <View style={styles.rowBetween}>
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
  emptyState: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
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