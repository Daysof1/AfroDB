// Página: dashboard.tsx. vista de dashboard del sistema.
/**
 * Pantalla principal del panel del administrador y auxiliar
 * solo accesible para roles definidos     
 * muestra tarjetas de estadisticas en tiempo real categorias y productos 
 * pedidos / ventas totales 
 * los auxiliares ven todo excepto la tarjeta de usuarios isAdmin=false
 * incluye accesos rapidos y las secciones mas usadas
 * muestra informacion del sistema (estado de la api y rol de usuario)
 */

import { useState, useEffect, useCallback } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import apiClient from '../../src/api/apiClient';
import { useAuth } from "../../src/context/AuthContext";

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

type AuthUser = { rol?: string; nombre?: string };

type StatCard = {
    title: string;
    value: number;
    icon: keyof typeof Ionicons.glyphMap;
    gradient: [string, string];
    route: string;
    show: boolean;
};

// ─────────────────────────────────────────────────────────────
// HELPERS DE NAVEGACIÓN
// ─────────────────────────────────────────────────────────────

const push = (path: string) => (router as unknown as { push: (p: string) => void }).push(path);

// ─────────────────────────────────────────────────────────────
// FUNCIÓN AUXILIAR PARA NORMALIZAR RESPUESTAS
// ─────────────────────────────────────────────────────────────

const normalizePayload = (response: any): any => response?.data?.data ?? response?.data ?? {};

