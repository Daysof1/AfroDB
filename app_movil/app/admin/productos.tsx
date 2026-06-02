/**
 * Este archivo gestion de produtos panel de administacion
 * lista de todos los productos del sistema con iamgen descripcion y stado
 * permite buscar en tiemp resl y nsvegs entre psginsd 10 por pagina
 * product-form con los datos de editar
 * al precionar el producto navega a sus caracteristicas y edicion
 * solo administradores isAdmin pueden actiivar desactivar y eliminar productos
 * el auxiliar solo puede ver y navegar
 */

// manejo de variables de estado local
import { useEffect, useState } from "react";
//Importar componentes 
//Dimensions optiene al ancho y alto de la pantalla para hacer diseos responsivos
//flatlist lista optimizada con virtualizacion para mostrar grandes cantidades de datos
//modal mostrar detalles de contenido en ventanas emergentes

import { ActivityIndicator, Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, TextInput, View} from "react-native";
import catalogoService from '../../src/services/catalogoService';

//Lee los parametros de la url para obtener el id del pedido
import { router } from "expo-router";//navegacion y parametros de ruta
import { ThemedText } from '../../components/themed-text';

import  apiClient  from '../../src/api/apiClient';
import { activarProducto, desactivarProducto, deleteProduct } from '../../src/services/adminService';
import { useAuth } from "../../src/context/AuthContext";
/**
 * tipo de producto
 * estrucura del producto recibido tal como viene del backend
 */

type Producto = {
    id?: string;
    nombre?: string;
    descripcion?: string;
    precio?: number;
    stock?: number;
    imagen?: string;
    activo?: boolean;
};

type AuthUser = { rol?: string };

/**
 * helpers de navegacion
 * cats de router para navegar con strings simple sin parametros 
 */
const push = (path: string) => 
(router as unknown as { push: (p: string) => void }).push(path);

//cast de router para navegar con pathname + parms (para pasar el objeto a producto)
const pushParams = (pathname: string, params: Record<string, string>) => 
(router as unknown as { push : (p: {pathname: string; params: Record<string, string> }) => void }).push({ pathname, params });

