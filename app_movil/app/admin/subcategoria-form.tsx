import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '../../components/themed-text';
import { updateSubcategoria } from '../../src/services/adminService';

type Categoria = {
  id?: number;
  nombre?: string;
  activo?: boolean;
  tipo?: 'producto' | 'servicio';
};

type Subcategoria = {
  id?: number;
  nombre?: string;
  descripcion?: string | null;
  categoriaId?: number;
  tipo?: 'producto' | 'servicio';
  activo?: boolean;
  categoria?: Categoria;
};

export default function AdminSubcategoriaForm() {
  const router = useRouter();
  const params = useLocalSearchParams<{ subcategoria?: string }>();

  let subcategoria: Subcategoria | undefined;
  if (params.subcategoria) {
    try {
      subcategoria = JSON.parse(params.subcategoria) as Subcategoria;
    } catch {
      subcategoria = undefined;
    }
  }

  const editing = !!subcategoria?.id;
  const [nombre, setNombre] = useState(subcategoria?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(subcategoria?.descripcion ?? '');
  const [categoriaId, setCategoriaId] = useState(subcategoria?.categoriaId?.toString() ?? '');
  const [tipo, setTipo] = useState<'producto' | 'servicio'>(subcategoria?.tipo === 'servicio' ? 'servicio' : 'producto');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!editing || !subcategoria?.id) {
      Alert.alert('Error', 'No se encontró la subcategoría para editar.');
      return;
    }

    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio.');
      return;
    }

    setLoading(true);
    try {
      await updateSubcategoria(subcategoria.id, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        categoriaId: Number(categoriaId) || undefined,
        tipo,
      });
      Alert.alert('Éxito', 'Subcategoría actualizada correctamente.');
      router.back();
    } catch (error: unknown) {
      Alert.alert('Error', (error as { message?: string })?.message || 'No se pudo actualizar la subcategoría.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">{editing ? 'Editar subcategoría' : 'Subcategoría no encontrada'}</ThemedText>
      {editing ? (
        <>
          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Nombre de la subcategoría" />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Descripción opcional"
            multiline
          />

          <Text style={styles.label}>Categoría ID</Text>
          <TextInput
            style={styles.input}
            value={categoriaId}
            onChangeText={setCategoriaId}
            placeholder="ID de la categoría"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Tipo</Text>
          <View style={styles.optionList}>
            <Pressable
              style={[styles.optionButton, tipo === 'producto' && styles.optionButtonSelected]}
              onPress={() => setTipo('producto')}
            >
              <Text style={tipo === 'producto' ? styles.optionTextSelected : styles.optionText}>Producto</Text>
            </Pressable>
            <Pressable
              style={[styles.optionButton, tipo === 'servicio' && styles.optionButtonSelected]}
              onPress={() => setTipo('servicio')}
            >
              <Text style={tipo === 'servicio' ? styles.optionTextSelected : styles.optionText}>Servicio</Text>
            </Pressable>
          </View>

          <Pressable style={[styles.primaryBtn, loading && styles.disabledBtn]} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.primaryBtnText}>{loading ? 'Guardando...' : 'Guardar cambios'}</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>No se recibió una subcategoría válida para editar.</Text>
          <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
            <Text style={styles.secondaryBtnText}>Volver</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, gap: 14, backgroundColor: '#f9f6f2' },
  label: { color: '#3e2f25', fontWeight: '700', marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#8b6f47', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff', color: '#3e2f25' },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  primaryBtn: { backgroundColor: '#8b6f47', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
  disabledBtn: { opacity: 0.7 },
  optionList: { flexDirection: 'row', gap: 10, marginTop: 8 },
  optionButton: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#f3e6d8', borderRadius: 12, borderWidth: 1, borderColor: '#d4b483' },
  optionButtonSelected: { backgroundColor: '#8b6f47', borderColor: '#8b6f47' },
  optionText: { color: '#3e2f25', fontWeight: '700' },
  optionTextSelected: { color: '#fff', fontWeight: '700' },
  messageBox: { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#d4b483' },
  messageText: { color: '#7b6758', marginBottom: 12 },
  secondaryBtn: { backgroundColor: '#e6d3b3', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  secondaryBtnText: { color: '#3e2f25', fontWeight: '700' },
});
