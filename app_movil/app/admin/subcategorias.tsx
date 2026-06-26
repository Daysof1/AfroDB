// Página: subcategorias.tsx. vista de subcategorias del sistema.
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import apiClient from '../../src/api/apiClient';
import { ThemedText } from '../../components/themed-text';

type Categoria = {
  id: number;
  nombre: string;
  activo: boolean;
  tipo?: 'producto' | 'servicio';
};

    type Subcategoria = {
    id: number;
    nombre: string;
    descripcion?: string | null;
    categoriaId?: number;
    tipo?: string;
    activo?: boolean;
    categoria?: Categoria;
    };

    const tipoOptions = ['producto', 'servicio'] as const;

    type AuthUser = { rol?: string };

    export default function AdminSubcategoriasScreen() {
    const { user } = useAuth() as { user: AuthUser | null };
    const isAdmin = user?.rol === 'administrador';
    const isAuxiliar = user?.rol === 'auxiliar';

    const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [categoriaId, setCategoriaId] = useState('');
    const [tipo, setTipo] = useState<'producto' | 'servicio'>('producto');
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredSubcategorias, setFilteredSubcategorias] = useState<Subcategoria[]>([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [showCategoriaModal, setShowCategoriaModal] = useState(false);
    const [searchCategoriaTerm, setSearchCategoriaTerm] = useState('');

    const searchTimeout = useRef<any>(null);

    const fetchCategorias = async () => {
        try {
        const res = await apiClient.get('/admin/categorias');
        const categoriasData: Categoria[] = res.data?.data?.categorias || [];
        setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
        } catch (error: unknown) {
        console.error('Error al cargar categorías:', error);
        }
    };

    const fetchSubcategorias = async () => {
        setLoading(true);
        setErrorMessage('');
        try {
        const res = await apiClient.get('/admin/subcategorias');
        const data: Subcategoria[] = res.data?.data?.subcategorias || [];
        const validData = Array.isArray(data) ? data : [];
        setSubcategorias(validData);
        setFilteredSubcategorias(validData);
        } catch (error: unknown) {
        setErrorMessage((error as { message?: string })?.message || 'Error al cargar subcategorías');
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategorias();
        fetchSubcategorias();
    }, []);

    useEffect(() => {
        // Limpiar categoría seleccionada al cambiar el tipo si no corresponde
        if (categoriaId) {
            const categoriaSeleccionada = categorias.find(cat => String(cat.id) === categoriaId);
            if (!categoriaSeleccionada || categoriaSeleccionada.tipo !== tipo) {
                setCategoriaId('');
            }
        }
    }, [tipo, categorias]);

    const categoriasFiltradas = categorias
        .filter((categoria) => categoria.tipo === tipo)
        .filter((categoria) =>
            categoria.nombre.toLowerCase().includes(searchCategoriaTerm.toLowerCase().trim())
        );

    useEffect(() => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) {
        setFilteredSubcategorias(subcategorias);
        return;
        }

        setFilteredSubcategorias(
        subcategorias.filter((subcategoria) => {
            const text = `${subcategoria.nombre} ${subcategoria.descripcion || ''} ${subcategoria.categoria?.nombre || ''} ${subcategoria.tipo || ''}`.toLowerCase();
            return text.includes(term);
        })
        );
    }, [searchTerm, subcategorias]);

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    const handleSearchTextChange = (text: string) => {
        setSearchTerm(text);
    };

    const handleCreate = async () => {
        if (!isAdmin) {
        Alert.alert('No autorizado', 'Solo administradores pueden crear subcategorías');
        return;
        }

        if (!nombre.trim()) {
        Alert.alert('Error', 'El nombre de la subcategoría es obligatorio');
        return;
        }

        if (descripcion.trim().length > 250) {
        Alert.alert(
            'Error',
            'La descripción de su subcategoría no puede tener más de 250 caracteres'
        );
        return;
        }

        if (!categoriaId) {
        Alert.alert('Error', 'Selecciona una categoría válida');
        return;
        }

        setSaving(true);
        try {
        await apiClient.post('/admin/subcategorias', {
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || null,
            categoriaId: Number(categoriaId),
            tipo,
        });
        setNombre('');
        setDescripcion('');
        setCategoriaId('');
        setTipo('producto');
        await fetchSubcategorias();
        Alert.alert('Éxito', 'Subcategoría creada correctamente');
        } catch (error: unknown) {
        Alert.alert('Error', (error as { message?: string })?.message || 'No se pudo crear la subcategoría');
        } finally {
        setSaving(false);
        }
    };

    const handleToggle = async (subcategoria: Subcategoria) => {
        try {
        await apiClient.patch(`/admin/subcategorias/${subcategoria.id}/toggle`);
        await fetchSubcategorias();
        } catch (error: unknown) {
        Alert.alert('Error', (error as { message?: string })?.message || 'No se pudo cambiar el estado');
        }
    };
    

    const renderHeader = () => (
        <View>
        <View style={styles.header}>
            <Ionicons name="layers-outline" size={28} color="#fff" />
            <View style={{ flex: 1 }}>
            <Text style={styles.title}>Subcategorías</Text>
            <Text style={styles.subtitle}>Gestiona y crea subcategorías del catálogo</Text>
            </View>
        </View>

        <View style={styles.searchRow}>
            <TextInput
            placeholder="Buscar subcategoría..."
            value={searchTerm}
            onChangeText={handleSearchTextChange}
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            />
            {searchTerm ? (
            <Pressable style={[styles.searchBtn, styles.clearBtn]} onPress={handleClearSearch}>
                <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
            ) : null}
            <Pressable style={styles.searchBtn} onPress={() => {}}>
            <ThemedText style={styles.searchBtnText}>Buscar</ThemedText>
            </Pressable>
        </View>

        {isAdmin ? (
            <View style={styles.formCard}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Ej: Asesoria imagen"
            />

            <Text style={styles.label}>Descripción</Text>
            <TextInput
                style={[styles.input, styles.textarea]}
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Descripción opcional"
                multiline
            />

            <Text style={styles.label}>Categoría</Text>
            <Pressable style={styles.selectButton} onPress={() => setShowCategoriaModal(true)}>
                <Text style={styles.selectText}>
                    {categoriaId
                        ? categorias.find((categoria) => String(categoria.id) === categoriaId)?.nombre
                        : 'Selecciona una categoría'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#6b5344" />
            </Pressable>
            <Modal
                visible={showCategoriaModal}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    setShowCategoriaModal(false);
                    setSearchCategoriaTerm('');
                }}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalPanel}>
                        <TextInput
                            placeholder="Buscar categoría..."
                            value={searchCategoriaTerm}
                            onChangeText={setSearchCategoriaTerm}
                            style={styles.modalSearchInput}
                            placeholderTextColor="#999"
                        />
                        <ScrollView>
                            {categoriasFiltradas.length === 0 ? (
                                <Text style={styles.modalEmptyText}>No hay categorías para este tipo.</Text>
                            ) : (
                                categoriasFiltradas.map((categoria) => (
                                    <Pressable
                                        key={categoria.id}
                                        style={styles.modalOption}
                                        onPress={() => {
                                            setCategoriaId(String(categoria.id));
                                            setShowCategoriaModal(false);
                                            setSearchCategoriaTerm('');
                                        }}
                                    >
                                        <Text style={styles.modalOptionText}>{categoria.nombre}</Text>
                                    </Pressable>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Text style={styles.label}>Tipo</Text>
            <View style={styles.optionList}>
                {tipoOptions.map((option) => (
                <Pressable
                    key={option}
                    onPress={() => setTipo(option)}
                    style={[
                    styles.optionButton,
                    tipo === option && styles.optionButtonSelected,
                    ]}
                >
                    <Text style={tipo === option ? styles.optionTextSelected : styles.optionText}>
                    {option === 'producto' ? 'Producto' : 'Servicio'}
                    </Text>
                </Pressable>
                ))}
            </View>

            <Pressable style={[styles.primaryBtn, saving && styles.disabledBtn]} onPress={handleCreate} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Crear subcategoría</Text>}
            </Pressable>
            </View>
        ) : (
            <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Solo administradores</Text>
            <Text style={styles.infoText}>Los auxiliares pueden ver subcategorías, pero no crear nuevas.</Text>
            </View>
        )}

        {loading && (
            <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#a56363" />
            <Text style={styles.loadingText}>Cargando subcategorías...</Text>
            </View>
        )}
        </View>
    );

        return (
            <FlatList
            data={loading ? [] : filteredSubcategorias}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.container}
            ListHeaderComponent={renderHeader}
            renderItem={({ item }) => {
                const payload = encodeURIComponent(JSON.stringify(item));
                return (
                    <Pressable
                      style={styles.itemCard}
                      onPress={() =>
                        (router as unknown as { push: (p: string) => void }).push(
                          `/admin/subcategoria-form?subcategoria=${payload}`
                        )
                      }
                    >
                      <View style={{ flex: 1 }}>
                          <Text style={styles.itemTitle}>{item.nombre}</Text>
                          <Text style={styles.itemDesc}>{item.descripcion || 'Sin descripción'}</Text>
                          <Text style={styles.meta}>Categoría: {item.categoria?.nombre || 'N/A'}</Text>
                          <Text style={styles.meta}>Tipo: {item.tipo || 'producto'}</Text>
                          <Text style={[styles.badge, item.activo ? styles.badgeActive : styles.badgeInactive]}>
                            {item.activo ? 'Activa' : 'Inactiva'}
                          </Text>
                      </View>
                      {(isAdmin || isAuxiliar) && (
                        <Pressable
                          style={[styles.toggleBtn, item.activo ? styles.toggleBtnOff : styles.toggleBtnOn]}
                          onPress={(event) => {
                            event.stopPropagation?.();
                            handleToggle(item);
                          }}
                        >
                          <Text style={styles.toggleBtnText}>{item.activo ? 'Desactivar' : 'Activar'}</Text>
                        </Pressable>
                      )}
                    </Pressable>
                );
            }}
            ListEmptyComponent={
                !loading ? <Text style={styles.emptyText}>No hay subcategorías registradas.</Text> : null
            }
            />
        );
    }

    const styles = StyleSheet.create({
        container: { padding: 16, backgroundColor: '#f9f6f2', flexGrow: 1 },
        header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8b6f47', borderRadius: 20, padding: 16},
        title: { color: '#fff', fontSize: 22, fontWeight: '800' },
        subtitle: { color: 'rgba(255,255,255,0.92)', marginTop: 2 },
        formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#8b6f47', marginBottom: 14 },
        label: { fontWeight: '700', color: '#3e2f25', marginBottom: 6 },
        input: { borderWidth: 1, borderColor: '#8b6f47', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', color: '#3e2f25', marginBottom: 12 },
        textarea: { minHeight: 90, textAlignVertical: 'top' },
        optionList: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
        optionButton: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#f3e6d8', borderRadius: 12, borderWidth: 1, borderColor: '#8b6f47', marginRight: 8, marginBottom: 8 },
        optionButtonSelected: { backgroundColor: '#8b6f47', borderColor: '#8b6f47' },
        optionText: { color: '#3e2f25', fontWeight: '700' },
        optionTextSelected: { color: '#fff', fontWeight: '700' },
        primaryBtn: { backgroundColor: '#8b6f47', borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
        primaryBtnText: { color: '#fff', fontWeight: '800' },
        disabledBtn: { opacity: 0.7 },
        infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#8b6f47', marginBottom: 14 },
        infoTitle: { fontWeight: '800', color: '#3e2f25', marginBottom: 6 },
        infoText: { color: '#7b6758' },
        modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
        modalPanel: { backgroundColor: '#fff', borderRadius: 18, padding: 16, maxHeight: '70%' },
        modalSearchInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, color: '#111827' },
        modalOption: { paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f3e6d8' },
        modalOptionText: { color: '#3e2f25', fontWeight: '700' },
        modalEmptyText: { color: '#7b6758', textAlign: 'center', paddingVertical: 14 },
        selectButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e4d8cb', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff', marginBottom: 12 },
        selectText: { color: '#5f4638', fontWeight: '600' },
        loadingBox: { alignItems: 'center', paddingVertical: 24 },
        loadingText: { color: '#7b6758' },
        error: { color: '#991b1b', fontWeight: '700' },
        searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, padding: 10 },
        searchBtn: { backgroundColor: '#8b6f47', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 6, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
        clearBtn: { backgroundColor: '#8b6f47' },
        searchBtnText: { color: '#fff', fontWeight: '700' },
        list: { paddingBottom: 24 },
        itemCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#8b6f47', padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
        itemTitle: { fontSize: 16, fontWeight: '800', color: '#3e2f25' },
        itemDesc: { color: '#7b6758', marginTop: 4, marginBottom: 6 },
        meta: { color: '#5f4a39', fontSize: 12, marginBottom: 2 },
        badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, fontSize: 12, fontWeight: '700' },
        badgeActive: { backgroundColor: '#e6d3b3', color: '#3e2f25' },
        badgeInactive: { backgroundColor: '#fee2e2', color: '#991b1b' },
        toggleBtn: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
        toggleBtnOn: { backgroundColor: '#8b6f47' },
        toggleBtnOff: { backgroundColor: '#3e2f25' },
        toggleBtnText: { color: '#fff', fontWeight: '800' },
        emptyText: { color: '#7b6758', textAlign: 'center', marginTop: 10 },
    });
