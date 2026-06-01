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
import { useState, useEffect } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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
export default function AdminDashboardScreen() {
    // contexto de autenticacion
    // se usa cast a tipo explicito porque AuthContext.js es js puro y no lo reconoce TSX
    const { user, isAuthenticated } = useAuth() as { user: AuthUser | null; isAuthenticated: boolean };
    //Flags de rol para controlar que se muestra la pantalla segun rol de usuario
    const isAdmin = user?.rol === 'administrador';//true solo para administradores
    const isAux = user?.rol === 'auxiliar'; // true solo si es auxiliar

    /**
     * Estado local
     * objeto con toos los conttroladores que se muestran en grip de tarjetas
     * valores iniciales en 0 miestra se cargan 
     */

    const [stats, setStats] = useState({
        categorias: 0,
        subcategorias: 0,
        productos: 0,
        usuarios: 0,//numero de usuarios regitrados solo el admin
        pedidos: 0,
        pendientes: 0,
        ventas: 0,
    });

    const [loading, setLoading] = useState(false);
    //efectos de carga de estadisticas
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // se hacen 4 peticiones en paralelo con promise.all para reducir el tiempo de carga 
                // cada una rae datos de una seccion diferente al panel
                const [cats, subs, prods, orders] = await Promise.all([
                    apiClient.get('/admin/categorias'),
                    apiClient.get('/admin/subcategorias'),
                    apiClient.get('/admin/productos?limite=1'),//porque solo se necesita el total
                    apiClient.get('/admin/pedidos/estadisticas'),
                ]);

                //los stats de usuarios solo se piden si el usuario es administrador
                //los auxiliares no tienen acceso a ese endpoint
                const userStats = isAdmin 
                ? await apiClient.get('/admin/usuarios/stats') 
                : null;

                //extare los datos de cada respuesta con opcional cahnging y fallback
                const catsData = cats?.data?.data?.categorias || [];
                const subData = subs?.data?.data?.subcategorias || [];
                const ordStats = orders?.data?.data || {};
                const pedidosPorEstado = Array.isArray(ordStats.pedidosPorEstado) ? ordStats.pedidosPorEstado : [];
                const pedidosPendientes = pedidosPorEstado.find((item: { estado?: string; cantidad?: number }) => item.estado === 'pendiente');

                //acualizar el estado con todos los contadores calculados
                setStats({
                    categorias: Array.isArray(catsData) ? catsData.length : 0,
                    subcategorias: Array.isArray(subData) ? subData.length : 0,
                    productos: prods.data?.data?.paginacion?.total || 0,
                  usuarios: userStats?.data?.data?.total || 0,
                  pedidos: ordStats.totalPedidos || 0,
                  pendientes: pedidosPendientes?.cantidad || 0,
                  ventas: ordStats.ventasTotales || 0,
                });

            } catch (_) {
                // si alguna peticion falla simplemente se ignora el error
                //los stats quedan en 0 no se muestra mensaje de eror al usuario 
                // igore 
            } finally {
                setLoading(false);
            }
        };

        /**
         * solo cargan las estadisticas si el usuario esta autenticado y tiene roladmin o auxiliar
         */
        if (isAuthenticated && (isAdmin || isAux)) load();
    }, [ isAuthenticated, isAdmin, isAux]); // se ejecuta segun el rol que incio sesion

    //si el isiario no esta autenticado o no tiene rol admin/auxiliar muestra bloqueo
    if (!isAuthenticated || (!isAdmin && !isAux)) {
        return(
        <View style={styles.centered}>
            <Ionicons name="lock-closed" size={60} color="#ccc" />
            <Text style={styles.restrictedTitle}>Acceso restringido</Text>
            <Text style={styles.restrictedSub}>Solo Administradores y auxiliares</Text>
        </View>
        )
    }

    
  // ── DEFINICIÓN DE TARJETAS ────────────────────────────────────────────────
  // Array de objetos StatCard que definen cada tarjeta del grid.
  // El campo 'show' controla si la tarjeta se renderiza o no.
  // La tarjeta de 'Usuarios' solo se muestra a administradores (show: isAdmin).
  const cards: StatCard[] = [
    { title: 'Categorías',    value: stats.categorias,    icon: 'folder-outline',      gradient: ['#667eea', '#764ba2'], route: '/admin/categorias', show: true },
    { title: 'Subcategorías', value: stats.subcategorias, icon: 'folder-open-outline', gradient: ['#06b6d4', '#0891b2'], route: '/admin/productos', show: true },
    { title: 'Productos',     value: stats.productos,     icon: 'cube-outline',        gradient: ['#10b981', '#059669'], route: '/admin/productos', show: true },
    { title: 'Usuarios',      value: stats.usuarios,      icon: 'people-outline',      gradient: ['#f59e0b', '#d97706'], route: '/admin/usuarios',  show: isAdmin }, // Solo admin.
    { title: 'Pedidos',       value: stats.pedidos,       icon: 'cart-outline',        gradient: ['#6b7280', '#4b5563'], route: '/admin/pedidos',   show: true },
    { title: 'Pendientes',    value: stats.pendientes,    icon: 'time-outline',        gradient: ['#ef4444', '#dc2626'], route: '/admin/pedidos',   show: true },
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
        <Text style={styles.headerDesc}>Sistema de gestión del e-commerce</Text>
      </View>

      {/* ── GRID DE ESTADÍSTICAS ────────────────────────────────────────── */}
      {/* Mientras carga: spinner. Cuando termina: grid de tarjetas 2 columnas. */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {/* Filtra las tarjetas con show=true y renderiza cada una. */}
          {cards.filter(c => c.show).map((card) => (
            <Pressable
              key={card.title}
              // El color de fondo es el primer color del gradiente de cada tarjeta.
              style={[styles.card, { backgroundColor: card.gradient[0] }]}
              onPress={() => push(card.route)} // Navega a la sección correspondiente.
            >
              <View style={styles.cardTop}>
                <View>
                  {/* Etiqueta pequeña: nombre de la estadística */}
                  <Text style={styles.cardLabel}>{card.title}</Text>
                  {/* Número grande: valor de la estadística */}
                  <Text style={styles.cardValue}>{card.value}</Text>
                </View>
                {/* Ícono a la derecha dentro de un círculo semitransparente */}
                <View style={styles.cardIconWrap}>
                  <Ionicons name={card.icon} size={32} color="rgba(255,255,255,0.9)" />
                </View>
              </View>
              {/* Pie de la tarjeta: texto "Ver detalles" con flecha */}
              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterText}>Ver detalles</Text>
                <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.9)" />
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* ── BANNER DE VENTAS TOTALES ─────────────────────────────────────── */}
      {/* Solo se muestra cuando ya terminó de cargar (evita mostrar $0 mientras carga). */}
      {!loading && (
        <View style={styles.salesBanner}>
          <Ionicons name="trending-up-outline" size={22} color="#6366f1" />
          <View style={{ flex: 1 }}>
            <Text style={styles.salesLabel}>Ventas Totales</Text>
            {/* Total de ventas formateado en COP */}
            <Text style={styles.salesValue}>{fmt(stats.ventas)}</Text>
          </View>
        </View>
      )}

      {/* ── ACCESOS RÁPIDOS ──────────────────────────────────────────────── */}
      {/* Sección con botones outline de colores para ir rápidamente a cada módulo. */}
      <View style={styles.section}>
        {/* Encabezado de sección: fondo índigo con ícono + título */}
        <View style={styles.sectionHeader}>
          <Ionicons name="flash" size={18} color="#fff" />
          <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
        </View>
        <View style={styles.sectionBody}>
          {/* Botón: Agregar Producto → va a /admin/productos (color índigo) */}
          <Pressable style={[styles.actionBtn, { borderColor: '#6366f1' }]} onPress={() => push('/admin/productos')}>
            <Ionicons name="add-circle-outline" size={18} color="#6366f1" />
            <Text style={[styles.actionText, { color: '#6366f1' }]}>Agregar Producto</Text>
          </Pressable>
          {/* Botón: Agregar Categoría → va a /admin/categorias (verde) */}
          <Pressable style={[styles.actionBtn, { borderColor: '#10b981' }]} onPress={() => push('/admin/categorias')}>
            <Ionicons name="add-circle-outline" size={18} color="#10b981" />
            <Text style={[styles.actionText, { color: '#10b981' }]}>Agregar Categoría</Text>
          </Pressable>
          {/* Botón: Gestionar Pedidos → va a /admin/pedidos (azul cian) */}
          <Pressable style={[styles.actionBtn, { borderColor: '#06b6d4' }]} onPress={() => push('/admin/pedidos')}>
            <Ionicons name="list-outline" size={18} color="#06b6d4" />
            <Text style={[styles.actionText, { color: '#06b6d4' }]}>Gestionar Pedidos</Text>
          </Pressable>
          {/* Botón: Visitar Tienda → va a '/' (la tab principal del catálogo) (gris) */}
          <Pressable style={[styles.actionBtn, { borderColor: '#6b7280' }]} onPress={() => push('/')}>
            <Ionicons name="storefront-outline" size={18} color="#6b7280" />
            <Text style={[styles.actionText, { color: '#6b7280' }]}>Visitar Tienda</Text>
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
          <Ionicons name="server-outline" size={16} color="#6366f1" />
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
  restrictedSub: { color: '#888', fontSize: 14 },

  // ── HEADER ────────────────────────────────────────
  // Tarjeta índigo (#6366f1) con bordes redondeados.
  header: {
    borderRadius: 16,
    backgroundColor: '#6366f1',
    padding: 20,
    gap: 8,               // Espacio entre la fila superior y la descripción.
  },
  // Fila superior: título+saludo a la izquierda, ícono a la derecha.
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 }, // Saludo semitransparente.
  headerDesc: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },              // Descripción más tenue.
  // Círculo blanco semitransparente que envuelve el ícono del dashboard.
  headerIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 10,
  },

  // ── CARGA ─────────────────────────────────────────
  loadingBox: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  loadingText: { color: '#666' },

  // ── GRID DE TARJETAS ──────────────────────────────
  // Contenedor flex con wrap: las tarjetas se distribuyen en 2 columnas.
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  // Tarjeta individual: ancho ~47% para que entren 2 por fila (con gap de 12).
  card: {
    borderRadius: 14,
    padding: 16,
    width: '47%',         // ~mitad del ancho menos el gap.
    gap: 10,              // Espacio entre cardTop y cardFooter.
  },
  // Fila superior de la tarjeta: label+valor a la izquierda, ícono a la derecha.
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' }, // Nombre de la stat.
  cardValue: { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 2 },     // Número grande.
  // Círculo blanco semitransparente alrededor del ícono de cada tarjeta.
  cardIconWrap: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 8,
  },
  // Pie de tarjeta: "Ver detalles" + flecha.
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardFooterText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },

  // ── BANNER DE VENTAS ──────────────────────────────
  // Fila blanca con borde gris: ícono + label "Ventas Totales" + valor en COP.
  salesBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff',
    borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#e8e8e8',
  },
  salesLabel: { fontSize: 12, color: '#888' },                           // "Ventas Totales" en gris.
  salesValue: { fontSize: 22, fontWeight: '800', color: '#6366f1' },     // Monto en índigo grande.

  // ── SECCIÓN (Accesos Rápidos) ─────────────────────
  // Contenedor con borde y overflow hidden para que el header redondeado se vea bien.
  section: {
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#e8e8e8',
  },
  // Encabezado de sección: fondo índigo con ícono + título.
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#6366f1', padding: 14,
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
    borderWidth: 1, borderColor: '#e8e8e8',
    padding: 16, gap: 10,
  },
  infoTitle: { fontWeight: '700', fontSize: 15, color: '#222', marginBottom: 4 },
  // Cada fila de info: ícono de color + texto descriptivo.
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { color: '#444', fontSize: 14 },
});