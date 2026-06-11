import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../src/api/apiClient';
import { useAuth } from '../../src/context/AuthContext';

type Categoria = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  tipo?: 'producto' | 'servicio';
  activo: boolean;
};

const tipoOptions = ['producto', 'servicio'] as const;

export default function AdminCategoriasScreen() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [allCategorias, setAllCategorias] = useState<Categoria[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<'producto' | 'servicio'>('producto');
  const { isAuthenticated, user } = useAuth() as { isAuthenticated: boolean; user?: { rol?: string } | null };

  const fetchCategorias = async (page = 1, search = '') => {
    setLoading(true);
    setErrorMessage('');
    try {
      // El endpoint admin/categorias devuelve todas las categorías.
      // No hay búsqueda/paginación en backend, así que traemos todo
      // y filtramos en el cliente por nombre.
      const url = `/admin/categorias`;
      const res = await apiClient.get(url);
      const categoriasData: Categoria[] = res.data?.data?.categorias || [];
      setAllCategorias(categoriasData);

      if (search && search.trim()) {
        const s = search.trim().toLowerCase();
        setCategorias(
          categoriasData.filter((c) => {
            const combined = `${c.nombre || ''} ${c.descripcion || ''}`.toLowerCase();
            return combined.includes(s);
          })
        );
      } else {
        setCategorias(categoriasData);
      }

      setPagina(page);
      setTotalPaginas(1);
    } catch (error: unknown) {
      setErrorMessage((error as { message?: string })?.message || 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  // avanza y retrocede paginas (simulado en cliente)
  const handlePagina = (next: number) => {
    const nuevaPagina = Math.max(1, Math.min(totalPaginas, pagina + next));
    setPagina(nuevaPagina);
  };

  const isAdmin = user?.rol === 'administrador';

  // Debounce para la búsqueda en cliente
  const searchTimeout = useRef<any>(null);

  useEffect(() => {
    // carga inicial
    fetchCategorias(1, '');
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
        tipo,
      });
      setNombre('');
      setDescripcion('');
      setTipo('producto');
      await fetchCategorias(1, busqueda);
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
      await fetchCategorias(1, busqueda);
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
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Buscar categoría..."
          value={busqueda}
          onChangeText={(text) => {
            setBusqueda(text);
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
            searchTimeout.current = setTimeout(() => fetchCategorias(1, text), 300);
          }}
          style={[styles.input, { flex: 1 }]}
        />
        {busqueda ? (
          <Pressable
            style={[styles.searchBtn, styles.clearBtn]}
            onPress={() => {
              if (searchTimeout.current) clearTimeout(searchTimeout.current);
              setBusqueda('');
              setCategorias(allCategorias);
            }}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
        ) : null}
        <Pressable style={styles.searchBtn} onPress={() => fetchCategorias(1, busqueda)}>
          <ThemedText style={styles.searchBtnText}>Buscar</ThemedText>
        </Pressable>
      </View>

      {user?.rol === 'auxiliar' ? (
        <View style={styles.formCard}>
          <Text style={styles.label}>No tienes permisos para crear categorías</Text>
        </View>
      ) : (
        <View style={styles.formCard}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Ej: Imagen y Estilo" />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Descripción opcional"
            multiline
          />

          <View style={styles.dropdownContainer}>
            <Text style={styles.label}>Tipo de categoría</Text>
            <View style={styles.optionList}>
              {tipoOptions.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setTipo(option)}
                  style={[styles.optionButton, tipo === option && styles.optionButtonSelected]}
                >
                  <Text style={tipo === option ? styles.optionTextSelected : styles.optionText}>
                    {option === 'producto' ? 'Producto' : 'Servicio'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

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
              <Text style={styles.itemType}>{categoria.tipo ? `Tipo: ${categoria.tipo}` : 'Tipo: producto'}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#a56363', borderRadius: 20, padding: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: '#a56363'},
  label: { fontWeight: '700', color: '#3e2f25' },
  input: { borderWidth: 1, borderColor: '#a56363', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', color: '#3e2f25' },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  primaryBtn: { backgroundColor: '#a56363', borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
  disabledBtn: { opacity: 0.7 },
  loadingBox: { alignItems: 'center', gap: 8, paddingVertical: 20 },
  loadingText: { color: '#7b6758' },
  itemCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: 1, borderColor: '#a56363' },
  itemTitle: { fontSize: 16, fontWeight: '800', color: '#3e2f25' },
  itemDesc: { color: '#7b6758', marginTop: 4, marginBottom: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', fontSize: 12, fontWeight: '700' },
  badgeActive: { backgroundColor: '#e6d3b3', color: '#3e2f25' },
  badgeInactive: { backgroundColor: '#fee2e2', color: '#991b1b' },
  toggleBtn: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  toggleBtnOn: { backgroundColor: '#a56363' },
  toggleBtnOff: { backgroundColor: '#3e2f25' },
  toggleBtnText: { color: '#fff', fontWeight: '800' },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 8},
  searchBtn: { backgroundColor: '#a56363', borderRadius: 14, paddingHorizontal: 16, justifyContent: 'center' },
  clearBtn: { backgroundColor: '#a56363', borderRadius: 14, paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700' },
  dropdownContainer: { gap: 8 },
  optionList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  optionButton: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#f3e6d8', borderRadius: 12, borderWidth: 1, borderColor: '#e6d3b3' },
  optionButtonSelected: { backgroundColor: '#a56363', borderColor: '#a56363' },
  optionText: { color: '#3e2f25', fontWeight: '700' },
  optionTextSelected: { color: '#fff', fontWeight: '700' },
  itemType: { color: '#7b6758', marginBottom: 8, fontStyle: 'italic' },
});
