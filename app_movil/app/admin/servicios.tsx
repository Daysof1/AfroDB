// Página: servicios.tsx. vista de servicios del sistema.
/**
 * Este archivo gestion de servicios panel de administración
 * lista de todos los servicios del sistema con imagen descripcion y estado
 * permite buscar en tiempo real y navega entre paginas 10 por pagina
 * servicio-form con los datos de editar
 * al presionar el servicio navega a sus características y edición
 * solo administradores isAdmin pueden activar/desactivar y eliminar servicios
 * el auxiliar solo puede ver y navegar
 */

import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import catalogoService from '../../src/services/catalogoService';
import { router } from "expo-router";
import { ThemedText } from '../../components/themed-text';
import apiClient from '../../src/api/apiClient';
import { activarServicio, desactivarServicio } from '../../src/services/adminService';
import { useAuth } from "../../src/context/AuthContext";

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

type Servicio = {
    id?: string;
    nombre?: string;
    descripcion?: string;
    precio?: number;
    duracion?: string;
    imagen?: string;
    activo?: boolean;
};

type AuthUser = { rol?: string };

// ─────────────────────────────────────────────────────────────
// HELPERS DE NAVEGACIÓN
// ─────────────────────────────────────────────────────────────

const push = (path: string) => 
    (router as unknown as { push: (p: string) => void }).push(path);

const pushParams = (pathname: string, params: Record<string, string>) => 
    (router as unknown as { push: (p: { pathname: string; params: Record<string, string> }) => void }).push({ pathname, params });

// ─────────────────────────────────────────────────────────────
// FUNCIÓN AUXILIAR PARA CONSTRUIR QUERY STRING
// ─────────────────────────────────────────────────────────────

