import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '../../components/themed-text';
import { useAuth } from '../../src/context/AuthContext';
import profesionalService from '../../src/services/profesionalService';

const push = (path: string) => (router as unknown as { push: (p: string) => void }).push(path);

type AuthCtx = {
  user: { nombre?: string; email?: string; rol?: string } | null;
  isAuthenticated: boolean;
  refreshSession: () => Promise<void>;
};

type Especialidad = {
  id: number;
  nombre?: string;
  descripcion?: string | null;
};

type PerfilProfesional = {
  id?: number;
  nombre?: string;
  email?: string;
  telefono?: string | null;
  direccion?: string | null;
  documento?: string | null;
  tipo_documento?: string | null;
  rol?: string;
  especialidades?: Especialidad[];
};

type CitaServicio = {
  nombre?: string;
  profesionalId?: number;
  CitaServicio?: { profesionalId?: number; precio?: number; duracion?: number };
};

type Cita = {
  id: number;
  fecha?: string;
  hora?: string;
  estado?: string;
  total?: number;
  cliente?: { nombre?: string; email?: string };
  Servicios?: CitaServicio[];
};

const estadoLabel = (estado?: string) => {
  if (estado === 'confirmada') return 'Confirmada';
  if (estado === 'completada') return 'Completada';
  if (estado === 'cancelada') return 'Cancelada';
  return 'Pendiente';
};

const estadoColor = (estado?: string) => {
  if (estado === 'confirmada') return '#0dcaf0';
  if (estado === 'completada') return '#5cb85c';
  if (estado === 'cancelada') return '#c9302c';
  return '#c9302c';
};

const formatCurrency = (value?: number) => `$${Number(value || 0).toLocaleString('es-CO')}`;

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(date);
};

