// Página: dashboard.tsx. vista de dashboard del sistema.
/**
 * Pantalla principal del panel del administradir y auxiliar
 * solos accesible para roles defnidos     
 * muestra tarjetas de estadisticas enn tiempo real categorias y productos 
 * pedidos / ventas totales 
 * los auxiliares ven todo excepto la tarjeta de usuarios isAdmin=false
 * incluye accesos rapidos y las secciones mas usadas
 * muestra informacion del sistema (estado de la api y rol de usuario)
 */
//importaciones
import { useState, useEffect, useCallback } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from '@react-navigation/native';

//navegacion de expo router
import { router } from "expo-router";
//Biblioteca de iconos de react
import { Ionicons } from "@expo/vector-icons";
//ciente http axios con JWT
import apiClient from '../../src/api/apiClient';
//autenticacion
import { useAuth } from "../../src/context/AuthContext";

//control rol
//solo necesita rol y nombre del usuario en pantalla
type AuthUser = { rol?: string; nombre?: string };

/**
 * Panel de navegacon
 * El tipo e router de expo no expone el push con tipiado correcto
 * las versiones actuales de ios y andrioid no npermite uso del push
 * 
 */

const push = (path: string) => (router as unknown as { push: (p: string) => void }).push(path);

// Tipo de statCARD
// describe la forma de cada tarjeta d estadisticas de grid

