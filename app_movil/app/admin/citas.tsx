/**
 * Pantalla de lista de citas para el panel de administrador.
 * Navega desde el dashboard de admin cuando se presiona "Ver detalles" en la tarjeta de Citas.
 */

import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import apiClient from '../../src/api/apiClient';
import { useAuth } from '../../src/context/AuthContext';

type Cita = {
  id?: string | number;
  fecha?: string;
  hora?: string;
  estado?: string;
  servicio?: string;
  total?: number;
  notas?: string;
  cliente?: {
    nombre?: string;
    apellido?: string;
    email?: string;
    telefono?: string;
  };
  usuario?: {
    nombre?: string;
    apellido?: string;
    email?: string;
    telefono?: string;
  };
  profesional?: {
    nombre?: string;
    apellido?: string;
  };
  Profesional?: {
    nombre?: string;
    apellido?: string;
  };
  Servicios?: Array<{
    nombre?: string;
    precio?: number;
    duracion?: number;
    cantidad?: number;
    CitaServicio?: {
      precio?: number;
      duracion?: number;
      cantidad?: number;
    };
  }>;
};

type AuthUser = { rol?: string; nombre?: string };

export default function AdminCitasScreen() {
  const { user, isAuthenticated } = useAuth() as { user: AuthUser | null; isAuthenticated: boolean };
  const isAdmin = user?.rol === 'administrador';
  const isAux = user?.rol === 'auxiliar';

  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedCitaId, setExpandedCitaId] = useState<string | number | null>(null);
  const [detalleCitas, setDetalleCitas] = useState<Record<string, Cita>>({});
  const [loadingDetalleId, setLoadingDetalleId] = useState<string | number | null>(null);
  const [cancellingId, setCancellingId] = useState<string | number | null>(null);

  const loadCitaDetalle = async (id: string | number) => {
    const cacheKey = String(id);
    if (detalleCitas[cacheKey]) {
      return detalleCitas[cacheKey];
    }

    setLoadingDetalleId(id);
    try {
      const res = await apiClient.get(`/cliente/citas/${id}`);
      const citaDetalle = res.data?.data?.cita ?? res.data?.data ?? res.data ?? {};
      setDetalleCitas((prev) => ({ ...prev, [cacheKey]: citaDetalle }));
      return citaDetalle as Cita;
    } catch {
      return null;
    } finally {
      setLoadingDetalleId(null);
    }
  };

  const cancelarCita = (id: string | number) => {
    Alert.alert('Confirmar cancelación', '¿Estás seguro de que deseas cancelar esta cita?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        onPress: async () => {
          setCancellingId(id);
          try {
            if (isAdmin || isAux) {
              // Los admins/auxiliares usan la ruta admin para actualizar estado
              const res = await apiClient.put(`/admin/citas/${id}/estado`, { estado: 'cancelada' });
              const updated = res.data?.data?.cita ?? res.data?.data ?? res.data ?? {};
              setCitas((prev) => prev.map((c) => (String(c.id) === String(id) ? { ...c, ...(updated || {}), estado: 'cancelada' } : c)));
              setDetalleCitas((prev) => ({ ...prev, [String(id)]: { ...(prev[String(id)] || {}), ...(updated || {}), estado: 'cancelada' } }));
            } else {
              const res = await apiClient.put(`/cliente/citas/${id}/cancelar`);
              setCitas((prev) => prev.map((c) => (String(c.id) === String(id) ? { ...c, estado: 'cancelada' } : c)));
              setDetalleCitas((prev) => ({ ...prev, [String(id)]: { ...(prev[String(id)] || {}), estado: 'cancelada' } }));
            }
          } catch (error: any) {
            const msg = error?.response?.data?.message || error?.message || 'No se pudo cancelar la cita. Intenta nuevamente.';
            Alert.alert('Error', msg);
          } finally {
            setCancellingId(null);
          }
        }
      }
    ]);
  };

  const loadCitas = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await apiClient.get('/admin/citas');
      const payload = res.data?.data ?? res.data ?? {};
      const citasData = Array.isArray(payload.citas)
        ? payload.citas
        : Array.isArray(payload)
          ? payload
          : [];
      setCitas(citasData);
    } catch (error: unknown) {
      setErrorMessage((error as { message?: string })?.message || 'No se pudo cargar las citas.');
      setCitas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && (isAdmin || isAux)) {
      loadCitas();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, isAdmin, isAux]);

  if (!isAuthenticated || (!isAdmin && !isAux)) {
    return (
      <View style={styles.centered}>
        <ThemedText type="title">Acceso restringido</ThemedText>
        <ThemedText>No tienes permiso para ver esta pantalla.</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Citas</ThemedText>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#a56363" />
          <ThemedText>Cargando citas...</ThemedText>
        </View>
      ) : null}

      {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}

      <FlatList
        data={citas}
        keyExtractor={(item, index) => String(item.id ?? index)}
        contentContainerStyle={citas.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={!loading ? <ThemedText>No hay citas registradas.</ThemedText> : null}
        renderItem={({ item }) => {
          const clienteNombre = item.cliente?.nombre || item.usuario?.nombre || '';
          const clienteApellido = item.cliente?.apellido || item.usuario?.apellido || '';
          const cliente = `${clienteNombre} ${clienteApellido}`.trim() || 'Sin cliente';
          const profesionalNombre = item.profesional?.nombre || item.Profesional?.nombre || '';
          const profesionalApellido = item.profesional?.apellido || item.Profesional?.apellido || '';
          const profesional = `${profesionalNombre} ${profesionalApellido}`.trim() || 'Sin profesional';
          const cacheKey = String(item.id);
          const serviciosSource = detalleCitas[cacheKey]?.Servicios ?? item.Servicios;
          const servicios = Array.isArray(serviciosSource) && serviciosSource.length > 0
            ? serviciosSource.map((servicio) => servicio.nombre).filter(Boolean).join(', ')
            : item.servicio || 'Sin servicio';
          const servicioAgendado = loadingDetalleId === item.id ? 'Cargando servicio...' : servicios;
          const isExpanded = String(item.id) === String(expandedCitaId);

          const toggleDetails = async () => {
            const nextId = isExpanded ? null : item.id ?? null;
            setExpandedCitaId(nextId);

            if (nextId !== null && !detalleCitas[cacheKey] && !Array.isArray(item.Servicios)) {
              await loadCitaDetalle(item.id ?? '');
            }
          };

          return (
            <Pressable style={styles.card} onPress={toggleDetails}>
              <ThemedText type="defaultSemiBold">Cita #{item.id ?? 'N/A'}</ThemedText>
              <ThemedText>Fecha: {item.fecha ?? 'N/A'}</ThemedText>
              <ThemedText>Hora: {item.hora ?? 'N/A'}</ThemedText>
              <ThemedText>Cliente que agendó: {cliente}</ThemedText>
              <ThemedText>Profesional asignado: {profesional}</ThemedText>
              <ThemedText>Estado: {item.estado ?? 'N/A'}</ThemedText>
              <ThemedText style={styles.hint}>
                Presiona para {isExpanded ? 'ocultar' : 'ver'} más datos de la cita.
              </ThemedText>

              {isExpanded ? (
                <View style={styles.detailsBox}>
                  <ThemedText type="defaultSemiBold">Detalle completo</ThemedText>
                  {item.servicio ? <ThemedText>Servicio agendado: {item.servicio}</ThemedText> : null}
                  {Array.isArray(serviciosSource) && serviciosSource.length > 0 ? (
                    <View style={styles.serviceList}>
                      {(serviciosSource || []).map((servicio, index) => {
                        const servicioNombre = servicio.nombre || `Servicio ${index + 1}`;
                        const duracion = servicio.CitaServicio?.duracion ?? servicio.duracion;
                        const precio = servicio.CitaServicio?.precio ?? servicio.precio ?? 0;
                        const cantidad = servicio.CitaServicio?.cantidad ?? servicio.cantidad ?? 1;
                        const subtotal = Number(precio) * Number(cantidad);

                        return (
                          <View key={`servicio-${index}`} style={styles.serviceItem}>
                            <ThemedText style={styles.serviceLabel}>• {servicioNombre}</ThemedText>
                            {duracion ? <ThemedText style={styles.serviceInfo}>Duración: {duracion} min</ThemedText> : null}
                            <ThemedText style={styles.serviceInfo}>Total servicio: ${subtotal.toLocaleString('es-CO')}</ThemedText>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                  {item.notas ? <ThemedText>Notas: {item.notas}</ThemedText> : null}
                  {typeof item.total === 'number' ? <ThemedText>Total: ${item.total.toLocaleString('es-CO')}</ThemedText> : null}
                  {item.estado !== 'cancelada' ? (
                    <Pressable
                      style={[styles.cancelButton, cancellingId === item.id ? { opacity: 0.7 } : undefined]}
                      onPress={() => cancelarCita(item.id ?? '')}
                    >
                      <ThemedText style={styles.cancelText}>{cancellingId === item.id ? 'Cancelando...' : 'Cancelar cita'}</ThemedText>
                    </Pressable>
                  ) : (
                    <ThemedText>La cita ya fue cancelada.</ThemedText>
                  )}
                </View>
              ) : null}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f6f2' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e6d3b3' },
  error: { color: '#a56363', marginBottom: 12 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  detailsBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e6d3b3', gap: 4 },
  serviceList: { marginTop: 8, gap: 6 },
  serviceItem: { paddingVertical: 6, paddingHorizontal: 8, backgroundColor: '#fbf6f0', borderRadius: 8 },
  serviceLabel: { fontWeight: '600' },
  serviceInfo: { marginTop: 2, color: '#5b4b40', fontSize: 13 },
  hint: { marginTop: 10, color: '#7b6758', fontSize: 12 },
  cancelButton: { marginTop: 8, backgroundColor: '#f2dede', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center' },
  cancelText: { color: '#a94442', fontWeight: '600' }
});
