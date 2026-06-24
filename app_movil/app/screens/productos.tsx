/**
 * Pantalla de Productos
 * Muestra catálogo de productos con buscador, filtros por categoría, paginación y detalles
 */

import { useState, useEffect, useMemo } from "react";
import { ActivityIndicator, Alert, Dimensions, FlatList, Modal, Image, ImageBackground, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import catalogoService from "../../src/services/catalogoService";
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useCarrito } from '../../src/context/CarritoContext';

type CarritoCtx = {
    agregarProducto: (producto: unknown, cantidad: number) => Promise<void>;
    totalItems: number;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_GAP) / 2;
const ITEMS_POR_PAGINA = 6;


const AFRODB_IMAGE = catalogoService.buildImageUrl('uploads/fondo.png');

export default function ProductosScreen() {
  const router = useRouter();
  const { agregarProducto } = useCarrito() as CarritoCtx;

  const [productos, setProductos] = useState<any[]>([]);
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
  const [productoDetalle, setProductoDetalle] = useState<any>(null);
  const [paginaActual, setPaginaActual] = useState(1);

  const buildCategorias = (rawCategorias: any[], items: any[], tipoDeseado: string) => {
    const categoriasRaw = Array.isArray(rawCategorias) ? rawCategorias : [];
    const categoriasConNombre = categoriasRaw.filter((cat: any) => cat && typeof cat.id !== 'undefined' && cat.nombre);
    console.log('productos.tsx buildCategorias - raw count:', categoriasRaw.length, 'valid count:', categoriasConNombre.length);

    const tieneTipo = categoriasConNombre.some((cat: any) => typeof cat.tipo !== 'undefined');
    console.log('productos.tsx buildCategorias - tiene tipo en categorías:', tieneTipo);

    if (tieneTipo) {
      const filtradas = categoriasConNombre.filter((cat: any) => cat.tipo === tipoDeseado);
      console.log('productos.tsx buildCategorias - filtradas por tipo:', filtradas.map((cat: any) => ({ id: cat.id, nombre: cat.nombre, tipo: cat.tipo })));
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
    console.log('productos.tsx buildCategorias - derivadas desde productos:', derivadas.map((cat: any) => ({ id: cat.id, nombre: cat.nombre })));

    if (derivadas.length > 0) return derivadas;
    return categoriasConNombre;
  };

  const loadCatalogo = async ({ isRefresh = false } = {}) => {
    if (!isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMessage('');
    try {
      const [productosData, categoriasData] = await Promise.all([
        catalogoService.getProductos({ pagina: 1, limite: 200 }),
        catalogoService.getCategorias(),
      ]);
      console.log('productos.tsx loadCatalogo - categorias raw:', categoriasData);
      setProductos(Array.isArray(productosData) ? productosData : []);
      setCategorias(buildCategorias(categoriasData, productosData, 'producto'));
    } catch (error: unknown) {
      const msg = (error as { message?: string })?.message;
      setErrorMessage(msg || 'No fue posible cargar el catálogo');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCatalogo();
  }, []);

  useEffect(() => {
    console.log('productos.tsx categorias state:', categorias);
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

  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    
    return productos.filter((p: any) => {
      const coincideTexto = termino === '' || [
        p.nombre?.toLowerCase(),
        p.descripcion?.toLowerCase(),
        p.categoria?.nombre?.toLowerCase(),
        p.subcategoria?.nombre?.toLowerCase(),
        p.precio?.toString(),
      ].some(field => field?.includes(termino));

      const coincideCategoria =
        categoriaActiva === 'all' ||
        String(p.categoriaId || p.categoria?.id) === categoriaActiva;

      const coincideSubcategoria =
        subcategoriaActiva === 'all' ||
        String(p.subcategoriaId || p.subcategoria?.id) === subcategoriaActiva;

      return coincideTexto && coincideCategoria && coincideSubcategoria;
    });
  }, [busqueda, categoriaActiva, subcategoriaActiva, productos]);

  const hasProductos = useMemo(() => productosFiltrados.length > 0, [productosFiltrados]);
  const totalPaginas = useMemo(
    () => Math.ceil(productosFiltrados.length / ITEMS_POR_PAGINA),
    [productosFiltrados, ITEMS_POR_PAGINA]
  );

  const productosVisibles = useMemo(
    () => productosFiltrados.slice((paginaActual - 1) * ITEMS_POR_PAGINA, paginaActual * ITEMS_POR_PAGINA),
    [productosFiltrados, paginaActual, ITEMS_POR_PAGINA]
  );

  const handleAgregarAlCarrito = async (producto: any) => {
    try {
      await agregarProducto(producto, 1);
      Alert.alert('Carrito', `${producto.nombre} agregado correctamente`);
    } catch (error: unknown) {
      const msg = (error as { message?: string })?.message;
      Alert.alert('Error', msg || 'No se pudo agregar al carrito');
    }
  };

  const ListHeader = () => (
    <>

      {/* HERO BANNER */}
      <ImageBackground source={{ uri: AFRODB_IMAGE }} style={styles.hero} imageStyle={{ borderRadius: 24 }}>
        <View style={styles.heroOverlay} />
        <ThemedText style={styles.heroLabel}>TIENDA OFICIAL</ThemedText>
        <ThemedText style={styles.heroTitle}>Nuestros Productos</ThemedText>
        <ThemedText style={styles.heroSubtitle}>
          Productos de belleza naturales y de calidad
        </ThemedText>
      </ImageBackground>

      

      {/* BUSCADOR */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#9ca3af" />
        <TextInput
          placeholder="Buscar productos..."
          value={busqueda}
          onChangeText={(text) => {
            setBusqueda(text);
            setPaginaActual(1);
          }}
          style={styles.searchInput}
          placeholderTextColor="#9ca3af"
        />
        {busqueda.trim().length > 0 && (
          <Pressable
            style={styles.searchClearBtn}
            onPress={() => {
              setBusqueda('');
              setCategoriaActiva('all');
              setPaginaActual(1);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </Pressable>
        )}
      </View>

      {/* CATEGORÍAS: dropdown */}
      {console.log('productos.tsx ListHeader - categorias antes de map:', categorias.length, categorias.map((cat: any) => ({ id: cat.id, nombre: cat.nombre })))}
      {categorias.length > 0 && (
        <>
          <Pressable style={styles.selectButton} onPress={() => setShowCatModal(true)}>
            <ThemedText style={styles.selectText}>
              {categoriaActiva === 'all' ? 'Todas' : (categorias.find(c => String(c.id) === String(categoriaActiva))?.nombre || 'Seleccione')}
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
                    <ThemedText style={styles.modalOptionText}>Todas</ThemedText>
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

      {/* ENCABEZADO DE LA SECCIÓN */}
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Productos Disponibles</ThemedText>
        <ThemedText style={styles.sectionCount}>{productosFiltrados.length} encontrados</ThemedText>
      </View>

      {/* CARGANDO */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#a57c63" />
          <ThemedText style={styles.loadingText}>Cargando catálogo...</ThemedText>
        </View>
      )}
      {!loading && errorMessage && <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>}
      {!loading && !errorMessage && !hasProductos && (
        <ThemedText style={styles.emptyText}>No hay productos para mostrar.</ThemedText>
      )}
    </>
  );

  const ListFooter = () =>
    !loading && hasProductos && totalPaginas > 1 ? (
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
          {String(paginaActual)} / {String(totalPaginas)}
        </ThemedText>
        <Pressable
          style={[styles.pagBtn, paginaActual === totalPaginas && styles.pagBtnDisabled]}
          onPress={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
          disabled={paginaActual === totalPaginas}>
          <ThemedText style={[styles.pagBtnText, paginaActual === totalPaginas && styles.pagBtnTextDisabled]}>
            Siguiente
          </ThemedText>
          <Ionicons name="chevron-forward" size={15} color={paginaActual === totalPaginas ? '#d1d5db' : '#a57c63'} />
        </Pressable>
      </View>
    ) : (
      <View style={{ height: 24 }} />
    );

  const renderProducto = ({ item: producto, index }: { item: any; index: number }) => (
    <View
      style={[
        styles.card,
        index % 2 === 0 ? { marginRight: CARD_GAP / 2 } : { marginLeft: CARD_GAP / 2 },
      ]}>
      <Image
        source={{ uri: catalogoService.buildImageUrl(producto.imagen) }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <View style={styles.cardBadge}>
        <ThemedText style={styles.cardBadgeText} numberOfLines={1}>
          {producto.Categoria?.nombre || producto.categoria?.nombre || 'Sin categoría'}
        </ThemedText>
      </View>
      <View style={styles.cardBody}>
        <ThemedText style={styles.cardNombre} numberOfLines={2}>
          {producto.nombre}
        </ThemedText>
        <ThemedText style={styles.cardPrecio}>
          ${Number(producto.precio || 0).toLocaleString('es-CO')}
        </ThemedText>
        <View style={styles.cardActions}>
          <Pressable style={styles.outlineBtn} onPress={() => setProductoDetalle(producto)}>
            <ThemedText style={styles.outlineBtnText}>Ver</ThemedText>
          </Pressable>
          <Pressable style={styles.cartBtn} onPress={() => handleAgregarAlCarrito(producto)}>
            <Ionicons name="cart" size={16} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <FlatList
        data={!loading && hasProductos ? productosVisibles : []}
        keyExtractor={(item: any) => String(item.id)}
        numColumns={2}
        renderItem={renderProducto}
        ListHeaderComponent={<ListHeader />}
        ListFooterComponent={<ListFooter />}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadCatalogo({ isRefresh: true })}
            colors={['#a57c63']}
            tintColor="#a57c63"
          />
        }
      />

      {/* MODAL DETALLE */}
      <Modal
        visible={Boolean(productoDetalle)}
        transparent
        animationType="slide"
        onRequestClose={() => setProductoDetalle(null)}>
        <View style={styles.modalBackdrop}>
          <ThemedView style={styles.modalCard}>
            {productoDetalle ? (
              <>
                <Image
                  source={{ uri: catalogoService.buildImageUrl(productoDetalle.imagen) }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
                <ThemedText style={styles.modalCategoria}>
                  {productoDetalle.Categoria?.nombre || 'Sin categoría'}
                </ThemedText>
                <ThemedText style={styles.modalTitle}>{productoDetalle.nombre}</ThemedText>
                <ThemedText style={styles.modalDesc}>
                  {productoDetalle.descripcion || 'Sin descripción disponible.'}
                </ThemedText>
                <ThemedText style={styles.modalPrecio}>
                  ${Number(productoDetalle.precio || 0).toLocaleString('es-CO')}
                </ThemedText>
                <View style={styles.modalStock}>
                  <Ionicons name="cube-outline" size={14} color="#6b7280" />
                  <ThemedText style={styles.modalStockText}>
                    Stock disponible: {productoDetalle.stock ?? 'N/A'} unidades
                  </ThemedText>
                </View>
                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.outlineBtn, { flex: 1, paddingVertical: 12 }]}
                    onPress={() => setProductoDetalle(null)}>
                    <ThemedText style={styles.outlineBtnText}>Cerrar</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.primaryBtn, { flex: 2, paddingVertical: 12 }]}
                    onPress={async () => {
                      await handleAgregarAlCarrito(productoDetalle);
                      setProductoDetalle(null);
                    }}>
                    <Ionicons name="cart" size={16} color="#fff" />
                    <ThemedText style={styles.primaryBtnText}>Agregar al carrito</ThemedText>
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
  featuresRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 4, marginBottom: 16 },
  featureCard: { borderRadius: 16, padding: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#efe6dc', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2, gap: 6 },
  featureIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontWeight: '700', fontSize: 13, color: '#3e2f25' },
  featureDesc: { fontSize: 11, color: '#7b6758' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, borderWidth: 0, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14, gap: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  searchInput: { flex: 1, fontSize: 15, color: '#111', padding: 6 },
  searchClearBtn: { padding: 6, justifyContent: 'center', alignItems: 'center' },
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#3e2f25' },
  sectionCount: { fontSize: 12, color: '#7b6758' },
  centered: { paddingVertical: 32, alignItems: 'center', gap: 12 },
  loadingText: { color: '#6b7280', fontSize: 14 },
  errorText: { color: '#ef4444', textAlign: 'center', marginVertical: 16 },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginVertical: 24, fontSize: 14 },
  card: { width: CARD_WIDTH, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#a57c63', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3, marginBottom: 10, overflow: 'hidden' },
  cardImage: { width: '100%', height: 130 },
  cardBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(165,124,99,0.86)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  cardBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  cardBody: { padding: 10, gap: 4 },
  cardNombre: { fontSize: 13, fontWeight: '700', color: '#3e2f25', lineHeight: 18 },
  cardPrecio: { fontSize: 15, fontWeight: '800', color: '#a57c63', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 6, marginTop: 8 },
  outlineBtn: { borderRadius: 8, borderWidth: 1.5, borderColor: '#a57c63', paddingHorizontal: 12, paddingVertical: 7, alignItems: 'center', justifyContent: 'center' },
  outlineBtnText: { color: '#a57c63', fontWeight: '700', fontSize: 12 },
  cartBtn: { flex: 1, borderRadius: 8, backgroundColor: '#a57c63', alignItems: 'center', justifyContent: 'center', paddingVertical: 7 },
  primaryBtn: { borderRadius: 8, backgroundColor: '#a57c63', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 14 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  paginacionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8, paddingHorizontal: 4 },
  pagBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, borderWidth: 1.5, borderColor: '#a57c63', paddingHorizontal: 14, paddingVertical: 10 },
  pagBtnDisabled: { borderColor: '#d1d5db' },
  pagBtnText: { color: '#a57c63', fontWeight: '600', fontSize: 13 },
  pagBtnTextDisabled: { color: '#9ca3af' },
  pagInfo: { color: '#374151', fontWeight: '700', fontSize: 14 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 10, backgroundColor: '#fff' },
  modalImage: { width: '100%', height: 220, borderRadius: 16 },
  modalCategoria: { fontSize: 11, color: '#a57c63', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#111827', lineHeight: 28 },
  modalDesc: { fontSize: 14, color: '#6b7280', lineHeight: 21 },
  modalPrecio: { fontSize: 24, fontWeight: '800', color: '#a57c63' },
  modalStock: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modalStockText: { fontSize: 13, color: '#6b7280' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 6, marginBottom: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#d6c7ae', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff' },
  searchBtn: { backgroundColor: '#b87a5a', borderRadius: 14, paddingHorizontal: 16, justifyContent: 'center'},
  clearBtn: { backgroundColor: '#b87a5a', borderRadius: 14, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700' },
});
