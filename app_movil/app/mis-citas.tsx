// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVO: app/mis-citas.tsx
// PROPÓSITO: Lista todas las citas del cliente autenticado.
//   - Se recarga automáticamente cada vez que el usuario vuelve a esta pantalla.
//   - Muestra un estado vacío si el cliente aún no tiene citas.
//   - Cada tarjeta de cita muestra: servicios, estado, profesional, fecha, hora, duración y total.
// ─────────────────────────────────────────────────────────────────────────────

// ── IMPORTACIONES ────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { useAuth } from '../src/context/AuthContext';
import citaService from '../src/services/citaService';
import { formatTimeWithPeriod } from '../src/utils/time';

// ── TIPO: Cita ────────────────────────────────────────────────────────────────
type Cita = {
  id?: string | number;
  estado?: string;
  fecha?: string;
  hora?: string;
  duracionTotal?: number;
  total?: number;
  notas?: string;
  Servicios?: Array<{ id: number; nombre: string }>;
  profesional?: { id: number; nombre: string };
  createdAt?: string;
};

// ── HELPERS DE NAVEGACIÓN ─────────────────────────────────────────────────────
const routerReplace = (path: string) => (router as unknown as { replace: (p: string) => void }).replace(path);
const routerPush    = (path: string) => (router as unknown as { push:    (p: string) => void }).push(path);

