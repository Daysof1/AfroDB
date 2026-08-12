// Página: [id].tsx. vista de [id] del sistema.
/**
 * Este archivo y pantalla de detalle de un pedido especifico para el administrador 
 * recibe el parametro dinamico id desde la url 
 * consulta el backend para traer los datos del pedido
 * muestra los datos de cliente estado actual total fecha y lista productos
 * permite cambiar el estado del pedido pendiente -> enviado -> entregado -> cancelado si esta en pendiente
 */

import { useState, useEffect } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ThemedText } from '../../../components/themed-text';
import apiClient from '../../../src/api/apiClient';
import { useAuth } from '../../../src/context/AuthContext';

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

type Detalle = {
    producto?: { nombre?: string };
    cantidad?: number;
    precio?: number;
    precioUnitario?: number;
    subtotal?: number;
};

type Pedido = {
    id: string;
    estado?: string;
    total?: number;
    createdAt?: string;
    usuario?: {
        nombre?: string;
        apellido?: string;
        email?: string;
    };
    detalles?: Detalle[];
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────

export default function AdminPedidoDetalleScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const [pedido, setPedido] = useState<Pedido | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [cambiando, setCambiando] = useState(false);
    const { user, isLoadingSession } = useAuth() as any;

    // ─────────────────────────────────────────────────────────────
    // FUNCIÓN DE CARGA
    // ─────────────────────────────────────────────────────────────

    const fetchPedido = async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const res = await apiClient.get(`/admin/pedidos/${id}`);
            setPedido(res.data?.data?.pedido || null);
        } catch (error: unknown) {
            setErrorMessage((error as { message?: string })?.message || 'No se pudo cargar el pedido');
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // FUNCIÓN DE CAMBIO DE ESTADO
    // ─────────────────────────────────────────────────────────────

    const cambiarEstado = async (nuevoEstado: string) => {
        setCambiando(true);
        try {
            await apiClient.put(`/admin/pedidos/${id}/estado`, { estado: nuevoEstado });
            await fetchPedido();
        } catch {
            Alert.alert('Error', 'No se pudo cambiar el estado');
        } finally {
            setCambiando(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // EFECTOS
    // ─────────────────────────────────────────────────────────────

    useEffect(() => {
        if (isLoadingSession) return;

        if (user?.rol !== 'administrador') {
            setLoading(false);
            setPedido(null);
            setErrorMessage('');
            return;
        }

        fetchPedido();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isLoadingSession, user?.rol]);

    // ─────────────────────────────────────────────────────────────
    // FUNCIONES DE RENDERIZADO (extraídas para reducir complejidad)
    // ─────────────────────────────────────────────────────────────

    const renderDetalleItem = (det: Detalle, index: number) => {
        const cantidad = Number(det.cantidad ?? 0);
        const precioUnitario = Number(det.precio ?? det.precioUnitario ?? 0);
        const subtotal = Number(det.subtotal ?? precioUnitario * cantidad);
        const nombreProducto = det.producto?.nombre || 'Producto';
        const key = `${nombreProducto}-${index}-${precioUnitario}`;

        return (
            <View key={key} style={styles.detalleRow}>
                <View style={styles.detalleInfo}>
                    <ThemedText>{nombreProducto} x{cantidad}</ThemedText>
                    <ThemedText style={styles.meta}>
                        Precio unitario: ${precioUnitario.toLocaleString('es-CO')}
                    </ThemedText>
                </View>
                <ThemedText style={styles.valorText}>
                    Valor: ${subtotal.toLocaleString('es-CO')}
                </ThemedText>
            </View>
        );
    };

    const renderBotonesAccion = () => {
        const estado = pedido?.estado;

        if (estado === 'pendiente') {
            return (
                <>
                    <Pressable
                        style={styles.actionBtn}
                        onPress={() => cambiarEstado('entregado')}
                        disabled={cambiando}
                    >
                        <ThemedText style={styles.actionBtnText}>Marcar como Entregado</ThemedText>
                    </Pressable>
                    <Pressable
                        style={[styles.actionBtn, styles.btnDanger]}
                        onPress={() => cambiarEstado('cancelado')}
                        disabled={cambiando}
                    >
                        <ThemedText style={styles.actionBtnText}>Cancelar pedido</ThemedText>
                    </Pressable>
                </>
            );
        }

        if (estado === 'enviado') {
            return (
                <Pressable
                    style={styles.actionBtn}
                    onPress={() => cambiarEstado('entregado')}
                    disabled={cambiando}
                >
                    <ThemedText style={styles.actionBtnText}>Marcar como Entregado</ThemedText>
                </Pressable>
            );
        }

        return null;
    };

    // ─────────────────────────────────────────────────────────────
    // RENDERIZADO CONDICIONAL
    // ─────────────────────────────────────────────────────────────

    // Cargando sesión
    if (isLoadingSession) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
                <ThemedText>Cargando sesión...</ThemedText>
            </View>
        );
    }

    // Usuario auxiliar
    if (user?.rol === 'auxiliar') {
        return (
            <View style={styles.centered}>
                <ThemedText style={styles.error}>
                    Solo los administradores pueden ver esta opción.
                </ThemedText>
            </View>
        );
    }

    // Cargando pedido
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
                <ThemedText>Cargando pedido...</ThemedText>
            </View>
        );
    }

    // Error
    if (errorMessage) {
        return (
            <View style={styles.centered}>
                <ThemedText style={styles.error}>{errorMessage}</ThemedText>
            </View>
        );
    }

    // Pedido no encontrado
    if (!pedido) {
        return (
            <View style={styles.centered}>
                <ThemedText>No se encontró el pedido.</ThemedText>
            </View>
        );
    }

    // ─────────────────────────────────────────────────────────────
    // RENDERIZADO PRINCIPAL
    // ─────────────────────────────────────────────────────────────

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <ThemedText type="title">Pedido #{pedido.id}</ThemedText>

            <ThemedText>
                Cliente: {pedido.usuario?.nombre} {pedido.usuario?.apellido}
            </ThemedText>
            <ThemedText>Email: {pedido.usuario?.email}</ThemedText>
            <ThemedText>Estado: {pedido.estado}</ThemedText>
            <ThemedText>
                Total: ${Number(pedido.total || 0).toLocaleString('es-CO')}
            </ThemedText>
            <ThemedText>
                Fecha: {pedido.createdAt ? new Date(pedido.createdAt).toLocaleString('es-CO') : '-'}
            </ThemedText>

            <ThemedText style={styles.sectionTitle}>Productos:</ThemedText>

            {pedido.detalles?.map((det, index) => renderDetalleItem(det, index))}

            <View style={styles.actionsRow}>
                {renderBotonesAccion()}
            </View>
        </ScrollView>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { 
        padding: 20, 
        backgroundColor: '#fff', 
        flexGrow: 1 
    },
    centered: { 
        alignItems: 'center', 
        gap: 10, 
        marginVertical: 20 
    },
    error: { 
        color: '#000000' 
    },
    sectionTitle: { 
        marginTop: 10, 
        fontWeight: 'bold' 
    },
    detalleRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginVertical: 2, 
        gap: 12 
    },
    detalleInfo: { 
        flex: 1, 
        gap: 2 
    },
    meta: { 
        color: '#666', 
        fontSize: 12 
    },
    valorText: { 
        fontWeight: '700' 
    },
    actionsRow: { 
        flexDirection: 'column', 
        gap: 10, 
        marginTop: 20 
    },
    actionBtn: {
        backgroundColor: '#a57c63',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        marginBottom: 8,
    },
    btnDanger: { 
        backgroundColor: '#a56363' 
    },
    actionBtnText: { 
        color: '#fff', 
        fontWeight: '700' 
    },
});