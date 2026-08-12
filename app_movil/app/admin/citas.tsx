// Página: citas.tsx. vista de citas del sistema.
/**
 * Pantalla de lista de citas para el panel de administrador.
 * Navega desde el dashboard de admin cuando se presiona "Ver detalles" en la tarjeta de Citas.
 */

import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View, TextInput } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import apiClient from '../../src/api/apiClient';
import { useAuth } from '../../src/context/AuthContext';

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

type CitaId = string | number;

type Cita = {
  id?: CitaId;
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

// ─────────────────────────────────────────────────────────────
// FUNCIONES DE UTILIDAD
// ─────────────────────────────────────────────────────────────

const normalizeEstado = (estado?: string): string => {
  return String(estado ?? '').toLowerCase().trim();
};

const isEstadoFinal = (estado?: string): boolean => {
  const normalized = normalizeEstado(estado);
  return normalized === 'completada' || normalized === 'cancelada';
};

const normalizeText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return '';
};

const getClienteNombre = (item: Cita): string => {
  const nombre = item.cliente?.nombre || item.usuario?.nombre || '';
  const apellido = item.cliente?.apellido || item.usuario?.apellido || '';
  return `${nombre} ${apellido}`.trim() || 'Sin cliente';
};

const getProfesionalNombre = (item: Cita): string => {
  const nombre = item.profesional?.nombre || item.Profesional?.nombre || '';
  const apellido = item.profesional?.apellido || item.Profesional?.apellido || '';
  return `${nombre} ${apellido}`.trim() || 'Sin profesional';
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE DE ÍTEM DE CITA
// ─────────────────────────────────────────────────────────────

type CitaItemProps = {
  item: Cita;
  isExpanded: boolean;
  isLoadingDetalle: boolean;
  isConfirming: boolean;
  isCancelling: boolean;
  detalleCitas: Record<string, Cita>;
  onToggle: (id: CitaId) => void;
  onConfirm: (id: CitaId) => void;
  onComplete: (id: CitaId) => void;
  onCancel: (id: CitaId) => void;
};

const CitaItem = ({
  item,
  isExpanded,
  isLoadingDetalle,
  isConfirming,
  isCancelling,
  detalleCitas,
  onToggle,
  onConfirm,
  onComplete,
  onCancel,
}: CitaItemProps) => {
  const cliente = getClienteNombre(item);
  const profesional = getProfesionalNombre(item);
  const cacheKey = String(item.id);
  const serviciosSource = detalleCitas[cacheKey]?.Servicios ?? item.Servicios;
  const estadoNormalizado = normalizeEstado(item.estado);

  const handleToggle = () => {
    onToggle(item.id ?? '');
  };

  const renderServicios = () => {
    if (!Array.isArray(serviciosSource) || serviciosSource.length === 0) {
      return null;
    }

    return (
      <View style={styles.serviceList}>
        {serviciosSource.map((servicio, index) => {
          const servicioNombre = servicio.nombre || `Servicio ${index + 1}`;
          const duracion = servicio.CitaServicio?.duracion ?? servicio.duracion;
          const precio = servicio.CitaServicio?.precio ?? servicio.precio ?? 0;
          const cantidad = servicio.CitaServicio?.cantidad ?? servicio.cantidad ?? 1;
          const subtotal = Number(precio) * Number(cantidad);

          return (
            <View key={`servicio-${index}-${servicioNombre}`} style={styles.serviceItem}>
              <ThemedText style={styles.serviceLabel}>• {servicioNombre}</ThemedText>
              {duracion ? <ThemedText style={styles.serviceInfo}>Duración: {duracion} min</ThemedText> : null}
              <ThemedText style={styles.serviceInfo}>Total servicio: ${subtotal.toLocaleString('es-CO')}</ThemedText>
            </View>
          );
        })}
      </View>
    );
  };

  const renderAcciones = () => {
    if (estadoNormalizado === 'pendiente') {
      return (
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.confirmButton, isConfirming && { opacity: 0.7 }]}
            onPress={() => onConfirm(item.id ?? '')}
            disabled={isConfirming}
          >
            <ThemedText style={styles.confirmButtonText}>
              {isConfirming ? 'Confirmando...' : 'Confirmar cita'}
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.cancelButton, isCancelling && { opacity: 0.7 }]}
            onPress={() => onCancel(item.id ?? '')}
            disabled={isCancelling}
          >
            <ThemedText style={styles.cancelButtonText}>
              {isCancelling ? 'Cancelando...' : 'Cancelar cita'}
            </ThemedText>
          </Pressable>
        </View>
      );
    }

    if (estadoNormalizado === 'confirmada') {
      return (
        <Pressable
          style={[styles.completeButton, isCancelling && { opacity: 0.7 }]}
          onPress={() => onComplete(item.id ?? '')}
          disabled={isCancelling}
        >
          <ThemedText style={styles.completeText}>
            {isCancelling ? 'Completando...' : 'Completar cita'}
          </ThemedText>
        </Pressable>
      );
    }

    if (estadoNormalizado === 'completada') {
      return <ThemedText>La cita ya fue completada.</ThemedText>;
    }

    if (estadoNormalizado === 'cancelada') {
      return <ThemedText>La cita fue cancelada y no puede modificarse.</ThemedText>;
    }

    return null;
  };

  return (
    <Pressable style={styles.card} onPress={handleToggle}>
      <ThemedText type="defaultSemiBold">Cita #{item.id ?? 'N/A'}</ThemedText>
      <ThemedText>Fecha: {item.fecha ?? 'N/A'}</ThemedText>
      <ThemedText>Hora: {item.hora ?? 'N/A'}</ThemedText>
      <ThemedText>Cliente que agendó: {cliente}</ThemedText>
      <ThemedText>Profesional asignado: {profesional}</ThemedText>
      <ThemedText>Estado: {item.estado ?? 'N/A'}</ThemedText>
      <ThemedText style={styles.hint}>
        Presiona para {isExpanded ? 'ocultar' : 'ver'} más datos de la cita.
      </ThemedText>

      {isExpanded && (
        <View style={styles.detailsBox}>
          <ThemedText type="defaultSemiBold">Detalle completo</ThemedText>
          {item.servicio && <ThemedText>Servicio agendado: {item.servicio}</ThemedText>}
          {renderServicios()}
          {item.notas && <ThemedText>Notas: {item.notas}</ThemedText>}
          {typeof item.total === 'number' && (
            <ThemedText>Total: ${item.total.toLocaleString('es-CO')}</ThemedText>
          )}
          {renderAcciones()}
        </View>
      )}
    </Pressable>
  );
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────

