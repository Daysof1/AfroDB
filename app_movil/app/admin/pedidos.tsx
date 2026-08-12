// Página: pedidos.tsx. vista de pedidos del sistema.
/**
 * Este archivo y pantalla es la lista de pedidos en panel de administrador
 * muestra todos los pedidos del sistema en una lista paginada (de 10 por pagina)
 * permite buscar pedidos por texto en tiempo real mientras escribe
 * al presionar un pedido navega a admin/pedido/[id] para ver el detalle 
 * solo para rol de admin y auxiliar
 */

import { useState, useEffect } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";
import { ThemedText } from '../../components/themed-text';
import apiClient from '../../src/api/apiClient';

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

type Pedido = {
    id: string;
    estado?: string;
    total?: number;
    usuario?: {
        nombre?: string;
        apellido?: string;
    };
};

// ─────────────────────────────────────────────────────────────
// FUNCIONES AUXILIARES
// ─────────────────────────────────────────────────────────────

const buildQueryParams = (page: number, search: string): string => {
    const params = new URLSearchParams();
    
    if (search.trim()) {
        params.append('buscar', encodeURIComponent(search.trim()));
        params.append('limite', '100');
    } else {
        params.append('limite', '10');
    }
    
    params.append('pagina', String(page));
    
    return params.toString();
};

const filterPedidosBySearch = (pedidos: Pedido[], search: string): Pedido[] => {
    const q = search.trim().toLowerCase();
    if (!q) return pedidos;
    
    return pedidos.filter(p => {
        const idStr = String(p.id || '').toLowerCase();
        const nombre = (p.usuario?.nombre || '').toLowerCase();
        const apellido = (p.usuario?.apellido || '').toLowerCase();
        const estado = (p.estado || '').toLowerCase();
        const total = String(p.total || '').toLowerCase();
        return idStr.includes(q) || nombre.includes(q) || apellido.includes(q) || 
               estado.includes(q) || total.includes(q);
    });
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────

export default function AdminPedidoScreen() {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    // ─────────────────────────────────────────────────────────────
    // FUNCIÓN DE CARGA (refactorizada)
    // ─────────────────────────────────────────────────────────────

    const fetchPedidos = async (page = 1, search = '') => {
        setLoading(true);
        setErrorMessage('');
        
        try {
            const queryString = buildQueryParams(page, search);
            const url = `/admin/pedidos?${queryString}`;
            const res = await apiClient.get(url);
            
            const pedidosData: Pedido[] = res.data?.data?.pedidos || [];
            const finalPedidos = filterPedidosBySearch(pedidosData, search);
            
            setPedidos(finalPedidos);
            setPagina(page);
            setTotalPaginas(res.data?.data?.paginacion?.totalPaginas || 1);
            
        } catch (error: unknown) {
            setErrorMessage((error as { message?: string })?.message || 'No se pudo cargar el pedido');
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // EFECTOS
    // ─────────────────────────────────────────────────────────────

    useEffect(() => {
        fetchPedidos(1, '');
    }, []);

    // ─────────────────────────────────────────────────────────────
    // HANDLERS
    // ─────────────────────────────────────────────────────────────

    const handlePagina = (next: number) => {
        const nueva = Math.max(1, Math.min(totalPaginas, pagina + next));
        fetchPedidos(nueva, busqueda);
    };

    const handleSearch = (text: string) => {
        setBusqueda(text);
        fetchPedidos(1, text);
    };

    const handleClearSearch = () => {
        setBusqueda('');
        fetchPedidos(1, '');
    };

    const navigateToPedido = (id: string) => {
        (router as unknown as { 
            push: (p: { pathname: string; params: Record<string, string> }) => void 
        }).push({
            pathname: '/admin/pedidos/[id]',
            params: { id: String(id) },
        });
    };

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────

    return (
        <View style={styles.container}>
            <ThemedText type="title">Pedidos</ThemedText>

            {/* BARRA DE BÚSQUEDA */}
            <View style={styles.searchRow}>
                <TextInput
                    placeholder="Buscar pedido..."
                    value={busqueda}
                    onChangeText={handleSearch}
                    style={styles.input}
                />

                {busqueda.trim().length > 0 && (
                    <Pressable style={styles.clearBtn} onPress={handleClearSearch}>
                        <ThemedText style={styles.searchBtnText}>X</ThemedText>
                    </Pressable>
                )}

                <Pressable
                    style={styles.searchBtn}
                    onPress={() => fetchPedidos(1, busqueda)}
                />
            </View>

            {/* SPINNER DE CARGA */}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" />
                    <ThemedText>Cargando pedidos...</ThemedText>
                </View>
            ) : null}

            {/* MENSAJE DE ERROR */}
            {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}

            {/* LISTA DE PEDIDOS */}
            <FlatList
                data={pedidos}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <Pressable
                        style={styles.card}
                        onPress={() => navigateToPedido(String(item.id))}
                    >
                        <View style={styles.cardBody}>
                            <ThemedText type="defaultSemiBold">Pedido #{item.id}</ThemedText>
                            <ThemedText>
                                Cliente: {item.usuario?.nombre} {item.usuario?.apellido}
                            </ThemedText>
                            <ThemedText>Estado: {item.estado}</ThemedText>
                            <ThemedText style={styles.meta}>
                                Total: ${Number(item.total || 0).toLocaleString('es-CO')}
                            </ThemedText>
                        </View>
                    </Pressable>
                )}
                ListEmptyComponent={
                    !loading && !errorMessage ? <ThemedText>No hay pedidos.</ThemedText> : null
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
        borderColor: '#624029', 
        borderRadius: 10, 
        paddingHorizontal: 12, 
        backgroundColor: '#fff', 
        color: '#3e2f25' 
    },
    searchBtn: { 
        backgroundColor: '#3e2f25', 
        borderRadius: 10, 
        paddingHorizontal: 14, 
        justifyContent: 'center' 
    },
    clearBtn: { 
        backgroundColor: '#3f2d25', 
        borderRadius: 14, 
        paddingHorizontal: 12, 
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
        borderWidth: 1, 
        borderColor: '#624029', 
        borderRadius: 12, 
        padding: 10, 
        backgroundColor: '#fff', 
        marginBottom: 10 
    },
    cardBody: { 
        flex: 1 
    },
    meta: { 
        color: '#7b6758', 
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
        backgroundColor: '#3e2f25', 
        borderRadius: 8, 
        paddingHorizontal: 12, 
        paddingVertical: 6 
    },
    pageBtnText: { 
        color: '#fff', 
        fontWeight: '700', 
        fontSize: 15 
    },
    pageLabel: { 
        fontWeight: 'bold', 
        color: '#3e2f25' 
    },
});