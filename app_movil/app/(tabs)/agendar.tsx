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

import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Image } from "react-native";

import { router, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import { useAgendar } from "../../src/context/AgendarContext";
import catalogoService from '../../src/services/catalogoService';
import { ThemedText } from '../../components/themed-text';
import { formatTimeWithPeriod, getTimePeriodLabel } from '../../src/utils/time';


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
  const { servicioSeleccionado, setServicioSeleccionado, crearCita } = useAgendar() as any;

  const [servicios, setServicios] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [horaError, setHoraError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'mañana' | 'tarde' | 'noche'>('mañana');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandirServicios, setExpandirServicios] = useState(false);

  const getPeriodRange = (period: 'mañana' | 'tarde' | 'noche') => {
    switch (period) {
      case 'mañana': return { min: 6, max: 11, label: '6:00 - 11:59' };
      case 'tarde': return { min: 12, max: 17, label: '12:00 - 17:59' };
      case 'noche': return { min: 18, max: 21, label: '18:00 - 21:59' };
      default: return { min: 6, max: 11, label: '6:00 - 11:59' };
    }
  };

  const validateHora = (horaValue: string, period: 'mañana' | 'tarde' | 'noche' = selectedPeriod) => {
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

    const range = getPeriodRange(period);
    if (hour < range.min || hour > range.max) {
      return { valid: false, error: `Las horas de ${period} son ${range.label}` };
    }

    return { valid: true, error: '' };
  };

  const handleHoraChange = (value: string) => {
    setHora(value);
    const validation = validateHora(value, selectedPeriod);
    setHoraError(validation.error);
  };

  const handlePeriodChange = (period: 'mañana' | 'tarde' | 'noche') => {
    setSelectedPeriod(period);
    setHora('');
    setHoraError('');
  };

  // Cargar servicios disponibles
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

  // Cuando se selecciona un servicio, agregarlo a selectedIds
  useEffect(() => {
    if (servicioSeleccionado?.id && selectedIds.length === 0) {
      setSelectedIds([String(servicioSeleccionado.id)]);
    }
  }, [servicioSeleccionado?.id]);

  const toggleServicio = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para agendar una cita');
      router.replace('/explore');
      return;
    }

    if (selectedIds.length === 0) {
      Alert.alert('Sin servicios', 'Selecciona al menos un servicio');
      return;
    }

    if (!fecha || !hora) {
      Alert.alert('Falta información', 'Indica fecha y hora para la cita');
      return;
    }

    // Validar que la fecha sea válida y esté en el futuro
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      Alert.alert('Fecha inválida', 'Usa el formato YYYY-MM-DD (ej: 2026-06-30)');
      return;
    }

    const fechaSeleccionada = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaSeleccionada < hoy) {
      Alert.alert('Fecha inválida', 'No se puede agendar en una fecha pasada');
      return;
    }

    const horaValidation = validateHora(hora, selectedPeriod);
    if (!horaValidation.valid) {
      Alert.alert('Hora inválida', horaValidation.error || 'Verifica la hora ingresada');
      return;
    }

    // Formatear hora con padding: "8:30" -> "08:30:00"
    const [hh, mm] = hora.split(':');
    const horaFormateada = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`;

    const payload: any = { 
      fecha, 
      hora: horaFormateada,
      servicios: selectedIds 
    };

    console.log('=== PAYLOAD ENVIADO ===');
    console.log('Fecha:', fecha);
    console.log('Hora formateada:', horaFormateada);
    console.log('Servicios:', selectedIds);
    console.log('Payload completo:', payload);
    console.log('=======================');

    setSubmitting(true);
    try {
      await crearCita(payload);
      Alert.alert('Tu cita fue agendada correctamente');
      // limpiar formulario y contexto
      setServicioSeleccionado(null);
      setSelectedIds([]);
      setFecha('');
      setHora('');
      setSelectedPeriod('mañana');
      router.replace('/');
    } catch (err: unknown) {
      console.log('=== ERROR AL AGENDAR ===');
      console.log('Error completo:', err);
      console.log('Error type:', typeof err);
      if (err && typeof err === 'object') {
        console.log('Error keys:', Object.keys(err));
        console.log('Error.message:', (err as any).message);
        console.log('Error.response:', (err as any).response);
        console.log('Error.response.data:', (err as any).response?.data);
      }
      console.log('========================');
      
      let errorMsg = 'No se pudo agendar la cita';
      if (err && typeof err === 'object') {
        const anyErr = err as any;
        errorMsg = anyErr.response?.data?.message || anyErr.message || errorMsg;
      }
      Alert.alert('Error', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelar = () => {
    setServicioSeleccionado(null);
    setSelectedIds([]);
    setFecha('');
    setHora('');
    setSelectedPeriod('mañana');
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

  if (!servicioSeleccionado?.id) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-clear-outline" size={64} color="#d1d5db" />
          <ThemedText style={styles.emptyText}>
            Selecciona un servicio para agendar una cita
          </ThemedText>
          {/* Botón para ir al servicios (reemplaza la pantalla actual) */}
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
          <TextInput
            value={fecha}
            onChangeText={setFecha}
            placeholder="2026-06-30"
            style={styles.input}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* SECCIÓN HORA */}
        <View style={styles.formSection}>
          <ThemedText style={styles.formLabel}>
            <Ionicons name="time" size={14} color="#a57c63" /> Hora (HH:MM)
          </ThemedText>

          {/* Selector de Período */}
          <ThemedText style={styles.formSubLabel}>¿A qué hora prefiere?</ThemedText>
          <View style={styles.periodSelector}>
            {(['mañana', 'tarde', 'noche'] as const).map((period) => (
              <Pressable
                key={period}
                onPress={() => handlePeriodChange(period)}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive,
                ]}
              >
                <ThemedText
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.periodButtonTextActive,
                  ]}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          {/* Rango de horas */}
          <ThemedText style={styles.periodInfo}>
            Horario disponible: {getPeriodRange(selectedPeriod).label}
          </ThemedText>

          {/* Input de hora */}
          <TextInput
            value={hora}
            onChangeText={handleHoraChange}
            placeholder={selectedPeriod === 'mañana' ? '08:30' : selectedPeriod === 'tarde' ? '14:30' : '19:00'}
            style={[styles.input, horaError && styles.inputError]}
            placeholderTextColor="#9ca3af"
          />
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
  // Contenedor principal
  container: {
    flex: 1,
    backgroundColor: '#f9f6f2',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },

  // Encabezado
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

  // Pantalla de carga
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

  // Contenedor del formulario
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

  // Sección del formulario
  formSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },

  // Grid de servicios
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

  // Contador de selección
  selectionCount: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },

  // Labels del formulario
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

  // Selector de período
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

  // Inputs
  input: {
    borderWidth: 1,
    borderColor: '#e4d8cb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111',
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

  // Botón principal
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

  // Botón secundario
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

  // Pantalla vacía
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

  // Tarjeta del servicio seleccionado
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

  // Título del formulario
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },

  // Botón expandir servicios
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

  // Contenedor lista de servicios
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
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, backgroundColor: '#a57c63',
    paddingHorizontal: 22, paddingVertical: 13, marginTop: 4,
  },
  catalogBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});