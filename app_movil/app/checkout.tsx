// Página: checkout.tsx. vista de checkout del sistema.
// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVO: app/checkout.tsx
// PROPÓSITO: Pantalla de pago (Checkout). El cliente completa los datos de envío
//   y método de pago antes de confirmar la compra.
//   - Guarda la dirección, teléfono, método de pago y notas adicionales.
//   - Llama a pedidoService.crearPedido() con los datos del formulario.
//   - Si el servidor devuelve un pedidoId, redirige a /pedido-confirmado con ese ID.
//   - Muestra pantallas de guardia si el usuario no está autenticado o el carrito está vacío.
// ─────────────────────────────────────────────────────────────────────────────

// ── IMPORTACIONES ────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView, // Evita que el teclado tape los campos en iOS.
  Platform,             // Detecta si es iOS o Android para aplicar el comportamiento correcto.
  Pressable,            // Botón táctil personalizable.
  ScrollView,           // Scroll vertical para el formulario.
  StyleSheet,
  TextInput,            // Campo de texto editable.
  View,
} from 'react-native';
import { router } from 'expo-router'; // Navegación programática.

import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { useAuth } from '../src/context/AuthContext';
import { useCarrito } from '../src/context/CarritoContext';
import pedidoService from '../src/services/pedidoService';

// ── TIPOS Y HELPERS DE NAVEGACIÓN ────────────────────────────────────────────
// Tipo del contexto del carrito (necesario para que TypeScript reconozca sus propiedades).
type CarritoCtx = { items: unknown[]; total: number; loading: boolean; refreshCarrito: () => Promise<void> };

type AuthUser = { telefono?: string; direccion?: string } | null;

type AuthCtx = { isAuthenticated: boolean; user: AuthUser };

// router.replace tiene tipos estrictos en Expo Router; el cast permite pasar strings dinámicos.
const routerReplace = (path: string) => (router as unknown as { replace: (p: string) => void }).replace(path);

