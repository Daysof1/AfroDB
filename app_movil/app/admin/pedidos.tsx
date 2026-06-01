/**
 * Este archivo y pantalla es la lista e pedido en panel de administrador
 * mustra todos los pedidos del sistema en una lista paginada (de 10 por pagina)
 * permite buscar pedidos por texto en tiempo real mientras escribe
 * al presionar un pedido navega  admin/pedido/[id] para ver el detalle 
 * solo para rol de admin y auxiar
 */

// manejo de variables de estado local
import { useState, useEffect } from "react";
//Importar componentes 
//Dimensions optiene al ancho y alto de la pantalla para hacer diseos responsivos
//flatlist lista optimizada con virtualizacion para mostrar grandes cantidades de datos
//modal mostrar detalles de contenido en ventanas emergentes

import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

//Lee los parametros de la url para obtener el id del pedido
import { router } from "expo-router";
//themedText : texto que aplica colores del tema del dispositivo de manera automatica claro u oscuro
import { ThemedText } from '../../components/themed-text';
//ciente http axios con JWT
import apiClient from '../../src/api/apiClient';

/**
 * TIPOS
 * representa un item de la lista de productos del pedido
 * todos los campos son opcionales ? porque el backend puede evitarlos todos 
 */

// representa el pedido completo tal como lo devuelve el backend
type Pedido = {
    id: string;
    estado?: string;
    total?: number;
    usuario?: {
        nombre?: string;
        apellido?: string;
    };
};

/**
 * Componnete principal
 * 
 */
