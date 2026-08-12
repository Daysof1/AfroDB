// Página: servicio-form.tsx. vista de servicio-form del sistema.
/**
 * Este archivo es el formulario para crear o editar un servicio en el panel del admin
 * modo crear: se llega desde el boton + crear servicio en admin/servicios
 * no se recibe ningun parametro de ruta
 * modo editar se llega al presionar un servicio en la lista
 * se recibe el parametro en la url/ api/ como un json 
 * al guardar exitosamente regresa a la pantalla anterior con router.back() 
 */

import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { createService, updateService } from '../../src/services/adminService';
import apiClient from '../../src/api/apiClient';
import { SearchableSelect } from '../../components/ui/searchable-select';

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

type Servicio = {
    id?: string;
    nombre?: string;
    descripcion?: string;
    precio?: number;
    duracion?: number;
    imagen?: string;
    categoriaId?: number;
    subcategoriaId?: number;
};

type Categoria = { id: number; nombre: string; tipo?: string };
type Subcategoria = { id: number; nombre: string; categoriaId: number; tipo?: string };

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────

export default function AdminServicioForm() {
    const router = useRouter();
    const params = useLocalSearchParams<{ servicio?: string }>();

    // Parsear servicio si existe
    let servicio: Servicio | undefined;
    if (params.servicio) {
        try {
            servicio = JSON.parse(params.servicio) as Servicio;
        } catch {
            servicio = undefined;
        }
    }

    const editing = !!servicio;

    // ── ESTADOS ──────────────────────────────────────────────────────────────
    const [nombre, setNombre] = useState(servicio?.nombre ?? '');
    const [descripcion, setDescripcion] = useState(servicio?.descripcion ?? '');
    const [precio, setPrecio] = useState(servicio?.precio?.toString() ?? '');
    const [duracion, setDuracion] = useState(servicio?.duracion?.toString() ?? '');
    const [imagenUrl, setImagenUrl] = useState(servicio?.imagen ?? '');
    const [categoriaId, setCategoriaId] = useState(servicio?.categoriaId?.toString() ?? '');
    const [subcategoriaId, setSubcategoriaId] = useState(servicio?.subcategoriaId?.toString() ?? '');
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
    const [loading, setLoading] = useState(false);

    // ─────────────────────────────────────────────────────────────
    // EFECTOS
    // ─────────────────────────────────────────────────────────────

    useEffect(() => {
        const loadCatalogos = async () => {
            try {
                const [catsRes, subsRes] = await Promise.all([
                    apiClient.get('/admin/categorias'),
                    apiClient.get('/admin/subcategorias'),
                ]);

                const cats = catsRes.data?.data?.categorias || catsRes.data?.categorias || [];
                const subs = subsRes.data?.data?.subcategorias || subsRes.data?.subcategorias || [];

                // Filtrar solo categorías de tipo 'servicio'
                const categoriasFiltradas = Array.isArray(cats) 
                    ? cats.filter((cat: Categoria) => cat.tipo === 'servicio') 
                    : [];
                
                // ✅ Línea 113: Usar .some() en lugar de .find()
                const subcategoriasFiltradas = Array.isArray(subs) 
                    ? subs.filter((sub: Subcategoria) => {
                        return categoriasFiltradas.some((cat: Categoria) => cat.id === sub.categoriaId);
                    }) 
                    : [];

                setCategorias(categoriasFiltradas);
                setSubcategorias(subcategoriasFiltradas);
            } catch {
                setCategorias([]);
                setSubcategorias([]);
            }
        };

        loadCatalogos();
    }, []);

    // ─────────────────────────────────────────────────────────────
    // MEMO: Subcategorías filtradas por categoría seleccionada
    // ─────────────────────────────────────────────────────────────

    const subcategoriasFiltradas = useMemo(
        () => subcategorias.filter((sub) => String(sub.categoriaId) === categoriaId),
        [subcategorias, categoriaId]
    );

    // ─────────────────────────────────────────────────────────────
    // FUNCIONES DE VALIDACIÓN (extraídas para reducir complejidad)
    // ─────────────────────────────────────────────────────────────

    const validarCampos = () => {
        if (!nombre || !descripcion || !precio || !duracion || !categoriaId || !subcategoriaId) {
            Alert.alert('Error', 'Todos los campos son obligatorios, incluyendo duración, categoría y subcategoría');
            return false;
        }
        return true;
    };

    const validarPrecio = (precioNum: number) => {
        if (Number.isNaN(precioNum) || precioNum <= 0) {
            Alert.alert('Error', 'El precio debe ser un número mayor a 0');
            return false;
        }
        return true;
    };

    const validarDuracion = (duracionNum: number) => {
        if (Number.isNaN(duracionNum) || duracionNum <= 0) {
            Alert.alert('Error', 'La duración debe ser un número mayor a 0');
            return false;
        }
        return true;
    };

    const validarIds = (categoriaNum: number, subcategoriaNum: number) => {
        if (Number.isNaN(categoriaNum) || Number.isNaN(subcategoriaNum)) {
            Alert.alert('Error', 'Categoría y subcategoría deben ser IDs numéricos válidos');
            return false;
        }
        return true;
    };

    // ─────────────────────────────────────────────────────────────
    // HANDLE SUBMIT
    // ─────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        // Validaciones
        if (!validarCampos()) return;

        const precioNum = Number.parseFloat(precio);
        const duracionNum = Number.parseInt(duracion, 10);
        const categoriaNum = Number.parseInt(categoriaId, 10);
        const subcategoriaNum = Number.parseInt(subcategoriaId, 10);

        if (!validarPrecio(precioNum)) return;
        if (!validarDuracion(duracionNum)) return;
        if (!validarIds(categoriaNum, subcategoriaNum)) return;

        setLoading(true);
        try {
            const data = {
                nombre,
                descripcion,
                precio: precioNum,
                duracion: duracionNum,
                imagenUrl,
                categoriaId: categoriaNum,
                subcategoriaId: subcategoriaNum,
            };

            if (editing && servicio) {
                await updateService(servicio.id, data);
                Alert.alert('Éxito', 'Servicio actualizado');
            } else {
                await createService(data);
                Alert.alert('Éxito', 'Servicio creado');
            }
            router.back();
        } catch {
            Alert.alert('Error', 'No se pudo guardar el servicio');
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* CAMPO: Nombre */}
            <Text style={styles.label}>Nombre</Text>
            <TextInput
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
            />

            {/* CAMPO: Descripción */}
            <Text style={styles.label}>Descripción</Text>
            <TextInput
                style={styles.input}
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
            />

            {/* CAMPO: Precio */}
            <Text style={styles.label}>Precio</Text>
            <TextInput
                style={styles.input}
                value={precio}
                onChangeText={setPrecio}
                keyboardType="numeric"
            />

            {/* CAMPO: Duración */}
            <Text style={styles.label}>Duración (minutos)</Text>
            <TextInput
                style={styles.input}
                value={duracion}
                onChangeText={setDuracion}
                keyboardType="numeric"
                placeholder="Duración en minutos"
            />

            {/* CAMPO: Categoría */}
            <SearchableSelect
                label="Categoría"
                value={categoriaId}
                placeholder="Selecciona una categoría"
                items={categorias.map((cat) => ({ id: cat.id, label: cat.nombre }))}
                onSelect={(value) => {
                    setCategoriaId(value);
                    setSubcategoriaId('');
                }}
                noResultsText="No se encontró ninguna categoría."
            />

            {/* CAMPO: Subcategoría */}
            <SearchableSelect
                label="Subcategoría"
                value={subcategoriaId}
                placeholder="Selecciona una subcategoría"
                items={subcategoriasFiltradas.map((sub) => ({ id: sub.id, label: sub.nombre }))}
                onSelect={setSubcategoriaId}
                disabled={!categoriaId}
                noResultsText={categoriaId ? 'No se encontró ninguna subcategoría.' : 'Selecciona primero una categoría.'}
            />

            {/* CAMPO: URL Imagen */}
            <Text style={styles.label}>URL Imagen</Text>
            <TextInput
                style={styles.input}
                value={imagenUrl}
                onChangeText={setImagenUrl}
            />

            {/* BOTÓN DE GUARDAR */}
            <Pressable
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
            >
                <Text style={styles.buttonText}>{editing ? 'Actualizar' : 'Crear'}</Text>
            </Pressable>
        </ScrollView>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { 
        padding: 20, 
        backgroundColor: '#f9f6f2', 
        flexGrow: 1 
    },
    label: { 
        fontWeight: 'bold', 
        marginTop: 10, 
        color: '#3e2f25' 
    },
    input: { 
        borderWidth: 1, 
        borderColor: '#7a5c46', 
        borderRadius: 5, 
        padding: 8, 
        marginTop: 5, 
        marginBottom: 10, 
        backgroundColor: '#fff' 
    },
    helper: { 
        fontSize: 12, 
        color: '#666', 
        marginBottom: 8 
    },
    button: { 
        marginTop: 20, 
        backgroundColor: '#7a5c46', 
        borderRadius: 10, 
        paddingVertical: 14, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    buttonDisabled: { 
        opacity: 0.7 
    },
    buttonText: { 
        color: '#fff', 
        fontWeight: '700' 
    },
});