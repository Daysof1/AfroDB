// Página: productos.tsx. vista de productos del sistema.
/**
 * Este archivo gestion de productos panel de administración
 * lista de todos los productos del sistema con imagen descripcion y estado
 * permite buscar en tiempo real y navega entre paginas 10 por pagina
 * product-form con los datos de editar
 * al presionar el producto navega a sus características y edición
 * solo administradores isAdmin pueden activar/desactivar y eliminar productos
 * el auxiliar solo puede ver y navegar
 */

import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import catalogoService from '../../src/services/catalogoService';
import { router } from "expo-router";
import { ThemedText } from '../../components/themed-text';
import apiClient from '../../src/api/apiClient';
import { activarProducto, desactivarProducto } from '../../src/services/adminService';
import { useAuth } from "../../src/context/AuthContext";

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

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
    params.append('limite', '10');
    
    return params.toString();
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────

export default function AdminProductosScreen() {
    const { user } = useAuth() as { user: AuthUser | null };
    
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    // ─────────────────────────────────────────────────────────────
    // FUNCIÓN DE CARGA
    // ─────────────────────────────────────────────────────────────

    const fetchProductos = async (page = 1, search = '') => {
        setLoading(true);
        setErrorMessage('');
        try {
            const queryString = buildQueryParams(page, search);
            const url = `/admin/productos?${queryString}`;
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

    // ─────────────────────────────────────────────────────────────
    // EFECTOS
    // ─────────────────────────────────────────────────────────────

    useEffect(() => {
        fetchProductos(1, '');
    }, []);

    // ─────────────────────────────────────────────────────────────
    // HANDLERS
    // ─────────────────────────────────────────────────────────────

    const handlePagina = (next: number) => {
        const nuevaPagina = Math.max(1, Math.min(totalPaginas, pagina + next));
        fetchProductos(nuevaPagina, busqueda);
    };

    const handleToggleEstado = async (item: Producto) => {
        try {
            if (item.activo) {
                await desactivarProducto(item.id);
            } else {
                await activarProducto(item.id);
            }
            fetchProductos(pagina, busqueda);
        } catch {
            Alert.alert('Error', 'No se pudo cambiar el estado');
        }
    };

    const isAdmin = user?.rol === 'administrador';

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────

    return (
        <View style={styles.container}>
            <ThemedText type="title">Productos</ThemedText>

            {/* BARRA DE BÚSQUEDA */}
            <View style={styles.searchRow}>
                <TextInput
                    placeholder="Buscar producto..."
                    value={busqueda}
                    onChangeText={(text) => {
                        setBusqueda(text);
                        fetchProductos(1, text);
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
                    onPress={() => fetchProductos(1, busqueda)}
                >
                    <ThemedText style={styles.searchBtnText}>Buscar</ThemedText>
                </Pressable>
            </View>

            {/* BOTÓN CREAR PRODUCTO */}
            <Pressable style={styles.createBtn} onPress={() => push('/admin/producto-form')}>
                <ThemedText style={styles.createBtnText}>+ Crear producto</ThemedText>
            </Pressable>

            {/* SPINNER DE CARGA */}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" />
                    <ThemedText>Cargando productos...</ThemedText>
                </View>
            ) : null}

            {/* MENSAJE DE ERROR */}
            {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}

            {/* LISTA DE PRODUCTOS */}
            <FlatList
                data={productos}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Pressable
                            style={styles.cardHeader}
                            onPress={() => pushParams('/admin/producto-form', { producto: JSON.stringify(item) })}
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
                                <ThemedText style={styles.meta}>Stock: {item.stock}</ThemedText>
                            </View>
                        </Pressable>

                        {isAdmin && (
                            <View style={styles.actionsRow}>
                                <Pressable
                                    style={[
                                        styles.actionBtn, 
                                        { backgroundColor: item.activo ? '#7c452a' : '#b87a5a' }
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
                ListEmptyComponent={!loading && !errorMessage ? <ThemedText>No hay productos.</ThemedText> : null}
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
        color: '#b87a5a' 
    },
    searchRow: { 
        flexDirection: 'row', 
        gap: 8, 
        marginBottom: 8 
    },
    input: { 
        flex: 1, 
        borderWidth: 1, 
        borderColor: '#d6c7ae', 
        borderRadius: 14, 
        paddingHorizontal: 14, 
        paddingVertical: 12, 
        backgroundColor: '#fff' 
    },
    searchBtn: { 
        backgroundColor: '#b87a5a', 
        borderRadius: 14, 
        paddingHorizontal: 16, 
        justifyContent: 'center' 
    },
    clearBtn: { 
        backgroundColor: '#b87a5a', 
        borderRadius: 14, 
        paddingHorizontal: 12, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    searchBtnText: { 
        color: '#fff', 
        fontWeight: '700' 
    },
    createBtn: { 
        backgroundColor: '#b87a5a', 
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
        borderColor: '#e6d3b3', 
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