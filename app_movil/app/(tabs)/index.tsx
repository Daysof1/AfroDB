/**
 * Pantalla de cuenta pestaña 1
 * Pantalla pincipal Tienda muestra catalogo de productos
 * con un banner hero tarjetas de caracteristicas buscador de texto
 * chips de categrias lista de productos a dos columnas paginacion y un modal de detalle de producto
 */

/** importar componentes de React native para construir la pantalla
 * hooks de react:
 * useEffect ejecuta el codigo al montar el componente o cuando cambia las dependencias
 * useMemo: memoriza valores calclados para evitar recalculos innecesarios
 * useState maneja variables de estado local
 */


// manejo de variables de estado local
import { useState, useEffect, useMemo } from "react";
//Importar componentes 
//Dimensions optiene al ancho y alto de la pantalla para hacer diseos responsivos
//flatlist lista optimizada con virtualizacion para mostrar grandes cantidades de datos
//modal mostrar detalles de contenido en ventanas emergentes

import { ActivityIndicator, Alert, Dimensions, FlatList, Modal, Image, ImageBackground, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from "react-native";

//Ionicons liberia de iconos cevtoriales para react native 
import { Ionicons } from "@expo/vector-icons";
//catalogoService servicio que hace las llamadas a http (API) del backend para productos y categorias
import catalogoService  from "../../src/services/catalogoService"
//themedText : texto que aplica colores del tema del dispositivo de manera automatica claro u oscuro
import { ThemedText } from '../../components/themed-text';
//themedView : color de fondo automatico segun el tema del dispositivo
import { ThemedView } from '../../components/themed-view';
//useCarrito hook del contexto del carrito para agregar productos
import { useCarrito } from '../../src/context/CarritoContext';

/**
 * Tipos de Carriro CTX
 * describe los campos que se usan de useCarrito cen pantallla
 */

type CarritoCtx = {
    //agregarProducto: agrega producto al carrito con la cantidad indicada
    agregarProducto: (producto: unknown, cantidad: number) => Promise<void>; 
    //totalItems numero total de items en el carrito
    totalItems: number;
};

/**
 * Constantes globales
 * se calculan una sola vez al cargar el modulo
 */

// SREEN_WIDTH ancho de dispositico en dp (density indpendent pixeles) para diseños responsivos
const { width: SCREEN_WIDTH } = Dimensions.get('window');
//Card_gap espaci horizontal entre las dos columnas de la tarjeta de producto
const CARD_GAP = 10;
//CARD_WIDTH ancho de cada tarjeta calculando para que quepan exactamente 2 por fila en dos columnas
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_GAP) /2;
//ITEMS_POR_PAGINA numro de productos por agin a usando paginacion 
const ITEMS_POR_PAGINA = 15;

// Layout para tarjetas de características: dos columnas (2 arriba, 2 abajo)
const FEATURE_GAP = 10;
const FEATURE_CARD_WIDTH = (SCREEN_WIDTH - 32 - FEATURE_GAP) / 2;

const FEATURES = [
  { icon: 'bag-handle', title: 'Tienda Online', desc: 'Compra productos de belleza naturales y de calidad', color: '#553e30', bg: '#efe0d1' },
  { icon: 'cut', title: 'Profesionales Certificados', desc: 'Especialistas en cuidado personal y belleza', color: '#553e30', bg: '#efe0d1' },
  { icon: 'calendar-clear', title: 'Agenda Citas Fácil', desc: 'Reserva tus servicios de forma rápida y segura', color: '#553e30', bg: '#efe0d1' },
  { icon: 'leaf', title: '100% Natural', desc: 'Productos y servicios con ingredientes naturales', color: '#553e30', bg: '#efe0d1' },
] as const;

// Usar la imagen alojada en el backend (carpeta UPLOADS)
// `catalogoService.buildImageUrl` convierte la ruta relativa en URL completa.
const AFRODB_IMAGE = catalogoService.buildImageUrl('uploads/fondo.png');