export default function ProfesionalDashboardScreen() {
  const { user, isAuthenticated, refreshSession } = useAuth() as AuthCtx;

  const [perfil, setPerfil] = useState<PerfilProfesional | null>(null);
  const [misEspecialidades, setMisEspecialidades] = useState<Especialidad[]>([]);
  const [especialidadesDisponibles, setEspecialidadesDisponibles] = useState<Especialidad[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    documento: '',
    tipo_documento: '',
  });
  const [busyEspecialidadId, setBusyEspecialidadId] = useState<number | null>(null);
  const [busyCitaId, setBusyCitaId] = useState<number | null>(null);

  const loadDashboard = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setRefreshing(silent);
    setErrorMessage('');

    try {
      const [perfilData, especialidadesData, citasData, disponiblesData] = await Promise.all([
        profesionalService.getMiPerfil(),
        profesionalService.getMisEspecialidades(),
        profesionalService.getCitas(),
        profesionalService.getEspecialidadesDisponibles(),
      ]);

      setPerfil(perfilData);
      setMisEspecialidades(Array.isArray(especialidadesData) ? especialidadesData : []);
      setCitas(Array.isArray(citasData) ? citasData : []);
      setEspecialidadesDisponibles(Array.isArray(disponiblesData) ? disponiblesData : []);
    } catch (error: unknown) {
      setErrorMessage((error as { message?: string })?.message || 'No fue posible cargar el panel profesional');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.rol === 'profesional') {
      loadDashboard();
    }
  }, [isAuthenticated, user?.rol]);

  const stats = useMemo(() => {
    const pendientes = citas.filter((cita) => cita.estado === 'pendiente').length;
    const confirmadas = citas.filter((cita) => cita.estado === 'confirmada').length;
    const completadas = citas.filter((cita) => cita.estado === 'completada').length;

    return {
      citas: citas.length,
      pendientes,
      confirmadas,
      completadas,
      especialidades: misEspecialidades.length,
    };
  }, [citas, misEspecialidades]);

  const profileDescription = perfil?.rol === 'profesional'
    ? 'Gestiona tu perfil, especialidades y citas desde un solo lugar.'
    : 'Panel exclusivo para profesionales activos.';

  const openProfileEditor = () => {
    setProfileForm({
      nombre: perfil?.nombre || '',
      email: perfil?.email || '',
      telefono: perfil?.telefono || '',
      direccion: perfil?.direccion || '',
      documento: perfil?.documento || '',
      tipo_documento: perfil?.tipo_documento || '',
    });
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    setErrorMessage('');
    setSavingProfile(true);

    try {
      const payload: Record<string, string> = {};

      if (profileForm.nombre.trim()) payload.nombre = profileForm.nombre.trim();
      if (profileForm.email.trim()) payload.email = profileForm.email.trim();
      if (profileForm.telefono.trim()) payload.telefono = profileForm.telefono.trim();
      if (profileForm.direccion.trim()) payload.direccion = profileForm.direccion.trim();
      if (profileForm.documento.trim()) payload.documento = profileForm.documento.trim();
      if (profileForm.tipo_documento.trim()) payload.tipo_documento = profileForm.tipo_documento.trim();

      if (Object.keys(payload).length === 0) {
        Alert.alert('Perfil profesional', 'Modifica al menos un campo.');
        return;
      }

      const updated = await profesionalService.updateMiPerfil(payload);
      if (updated) {
        setPerfil(updated);
        await refreshSession();
        setEditingProfile(false);
        Alert.alert('Perfil profesional', 'Perfil actualizado correctamente.');
      }
    } catch (error: unknown) {
      Alert.alert('Error', (error as { message?: string })?.message || 'No se pudo actualizar el perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddSpecialidad = async (especialidadId: number) => {
    setBusyEspecialidadId(especialidadId);
    try {
      await profesionalService.agregarEspecialidad(especialidadId);
      const siguiente = especialidadesDisponibles.find((item) => item.id === especialidadId);
      if (siguiente) {
        setMisEspecialidades((actual) => [...actual, siguiente]);
      }
    } catch (error: unknown) {
      Alert.alert('Especialidades', (error as { message?: string })?.message || 'No se pudo agregar la especialidad');
    } finally {
      setBusyEspecialidadId(null);
    }
  };

  const handleRemoveSpecialidad = async (especialidadId: number) => {
    setBusyEspecialidadId(especialidadId);
    try {
      await profesionalService.removerEspecialidad(especialidadId);
      setMisEspecialidades((actual) => actual.filter((item) => item.id !== especialidadId));
    } catch (error: unknown) {
      Alert.alert('Especialidades', (error as { message?: string })?.message || 'No se pudo remover la especialidad');
    } finally {
      setBusyEspecialidadId(null);
    }
  };

  const handleActualizarEstado = async (id: number, estado: string) => {
    setBusyCitaId(id);
    try {
      const citaActualizada = await profesionalService.updateCitaEstado(id, estado);
      if (citaActualizada) {
        setCitas((actual) => actual.map((cita) => (cita.id === id ? { ...cita, estado: citaActualizada.estado } : cita)));
      }
    } catch (error: unknown) {
      Alert.alert('Citas', (error as { message?: string })?.message || 'No se pudo actualizar el estado');
    } finally {
      setBusyCitaId(null);
    }
  };

  if (!isAuthenticated || user?.rol !== 'profesional') {
    return (
      <View style={styles.restricted}>
        <Ionicons name="lock-closed-outline" size={56} color="#a57c63" />
        <ThemedText type="title">Acceso restringido</ThemedText>
        <ThemedText style={styles.restrictedText}>Esta sección solo está disponible para usuarios con rol profesional.</ThemedText>
        <Pressable style={styles.backButton} onPress={() => push('/')}>
          <Text style={styles.backButtonText}>Volver a la tienda</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard({ silent: true })} />}
    >
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.heroLabel}>Panel profesional</ThemedText>
            <ThemedText type="title">Hola, {perfil?.nombre || user?.nombre || 'profesional'}</ThemedText>
            <ThemedText style={styles.heroSubtitle}>{profileDescription}</ThemedText>
          </View>
          <View style={styles.heroIconWrap}>
            <Ionicons name="briefcase-outline" size={30} color="#ffffff" />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.citas}</Text>
            <Text style={styles.statLabel}>Citas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.pendientes}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.especialidades}</Text>
            <Text style={styles.statLabel}>Especialidades</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#a57c63" />
          <ThemedText>Cargando panel...</ThemedText>
        </View>
      ) : null}

      {errorMessage ? (
        <View style={styles.alertBox}>
          <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
          <Text style={styles.alertText}>{errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={18} color="#a57c63" />
          <Text style={styles.sectionTitle}>Mi perfil</Text>
        </View>

        {editingProfile ? (
          <View style={styles.card}>
            <TextInput placeholder="Nombre" value={profileForm.nombre} onChangeText={(text) => setProfileForm((current) => ({ ...current, nombre: text }))} style={styles.input} />
            <TextInput placeholder="Correo" value={profileForm.email} onChangeText={(text) => setProfileForm((current) => ({ ...current, email: text }))} style={styles.input} autoCapitalize="none" keyboardType="email-address" />
            <TextInput placeholder="Teléfono" value={profileForm.telefono} onChangeText={(text) => setProfileForm((current) => ({ ...current, telefono: text }))} style={styles.input} keyboardType="phone-pad" />
            <TextInput placeholder="Documento" value={profileForm.documento} onChangeText={(text) => setProfileForm((current) => ({ ...current, documento: text }))} style={styles.input} />
            <TextInput placeholder="Tipo de documento" value={profileForm.tipo_documento} onChangeText={(text) => setProfileForm((current) => ({ ...current, tipo_documento: text }))} style={styles.input} />
            <TextInput placeholder="Dirección" value={profileForm.direccion} onChangeText={(text) => setProfileForm((current) => ({ ...current, direccion: text }))} style={styles.input} />

            <View style={styles.rowActions}>
              <Pressable style={[styles.actionBtn, styles.primaryAction]} onPress={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryActionText}>Guardar</Text>}
              </Pressable>
              <Pressable style={[styles.actionBtn, styles.secondaryAction]} onPress={() => setEditingProfile(false)}>
                <Text style={styles.secondaryActionText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.detailText}>Nombre: {perfil?.nombre || '-'}</Text>
            <Text style={styles.detailText}>Correo: {perfil?.email || '-'}</Text>
            <Text style={styles.detailText}>Teléfono: {perfil?.telefono || '-'}</Text>
            <Text style={styles.detailText}>Documento: {perfil?.tipo_documento || '-'} {perfil?.documento || '-'}</Text>
            <Text style={styles.detailText}>Dirección: {perfil?.direccion || '-'}</Text>

            <Pressable style={[styles.actionBtn, styles.inlinePrimary]} onPress={openProfileEditor}>
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={styles.primaryActionText}>Editar perfil</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="sparkles-outline" size={18} color="#a57c63" />
          <Text style={styles.sectionTitle}>Mis especialidades</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.chipsRow}>
            {misEspecialidades.length > 0 ? misEspecialidades.map((especialidad) => (
              <Pressable key={especialidad.id} style={styles.chip} onPress={() => handleRemoveSpecialidad(especialidad.id)} disabled={busyEspecialidadId === especialidad.id}>
                <Text style={styles.chipText}>{especialidad.nombre}</Text>
                <Ionicons name="close" size={14} color="#a57c63" />
              </Pressable>
            )) : <Text style={styles.detailText}>Todavía no tienes especialidades asignadas.</Text>}
          </View>

          <Text style={styles.subsectionTitle}>Agregar especialidades</Text>
          <View style={styles.availableGrid}>
            {especialidadesDisponibles
              .filter((especialidad) => !misEspecialidades.some((actual) => actual.id === especialidad.id))
              .map((especialidad) => (
                <Pressable
                  key={especialidad.id}
                  style={styles.availableChip}
                  onPress={() => handleAddSpecialidad(especialidad.id)}
                  disabled={busyEspecialidadId === especialidad.id}
                >
                  <Text style={styles.availableChipText}>{especialidad.nombre}</Text>
                  <Ionicons name="add" size={14} color="#a57c63" />
                </Pressable>
              ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar-outline" size={18} color="#a57c63" />
          <Text style={styles.sectionTitle}>Mis citas</Text>
        </View>

        {citas.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.detailText}>No tienes citas asignadas.</Text>
          </View>
        ) : citas.map((cita) => (
          <View key={cita.id} style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Cita #{cita.id}</Text>
                <Text style={styles.detailText}>Cliente: {cita.cliente?.nombre || '-'}</Text>
                <Text style={styles.detailText}>Fecha: {formatDate(cita.fecha)} · {cita.hora || '-'}</Text>
              </View>
              <View style={[styles.stateBadge, { backgroundColor: estadoColor(cita.estado) }]}>
                <Text style={styles.stateBadgeText}>{estadoLabel(cita.estado)}</Text>
              </View>
            </View>

            <Text style={styles.detailText}>Total: {formatCurrency(cita.total)}</Text>
            <Text style={styles.detailText}>Servicios: {cita.Servicios?.map((servicio) => servicio.nombre).filter(Boolean).join(', ') || 'Sin detalle'}</Text>

            <View style={styles.statusActions}>
              {cita.estado === 'pendiente' && (
                <>
                  <Pressable
                    key="confirmada"
                    style={[
                      styles.statusBtn,
                      styles.statusBtnIdle,
                      busyCitaId === cita.id && styles.statusBtnDisabled,
                    ]}
                    onPress={() => handleActualizarEstado(cita.id, 'confirmada')}
                    disabled={busyCitaId === cita.id}
                  >
                    <Text style={styles.statusBtnIdleText}>Confirmada</Text>
                  </Pressable>
                  <Pressable
                    key="completada"
                    style={[
                      styles.statusBtn,
                      styles.statusBtnIdle,
                      busyCitaId === cita.id && styles.statusBtnDisabled,
                    ]}
                    onPress={() => handleActualizarEstado(cita.id, 'completada')}
                    disabled={busyCitaId === cita.id}
                  >
                    <Text style={styles.statusBtnIdleText}>Completada</Text>
                  </Pressable>
                  <Pressable
                    key="cancelada"
                    style={[
                      styles.statusBtn,
                      styles.statusBtnIdle,
                      busyCitaId === cita.id && styles.statusBtnDisabled,
                    ]}
                    onPress={() => handleActualizarEstado(cita.id, 'cancelada')}
                    disabled={busyCitaId === cita.id}
                  >
                    <Text style={styles.statusBtnIdleText}>Cancelada</Text>
                  </Pressable>
                </>
              )}
              {cita.estado === 'confirmada' && (
                <Pressable
                  key="completar"
                  style={[
                    styles.statusBtn,
                    styles.statusBtnIdle,
                    busyCitaId === cita.id && styles.statusBtnDisabled,
                  ]}
                  onPress={() => handleActualizarEstado(cita.id, 'completada')}
                  disabled={busyCitaId === cita.id}
                >
                  <Text style={styles.statusBtnIdleText}>Completar</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f6f2' },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  restricted: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, backgroundColor: '#f9f6f2' },
  restrictedText: { textAlign: 'center', color: '#423b35' },
  backButton: { backgroundColor: '#c8a27a', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  backButtonText: { color: '#fff', fontWeight: '700' },
  hero: { backgroundColor: '#d3b89b', borderColor: '#a57745', borderRadius: 24, padding: 18, gap: 16 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  heroLabel: { color: '#f9f6f2', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12, fontWeight: '700' },
  heroSubtitle: { color: '#f9f6f2', marginTop: 6 },
  heroIconWrap: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
  statsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  statCard: { minWidth: 100, flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center', borderWidth: 1, borderColor: '#d6b06f', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  statValue: { color: '#d1baa2', fontSize: 22, fontWeight: '800' },
  statLabel: { color: '#7b6758', fontSize: 12, marginTop: 2 },
  loadingBox: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 20 },
  alertBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderRadius: 14, padding: 12 },
  alertText: { color: '#b91c1c', flex: 1 },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#3e2f25' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 10, borderWidth: 1, borderColor: '#e6d3b3' },
  input: { borderWidth: 1, borderColor: '#b1a083', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  rowActions: { flexDirection: 'row', gap: 10, marginTop: 2 },
  actionBtn: { minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 14 },
  primaryAction: { backgroundColor: '#c09261' },
  inlinePrimary: { backgroundColor: '#c8a27a', alignSelf: 'flex-start', marginTop: 4 },
  primaryActionText: { color: '#fff', fontWeight: '700' },
  secondaryAction: { backgroundColor: '#e6d3b3' },
  secondaryActionText: { color: '#3e2f25', fontWeight: '700' },
  detailText: { color: '#7b6758' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f3e6d8', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { color: '#3e2f25', fontWeight: '700' },
  subsectionTitle: { marginTop: 4, color: '#3e2f25', fontWeight: '800' },
  availableGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  availableChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#c8a27a', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  availableChipText: { color: '#3e2f25', fontWeight: '700' },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTitle: { color: '#3e2f25', fontSize: 16, fontWeight: '800', marginBottom: 2 },
  stateBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  stateBadgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  statusActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  statusBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, minWidth: 92, alignItems: 'center' },
  statusBtnIdle: { backgroundColor: '#e6d3b3' },
  statusBtnIdleText: { color: '#5f4638', fontWeight: '700', fontSize: 12 },
  statusBtnActive: { backgroundColor: '#ccb2b2' },
  statusBtnActiveText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  statusBtnDisabled: { opacity: 0.6 },
});