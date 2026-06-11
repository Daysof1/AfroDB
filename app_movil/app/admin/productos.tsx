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
      fetchProductos(1, text); // Búsqueda en tiempo real
    }}
    style={styles.input}
  />

  {busqueda.trim().length > 0 && (
    <Pressable
      style={styles.clearBtn}
      onPress={() => {
        setBusqueda('');
        fetchProductos(1, '');
      }}
    >
      <ThemedText style={styles.searchBtnText}>X</ThemedText>
    </Pressable>
  )}

  <Pressable
    style={styles.searchBtn}
    onPress={() => fetchProductos(1, busqueda)} // Búsqueda al presionar el botón
  >
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
            <Pressable
              style={styles.cardHeader}
              onPress={() => pushParams('/admin/producto-form', { producto: JSON.stringify(item) })}
            >
              <Image
                source={{ uri: item.imagen ? catalogoService.buildImageUrl(item.imagen) : 'https://via.placeholder.com/80' }}
                style={styles.image}
              />
              <View style={styles.cardBody}>
                <ThemedText type="defaultSemiBold">{item.nombre}</ThemedText>
                <ThemedText numberOfLines={2} style={styles.description}>{item.descripcion || 'Sin descripción'}</ThemedText>
                <View style={styles.priceRow}>
                  <ThemedText style={styles.price}>${Number(item.precio || 0).toLocaleString('es-CO')}</ThemedText>
                  <ThemedText style={styles.meta}>{item.activo ? 'Activo' : 'Inactivo'}</ThemedText>
                </View>
                <ThemedText style={styles.meta}>Stock: {item.stock}</ThemedText>
              </View>
            </Pressable>

            {isAdmin && (
              <View style={styles.actionsRow}>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: item.activo ? '#7c452a' : '#b87a5a' }]}
                  onPress={async () => {
                    try {
                      if (item.activo) {
                        await desactivarProducto(item.id || item.id);
                      } else {
                        await activarProducto(item.id || item.id);
                      }
                      fetchProductos(pagina, busqueda);
                    } catch {
                      Alert.alert('Error', 'No se pudo cambiar el estado');
                    }
                  }}
                >
                  <ThemedText style={styles.actionBtnText}>{item.activo ? 'Desactivar' : 'Activar'}</ThemedText>
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
  container: { flex: 1, padding: 16, gap: 10, backgroundColor: '#f9f6f2' },
  centered: { alignItems: 'center', gap: 10, marginVertical: 20 },
  error: { color: '#b87a5a' },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#d6c7ae', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff' },
  searchBtn: { backgroundColor: '#b87a5a', borderRadius: 14, paddingHorizontal: 16, justifyContent: 'center'},
  clearBtn: { backgroundColor: '#b87a5a', borderRadius: 14, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700' },
  createBtn: { backgroundColor: '#b87a5a', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
  createBtnText: { color: '#fff', fontWeight: '700' },
  list: { flex: 1 },
  card: { borderRadius: 18, padding: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6d3b3', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  actionBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, marginBottom: 2 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  image: { width: 84, height: 84, borderRadius: 14, backgroundColor: '#f3e6d8' },
  cardBody: { flex: 1, gap: 6 },
  description: { color: '#5f4a39', fontSize: 13, lineHeight: 18 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 6 },
  price: { fontWeight: '800', fontSize: 16, color: '#3e2f25' },
  meta: { color: '#7b6758', fontSize: 13 },
  paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  pageBtn: { padding: 10, borderRadius: 10, backgroundColor: '#e6d3b3' },
  pageBtnText: { fontWeight: '700', color: '#3e2f25' },
  pageLabel: { fontWeight: '700' },
});

