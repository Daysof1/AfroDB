// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVO: app/pedido-confirmado.tsx
// PROPÓSITO: Pantalla de éxito tras confirmar una compra.
//   - Recibe el parámetro ?pedidoId=... en la URL (query param, no ruta dinámica).
//   - Si hay pedidoId, consulta el detalle del pedido para mostrarlo.
//   - Si no lo hay (fallback), muestra solo el banner de confirmación.
//   - Ofrece botones para ver todos los pedidos o seguir comprando.
// ─────────────────────────────────────────────────────────────────────────────

// ── IMPORTACIONES ────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import pedidoService from '../src/services/pedidoService';

// ── TIPO: Pedido ──────────────────────────────────────────────────────────────
// Solo los campos necesarios para la pantalla de confirmación.
type Pedido = {
  id?: string;
  _id?: string;
  estado?: string;
  total?: number;
  direccionEnvio?: string;
  telefono?: string;
};

// ── HELPER DE NAVEGACIÓN ──────────────────────────────────────────────────────
// Cast necesario porque Expo Router tiifica estrictamente los paths.
const routerReplace = (path: string) => (router as unknown as { replace: (p: string) => void }).replace(path);

// ── HELPER DE FORMATO ─────────────────────────────────────────────────────────
// Formatea un número a pesos colombianos.
function formatCOP(value: unknown) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`;
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function PedidoConfirmadoScreen() {

  // ── PARÁMETRO DE RUTA ─────────────────────────────────────────────────────
  // pedidoId llega como query param: /pedido-confirmado?pedidoId=123
  const { pedidoId } = useLocalSearchParams();

  // ── ESTADO LOCAL ──────────────────────────────────────────────────────────
  const [pedido, setPedido]             = useState<Pedido | null>(null);
  // loading=true solo si hay pedidoId que consultar.
  const [loading, setLoading]           = useState(Boolean(pedidoId));
  const [errorMessage, setErrorMessage] = useState('');

  // ── EFECTO: carga el detalle del pedido ───────────────────────────────────
  useEffect(() => {
    const loadPedido = async () => {
      // Sin pedidoId no hay nada que consultar (modo fallback).
      if (!pedidoId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage('');
      try {
        // GET /pedidos/:pedidoId — obtiene los datos del pedido recién creado.
        const data = await pedidoService.getPedidoById(pedidoId);
        setPedido(data);
      } catch (error: unknown) {
        setErrorMessage((error as { message?: string })?.message || 'No se pudo cargar el pedido.');
      } finally {
        setLoading(false);
      }
    };

    loadPedido();
  }, [pedidoId]); // Se re-ejecuta si pedidoId cambia (aunque en la práctica no cambia).

  // ── ESTADO DE CARGA ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText>Cargando información del pedido...</ThemedText>
      </View>
    );
  }

  // ── RENDERIZADO PRINCIPAL ─────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── Banner de éxito ─────────────────────────────────────────────── */}
      {/* Fondo azul con mensaje de confirmación. */}
      <ThemedView style={styles.banner}>
        <ThemedText type="title">Pedido confirmado</ThemedText>
        <ThemedText style={styles.bannerText}>
          Tu pedido se ha generado correctamente. Revisa los detalles y sigue comprando cuando quieras.
        </ThemedText>
      </ThemedView>

      {/* Mensaje de error si no se pudo cargar el detalle */}
      {errorMessage ? (
        <ThemedText style={styles.error}>{errorMessage}</ThemedText>
      ) : null}

      {/* ── Tarjeta de detalles del pedido ──────────────────────────────── */}
      {/* Solo se muestra si la API devolvió datos del pedido. */}
      {pedido ? (
        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold">Pedido #{pedido.id}</ThemedText>
          {/* Estado del pedido (normalmente 'pendiente' justo después de crearlo). */}
          <ThemedText>{pedido.estado ? `Estado: ${pedido.estado}` : 'Estado: pendiente'}</ThemedText>
          <ThemedText>{pedido.direccionEnvio || '-'}</ThemedText>
          <ThemedText>{pedido.telefono || '-'}</ThemedText>
          <ThemedText style={styles.total}>Total: {formatCOP(pedido.total)}</ThemedText>
        </ThemedView>
      ) : null}

      {/* ── Botones de acción ────────────────────────────────────────────── */}
      {/* "Ver mis pedidos": navega al historial con replace (no apila). */}
      <Pressable style={styles.primaryButton} onPress={() => router.replace('/mis-pedidos')}>
        <ThemedText style={styles.primaryButtonText}>Ver mis pedidos</ThemedText>
      </Pressable>

      {/* "Seguir comprando": regresa a la tienda principal. */}
      <Pressable style={styles.secondaryButton} onPress={() => routerReplace('/(tabs)/')}>
        <ThemedText>Seguir comprando</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  // Centra el spinner de carga.
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16 },
  // Banner azul con esquinas redondeadas.
  banner: { borderRadius: 16, padding: 18, backgroundColor: '#a57c63', gap: 10 },
  // Texto del banner sobre fondo azul: color muy claro para contraste.
  bannerText: { color: '#eafcff' },
  // Tarjeta de resumen del pedido: borde gris, fondo blanco.
  card: {
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    gap: 8,
  },
  // Total con separación superior y negrita para destacarlo.
  total: { marginTop: 10, fontWeight: '700' },
  error: { color: '#ac3b33' },
  // Botón primario azul (acción principal: ver pedidos).
  primaryButton: {
    borderRadius: 10,
    backgroundColor: '#8d6c58',
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  // Botón secundario: borde gris, fondo blanco (acción secundaria: seguir comprando).
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#caafaf',
    paddingVertical: 14,
    alignItems: 'center',
  },
});