export default function AdminProductosScreen() {
    /**
     * contexto de autennticacionn
     */
    const { user } = useAuth() as { user: AuthUser | null };
    /**
     * Estado local
     */
    const [productos, setProductos] = useState<Producto[]>([]);// prodtctos en la pagina actual
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [ busqueda, setBusqueda] = useState('');
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    /**
     * Funcion fetchProductos
     * consulta get / admin/productos con filtro de busqueda y paginacion
     */

    const fetchProductos = async (page = 1, search = '') => {
        setLoading(true);
        setErrorMessage('');
        try {
            const params: string[] = [];
            if (search.trim()) params.push(`buscar=${encodeURIComponent(search.trim())}`);
            params.push(`pagina=${page}`);
            params.push(`limite=10`);
            const url = `/admin/productos?${params.join('&')}`;
            const res = await apiClient.get(url);
            const productosData: Producto[] = res.data?.data?.productos || [];
            setProductos(productosData);
            setPagina(page);
            setTotalPaginas(res.data?.data?.paginacion?.totalPaginas || 1);
        } catch (error: unknown) {
            setErrorMessage((error as { message?: string })?.message || 'Error al cargar productos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductos(1, '');
    }, []);

    // avanza y retrocede paginas
    const handlePagina = (next: number) => {
        const nuevaPagina = Math.max(1, Math.min(totalPaginas, pagina + next));
        fetchProductos(nuevaPagina, busqueda);
    };

    const isAdmin = user?.rol === 'administrador';

    
  // ── RENDERIZADO ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Título de la pantalla */}
      <ThemedText type="title">Productos</ThemedText>

      {/* ── BARRA DE BÚSQUEDA ──────────────────────────────────────────── */}
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Buscar producto..."
          value={busqueda}
          onChangeText={(text) => {
            setBusqueda(text);
            fetchProductos(1, text); // Búsqueda en tiempo real: resetea a página 1.
          }}
          style={styles.input}
        />
        <Pressable style={styles.searchBtn} onPress={() => fetchProductos(1, busqueda)}>
          <ThemedText style={styles.searchBtnText}>Buscar</ThemedText>
        </Pressable>
      </View>

      {/* Botón para crear un nuevo producto: navega al formulario vacío */}
      <Pressable style={styles.createBtn} onPress={() => push('/admin/producto-form')}>
        <ThemedText style={styles.createBtnText}>+ Crear producto</ThemedText>
      </Pressable>

      {/* Spinner de carga */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <ThemedText>Cargando productos...</ThemedText>
        </View>
      ) : null}

      {/* Mensaje de error */}
      {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}

      {/* ── LISTA DE PRODUCTOS ──────────────────────────────────────────── */}
      <FlatList
        data={productos}
        keyExtractor={(item) => String(item.id || item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Área izquierda: imagen + datos del producto (presionable para editar) */}
            <Pressable
              style={{ flex: 1, flexDirection: 'row', gap: 10 }}
              // Navega al formulario de edición pasando el objeto producto serializado como JSON.
              // JSON.stringify convierte el objeto a string para pasarlo como parámetro de ruta.
              onPress={() => pushParams('/admin/producto-form', { producto: JSON.stringify(item) })}
            >
              {/* Miniatura del producto. Si no tiene imagen usa un placeholder externo. */}
              <Image
                source={{ uri: item.imagen ? catalogoService.buildImageUrl(item.imagen) : 'https://via.placeholder.com/70' }}
                style={styles.image}
              />
              <View style={styles.cardBody}>
                {/* Nombre del producto */}
                <ThemedText type="defaultSemiBold">{item.nombre}</ThemedText>
                {/* Descripción: máximo 2 líneas para no romper el layout */}
                <ThemedText numberOfLines={2}>{item.descripcion || 'Sin descripcion'}</ThemedText>
                {/* Precio formateado en COP */}
                <ThemedText style={styles.price}>${Number(item.precio || 0).toLocaleString('es-CO')}</ThemedText>
                {/* Estado activo/inactivo y stock disponible */}
                <ThemedText style={styles.meta}>{item.activo ? 'Activo' : 'Inactivo'} | Stock: {item.stock}</ThemedText>
              </View>
            </Pressable>

            {/* ── BOTONES DE ACCIÓN (solo admin) ──────────────────────── */}
            {isAdmin && (
              <View style={styles.actionsRow}>
                {/* Botón Activar/Desactivar: color dinámico según estado actual */}
                <Pressable
                  // Rojo si está activo (para desactivar), verde si está inactivo (para activar).
                  style={[styles.actionBtn, { backgroundColor: item.activo ? '#b93a32' : '#218f4c' }]}
                  onPress={async () => {
                    try {
                      if (item.activo) {
                        await desactivarProducto(item.id || item.id); // Oculta del catálogo público.
                      } else {
                        await activarProducto(item.id || item.id);    // Hace visible en el catálogo.
                      }
                      fetchProductos(pagina, busqueda); // Recarga para reflejar el cambio.
                    } catch {
                      Alert.alert('Error', 'No se pudo cambiar el estado');
                    }
                  }}
                >
                  <ThemedText style={styles.actionBtnText}>{item.activo ? 'Desactivar' : 'Activar'}</ThemedText>
                </Pressable>

                {/* Botón Eliminar: siempre rojo. Pide confirmación antes de ejecutar. */}
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: '#b93a32' }]}
                  onPress={() => {
                    // Alert con dos opciones: Cancelar (seguro) o Eliminar (destructivo).
                    Alert.alert('Eliminar producto', 'Estas seguro de eliminar este producto?', [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Eliminar',
                        style: 'destructive', // En iOS pone el texto en rojo automáticamente.
                        onPress: async () => {
                          try {
                            await deleteProduct(item.id || item.id); // DELETE al backend.
                            fetchProductos(pagina, busqueda);          // Recarga la lista.
                          } catch {
                            Alert.alert('Error', 'No se pudo eliminar');
                          }
                        },
                      },
                    ]);
                  }}
                >
                  <ThemedText style={styles.actionBtnText}>Eliminar</ThemedText>
                </Pressable>
              </View>
            )}
          </View>
        )}
        // Estado vacío: solo se muestra si no hay carga ni error activos.
        ListEmptyComponent={!loading && !errorMessage ? <ThemedText>No hay productos.</ThemedText> : null}
        style={styles.list}
      />

      {/* ── PAGINACIÓN ──────────────────────────────────────────────────── */}
      <View style={styles.paginationRow}>
        <Pressable style={styles.pageBtn} onPress={() => handlePagina(-1)} disabled={pagina <= 1}>
          <ThemedText style={styles.pageBtnText}>{'<'}</ThemedText>
        </Pressable>
        <ThemedText style={styles.pageLabel}>Pagina {pagina} de {totalPaginas}</ThemedText>
        <Pressable style={styles.pageBtn} onPress={() => handlePagina(1)} disabled={pagina >= totalPaginas}>
          <ThemedText style={styles.pageBtnText}>{'>'}</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Contenedor raíz: ocupa toda la pantalla, padding + gap entre elementos.
  container: { flex: 1, padding: 16, gap: 10 },
  centered: { alignItems: 'center', gap: 10, marginVertical: 20 },
  error: { color: '#b93a32' },
  // Fila de búsqueda: input expandible + botón fijo a la derecha.
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#d5d5d5', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#fff' },
  searchBtn: { backgroundColor: '#0a7ea4', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700' },
  // Botón verde para crear nuevo producto.
  createBtn: { backgroundColor: '#218f4c', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 8 },
  createBtnText: { color: '#fff', fontWeight: '700' },
  // La lista ocupa todo el espacio disponible entre los controles superiores e inferiores.
  list: { flex: 1 },
  // Tarjeta de producto: fila horizontal con imagen, datos y botones de acción.
  card: { flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 12, padding: 10, backgroundColor: '#fff', marginBottom: 8, alignItems: 'center' },
  // Columna de botones a la derecha de la tarjeta.
  actionsRow: { flexDirection: 'column', gap: 6, marginLeft: 8 },
  // Botón de acción pequeño: el color de fondo se aplica inline.
  actionBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginBottom: 2 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  // Imagen cuadrada redondeada del producto.
  image: { width: 70, height: 70, borderRadius: 10 },
  // Área de texto: ocupa el espacio restante entre la imagen y los botones.
  cardBody: { flex: 1, gap: 2 },
  price: { fontWeight: '700', marginTop: 2 },
  // Estado y stock en gris secundario.
  meta: { color: '#666', fontSize: 12 },
  // Paginación centrada con botones grises.
  paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  pageBtn: { padding: 8, borderRadius: 8, backgroundColor: '#e8e8e8' },
  pageBtnText: { fontWeight: '700' },
  pageLabel: { fontWeight: '700' },
});

