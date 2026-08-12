// Página: usuarios.tsx. vista de usuarios del sistema.
/**
 * Este archivo gestion de usuarios para el panel del administrador
 * lista de todos los usuarios del sistema con el nombre, email, rol y estado
 * permite buscar usuarios por texto y navegar entre paginas 10 por pagina
 * solo administrador puede activar y desactivar usuarios
 * los administradores pueden ver la lista con botones de accion
 * esta pantalla es con rutas protegidas por api /admin/usuarios
 */

import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { ThemedText } from '../../components/themed-text';
import apiClient from '../../src/api/apiClient';
import { activarUsuario, desactivarUsuario } from '../../src/services/usuarioAdminService';
import { useAuth } from "../../src/context/AuthContext";

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

type Usuario = {
    id?: string;
    nombre?: string;
    apellido?: string;
    email?: string;
    rol?: string;
    activo?: boolean;
};

type AuthUser = {
    rol?: string;
};

// ─────────────────────────────────────────────────────────────
// FUNCIÓN AUXILIAR PARA CONSTRUIR QUERY STRING
// ─────────────────────────────────────────────────────────────

const buildQueryParams = (page: number, search: string): string => {
    const params = new URLSearchParams();
    
    if (search.trim()) {
        params.append('buscar', encodeURIComponent(search.trim()));
    }
    
    params.append('page', String(page));
    params.append('limite', '15');
    
    return params.toString();
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────

export default function AdminUsuariosScreen() {
    const { user } = useAuth() as { user: AuthUser | null };

    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    // ─────────────────────────────────────────────────────────────
    // FUNCIÓN DE CARGA
    // ─────────────────────────────────────────────────────────────

    const fetchUsuarios = async (page = 1, search = '') => {
        setLoading(true);
        setErrorMessage('');
        try {
            const queryString = buildQueryParams(page, search);
            const url = `/admin/usuarios?${queryString}`;
            const res = await apiClient.get(url);
            const usuariosData: Usuario[] = res.data?.data?.usuarios || [];
            setUsuarios(usuariosData);
            setPagina(page);
            setTotalPaginas(res.data?.data?.paginacion?.totalPaginas || 1);
        } catch (error) {
            setErrorMessage((error as { message?: string })?.message || 'No se pudo cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // EFECTOS
    // ─────────────────────────────────────────────────────────────

    useEffect(() => {
        fetchUsuarios(1, '');
    }, []);

    // ─────────────────────────────────────────────────────────────
    // HANDLERS
    // ─────────────────────────────────────────────────────────────

    const handleBuscar = () => {
        fetchUsuarios(1, busqueda);
    };

    const handlePagina = (next: number) => {
        const nuevaPagina = Math.max(1, Math.min(totalPaginas, pagina + next));
        fetchUsuarios(nuevaPagina, busqueda);
    };

    const handleToggleEstado = async (item: Usuario) => {
        try {
            if (item.activo) {
                await desactivarUsuario(item.id);
            } else {
                await activarUsuario(item.id);
            }
            fetchUsuarios(pagina, busqueda);
        } catch {
            Alert.alert('Error', 'No se pudo cambiar el estado');
        }
    };

    const handleBusquedaChange = (text: string) => {
        setBusqueda(text);
        fetchUsuarios(1, text);
    };

    const handleClearSearch = () => {
        setBusqueda('');
        fetchUsuarios(1, '');
    };

    const isAdmin = user?.rol === 'administrador';

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────

    return (
        <View style={styles.container}>
            <ThemedText type="title">Usuarios</ThemedText>

            {/* BARRA DE BÚSQUEDA */}
            <View style={styles.searchRow}>
                <TextInput
                    placeholder="Buscar usuario..."
                    value={busqueda}
                    onChangeText={handleBusquedaChange}
                    style={styles.input}
                />

                {busqueda.trim().length > 0 && (
                    <Pressable
                        style={styles.clearBtn}
                        onPress={handleClearSearch}
                    >
                        <ThemedText style={styles.searchBtnText}>X</ThemedText>
                    </Pressable>
                )}

                <Pressable
                    style={styles.searchBtn}
                    onPress={handleBuscar}
                >
                    <ThemedText style={styles.searchBtnText}>Buscar</ThemedText>
                </Pressable>
            </View>

            {/* SPINNER DE CARGA */}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" />
                    <ThemedText>Cargando usuarios...</ThemedText>
                </View>
            ) : null}

            {/* MENSAJE DE ERROR */}
            {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}

            {/* LISTA DE USUARIOS */}
            <FlatList
                data={usuarios}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.userInfo}>
                                <ThemedText type="defaultSemiBold">
                                    {item.nombre} {item.apellido}
                                </ThemedText>
                                <ThemedText style={styles.userEmail}>{item.email}</ThemedText>
                            </View>
                            <View style={styles.userBadge}>
                                <ThemedText style={styles.userBadgeText}>
                                    {item.rol || 'Usuario'}
                                </ThemedText>
                            </View>
                        </View>
                        <ThemedText style={styles.meta}>
                            {item.activo ? 'Activo' : 'Inactivo'}
                        </ThemedText>

                        {isAdmin && (
                            <View style={styles.actionsRow}>
                                <Pressable
                                    style={[
                                        styles.actionBtn, 
                                        { backgroundColor: item.activo ? '#c49b61' : '#d8c3a5' }
                                    ]}
                                    onPress={() => handleToggleEstado(item)}
                                >
                                    <ThemedText style={styles.actionBtnText}>
                                        {item.activo ? 'Desactivar' : 'Activar'}
                                    </ThemedText>
                                </Pressable>
                            </View>
                        )}
                    </View>
                )}
                ListEmptyComponent={
                    !loading && !errorMessage ? <ThemedText>No hay usuarios.</ThemedText> : null
                }
                style={styles.list}
            />

            {/* PAGINACIÓN */}
            <View style={styles.paginationRow}>
                <Pressable 
                    style={styles.pageBtn} 
                    onPress={() => handlePagina(-1)} 
                    disabled={pagina <= 1}
                >
                    <ThemedText style={styles.pageBtnText}>{'<'}</ThemedText>
                </Pressable>
                
                <ThemedText style={styles.pageLabel}>
                    Página {pagina} de {totalPaginas}
                </ThemedText>
                
                <Pressable 
                    style={styles.pageBtn} 
                    onPress={() => handlePagina(1)} 
                    disabled={pagina >= totalPaginas}
                >
                    <ThemedText style={styles.pageBtnText}>{'>'}</ThemedText>
                </Pressable>
            </View>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        padding: 16, 
        gap: 10, 
        backgroundColor: '#f9f6f2' 
    },
    centered: { 
        alignItems: 'center', 
        gap: 10, 
        marginVertical: 20 
    },
    error: { 
        color: '#a56363' 
    },
    searchRow: { 
        flexDirection: 'row', 
        gap: 8, 
        marginBottom: 8 
    },
    input: { 
        flex: 1, 
        borderWidth: 1, 
        borderColor: 'rgb(126, 100, 81)', 
        borderRadius: 14, 
        paddingHorizontal: 14, 
        paddingVertical: 12, 
        backgroundColor: '#fff' 
    },
    searchBtn: { 
        backgroundColor: 'rgb(126, 100, 81)', 
        borderRadius: 14, 
        paddingHorizontal: 16, 
        justifyContent: 'center' 
    },
    clearBtn: { 
        backgroundColor: 'rgb(126, 100, 81)', 
        borderRadius: 14, 
        paddingHorizontal: 11, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    searchBtnText: { 
        color: '#fff', 
        fontWeight: '700' 
    },
    list: { 
        flex: 1 
    },
    card: { 
        borderRadius: 18, 
        padding: 18, 
        backgroundColor: '#fff', 
        borderWidth: 1, 
        borderColor: 'rgb(126, 100, 81)', 
        marginBottom: 12, 
        shadowColor: '#000', 
        shadowOpacity: 0.08, 
        shadowRadius: 10, 
        shadowOffset: { width: 0, height: 4 }, 
        elevation: 2 
    },
    cardHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: 12, 
        marginBottom: 10 
    },
    userInfo: { 
        flex: 1, 
        gap: 4 
    },
    userEmail: { 
        color: '#7b6758', 
        fontSize: 13 
    },
    userBadge: { 
        backgroundColor: '#f3e6d8', 
        paddingHorizontal: 10, 
        paddingVertical: 6, 
        borderRadius: 999 
    },
    userBadgeText: { 
        color: '#423126', 
        fontWeight: '700', 
        fontSize: 12 
    },
    actionsRow: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        gap: 10, 
        marginTop: 10 
    },
    actionBtn: { 
        paddingVertical: 10, 
        paddingHorizontal: 14, 
        borderRadius: 12, 
        marginBottom: 2 
    },
    actionBtnText: { 
        color: '#fff', 
        fontWeight: '700', 
        fontSize: 13 
    },
    cardBody: { 
        gap: 6 
    },
    meta: { 
        color: '#6b7280', 
        fontSize: 13 
    },
    paginationRow: { 
        flexDirection: 'row', 
        gap: 10, 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginTop: 10 
    },
    pageBtn: { 
        backgroundColor: 'rgb(126, 100, 81)', 
        borderRadius: 8, 
        paddingHorizontal: 12, 
        paddingVertical: 6 
    },
    pageBtnText: { 
        color: '#3e2f25', 
        fontWeight: '700', 
        fontSize: 15 
    },
    pageLabel: { 
        fontWeight: 'bold' 
    },
});