/**
 * Este archivo gestion de usuariospara el panel del administrador
 * lista de todos los usuarios del sistema con el nombre, email ro y estado
 * permite buscar usuarios por texto y navegar entre paginas 10 por pagina
 * solo administrador puede acivar y desactivar y eliminar usuarios 
 * los administtradores puede ver la lista pero din botones de accion
 * esta pantalla es con rutas protegidas por api /admin/usurios
 */

// manejo de variables de estado local
import { useEffect, useState } from "react";
//Importar componentes 
//Dimensions optiene al ancho y alto de la pantalla para hacer diseos responsivos
//flatlist lista optimizada con virtualizacion para mostrar grandes cantidades de datos
//modal mostrar detalles de contenido en ventanas emergentes

import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, TextInput, View} from "react-native";

//Lee los parametros de la url para obtener el id del pedido
import { ThemedText } from '../../components/themed-text';

import  apiClient  from '../../src/api/apiClient';
import { activarUsuario, desactivarUsuario, deleteUsuario } from '../../src/services/usuarioAdminService';
import { useAuth } from "../../src/context/AuthContext";
import { SearchBar } from "react-native-screens";

/** 
* Tipos 
* Estructura minima de un ususario para mostrar en una lista
*/
type Usuario = {
    id?: string;
    nombre?: string;
    apellido?: string;
    email?: string;
    rol?: string; //administrador  / auxiliar / cliente
    activo?: boolean; // true ouede iniciar sesion
};

// solo necesitamos el rol del administrador autenticado
type AuthUser = {
    rol?: string;
};

/**
 * Componente principal
 */
