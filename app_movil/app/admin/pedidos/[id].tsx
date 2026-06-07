/**
 * Este archivo y pantalla de detalle de un pedido especifico para el administrador 
 * recibe el parametro dinamico id desde la url 
 * consulta el backend ara traer los datos del pedido
 * muestra los datos de cliente estado actual total fecha y lista productos
 * permite cambiar el estado del pedido pensiente - enciado -> entregado -> cancelado si esta en pendiente
 */

// manejo de variables de estado local
import { useState, useEffect } from "react";
//Importar componentes 
//Dimensions optiene al ancho y alto de la pantalla para hacer diseos responsivos
//flatlist lista optimizada con virtualizacion para mostrar grandes cantidades de datos
//modal mostrar detalles de contenido en ventanas emergentes

import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

//Lee los parametros de la url para obtener el id del pedido
import { useLocalSearchParams } from "expo-router";
//themedText : texto que aplica colores del tema del dispositivo de manera automatica claro u oscuro
import { ThemedText } from '../../../components/themed-text';
//ciente http axios con JWT
import apiClient from '../../../src/api/apiClient';

/**
 * TIPOS
 * representa un item de la lista de productos del pedido
 * todos los campos son opcionales ? porque el backend puede evitarlos todos 
 */
type Detalle = {
    producto?: { nombre?: string };//solo del los productos comprados
    cantidad?: number;
    precio?: number;//precio unitario del producto
};

// representa el pedido completo tal como lo devuelve el backend
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
    detalles?: Detalle[];//arreglo de productos incluidos en el pedido
};

/**
 * Componnete principal
 * 
 */