// ── MÉTODOS DE PAGO ───────────────────────────────────────────────────────────
// Arreglo de opciones para los chips de método de pago.
// 'key' es el valor enviado al servidor; 'label' es lo que se muestra al usuario.
const PAYMENT_METHODS = [
  { key: 'efectivo',       label: 'Efectivo' },
  { key: 'tarjeta',        label: 'Tarjeta' },
  { key: 'transferencia',  label: 'Transferencia' },
];

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
// Renderiza la vista principal de este componente.
export default function CheckoutScreen() {

  // ── CONTEXTOS ─────────────────────────────────────────────────────────────
  const { isAuthenticated, user } = useAuth() as AuthCtx;
  // El cast a CarritoCtx es necesario porque useCarrito devuelve 'unknown' en TypeScript.
  const { items, total, loading, refreshCarrito } = useCarrito() as CarritoCtx;

  // ── ESTADO LOCAL (campos del formulario) ──────────────────────────────────
  const [direccionEnvio, setDireccionEnvio]     = useState(user?.direccion || '');
  const [telefono, setTelefono]                 = useState(user?.telefono || '');
  const [metodoPago, setMetodoPago]             = useState('efectivo'); // Valor por defecto: efectivo.
  const [notasAdicionales, setNotasAdicionales] = useState('');
  const [submitting, setSubmitting]             = useState(false); // true mientras se procesa el pedido.
  const [errorMessage, setErrorMessage]         = useState('');

  // Si el perfil se carga después del primer render, rellenamos los campos.
  useEffect(() => {
    if (user) {
      setDireccionEnvio((current) => current || user.direccion || '');
      setTelefono((current) => current || user.telefono || '');
    }
  }, [user]);

  // ── VALIDACIÓN REACTIVA ───────────────────────────────────────────────────
  // canSubmit se recalcula solo cuando cambian sus dependencias.
  // El botón "Confirmar pedido" se deshabilita si alguna condición falla.
  const canSubmit = useMemo(() => {
    return direccionEnvio.trim() && telefono.trim() && items.length > 0 && !submitting;
  }, [direccionEnvio, telefono, items.length, submitting]);

  // ── GUARDIA: usuario no autenticado ───────────────────────────────────────
  // Si el usuario no tiene sesión activa, se muestra una pantalla de bloqueo.
  if (!isAuthenticated) {
    return (
      <View style={styles.centered}>
        <ThemedText type="title">Debes iniciar sesion</ThemedText>
        <ThemedText style={styles.subtitle}>Para finalizar la compra entra en tu cuenta.</ThemedText>
        <Pressable style={styles.primaryButton} onPress={() => routerReplace('/(tabs)/explore')}>
          <ThemedText style={styles.primaryButtonText}>Ir a Cuenta</ThemedText>
        </Pressable>
      </View>
    );
  }

  // ── GUARDIA: carrito vacío ─────────────────────────────────────────────────
  // Solo se muestra cuando la carga terminó (!loading) y no hay productos.
  if (!loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ThemedText type="title">Carrito vacio</ThemedText>
        <ThemedText style={styles.subtitle}>Agrega productos antes de continuar.</ThemedText>
        <Pressable style={styles.primaryButton} onPress={() => routerReplace('/(tabs)/')}>
          <ThemedText style={styles.primaryButtonText}>Volver a Tienda</ThemedText>
        </Pressable>
      </View>
    );
  }

  // ── FUNCIÓN: handleConfirm ────────────────────────────────────────────────
  // Valida campos, llama a crearPedido() y redirige a la pantalla de confirmación.
  const handleConfirm = async () => {
    setErrorMessage('');

    // Validación en el cliente antes de la petición HTTP.
    if (!direccionEnvio.trim()) {
      setErrorMessage('Ingresa la direccion de envio.');
      return;
    }
    if (!telefono.trim()) {
      setErrorMessage('Ingresa un telefono de contacto.');
      return;
    }

    setSubmitting(true); // Bloquea el botón durante la petición.
    try {
      // POST /pedidos — crea el pedido con los datos del formulario.
      const pedido = await pedidoService.crearPedido({
        direccionEnvio:    direccionEnvio.trim(),
        telefono:          telefono.trim(),
        metodoPago,
        notasAdicionales:  notasAdicionales.trim(),
      });

      // Actualiza el carrito local (se vacía después de crear el pedido).
      await refreshCarrito();

      const pedidoId = pedido?.id;

      // Si el servidor devuelve el ID, lo pasa como query param para mostrar detalles.
      if (pedidoId) {
        routerReplace(`/pedido-confirmado?pedidoId=${pedidoId}`);
      } else {
        routerReplace('/pedido-confirmado'); // Fallback sin ID (muestra pantalla genérica).
      }
    } catch (error: unknown) {
      setErrorMessage((error as { message?: string })?.message || 'No fue posible confirmar el pedido.');
    } finally {
      setSubmitting(false); // Re-habilita el botón siempre.
    }
  };

  // ── RENDERIZADO ───────────────────────────────────────────────────────────
  return (
    // KeyboardAvoidingView: en iOS sube la vista cuando el teclado aparece.
    // En Android el sistema lo maneja solo (undefined).
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">Checkout</ThemedText>
        <ThemedText style={styles.subtitle}>Completa los datos para confirmar tu pedido.</ThemedText>

        {/* Muestra el error si existe */}
        {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}

        {/* ── SECCIÓN: datos de envío ──────────────────────────────────── */}
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold">Direccion de envio</ThemedText>
          <TextInput
            value={direccionEnvio}
            onChangeText={setDireccionEnvio}
            placeholder="Ej: Calle 10 # 20-30, Bucaramanga"
            style={[styles.input, styles.multiline]}
            multiline // Permite varias líneas para direcciones largas.
          />

          <ThemedText type="defaultSemiBold">Telefono</ThemedText>
          <TextInput
            value={telefono}
            onChangeText={setTelefono}
            placeholder="3001234567"
            keyboardType="phone-pad" // Teclado numérico con #, *.
            style={styles.input}
          />

          {/* ── Chips de método de pago ──────────────────────────────── */}
          <ThemedText type="defaultSemiBold">Metodo de pago</ThemedText>
          <View style={styles.paymentRow}>
            {PAYMENT_METHODS.map((method) => {
              const selected = method.key === metodoPago; // true si este chip está seleccionado.
              return (
                <Pressable
                  key={method.key}
                  onPress={() => setMetodoPago(method.key)} // Cambia el método seleccionado.
                  style={[
                    styles.paymentChip,
                    selected && styles.paymentChipSelected, // Resalta el chip activo.
                  ]}>
                  <ThemedText style={selected ? styles.paymentChipTextSelected : undefined}>
                    {method.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <ThemedText type="defaultSemiBold">Notas (opcional)</ThemedText>
          <TextInput
            value={notasAdicionales}
            onChangeText={setNotasAdicionales}
            placeholder="Indicaciones de entrega"
            style={[styles.input, styles.multiline]}
            multiline
          />
        </ThemedView>

        {/* ── RESUMEN DEL PEDIDO ───────────────────────────────────────── */}
        <ThemedView style={styles.summary}>
          <ThemedText type="defaultSemiBold">Resumen</ThemedText>
          <ThemedText>{items.length} producto(s)</ThemedText>
          {/* Formatea el total en pesos colombianos. */}
          <ThemedText style={styles.total}>Total: ${Number(total || 0).toLocaleString('es-CO')}</ThemedText>
        </ThemedView>

        {/* ── BOTÓN CONFIRMAR ──────────────────────────────────────────── */}
        {/* Se deshabilita (y opaca) cuando canSubmit=false o mientras se procesa. */}
        <Pressable
          style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
          onPress={handleConfirm}
          disabled={!canSubmit}>
          <ThemedText style={styles.primaryButtonText}>
            {submitting ? 'Procesando...' : 'Confirmar pedido'}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  // Centra el contenido cuando se muestra una pantalla de guardia.
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16 },
  subtitle: { color: '#666' },
  // Tarjeta de sección con fondo temático y padding interior.
  section: { borderRadius: 12, padding: 12, gap: 10 },
  // Campo de texto: borde gris, fondo blanco, padding cómodo.
  input: {
    borderWidth: 1,
    borderColor: '#d8d8d8',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  // Variante multilinea: altura mínima y texto alineado arriba.
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  // Fila de chips de pago: fila con wrapping para múltiples opciones.
  paymentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  // Chip de pago no seleccionado.
  paymentChip: {
    borderWidth: 1,
    borderColor: '#d2d2d2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  // Chip seleccionado: borde y fondo azul claro.
  paymentChipSelected: { borderColor: '#a57c63', backgroundColor: '#f3e6d8' },
  // Texto del chip seleccionado: azul oscuro y negrita.
  paymentChipTextSelected: { color: '#04566f', fontWeight: '700' },
  // Tarjeta de resumen: fondo azul muy claro.
  summary: {
    borderWidth: 1,
    borderColor: '#dceeff',
    backgroundColor: '#f6fbff',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  total: { fontSize: 18, fontWeight: '700' },
  // Botón principal.
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#a57c63',
  },
  // Opacidad reducida cuando el botón está deshabilitado.
  primaryButtonDisabled: { opacity: 0.45 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  error: { color: '#b93a32' },
});