const getTotalFromResponse = (response: any, fallback: number = 0): number => {
    if (!response) return fallback;
    const data = response.data?.data ?? response.data ?? response;
    if (typeof data === 'number') return data;
    if (typeof data?.total === 'number') return data.total;
    if (typeof data?.paginacion?.total === 'number') return data.paginacion.total;
    if (Array.isArray(data)) return data.length;
    if (Array.isArray(data?.citas)) return data.citas.length;
    return fallback;
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────

export default function AdminDashboardScreen() {
    const { user, isAuthenticated } = useAuth() as { user: AuthUser | null; isAuthenticated: boolean };
    const isAdmin = user?.rol === 'administrador';
    const isAux = user?.rol === 'auxiliar';

    const [stats, setStats] = useState({
        categorias: 0,
        subcategorias: 0,
        servicios: 0,
        productos: 0,
        usuarios: 0,
        pedidos: 0,
        citas: 0,
    });
    const [loading, setLoading] = useState(false);

    // ─────────────────────────────────────────────────────────────
    // CARGA DE ESTADÍSTICAS (refactorizada)
    // ─────────────────────────────────────────────────────────────

    const loadStats = useCallback(async () => {
        if (!isAuthenticated || (!isAdmin && !isAux)) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const results = await Promise.allSettled([
                apiClient.get('/admin/categorias/estadisticas'),
                apiClient.get('/admin/subcategorias/estadisticas'),
                apiClient.get('/admin/servicios?limite=1'),
                apiClient.get('/admin/productos?limite=1'),
                apiClient.get('/admin/pedidos/estadisticas'),
                apiClient.get('/admin/citas'),
            ]);

            const [catsRes, subsRes, serRes, prodsRes, ordersRes, citasRes] = results;

            // ✅ Manejo de errores sin catch vacío
            let userStats = null;
            if (isAdmin) {
                try {
                    const userRes = await apiClient.get('/admin/usuarios/estadisticas');
                    userStats = userRes;
                } catch (error) {
                    console.error('Error al obtener estadísticas de usuarios:', error);
                    userStats = null;
                }
            }

            const categorias = getTotalFromResponse(catsRes.status === 'fulfilled' ? catsRes.value : null);
            const subcategorias = getTotalFromResponse(subsRes.status === 'fulfilled' ? subsRes.value : null);
            
            const servicios = serRes.status === 'fulfilled'
                ? serRes.value.data?.data?.paginacion?.total ?? serRes.value.data?.data?.servicios?.length ?? 0
                : 0;

            const productos = prodsRes.status === 'fulfilled'
                ? prodsRes.value.data?.data?.paginacion?.total ?? prodsRes.value.data?.data?.productos?.length ?? 0
                : 0;

            const ordStats = ordersRes.status === 'fulfilled'
                ? ordersRes.value.data?.data || {}
                : {};

            const citaPayload = citasRes.status === 'fulfilled'
                ? normalizePayload(citasRes.value)
                : {};

            const totalCitas = getTotalFromResponse(citasRes.status === 'fulfilled' ? citasRes.value : null);

            setStats({
                categorias,
                subcategorias,
                servicios,
                productos,
                usuarios: userStats?.data?.data?.total || 0,
                pedidos: ordStats.totalPedidos || 0,
                citas: totalCitas,
            });
        } catch (error) {
            // ✅ Error manejado correctamente con log
            console.error('Error cargando estadísticas del dashboard:', error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, isAdmin, isAux]);

    // ─────────────────────────────────────────────────────────────
    // EFECTOS
    // ─────────────────────────────────────────────────────────────

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    useFocusEffect(
        useCallback(() => {
            loadStats();
        }, [loadStats])
    );

    // ─────────────────────────────────────────────────────────────
    // RENDER: ACCESO RESTRINGIDO
    // ─────────────────────────────────────────────────────────────

    if (!isAuthenticated || (!isAdmin && !isAux)) {
        return (
            <View style={styles.centered}>
                <Ionicons name="lock-closed" size={60} color="#ccc" />
                <Text style={styles.restrictedTitle}>Acceso restringido</Text>
                <Text style={styles.restrictedSub}>Solo Administradores y auxiliares</Text>
            </View>
        );
    }

    // ─────────────────────────────────────────────────────────────
    // DEFINICIÓN DE TARJETAS
    // ─────────────────────────────────────────────────────────────

    const cards: StatCard[] = [
        { 
            title: 'Categorías', 
            value: stats.categorias, 
            icon: 'folder-outline', 
            gradient: ['#a56363', '#c8a27a'], 
            route: '/admin/categorias', 
            show: true 
        },
        { 
            title: 'Subcategorías', 
            value: stats.subcategorias, 
            icon: 'layers-outline', 
            gradient: ['#8b6f47', '#d4b483'], 
            route: '/admin/subcategorias', 
            show: true 
        },
        { 
            title: 'Productos', 
            value: stats.productos, 
            icon: 'cube-outline', 
            gradient: ['#b87a5a', '#e2c4a6'], 
            route: '/admin/productos', 
            show: true 
        },
        { 
            title: 'Servicios', 
            value: stats.servicios, 
            icon: 'build-outline', 
            gradient: ['#7a5c46', '#c8a27a'], 
            route: '/admin/servicios', 
            show: true 
        },
        { 
            title: 'Usuarios', 
            value: stats.usuarios, 
            icon: 'people-outline', 
            gradient: ['#8a7b5a', '#d8c3a5'], 
            route: '/admin/usuarios', 
            show: isAdmin 
        },
        { 
            title: 'Pedidos', 
            value: stats.pedidos, 
            icon: 'cart-outline', 
            gradient: ['#3e2f25', '#9c7b5b'], 
            route: '/admin/pedidos', 
            show: true 
        },
        { 
            title: 'Citas', 
            value: stats.citas, 
            icon: 'calendar-outline', 
            gradient: ['#a66a4c', '#d8b08c'], 
            route: '/admin/citas', 
            show: true 
        },
    ];

    // ─────────────────────────────────────────────────────────────
    // RENDER PRINCIPAL
    // ─────────────────────────────────────────────────────────────

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerTitle}>Panel de Administración</Text>
                        <Text style={styles.headerSub}>
                            Bienvenido, {user?.nombre || 'usuario'} · {isAdmin ? 'Administrador' : 'Auxiliar'}
                        </Text>
                    </View>
                    <View style={styles.headerIcon}>
                        <Ionicons name="speedometer-outline" size={32} color="#fff" />
                    </View>
                </View>
                <Text style={styles.headerDesc}>Sistema de gestión de AfroDB MOBILE</Text>
            </View>

            {/* GRID DE ESTADÍSTICAS */}
            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#a56363" />
                    <Text style={styles.loadingText}>Cargando estadísticas...</Text>
                </View>
            ) : (
                <View style={styles.grid}>
                    {cards.filter(c => c.show).map((card) => (
                        <Pressable
                            key={card.title}
                            style={[styles.card, { borderLeftColor: card.gradient[0] }]}
                            onPress={() => push(card.route)}
                        >
                            <View style={styles.cardTop}>
                                <View style={styles.cardTextWrap}>
                                    <Text style={styles.cardLabel}>{card.title}</Text>
                                    <Text style={styles.cardValue}>{card.value}</Text>
                                </View>
                                <View style={styles.cardIconWrap}>
                                    <Ionicons name={card.icon} size={28} color="#3e2f25" />
                                </View>
                            </View>
                            <View style={styles.cardFooter}>
                                <Text style={styles.cardFooterText}>Ver detalles</Text>
                                <Ionicons name="arrow-forward" size={14} color="#3e2f25" />
                            </View>
                        </Pressable>
                    ))}
                </View>
            )}

            {/* ACCESOS RÁPIDOS */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="flash" size={18} color="#fff" />
                    <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
                </View>
                <View style={styles.sectionBody}>
                    <Pressable
                        style={[styles.actionBtn, { borderColor: '#7a5c46' }]}
                        onPress={() => push('/admin/servicios')}
                    >
                        <Ionicons name="add-circle-outline" size={18} color="#7a5c46" />
                        <Text style={[styles.actionText, { color: '#7a5c46' }]}>Agregar Servicio</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.actionBtn, { borderColor: '#b87a5a' }]}
                        onPress={() => push('/admin/productos')}
                    >
                        <Ionicons name="add-circle-outline" size={18} color="#b87a5a" />
                        <Text style={[styles.actionText, { color: '#b87a5a' }]}>Agregar Producto</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.actionBtn, { borderColor: '#a56363' }]}
                        onPress={() => push('/admin/categorias')}
                    >
                        <Ionicons name="add-circle-outline" size={18} color="#a56363" />
                        <Text style={[styles.actionText, { color: '#a56363' }]}>Agregar Categoría</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.actionBtn, { borderColor: '#8b6f47' }]}
                        onPress={() => push('/admin/subcategorias')}
                    >
                        <Ionicons name="layers-outline" size={18} color="#8b6f47" />
                        <Text style={[styles.actionText, { color: '#8b6f47' }]}>Agregar Subcategoría</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.actionBtn, { borderColor: '#3e2f25' }]}
                        onPress={() => push('/admin/pedidos')}
                    >
                        <Ionicons name="list-outline" size={18} color="#3e2f25" />
                        <Text style={[styles.actionText, { color: '#3e2f25' }]}>Gestionar Pedidos</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.actionBtn, { borderColor: '#8a7b5a' }]}
                        onPress={() => push('/')}
                    >
                        <Ionicons name="storefront-outline" size={18} color="#8a7b5a" />
                        <Text style={[styles.actionText, { color: '#8a7b5a' }]}>Visitar Tienda</Text>
                    </Pressable>
                </View>
            </View>

            {/* INFORMACIÓN DEL SISTEMA */}
            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Información del Sistema</Text>
                <View style={styles.infoRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.infoText}>Sistema operativo correctamente</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="server-outline" size={16} color="#7b6758" />
                    <Text style={styles.infoText}>API: http://10.0.2.2:5000</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="shield-checkmark-outline" size={16} color="#f59e0b" />
                    <Text style={styles.infoText}>Rol: {isAdmin ? 'Administrador' : 'Auxiliar'}</Text>
                </View>
            </View>
        </ScrollView>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 32 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
    restrictedTitle: { fontSize: 22, fontWeight: '700', color: '#333' },
    restrictedSub: { color: '#7b6758', fontSize: 14 },

    header: {
        borderRadius: 16,
        backgroundColor: '#d6a672',
        padding: 20,
        gap: 8,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
    headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.92)', marginTop: 2 },
    headerDesc: { fontSize: 13, color: 'rgba(255,255,255,0.82)' },
    headerIcon: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 12,
        padding: 10,
    },

    loadingBox: { alignItems: 'center', gap: 10, paddingVertical: 24 },
    loadingText: { color: '#7b6758' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    card: {
        borderRadius: 16,
        padding: 18,
        width: '48%',
        gap: 12,
        backgroundColor: '#fff',
        borderLeftWidth: 6,
        borderLeftColor: '#d6a672',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
    cardTextWrap: { flex: 1 },
    cardLabel: { fontSize: 12, color: '#7b6758', fontWeight: '600', textTransform: 'uppercase' },
    cardValue: { fontSize: 30, fontWeight: '800', color: '#3e2f25', marginTop: 6 },
    cardIconWrap: {
        backgroundColor: '#f3e6d8',
        borderRadius: 12,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
    cardFooterText: { fontSize: 12, color: '#7b6758', fontWeight: '700' },

    section: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#d6a672',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#3e2f25',
        padding: 14,
    },
    sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
    sectionBody: { backgroundColor: '#fff', padding: 14, gap: 10 },

    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 2,
        borderRadius: 10,
        paddingVertical: 13,
        paddingHorizontal: 16,
    },
    actionText: { fontWeight: '600', fontSize: 14 },

    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e6d3b3',
        padding: 16,
        gap: 10,
    },
    infoTitle: { fontWeight: '700', fontSize: 15, color: '#222', marginBottom: 4 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    infoText: { color: '#444', fontSize: 14 },
});