type StatCard = {
    title: string; //etiqueta de a tarjeta
    value: number; // valor numerico a mostrar
    icon: keyof typeof Ionicons.glyphMap; //nombre de los icons 
    gradient: [string, string]; //par de colores fondo principal y fondo secundario 
    route: string; // ruta a la que navega al precionar la tarjeta
    show: boolean; // si es false la tarjeta no se muestra
};
// componente principal del dashboard 
// Renderiza la vista principal de este componente.
export default function AdminDashboardScreen() {
    // contexto de autenticacion
    // se usa cast a tipo explicito porque AuthContext.js es js puro y no lo reconoce TSX
    const { user, isAuthenticated } = useAuth() as { user: AuthUser | null; isAuthenticated: boolean };
    //Flags de rol para controlar que se muestra la pantalla segun rol de usuario
    const isAdmin = user?.rol === 'administrador';//true solo para administradores
    const isAux = user?.rol === 'auxiliar'; // true solo si es auxiliar

    /**
     * Estado local
     * objeto con todos los contadores que se muestran en el grid de tarjetas
     * valores iniciales en 0 mientras se cargan
     */

    const [stats, setStats] = useState({
        categorias: 0,
        subcategorias: 0,
        servicios: 0,
        productos: 0,
        usuarios: 0, // numero de usuarios registrados solo el admin
        pedidos: 0,
        citas: 0,
    });
    const [loading, setLoading] = useState(false);

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

            let userStats = null;
            if (isAdmin) {
                try {
                    userStats = await apiClient.get('/admin/usuarios/estadisticas');
                } catch (error) {
                    console.error('Error al obtener estadísticas de usuarios:', error);
                }
            }

            const categorias = catsRes.status === 'fulfilled'
                ? catsRes.value.data?.data?.total ?? 0
                : 0;

            const subcategorias = subsRes.status === 'fulfilled'
                ? subsRes.value.data?.data?.total ?? 0
                : 0;

            const servicios = serRes.status === 'fulfilled'
                ? serRes.value.data?.data?.paginacion?.total ?? serRes.value.data?.data?.servicios?.length ?? 0
                : 0;

            const productos = prodsRes.status === 'fulfilled'
                ? prodsRes.value.data?.data?.paginacion?.total ?? prodsRes.value.data?.data?.productos?.length ?? 0
                : 0;

            const ordStats = ordersRes.status === 'fulfilled'
                ? ordersRes.value.data?.data || {}
                : {};

            const normalizePayload = (response: any): any => response?.data?.data ?? response?.data ?? {};

            const citaPayload = citasRes.status === 'fulfilled'
                ? normalizePayload(citasRes.value)
                : {};

            const canReadCount = (payload: any): number => {
                if (!payload) return 0;
                if (Array.isArray(payload)) return payload.length;
                if (typeof payload.totalCitas === 'number') return payload.totalCitas;
                if (typeof payload.total === 'number') return payload.total;
                if (Array.isArray(payload.citas)) return payload.citas.length;
                return 0;
            };

            const totalCitas = canReadCount(citaPayload);

            setStats({
                categorias,
                subcategorias,
                servicios,
                productos,
                usuarios: userStats?.data?.data?.total || 0,
                pedidos: ordStats.totalPedidos || 0,
                citas: totalCitas,
                
            });
        } catch (_) {
            // Si alguna petición falla por error inesperado, mantenemos los valores en 0.
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, isAdmin, isAux]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    useFocusEffect(
        useCallback(() => {
            loadStats();
        }, [loadStats])
    );

    if (!isAuthenticated || (!isAdmin && !isAux)) {
        return (
            <View style={styles.centered}>
                <Ionicons name="lock-closed" size={60} color="#ccc" />
                <Text style={styles.restrictedTitle}>Acceso restringido</Text>
                <Text style={styles.restrictedSub}>Solo Administradores y auxiliares</Text>
            </View>
        );
    }

    // ── DEFINICIÓN DE TARJETAS ────────────────────────────────────────────────
    // Array de objetos StatCard que definen cada tarjeta del grid.
    // El campo 'show' controla si la tarjeta se renderiza o no.
    // La tarjeta de 'Usuarios' solo se muestra a administradores (show: isAdmin).
    const cards: StatCard[] = [
        { title: 'Categorías', value: stats.categorias, icon: 'folder-outline', gradient: ['#a56363', '#c8a27a'], route: '/admin/categorias', show: true },

    { title: 'Subcategorías', value: stats.subcategorias, icon: 'layers-outline', gradient: ['#8b6f47', '#d4b483'], route: '/admin/subcategorias', show: true },

    { title: 'Productos', value: stats.productos, icon: 'cube-outline', gradient: ['#b87a5a', '#e2c4a6'], route: '/admin/productos', show: true },

    { title: 'Servicios', value: stats.servicios, icon: 'build-outline', gradient: ['#7a5c46', '#c8a27a'], route: '/admin/servicios', show: true },

    { title: 'Usuarios', value: stats.usuarios, icon: 'people-outline', gradient: ['#8a7b5a', '#d8c3a5'], route: '/admin/usuarios', show: isAdmin },

    { title: 'Pedidos', value: stats.pedidos, icon: 'cart-outline', gradient: ['#3e2f25', '#9c7b5b'], route: '/admin/pedidos', show: true },

    { title: 'Citas', value: stats.citas, icon: 'calendar-outline', gradient: ['#a66a4c', '#d8b08c'], route: '/admin/citas', show: true },
    ];

    // ── HELPER: formateador de moneda ─────────────────────────────────────────
  // Convierte un número a formato de pesos colombianos. Ej: 45000 → "$45.000"
  const fmt = (n: number) => `$${Number(n).toLocaleString('es-CO')}`;

  // ── RENDERIZADO PRINCIPAL ─────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      {/* Tarjeta índigo con el título del panel, bienvenida y descripción. */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Panel de Administración</Text>
            {/* Saludo dinámico: nombre del usuario y su rol. */}
            <Text style={styles.headerSub}>
              Bienvenido, {user?.nombre || 'usuario'} · {isAdmin ? 'Administrador' : 'Auxiliar'}
            </Text>
          </View>
          {/* Ícono decorativo del dashboard en la esquina superior derecha. */}
          <View style={styles.headerIcon}>
            <Ionicons name="speedometer-outline" size={32} color="#fff" />
          </View>
        </View>
        <Text style={styles.headerDesc}>Sistema de gestión de AfroDB MOBILE</Text>
      </View>

      {/* ── GRID DE ESTADÍSTICAS ────────────────────────────────────────── */}
      {/* Mientras carga: spinner. Cuando termina: grid de tarjetas 2 columnas. */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#a56363" />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {/* Filtra las tarjetas con show=true y renderiza cada una. */}
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

{/* ── ACCESOS RÁPIDOS ──────────────────────────────────────────────── */}
<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <Ionicons name="flash" size={18} color="#fff" />
    <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
  </View>

  <View style={styles.sectionBody}>
    {/* Agregar Servicio */}
    <Pressable
      style={[styles.actionBtn, { borderColor: '#7a5c46' }]}
      onPress={() => push('/admin/servicios')}
    >
      <Ionicons name="add-circle-outline" size={18} color="#7a5c46" />
      <Text style={[styles.actionText, { color: '#7a5c46' }]}>
        Agregar Servicio
      </Text>
    </Pressable>

    {/* Agregar Producto */}
    <Pressable
      style={[styles.actionBtn, { borderColor: '#b87a5a' }]}
      onPress={() => push('/admin/productos')}
    >
      <Ionicons name="add-circle-outline" size={18} color="#b87a5a" />
      <Text style={[styles.actionText, { color: '#b87a5a' }]}>
        Agregar Producto
      </Text>
    </Pressable>

    {/* Agregar Categoría */}
    <Pressable
      style={[styles.actionBtn, { borderColor: '#a56363' }]}
      onPress={() => push('/admin/categorias')}
    >
      <Ionicons name="add-circle-outline" size={18} color="#a56363" />
      <Text style={[styles.actionText, { color: '#a56363' }]}>
        Agregar Categoría
      </Text>
    </Pressable>

    {/* Agregar Subcategoría */}
    <Pressable
      style={[styles.actionBtn, { borderColor: '#8b6f47' }]}
      onPress={() => push('/admin/subcategorias')}
    >
      <Ionicons name="layers-outline" size={18} color="#8b6f47" />
      <Text style={[styles.actionText, { color: '#8b6f47' }]}>
        Agregar Subcategoría
      </Text>
    </Pressable>

    {/* Gestionar Pedidos */}
    <Pressable
      style={[styles.actionBtn, { borderColor: '#3e2f25' }]}
      onPress={() => push('/admin/pedidos')}
    >
      <Ionicons name="list-outline" size={18} color="#3e2f25" />
      <Text style={[styles.actionText, { color: '#3e2f25' }]}>
        Gestionar Pedidos
      </Text>
    </Pressable>

    {/* Visitar Tienda */}
    <Pressable
      style={[styles.actionBtn, { borderColor: '#8a7b5a' }]}
      onPress={() => push('/')}
    >
      <Ionicons name="storefront-outline" size={18} color="#8a7b5a" />
      <Text style={[styles.actionText, { color: '#8a7b5a' }]}>
        Visitar Tienda
      </Text>
    </Pressable>
  </View>
</View>

      {/* ── INFORMACIÓN DEL SISTEMA ──────────────────────────────────────── */}
      {/* Tarjeta informativa con estado del sistema, URL de la API y rol actual. */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Información del Sistema</Text>
        {/* Estado: verde = sistema funcionando correctamente */}
        <View style={styles.infoRow}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={styles.infoText}>Sistema operativo correctamente</Text>
        </View>
        {/* URL de la API: 10.0.2.2 es localhost del emulador Android */}
        <View style={styles.infoRow}>
          <Ionicons name="server-outline" size={16} color="#7b6758" />
          <Text style={styles.infoText}>API: http://10.0.2.2:5000</Text>
        </View>
        {/* Rol del usuario actualmente autenticado */}
        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#f59e0b" />
          <Text style={styles.infoText}>Rol: {isAdmin ? 'Administrador' : 'Auxiliar'}</Text>
        </View>
      </View>

    </ScrollView>
  );
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Contenedor raíz del ScrollView: ocupa toda la pantalla.
  container: { flex: 1 },
  // Contenido interno: padding general + gap entre secciones + padding inferior.
  content: { padding: 16, gap: 16, paddingBottom: 32 },

  // Centrado de pantalla completa para el estado de "acceso restringido".
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  restrictedTitle: { fontSize: 22, fontWeight: '700', color: '#333' },
  restrictedSub: { color: '#7b6758', fontSize: 14 },

  // ── HEADER ────────────────────────────────────────
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

  // ── CARGA ─────────────────────────────────────────
  loadingBox: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  loadingText: { color: '#7b6758' },

  // ── GRID DE TARJETAS ──────────────────────────────
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

  // ── BANNER DE VENTAS ──────────────────────────────
  salesBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff',
    borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#e6d3b3',
  },
  salesLabel: { fontSize: 12, color: '#7b6758' },
  salesValue: { fontSize: 22, fontWeight: '800', color: '#c8a27a' },

  // ── SECCIÓN (Accesos Rápidos) ─────────────────────
  // Contenedor con borde y overflow hidden para que el header redondeado se vea bien.
  section: {
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#d6a672',
  },
  // Encabezado de sección: fondo oscuro con ícono + título.
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#3e2f25', padding: 14,
  },
  sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionBody: { backgroundColor: '#fff', padding: 14, gap: 10 }, // Área blanca con los botones.
  // Botón outline: solo borde de color, sin relleno. El color se aplica inline.
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 2, borderRadius: 10,
    paddingVertical: 13, paddingHorizontal: 16,
  },
  actionText: { fontWeight: '600', fontSize: 14 }, // El color se aplica inline.

  // ── TARJETA DE INFORMACIÓN ────────────────────────
  // Card blanca con borde gris para el panel "Información del Sistema".
  infoCard: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#e6d3b3',
    padding: 16, gap: 10,
  },
  infoTitle: { fontWeight: '700', fontSize: 15, color: '#222', marginBottom: 4 },
  // Cada fila de info: ícono de color + texto descriptivo.
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { color: '#444', fontSize: 14 },
});