/**
 * Componente principal HOME SCREEN 
 */

export default function HomeScreen() {
    //Extrae las funciones del carrito necesarias para la pantalla
    const { agregarProducto, totalItems, } = useCarrito() as CarritoCtx;

    /**
     * Estado de datos
     * productos lista completa de productos traida de backend
     */
    const [productos, SetProductos] = useState<any[]>([]);
    //categorias lista de categorias raidas del backend
    const [categorias, SetCategorias] = useState<any[]>([]);
    //servicios publicos visibles sin iniciar sesion
    const [servicios, setServicios] = useState<any[]>([]);

    //Esatdo de IU
    //loading true mientras cargan los datos por primera vez .
    const [loading, setLoading] = useState(true);
    //refreshing true mientras el usuario hace pull to efresh
    const [refreshing, setRefreshing] = useState(false);
    //Error mensahe mensaje de errir si falla la carga 
    const [errorMessage, setErrorMessage] = useState('');
    //busqyeda texto de campos de busqueda filtra poductos en tiempo real
    const [busqueda, setBusqueda] = useState('');
    //categoriasActiva id de la categoria seleccionada o all para ver todas
    const [categoriaActiva, setCategoriaActiva] = useState<any>('all');
    //productoDetalle product seleccionado para ver el modal 
    const [productoDetalle, setProductoDetalle] = useState<any>(null);
    //paginaActal numero de la pagina activa para paginacion
    const [paginaActual, setPaginaActual] = useState(1);
    //ITEMS_POR_PAGINA numero de productos por pagina
    const ITEMS_POR_PAGINA = 15;

    /**
     * Funcion handleAgregarAlCarrito
     * agrega el rpoducto al carrito y muestra una alerta de confitmacon o eerror
     */

    const handleAgregarAlCarrito = async (producto : any) => {
        try {
            await agregarProducto(producto, 1); //agrega 1 unidad del producto 
            Alert.alert('Carrito', `${producto.nombre} agregado corretamente`);
        } catch (error: unknown) {
            const msg = (error as { message?: string })?.message;
            Alert.alert('Error',msg || 'no se pudo agregar al carrito');
        }
    };

    /**
     * funcion loadCatalogo
     * carga los productos y categorias desde el backend en pararlelo con promise.all
     * isRefresh: true cuando es un pull to refresh
     */

    const loadCatalogo = async ({ isRefresh = false } = {}) => {
        if (!isRefresh) setRefreshing(true);//pull-to-refresh activa indicador de refresco
        else setLoading(true); //carga inicial el spinner grande
        setErrorMessage('');
        try{
            /**llma todos los endpoints al mismo tiempo para mayor velocidad
             * getProductos con limite de 200 trae todos los productos de una vez
             */
            const [productosData, categoriasData, serviciosData] = await Promise.all([
                catalogoService.getProductos({ pagina: 1, limite: 200}),
                catalogoService.getCategorias(),
                catalogoService.getServicios({ activo: true, pagina: 1, limite: 6 }),
            ]);
            // guarda los datos solo si son arrays
            SetProductos(Array.isArray(productosData) ? productosData : []);
            SetCategorias(Array.isArray(categoriasData) ? categoriasData : []);
            setServicios(Array.isArray(serviciosData) ? serviciosData : []);
        } catch (error: unknown) {
            const msg = (error as { message?: string })?.message;
            setErrorMessage(msg || 'No fue posible cargar el catalogo');
        } finally {
            //Siempre desactiva los indicadores al terminar sea exitoso o error
            setLoading(false);
            setRefreshing(false);
        }
    };

    /**
     * Efecto  carga inicial
     * como dependencia se ejecuta una sola vez al montar el componente 
     */

    useEffect(() => {
        loadCatalogo();
    }, []);

    /**
     * Efecto  resetear pagina al cambiar filtros 
     * cuando el usuario escribe en el buscador o cambia de categoria 
     * siempre vuelve a la pagina 1 para no quedar en una pagina vacia
     */

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda, categoriaActiva]);

    /**
     * datos derivados (useMemo)
     * useMemo  recalcula solo cuando cambian las dependencias indicadas
     * evitando filtrar/calcular en cada renderrizado
     */

    //Productos filtrados subonjuntos de productos que coindiden con la busqueda  categoria
    const productosFiltrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();//normaliza el texto
        return productos.filter((p: any) => {
            //coincideTexto l producto tiene el termino en su nombre descripcion
            const coincideTexto = 
            termino === '' ||
            //sin busqueda pasa toda la informacion de los productos
            p.nombre?.toLowerCase().includes(termino) ||
            p.descripcion?.toLowerCase().includes(termino);

            //coincideCategoria el producto pertenece a la categoria activa
            //categoriaId o categoria.id son los dos campos posibles segun el endpoint 
            const coincideCategoria =
            categoriaActiva === 'all' ||
            //pasa todo
            String(p.categoriaId || p.categoria?.id) === categoriaActiva;
            return coincideTexto && coincideCategoria;
        });
    }, [busqueda, categoriaActiva, productos]); //recalcula cuando cambia la busqueda categoria o datos

    /**
     * hasproductos: true s hay al menos un producto filtrado evita mostrar la vista vacia
     */
    const hasProductos = useMemo(() => productosFiltrados.length > 0, [productosFiltrados]);

    //total paginas numero total de paginas segun los productos filtrados
    const totalPaginas = useMemo(
        () => Math.ceil(productosFiltrados.length / ITEMS_POR_PAGINA), [productosFiltrados, ITEMS_POR_PAGINA]);

        // productos visibles subconjunto de productos de la pagina actal eje pagina 1 1-15 pagina 2 16-30 ...
        const productosVisibles = useMemo(
        () => productosFiltrados.slice((paginaActual -1) * ITEMS_POR_PAGINA, paginaActual * ITEMS_POR_PAGINA),
        [productosFiltrados, paginaActual, ITEMS_POR_PAGINA]
    );

    // ── SUBCOMPONENTE: ListHeader ────────────────────────────────────────────
  // Se renderiza UNA SOLA VEZ como cabecera fija del FlatList (encima de los productos).
  // Contiene: Hero, Features, Buscador, Chips, Encabezado de sección y estados de carga/error.
  const ListHeader = () => (
    <>
      {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
      {/* Tarjeta índigo con título, subtítulo */}
      <ImageBackground source={{ uri: AFRODB_IMAGE }} style={styles.hero} imageStyle={{ borderRadius: 24 }}>
        <View style={styles.heroOverlay} />
        {/* Etiqueta superior en mayúsculas pequeñas */}
        <ThemedText style={styles.heroLabel}>TIENDA OFICIAL</ThemedText>
        {/* Título principal con salto de línea usando {'\n'} */}
        <ThemedText style={styles.heroTitle}>
          Bienvenido a{''}AfroDB
        </ThemedText>
        <ThemedText style={styles.heroSubtitle}>
          Tu plataforma de belleza, bienestar y servicios profesionales.
        </ThemedText>
      </ImageBackground>

      {/* ── TARJETAS DE CARACTERÍSTICAS ─────────────────────────────────── */}
      {/* Cuadrícula 2x2: dos columnas por fila para mejor legibilidad */}
      <View style={styles.featuresRow}>
        {FEATURES.map((f) => (
          <View key={f.title} style={[styles.featureCard, { width: FEATURE_CARD_WIDTH, marginBottom: FEATURE_GAP }]}> 
            <View style={[styles.featureIconCircle, { backgroundColor: f.bg }]}>
              <Ionicons name={f.icon as any} size={22} color={f.color} />
            </View>
            <ThemedText style={styles.featureTitle}>{f.title}</ThemedText>
            <ThemedText style={styles.featureDesc}>{f.desc}</ThemedText>
          </View>
        ))}
      </View>

      {/* ── BUSCADOR ────────────────────────────────────────────────────── */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#9ca3af" />
        <TextInput
          placeholder="Buscar productos..."
          value={busqueda}
          onChangeText={setBusqueda}       // Actualiza busqueda en cada keystroke.
          style={styles.searchInput}
          placeholderTextColor="#9ca3af"
        />
        {/* Botón "X" para limpiar la búsqueda, solo visible cuando hay texto */}
        {busqueda.length > 0 && (
          <Pressable onPress={() => setBusqueda('')}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </Pressable>
        )}
      </View>

      {/* ── CHIPS DE CATEGORÍAS ─────────────────────────────────────────── */}
      {/* Scroll horizontal de pastillas para filtrar por categoría */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}>
        {/* Chip "Todas": selecciona categoriaActiva = 'all' */}
        <Pressable
          onPress={() => setCategoriaActiva('all')}
          style={[styles.chip, categoriaActiva === 'all' && styles.chipActive]}>
          {/* chipActive agrega fondo índigo cuando está seleccionado */}
          <ThemedText style={[styles.chipText, categoriaActiva === 'all' && styles.chipTextActive]}>
            Todas
          </ThemedText>
        </Pressable>
        {/* Un chip por cada categoría del backend */}
        {categorias.map((cat: any) => (
          <Pressable
            key={cat.id}
            onPress={() => setCategoriaActiva(String(cat.id))} // Guarda el ID como string.
            style={[styles.chip, categoriaActiva === String(cat.id) && styles.chipActive]}>
            <ThemedText style={[styles.chipText, categoriaActiva === String(cat.id) && styles.chipTextActive]}>
              {cat.nombre}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── ENCABEZADO DE LA SECCIÓN DE PRODUCTOS ───────────────────────── */}
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Productos Disponibles</ThemedText>
        {/* Contador de resultados filtrados */}
        <ThemedText style={styles.sectionCount}>{productosFiltrados.length} encontrados</ThemedText>
      </View>

      {/* ── ESTADO: CARGANDO ────────────────────────────────────────────── */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#a57c63" />
          <ThemedText style={styles.loadingText}>Cargando catálogo...</ThemedText>
        </View>
      )}
      {/* ── ESTADO: ERROR DE CARGA ───────────────────────────────────────── */}
      {!loading && errorMessage ? (
        <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
      ) : null}
      {/* ── ESTADO: SIN RESULTADOS ───────────────────────────────────────── */}
      {!loading && !errorMessage && !hasProductos ? (
        <ThemedText style={styles.emptyText}>No hay productos para mostrar.</ThemedText>
      ) : null}
    </>
  );

  // ── SUBCOMPONENTE: ListFooter ─────────────────────────────────────────────
  // Se renderiza al final del FlatList. Muestra la paginación si hay más de 1 página.
  // Si solo hay 1 página, agrega un espacio vacío para que el último producto no quede
  // pegado al borde inferior de la pantalla.
  const ListFooter = () =>
    !loading && hasProductos && totalPaginas > 1 ? (
      <View style={styles.paginacionRow}>
        {/* Botón "Anterior": desactivado en la primera página */}
        <Pressable
          style={[styles.pagBtn, paginaActual === 1 && styles.pagBtnDisabled]}
          onPress={() => setPaginaActual((p) => Math.max(1, p - 1))} // No baja de la página 1.
          disabled={paginaActual === 1}>
          <Ionicons name="chevron-back" size={15} color={paginaActual === 1 ? '#d1d5db' : '#a57c63'} />
          <ThemedText style={[styles.pagBtnText, paginaActual === 1 && styles.pagBtnTextDisabled]}>
            Anterior
          </ThemedText>
        </Pressable>
        {/* Indicador de página actual / total de páginas */}
        <ThemedText style={styles.pagInfo}>
          {String(paginaActual)} / {String(totalPaginas)}
        </ThemedText>
        {/* Botón "Siguiente": desactivado en la última página */}
        <Pressable
          style={[styles.pagBtn, paginaActual === totalPaginas && styles.pagBtnDisabled]}
          onPress={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))} // No supera el total.
          disabled={paginaActual === totalPaginas}>
          <ThemedText style={[styles.pagBtnText, paginaActual === totalPaginas && styles.pagBtnTextDisabled]}>
            Siguiente
          </ThemedText>
          <Ionicons name="chevron-forward" size={15} color={paginaActual === totalPaginas ? '#d1d5db' : '#a57c63'} />
        </Pressable>
      </View>
    ) : (
      // Sin paginación: espacio vacío al final de la lista.
      <View style={{ height: 24 }} />
    );

  // ── FUNCIÓN: renderProducto ───────────────────────────────────────────────
  // FlatList llama esta función por cada ítem de productosVisibles.
  // Recibe { item: producto, index } y devuelve el JSX de la tarjeta.
  const renderProducto = ({ item: producto, index }: { item: any; index: number }) => (
    <View
      style={[
        styles.card,
        // Aplica margen para separar columnas:
        //   columna izquierda (índice par) → margen derecho
        //   columna derecha (índice impar) → margen izquierdo
        index % 2 === 0 ? { marginRight: CARD_GAP / 2 } : { marginLeft: CARD_GAP / 2 },
      ]}>
      {/* Imagen del producto: buildImageUrl construye la URL completa */}
      <Image
        source={{ uri: catalogoService.buildImageUrl(producto.imagen) }}
        style={styles.cardImage}
        resizeMode="cover" // Recorta la imagen para que llene el espacio sin deformarse.
      />
      {/* Badge de categoría superpuesto sobre la imagen (position: absolute) */}
      <View style={styles.cardBadge}>
        <ThemedText style={styles.cardBadgeText} numberOfLines={1}>
          {producto.Categoria?.nombre || producto.categoria?.nombre || 'Sin categoría'}
        </ThemedText>
      </View>
      {/* Cuerpo de la tarjeta: nombre, precio y botones */}
      <View style={styles.cardBody}>
        {/* numberOfLines={2}: el nombre se trunca a 2 líneas máximo */}
        <ThemedText style={styles.cardNombre} numberOfLines={2}>
          {producto.nombre}
        </ThemedText>
        {/* Precio formateado en pesos colombianos */}
        <ThemedText style={styles.cardPrecio}>
          ${Number(producto.precio || 0).toLocaleString('es-CO')}
        </ThemedText>
        {/* Fila de botones: "Ver" (detalle) y carrito */}
        <View style={styles.cardActions}>
          {/* Botón "Ver": abre el modal de detalle con este producto */}
          <Pressable style={styles.outlineBtn} onPress={() => setProductoDetalle(producto)}>
            <ThemedText style={styles.outlineBtnText}>Ver</ThemedText>
          </Pressable>
          {/* Botón del carrito: agrega directamente 1 unidad */}
          <Pressable style={styles.cartBtn} onPress={() => handleAgregarAlCarrito(producto)}>
            <Ionicons name="cart" size={16} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );

  // ── RENDERIZADO PRINCIPAL ────────────────────────────────────────────────
  return (
    // Fragment (<>) para envolver FlatList + Modal sin agregar un View extra.
    <>
      {/* ── FLATLIST: LISTA PRINCIPAL DE PRODUCTOS ─────────────────────── */}
      <FlatList
        // data: cuando está cargando o no hay productos, pasa array vacío para no
        //       renderizar ítems, pero sí muestra ListHeader (con el spinner).
        data={loading || !hasProductos ? [] : productosVisibles}
        // keyExtractor: identificador único por ítem, necesario para que React
        //               pueda optimizar el renderizado de la lista.
        keyExtractor={(item: any) => String(item.id)}
        // numColumns: muestra los productos en 2 columnas.
        numColumns={2}
        // renderItem: función que genera el JSX de cada producto.
        renderItem={renderProducto}
        // ListHeaderComponent: componente fijo al inicio de la lista (hero, buscador, etc.).
        ListHeaderComponent={<ListHeader />}
        // ListFooterComponent: componente fijo al final de la lista (paginación).
        ListFooterComponent={<ListFooter />}
        // contentContainerStyle: padding horizontal y padding inferior de toda la lista.
        contentContainerStyle={styles.content}
        // refreshControl: habilita el "pull to refresh" (tirar hacia abajo para actualizar).
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadCatalogo({ isRefresh: true })}
            colors={['#a57c63']}     // Color del spinner en Android.
            tintColor="#a57c63"      // Color del spinner en iOS.
          />
        }
      />

      {/* ── MODAL: DETALLE DEL PRODUCTO ─────────────────────────────────── */}
      {/* visible: true cuando productoDetalle tiene datos (Boolean convierte a boolean). */}
      {/* animationType="slide": el modal sube desde la parte inferior de la pantalla. */}
      <Modal
        visible={Boolean(productoDetalle)}
        transparent                          // El fondo semitransparente se ve detrás.
        animationType="slide"
        onRequestClose={() => setProductoDetalle(null)}> {/* Cierra con el botón "atrás" de Android */}
        {/* Fondo semitransparente negro que cubre toda la pantalla */}
        <View style={styles.modalBackdrop}>
          {/* Tarjeta blanca con esquinas superiores redondeadas */}
          <ThemedView style={styles.modalCard}>
            {/* Solo renderiza el contenido si productoDetalle tiene datos */}
            {productoDetalle ? (
              <>
                {/* Imagen grande del producto */}
                <Image
                  source={{ uri: catalogoService.buildImageUrl(productoDetalle.imagen) }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
                {/* Categoría del producto en texto pequeño índigo */}
                <ThemedText style={styles.modalCategoria}>
                  {productoDetalle.Categoria?.nombre || 'Sin categoría'}
                </ThemedText>
                {/* Nombre del producto en grande */}
                <ThemedText style={styles.modalTitle}>{productoDetalle.nombre}</ThemedText>
                {/* Descripción o texto fallback si no hay descripción */}
                <ThemedText style={styles.modalDesc}>
                  {productoDetalle.descripcion || 'Sin descripción disponible.'}
                </ThemedText>
                {/* Precio formateado en pesos colombianos */}
                <ThemedText style={styles.modalPrecio}>
                  ${Number(productoDetalle.precio || 0).toLocaleString('es-CO')}
                </ThemedText>
                {/* Fila de stock disponible con ícono */}
                <View style={styles.modalStock}>
                  <Ionicons name="cube-outline" size={14} color="#6b7280" />
                  <ThemedText style={styles.modalStockText}>
                    {/* ?? 'N/A': muestra N/A si stock es null o undefined */}
                    Stock disponible: {productoDetalle.stock ?? 'N/A'} unidades
                  </ThemedText>
                </View>
                {/* Fila de botones del modal */}
                <View style={styles.modalActions}>
                  {/* Botón "Cerrar": cierra el modal limpiando productoDetalle */}
                  <Pressable
                    style={[styles.outlineBtn, { flex: 1, paddingVertical: 12 }]}
                    onPress={() => setProductoDetalle(null)}>
                    <ThemedText style={styles.outlineBtnText}>Cerrar</ThemedText>
                  </Pressable>
                  {/* Botón "Agregar al carrito": agrega y cierra el modal */}
                  <Pressable
                    style={[styles.primaryBtn, { flex: 2, paddingVertical: 12 }]}
                    onPress={async () => {
                      await handleAgregarAlCarrito(productoDetalle); // Agrega al carrito.
                      setProductoDetalle(null);                      // Cierra el modal.
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

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Padding horizontal del FlatList + padding inferior para que el último producto
  // no quede pegado al borde de la pantalla.
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  // ── HERO ──────────────────────────────────────────
  // Tarjeta índigo con bordes muy redondeados que actúa como banner principal.
  hero: {
    borderRadius: 24,
    padding: 22,
    // backgroundColor kept as fallback if image fails to load
    backgroundColor: '#a57c63',
    marginTop: 16,
    marginBottom: 16,
    gap: 10,                    // Espacio entre cada hijo directo.
  },
  // Overlay semi-transparente para mejorar la legibilidad del texto sobre la imagen
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.28)'
  },
  // Etiqueta pequeña en mayúsculas con espaciado de letras (tracking).
  heroLabel: {
    color: '#f3e6d8',
    letterSpacing: 1.4,
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,             // Interlineado para texto de 2 líneas.
  },
  heroSubtitle: {
    color: '#f9f6f2',
    fontSize: 14,
    lineHeight: 21,
  },
  // Fila horizontal de las 3 estadísticas.
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  // Caja individual de estadística: fondo blanco semitransparente.
  heroStat: {
    flex: 1,                                         // Cada stat ocupa el mismo ancho.
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    gap: 2,
  },
  heroStatValue: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 20,
  },
  heroStatLabel: {
    color: '#f3e6d8',
    fontSize: 11,
  },

  // ── CARACTERÍSTICAS ───────────────────────────────
  // Contenedor del scroll horizontal de tarjetas de características.
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 4,
    marginBottom: 16,
  },

  // ── SERVICIOS ─────────────────────────────────────────────────────
  servicesSection: {
    marginBottom: 16,
    gap: 10,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#7b6758',
    marginTop: -4,
  },
  servicesRow: {
    gap: 12,
    paddingRight: 4,
  },
  serviceCard: {
    width: 220,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#efe6dc',
    overflow: 'hidden',
    shadowColor: '#a57c63',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  serviceImage: {
    width: '100%',
    height: 120,
  },
  serviceBody: {
    padding: 12,
    gap: 8,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#3e2f25',
  },
  serviceDesc: {
    fontSize: 12,
    color: '#7b6758',
    lineHeight: 17,
  },
  serviceMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: '#f3e6d8',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  serviceMetaText: {
    color: '#a57c63',
    fontSize: 11,
    fontWeight: '700',
  },
  // Cada tarjeta de característica: sombra sutil; el ancho se aplica inline.
  featureCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#efe6dc',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 6,
  },
  // Círculo de color que contiene el ícono de la característica.
  // El color de fondo se aplica inline con el campo 'bg' de FEATURES.
  featureIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,           // Mitad del ancho/alto = círculo perfecto.
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontWeight: '700',
    fontSize: 13,
    color: '#3e2f25',
  },
  featureDesc: {
    fontSize: 11,
    color: '#7b6758',
  },

  // ── BUSCADOR ──────────────────────────────────────
  // Contenedor del campo de búsqueda: fila con ícono + input + botón limpiar.
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e4d8cb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
    shadowColor: '#a57c63',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  // El input ocupa todo el ancho disponible (flex:1) entre los íconos.
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111',
    padding: 0,                 // Elimina el padding por defecto en Android.
  },

  // ── CHIPS ─────────────────────────────────────────
  // Contenedor del scroll horizontal de chips de categorías.
  chipsRow: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: 16,
  },
  // Chip inactivo: borde gris, fondo blanco.
  chip: {
    borderRadius: 999,          // Cápsula perfecta (border-radius muy alto).
    borderWidth: 1.5,
    borderColor: '#d8c5b2',
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  // Chip activo: fondo y borde índigo (se aplica junto a 'chip').
  chipActive: {
    backgroundColor: '#a57c63',
    borderColor: '#a57c63',
  },
  chipText: {
    color: '#5f4638',
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#fff',              // Texto blanco cuando el chip está activo.
  },

  // ── ENCABEZADO SECCIÓN ────────────────────────────
  // Fila "Productos Disponibles" + contador de resultados.
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3e2f25',
  },
  sectionCount: {
    fontSize: 12,
    color: '#7b6758',
  },

  // ── TARJETA PRODUCTO ──────────────────────────────
  // Tarjeta individual de producto con ancho calculado para 2 columnas.
  card: {
    width: CARD_WIDTH,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#a57c63',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginBottom: 10,
    overflow: 'hidden',         // El badge y la imagen respetan los bordes redondeados.
  },
  // Imagen de portada del producto (ocupa todo el ancho de la tarjeta).
  cardImage: {
    width: '100%',
    height: 130,
  },
  // Badge de categoría superpuesto en la esquina superior izquierda de la imagen.
  cardBadge: {
    position: 'absolute',       // Se posiciona sobre la imagen.
    top: 8,
    left: 8,
    backgroundColor: 'rgba(165,124,99,0.86)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  cardBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase', // Texto en mayúsculas.
    letterSpacing: 0.3,
  },
  // Área de texto de la tarjeta (debajo de la imagen).
  cardBody: {
    padding: 10,
    gap: 4,
  },
  cardNombre: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3e2f25',
    lineHeight: 18,
  },
  cardPrecio: {
    fontSize: 15,
    fontWeight: '800',
    color: '#a57c63',
    marginTop: 2,
  },
  // Fila de botones: "Ver" y carrito.
  cardActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },

  // ── BOTONES ───────────────────────────────────────
  // Botón outline: solo borde, sin relleno.
  outlineBtn: {
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#a57c63',
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    color: '#a57c63',
    fontWeight: '700',
    fontSize: 12,
  },
  // Botón del carrito: relleno índigo, ocupa el espacio restante (flex:1).
  cartBtn: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#a57c63',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
  },
  // Botón primario relleno con ícono + texto en fila.
  primaryBtn: {
    borderRadius: 8,
    backgroundColor: '#a57c63',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // ── ESTADOS ───────────────────────────────────────
  // Centrado para spinner de carga (dentro del ListHeader).
  centered: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  errorText: {
    color: '#ef4444',           // Rojo para mensajes de error.
    textAlign: 'center',
    marginVertical: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',           // Gris para estado vacío.
    marginVertical: 24,
    fontSize: 14,
  },

  // ── PAGINACIÓN ────────────────────────────────────
  // Fila de botones Anterior / Página / Siguiente.
  paginacionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  // Botón de paginación activo: borde índigo.
  pagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#a57c63',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  // Sobreescribe el borde cuando el botón está deshabilitado.
  pagBtnDisabled: {
    borderColor: '#d1d5db',     // Gris cuando está deshabilitado.
  },
  pagBtnText: {
    color: '#a57c63',
    fontWeight: '600',
    fontSize: 13,
  },
  pagBtnTextDisabled: {
    color: '#9ca3af',           // Gris cuando está deshabilitado.
  },
  pagInfo: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 14,
  },

  // ── MODAL ─────────────────────────────────────────
  // Fondo semitransparente oscuro que cubre toda la pantalla.
  // justifyContent: 'flex-end' posiciona la tarjeta en la parte inferior.
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  // Tarjeta blanca del modal con bordes superiores redondeados (sheet style).
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    gap: 10,
    backgroundColor: '#fff',
  },
  // Imagen grande del producto en el modal.
  modalImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
  },
  // Nombre de la categoría en pequeño sobre el título.
  modalCategoria: {
    fontSize: 11,
    color: '#a57c63',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 28,
  },
  modalDesc: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 21,
  },
  // Precio grande índigo en el modal.
  modalPrecio: {
    fontSize: 24,
    fontWeight: '800',
    color: '#a57c63',
  },
  // Fila de stock: ícono + texto.
  modalStock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalStockText: {
    fontSize: 13,
    color: '#6b7280',
  },
  // Fila de botones del modal: Cerrar + Agregar al carrito.
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 8,
  },
});