export default function AdminPedidoScreen() {
    /**
     * parametro de ruta
     * useLocalSearchParams lee los segmentos dinamicos de la url
     */

    //estado local 
    const [pedidos, setPedidos] = useState<Pedido[]>([]);// Array de pedidos de la pagina actual
    const [loading, setLoading] = useState(true);//activo mientras se hace la peticion api
    const [errorMessage, setErrorMessage] = useState(''); //Mensaje de error si falla la carga
    const [busqueda, setBusqueda] = useState(''); //texto actual de la busqueda
    const [pagina, setPagina] = useState(1); //pagina actual es la 1
    const [totalPaginas, setTotalPaginas] = useState(1); //total de paginas devuelto por el backend

    /**
     * funcion fetchPedido
     * llama el endpoint get/admin/pedidos con paramteros de busqueda y paginacion
     * page numero de la pagina a cargar
     * search texto de busqueda default si la cadena va vacia carga todos los pedidos
     */

    const fetchPedidos = async (page = 1, search = '') => {
        setLoading(true); //muestra el spinner 
        setErrorMessage('');
        try {
            //construye el query del strimng dinamicamente
            const params: string[] = [];
            if (search.trim()) params.push(`buscar=${encodeURIComponent(search.trim())}`);//codifica los carateres especiales en la busqueda
            params.push(`pagina=${page}`);// numero de la pagina
            params.push('limite=10');// 10 pedidos por pagina
            const url = `/admin/pedidos?${params.join('&')}`; //construye la url completa  con los parametros
            //peticion get autenticada el token JWT lo agrega el apiClient automaticamente
            const res = await apiClient.get(url);
            // extrar los pedidos de array
            const pedidosData: Pedido[] = res.data?.data?.pedidos || [];
            // la respuesta tiene estructura { data : data: { pedido...}}
            //el operador ? evita errores si algun nivel es undefined 
            setPedidos(pedidosData); //actualiza el estado con los pedidos obtenidos
            setPagina
            (page);
            //actualiza la pagina actual a medida que se va escribindo
            setTotalPaginas(res.data?.data?.paginacion?.totalPaginas || 1);
        }   catch (error: unknown) {
            //si la peticion falla guarda el mensaje de error para mostrarlo en pantalla
            setErrorMessage((error as { message?: string })?.message || 'no se pudo cargar el pedido');
        } finally {
            setLoading(false);//oculta el spinner siempre que haya un error o no
        }
    };

    /**
     * efecto de carga inicial
     * se ejecuta cad vez que cambie el parametro id de la url 
     * en la practica solo se ejecuta el montar porque no se navega entre id diferentes 
     */

    useEffect(() => {
        fetchPedidos(1, '');
    }, []);

    /**
     * Funcion handlePagina
     * avanza o retrocede la pagina actual
     * next +1 para siguiente -1 para abterior
     * Math.max y Math.min evitan ir mas alla de los limites de pagina disponibles
     */

    const handlePagina = (next: number) => {
        const nueva = Math.max(1, Math.min(totalPaginas, pagina + next));
        fetchPedidos(nueva, busqueda);//recarga con la nueva pagina pero conserva el filtro
    };

     // ── RENDERIZADO ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Título de la pantalla */}
      <ThemedText type="title">Pedidos</ThemedText>

      {/* ── BARRA DE BÚSQUEDA ──────────────────────────────────────────── */}
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Buscar pedido..."
          value={busqueda}
          onChangeText={(text) => {
            setBusqueda(text);          // Actualiza el estado del texto.
            fetchPedidos(1, text);      // Búsqueda en tiempo real: resetea a página 1 con el nuevo texto.
          }}
          style={styles.input}
        />
        {/* Botón de búsqueda manual (por si el usuario prefiere no buscar en tiempo real) */}
        <Pressable style={styles.searchBtn} onPress={() => fetchPedidos(1, busqueda)}>
          <ThemedText style={styles.searchBtnText}>Buscar</ThemedText>
        </Pressable>
      </View>

      {/* Spinner: visible mientras se cargan los pedidos */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <ThemedText>Cargando pedidos...</ThemedText>
        </View>
      ) : null}

      {/* Mensaje de error: visible si la petición falló */}
      {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}

      {/* ── LISTA DE PEDIDOS ────────────────────────────────────────────── */}
      <FlatList
        data={pedidos}                                              // Array de pedidos de la página actual.
        keyExtractor={(item) => String(item.id || item.id)}       // ID único para cada fila.
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            // Al presionar, navega a la pantalla de detalle con el ID del pedido.
            // Se usa el mismo cast de router que en otros archivos admin.
            onPress={() =>
              (router as unknown as { push: (p: { pathname: string; params: Record<string, string> }) => void }).push({
                pathname: '/admin/pedidos/[id]', // Ruta dinámica.
                params: { id: String(item.id || item.id) }, // El ID se pasa como parámetro de ruta.
              })
            }
          >
            <View style={styles.cardBody}>
              {/* Número del pedido: se usa _id (MongoDB) o id como fallback */}
              <ThemedText type="defaultSemiBold">Pedido #{item.id || item.id}</ThemedText>
              {/* Nombre completo del cliente que realizó el pedido */}
              <ThemedText>Cliente: {item.usuario?.nombre} {item.usuario?.apellido}</ThemedText>
              {/* Estado actual del pedido */}
              <ThemedText>Estado: {item.estado}</ThemedText>
              {/* Total formateado en pesos colombianos */}
              <ThemedText style={styles.meta}>Total: ${Number(item.total || 0).toLocaleString('es-CO')}</ThemedText>
            </View>
          </Pressable>
        )}
        // Componente que se muestra cuando no hay pedidos y no hay carga ni error activos.
        ListEmptyComponent={!loading && !errorMessage ? <ThemedText>No hay pedidos.</ThemedText> : null}
        style={styles.list}
      />

      {/* ── PAGINACIÓN ──────────────────────────────────────────────────── */}
      {/* Fila con botones < y > y el contador "Página X de Y". */}
      <View style={styles.paginationRow}>
        {/* Botón anterior: deshabilitado si estamos en la primera página */}
        <Pressable style={styles.pageBtn} onPress={() => handlePagina(-1)} disabled={pagina <= 1}>
          <ThemedText style={styles.pageBtnText}>{'<'}</ThemedText>
        </Pressable>
        <ThemedText style={styles.pageLabel}>Página {pagina} de {totalPaginas}</ThemedText>
        {/* Botón siguiente: deshabilitado si estamos en la última página */}
        <Pressable style={styles.pageBtn} onPress={() => handlePagina(1)} disabled={pagina >= totalPaginas}>
          <ThemedText style={styles.pageBtnText}>{'>'}</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Contenedor principal: ocupa toda la pantalla con padding interno.
  container: { flex: 1, padding: 16, gap: 10 },
  // Centrado para spinner de carga.
  centered: { alignItems: 'center', gap: 10, marginVertical: 20 },
  // Color rojo para mensajes de error.
  error: { color: '#b93a32' },
  // Fila de búsqueda: input flexible + botón a la derecha.
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  // Campo de texto: ocupa el espacio disponible (flex:1), borde gris, fondo blanco.
  input: { flex: 1, borderWidth: 1, borderColor: '#d5d5d5', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#fff' },
  // Botón de búsqueda: azul petróleo.
  searchBtn: { backgroundColor: '#0a7ea4', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700' },
  // La lista ocupa todo el espacio vertical disponible entre la búsqueda y la paginación.
  list: { flex: 1 },
  // Tarjeta de pedido: borde gris sutil, bordes redondeados, fondo blanco.
  card: { borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 12, padding: 10, backgroundColor: '#fff', marginBottom: 8 },
  cardBody: { flex: 1 },
  // Estilo secundario para el total (gris y más pequeño).
  meta: { color: '#888', fontSize: 13 },
  // Fila de paginación centrada horizontalmente.
  paginationRow: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  // Botón de página: azul petróleo con texto blanco.
  pageBtn: { backgroundColor: '#0a7ea4', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  pageBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  pageLabel: { fontWeight: 'bold' },
});