// ── HELPERS DE FORMATO ─────────────────────────────────────────────────────────
function formatCOP(value: unknown) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`;
}

function formatDate(value: unknown) {
  if (!value) return '-';
  return new Date(value as string).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatEstado(estado: string | undefined) {
  const value = (estado || '').toLowerCase();
  if (value === 'confirmada') return 'Confirmada';
  if (value === 'pendiente') return 'Pendiente';
  if (value === 'cancelada') return 'Cancelada';
  if (value === 'completada') return 'Completada';
  return estado || 'Sin estado';
}

function getEstadoBadgeStyle(estado: string | undefined) {
  const value = (estado || '').toLowerCase();
  if (value === 'confirmada') return { backgroundColor: '#d4edda', borderColor: '#28a745', textColor: '#155724' };
  if (value === 'completada') return { backgroundColor: '#d4edda', borderColor: '#28a745', textColor: '#155724' };
  if (value === 'cancelada') return { backgroundColor: '#f8d7da', borderColor: '#f5c6cb', textColor: '#721c24' };
  return { backgroundColor: '#fff3cd', borderColor: '#ffc107', textColor: '#856404' };
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function MisCitasScreen() {
  const { isAuthenticated } = useAuth() as { isAuthenticated: boolean };
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reprogrammingId, setReprogrammingId] = useState<string | number | null>(null);
  const [reprogramFecha, setReprogramFecha] = useState('');
  const [reprogramHora, setReprogramHora] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(null);

  const loadCitas = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const data = await citaService.obtenerMisCitas();
      setCitas(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      setErrorMessage((error as { message?: string })?.message || 'No fue posible cargar tus citas.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const resetReprogramForm = () => {
    setReprogrammingId(null);
    setReprogramFecha('');
    setReprogramHora('');
  };

  const handleCancelarCita = (id: string | number) => {
    Alert.alert('Confirmar cancelación', '¿Estás seguro de que deseas cancelar esta cita?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        onPress: async () => {
          setActionLoadingId(id);
          try {
            await citaService.cancelarCita(id);
            setCitas((prev) => prev.map((cita) => (String(cita.id) === String(id) ? { ...cita, estado: 'cancelada' } : cita)));
            resetReprogramForm();
          } catch (error: unknown) {
            Alert.alert('Error', (error as { message?: string })?.message || 'No se pudo cancelar la cita. Intenta nuevamente.');
          } finally {
            setActionLoadingId(null);
          }
        }
      }
    ]);
  };

  const startReprogramar = (cita: Cita) => {
    setReprogrammingId(cita.id ?? null);
    setReprogramFecha(cita.fecha ?? '');
    setReprogramHora(cita.hora ?? '');
  };

  const cancelReprogramar = () => {
    resetReprogramForm();
  };

  const handleReprogramarCita = async (id: string | number) => {
    if (!reprogramFecha || !reprogramHora) {
      Alert.alert('Falta información', 'Ingresa la nueva fecha y hora de la cita.');
      return;
    }

    // Formatear hora con padding: "8:30" -> "08:30:00"
    const [hh, mm] = reprogramHora.split(':');
    const horaFormateada = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`;

    setActionLoadingId(id);
    try {
      const updated = await citaService.reprogramarCita(id, {
        fecha: reprogramFecha,
        hora: horaFormateada
      });

      if (updated) {
        setCitas((prev) => prev.map((cita) => (String(cita.id) === String(id) ? { ...cita, ...updated } : cita)));
        Alert.alert('Cita reprogramada', 'La cita fue actualizada correctamente.');
        resetReprogramForm();
      }
    } catch (error: unknown) {
      Alert.alert('Error', (error as { message?: string })?.message || 'No se pudo reprogramar la cita. Intenta nuevamente.');
    } finally {
      setActionLoadingId(null);
    }
  };

  useEffect(() => {
    loadCitas();
  }, [loadCitas]);

  useFocusEffect(
    useCallback(() => {
      loadCitas();
    }, [loadCitas])
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.centered}>
        <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
        <ThemedText style={styles.centeredTitle}>Debes iniciar sesión</ThemedText>
        <ThemedText style={styles.subtitle}>Inicia sesión para ver tus citas agendadas.</ThemedText>
        <Pressable style={styles.primaryButton} onPress={() => routerReplace('/(tabs)/explore')}>
          <ThemedText style={styles.primaryButtonText}>Ir a Cuenta</ThemedText>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#a57c63" />
        <ThemedText>Cargando citas...</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="calendar-outline" size={28} color="#a57c63" />
          <ThemedText style={styles.title}>Mis Citas</ThemedText>
        </View>
        <Pressable style={styles.newCitaBtn} onPress={() => routerPush('/screens/servicios')}>
          <Ionicons name="add-circle" size={20} color="#fff" />
          <ThemedText style={styles.newCitaBtnText}>Nueva Cita</ThemedText>
        </Pressable>
      </View>

      {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}

      {citas.length === 0 ? (
        <ThemedView style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color="#d1d5db" style={{ marginBottom: 12 }} />
          <ThemedText type="defaultSemiBold" style={{ textAlign: 'center' }}>
            No tienes citas agendadas
          </ThemedText>
          <ThemedText style={[styles.subtitle, { textAlign: 'center' }]}>
            Agenda una cita para comenzar
          </ThemedText>
          <Pressable style={styles.primaryButton} onPress={() => routerPush('/(tabs)/agendar')}>
            <Ionicons name="add" size={18} color="#fff" />
            <ThemedText style={styles.primaryButtonText}>Agendar Cita</ThemedText>
          </Pressable>
        </ThemedView>
      ) : (
        citas.map((cita) => {
          const estadoStyle = getEstadoBadgeStyle(cita.estado);
          const servicios = (cita.Servicios || []).map(s => s.nombre).join(', ');

          return (
            <View key={cita.id} style={styles.card}>
              {/* Encabezado: Servicios + Badge Estado */}
              <View style={styles.cardHeader}>
                <View style={styles.serviciosContainer}>
                  <ThemedText type="defaultSemiBold" numberOfLines={2}>
                    {servicios || 'Cita'}
                  </ThemedText>
                </View>
                <View style={[styles.badge, { borderColor: estadoStyle.borderColor, backgroundColor: estadoStyle.backgroundColor }]}>
                  <ThemedText style={[styles.badgeText, { color: estadoStyle.textColor }]}>
                    {formatEstado(cita.estado)}
                  </ThemedText>
                </View>
              </View>

              {/* Información de la cita */}
              <View style={styles.cardBody}>
                {/* Profesional */}
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={16} color="#a57c63" />
                  <View style={styles.infoContent}>
                    <ThemedText style={styles.infoLabel}>Profesional</ThemedText>
                    <ThemedText style={styles.infoValue}>
                      {cita.profesional?.nombre || 'Sin asignar'}
                    </ThemedText>
                  </View>
                </View>

                {/* Fecha */}
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={16} color="#a57c63" />
                  <View style={styles.infoContent}>
                    <ThemedText style={styles.infoLabel}>Fecha</ThemedText>
                    <ThemedText style={styles.infoValue}>{formatDate(cita.fecha)}</ThemedText>
                  </View>
                </View>

                {/* Hora */}
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color="#a57c63" />
                  <View style={styles.infoContent}>
                    <ThemedText style={styles.infoLabel}>Hora</ThemedText>
                    <ThemedText style={styles.infoValue}>{formatTimeWithPeriod(cita.hora)}</ThemedText>
                  </View>
                </View>

                {/* Duración */}
                {cita.duracionTotal && (
                  <View style={styles.infoRow}>
                    <Ionicons name="hourglass-outline" size={16} color="#a57c63" />
                    <View style={styles.infoContent}>
                      <ThemedText style={styles.infoLabel}>Duración</ThemedText>
                      <ThemedText style={styles.infoValue}>{cita.duracionTotal} min</ThemedText>
                    </View>
                  </View>
                )}

                {/* Total */}
                {cita.total && (
                  <View style={styles.infoRow}>
                    <Ionicons name="pricetag-outline" size={16} color="#a57c63" />
                    <View style={styles.infoContent}>
                      <ThemedText style={styles.infoLabel}>Total</ThemedText>
                      <ThemedText style={[styles.infoValue, styles.totalValue]}>
                        {formatCOP(cita.total)}
                      </ThemedText>
                    </View>
                  </View>
                )}

                {/* Notas */}
                {cita.notas && (
                  <View style={styles.infoRow}>
                    <Ionicons name="document-text-outline" size={16} color="#a57c63" />
                    <View style={styles.infoContent}>
                      <ThemedText style={styles.infoLabel}>Notas</ThemedText>
                      <ThemedText style={styles.infoValue}>{cita.notas}</ThemedText>
                    </View>
                  </View>
                )}

                {reprogrammingId === cita.id ? (
                  <View style={styles.reprogramBox}>
                    <ThemedText style={styles.formLabel}>Nueva fecha</ThemedText>
                    <TextInput
                      value={reprogramFecha}
                      onChangeText={setReprogramFecha}
                      placeholder="2026-06-30"
                      style={styles.input}
                      placeholderTextColor="#9ca3af"
                    />
                    <ThemedText style={styles.formLabel}>Nueva hora</ThemedText>
                    <TextInput
                      value={reprogramHora}
                      onChangeText={setReprogramHora}
                      placeholder="14:30"
                      style={styles.input}
                      placeholderTextColor="#9ca3af"
                    />
                    <View style={styles.buttonRow}>
                      <Pressable
                        style={[styles.primaryButton, actionLoadingId === cita.id && { opacity: 0.6 }]}
                        onPress={() => handleReprogramarCita(cita.id ?? '')}
                        disabled={actionLoadingId === cita.id}
                      >
                        {actionLoadingId === cita.id ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <ThemedText style={styles.primaryButtonText}>Guardar cambio</ThemedText>
                        )}
                      </Pressable>
                      <Pressable style={styles.secondaryButton} onPress={cancelReprogramar}>
                        <ThemedText style={styles.secondaryButtonText}>Cancelar</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.actionsRow}>
                    {cita.estado?.toLowerCase() === 'pendiente' && (
                      <Pressable style={styles.secondaryButton} onPress={() => handleCancelarCita(cita.id ?? '')}>
                        <ThemedText style={styles.secondaryButtonText}>Cancelar cita</ThemedText>
                      </Pressable>
                    )}
                    {cita.estado?.toLowerCase() !== 'completada' && (
                      <Pressable style={styles.secondaryButton} onPress={() => startReprogramar(cita)}>
                        <ThemedText style={styles.secondaryButtonText}>Reprogramar</ThemedText>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f6f2' },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  centeredTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', color: '#3e2f25' },
  subtitle: { color: '#7b6758', textAlign: 'center' },
  error: { color: '#a56363', marginBottom: 8 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#e6d3b3',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#3e2f25' },
  newCitaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#c8a27a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  newCitaBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  emptyState: {
    borderRadius: 12,
    padding: 24,
    gap: 12,
    alignItems: 'center',
    marginTop: 32,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e6d3b3',
  },
  card: {
    borderWidth: 1,
    borderColor: '#e6d3b3',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0ece0',
    backgroundColor: '#faf0e8',
  },
  serviciosContainer: { flex: 1 },
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderColor: '#c8a27a',
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardBody: { padding: 14, gap: 12 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: { flex: 1, gap: 2 },
  infoLabel: { fontSize: 11, color: '#7b6758', textTransform: 'uppercase', fontWeight: '600' },
  infoValue: { fontSize: 14, color: '#3e2f25', fontWeight: '500' },
  totalValue: { color: '#a56363', fontWeight: '700', fontSize: 15 },
  reprogramBox: { marginTop: 16, padding: 12, backgroundColor: '#fbf6f0', borderRadius: 10, gap: 10 },
  formLabel: { fontSize: 12, color: '#7b6758', fontWeight: '600', textTransform: 'uppercase' },
  input: { marginTop: 6, padding: 12, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e6d3b3', color: '#3e2f25' },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 16 },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c8a27a',
    backgroundColor: '#fff',
  },
  secondaryButtonText: { color: '#a57c63', fontWeight: '700' },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#c8a27a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flex: 1,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
});