export default function AdminUsuariosScreen() {
    //contexto de autenticacion
    const { user } = useAuth() as { user: AuthUser | null };

    //Estado local

    const [usuarios, setUsuarios] = useState<Usuario[]>([]); //Usuarios de pagina actual
    const [loading, setLoading] = useState(true); //pagina actual
    const [errorMessage, setErrorMessage] = useState('');//Error falla la peticion
    const [busqueda, setBusqueda] = useState('');//texto de campos de busqueda
    const [pagina, setPagina] = useState(1);//inicia en pagina 1
    const [totalPaginas, setTotalPaginas] = useState(1);//total de paginas del backend inicia cargando desde la 1

    /**
     * funcion de fetchUsuarios 
     * consultas get /admin/usuarios con filtro de busqueda  paginanacion
     * page pagina a cargar .search texto de filtro vacio sin filtro
     */
    const fetchUsuarios = async (page = 1, search = '') => {
        setLoading(true);
        setErrorMessage('');
        try {
            //construye la query string dinamicamente segun los paramentros 
            const params = [];
            if (search.trim()) params.push(`buscar=${encodeURIComponent(search.trim())}`);
            params.push(`page=${page}`);
            params.push('limite=10');
            const url = `/admin/usuarios?${params.join('&')}`;
            const res = await apiClient.get(url);
            const usuariosData : Usuario[] = res.data?.data?.usuarios || [];
            setUsuarios(usuariosData);
            setPagina(page);
            setTotalPaginas(res.data?.data?.paginacion?.totalPaginas || 1);
        } catch (error) {
            setErrorMessage((error as { message?: string})?.message || 'no se pudo cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    /**
     * efecto carga inicial
     * carga la primera pagina sin filtro al montar el componente
     */
    useEffect(() => {
        fetchUsuarios();
    }, []);

    /**
     * Funciones handleBuscar
     * busqueda desde la pagina 1 con el texto actual del campo de busqueda
     * se usa el boton buscar para busqueda manual
     */
    const handleBuscar = () => {
        fetchUsuarios(1, busqueda);
    };

    /**
     * Funcion handlePagina
     * cambia de pagina dentro del rango valido [1, total de pagias ]
     */
    const handlePagina = (next: number) => {
        const nuevaPagina = Math.max(1, Math.min(totalPaginas, pagina + next));
        fetchUsuarios(nuevaPagina, busqueda);//conserva el filtro de busqueda al cambiar de pagina
    };

    // flag: solo administradores pueden ver los botones de accion
    const isAdmin = user?.rol === 'administrador';

    return (
            <View style={styles.container}>

      {/* Título de la pantalla */}
      <ThemedText type="title">Usuarios</ThemedText>

      {/* ── BARRA DE BÚSQUEDA ──────────────────────────────────────────── */}
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Buscar usuario..."
          value={busqueda}
          onChangeText={(text) => {
            setBusqueda(text);
            fetchUsuarios(1, text); // Búsqueda en tiempo real al escribir.
          }}
          style={styles.input}
        />
        {/* Botón de búsqueda manual */}
        <Pressable style={styles.searchBtn} onPress={handleBuscar}>
          <ThemedText style={styles.searchBtnText}>Buscar</ThemedText>
        </Pressable>
      </View>

      {/* Spinner visible mientras carga */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <ThemedText>Cargando usuarios...</ThemedText>
        </View>
      ) : null}

      {/* Mensaje de error si la petición falla */}
      {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}

      {/* ── LISTA DE USUARIOS ───────────────────────────────────────────── */}
      <FlatList
        data={usuarios}
        keyExtractor={(item) => String(item.id || item.id)} // Clave única por usuario.
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Área de datos del usuario */}
            <View style={styles.cardBody}>
              {/* Nombre completo */}
              <ThemedText type="defaultSemiBold">{item.nombre} {item.apellido}</ThemedText>
              {/* Correo electrónico */}
              <ThemedText>{item.email}</ThemedText>
              {/* Rol y estado activo/inactivo separados por " | " */}
              <ThemedText style={styles.meta}>{item.rol} | {item.activo ? 'Activo' : 'Inactivo'}</ThemedText>
            </View>

            {/* ── BOTONES DE ACCIÓN (solo admin) ──────────────────────── */}
            {isAdmin && (
              <View style={styles.actionsRow}>
                {/* Botón Activar/Desactivar: rojo si está activo, verde si inactivo */}
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: item.activo ? '#b93a32' : '#218f4c' }]}
                  onPress={async () => {
                    try {
                      if (item.activo) {
                        await desactivarUsuario(item.id || item.id); // Bloquea la cuenta.
                      } else {
                        await activarUsuario(item.id || item.id);    // Desbloquea la cuenta.
                      }
                      fetchUsuarios(pagina, busqueda); // Recarga para reflejar el cambio.
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
        // Estado vacío: solo cuando no hay carga ni error activos.
        ListEmptyComponent={!loading && !errorMessage ? <ThemedText>No hay usuarios.</ThemedText> : null}
        style={styles.list}
      />

      {/* ── PAGINACIÓN ──────────────────────────────────────────────────── */}
      <View style={styles.paginationRow}>
        <Pressable style={styles.pageBtn} onPress={() => handlePagina(-1)} disabled={pagina <= 1}>
          <ThemedText style={styles.pageBtnText}>{'<'}</ThemedText>
        </Pressable>
        <ThemedText style={styles.pageLabel}>Página {pagina} de {totalPaginas}</ThemedText>
        <Pressable style={styles.pageBtn} onPress={() => handlePagina(1)} disabled={pagina >= totalPaginas}>
          <ThemedText style={styles.pageBtnText}>{'>'}</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Contenedor raíz: pantalla completa con padding y gap entre elementos.
  container: { flex: 1, padding: 16, gap: 10 },
  centered: { alignItems: 'center', gap: 10, marginVertical: 20 },
  error: { color: '#b93a32' },
  // Fila de búsqueda: input expandible + botón fijo.
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#d5d5d5', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#fff' },
  searchBtn: { backgroundColor: '#0a7ea4', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700' },
  // Lista ocupa todo el espacio vertical entre los controles.
  list: { flex: 1 },
  // Tarjeta de usuario: fila con datos a la izquierda y botones a la derecha.
  card: { flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 12, padding: 10, backgroundColor: '#fff', marginBottom: 8, alignItems: 'center' },
  // Columna de botones a la derecha de la tarjeta.
  actionsRow: { flexDirection: 'column', gap: 6, marginLeft: 8 },
  // Botón pequeño: color de fondo se aplica inline (rojo/verde según estado).
  actionBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginBottom: 2 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  // Área de datos: ocupa el espacio restante de la tarjeta.
  cardBody: { flex: 1 },
  // Rol y estado en gris secundario.
  meta: { color: '#888', fontSize: 13 },
  // Paginación centrada.
  paginationRow: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  // Botones de página: azul petróleo con texto blanco.
  pageBtn: { backgroundColor: '#0a7ea4', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  pageBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  pageLabel: { fontWeight: 'bold' },
});