// Página: agendar.tsx. vista de agendar del sistema.
/**
 * Pantalla del carrito de compras y sus respectivas gestiones no requiere que este autenticado solo para hacer compras
 */

import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Image } from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';

import { router, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import { useAgendar } from "../../src/context/AgendarContext";
import catalogoService from '../../src/services/catalogoService';
import { ThemedText } from '../../components/themed-text';
import { formatTimeWithPeriod } from '../../src/utils/time';

// HELPERS de navegacion
const routerPush = (path: string) => (router as unknown as { push: (p: string) => void }).push(path);
const routerReplace = (path: string) => (router as unknown as { replace: (p: string) => void }).replace(path);
const fmt = (n: number) => `$${Number(n).toLocaleString('es-CO')}`;

export default function AgendarScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth() as { isAuthenticated: boolean };
  const { servicioSeleccionado, setServicioSeleccionado, crearCita } = useAgendar() as any;

  const [servicios, setServicios] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [horaError, setHoraError] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandirServicios, setExpandirServicios] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // VALIDACIONES EXTRAS (extraídas para reducir complejidad)
  // ─────────────────────────────────────────────────────────────

  const validateHora = (horaValue: string) => {
    if (!horaValue) {
      return { valid: true, error: '' };
    }

    const [hourPart, minutePart] = horaValue.split(':');
    const hour = Number(hourPart);
    const minute = Number(minutePart);

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return { valid: false, error: 'Formato inválido. Usa HH:MM' };
    }

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return { valid: false, error: 'Hora fuera de rango' };
    }

    if (hour < 8 || hour > 20) {
      return { valid: false, error: 'Horario disponible de 8:00 a. m. a 8:00 p. m.' };
    }

    return { valid: true, error: '' };
  };

  // ─────────────────────────────────────────────────────────────
  // VALIDACIÓN DE FORMULARIO (extraída para reducir complejidad)
  // ─────────────────────────────────────────────────────────────

  const validateForm = () => {
    const errors: string[] = [];

    // Validar autenticación
    if (!isAuthenticated) {
      errors.push('Debes iniciar sesión para agendar una cita');
      router.replace('/explore');
      return { isValid: false, errors };
    }

    // Validar servicios seleccionados
    if (selectedIds.length === 0) {
      errors.push('Selecciona al menos un servicio');
      return { isValid: false, errors };
    }

    // Validar fecha y hora
    if (!fecha || !hora) {
      errors.push('Indica fecha y hora para la cita');
      return { isValid: false, errors };
    }

    // Validar formato de fecha
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      errors.push('Usa el formato YYYY-MM-DD (ej: 2026-06-30)');
      return { isValid: false, errors };
    }

    // Validar que la fecha no sea pasada
    const fechaSeleccionada = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaSeleccionada < hoy) {
      errors.push('No se puede agendar en una fecha pasada');
      return { isValid: false, errors };
    }

    // Validar hora
    const horaValidation = validateHora(hora);
    if (!horaValidation.valid) {
      errors.push(horaValidation.error || 'Verifica la hora ingresada');
      return { isValid: false, errors };
    }

    return { isValid: true, errors: [] };
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLE SUBMIT REFACTORIZADO (complejidad reducida)
  // ─────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    // Validar formulario
    const validation = validateForm();
    if (!validation.isValid) {
      if (validation.errors.length > 0) {
        Alert.alert('Error en el formulario', validation.errors[0]);
      }
      return;
    }

    // Formatear hora
    const [hh, mm] = hora.split(':');
    const horaFormateada = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`;

    const payload = {
      fecha,
      hora: horaFormateada,
      servicios: selectedIds
    };

    // Enviar cita
    setSubmitting(true);
    try {
      await crearCita(payload);
      
      // Éxito - limpiar y navegar
      Alert.alert('✅', 'Tu cita fue agendada correctamente');
      limpiarFormulario();
      router.replace('/');
      
    } catch (err: unknown) {
      manejarErrorCita(err);
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // FUNCIONES AUXILIARES (extraídas para reducir complejidad)
  // ─────────────────────────────────────────────────────────────

  const limpiarFormulario = () => {
    setServicioSeleccionado(null);
    setSelectedIds([]);
    setFecha('');
    setHora('');
  };

  const manejarErrorCita = (err: unknown) => {
    let errorMsg = 'No se pudo agendar la cita';
    if (err && typeof err === 'object') {
      const anyErr = err as any;
      errorMsg = anyErr.response?.data?.message || anyErr.message || errorMsg;
    }
    Alert.alert('Error', errorMsg);
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLERS DE PICKERS
  // ─────────────────────────────────────────────────────────────

  const handleTimePickerChange = (_event: any, selected?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowTimePicker(false);
    }
    if (!selected) return;

    const hour = selected.getHours();
    const minute = selected.getMinutes();
    
    if (hour < 8 || hour > 20) {
      setHoraError('Horario disponible de 8:00 a. m. a 8:00 p. m.');
      return;
    }

    const formatted = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    setHora(formatted);
    setHoraError('');
  };

  const handleHoraChange = (value: string) => {
    setHora(value);
    const validation = validateHora(value);
    setHoraError(validation.error);
  };

  const formatDateValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setFecha(formatDateValue(currentDate));
    }
  };

  const handleFechaPress = () => {
    if (Platform.OS !== 'web') {
      setShowDatePicker(true);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // EFECTOS
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;
    const loadServicios = async () => {
      try {
        const data = await catalogoService.getServicios({ pagina: 1, limite: 200 });
        if (mounted) {
          setServicios(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.log('Error cargando servicios', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadServicios();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (servicioSeleccionado?.id && selectedIds.length === 0) {
      setSelectedIds([String(servicioSeleccionado.id)]);
    }
  }, [servicioSeleccionado?.id]);

  // ─────────────────────────────────────────────────────────────
  // FUNCIONES DE UI
  // ─────────────────────────────────────────────────────────────

  const toggleServicio = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCancelar = () => {
    setServicioSeleccionado(null);
    setSelectedIds([]);
    setFecha('');
    setHora('');
    router.back();
  };

  const renderServicio = ({ item }: { item: any }) => {
    const selected = selectedIds.includes(String(item.id));
    const isPreseleccionado = servicioSeleccionado?.id === item.id;
    
    return (
      <Pressable 
        onPress={() => toggleServicio(String(item.id))}
        style={[styles.servicioItem, selected && styles.servicioItemSelected]}
      >
        <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
          {selected && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
        <View style={styles.servicioInfo}>
          <ThemedText style={styles.servicioNombre}>{item.nombre}</ThemedText>
          <ThemedText style={styles.servicioDesc} numberOfLines={2}>
            {item.descripcion?.substring(0, 60) || 'Sin descripción'}
          </ThemedText>
        </View>
        <View style={styles.servicioRightContent}>
          <ThemedText style={styles.servicioPrecio}>
            ${Number(item.precio || 0).toLocaleString('es-CO')}
          </ThemedText>
          {isPreseleccionado && (
            <View style={styles.badgePreseleccionado}>
              <Ionicons name="checkmark-done" size={12} color="#a57c63" />
              <ThemedText style={styles.badgePreseleccionadoText}>Principal</ThemedText>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  if (!servicioSeleccionado?.id) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-clear-outline" size={64} color="#d1d5db" />
          <ThemedText style={styles.emptyText}>
            Selecciona un servicio para agendar una cita
          </ThemedText>
          <Pressable style={styles.catalogBtn} onPress={() => router.push('/screens/servicios')}>
            <Ionicons name="storefront-outline" size={16} color="#fff" />
            <Text style={styles.catalogBtnText}>Ir a los servicios</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ENCABEZADO */}
      <View style={styles.pageHeader}>
        <View style={styles.headerContent}>
          <Ionicons name="calendar-clear-outline" size={32} color="#a57c63" />
          <ThemedText style={styles.pageTitle}>Agendar Cita</ThemedText>
        </View>
      </View>

      {/* TARJETA DEL SERVICIO SELECCIONADO */}
      <View style={styles.servicioCard}>
        {servicioSeleccionado.imagen && (
          <Image
            source={{ uri: catalogoService.buildImageUrl(servicioSeleccionado.imagen) }}
            style={styles.servicioImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.servicioBody}>
          <ThemedText style={styles.servicioBadge} numberOfLines={1}>
            {servicioSeleccionado.Categoria?.nombre || servicioSeleccionado.categoria?.nombre || 'Categoría'}
          </ThemedText>
          <ThemedText style={styles.servicioNombre}>{servicioSeleccionado.nombre}</ThemedText>
          <ThemedText style={styles.servicioDesc} numberOfLines={3}>
            {servicioSeleccionado.descripcion || 'Sin descripción disponible'}
          </ThemedText>
          
          <View style={styles.servicioDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="pricetag-outline" size={16} color="#a57c63" />
              <ThemedText style={styles.detailText}>
                ${Number(servicioSeleccionado.precio || 0).toLocaleString('es-CO')}
              </ThemedText>
            </View>
            {servicioSeleccionado.duracion && (
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={16} color="#a57c63" />
                <ThemedText style={styles.detailText}>
                  {servicioSeleccionado.duracion} min
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* SECCIÓN AGREGAR MÁS SERVICIOS */}
      {!loading && servicios.length > 1 && (
        <Pressable 
          style={styles.expandBtn}
          onPress={() => setExpandirServicios(!expandirServicios)}
        >
          <Ionicons 
            name={expandirServicios ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#a57c63" 
          />
          <ThemedText style={styles.expandBtnText}>
            {expandirServicios ? 'Ocultar' : 'Agregar'} más servicios ({servicios.length})
          </ThemedText>
          <ThemedText style={styles.selectedCount}>
            {selectedIds.length}
          </ThemedText>
        </Pressable>
      )}

      {/* LISTA DE SERVICIOS EXPANDIBLE */}
      {expandirServicios && !loading && (
        <View style={styles.serviciosListContainer}>
          <ThemedText style={styles.serviciosListTitle}>
            Selecciona {selectedIds.length > 0 ? 'más ' : ''}servicios
          </ThemedText>
          <View style={styles.serviciosList}>
            {servicios
              .filter(s => s.id !== servicioSeleccionado.id)
              .map((servicio) => (
                <View key={servicio.id}>
                  {renderServicio({ item: servicio })}
                </View>
              ))}
          </View>
        </View>
      )}

      {/* FORMULARIO */}
      <View style={styles.formContainer}>
        <ThemedText style={styles.formTitle}>Datos de la Cita</ThemedText>

        {/* SECCIÓN FECHA */}
        <View style={styles.formSection}>
          <ThemedText style={styles.formLabel}>
            <Ionicons name="calendar" size={14} color="#a57c63" /> Fecha (YYYY-MM-DD)
          </ThemedText>
          {Platform.OS === 'web' ? (
            <TextInput
              value={fecha}
              onChangeText={setFecha}
              placeholder="2026-06-30"
              style={styles.input}
              placeholderTextColor="#9ca3af"
            />
          ) : (
            <Pressable onPress={handleFechaPress} style={styles.datePickerButton}>
              <ThemedText style={[styles.inputText, !fecha && styles.placeholderText]}>
                {fecha || 'Seleccionar fecha'}
              </ThemedText>
            </Pressable>
          )}
          {Platform.OS !== 'web' && showDatePicker && (
            <DateTimePicker
              value={fecha ? new Date(fecha) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          )}
        </View>

        {/* SECCIÓN HORA */}
        <View style={styles.formSection}>
          <ThemedText style={styles.formLabel}>
            <Ionicons name="time" size={14} color="#a57c63" /> Hora (HH:MM)
          </ThemedText>

          <ThemedText style={styles.formSubLabel}>Horario disponible: 8:00 a.m. - 8:00 p.m.</ThemedText>

          {Platform.OS === 'web' ? (
            <View style={[styles.input, styles.timeInputWeb, horaError && styles.inputError]}>
              <Text style={{ marginRight: 8 }}>🕒</Text>
              <TextInput
                value={hora}
                onChangeText={handleHoraChange}
                placeholder={'08:30'}
                style={{ flex: 1, padding: 0 }}
                placeholderTextColor="#9ca3af"
              />
            </View>
          ) : (
            <Pressable
              onPress={() => setShowTimePicker(true)}
              style={[styles.datePickerButton, horaError && styles.inputError, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}
            >
              <Text style={{ fontSize: 18 }}>🕒</Text>
              <ThemedText style={[styles.inputText, !hora && styles.placeholderText]}>
                {hora ? formatTimeWithPeriod(hora) : 'Seleccionar hora (08:00 - 20:00)'}
              </ThemedText>
            </Pressable>
          )}
          {Platform.OS !== 'web' && showTimePicker && (
            <DateTimePicker
              value={hora ? new Date(`${fecha || new Date().toISOString().slice(0,10)}T${hora}:00`) : new Date()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              is24Hour={false}
              onChange={handleTimePickerChange}
            />
          )}
          {hora && !horaError && (
            <ThemedText style={styles.horaLabel}>
              {formatTimeWithPeriod(hora)}
            </ThemedText>
          )}
          {horaError && (
            <ThemedText style={styles.errorText}>{horaError}</ThemedText>
          )}
        </View>

        {/* BOTONES */}
        <Pressable 
          style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="calendar-clear-outline" size={18} color="#fff" />
              <ThemedText style={styles.primaryBtnText}>Agendar Cita</ThemedText>
            </>
          )}
        </Pressable>

        <Pressable style={styles.secondaryBtn} onPress={handleCancelar}>
          <Ionicons name="arrow-back-outline" size={16} color="#a57c63" />
          <ThemedText style={styles.secondaryBtnText}>Cancelar</ThemedText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f6f2',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#a57c63',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#666',
    fontSize: 15,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  formSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  serviciosGrid: {
    gap: 10,
  },
  servicioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  servicioItemSelected: {
    backgroundColor: 'rgba(165, 124, 99, 0.08)',
    borderColor: '#a57c63',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#a57c63',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#a57c63',
    borderColor: '#a57c63',
  },
  servicioInfo: {
    flex: 1,
    gap: 4,
  },
  servicioNombre: {
    fontWeight: '700',
    fontSize: 13,
    color: '#222',
  },
  servicioDesc: {
    fontSize: 12,
    color: '#777',
    lineHeight: 16,
  },
  servicioPrecio: {
    fontWeight: '700',
    fontSize: 13,
    color: '#a57c63',
  },
  selectionCount: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  formLabel: {
    fontWeight: '700',
    fontSize: 14,
    color: '#222',
  },
  formSubLabel: {
    fontSize: 12,
    color: '#7b6758',
    marginTop: 8,
    marginBottom: 8,
    fontWeight: '600',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#d4c5ba',
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  periodButtonActive: {
    backgroundColor: '#a57c63',
    borderColor: '#a57c63',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7b6758',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  periodInfo: {
    fontSize: 11,
    color: '#999',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e4d8cb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111',
    backgroundColor: '#fafafa',
  },
  timeInputWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  inputText: {
    color: '#111',
    fontSize: 14,
  },
  placeholderText: {
    color: '#9ca3af',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#e4d8cb',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  horaLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#6b8e6f',
    fontWeight: '600',
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#a57c63',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#a57c63',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  secondaryBtnText: {
    color: '#a57c63',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  servicioCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  servicioImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  servicioBody: {
    padding: 16,
    gap: 12,
  },
  servicioBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a57c63',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  servicioDetails: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: 'rgba(165, 124, 99, 0.08)',
    borderWidth: 1.5,
    borderColor: '#a57c63',
    borderRadius: 10,
    padding: 14,
    marginVertical: 12,
  },
  expandBtnText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#a57c63',
  },
  selectedCount: {
    backgroundColor: '#a57c63',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    textAlign: 'center',
  },
  serviciosListContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  serviciosListTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  serviciosList: {
    gap: 10,
  },
  servicioRightContent: {
    alignItems: 'flex-end',
    gap: 6,
  },
  badgePreseleccionado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(165, 124, 99, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgePreseleccionadoText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#a57c63',
  },
  catalogBtn: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    borderRadius: 10, 
    backgroundColor: '#a57c63',
    paddingHorizontal: 22, 
    paddingVertical: 13, 
    marginTop: 4,
  },
  catalogBtnText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 15 
  },
});