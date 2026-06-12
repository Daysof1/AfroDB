/**
 * Pantalla de cuenta pestaña 3 tiene 2 metodos
 * no autenticados muestra formulario logi y registro
 * autenticados muestra perfil de usuario con opciones de editar datos 
 * accede al panel admin/aux ver pedidos 
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
// manejo de variables de estado local
import { useState } from "react";
//Importar componentes 
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { router } from "expo-router";
//Ionicons liberia de iconos cevtoriales para react native 
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
//themedText : texto que aplica colores del tema del dispositivo de manera automatica claro u oscuro
import { ThemedText } from '../../components/themed-text';
//themedView : color de fondo automatico segun el tema del dispositivo
import { ThemedView } from '../../components/themed-view';

/**
 * AuthCtx define la forma del objeto devuelto pot useAuth es necesario
 * porque AuthContext.js esta en javaScript no typescript y el compilador no ls reconoce
 */
type AuthCtx = {
    //Usser datos el usuario autenticado, null si no inicio ssin
    user: { nombre?: string, apellido?: string, email?: string, rol?: string, telefono?: string, direccion?: string } | null;
    //isAuthenticated: true si hay sesion activa
    isAuthenticated: boolean;
    // isLoading: true iesra se verifica si hay sesion guardada al abrir la app
    isLoadingSession: boolean;
    //Login: funcion qe recibe el email y contraseña lanza error si falla
    login: (email: string, pssword: string) => Promise<unknown>;
    //register funcion que registra un nuvo usuario lanza error si falla 
    register: (data: {nombre: string, apellido: string, email: string, password: string}) => Promise<unknown>; 
    //logout: funcion de cerrar la sesion del usuario 
    logout: () => Promise<void>;
    //updatePerfil: funcion que actualiza os datos del usuario 
    updatePerfil: (data: { nombre?: string, apellido?: string, email?: string, telefono?: string, direccion?: string }) => Promise<unknown>;
};

//routerPush navega apilando la nueva pantalla permite volver atras con la opcion de atras 
//se usa as unknown as para evitar errores de typescript con contextos router

const routerPush = (path: string) => (router as unknown as { push: (p: string) => void }).push(path);

// componente principal del tab de cuenta 

