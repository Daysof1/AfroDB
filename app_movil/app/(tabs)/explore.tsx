// Página: explore.tsx. vista de explore del sistema.
/**
 * Pantalla de cuenta pestaña 3 tiene 2 metodos
 * no autenticados muestra formulario logi y registro
 * autenticados muestra perfil de usuario con opciones de editar datos 
 * accede al panel admin/aux ver pedidos 
 */

import { useState } from "react";
import { 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  Pressable, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  View 
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

type AuthCtx = {
  user: { 
    nombre?: string, 
    apellido?: string, 
    email?: string, 
    rol?: string, 
    telefono?: string, 
    direccion?: string,
    tipo_documento?: string,
    documento?: string,
  } | null;
  isAuthenticated: boolean;
  isLoadingSession: boolean;
  login: (email: string, password: string) => Promise<unknown>;
  register: (data: { 
    nombre: string, 
    apellido: string, 
    email: string, 
    password: string,
    tipo_documento?: string,
    documento?: string,
    telefono?: string,
    direccion?: string,
  }) => Promise<unknown>;
  logout: () => Promise<void>;
  updatePerfil: (data: { 
    nombre?: string, 
    apellido?: string, 
    email?: string, 
    telefono?: string, 
    direccion?: string,
    tipo_documento?: string,
    documento?: string,
  }) => Promise<unknown>;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE NAVEGACIÓN
// ─────────────────────────────────────────────────────────────────────────────

const routerPush = (path: string) => (router as unknown as { push: (p: string) => void }).push(path);

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

const DOCUMENTO_OPTIONS = ['T.I.', 'C.C.', 'C.E.', 'P.A.'];
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
const PHONE_REGEX = /^3\d{9}$/;

// ─────────────────────────────────────────────────────────────────────────────
// UTILIDADES DE ROL (extraídas para reducir complejidad)
// ─────────────────────────────────────────────────────────────────────────────

const getRolColor = (rol?: string): string => {
  if (rol === 'administrador') return '#8c6a4a';
  if (rol === 'auxiliar') return '#c8a27a';
  if (rol === 'profesional') return '#a57c63';
  return '#d9c4a3';
};

const getRolLabel = (rol?: string): string => {
  if (rol === 'administrador') return 'Administrador';
  if (rol === 'auxiliar') return 'Auxiliar';
  if (rol === 'profesional') return 'Profesional';
  return 'Cliente';
};

const getRolIcon = (rol?: string): keyof typeof Ionicons.glyphMap => {
  if (rol === 'administrador') return 'shield-checkmark';
  if (rol === 'auxiliar') return 'construct';
  if (rol === 'profesional') return 'briefcase';
  return 'person';
};

const getFullName = (user: AuthCtx['user']): string => {
  if (!user) return 'Usuario';
  const fullName = [user?.nombre, user?.apellido].filter(Boolean).join(' ');
  return fullName || user?.email || 'Usuario';
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default function TabTwoScreen() {
  const { user, isAuthenticated, logout, login, register, isLoadingSession, updatePerfil } = useAuth() as AuthCtx;
  const canEditPerfil = ['administrador', 'auxiliar', 'cliente'].includes(user?.rol || '');

  // ── ESTADOS DE FORMULARIO ──────────────────────────────────────────────
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('C.C.');
  const [documento, setDocumento] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ── ESTADOS DE EDICIÓN DE PERFIL ──────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editApellido, setEditApellido] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTipoDocumento, setEditTipoDocumento] = useState('');
  const [editDocumento, setEditDocumento] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editDireccion, setEditDireccion] = useState('');
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [perfilError, setPerfilError] = useState('');
  const [perfilSuccess, setPerfilSuccess] = useState('');

  // ─────────────────────────────────────────────────────────────────────────────
  // FUNCIONES DE VALIDACIÓN (extraídas para reducir complejidad)
  // ─────────────────────────────────────────────────────────────────────────────

  const resetFeedback = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  // ✅ Línea 63: COMPLEJIDAD REDUCIDA - Validación de registro
  const validateRegister = (): { isValid: boolean; error: string } => {
    // Validar campos obligatorios
    if (!nombre || !apellido || !email || !password || !confirmPassword || !tipoDocumento || !documento) {
      return { 
        isValid: false, 
        error: 'Completa todos los campos obligatorios: nombre, apellido, tipo de documento, documento, email, contraseña y confirmación.' 
      };
    }

    // Validar contraseñas
    if (password !== confirmPassword) {
      return { isValid: false, error: 'Las contraseñas no coinciden' };
    }

    if (password.length < 6) {
      return { isValid: false, error: 'La contraseña debe tener al menos 6 caracteres' };
    }

    // Validar teléfono (opcional pero si se proporciona debe ser válido)
    if (telefono && !PHONE_REGEX.test(telefono)) {
      return { 
        isValid: false, 
        error: 'El teléfono debe ser un número colombiano válido (10 dígitos que empiezan por 3)' 
      };
    }

    return { isValid: true, error: '' };
  };

  // ✅ Línea 63: COMPLEJIDAD REDUCIDA - Validación de login
  const validateLogin = (): { isValid: boolean; error: string } => {
    if (!email || !password) {
      return { isValid: false, error: 'Ingresa tu correo y contraseña' };
    }
    return { isValid: true, error: '' };
  };

  // ✅ Línea 63: COMPLEJIDAD REDUCIDA - Validación de perfil
  const validatePerfil = (): { isValid: boolean; error: string } => {
    if (!editNombre.trim() && !editApellido.trim() && !editEmail.trim() && 
        !editTipoDocumento.trim() && !editDocumento.trim() && !editTelefono.trim() && !editDireccion.trim()) {
      return { isValid: false, error: 'Modifica al menos un campo' };
    }

    if (editEmail.trim() && editEmail.trim() !== user?.email) {
      if (!EMAIL_REGEX.test(editEmail.trim())) {
        return { isValid: false, error: 'Formato de email inválido' };
      }
    }

    return { isValid: true, error: '' };
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // FUNCIONES DE ENVÍO (refactorizadas)
  // ─────────────────────────────────────────────────────────────────────────────

  // ✅ Línea 142: COMPLEJIDAD REDUCIDA
  const handleSubmit = async () => {
    resetFeedback();

    // Validar según el modo
    const validation = isRegisterMode ? validateRegister() : validateLogin();
    if (!validation.isValid) {
      setErrorMessage(validation.error);
      return;
    }

    setLoadingSubmit(true);
    try {
      if (isRegisterMode) {
        await handleRegister();
      } else {
        await handleLogin();
      }
    } catch (error: unknown) {
      setErrorMessage((error as { message?: string })?.message || 'No fue posible completar la acción');
    } finally {
      setLoadingSubmit(false);
    }
  };

  // ✅ Extraído de handleSubmit para reducir complejidad
  const handleRegister = async () => {
    await register({
      nombre,
      apellido,
      email,
      password,
      tipo_documento: tipoDocumento,
      documento,
      ...(telefono ? { telefono } : {}),
      ...(direccion ? { direccion } : {}),
    } as any);
    
    setSuccessMessage('Registro exitoso! Ahora inicia sesión');
    setIsRegisterMode(false);
    // Limpiar campos
    setNombre('');
    setApellido('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setTipoDocumento('');
    setDocumento('');
    setTelefono('');
    setDireccion('');
  };

  // ✅ Extraído de handleSubmit para reducir complejidad
  const handleLogin = async () => {
    await login(email, password);
    setSuccessMessage(`Sesión iniciada correctamente. Bienvenido ${user?.nombre || email}`);
  };

  // ✅ Línea 172: REFACTORIZADO - Eliminado else con if
  const handleGuardarPerfil = async () => {
    setPerfilError('');
    setPerfilSuccess('');

    const validation = validatePerfil();
    if (!validation.isValid) {
      setPerfilError(validation.error);
      return;
    }

    setSavingPerfil(true);
    try {
      const data = buildPerfilData();
      await updatePerfil(data);
      setPerfilSuccess('Perfil actualizado correctamente');
      setEditMode(false);
      clearEditFields();
    } catch (error: unknown) {
      setPerfilError((error as { message?: string })?.message || 'No fue posible actualizar el perfil');
    } finally {
      setSavingPerfil(false);
    }
  };

  // ✅ Función auxiliar para construir los datos del perfil
  const buildPerfilData = () => {
    const data: { 
      nombre?: string; 
      apellido?: string; 
      email?: string; 
      tipo_documento?: string; 
      documento?: string; 
      telefono?: string; 
      direccion?: string 
    } = {};
    
    if (editNombre.trim()) data.nombre = editNombre.trim();
    if (editApellido.trim()) data.apellido = editApellido.trim();
    if (editEmail.trim()) data.email = editEmail.trim();
    if (editTipoDocumento.trim()) data.tipo_documento = editTipoDocumento.trim();
    if (editDocumento.trim()) data.documento = editDocumento.trim();
    if (editTelefono.trim()) data.telefono = editTelefono.trim();
    if (editDireccion.trim()) data.direccion = editDireccion.trim();
    
    return data;
  };

  // ✅ Función auxiliar para limpiar campos de edición
  const clearEditFields = () => {
    setEditNombre('');
    setEditApellido('');
    setEditEmail('');
    setEditTipoDocumento('');
    setEditDocumento('');
    setEditTelefono('');
    setEditDireccion('');
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // FUNCIONES DE UI
  // ─────────────────────────────────────────────────────────────────────────────

  const openEditPerfil = () => {
    setEditMode(true);
    setPerfilSuccess('');
    setEditNombre(user?.nombre || '');
    setEditApellido(user?.apellido || '');
    setEditEmail(user?.email || '');
    setEditTelefono(user?.telefono || '');
    setEditDireccion(user?.direccion || '');
  };

  const handleLogout = async () => {
    await logout();
    // Resetear todos los campos
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

  const toggleRegisterMode = () => {
    resetFeedback();
    setIsRegisterMode(prev => !prev);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER DE PANTALLA DE CARGA
  // ─────────────────────────────────────────────────────────────────────────────

  if (isLoadingSession) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText>Cargando sesión...</ThemedText>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER DE FORMULARIO (NO AUTENTICADO)
  // ─────────────────────────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ThemedView style={styles.formCard}>
          <ThemedText type="title">
            {isRegisterMode ? 'Registro' : 'Iniciar sesión'}
          </ThemedText>

          {renderRegisterFields()}
          {renderLoginFields()}

          {errorMessage && <ThemedText style={styles.error}>{errorMessage}</ThemedText>}
          {successMessage && <ThemedText style={styles.success}>{successMessage}</ThemedText>}

          <Pressable 
            style={styles.primaryButton} 
            onPress={handleSubmit} 
            disabled={loadingSubmit}
          >
            {loadingSubmit ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isRegisterMode ? 'Crear cuenta' : 'Entrar'}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={toggleRegisterMode}>
            <ThemedText type="link">
              {isRegisterMode ? 'Ya tengo cuenta, iniciar sesión' : 'No tengo cuenta, registrarme'}
            </ThemedText>
          </Pressable>
        </ThemedView>
      </KeyboardAvoidingView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER DE PERFIL (AUTENTICADO)
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {renderProfileHeader()}
      {perfilSuccess && renderSuccessBanner()}
      {renderEditProfile()}
      {renderAdminButtons()}
      {renderLogoutButton()}
    </ScrollView>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // FUNCIONES DE RENDERIZADO (extraídas para reducir complejidad)
  // ─────────────────────────────────────────────────────────────────────────────

  // ✅ Campos de registro (solo modo registro)
  function renderRegisterFields() {
    if (!isRegisterMode) return null;
    
    return (
      <>
        <View style={styles.dropdownContainer}>
          <ThemedText style={styles.dropdownLabel}>Tipo de documento *</ThemedText>
          <View style={styles.optionList}>
            {DOCUMENTO_OPTIONS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setTipoDocumento(option)}
                style={[
                  styles.optionButton,
                  tipoDocumento === option && styles.optionButtonSelected,
                ]}
              >
                <Text style={tipoDocumento === option ? styles.optionTextSelected : styles.optionText}>
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
        <TextInput
          placeholder="Confirmar contraseña *"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
        />
        <TextInput
          placeholder="Teléfono (ej: 3001234567)"
          keyboardType="phone-pad"
          value={telefono}
          onChangeText={setTelefono}
          maxLength={10}
          style={styles.input}
        />
        <TextInput
          placeholder="Dirección"
          value={direccion}
          onChangeText={setDireccion}
          style={styles.input}
        />
      </>
    );
  }

  // ✅ Campos de login (siempre visibles)
  function renderLoginFields() {
    return (
      <>
        <TextInput
          placeholder="Correo *"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Contraseña *"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
      </>
    );
  }

  // ✅ Línea 435: TERNARIO EXTRAÍDO - Encabezado del perfil
  function renderProfileHeader() {
    const rol = user?.rol || '';
    const backgroundColor = getRolColor(rol);
    const iconName = getRolIcon(rol);
    const label = getRolLabel(rol);
    const fullName = getFullName(user);

    return (
      <View style={[styles.profileHeader, { backgroundColor }]}>
        <View style={styles.avatarCircle}>
          <Ionicons name={iconName} size={40} color={backgroundColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{fullName}</Text>
          <Text style={styles.profileEmail}>{user?.email || '-'}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name={iconName} size={12} color="#fff" />
            <Text style={styles.roleBadgeText}>{label}</Text>
          </View>
        </View>
      </View>
    );
  }

  // ✅ Línea 439: TERNARIO EXTRAÍDO - Banner de éxito
  function renderSuccessBanner() {
    return (
      <View style={styles.successBanner}>
        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
        <Text style={styles.successText}>{perfilSuccess}</Text>
      </View>
    );
  }

  // ✅ Línea 450: TERNARIO EXTRAÍDO - Edición de perfil
  function renderEditProfile() {
    if (editMode) {
      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="create-outline" size={18} color="#a57c63" />
            <Text style={styles.cardTitle}>Editar perfil</Text>
          </View>
          <TextInput
            placeholder={`Nombre actual: ${user?.nombre || ''}`}
            value={editNombre}
            onChangeText={setEditNombre}
            style={styles.input}
          />
          <TextInput
            placeholder={`Apellido actual: ${user?.apellido || ''}`}
            value={editApellido}
            onChangeText={setEditApellido}
            style={styles.input}
          />
          <TextInput
            placeholder={`Email actual: ${user?.email || ''}`}
            value={editEmail}
            onChangeText={setEditEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            placeholder={`Teléfono actual: ${user?.telefono || ''}`}
            value={editTelefono}
            onChangeText={setEditTelefono}
            keyboardType="phone-pad"
            style={styles.input}
          />
          <TextInput
            placeholder={`Dirección actual: ${user?.direccion || ''}`}
            value={editDireccion}
            onChangeText={setEditDireccion}
            style={styles.input}
          />
          {perfilError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={15} color="#ef4444" />
              <Text style={styles.errorText}>{perfilError}</Text>
            </View>
          )}
          <View style={styles.editActions}>
            <Pressable 
              style={[styles.btn, styles.btnPrimary, { flex: 1 }]} 
              onPress={handleGuardarPerfil} 
              disabled={savingPerfil}
            >
              {savingPerfil ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTextWhite}>Guardar</Text>}
            </Pressable>
            <Pressable 
              style={[styles.btn, styles.btnOutline, { flex: 1 }]} 
              onPress={() => { setEditMode(false); setPerfilError(''); }}
            >
              <Text style={styles.btnTextOutline}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    if (canEditPerfil) {
      return (
        <Pressable style={[styles.btn, styles.btnOutline]} onPress={openEditPerfil}>
          <Ionicons name="create-outline" size={17} color="#a57c63" />
          <Text style={[styles.btnTextOutline, { color: '#a57c63' }]}>Editar perfil</Text>
        </Pressable>
      );
    }

    return null;
  }

  // ✅ Línea 562: TERNARIO EXTRAÍDO - Botones de administración
  function renderAdminButtons() {
    const rol = user?.rol || '';
    const isAdminOrAux = rol === 'administrador' || rol === 'auxiliar';
    const isProfesional = rol === 'profesional';

    return (
      <>
        {isAdminOrAux && (
          <Pressable 
            style={[styles.btn, { backgroundColor: '#8c6a4a' }]} 
            onPress={() => routerPush('/admin/dashboard')}
          >
            <Ionicons name="speedometer-outline" size={17} color="#fff" />
            <Text style={styles.btnTextWhite}>Panel de Administración</Text>
          </Pressable>
        )}

        {isProfesional && (
          <Pressable 
            style={[styles.btn, { backgroundColor: '#a57c63' }]} 
            onPress={() => routerPush('/profesional/dashboard')}
          >
            <Ionicons name="briefcase-outline" size={17} color="#fff" />
            <Text style={styles.btnTextWhite}>Panel Profesional</Text>
          </Pressable>
        )}

        <Pressable 
          style={[styles.btn, { backgroundColor: '#c8a27a' }]} 
          onPress={() => routerPush('/mis-pedidos')}
        >
          <Ionicons name="receipt-outline" size={17} color="#fff" />
          <Text style={styles.btnTextWhite}>Mis Pedidos</Text>
        </Pressable>

        <Pressable 
          style={[styles.btn, { backgroundColor: '#c8a27a' }]} 
          onPress={() => routerPush('/mis-citas')}
        >
          <Ionicons name="calendar-outline" size={17} color="#fff" />
          <Text style={styles.btnTextWhite}>Mis Citas</Text>
        </Pressable>
      </>
    );
  }

  // ✅ Botón de logout
  function renderLogoutButton() {
    return (
      <Pressable style={[styles.btn, { backgroundColor: '#ef4444' }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={17} color="#fff" />
        <Text style={styles.btnTextWhite}>Cerrar sesión</Text>
      </Pressable>
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── ESTILOS COMPARTIDOS ──────────────────────────────────────────────────
  scroll: { flex: 1 },
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  // ── FORMULARIO DE LOGIN / REGISTRO ───────────────────────────────────────
  formCard: { borderRadius: 12, padding: 16, gap: 12, margin: 20 },
  editSection: { borderRadius: 10, padding: 12, gap: 8, borderWidth: 1, borderColor: '#e0eaf3' },
  editActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  editBtn: { borderRadius: 10, borderWidth: 1, borderColor: '#a57c63', paddingVertical: 10, alignItems: 'center' },
  editBtnText: { color: '#a57c63', fontWeight: '600' },
  meta: { color: '#7b6758', fontSize: 13 },
  primaryButton: { 
    borderRadius: 10, 
    paddingVertical: 14, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#a57c63' 
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryButton: { 
    flex: 1, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#d5d5d5', 
    paddingVertical: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  logoutButton: { borderRadius: 10, backgroundColor: '#b93a32', paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  ordersButton: { borderRadius: 10, backgroundColor: '#c8a27a', paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  adminBtn: { borderRadius: 10, backgroundColor: '#8c6a4a', paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  adminBtnText: { color: '#fff', fontWeight: '700' },
  ordersText: { color: '#fff', fontWeight: '700' },
  logoutText: { color: '#fff', fontWeight: '700' },

  // ── PERFIL (usuario autenticado) ─────────────────────────────────────────
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  profileHeader: {
    borderRadius: 16, 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 16,
  },
  avatarCircle: {
    width: 70, 
    height: 70, 
    borderRadius: 35,
    backgroundColor: '#fff', 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  profileName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  roleBadge: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.2)', 
    borderRadius: 20,
    paddingHorizontal: 10, 
    paddingVertical: 3, 
    alignSelf: 'flex-start',
  },
  roleBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  card: {
    backgroundColor: '#fff', 
    borderRadius: 12,
    borderWidth: 1, 
    borderColor: '#e8e8e8', 
    padding: 14, 
    gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { fontWeight: '700', fontSize: 15, color: '#222' },

  btn: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8,
    borderRadius: 12, 
    paddingVertical: 14,
  },
  btnPrimary: { backgroundColor: '#a57c63' },
  btnOutline: { borderWidth: 2, borderColor: '#a57c63', backgroundColor: '#fff' },
  btnTextWhite: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnTextOutline: { color: '#a57c63', fontWeight: '700', fontSize: 15 },

  successBanner: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    backgroundColor: '#ecfdf5', 
    borderRadius: 10, 
    padding: 12, 
    borderWidth: 1, 
    borderColor: '#a7f3d0',
  },
  successText: { color: '#065f46', fontSize: 13, fontWeight: '500' },
  errorBanner: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    backgroundColor: '#fef2f2', 
    borderRadius: 10, 
    padding: 10, 
    borderWidth: 1, 
    borderColor: '#fca5a5',
  },
  errorText: { color: '#b91c1c', fontSize: 13 },

  dropdownContainer: { gap: 8 },
  dropdownLabel: { fontSize: 14, fontWeight: '600', color: '#4b5563' },
  optionList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionButton: {
    borderWidth: 1, 
    borderColor: '#d5d5d5', 
    borderRadius: 10,
    paddingVertical: 10, 
    paddingHorizontal: 12, 
    backgroundColor: '#fff',
  },
  optionButtonSelected: {
    backgroundColor: '#a57c63', 
    borderColor: '#a57c63',
  },
  optionText: { color: '#374151', fontWeight: '600' },
  optionTextSelected: { color: '#fff', fontWeight: '600' },

  input: {
    borderWidth: 1, 
    borderColor: '#d5d5d5', 
    borderRadius: 10,
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    backgroundColor: '#fff',
  },
  error: { color: '#d64545' },
  success: { color: '#218f4c' },
});