/**
 * Pantalla del carrio de compras y sus respectivas gestiones no requiere que este autenticado solo para hacer compras
 */

/** importar componentes de React native para construir la pantalla
 * ActivityIndicator, spiner de carga circular
 * Alert, dialogos emergentes nativos del sistema
 * Image, muestra las imagenes
 * Pressable, area tactil
 * ScrollView, contenedor com scroll vertical
 * StyleSheet, crea los estilos de forma optimizada
 * Text, muestra texto plano en pantalla
 * View, Contenedor generico equivale a un div en html y css
 * 
 */

import { useCallback } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';
//Ionicons liberia de iconos cevtoriales para react native 
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import { useCarrito } from "../../src/context/CarritoContext"

//carritoctx define la forma de los datos que devuelve useCarrito
//TypeScript necesita esto porque CarritoContext.js esta en javaScript 
type carritoCtx = {
    //items lista de productos en el carrito
    items: { id: string, nombre?: string, precio?: number, cantidad: number, imagen?: string }[];
    // total suma total en pesos colombianos de todos los items 
    total: number;
    //Total items numero total de items del carrito
    totalItems: number;
    //loading true mientras el contexto carga los datos iniciales
    loading: boolean;
    //cambiar cantidad actualiza la cantidad de un producto 
    cambiarCantidad: (id: string, cantidad: number) => Promise<void>;
    //eliminar item elimina un producto del carrito
    eliminarItem: (id: string) => Promise<void>;
    //vaciar carrito elimina todos los productos del carrito
    vaciarCarrito: () => Promise<void>;
};

// HELPERS de navegacion 
//expo router tipifica router de forma extricta y expone .push/replace 
//Directamente en typescript, se usa as unknown as .... para fprzar el tipo
//y poder llmar a las funciones de navegacion sin  errores de compilacion 

//routerPush navega a una nueva pantalla apilandola es decir se puede volver atras
const routerPush = (path: string) => (router as unknown as { push: (p: string) => void }).push(path);
//routerReplace navega a una pantallla remplazando la actual recuerda que se puede volver atras
const routerReplace = (path: string) => (router as unknown as { replace: (p: string) => void }).replace(path);

//fmt: formatea un numero como pecio en pesos colombianos ejemplo fmt (15000) -> $15.000
const fmt = (n: number) => `$${Number(n).toLocaleString('es-CO')}`;

