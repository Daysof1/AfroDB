/**
 * Pantalla de Servicios
 * Muestra servicios disponibles en scroll horizontal con opción de agendar
 */

import { useState, useEffect, useMemo } from "react";
import { Alert, FlatList, Modal, Image, ImageBackground, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View, ActivityIndicator, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import catalogoService from "../../src/services/catalogoService";
import { useAuth } from '../../src/context/AuthContext';
import { useAgendar } from "../../src/context/AgendarContext";
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import apiClient from "../../src/api/apiClient";


const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_GAP) / 2;
const SERVICIOS_POR_PAGINA = 6;

const AFRODB_IMAGE = catalogoService.buildImageUrl('uploads/fondo.png');

export default function ServiciosScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth() as { isAuthenticated: boolean };
  const { setServicioSeleccionado } = useAgendar() as { setServicioSeleccionado: (s: any) => void };

  const [servicios, setServicios] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [subcategorias, setSubcategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<any>('all');
  const [subcategoriaActiva, setSubcategoriaActiva] = useState<any>('all');
  const [loadingSubcategorias, setLoadingSubcategorias] = useState(false);
  const [showSubcatModal, setShowSubcatModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [searchCatTerm, setSearchCatTerm] = useState('');
  const [searchSubcatTerm, setSearchSubcatTerm] = useState('');
  const [servicioDetalle, setServicioDetalle] = useState<any>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

const fetchServicios = async (page = 1, search = '') => {
  setLoading(true);
  setErrorMessage('');

  try {
    const params = new URLSearchParams();

    if (search.trim()) {
      params.append('buscar', search.trim());
    }

    params.append('pagina', String(page));
    params.append('limite', '10');

    const res = await apiClient.get(`/admin/servicios?${params.toString()}`);

    const serviciosData = Array.isArray(res.data?.data?.servicios)
      ? res.data.data.servicios
      : [];

    setServicios(serviciosData);
    setPagina(page);
    setTotalPaginas(
      Number(res.data?.data?.paginacion?.totalPaginas) || 1
    );
  } catch (error: any) {
    setErrorMessage(
      error?.response?.data?.message ||
      error?.message ||
      'Error al cargar servicios'
    );
  } finally {
    setLoading(false);
  }
};

  const buildCategorias = (rawCategorias: any[], items: any[], tipoDeseado: string) => {
    const categoriasRaw = Array.isArray(rawCategorias) ? rawCategorias : [];
    const categoriasConNombre = categoriasRaw.filter((cat: any) => cat && typeof cat.id !== 'undefined' && cat.nombre);
    console.log('servicios.tsx buildCategorias - raw count:', categoriasRaw.length, 'valid count:', categoriasConNombre.length);

    const tieneTipo = categoriasConNombre.some((cat: any) => typeof cat.tipo !== 'undefined');
    console.log('servicios.tsx buildCategorias - tiene tipo en categorías:', tieneTipo);

    if (tieneTipo) {
      const filtradas = categoriasConNombre.filter((cat: any) => cat.tipo === tipoDeseado);
      console.log('servicios.tsx buildCategorias - filtradas por tipo:', filtradas.map((cat: any) => ({ id: cat.id, nombre: cat.nombre, tipo: cat.tipo })));
      if (filtradas.length > 0) return filtradas;
    }

    const derivadas: any[] = [];
    const vistos = new Set<string>();
    items.forEach((item: any) => {
      const cat = item?.categoria;
      if (cat && typeof cat.id !== 'undefined' && cat.nombre) {
        const idKey = String(cat.id);
        if (!vistos.has(idKey)) {
          vistos.add(idKey);
          derivadas.push({ id: cat.id, nombre: cat.nombre, tipo: tipoDeseado });
        }
      }
    });
    console.log('servicios.tsx buildCategorias - derivadas desde servicios:', derivadas.map((cat: any) => ({ id: cat.id, nombre: cat.nombre })));

    if (derivadas.length > 0) return derivadas;
    return categoriasConNombre;
  };

  const loadServicios = async ({ isRefresh = false } = {}) => {
    if (!isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMessage('');
    try {
      const [serviciosData, categoriaData] = await Promise.all([
        catalogoService.getServicios({ pagina: 1, limite: 200 }),
        catalogoService.getCategorias(),
      ]);
      console.log('servicios.tsx loadServicios - categorias raw:', categoriaData);
      setServicios(Array.isArray(serviciosData) ? serviciosData : []);
      setCategorias(buildCategorias(categoriaData, serviciosData, 'servicio'));
    } catch (error: unknown) {
      const msg = (error as { message?: string })?.message;
      setErrorMessage(msg || 'No fue posible cargar los servicios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadServicios();
  }, []);

  useEffect(() => {
    console.log('servicios.tsx categorias state:', categorias);
  }, [categorias]);

  // Cargar subcategorías cuando cambia la categoría activa
  useEffect(() => {
    const loadSubcategorias = async () => {
      if (categoriaActiva === 'all') {
        setSubcategorias([]);
        setSubcategoriaActiva('all');
        return;
      }
      
      setLoadingSubcategorias(true);
      try {
        const subcat = await catalogoService.getSubcategoriasPorCategoria(categoriaActiva);
        setSubcategorias(Array.isArray(subcat) ? subcat : []);
        setSubcategoriaActiva('all');
      } catch (error: unknown) {
        console.error('Error cargando subcategorías:', error);
        setSubcategorias([]);
      } finally {
        setLoadingSubcategorias(false);
      }
    };
    
    loadSubcategorias();
  }, [categoriaActiva]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, categoriaActiva, subcategoriaActiva]);

  const categoriasFiltradas = useMemo(() => {
    const termino = searchCatTerm.trim().toLowerCase();
    if (!termino) return categorias;
    return categorias.filter((cat: any) => cat.nombre.toLowerCase().includes(termino));
  }, [categorias, searchCatTerm]);

  const subcategoriasFiltradas = useMemo(() => {
    const termino = searchSubcatTerm.trim().toLowerCase();
    if (!termino) return subcategorias;
    return subcategorias.filter((subcat: any) => subcat.nombre.toLowerCase().includes(termino));
  }, [subcategorias, searchSubcatTerm]);

  const serviciosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    
    return servicios.filter((p: any) => {
      const coincideTexto = termino === '' || [
        p.nombre?.toLowerCase(),
        p.descripcion?.toLowerCase(),
        p.categoria?.nombre?.toLowerCase(),
        p.subcategoria?.nombre?.toLowerCase(),
        p.precio?.toString(),
        p.duracion?.toString(),
      ].some(field => field?.includes(termino));

      const coincideCategoria =
        categoriaActiva === 'all' ||
        String(p.categoriaId || p.categoria?.id) === categoriaActiva;

      const coincideSubcategoria =
        subcategoriaActiva === 'all' ||
        String(p.subcategoriaId || p.subcategoria?.id) === subcategoriaActiva;

      return coincideTexto && coincideCategoria && coincideSubcategoria;
    });
  }, [busqueda, categoriaActiva, subcategoriaActiva, servicios]);
  
    const hasServicios = useMemo(() => serviciosFiltrados.length > 0, [serviciosFiltrados]);
    const totalPaginasFiltrados = useMemo(
      () => Math.ceil(serviciosFiltrados.length / SERVICIOS_POR_PAGINA),
      [serviciosFiltrados, SERVICIOS_POR_PAGINA]
    );
  
    const serviciosVisibles = useMemo(
      () => serviciosFiltrados.slice((paginaActual - 1) * SERVICIOS_POR_PAGINA, paginaActual * SERVICIOS_POR_PAGINA),
      [serviciosFiltrados, paginaActual, SERVICIOS_POR_PAGINA]
    );

    const handleAgendarCita = (servicio: any) => {
      setServicioSeleccionado(servicio);
      router.push('/agendar');
    };
  
    const ListHeader = () => {
      console.log('servicios.tsx ListHeader - categorias antes de map:', categorias.length, categorias.map((cat: any) => ({ id: cat.id, nombre: cat.nombre })));
      return (
      <>

        {/* HERO BANNER */}
        <ImageBackground source={{ uri: AFRODB_IMAGE }} style={styles.hero} imageStyle={{ borderRadius: 24 }}>
          <View style={styles.heroOverlay} />
          <ThemedText style={styles.heroLabel}>TIENDA OFICIAL</ThemedText>
          <ThemedText style={styles.heroTitle}>Nuestros Servicios</ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            Servicios profesionales certificados
          </ThemedText>
        </ImageBackground>

        <View style={styles.searchRow}>   
          <View style={{ position: 'relative', flex: 1 }}>
            <Ionicons name="search" size={18} color="#9ca3af" style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }} />
            <TextInput       
              placeholder="Buscar servicios..."
              value={busqueda}
              onChangeText={(text) => {
                setBusqueda(text);
                fetchServicios(1, text); // Búsqueda en tiempo real
              }}
              style={[styles.input, { paddingLeft: 40 }]}
            />
          </View>
        
          {busqueda.trim().length > 0 && (
            <Pressable
              style={styles.clearBtn}
              onPress={() => {
                setBusqueda('');
                setCategoriaActiva('all');
                setPaginaActual(1);
                fetchServicios(1, '');
              }}
            >
              <ThemedText style={styles.searchBtnText}>X</ThemedText>
            </Pressable>
          )}
        </View>

            {/* CATEGORÍAS: dropdown */}
            {categorias.length > 0 && (
              <>
                <Pressable style={styles.selectButton} onPress={() => setShowCatModal(true)}>
                  <ThemedText style={styles.selectText}>
                    {categoriaActiva === 'all' ? 'Todos' : (categorias.find(c => String(c.id) === String(categoriaActiva))?.nombre || 'Seleccione')}
                  </ThemedText>
                  <Ionicons name="chevron-down" size={18} color="#6b5344" />
                </Pressable>

                <Modal visible={showCatModal} transparent animationType="fade" onRequestClose={() => { setShowCatModal(false); setSearchCatTerm(''); }}>
                  <View style={styles.modalBackdrop}>
                    <View style={styles.modalPanel}>
                      <TextInput
                        placeholder="Buscar categoría..."
                        value={searchCatTerm}
                        onChangeText={setSearchCatTerm}
                        style={styles.modalSearchInput}
                        placeholderTextColor="#999"
                      />
                      <ScrollView>
                        <Pressable style={styles.modalOption} onPress={() => { setCategoriaActiva('all'); setShowCatModal(false); setSearchCatTerm(''); }}>
                          <ThemedText style={styles.modalOptionText}>Todos</ThemedText>
                        </Pressable>
                        {categoriasFiltradas.map((cat: any) => (
                          <Pressable key={cat.id} style={styles.modalOption} onPress={() => { setCategoriaActiva(String(cat.id)); setShowCatModal(false); setSearchCatTerm(''); }}>
                            <ThemedText style={styles.modalOptionText}>{cat.nombre}</ThemedText>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </Modal>
              </>
            )}

            {/* SUBCATEGORÍAS: dropdown */}
            {categoriaActiva !== 'all' && subcategorias.length > 0 && (
              <>
                {loadingSubcategorias ? (
                  <View style={{ paddingVertical: 8, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#a57c63" />
                  </View>
                ) : (
                  <>
                    <Pressable style={styles.selectButton} onPress={() => setShowSubcatModal(true)}>
                      <ThemedText style={styles.selectText}>
                        {subcategoriaActiva === 'all' ? 'Todas' : (subcategorias.find(s => String(s.id) === String(subcategoriaActiva))?.nombre || 'Seleccione')}
                      </ThemedText>
                      <Ionicons name="chevron-down" size={18} color="#6b5344" />
                    </Pressable>

                    <Modal visible={showSubcatModal} transparent animationType="fade" onRequestClose={() => { setShowSubcatModal(false); setSearchSubcatTerm(''); }}>
                      <View style={styles.modalBackdrop}>
                        <View style={styles.modalPanel}>
                          <TextInput
                            placeholder="Buscar subcategoría..."
                            value={searchSubcatTerm}
                            onChangeText={setSearchSubcatTerm}
                            style={styles.modalSearchInput}
                            placeholderTextColor="#999"
                          />
                          <ScrollView>
                            <Pressable style={styles.modalOption} onPress={() => { setSubcategoriaActiva('all'); setShowSubcatModal(false); setSearchSubcatTerm(''); }}>
                              <ThemedText style={styles.modalOptionText}>Todas</ThemedText>
                            </Pressable>
                            {subcategoriasFiltradas.map((subcat: any) => (
                              <Pressable key={subcat.id} style={styles.modalOption} onPress={() => { setSubcategoriaActiva(String(subcat.id)); setShowSubcatModal(false); setSearchSubcatTerm(''); }}>
                                <ThemedText style={styles.modalOptionText}>{subcat.nombre}</ThemedText>
                              </Pressable>
                            ))}
                          </ScrollView>
                        </View>
                      </View>
                    </Modal>
                  </>
                )}
              </>
            )}

        {/* ENCABEZADO */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Servicios Disponibles</ThemedText>
          <ThemedText style={styles.sectionCount}>{servicios.length} servicios</ThemedText>
        </View>

        {/* CARGANDO */}
        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#a57c63" />
            <ThemedText style={styles.loadingText}>Cargando servicios...</ThemedText>
          </View>
        )}
        </>
      );
    };

  const ListFooter = () =>
    !loading && hasServicios && totalPaginasFiltrados > 1 ? (
      <View style={styles.paginacionRow}>
        <Pressable
          style={[styles.pagBtn, paginaActual === 1 && styles.pagBtnDisabled]}
          onPress={() => setPaginaActual((p) => Math.max(1, p - 1))}
          disabled={paginaActual === 1}>
          <Ionicons name="chevron-back" size={15} color={paginaActual === 1 ? '#d1d5db' : '#a57c63'} />
          <ThemedText style={[styles.pagBtnText, paginaActual === 1 && styles.pagBtnTextDisabled]}>
            Anterior
          </ThemedText>
        </Pressable>
        <ThemedText style={styles.pagInfo}>
          {String(paginaActual)} / {String(totalPaginasFiltrados)}
        </ThemedText>
        <Pressable
          style={[styles.pagBtn, paginaActual === totalPaginasFiltrados && styles.pagBtnDisabled]}
          onPress={() => setPaginaActual((p) => Math.min(totalPaginasFiltrados, p + 1))}
          disabled={paginaActual === totalPaginasFiltrados}>
          <ThemedText style={[styles.pagBtnText, paginaActual === totalPaginasFiltrados && styles.pagBtnTextDisabled]}>
            Siguiente
          </ThemedText>
          <Ionicons name="chevron-forward" size={15} color={paginaActual === totalPaginasFiltrados ? '#d1d5db' : '#a57c63'} />
        </Pressable>
      </View>
    ) : (
      <View style={{ height: 24 }} />
    );

  const renderServicio = ({ item: servicio, index }: { item: any; index: number }) => (
    <View
      style={[
        styles.card,
        index % 2 === 0 ? { marginRight: CARD_GAP / 2 } : { marginLeft: CARD_GAP / 2 },
      ]}>
      <Image
        source={{ uri: catalogoService.buildImageUrl(servicio.imagen) }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <View style={styles.cardBadge}>
        <ThemedText style={styles.cardBadgeText} numberOfLines={1}>
          {servicio.Categoria?.nombre || servicio.categoria?.nombre || 'Sin categoría'}
        </ThemedText>
      </View>
      <View style={styles.cardBody}>
        <ThemedText style={styles.cardNombre} numberOfLines={2}>
          {servicio.nombre}
        </ThemedText>
        <ThemedText style={styles.cardPrecio}>
          ${Number(servicio.precio || 0).toLocaleString('es-CO')}
        </ThemedText>
        <View style={styles.cardActions}>
          <Pressable style={styles.outlineBtn} onPress={() => setServicioDetalle(servicio)}>
            <ThemedText style={styles.outlineBtnText}>Ver</ThemedText>
          </Pressable>
          <Pressable style={styles.cartBtn} onPress={() => handleAgendarCita(servicio)}>
            <Ionicons name="calendar-clear-outline" size={16} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <FlatList
        data={!loading && hasServicios ? serviciosVisibles : []}
        keyExtractor={(item: any) => String(item.id)}
        numColumns={2}
        renderItem={renderServicio}
        ListHeaderComponent={<ListHeader />}
        ListFooterComponent={<ListFooter />}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadServicios({ isRefresh: true })}
            colors={['#a57c63']}
            tintColor="#a57c63"
          />
        }
      />

      {/* MODAL DETALLE */}
      <Modal
        visible={Boolean(servicioDetalle)}
        transparent
        animationType="slide"
        onRequestClose={() => setServicioDetalle(null)}>
        <View style={styles.modalBackdrop}>
          <ThemedView style={styles.modalCard}>
            {servicioDetalle ? (
              <>
                <Image
                  source={{ uri: catalogoService.buildImageUrl(servicioDetalle.imagen) }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
                <ThemedText style={styles.modalCategoria}>
                  {servicioDetalle.Categoria?.nombre || 'Sin categoría'}
                </ThemedText>
                <ThemedText style={styles.modalTitle}>{servicioDetalle.nombre}</ThemedText>
                <ThemedText style={styles.modalDesc}>
                  {servicioDetalle.descripcion || 'Sin descripción disponible.'}
                </ThemedText>
                <ThemedText style={styles.modalPrecio}>
                  ${Number(servicioDetalle.precio || 0).toLocaleString('es-CO')}
                </ThemedText>
                <View style={styles.modalStock}>
                  <Ionicons name="cube-outline" size={14} color="#6b7280" />
                  <ThemedText style={styles.modalStockText}>
                    Stock disponible: {servicioDetalle.stock ?? 'N/A'} unidades
                  </ThemedText>
                </View>
                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.outlineBtn, { flex: 1, paddingVertical: 12 }]}
                    onPress={() => setServicioDetalle(null)}>
                    <ThemedText style={styles.outlineBtnText}>Cerrar</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.primaryBtn, { flex: 2, paddingVertical: 12 }]}
                    onPress={() => {
                      handleAgendarCita(servicioDetalle);
                      setServicioDetalle(null);
                    }}>
                    <>
                      <Ionicons name="calendar-clear-outline" size={16} color="#fff" />
                      <ThemedText style={styles.primaryBtnText}>Agendar cita</ThemedText>
                    </>
                  </Pressable>
                </View>
              </>
            ) : null}
          </ThemedView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 16 },
  hero: { borderRadius: 24, padding: 22, backgroundColor: '#a57c63', marginTop: 16, marginBottom: 16, gap: 10 },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.28)' },
  heroLabel: { color: '#f3e6d8', letterSpacing: 1.4, fontSize: 11, fontWeight: '700' },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800', lineHeight: 34 },
  heroSubtitle: { color: '#f9f6f2', fontSize: 14, lineHeight: 21 },
  card: { width: CARD_WIDTH, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#a57c63', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3, marginBottom: 10, overflow: 'hidden' },
  chipsRow: { gap: 8, paddingVertical: 4, marginBottom: 16 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: 'transparent', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#faf6f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  chipActive: { backgroundColor: '#a57c63', borderColor: '#a57c63', shadowOpacity: 0.08 },
  chipText: { color: '#5f4638', fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  chipSubcategoria: { borderColor: '#c8a27a', backgroundColor: '#faf6f0' },
  chipTextSubcategoria: { color: '#6b5344' },
  selectButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e4d8cb', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff', marginBottom: 16 },
  selectText: { color: '#5f4638', fontWeight: '600' },
  modalPanel: { marginHorizontal: 20, marginTop: 100, backgroundColor: '#fff', borderRadius: 12, maxHeight: '60%', overflow: 'hidden' },
  modalSearchInput: { borderBottomWidth: 1, borderBottomColor: '#e4d8cb', paddingVertical: 12, paddingHorizontal: 14, fontSize: 14, color: '#333', backgroundColor: '#fafafa' },
  modalOption: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f3f2f0' },
  modalOptionText: { color: '#3e2f25' },
  featuresRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 4, marginBottom: 16 },
  featureCard: { borderRadius: 16, padding: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#efe6dc', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2, gap: 6 },
  featureIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontWeight: '700', fontSize: 13, color: '#3e2f25' },
  featureDesc: { fontSize: 11, color: '#7b6758' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#3e2f25' },
  sectionCount: { fontSize: 12, color: '#7b6758' },
  centered: { paddingVertical: 32, alignItems: 'center', gap: 12 },
  loadingText: { color: '#6b7280', fontSize: 14 },
  errorText: { color: '#ef4444', textAlign: 'center', marginVertical: 16 },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginVertical: 24, fontSize: 14 },
  servicesGrid: { flexDirection: 'column', gap: 12 },
  serviceCard: { borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#efe6dc', overflow: 'hidden', shadowColor: '#a57c63', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  serviceImage: { width: '100%', height: 140 },
  serviceBody: { padding: 14, gap: 8 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, borderWidth: 0, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14, gap: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  serviceTitle: { fontSize: 15, fontWeight: '800', color: '#3e2f25' },
  serviceDesc: { fontSize: 12, color: '#7b6758', lineHeight: 17 },
  serviceMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceMetaPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, backgroundColor: '#f3e6d8', paddingHorizontal: 10, paddingVertical: 6 },
  serviceMetaText: { color: '#a57c63', fontSize: 11, fontWeight: '700' },
  primaryBtn: { borderRadius: 8, backgroundColor: '#a57c63', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 12, marginTop: 8 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  outlineBtn: { borderRadius: 8, borderWidth: 1.5, borderColor: '#a57c63', paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  outlineBtnText: { color: '#a57c63', fontWeight: '700', fontSize: 12 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  paginacionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8, paddingHorizontal: 4 },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 10, backgroundColor: '#fff' },
  searchInput: { flex: 1, fontSize: 15, color: '#111', padding: 6 },
  searchClearBtn: { padding: 6, justifyContent: 'center', alignItems: 'center' },
  cardImage: { width: '100%', height: 130 },
  cardBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(165,124,99,0.86)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  cardBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  cardBody: { padding: 10, gap: 4 },
  cardNombre: { fontSize: 13, fontWeight: '700', color: '#3e2f25', lineHeight: 18 },
  cardPrecio: { fontSize: 15, fontWeight: '800', color: '#a57c63', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 6, marginTop: 8 },
  cartBtn: { flex: 1, borderRadius: 8, backgroundColor: '#a57c63', alignItems: 'center', justifyContent: 'center', paddingVertical: 7 },
  pagBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, borderWidth: 1.5, borderColor: '#a57c63', paddingHorizontal: 14, paddingVertical: 10 },
  pagBtnDisabled: { borderColor: '#d1d5db' },
  pagBtnText: { color: '#a57c63', fontWeight: '600', fontSize: 13 },
  pagBtnTextDisabled: { color: '#9ca3af' },
  pagInfo: { color: '#374151', fontWeight: '700', fontSize: 14 },
  modalImage: { width: '100%', height: 220, borderRadius: 16 },
  modalCategoria: { fontSize: 11, color: '#a57c63', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#111827', lineHeight: 28 },
  modalDesc: { fontSize: 14, color: '#6b7280', lineHeight: 21 },
  modalPrecio: { fontSize: 24, fontWeight: '800', color: '#a57c63' },
  modalStock: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modalStockText: { fontSize: 13, color: '#6b7280' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 6, marginBottom: 8 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#d6c7ae', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff' },
  searchBtn: { backgroundColor: '#b87a5a', borderRadius: 14, paddingHorizontal: 16, justifyContent: 'center'},
  clearBtn: { backgroundColor: '#b87a5a', borderRadius: 14, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700' },
});