export default function TabTwoScreen() {
    const { user, isAuthenticated, logout, login, register, isLoadingSession, updatePerfil } = useAuth() as AuthCtx;
    const canEditPerfil = ['administrador', 'auxiliar', 'cliente'].includes(user?.rol || '');
    // estado del formulario login y registro 
    //isRegisterMode true muestra formulario de registro false muestra login
    const [isRegisterMode, setIsRegisterMode ] = useState(false);
    //Campos del formulario de registro y login
    const [ nombre, setNombre ] = useState('');
    const [ apellido, setApellido ] = useState('');
    const [ email, setEmail ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ confirmPassword, setConfirmPassword ] = useState('');
    const [ telefono, setTelefono ] = useState('');
    const [ direccion, setDireccion ] = useState('');
    const [ tipoDocumento, setTipoDocumento ] = useState('C.C.');
    const [ documento, setDocumento ] = useState('');
    const documentoOptions = ['T.I.', 'C.C.', 'C.E.', 'P.A.'];
    // loadingSubmit true mientras se procesa el login o register evita el doble envio
    const [ loadingSubmit, setLoadingSubmit ] = useState(false);
    //mensajes de retroalimentacion al usuario ( error o exito )
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    //Estado de edicion de perfil
    //editMode true muestra campos editables false modo lectura

    const [editMode, setEditMode] = useState(false);
    //campos editables del perfil
    const [editNombre, setEditNombre] = useState('');
    const [editApellido, setEditApellido] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editTipoDocumento, setEditTipoDocumento] = useState('');
    const [editDocumento, setEditDocumento] = useState('');
    const [editTelefono, setEditTelefono] = useState('');
    const [editDireccion, setEditDireccion] = useState('');
    //savingPerfil true mientras se guarda el perfil en backend
    const [savingPerfil, setSavingPerfil] = useState(false);
    //Mensaje de error o exito
    const [perfilError, setPerfilError] = useState('');
    const [perfilSuccess, setPerfilSuccess] = useState('');

    //Funcion resetFeedback
    //Limpia los mensajes de error y exito del formulario login y registro
    const resetFeedback = () => {
        setErrorMessage('');
        setSuccessMessage('');
    };

    const openEditPerfil = () => {
        setEditMode(true);
        setPerfilSuccess('');
        setEditNombre(user?.nombre || '');
        setEditApellido(user?.apellido || '');
        setEditEmail(user?.email || '');
        setEditTelefono(user?.telefono || '');
        setEditDireccion(user?.direccion || '');
    };

    //Funcion: handleLogout
    //cierra la sesion y resetea todos los campos del formulario para que
    //la pantalla quede limpia cuando el usuario vuelva a ver formulario
    const handleLogout = async () => {
        await logout(); //llama el contexto de cerrar sesion 
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setNombre('');
        setApellido('');
        setTelefono('');
        setDireccion('');
        setTipoDocumento('C.C.');
        setDocumento('');
        setIsRegisterMode(false);
        setErrorMessage('');
        setSuccessMessage('');
    };

    //Funcion handleSubmit
    //valida y envia el formulario de login o registro segun el modo actvo
    const handleSubmit = async () => {
        resetFeedback(); //limpia mensajes anterores de valida

        if(isRegisterMode) {
            //Validaciones de registro 
            //todos los campos marcados con * son obligatorias
            if (!nombre || !apellido || !email || !password || !confirmPassword || !tipoDocumento || !documento) {
                setErrorMessage('Completa todos los campos obligatorios: nombre, apellido, tipo de documento, documento, email, contraseña y confirmación.');
                return;
            }

            //las contraseñas deben coincidir
            if (password !== confirmPassword){
                setErrorMessage('Las contraseñas no coinciden');
                return;
            }

            //las contraseñas deben tener minio 6 caracteres
            if (password.length < 6){
                setErrorMessage('La contraseña deben tener al menos 6 caracteres');
                return;
            }

            //Telefono si se propirciona debe ser colombiano (10 digitos y debe empezar por 3)
            if (telefono && !/^3\d{9}$/.test(telefono)) {
                setErrorMessage('El teléfono debe ser un número colombiano válido (10 dígitos que empiezan por 3)');
                return;
            }
        } else {
            //validacion de login
            if (!email || !password) {
                setErrorMessage('Ingresa tu correo y contraseña');
                return;
            }
        }

        //activa el spiner  bloquea el boton para evitar multiples envios
        setLoadingSubmit(true);
        try {
            if (isRegisterMode) {
                //llama a resgister() del contexto con os datos del formulario 
                //el operador spread condicional ... solo incluye telefono/direcion si no estan vacios
                await register({ nombre, apellido, email, password,
                    ...(telefono ? { telefono } : {}),
                    ...(direccion ? { direccion } : {}),
                });
                setSuccessMessage('Registro exitoso! Ahora inicia sesion');
                setIsRegisterMode(false); //Vuelve al logi tras el regisstro exitoso
                // limpia los campos del formulario de registro
                setNombre('');
                setApellido('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setTipoDocumento('');
                setDocumento('');
                setTelefono('');
                setDireccion('');
            } else {
                //llama al login del contexto con el email y contraseña
                await login(email, password);
                setSuccessMessage(`Sesión iniciada correctamente. Bienvenido ${user?.nombre || email}`);
            }
        } catch (error: unknown) {
            //si el backend devuelve error muestra su mensaje. sino muestra uno generico
            setErrorMessage((error as { message?: string })?. message || 'No fue posibe completar la accion'); 
        } finally {
            //siempre desactiva el spiner al terminar exito y error
            setLoadingSubmit(false);
        }
    };

    /**
     * Funciom handleGuardarPerfil
     * valida y envia ls cambios al perfi del usuario autenticado
     */

    const handleGuardarPerfil = async () => {
        setPerfilError('');
        setPerfilSuccess('');
        //al menos no de los tres campos debe estar modificado
        if (!editNombre.trim() && !editApellido.trim() && !editEmail.trim() && !editTipoDocumento.trim() && !editDocumento.trim() && !editTelefono.trim() && !editDireccion.trim()) {
            setPerfilError('Modifica al menos un campo');
            return;
        }
        setSavingPerfil(true);
        try {
            //solo envia los campos que tiene valor; los vacios se omiten
            const data : { nombre?: string; apellido?: string; email?: string; tipo_documento?: string; documento?: string; telefono?: string; direccion?: string } = {};
            if (editNombre.trim()) data.nombre = editNombre.trim();
            if (editApellido.trim()) data.apellido = editApellido.trim();
            if (editEmail.trim()) data.email = editEmail.trim();
            if (editTipoDocumento.trim()) data.tipo_documento = editTipoDocumento.trim();
            if (editDocumento.trim()) data.documento = editDocumento.trim();
            if (editTelefono.trim()) data.telefono = editTelefono.trim();
            if (editDireccion.trim()) data.direccion = editDireccion.trim();
            await updatePerfil(data); //llama al contexto que hace put /usuarios/perfil
            setPerfilSuccess('Perfil actualizado correctamente');
            setEditMode(false); //cierra el formulario de edicin
            //limpia los campos de edicion
            setEditNombre('');
            setEditApellido('');
            setEditEmail('');
            setEditTipoDocumento('');
            setEditDocumento('');
            setEditTelefono('');
            setEditDireccion('');

        } catch (error: unknown) {
            setPerfilError((error as { message?: string })?. message || 'No fue posible actualizar el perfil');
        } finally {
            setSavingPerfil(false);
        }
    };

    // ── PANTALLA DE CARGA DE SESIÓN ──────────────────────────────────────────
  // Se muestra brevemente al abrir la app mientras se verifica si hay
  // un token de sesión guardado en el almacenamiento local del dispositivo.
  if (isLoadingSession) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText>Cargando sesion...</ThemedText>
      </View>
    );
  }

  // ── MODO: NO AUTENTICADO → FORMULARIO DE LOGIN / REGISTRO ────────────────
  if (!isAuthenticated) {
    return (
      // KeyboardAvoidingView: cuando aparece el teclado virtual, mueve el
      // contenido hacia arriba para que los campos no queden tapados.
      // En iOS usa 'padding', en Android no es necesario (undefined).
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* ThemedView: aplica el color de fondo del tema (claro/oscuro) */}
        <ThemedView style={styles.formCard}>
          {/* Título dinámico: "Registro" o "Iniciar sesion" según el modo */}
          <ThemedText type="title">{isRegisterMode ? 'Registro' : 'Iniciar sesion'}</ThemedText>

          {/* Campos adicionales SOLO en modo registro */}
          {isRegisterMode ? (
            <>
              <View style={styles.dropdownContainer}>
                <ThemedText style={styles.dropdownLabel}>Tipo de documento *</ThemedText>
                <View style={styles.optionList}>
                  {documentoOptions.map((option) => (
                    <Pressable
                      key={option}
                      onPress={() => setTipoDocumento(option)}
                      style={[
                        styles.optionButton,
                        tipoDocumento === option && styles.optionButtonSelected,
                      ]}
                    >
                      <Text
                        style={tipoDocumento === option ? styles.optionTextSelected : styles.optionText}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <TextInput
                placeholder="Documento *"
                value={documento}
                onChangeText={setDocumento}
                style={styles.input}
              />
              <TextInput
                placeholder="Nombre *"
                value={nombre}
                onChangeText={setNombre}
                style={styles.input}
              />
              <TextInput
                placeholder="Apellido *"
                value={apellido}
                onChangeText={setApellido}
                style={styles.input}
              />
            </>
          ) : null}

          {/* Campo de correo: compartido entre login y registro */}
          <TextInput
            placeholder="Correo *"
            autoCapitalize="none"        // No convierte a mayúsculas el primer caracter.
            keyboardType="email-address" // Muestra teclado con @ y .com fácilmente.
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />

          {/* Campo de contraseña: texto oculto con puntos */}
          <TextInput
            placeholder="Contrasena *"
            secureTextEntry               // Oculta el texto ingresado.
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />

          {/* Campos adicionales SOLO en modo registro */}
          {isRegisterMode ? (
            <>
              <TextInput
                placeholder="Confirmar contrasena *"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
              />
              {/* Teléfono: opcional, solo números, máximo 10 dígitos */}
              <TextInput
                placeholder="Telefono (ej: 3001234567)"
                keyboardType="phone-pad"
                value={telefono}
                onChangeText={setTelefono}
                maxLength={10}
                style={styles.input}
              />
              {/* Dirección: opcional */}
              <TextInput
                placeholder="Direccion"
                value={direccion}
                onChangeText={setDireccion}
                style={styles.input}
              />
            </>
          ) : null}

          {/* Mensaje de error (en rojo) si la validación o el backend fallan */}
          {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}
          {/* Mensaje de éxito (en verde) tras registro o login exitoso */}
          {successMessage ? <ThemedText style={styles.success}>{successMessage}</ThemedText> : null}

          {/* Botón principal: "Crear cuenta" o "Entrar" según el modo.
              disabled durante el proceso para evitar envíos múltiples. */}
          <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={loadingSubmit}>
            {loadingSubmit ? (
              // Spinner mientras se procesa la solicitud.
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isRegisterMode ? 'Crear cuenta' : 'Entrar'}
              </Text>
            )}
          </Pressable>

          {/* Enlace para alternar entre login y registro */}
          <Pressable
            onPress={() => {
              resetFeedback();                       // Limpia mensajes al cambiar de modo.
              setIsRegisterMode((prev) => !prev);    // Alterna el modo.
            }}>
            <ThemedText type="link">
              {isRegisterMode ? 'Ya tengo cuenta, iniciar sesion' : 'No tengo cuenta, registrarme'}
            </ThemedText>
          </Pressable>
        </ThemedView>
      </KeyboardAvoidingView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FUNCIONES AUXILIARES DEL PERFIL (solo se usan cuando el usuario está autenticado)
  // Se definen aquí (no al inicio) porque solo se necesitan en el modo autenticado.
  // ─────────────────────────────────────────────────────────────────────────

  // rolColor: devuelve el color de fondo según el rol del usuario.
  //   administrador → café oscuro
  //   auxiliar      → arena
  //   profesional   → terracota
  const rolColor = (r?: string) =>
    r === 'administrador' ? '#8c6a4a' : r === 'auxiliar' ? '#c8a27a' : r === 'profesional' ? '#a57c63' : '#d9c4a3';

  // rolLabel: devuelve el texto legible del rol.
  const rolLabel = (r?: string) =>
    r === 'administrador' ? 'Administrador' : r === 'auxiliar' ? 'Auxiliar' : r === 'profesional' ? 'Profesional' : 'Cliente';

  const userFullName = () => {
    if (!user) return 'Usuario';
    const fullName = [user?.nombre, user?.apellido].filter(Boolean).join(' ');
    return fullName || user?.email || 'Usuario';
  };

  // rolIcon: devuelve el nombre del ícono Ionicons según el rol.
  //   keyof typeof Ionicons.glyphMap → tipo correcto para los nombres de íconos.
  const rolIcon = (r?: string): keyof typeof Ionicons.glyphMap =>
    r === 'administrador' ? 'shield-checkmark' : r === 'auxiliar' ? 'construct' : r === 'profesional' ? 'briefcase' : 'person';

  // ── MODO: AUTENTICADO → VISTA DE PERFIL ─────────────────────────────────
  return (
    // ScrollView con espacio de 12dp entre cada sección y padding inferior de 32dp.
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* ── ENCABEZADO DE PERFIL ────────────────────────────────────────── */}
      {/* El color de fondo cambia dinámicamente según el rol del usuario. */}
      <View style={[styles.profileHeader, { backgroundColor: rolColor(user?.rol) }]}>
        {/* Avatar: círculo blanco con el ícono del rol en el color del rol */}
        <View style={styles.avatarCircle}>
          <Ionicons name={rolIcon(user?.rol)} size={40} color={rolColor(user?.rol)} />
        </View>
        {/* Columna de datos: nombre, email y badge del rol */}
        <View style={{ flex: 1 }}>
          {/* Nombre del usuario en blanco negrita */}
          <Text style={styles.profileName}>{userFullName()}</Text>
          {/* Email del usuario en blanco semitransparente */}
          <Text style={styles.profileEmail}>{user?.email || '-'}</Text>
          {/* Badge (pastilla) con ícono + etiqueta del rol */}
          <View style={styles.roleBadge}>
            <Ionicons name={rolIcon(user?.rol)} size={12} color="#fff" />
            <Text style={styles.roleBadgeText}>{rolLabel(user?.rol)}</Text>
          </View>
        </View>
      </View>

      {/* ── BANNER DE ÉXITO (tras actualizar perfil) ────────────────────── */}
      {/* Solo visible si perfilSuccess tiene texto */}
      {perfilSuccess ? (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={styles.successText}>{perfilSuccess}</Text>
        </View>
      ) : null}

      {/* ── SECCIÓN: EDITAR PERFIL ──────────────────────────────────────── */}
      {editMode ? (
        // ── FORMULARIO DE EDICIÓN ──────────────────────────────────────────
        <View style={styles.card}>
          {/* Cabecera de la tarjeta con ícono de edición + título */}
          <View style={styles.cardHeader}>
            <Ionicons name="create-outline" size={18} color="#a57c63" />
            <Text style={styles.cardTitle}>Editar perfil</Text>
          </View>
          {/* Campo de nombre: placeholder muestra el valor actual */}
          <TextInput
            placeholder={`Nombre actual: ${user?.nombre || ''}`}
            value={editNombre}
            onChangeText={setEditNombre}
            style={styles.input}
          />
          {/* Campo de apellido */}
          <TextInput
            placeholder={`Apellido actual: ${user?.apellido || ''}`}
            value={editApellido}
            onChangeText={setEditApellido}
            style={styles.input}
          />

          {/* Campo de email: teclado email, sin mayúsculas automáticas, sólo lectura */}

          {/* Campo de teléfono */}
          <TextInput
            placeholder={`Teléfono actual: ${user?.telefono || ''}`}
            value={editTelefono}
            onChangeText={setEditTelefono}
            keyboardType="phone-pad"
            style={styles.input}
          />
          {/* Campo de dirección */}
          <TextInput
            placeholder={`Dirección actual: ${user?.direccion || ''}`}
            value={editDireccion}
            onChangeText={setEditDireccion}
            style={styles.input}
          />
          {/* Banner de error si la actualización falla */}
          {perfilError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={15} color="#ef4444" />
              <Text style={styles.errorText}>{perfilError}</Text>
            </View>
          ) : null}
          {/* Fila de botones: "Guardar" (índigo) y "Cancelar" (outline) */}
          <View style={styles.editActions}>
            {/* Botón guardar: muestra spinner mientras guarda */}
            <Pressable style={[styles.btn, styles.btnPrimary, { flex: 1 }]} onPress={handleGuardarPerfil} disabled={savingPerfil}>
              {savingPerfil ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTextWhite}>Guardar</Text>}
            </Pressable>
            {/* Botón cancelar: cierra el formulario sin guardar */}
            <Pressable style={[styles.btn, styles.btnOutline, { flex: 1 }]} onPress={() => { setEditMode(false); setPerfilError(''); }}>
              <Text style={styles.btnTextOutline}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        // ── BOTÓN PARA ABRIR EL FORMULARIO DE EDICIÓN ─────────────────────
        canEditPerfil ? (
          <Pressable style={[styles.btn, styles.btnOutline]} onPress={openEditPerfil}>
            <Ionicons name="create-outline" size={17} color="#a57c63" />
            <Text style={[styles.btnTextOutline, { color: '#a57c63' }]}>Editar perfil</Text>
          </Pressable>
        ) : null
      )}

      {/* ── BOTÓN: PANEL DE ADMINISTRACIÓN (solo admin y auxiliar) ─────── */}
      {/* La condición evalúa el rol del usuario antes de renderizar */}
      {user?.rol === 'administrador' || user?.rol === 'auxiliar' ? (
        <Pressable style={[styles.btn, { backgroundColor: '#8c6a4a' }]} onPress={() => routerPush('/admin/dashboard')}>
          <Ionicons name="speedometer-outline" size={17} color="#fff" />
          <Text style={styles.btnTextWhite}>Panel de Administración</Text>
        </Pressable>
      ) : null}

      {/* ── BOTÓN: PANEL PROFESIONAL ─────────────────────────────────── */}
      {user?.rol === 'profesional' ? (
        <Pressable style={[styles.btn, { backgroundColor: '#a57c63' }]} onPress={() => routerPush('/profesional/dashboard')}>
          <Ionicons name="briefcase-outline" size={17} color="#fff" />
          <Text style={styles.btnTextWhite}>Panel Profesional</Text>
        </Pressable>
      ) : null}

      {/* ── BOTÓN: MIS PEDIDOS (visible para todos los roles) ───────────── */}
      <Pressable style={[styles.btn, { backgroundColor: '#c8a27a' }]} onPress={() => routerPush('/mis-pedidos')}>
        <Ionicons name="receipt-outline" size={17} color="#fff" />
        <Text style={styles.btnTextWhite}>Mis Pedidos</Text>
      </Pressable>

      {/* ── BOTÓN: MIS CITAS (visible para todos los roles) ───────────── */}
      <Pressable style={[styles.btn, { backgroundColor: '#c8a27a' }]} onPress={() => routerPush('/mis-citas')}>
        <Ionicons name="calendar-outline" size={17} color="#fff" />
        <Text style={styles.btnTextWhite}>Mis Citas</Text>
      </Pressable>
      {/* ── BOTÓN: CERRAR SESIÓN ────────────────────────────────────────── */}
      <Pressable style={[styles.btn, { backgroundColor: '#ef4444' }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={17} color="#fff" />
        <Text style={styles.btnTextWhite}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── ESTILOS COMPARTIDOS ──────────────────────────────────────────────────
  scroll: { flex: 1 },              // ScrollView ocupa toda la pantalla.
  container: { flex: 1 },           // Contenedor del formulario de login/registro.
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }, // Pantalla de carga centrada.

  // ── FORMULARIO DE LOGIN / REGISTRO ───────────────────────────────────────
  formCard: { borderRadius: 12, padding: 16, gap: 12, margin: 20 }, // Tarjeta con fondo temático.
  editSection: { borderRadius: 10, padding: 12, gap: 8, borderWidth: 1, borderColor: '#e0eaf3' }, // Sección de edición (no usada actualmente).
  editActions: { flexDirection: 'row', gap: 8, marginTop: 4 },      // Fila de botones Guardar/Cancelar.
  editBtn: { borderRadius: 10, borderWidth: 1, borderColor: '#a57c63', paddingVertical: 10, alignItems: 'center' },
  editBtnText: { color: '#a57c63', fontWeight: '600' },
  meta: { color: '#7b6758', fontSize: 13 },                             // Texto secundario pequeño.
  primaryButton: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#a57c63' }, // Botón "Entrar" / "Crear cuenta".
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryButton: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#d5d5d5', paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  logoutButton: { borderRadius: 10, backgroundColor: '#b93a32', paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  ordersButton: { borderRadius: 10, backgroundColor: '#c8a27a', paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  adminBtn: { borderRadius: 10, backgroundColor: '#8c6a4a', paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  adminBtnText: { color: '#fff', fontWeight: '700' },
  ordersText: { color: '#fff', fontWeight: '700' },
  logoutText: { color: '#fff', fontWeight: '700' },

  // ── PERFIL (usuario autenticado) ─────────────────────────────────────────
  // Espacio interno del ScrollView: 16dp de padding, 12dp entre hijos, 32dp al fondo.
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  // Encabezado de perfil: fila con avatar + datos. El color de fondo es dinámico (inline).
  profileHeader: {
    borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  // Círculo blanco de 70×70dp que contiene el ícono del rol.
  avatarCircle: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  profileName: { fontSize: 20, fontWeight: '800', color: '#fff' },                    // Nombre del usuario.
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },      // Email semitransparente.
  // Badge del rol: pastilla translúcida blanca con ícono + etiqueta.
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start',
  },
  roleBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  // Tarjeta blanca con borde para el formulario de edición de perfil.
  card: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#e8e8e8', padding: 14, gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }, // Fila: ícono + título de la tarjeta.
  cardTitle: { fontWeight: '700', fontSize: 15, color: '#222' },

  // Botón base: fila centrada con ícono + texto y bordes redondeados.
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 12, paddingVertical: 14,
  },
  btnPrimary: { backgroundColor: '#a57c63' },                          // Relleno terracota.
  btnOutline: { borderWidth: 2, borderColor: '#a57c63', backgroundColor: '#fff' }, // Solo borde terracota.
  btnTextWhite: { color: '#fff', fontWeight: '700', fontSize: 15 },    // Texto blanco para botones rellenos.
  btnTextOutline: { color: '#a57c63', fontWeight: '700', fontSize: 15 }, // Texto terracota para botones outline.

  // Banner verde de éxito (perfil actualizado).
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#ecfdf5', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#a7f3d0',
  },
  successText: { color: '#065f46', fontSize: 13, fontWeight: '500' },
  // Banner rojo de error (falló la actualización del perfil).
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#fca5a5',
  },
  errorText: { color: '#b91c1c', fontSize: 13 },

  dropdownContainer: { gap: 8 },
  dropdownLabel: { fontSize: 14, fontWeight: '600', color: '#4b5563' },
  optionList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionButton: {
    borderWidth: 1, borderColor: '#d5d5d5', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff',
  },
  optionButtonSelected: {
    backgroundColor: '#a57c63', borderColor: '#a57c63',
  },
  optionText: { color: '#374151', fontWeight: '600' },
  optionTextSelected: { color: '#fff', fontWeight: '600' },

  // Campo de texto genérico: borde gris, fondo blanco, bordes redondeados.
  input: {
    borderWidth: 1, borderColor: '#d5d5d5', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff',
  },
  error: { color: '#d64545' },   // Color rojo para mensajes de error inline (ThemedText).
  success: { color: '#218f4c' }, // Color verde para mensajes de éxito inline (ThemedText).
});
