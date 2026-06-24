/**
 * Pantalla de lista de citas para el panel de administrador.
 * Navega desde el dashboard de admin cuando se presiona "Ver detalles" en la tarjeta de Citas.
 */

import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View, TextInput } from 'react-native';
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
  const [confirmadaId, setConfirmadaId] = useState<string | number | null>(null);
  const [cancellingId, setCancellingId] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

const normalizeEstado = (estado?: string) => String(estado ?? '').toLowerCase().trim();

const isEstadoFinal = (estado?: string) => {
  const normalized = normalizeEstado(estado);
  return normalized === 'completada' || normalized === 'cancelada';
};

const confirmarCita = (id: string | number) => {
  const cita = citas.find((c) => String(c.id) === String(id));
  if (isEstadoFinal(cita?.estado)) {
    Alert.alert('No permitido', 'No se puede confirmar una cita completada o cancelada.');
    return;
  }

  Alert.alert(
    'Confirmar cita',
    '¿Estás seguro de que deseas confirmar esta cita?',
    [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Sí, confirmar',
        onPress: async () => {
          setConfirmadaId(id);

          try {
            if (isAdmin || isAux) {
              const res = await apiClient.put(
                `/admin/citas/${id}/estado`,
                { estado: 'confirmada' }
              );

              const updated =
                res.data?.data?.cita ??
                res.data?.data ??
                res.data ??
                {};

              setCitas((prev) =>
                prev.map((c) =>
                  String(c.id) === String(id)
                    ? { ...c, ...(updated || {}), estado: 'confirmada' }
                    : c
                )
              );

              setDetalleCitas((prev) => ({
                ...prev,
                [String(id)]: {
                  ...(prev[String(id)] || {}),
                  ...(updated || {}),
                  estado: 'confirmada',
                },
              }));
            } else {
              await apiClient.put(`/cliente/citas/${id}/confirmada`);

              setCitas((prev) =>
                prev.map((c) =>
                  String(c.id) === String(id)
                    ? { ...c, estado: 'confirmada' }
                    : c
                )
              );

              setDetalleCitas((prev) => ({
                ...prev,
                [String(id)]: {
                  ...(prev[String(id)] || {}),
                  estado: 'confirmada',
                },
              }));
            }

            Alert.alert('Éxito', 'La cita ha sido confirmada correctamente.');
          } catch (error: any) {
            const msg =
              error?.response?.data?.message ||
              error?.message ||
              'No se pudo confirmar la cita. Intenta nuevamente.';

            Alert.alert('Error', msg);
          } finally {
            setConfirmadaId(null);
          }
        },
      },
    ]
  );
};

const completarCita = (id: string | number) => {
  const cita = citas.find((c) => String(c.id) === String(id));
  if (isEstadoFinal(cita?.estado)) {
    Alert.alert('No permitido', 'No se puede completar una cita que ya está finalizada.');
    return;
  }

  Alert.alert('Completar cita', '¿Estás seguro de que deseas completar esta cita?', [
    { text: 'No', style: 'cancel' },
    {
      text: 'Sí, completar',
      onPress: async () => {
        setCancellingId(id);
        try {
          if (isAdmin || isAux) {
            const res = await apiClient.put(`/admin/citas/${id}/estado`, { estado: 'completada' });
            const updated = res.data?.data?.cita ?? res.data?.data ?? res.data ?? {};
            setCitas((prev) => prev.map((c) => (String(c.id) === String(id) ? { ...c, ...(updated || {}), estado: 'completada' } : c)));
            setDetalleCitas((prev) => ({ ...prev, [String(id)]: { ...(prev[String(id)] || {}), ...(updated || {}), estado: 'completada' } }));
          } else {
            await apiClient.put(`/cliente/citas/${id}/completar`);
            setCitas((prev) => prev.map((c) => (String(c.id) === String(id) ? { ...c, estado: 'completada' } : c)));
            setDetalleCitas((prev) => ({ ...prev, [String(id)]: { ...(prev[String(id)] || {}), estado: 'completada' } }));
          }
          Alert.alert('Éxito', 'La cita ha sido completada correctamente.');
        } catch (error: any) {
          const msg = error?.response?.data?.message || error?.message || 'No se pudo completar la cita. Intenta nuevamente.';
          Alert.alert('Error', msg);
        } finally {
          setCancellingId(null);
        }
      }
    }
  ]);
};