// componente principal carito Screen 
export default function CarritoScreen() {
    //Obtiene el contexto de auth solo si el usuario esa autenticado
    const { isAuthenticated } = useAuth() as { isAuthenticated: boolean };

    //Ontiene del contexto del carrito los datos y funciones necesarias 
    //se usa aas CarritoCtx porque el cotexto de js y typescript no infiere en tipos
  const { items, total, loading, cambiarCantidad, eliminarItem, vaciarCarrito, refreshCarrito } = useCarrito() as carritoCtx & { refreshCarrito: () => Promise<void> };

  useFocusEffect(
    useCallback(() => {
      refreshCarrito();
    }, [refreshCarrito])
  );

    // Pantalla de carga 
    // si el carrito aun esta cargando por ejemplo reupera los datos guardados 
    //se muestra un spiner centardo en lugar del conntenido normal

    if (loading) {
        return (
            <View style={styles.centered}>
                {/* spiner circilar de color indigo*/}
                <ActivityIndicator size="large" color="#a57c63"/>
                <Text style={styles.loadingText}>Cargando carrito...</Text>
            </View>
        );
    }

    //Funcion handleIrACheckout o sea pagar
    // si el usuario no esta autenticado muestra el dialogo de inicio de sesion
    // si esta autenticado navega directamente a la pantalla de pagos 
    const handleIrACheckout = () => {
        if (!isAuthenticated) {
            Alert.alert(
                'Inicia sesion',
                'Debest iniciar sesion para proceder al pago',
                [
                    //boto n cancelar cierra dalogo sin hacer nada
                    { text: 'Cancelar', style:'cancel' },
                    //boton iniciar sesion lleva a pestaña cuenta explore.tsx
                    { text: 'Iniciar Sesion', onPress: () => routerReplace('/explore') },
                ]
            );
            return; //sale de la funcion 
        }
        // usuario autenticado navega a la pantalla de pagos
        routerPush('/checkout');
    };

    //Funcion handleVaciarCarrito o sea pagar
    // Muestra el dialogo de confirmacion de vaciar carrito
    const handleVaciarCarrito = () => {
            Alert.alert(
                'Vaciar carrito',
                '¿Estás seguro de que quieres vaciar el carrito?',
                [
                    //boto n cancelar cierra dalogo sin hacer nada
                    { text: 'Cancelar', style:'cancel' },
                    //boton iniciar sesion lleva a pestaña cuenta explore.tsx
                    { text: 'Vaciar', style: 'destructive', onPress: () => vaciarCarrito() },
                ]
            );
        };

        /**
         * Renderizado principal del carrito
         * style -> ocupa todo el alto disponible depende el celular ios android
         * contentContaierStyle -> aplica padding y gad al contenido interno
         */
        return(
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

            {/** Encabezados
             * fila horizontal: icono del carrito + titulo "Mi carrito" */}
             <View style={styles.header}>
        <Ionicons name="cart" size={28} color="#a57c63" />
        <Text style={styles.headerTitle}>Mi Carrito</Text>
      </View>

      {/* ── BANNER INFORMATIVO (solo para usuarios NO autenticados) ─────── */}
      {/* Se muestra un aviso azul explicando que pueden comprar sin iniciar sesión */}
      {!isAuthenticated && (
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={18} color="#1d4ed8" />
          <Text style={styles.infoBannerText}>
            Puedes agregar productos sin iniciar sesión. Al momento de pagar deberás iniciar sesión.
          </Text>
        </View>
      )}

      {/* ── RENDERIZADO CONDICIONAL: VACÍO vs CON PRODUCTOS ─────────────── */}
      {items.length === 0 ? (
        // ── CARRITO VACÍO ─────────────────────────────────────────────────
        // Se muestra cuando no hay ningún producto agregado.
        <View style={styles.emptyContainer}>
          {/* Ícono grande de carrito vacío en gris */}
          <Ionicons name="cart-outline" size={90} color="#ccc" />
          <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
          <Text style={styles.empty}>Agrega productos para comenzar tu compra</Text>
          {/* Botón para ir al catálogo (reemplaza la pantalla actual) */}
          <Pressable style={styles.catalogBtn} onPress={() => routerReplace('/')}>
            <Ionicons name="storefront-outline" size={16} color="#fff" />
            <Text style={styles.catalogBtnText}>Ir al Catálogo</Text>
          </Pressable>
        </View>
      ) : (
        // ── CARRITO CON PRODUCTOS ─────────────────────────────────────────
        // Fragment (<>) para agrupar sin agregar un View extra al árbol.
        <>
          {/* ── TARJETA DE PRODUCTOS ────────────────────────────────────── */}
          <View style={styles.sectionCard}>

            {/* Cabecera de la tarjeta: título + badge con cantidad + botón vaciar */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Productos en tu carrito</Text>
                {/* Badge índigo con el número de ítems distintos */}
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{items.length}</Text>
                </View>
              </View>
              {/* Botón "Vaciar carrito" con borde rojo → llama handleVaciarCarrito */}
              <Pressable style={styles.vaciarBtn} onPress={handleVaciarCarrito}>
                <Ionicons name="trash-outline" size={14} color="#b93a32" />
                <Text style={styles.vaciarText}>Vaciar carrito</Text>
              </Pressable>
            </View>

            {/* ── LISTA DE ÍTEMS ──────────────────────────────────────────── */}
            {/* .map() recorre cada ítem del carrito y genera una fila por producto */}
            {items.map((item, index) => (
              // key={item.id}: identificador único para que React optimice el renderizado.
              <View key={item.id}>
                {/* Línea separadora entre ítems (no se muestra antes del primero) */}
                {index > 0 && <View style={styles.itemDivider} />}

                {/* Fila de un ítem: imagen + datos + controles */}
                <View style={styles.itemRow}>
                  {/* Imagen del producto. Si no tiene imagen, usa un placeholder genérico.
                      La URL apunta al servidor backend local (10.0.2.2 = localhost en emulador Android) */}
                  <Image
                    source={{ uri: item.imagen ? `http://10.0.2.2:5000/${item.imagen}` : 'https://via.placeholder.com/70' }}
                    style={styles.image}
                  />

                  {/* Columna derecha: nombre, precio unitario y controles de cantidad */}
                  <View style={styles.itemBody}>
                    {/* numberOfLines={2}: trunca el nombre si es muy largo */}
                    <Text style={styles.itemName} numberOfLines={2}>{item.nombre}</Text>
                    {/* Precio unitario formateado */}
                    <Text style={styles.itemPrice}>{fmt(item.precio || 0)} c/u</Text>

                    {/* Fila de controles de cantidad */}
                    <View style={styles.qtyRow}>
                      {/* Botón "-": reduce 1 unidad, mínimo 1 (Math.max evita llegar a 0) */}
                      <Pressable style={styles.qtyBtn} onPress={() => cambiarCantidad(item.id, Math.max(1, item.cantidad - 1))}>
                        <Ionicons name="remove" size={14} color="#555" />
                      </Pressable>
                      {/* Cantidad actual del ítem */}
                      <Text style={styles.qtyText}>{item.cantidad}</Text>
                      {/* Botón "+": aumenta 1 unidad */}
                      <Pressable style={styles.qtyBtn} onPress={() => cambiarCantidad(item.id, item.cantidad + 1)}>
                        <Ionicons name="add" size={14} color="#555" />
                      </Pressable>
                      {/* Subtotal del ítem: precio × cantidad formateado */}
                      <Text style={styles.subtotalItem}>{fmt((item.precio || 0) * item.cantidad)}</Text>
                      {/* Botón de papelera: elimina el ítem del carrito */}
                      <Pressable onPress={() => eliminarItem(item.id)} style={styles.trashBtn}>
                        <Ionicons name="trash-outline" size={18} color="#b93a32" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* ── TARJETA DE RESUMEN DEL PEDIDO ───────────────────────────── */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumen del Pedido</Text>

            {/* Fila: Subtotal (igual al total porque no hay descuentos) */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>{fmt(total)}</Text>
            </View>
            {/* Fila: Envío (se calcula en el checkout, aquí solo se indica) */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Envío:</Text>
              <Text style={styles.summaryMuted}>A calcular</Text>
            </View>

            {/* Línea divisoria antes del total final */}
            <View style={styles.separator} />

            {/* Fila: Total final destacado en grande color índigo */}
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>{fmt(total)}</Text>
            </View>

            {/* Botón principal de checkout → llama handleIrACheckout */}
            {/* El texto cambia según si el usuario está autenticado o no */}
            <Pressable style={styles.checkoutBtn} onPress={handleIrACheckout}>
              <Ionicons name="card-outline" size={18} color="#fff" />
              <Text style={styles.checkoutText}>
                {isAuthenticated ? 'Proceder al Pago' : 'Iniciar Sesión para Pagar'}
              </Text>
            </Pressable>

            {/* Botón secundario "Seguir Comprando" → vuelve al catálogo (index.tsx) */}
            <Pressable style={styles.continueBtn} onPress={() => routerReplace('/')}>
              <Ionicons name="arrow-back-outline" size={16} color="#555" />
              <Text style={styles.continueBtnText}>Seguir Comprando</Text>
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// StyleSheet.create() registra los estilos de forma optimizada en React Native.
// Todos los valores numéricos son dp (density-independent pixels).
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Contenedor raíz del ScrollView — ocupa toda la pantalla.
  container: { flex: 1 },
  // Contenido interno del scroll: padding general, espacio entre hijos (gap) y padding inferior.
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  // Centrado para la pantalla de carga (spinner).
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  // Texto debajo del spinner de carga.
  loadingText: { color: '#666', fontSize: 15 },

  // Encabezado: fila horizontal con ícono + título.
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  // Título principal "Mi Carrito".
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#1a1a2e' },

  // Banner informativo azul (para usuarios no autenticados).
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',    // Alinea arriba para textos largos.
    gap: 8,
    backgroundColor: '#dbeafe', // Azul claro.
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,          // Borde izquierdo más grueso como acento.
    borderLeftColor: '#3b82f6',  // Azul más oscuro para el acento.
  },
  // Texto del banner: flex:1 para ocupar el ancho restante después del ícono.
  infoBannerText: { flex: 1, color: '#1e40af', fontSize: 13, lineHeight: 19 },

  // Contenedor del estado vacío: centrado verticalmente con espacio.
  emptyContainer: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  // Título grande cuando el carrito está vacío.
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#333' },
  // Subtítulo descriptivo cuando el carrito está vacío.
  empty: { color: '#888', textAlign: 'center', fontSize: 14, lineHeight: 22 },
  // Botón "Ir al Catálogo" cuando el carrito está vacío.
  catalogBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, backgroundColor: '#a57c63',
    paddingHorizontal: 22, paddingVertical: 13, marginTop: 4,
  },
  catalogBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Tarjeta blanca con borde que envuelve la lista de productos.
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    overflow: 'hidden', // Los bordes redondeados afectan a los hijos también.
  },
  // Cabecera de la tarjeta: fondo gris muy claro con borde inferior.
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  // Fila interna: título + badge.
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontWeight: '700', fontSize: 14, color: '#222' },
  // Badge (pastilla índigo) con el número de ítems.
  badge: { backgroundColor: '#a57c63', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  // Botón "Vaciar carrito" con borde rojo y texto rojo.
  vaciarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: '#b93a32', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  vaciarText: { color: '#b93a32', fontSize: 12, fontWeight: '600' },
  // Línea separadora gris entre ítems del carrito.
  itemDivider: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 14 },

  // Fila de un ítem: imagen a la izquierda + datos a la derecha.
  itemRow: { flexDirection: 'row', padding: 14, gap: 12 },
  // Imagen cuadrada del producto con bordes redondeados.
  image: { width: 72, height: 72, borderRadius: 10 },
  // Columna derecha de datos del ítem (flex:1 para ocupar el espacio restante).
  itemBody: { flex: 1, gap: 3 },
  // Nombre del producto en negrita.
  itemName: { fontWeight: '700', fontSize: 14, color: '#222', lineHeight: 19 },
  // Precio unitario en gris.
  itemPrice: { color: '#777', fontSize: 13 },
  // Fila de controles: "-" cantidad "+" subtotal papelera.
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  // Botón cuadrado pequeño para aumentar o disminuir cantidad.
  qtyBtn: {
    width: 28, height: 28, borderRadius: 7,
    borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fafafa',
    alignItems: 'center', justifyContent: 'center',
  },
  // Número de cantidad centrado con ancho mínimo para evitar saltos visuales.
  qtyText: { minWidth: 22, textAlign: 'center', fontWeight: '700', fontSize: 14, color: '#222' },
  // Subtotal del ítem (precio × cantidad) en color índigo.
  subtotalItem: { flex: 1, fontWeight: '700', color: '#a57c63', fontSize: 14 },
  // Área táctil del ícono de papelera con padding para facilitar el toque.
  trashBtn: { padding: 4 },

  // Tarjeta blanca del resumen con borde y padding interno.
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    padding: 16,
    gap: 10,
  },
  summaryTitle: { fontWeight: '700', fontSize: 16, color: '#222', marginBottom: 2 },
  // Fila de dos columnas: etiqueta a la izquierda, valor a la derecha.
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: '#555', fontSize: 14 },
  summaryValue: { color: '#333', fontSize: 14, fontWeight: '500' },
  summaryMuted: { color: '#aaa', fontSize: 14 }, // Texto gris para "A calcular".
  // Línea divisoria horizontal antes del total.
  separator: { height: 1, backgroundColor: '#e8e8e8', marginVertical: 2 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#222' },
  // Total final: número grande en índigo.
  totalValue: { fontSize: 24, fontWeight: '800', color: '#a57c63' },

  // Botón principal de checkout: fondo índigo, ícono + texto centrados.
  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 10, backgroundColor: '#a57c63',
    paddingVertical: 14, marginTop: 4,
  },
  checkoutText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  // Botón secundario "Seguir Comprando": borde gris, sin relleno.
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 10, borderWidth: 1, borderColor: '#ccc',
    paddingVertical: 12,
  },
  continueBtnText: { color: '#555', fontWeight: '600', fontSize: 14 },
});