const buildQueryParams = (page: number, search: string): string => {
    const params = new URLSearchParams();
    
    if (search.trim()) {
        params.append('buscar', encodeURIComponent(search.trim()));
    }
    
    params.append('pagina', String(page));
    params.append('limite', '20');
    
    return params.toString();
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────

export default function AdminServiciosScreen() {
    const { user } = useAuth() as { user: AuthUser | null };
    
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    // ─────────────────────────────────────────────────────────────
    // FUNCIÓN DE CARGA
    // ─────────────────────────────────────────────────────────────

    const fetchServicios = async (page = 1, search = '') => {
        setLoading(true);
        setErrorMessage('');
        try {
            const queryString = buildQueryParams(page, search);
            const url = `/admin/servicios?${queryString}`;
            const res = await apiClient.get(url);
            const serviciosData: Servicio[] = res.data?.data?.servicios || res.data?.data?.Servicios || [];
            setServicios(serviciosData);
            setPagina(page);
            setTotalPaginas(res.data?.data?.paginacion?.totalPaginas || 1);
        } catch (error: unknown) {
            setErrorMessage((error as { message?: string })?.message || 'Error al cargar servicios');
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // EFECTOS
    // ─────────────────────────────────────────────────────────────

    useEffect(() => {
        fetchServicios(1, '');
    }, []);

    // ─────────────────────────────────────────────────────────────
    // HANDLERS
    // ─────────────────────────────────────────────────────────────

    const handlePagina = (next: number) => {
        const nuevaPagina = Math.max(1, Math.min(totalPaginas, pagina + next));
        fetchServicios(nuevaPagina, busqueda);
    };

    const handleToggleEstado = async (item: Servicio) => {
        try {
            if (item.activo) {
                await desactivarServicio(item.id);
            } else {
                await activarServicio(item.id);
            }
            fetchServicios(pagina, busqueda);
        } catch {
            Alert.alert('Error', 'No se pudo cambiar el estado');
        }
    };

    const isAdmin = user?.rol === 'administrador';
    const isAux = user?.rol === 'auxiliar';

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────

    return (
        <View style={styles.container}>
            <ThemedText type="title">Servicios</ThemedText>

            {/* BARRA DE BÚSQUEDA */}
            <View style={styles.searchRow}>
                <TextInput
                    placeholder="Buscar servicio..."
                    value={busqueda}
                    onChangeText={(text) => {
                        setBusqueda(text);
                        fetchServicios(1, text);
                    }}
                    style={styles.input}
                />

                {busqueda.trim().length > 0 && (
                    <Pressable
                        style={styles.clearBtn}
                        onPress={() => {
                            setBusqueda('');
                            fetchServicios(1, '');
                        }}
                    >
                        <ThemedText style={styles.searchBtnText}>X</ThemedText>
                    </Pressable>
                )}

                <Pressable
                    style={styles.searchBtn}
                    onPress={() => fetchServicios(1, busqueda)}
                >
                    <ThemedText style={styles.searchBtnText}>Buscar</ThemedText>
                </Pressable>
            </View>

            {/* BOTÓN CREAR SERVICIO */}
            <Pressable style={styles.createBtn} onPress={() => push('/admin/servicio-form')}>
                <ThemedText style={styles.createBtnText}>+ Crear Servicio</ThemedText>
            </Pressable>

            {/* SPINNER DE CARGA */}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" />
                    <ThemedText>Cargando servicios...</ThemedText>
                </View>
            ) : null}

            {/* MENSAJE DE ERROR */}
            {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}

            {/* LISTA DE SERVICIOS */}
            <FlatList
                data={servicios}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Pressable
                            style={styles.cardHeader}
                            onPress={() => pushParams('/admin/servicio-form', { servicio: JSON.stringify(item) })}
                        >
                            <Image
                                source={{ 
                                    uri: item.imagen 
                                        ? catalogoService.buildImageUrl(item.imagen) 
                                        : 'https://via.placeholder.com/80' 
                                }}
                                style={styles.image}
                            />
                            <View style={styles.cardBody}>
                                <ThemedText type="defaultSemiBold">{item.nombre}</ThemedText>
                                <ThemedText numberOfLines={2} style={styles.description}>
                                    {item.descripcion || 'Sin descripción'}
                                </ThemedText>
                                <View style={styles.priceRow}>
                                    <ThemedText style={styles.price}>
                                        ${Number(item.precio || 0).toLocaleString('es-CO')}
                                    </ThemedText>
                                    <ThemedText style={styles.meta}>
                                        {item.activo ? 'Activo' : 'Inactivo'}
                                    </ThemedText>
                                </View>
                            </View>
                        </Pressable>

                        {(isAdmin || isAux) && (
                            <View style={styles.actionsRow}>
                                <Pressable
                                    style={[
                                        styles.actionBtn, 
                                        { backgroundColor: item.activo ? '#c8a68d' : '#7a5c46' }
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
                ListEmptyComponent={!loading && !errorMessage ? <ThemedText>No hay servicios.</ThemedText> : null}
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
                    Pagina {pagina} de {totalPaginas}
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
        borderColor: '#7a5c46', 
        borderRadius: 14, 
        paddingHorizontal: 14, 
        paddingVertical: 12, 
        backgroundColor: '#fff' 
    },
    searchBtn: { 
        backgroundColor: '#7a5c46', 
        borderRadius: 14, 
        paddingHorizontal: 16, 
        justifyContent: 'center' 
    },
    clearBtn: { 
        backgroundColor: '#7a5c46', 
        borderRadius: 14, 
        paddingHorizontal: 11, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    searchBtnText: { 
        color: '#fff', 
        fontWeight: '700' 
    },
    createBtn: { 
        backgroundColor: '#7a5c46', 
        borderRadius: 14, 
        paddingVertical: 14, 
        alignItems: 'center', 
        marginBottom: 8 
    },
    createBtnText: { 
        color: '#fff', 
        fontWeight: '700' 
    },
    list: { 
        flex: 1 
    },
    card: { 
        borderRadius: 18, 
        padding: 16, 
        backgroundColor: '#fff', 
        borderWidth: 1, 
        borderColor: '#7a5c46', 
        marginBottom: 12, 
        shadowColor: '#000', 
        shadowOpacity: 0.08, 
        shadowRadius: 10, 
        shadowOffset: { width: 0, height: 4 }, 
        elevation: 2 
    },
    cardHeader: { 
        flexDirection: 'row', 
        gap: 12, 
        alignItems: 'flex-start' 
    },
    actionsRow: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        gap: 10, 
        marginTop: 14 
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
    image: { 
        width: 84, 
        height: 84, 
        borderRadius: 14, 
        backgroundColor: '#f3e6d8' 
    },
    cardBody: { 
        flex: 1, 
        gap: 6 
    },
    description: { 
        color: '#5f4a39', 
        fontSize: 13, 
        lineHeight: 18 
    },
    priceRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: 10, 
        marginTop: 6 
    },
    price: { 
        fontWeight: '800', 
        fontSize: 16, 
        color: '#3e2f25' 
    },
    meta: { 
        color: '#7b6758', 
        fontSize: 13 
    },
    paginationRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 10, 
        marginTop: 10 
    },
    pageBtn: { 
        padding: 10, 
        borderRadius: 10, 
        backgroundColor: '#e6d3b3' 
    },
    pageBtnText: { 
        fontWeight: '700', 
        color: '#3e2f25' 
    },
    pageLabel: { 
        fontWeight: '700' 
    },
});