const cancelarCita = (id: string | number) => {
  const cita = citas.find((c) => String(c.id) === String(id));
  if (isEstadoFinal(cita?.estado)) {
    Alert.alert('No permitido', 'No se puede cancelar una cita que ya está finalizada.');
    return;
  }

  Alert.alert('Cancelar cita', '¿Estás seguro de que deseas cancelar esta cita?', [
    { text: 'No', style: 'cancel' },
    {
      text: 'Sí, cancelar',
      onPress: async () => {
        setCancellingId(id);
        try {
          if (isAdmin || isAux) {
            const res = await apiClient.put(`/admin/citas/${id}/estado`, { estado: 'cancelada' });
            const updated = res.data?.data?.cita ?? res.data?.data ?? res.data ?? {};
            setCitas((prev) => prev.map((c) => (String(c.id) === String(id) ? { ...c, ...(updated || {}), estado: 'cancelada' } : c)));
            setDetalleCitas((prev) => ({ ...prev, [String(id)]: { ...(prev[String(id)] || {}), ...(updated || {}), estado: 'cancelada' } }));
          } else {
            await apiClient.put(`/cliente/citas/${id}/cancelar`);
            setCitas((prev) => prev.map((c) => (String(c.id) === String(id) ? { ...c, estado: 'cancelada' } : c)));
            setDetalleCitas((prev) => ({ ...prev, [String(id)]: { ...(prev[String(id)] || {}), estado: 'cancelada' } }));
          }
          Alert.alert('Éxito', 'La cita ha sido cancelada correctamente.');
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

  const filteredCitas = useMemo(() => {
    const normalize = (value: unknown) =>
      String(value ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const query = normalize(searchQuery.trim());
    if (!query) return citas;

    return citas.filter((item) => {
      const servicioNombre = normalize(item.servicio);
      const serviciosNombres = Array.isArray(item.Servicios)
        ? item.Servicios.map((servicio) => normalize(servicio.nombre)).join(' ')
        : '';
      const descripcion = normalize(item.notas);
      const clienteNombre = normalize(`${item.cliente?.nombre ?? ''} ${item.cliente?.apellido ?? ''}`);
      const profesionalNombre = normalize(`${item.profesional?.nombre ?? item.Profesional?.nombre ?? ''} ${item.profesional?.apellido ?? item.Profesional?.apellido ?? ''}`);
      const usuarioNombre = normalize(`${item.usuario?.nombre ?? ''} ${item.usuario?.apellido ?? ''}`);
      const citaId = normalize(item.id);
      const hayTexto = `${servicioNombre} ${serviciosNombres} ${descripcion} ${clienteNombre} ${profesionalNombre} ${usuarioNombre} ${citaId}`;
      return hayTexto.includes(query);
    });
  }, [citas, searchQuery]);

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

      {/* ── BARRA DE BÚSQUEDA ──────────────────────────────────────────── */}
<View style={styles.searchRow}>
  <TextInput
    placeholder="Buscar cita..."
    value={searchQuery}
    onChangeText={setSearchQuery}
    style={styles.input}
  />

  {searchQuery.trim().length > 0 && (
    <Pressable
      style={styles.clearBtn}
      onPress={() => setSearchQuery('')}
    >
      <ThemedText style={styles.searchBtnText}>X</ThemedText>
    </Pressable>
  )}


</View>


      <FlatList
        data={filteredCitas}
        keyExtractor={(item, index) => String(item.id ?? index)}
        contentContainerStyle={filteredCitas.length === 0 ? styles.emptyContainer : undefined}
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
                  {normalizeEstado(item.estado) === 'pendiente' ? (
                    <View style={styles.actionRow}>
                      <Pressable
                        style={[styles.confirmButton, confirmadaId === item.id ? { opacity: 0.7 } : undefined]}
                        onPress={() => confirmarCita(item.id ?? '')}
                        disabled={confirmadaId === item.id}
                      >
                        <ThemedText style={styles.confirmButtonText}>{confirmadaId === item.id ? 'Confirmando...' : 'Confirmar cita'}</ThemedText>
                      </Pressable>
                      <Pressable
                        style={[styles.cancelButton, cancellingId === item.id ? { opacity: 0.7 } : undefined]}
                        onPress={() => cancelarCita(item.id ?? '')}
                        disabled={cancellingId === item.id}
                      >
                        <ThemedText style={styles.cancelButtonText}>{cancellingId === item.id ? 'Cancelando...' : 'Cancelar cita'}</ThemedText>
                      </Pressable>
                    </View>
                  ) : normalizeEstado(item.estado) === 'confirmada' ? (
                    <Pressable
                      style={[styles.completeButton, cancellingId === item.id ? { opacity: 0.7 } : undefined]}
                      onPress={() => completarCita(item.id ?? '')}
                      disabled={cancellingId === item.id}
                    >
                      <ThemedText style={styles.completeText}>{cancellingId === item.id ? 'Completando...' : 'Completar cita'}</ThemedText>
                    </Pressable>
                  ) : normalizeEstado(item.estado) === 'completada' ? (
                    <ThemedText>La cita ya fue completada.</ThemedText>
                  ) : normalizeEstado(item.estado) === 'cancelada' ? (
                    <ThemedText>La cita fue cancelada y no puede modificarse.</ThemedText>
                  ) : null}
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
  card: { backgroundColor: '#ebd6c3', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#d8b08c' },
  error: { color: '#a56363', marginBottom: 12 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  detailsBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e6d3b3', gap: 4 },
  serviceList: { marginTop: 8, gap: 6 },
  serviceItem: { paddingVertical: 6, paddingHorizontal: 8, backgroundColor: '#fbf6f0', borderRadius: 8 },
  serviceLabel: { fontWeight: '600' },
  serviceInfo: { marginTop: 2, color: '#5b4b40', fontSize: 13 },
  hint: { marginTop: 10, color: '#7b6758', fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' },
  completeButton: { marginTop: 8, backgroundColor: '#5295b4', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center' },
  completeText: { color: '#fff', fontWeight: '600' },
  cancelButton: { marginTop: 8, backgroundColor: '#d04747', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: '#fff', fontWeight: '700' },
  input: { flex: 1, borderWidth: 1, borderColor: '#d6c7ae', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff' },
  searchBtn: { backgroundColor: '#3e2f25', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  clearBtn: { backgroundColor: '#3f2d25', borderRadius: 14, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' },
  confirmButton: {
    marginTop: 8,
    backgroundColor: '#5d9d51',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: { color: '#fff', fontWeight: '700' },
  searchBtnText: { color: '#fff', fontWeight: '700' },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
});