export default function AdminPedidoDetalleScreen() {
    /**
     * parametro de ruta
     * useLocalSearchParams lee los segmentos dinamicos de la url
     * como el archivo se llama [id].tsx el parametro se llama id es decir si un pedido se llama 38 el id e 38
     */

    const { id } =  useLocalSearchParams<{ id: string }>();

    //estado local 
    const [pedido, setPedido] = useState<Pedido | null>(null);// Datos del pedido. null = aun no cargados
    const [loading, setLoading] = useState(true);//activo mientras se hace la peticion api
    const [errorMessage, setErrorMessage] = useState(''); //Mensaje de error si falla la carga
    const [cambiando, setCambiando] = useState(false); //true miestra se esta cambiando el estado evita doble click

    /**
     * funcion fetchPedido
     * llama el endpoint get/admin/pedidos/:id y guarda el resultado en estado
     * se usa tanto en el montaje inicial useEffect como despues de cambiar estado
     */

    const fetchPedido = async () => {
        setLoading(true); //muestra el spinner 
        setErrorMessage('');
        try {
            //peticion get autenticada el token JWT lo agrega el apiClient automaticamente
            const res = await apiClient.get(`/admin/pedidos/${id}`);
            // la respuesta tiene estructura { data : data: { pedido...}}
            //el operador ? evita errores si algun nivel es undefined 
            setPedido(res.data?.data?.pedido || null);
        }   catch (error: unknown) {
            //si la peticion falla guarda el mensaje de error para mostrarlo en pantalla
            setErrorMessage((error as { message?: string })?.message || 'no se pudo cargar el pedido');
        } finally {
            setLoading(false);//oculta el spinner siempre que haya un error o no
        }
    };

    /**
     * efecto de carga inicial
     * se ejecuta cad vez que cambie el parametro id de la url 
     * en la practica solo se ejecuta el montar porque no se navega entre id diferentes 
     */

    useEffect(() => {
        fetchPedido();
        /**
         * eslint-disable-next-line react-hooks/exhaustive-deps
         * fetchPedido no se incluye en el array de dependencias para evitar bucles infinitos
         * el lint warning se suprime con el comentario de arribe 
         */
    }, [id]);

    /**
     * funcion cambiar estado
     * envia un PATCH al backend para actualizar el estado del pedido
     * parametro: nuevoEstado el estado alq ue se requiere transicionar
     * enviado, enregado o cancelado
     */
    const cambiarEstado = async (nuevoEstado: string) => {
        setCambiando(true); //bloquea los botones para evitar cicks multiples
        try {
        //PUT /admin/pedidos/:id/estado con el nuevo estado en el body
        await apiClient.put(`/admin/pedidos/${id}/estado`, { estado: nuevoEstado});
        await fetchPedido();
        } catch {
            //si falla muestra un alert nativo con el mensaje de error 
            Alert.alert('Error', 'No se pudo cambiar el estado');
        } finally {
            setCambiando(false); //desbloquea los botones
        }
    };
    
    // ── RENDERIZADO CONDICIONAL: cargando ─────────────────────────────────────
  // Mientras la petición está en curso, muestra un spinner y un texto.
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText>Cargando pedido...</ThemedText>
      </View>
    );
  }

  // ── RENDERIZADO CONDICIONAL: error ────────────────────────────────────────
  // Si la petición falló, muestra el mensaje de error en rojo.
  if (errorMessage) {
    return (
      <View style={styles.centered}>
        <ThemedText style={styles.error}>{errorMessage}</ThemedText>
      </View>
    );
  }

  // ── RENDERIZADO CONDICIONAL: pedido no encontrado ─────────────────────────
  // Si la petición tuvo éxito pero el servidor no devolvió datos del pedido.
  if (!pedido) {
    return (
      <View style={styles.centered}>
        <ThemedText>No se encontró el pedido.</ThemedText>
      </View>
    );
  }

  // ── RENDERIZADO PRINCIPAL ─────────────────────────────────────────────────
  // Se muestra solo cuando el pedido se cargó correctamente.
  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* Título: número de pedido. Se usa _id (MongoDB) o id como fallback. */}
      <ThemedText type="title">Pedido #{pedido.id || pedido.id}</ThemedText>

      {/* Datos del cliente que realizó el pedido */}
      <ThemedText>Cliente: {pedido.usuario?.nombre} {pedido.usuario?.apellido}</ThemedText>
      <ThemedText>Email: {pedido.usuario?.email}</ThemedText>

      {/* Estado actual del pedido (pendiente / enviado / entregado / cancelado) */}
      <ThemedText>Estado: {pedido.estado}</ThemedText>

      {/* Total formateado como moneda colombiana: ej. "$ 45.000" */}
      <ThemedText>Total: ${Number(pedido.total || 0).toLocaleString('es-CO')}</ThemedText>

      {/* Fecha de creación. Si no existe, muestra '-' como valor por defecto. */}
      <ThemedText>Fecha: {pedido.createdAt ? new Date(pedido.createdAt).toLocaleString('es-CO') : '-'}</ThemedText>

      {/* Encabezado de la sección de productos */}
      <ThemedText style={styles.sectionTitle}>Productos:</ThemedText>

      {/* Lista de ítems del pedido. Cada ítem muestra nombre, cantidad y precio. */}
      {pedido.detalles?.map((det: Detalle, idx: number) => (
        // key={idx} usa el índice porque los detalles no siempre tienen ID propio.
        <View key={idx} style={styles.detalleRow}>
          {/* Nombre del producto y cantidad comprada */}
          <ThemedText>{det.producto?.nombre} x{det.cantidad}</ThemedText>
          {/* Precio del ítem formateado en COP */}
          <ThemedText>${Number(det.precio || 0).toLocaleString('es-CO')}</ThemedText>
        </View>
      ))}

      {/* ── BOTONES DE ACCIÓN ─────────────────────────────────────────────── */}
      {/* Los botones se muestran condicionalmente según el estado actual del pedido. */}
      <View style={styles.actionsRow}>

        {/* Si el pedido está 'pendiente', se puede marcar como 'entregado' */}
        {pedido.estado === 'pendiente' && (
          <Pressable
            style={styles.actionBtn}
            onPress={() => cambiarEstado('entregado')}
            disabled={cambiando} // Deshabilitado mientras se procesa el cambio.
          >
            <ThemedText style={styles.actionBtnText}>Marcar como Entregado</ThemedText>
          </Pressable>
        )}

        {/* Si el pedido está 'enviado', se puede marcar como 'entregado' */}
        {pedido.estado === 'enviado' && (
          <Pressable
            style={styles.actionBtn}
            onPress={() => cambiarEstado('entregado')}
            disabled={cambiando}
          >
            <ThemedText style={styles.actionBtnText}>Marcar como Entregado</ThemedText>
          </Pressable>
        )}

        {/* Si el pedido está 'pendiente', también se puede cancelar (botón rojo) */}
        {pedido.estado === 'pendiente' && (
          <Pressable
            style={[styles.actionBtn, styles.btnDanger]} // Combina el estilo base + el rojo de peligro.
            onPress={() => cambiarEstado('cancelado')}
            disabled={cambiando}
          >
            <ThemedText style={styles.actionBtnText}>Cancelar pedido</ThemedText>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Contenedor principal del ScrollView: padding interior y fondo blanco.
  // flexGrow: 1 permite que el contenido ocupe toda la pantalla aunque sea corto.
  container: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },

  // Centrado vertical y horizontal para las pantallas de carga, error y "no encontrado".
  centered: { alignItems: 'center', gap: 10, marginVertical: 20 },

  // Color rojo oscuro para mensajes de error.
  error: { color: '#b93a32' },

  // Encabezado "Productos:" con margen superior y negrita.
  sectionTitle: { marginTop: 10, fontWeight: 'bold' },

  // Fila de un ítem de detalle: nombre a la izquierda, precio a la derecha.
  detalleRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },

  // Columna de botones de acción con separación entre ellos.
  actionsRow: { flexDirection: 'column', gap: 10, marginTop: 20 },

  // Botón de acción principal: tono tierra cálido, bordes redondeados y texto centrado.
  actionBtn: {
    backgroundColor: '#a57c63', // Marrón tierra.
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },

  // Sobreescribe el color del botón a rojo tierra cuando la acción es peligrosa (cancelar).
  btnDanger: { backgroundColor: '#a56363' },

  // Texto de los botones: blanco y negrita.
  actionBtnText: { color: '#fff', fontWeight: '700' },
});
