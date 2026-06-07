import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../src/api/apiClient';
import { useAuth } from '../../src/context/AuthContext';

type Categoria = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
};

export default function AdminCategoriasScreen() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const { isAuthenticated, user } = useAuth() as { isAuthenticated: boolean; user?: { rol?: string } | null };

  const loadCategorias = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/categorias');
      const payload = response.data?.data || response.data || {};
      const lista = payload.categorias || [];
      setCategorias(Array.isArray(lista) ? lista : []);
    } catch (error) {
      Alert.alert('Error', (error as Error).message || 'No se pudieron cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategorias();
  }, []);

  const handleCreate = async () => {
    // Guardia: auxiliares no pueden crear categorías
    if (user?.rol === 'auxiliar') {
      Alert.alert('No autorizado', 'No tienes permisos para crear categorías');
      return;
    }
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/admin/categorias', {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
      });
      setNombre('');
      setDescripcion('');
      await loadCategorias();
      Alert.alert('Éxito', 'Categoría creada correctamente');
    } catch (error) {
      Alert.alert('Error', (error as Error).message || 'No se pudo crear la categoría');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (categoria: Categoria) => {
    try {
      await apiClient.patch(`/admin/categorias/${categoria.id}/toggle`);
      await loadCategorias();
    } catch (error) {
      Alert.alert('Error', (error as Error).message || 'No se pudo cambiar el estado');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Ionicons name="folder-outline" size={28} color="#fff" />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Categorías</Text>
          <Text style={styles.subtitle}>Crear y activar/desactivar categorías</Text>
        </View>
      </View>

      {user?.rol === 'auxiliar' ? (
        <View style={styles.formCard}>
          <Text style={styles.label}>No tienes permisos para crear categorías</Text>
        </View>
      ) : (
        <View style={styles.formCard}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Ej: Electrónica" />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Descripción opcional"
            multiline
          />

          <Pressable style={[styles.primaryBtn, saving && styles.disabledBtn]} onPress={handleCreate} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Crear categoría</Text>}
          </Pressable>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Cargando categorías...</Text>
        </View>
      ) : (
        categorias.map((categoria) => (
          <View key={categoria.id} style={styles.itemCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{categoria.nombre}</Text>
              <Text style={styles.itemDesc}>{categoria.descripcion || 'Sin descripción'}</Text>
              <Text style={[styles.badge, categoria.activo ? styles.badgeActive : styles.badgeInactive]}>
                {categoria.activo ? 'Activa' : 'Inactiva'}
              </Text>
            </View>
            <Pressable
              style={[styles.toggleBtn, categoria.activo ? styles.toggleBtnOff : styles.toggleBtnOn]}
              onPress={() => handleToggle(categoria)}
            >
              <Text style={styles.toggleBtnText}>{categoria.activo ? 'Desactivar' : 'Activar'}</Text>
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, backgroundColor: '#f9f6f2', flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#c8a27a', borderRadius: 20, padding: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: '#e6d3b3' },
  label: { fontWeight: '700', color: '#3e2f25' },
  input: { borderWidth: 1, borderColor: '#e6d3b3', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#faf2e6', color: '#3e2f25' },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  primaryBtn: { backgroundColor: '#a56363', borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
  disabledBtn: { opacity: 0.7 },
  loadingBox: { alignItems: 'center', gap: 8, paddingVertical: 20 },
  loadingText: { color: '#7b6758' },
  itemCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e6d3b3' },
  itemTitle: { fontSize: 16, fontWeight: '800', color: '#3e2f25' },
  itemDesc: { color: '#7b6758', marginTop: 4, marginBottom: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', fontSize: 12, fontWeight: '700' },
  badgeActive: { backgroundColor: '#e6d3b3', color: '#3e2f25' },
  badgeInactive: { backgroundColor: '#fee2e2', color: '#991b1b' },
  toggleBtn: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  toggleBtnOn: { backgroundColor: '#a56363' },
  toggleBtnOff: { backgroundColor: '#3e2f25' },
  toggleBtnText: { color: '#fff', fontWeight: '800' },
});
