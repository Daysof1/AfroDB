/**
 * Pantalla del carrio de compras y sus respectivas gestiones no requiere que este autenticado solo para hacer compras
 */

/** importar componentes de React native para construir la pantalla
 * ActivityIndicator, spiner de carga circular
 * Alert, dialogos emergentes nativos del sistema
 * Image, muestra las imagenes
 * Pressable, area tactil
 * ScrollView, contenedor com scroll vertical
 * StyleSheet, crea los estilos de forma optimizada
 * Text, muestra texto plano en pantalla
 * View, Contenedor generico equivale a un div en html y css
 * 
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { router, useRouter } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';
//Ionicons liberia de iconos cevtoriales para react native 
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import { useAgendar } from "../../src/context/AgendarContext";
import catalogoService from '../../src/services/catalogoService';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';


// HELPERS de navegacion 
//expo router tipifica router de forma extricta y expone .push/replace 
//Directamente en typescript, se usa as unknown as .... para fprzar el tipo
//y poder llmar a las funciones de navegacion sin  errores de compilacion 

//routerPush navega a una nueva pantalla apilandola es decir se puede volver atras
const routerPush = (path: string) => (router as unknown as { push: (p: string) => void }).push(path);
//routerReplace navega a una pantallla remplazando la actual recuerda que se puede volver atras
const routerReplace = (path: string) => (router as unknown as { replace: (p: string) => void }).replace(path);

//fmt: formatea un numero como pecio en pesos colombianos ejemplo fmt (15000) -> $15.000
const fmt = (n: number) => `$${Number(n).toLocaleString('es-CO')}`;

// componente principal agendar Screen 
export default function AgendarScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth() as { isAuthenticated: boolean };
  const { crearCita } = useAgendar();

  const [servicios, setServicios] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await catalogoService.getServicios({ pagina: 1, limite: 200 });
        if (!mounted) return;
        setServicios(Array.isArray(data) ? data : []);
      } catch (err) {
        console.log('Error cargando servicios', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const toggleServicio = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para agendar una cita');
      router.replace('/explore');
      return;
    }
    if (!fecha || !hora) {
      Alert.alert('Falta información', 'Indica fecha y hora para la cita');
      return;
    }
    if (selectedIds.length === 0) {
      Alert.alert('Selecciona servicios', 'Selecciona al menos un servicio');
      return;
    }

    const payload: any = { fecha, hora, servicios: selectedIds };

    setSubmitting(true);
    try {
      await crearCita(payload);
      Alert.alert('Cita creada', 'Tu cita fue agendada correctamente');
      // limpiar formulario
      setSelectedIds([]);
      setFecha('');
      setHora('');
      router.replace('/');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      Alert.alert('Error', msg || 'No se pudo agendar la cita');
    } finally {
      setSubmitting(false);
    }
  };

  const renderServicio = ({ item }: { item: any }) => {
    const selected = selectedIds.includes(String(item.id));
    return (
      <Pressable onPress={() => toggleServicio(String(item.id))} style={[styles.serviceRow, selected && styles.serviceRowSelected]}>
        <ThemedText style={styles.serviceName}>{item.nombre}</ThemedText>
        <Text style={styles.servicePrice}>${Number(item.precio || 0).toLocaleString('es-CO')}</Text>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#a57c63" />
        <Text style={styles.loadingText}>Cargando servicios...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Agendar Cita</ThemedText>
      </View>

      <ThemedView style={styles.card}>
        <ThemedText style={styles.label}>Selecciona los servicios</ThemedText>
        <FlatList data={servicios} keyExtractor={(s: any) => String(s.id)} renderItem={renderServicio} style={{ maxHeight: 320 }} />

        <ThemedText style={styles.label}>Fecha (YYYY-MM-DD)</ThemedText>
        <TextInput value={fecha} onChangeText={setFecha} placeholder="2026-06-30" style={styles.input} placeholderTextColor="#9ca3af" />

        <ThemedText style={styles.label}>Hora (HH:MM)</ThemedText>
        <TextInput value={hora} onChangeText={setHora} placeholder="14:30" style={styles.input} placeholderTextColor="#9ca3af" />

        <Pressable style={styles.primaryBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.primaryBtnText}>Agendar</ThemedText>}
        </Pressable>
      </ThemedView>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// StyleSheet.create() registra los estilos de forma optimizada en React Native.
// Todos los valores numéricos son dp (density-independent pixels).
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Contenedor raíz del ScrollView — ocupa toda la pantalla.
  container: { flex: 1 },
  // Contenido interno del scroll: padding general, espacio entre hijos (gap) y padding inferior.
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  // Centrado para la pantalla de carga (spinner).
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  // Texto debajo del spinner de carga.
  loadingText: { color: '#666', fontSize: 15 },

  // Encabezado: fila horizontal con ícono + título.
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  // Título principal "Mi Carrito".
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#1a1a2e' },

  // Banner informativo azul (para usuarios no autenticados).
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',    // Alinea arriba para textos largos.
    gap: 8,
    backgroundColor: '#dbeafe', // Azul claro.
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,          // Borde izquierdo más grueso como acento.
    borderLeftColor: '#3b82f6',  // Azul más oscuro para el acento.
  },
  // Texto del banner: flex:1 para ocupar el ancho restante después del ícono.
  infoBannerText: { flex: 1, color: '#1e40af', fontSize: 13, lineHeight: 19 },

  // Contenedor del estado vacío: centrado verticalmente con espacio.
  emptyContainer: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  // Título grande cuando el carrito está vacío.
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#333' },
  // Subtítulo descriptivo cuando el carrito está vacío.
  empty: { color: '#888', textAlign: 'center', fontSize: 14, lineHeight: 22 },
  // Botón "Ir al Catálogo" cuando el carrito está vacío.
  catalogBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, backgroundColor: '#a57c63',
    paddingHorizontal: 22, paddingVertical: 13, marginTop: 4,
  },
  catalogBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Tarjeta blanca con borde que envuelve la lista de productos.
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    overflow: 'hidden', // Los bordes redondeados afectan a los hijos también.
  },
  // Cabecera de la tarjeta: fondo gris muy claro con borde inferior.
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  // Fila interna: título + badge.
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontWeight: '700', fontSize: 14, color: '#222' },
  // Badge (pastilla índigo) con el número de ítems.
  badge: { backgroundColor: '#a57c63', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  // Botón "Vaciar carrito" con borde rojo y texto rojo.
  vaciarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: '#b93a32', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  vaciarText: { color: '#b93a32', fontSize: 12, fontWeight: '600' },
  // Línea separadora gris entre ítems del carrito.
  itemDivider: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 14 },

  // Fila de un ítem: imagen a la izquierda + datos a la derecha.
  itemRow: { flexDirection: 'row', padding: 14, gap: 12 },
  // Imagen cuadrada del producto con bordes redondeados.
  image: { width: 72, height: 72, borderRadius: 10 },
  // Columna derecha de datos del ítem (flex:1 para ocupar el espacio restante).
  itemBody: { flex: 1, gap: 3 },
  // Nombre del producto en negrita.
  itemName: { fontWeight: '700', fontSize: 14, color: '#222', lineHeight: 19 },
  // Precio unitario en gris.
  itemPrice: { color: '#777', fontSize: 13 },
  // Fila de controles: "-" cantidad "+" subtotal papelera.
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  // Botón cuadrado pequeño para aumentar o disminuir cantidad.
  qtyBtn: {
    width: 28, height: 28, borderRadius: 7,
    borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fafafa',
    alignItems: 'center', justifyContent: 'center',
  },
  // Número de cantidad centrado con ancho mínimo para evitar saltos visuales.
  qtyText: { minWidth: 22, textAlign: 'center', fontWeight: '700', fontSize: 14, color: '#222' },
  // Subtotal del ítem (precio × cantidad) en color índigo.
  subtotalItem: { flex: 1, fontWeight: '700', color: '#a57c63', fontSize: 14 },
  // Área táctil del ícono de papelera con padding para facilitar el toque.
  trashBtn: { padding: 4 },

  // Tarjeta blanca del resumen con borde y padding interno.
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    padding: 16,
    gap: 10,
  },
  summaryTitle: { fontWeight: '700', fontSize: 16, color: '#222', marginBottom: 2 },
  // Fila de dos columnas: etiqueta a la izquierda, valor a la derecha.
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: '#555', fontSize: 14 },
  summaryValue: { color: '#333', fontSize: 14, fontWeight: '500' },
  summaryMuted: { color: '#aaa', fontSize: 14 }, // Texto gris para "A calcular".
  // Línea divisoria horizontal antes del total.
  separator: { height: 1, backgroundColor: '#e8e8e8', marginVertical: 2 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#222' },
  // Total final: número grande en índigo.
  totalValue: { fontSize: 24, fontWeight: '800', color: '#a57c63' },

  // Botón principal de checkout: fondo índigo, ícono + texto centrados.
  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 10, backgroundColor: '#a57c63',
    paddingVertical: 14, marginTop: 4,
  },
  checkoutText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  // Botón secundario "Seguir Comprando": borde gris, sin relleno.
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 10, borderWidth: 1, borderColor: '#ccc',
    paddingVertical: 12,
  },
  continueBtnText: { color: '#555', fontWeight: '600', fontSize: 14 },
});