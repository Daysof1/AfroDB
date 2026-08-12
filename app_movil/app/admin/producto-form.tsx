// Página: producto-form.tsx. vista de producto-form del sistema.
/**
 * Este archivo es el formulario para crear o editar un producto en el panel del admin
 * modo crear: se llega desde el botón + crear producto en admin/productos
 * no se recibe ningun parametro de ruta
 * modo editar se llega al presionar un producto en la lista
 * se recibe el parametro en la url/ api/ como un json 
 * al guardar exitosamente regresa a la pantalla anterior con router.back() 
 */

import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { createProduct, updateProduct } from '../../src/services/adminService';
import apiClient from '../../src/api/apiClient';
import { SearchableSelect } from '../../components/ui/searchable-select';

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

type Producto = {
    id?: string;
    nombre?: string;
    descripcion?: string;
    precio?: number;
    stock?: number;
    imagen?: string;
    categoriaId?: number;
    subcategoriaId?: number;
};

type Categoria = { id: number; nombre: string; tipo?: string };
type Subcategoria = { id: number; nombre: string; categoriaId: number; tipo?: string };

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────

export default function AdminProductoForm() {
    const router = useRouter();
    const params = useLocalSearchParams<{ producto?: string }>();

    // Parsear producto si existe
    let producto: Producto | undefined;
    if (params.producto) {
        try {
            producto = JSON.parse(params.producto) as Producto;
        } catch {
            producto = undefined;
        }
    }

    const editing = !!producto;

    // ── ESTADOS ──────────────────────────────────────────────────────────────
    const [nombre, setNombre] = useState(producto?.nombre ?? '');
    const [descripcion, setDescripcion] = useState(producto?.descripcion ?? '');
    const [precio, setPrecio] = useState(producto?.precio?.toString() ?? '');
    const [stock, setStock] = useState(producto?.stock?.toString() ?? '');
    const [imagenUrl, setImagenUrl] = useState(producto?.imagen ?? '');
    const [categoriaId, setCategoriaId] = useState(producto?.categoriaId?.toString() ?? '');
    const [subcategoriaId, setSubcategoriaId] = useState(producto?.subcategoriaId?.toString() ?? '');
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

                // Filtrar solo categorías de tipo 'producto'
                const categoriasFiltradas = Array.isArray(cats) 
                    ? cats.filter((cat: Categoria) => cat.tipo === 'producto') 
                    : [];
                
                // Filtrar subcategorías que pertenezcan a categorías de tipo 'producto'
                const subcategoriasFiltradas = Array.isArray(subs) 
                    ? subs.filter((sub: Subcategoria) => {
                        // ✅ Línea 113: Usar .some() en lugar de .find()
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
        if (!nombre || !descripcion || !precio || !stock || !categoriaId || !subcategoriaId) {
            Alert.alert('Error', 'Todos los campos son obligatorios, incluyendo categoría y subcategoría');
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

    const validarStock = (stockNum: number) => {
        if (Number.isNaN(stockNum) || stockNum < 0) {
            Alert.alert('Error', 'El stock debe ser un número entero mayor o igual a 0');
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
        const stockNum = Number.parseInt(stock, 10);
        const categoriaNum = Number.parseInt(categoriaId, 10);
        const subcategoriaNum = Number.parseInt(subcategoriaId, 10);

        if (!validarPrecio(precioNum)) return;
        if (!validarStock(stockNum)) return;
        if (!validarIds(categoriaNum, subcategoriaNum)) return;

        setLoading(true);
        try {
            const data = {
                nombre,
                descripcion,
                precio: precioNum,
                stock: stockNum,
                imagenUrl,
                categoriaId: categoriaNum,
                subcategoriaId: subcategoriaNum,
            };

            if (editing && producto) {
                await updateProduct(producto.id, data);
                Alert.alert('Éxito', 'Producto actualizado');
            } else {
                await createProduct(data);
                Alert.alert('Éxito', 'Producto creado');
            }
            router.back();
        } catch (error: unknown) {
            const message = (error as any)?.response?.data?.message || 
                           (error as any)?.message || 
                           'No se pudo guardar el producto';
            Alert.alert('Error', String(message));
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

            {/* CAMPO: Stock */}
            <Text style={styles.label}>Stock</Text>
            <TextInput
                style={styles.input}
                value={stock}
                onChangeText={setStock}
                keyboardType="numeric"
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
        borderColor: '#b87a5a', 
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
        backgroundColor: '#b87a5a', 
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