export default function AdminCitasScreen() {
  const { user, isAuthenticated } = useAuth() as { user: AuthUser | null; isAuthenticated: boolean };
  const isAdmin = user?.rol === 'administrador';
  const isAux = user?.rol === 'auxiliar';

  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedCitaId, setExpandedCitaId] = useState<CitaId | null>(null);
  const [detalleCitas, setDetalleCitas] = useState<Record<string, Cita>>({});
  const [loadingDetalleId, setLoadingDetalleId] = useState<CitaId | null>(null);
  const [confirmadaId, setConfirmadaId] = useState<CitaId | null>(null);
  const [cancellingId, setCancellingId] = useState<CitaId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ─────────────────────────────────────────────────────────────
  // FUNCIONES DE CARGA
  // ─────────────────────────────────────────────────────────────

  const loadCitaDetalle = async (id: CitaId) => {
    const cacheKey = String(id);
    if (detalleCitas[cacheKey]) {
      return detalleCitas[cacheKey];
    }

    setLoadingDetalleId(id);
    try {
      const res = await apiClient.get(`/cliente/citas/${id}`);
      const citaDetalle = res.data?.data?.cita ?? res.data?.data ?? res.data;
      if (citaDetalle && typeof citaDetalle === 'object' && Object.keys(citaDetalle).length > 0) {
        setDetalleCitas((prev) => ({ ...prev, [cacheKey]: citaDetalle }));
        return citaDetalle as Cita;
      }
      return null;
    } catch {
      return null;
    } finally {
      setLoadingDetalleId(null);
    }
  };

  const loadCitas = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await apiClient.get('/admin/citas');
      const payload = res.data?.data ?? res.data;
      let citasData: Cita[] = [];
      
      if (Array.isArray(payload?.citas)) {
        citasData = payload.citas;
      } else if (Array.isArray(payload)) {
        citasData = payload;
      }
      
      setCitas(citasData);
    } catch (error: unknown) {
      setErrorMessage((error as { message?: string })?.message || 'No se pudo cargar las citas.');
      setCitas([]);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // FUNCIONES DE ACCIONES
  // ─────────────────────────────────────────────────────────────

  const actualizarCita = (id: CitaId, nuevosDatos: Partial<Cita>) => {
    setCitas((prev) =>
      prev.map((c) => (String(c.id) === String(id) ? { ...c, ...nuevosDatos } : c))
    );
    setDetalleCitas((prev) => {
      const existing = prev[String(id)] || null;
      return {
        ...prev,
        [String(id)]: existing ? { ...existing, ...nuevosDatos } : { ...nuevosDatos },
      };
    });
  };

  const crearPayloadActualizacion = (estado: string) => {
    return isAdmin || isAux ? { estado } : undefined;
  };

  const obtenerEndpoint = (id: CitaId, accion: string): string => {
    if (isAdmin || isAux) {
      return `/admin/citas/${id}/estado`;
    }
    return `/cliente/citas/${id}/${accion}`;
  };

  const confirmarCita = (id: CitaId) => {
    const cita = citas.find((c) => String(c.id) === String(id));
    if (isEstadoFinal(cita?.estado)) {
      Alert.alert('No permitido', 'No se puede confirmar una cita completada o cancelada.');
      return;
    }

    Alert.alert(
      'Confirmar cita',
      '¿Estás seguro de que deseas confirmar esta cita?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, confirmar',
          onPress: async () => {
            setConfirmadaId(id);
            try {
              const endpoint = obtenerEndpoint(id, 'confirmada');
              const payload = crearPayloadActualizacion('confirmada');
              
              const res = payload 
                ? await apiClient.put(endpoint, payload)
                : await apiClient.put(endpoint);
              
              const updated = res.data?.data?.cita ?? res.data?.data ?? res.data;
              const datosActualizados = updated && typeof updated === 'object' && Object.keys(updated).length > 0
                ? { ...updated, estado: 'confirmada' }
                : { estado: 'confirmada' };
              actualizarCita(id, datosActualizados);
              Alert.alert('Éxito', 'La cita ha sido confirmada correctamente.');
            } catch (error: any) {
              const msg = error?.response?.data?.message || error?.message || 'No se pudo confirmar la cita. Intenta nuevamente.';
              Alert.alert('Error', msg);
            } finally {
              setConfirmadaId(null);
            }
          },
        },
      ]
    );
  };

  const completarCita = (id: CitaId) => {
    const cita = citas.find((c) => String(c.id) === String(id));
    if (isEstadoFinal(cita?.estado)) {
      Alert.alert('No permitido', 'No se puede completar una cita que ya está finalizada.');
      return;
    }

    Alert.alert(
      'Completar cita',
      '¿Estás seguro de que deseas completar esta cita?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, completar',
          onPress: async () => {
            setCancellingId(id);
            try {
              const endpoint = obtenerEndpoint(id, 'completar');
              const payload = crearPayloadActualizacion('completada');
              
              const res = payload
                ? await apiClient.put(endpoint, payload)
                : await apiClient.put(endpoint);
              
              const updated = res.data?.data?.cita ?? res.data?.data ?? res.data;
              const datosActualizados = updated && typeof updated === 'object' && Object.keys(updated).length > 0
                ? { ...updated, estado: 'completada' }
                : { estado: 'completada' };
              actualizarCita(id, datosActualizados);
              Alert.alert('Éxito', 'La cita ha sido completada correctamente.');
            } catch (error: any) {
              const msg = error?.response?.data?.message || error?.message || 'No se pudo completar la cita. Intenta nuevamente.';
              Alert.alert('Error', msg);
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const cancelarCita = (id: CitaId) => {
    const cita = citas.find((c) => String(c.id) === String(id));
    if (isEstadoFinal(cita?.estado)) {
      Alert.alert('No permitido', 'No se puede cancelar una cita que ya está finalizada.');
      return;
    }

    Alert.alert(
      'Cancelar cita',
      '¿Estás seguro de que deseas cancelar esta cita?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          onPress: async () => {
            setCancellingId(id);
            try {
              const endpoint = obtenerEndpoint(id, 'cancelar');
              const payload = crearPayloadActualizacion('cancelada');
              
              const res = payload
                ? await apiClient.put(endpoint, payload)
                : await apiClient.put(endpoint);
              
              const updated = res.data?.data?.cita ?? res.data?.data ?? res.data;
              const datosActualizados = updated && typeof updated === 'object' && Object.keys(updated).length > 0
                ? { ...updated, estado: 'cancelada' }
                : { estado: 'cancelada' };
              actualizarCita(id, datosActualizados);
              Alert.alert('Éxito', 'La cita ha sido cancelada correctamente.');
            } catch (error: any) {
              const msg = error?.response?.data?.message || error?.message || 'No se pudo cancelar la cita. Intenta nuevamente.';
              Alert.alert('Error', msg);
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  // ─────────────────────────────────────────────────────────────
  // FILTRADO DE CITAS
  // ─────────────────────────────────────────────────────────────

  const filteredCitas = useMemo(() => {
    const query = normalizeText(searchQuery.trim());
    if (!query) return citas;

    return citas.filter((item) => {
      const servicioNombre = normalizeText(item.servicio);
      const serviciosNombres = Array.isArray(item.Servicios)
        ? item.Servicios.map((servicio) => normalizeText(servicio.nombre)).join(' ')
        : '';
      const descripcion = normalizeText(item.notas);
      const clienteNombre = normalizeText(getClienteNombre(item));
      const profesionalNombre = normalizeText(getProfesionalNombre(item));
      const citaId = normalizeText(item.id);
      const hayTexto = `${servicioNombre} ${serviciosNombres} ${descripcion} ${clienteNombre} ${profesionalNombre} ${citaId}`;
      return hayTexto.includes(query);
    });
  }, [citas, searchQuery]);

  // ─────────────────────────────────────────────────────────────
  // EFECTOS
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isAuthenticated && (isAdmin || isAux)) {
      loadCitas();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, isAdmin, isAux]);

  // ─────────────────────────────────────────────────────────────
  // HANDLERS DE UI
  // ─────────────────────────────────────────────────────────────

  const handleToggleDetails = async (id: CitaId) => {
    const nextId = expandedCitaId === id ? null : id;
    setExpandedCitaId(nextId);

    if (nextId !== null && !detalleCitas[String(id)]) {
      const item = citas.find((c) => String(c.id) === String(id));
      if (!Array.isArray(item?.Servicios)) {
        await loadCitaDetalle(id);
      }
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

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

      {/* BARRA DE BÚSQUEDA */}
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Buscar cita..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.input}
        />
        {searchQuery.trim().length > 0 && (
          <Pressable style={styles.clearBtn} onPress={() => setSearchQuery('')}>
            <ThemedText style={styles.searchBtnText}>X</ThemedText>
          </Pressable>
        )}
      </View>

      <FlatList
        data={filteredCitas}
        keyExtractor={(item, index) => String(item.id ?? `cita-${index}`)}
        contentContainerStyle={filteredCitas.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={!loading ? <ThemedText>No hay citas registradas.</ThemedText> : null}
        renderItem={({ item }) => {
          const isExpanded = expandedCitaId === item.id;
          const isLoadingDetalle = loadingDetalleId === item.id;
          const isConfirming = confirmadaId === item.id;
          const isCancelling = cancellingId === item.id;

          return (
            <CitaItem
              item={item}
              isExpanded={isExpanded}
              isLoadingDetalle={isLoadingDetalle}
              isConfirming={isConfirming}
              isCancelling={isCancelling}
              detalleCitas={detalleCitas}
              onToggle={handleToggleDetails}
              onConfirm={confirmarCita}
              onComplete={completarCita}
              onCancel={cancelarCita}
            />
          );
        }}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

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