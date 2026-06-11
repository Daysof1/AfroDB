/**
 * Este archivo es el formulario para crear o edita un productoenel panel del admin
 * modo crear: se llega desde el boton + crear productoen admin/productos
 * n se recibe ningun parametro de ruta
 * modo editar se llega al precionar un producto en la lista
 * se recibe el parametro en la url/ api/ como un json 
 * al guardar exitosamnete regrsa a la pantalla anterior con router.back() 
 */


// manejo de variables de estado local
import { useEffect, useMemo, useState } from "react";
//Importar componentes 
//Dimensions optiene al ancho y alto de la pantalla para hacer diseos responsivos
//flatlist lista optimizada con virtualizacion para mostrar grandes cantidades de datos
//modal mostrar detalles de contenido en ventanas emergentes

import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput} from "react-native";

//Lee los parametros de la url para obtener el id del pedido
import { useLocalSearchParams, useRouter } from "expo-router";//navegacion y parametros de ruta
import { createProduct, updateProduct } from '../../src/services/adminService';
import apiClient from '../../src/api/apiClient';
/**
 * tipo de producto
 * estrucura del orduto recibido como parametro cuando edita
 */

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

export default function AdminProductoForm() {
    /**
     * navegacion 
     * use router permite navegar programaticamente 
     */
    const router  = useRouter();
    /**
     * Parametros de ruta
     * el parametro del producto es opcional solo existe en modo editar
     * expo router son strings 
     */
    const params = useLocalSearchParams<{ producto?: string }>();

    /**
     * producto recibido
     * si exise el parametro intenta pasearlo como un json
     * si fala el parse (JSON malinformado), lo deja como undefined (modo de creacion)
     */
    let producto: Producto |undefined;
    if (params.producto) {
        try {
            producto = JSON.parse(params.producto) as Producto;
        } catch {
            producto = undefined;// fallo silencioso se trata como formulario vacio
        }
    }

    /**
     * modo formulario
     * editing = true  modo edicion (producto recibido)
     * editing = false modo creacion 
     */
    const editing = !!producto;

    /**
     * EStado local campos del formulario
     * los campos d inicializan con los valores del producto si se esta editando 
     * o en cadena vacia si se esta creando
     * El operador ??  devuelve el lado derecho solo si el izquierdo es null /undefined
     */

    const [nombre, setNombre] = useState(producto?.nombre ?? '');
    const [descripcion, setDescripcion] = useState(producto?.descripcion ?? '');
    //precio y stock se guardan como string para faciitar la entrada de textoInput
    const [precio, setPrecio] = useState(producto?.precio?.toString() ?? '');
    const [stock, setStock] = useState(producto?.stock?.toString() ?? '');
    const [imagenUrl, setImagenUrl] = useState(producto?.imagen ?? '');
    const [categoriaId, setCategoriaId] = useState(producto?.categoriaId?.toString() ?? '');
    const [subcategoriaId, setSubcategoriaId] = useState(producto?.subcategoriaId?.toString() ?? '');
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
    const [loading, setLoading] = useState(false);

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
          const categoriasFiltradas = Array.isArray(cats) ? cats.filter((cat: Categoria) => cat.tipo === 'producto') : [];
          
          // Filtrar subcategorías que pertenezcan a categorías de tipo 'producto'
          const subcategoriasFiltradas = Array.isArray(subs) ? subs.filter((sub: Subcategoria) => {
            const categoriaPadre = categoriasFiltradas.find((cat: Categoria) => cat.id === sub.categoriaId);
            return !!categoriaPadre;
          }) : [];

          setCategorias(categoriasFiltradas);
          setSubcategorias(subcategoriasFiltradas);
        } catch {
          setCategorias([]);
          setSubcategorias([]);
        }
      };

      loadCatalogos();
    }, []);

    const subcategoriasFiltradas = useMemo(
      () => subcategorias.filter((sub) => String(sub.categoriaId) === categoriaId),
      [subcategorias, categoriaId]
    );

    /**
     * funcion handleSubmit
     * valida los campos llama alservicio correspondene (crear o actualizar)
     * y regresa a a pantalla anterir si fue exitoso
     */
    const handleSubmit = async () => {
        // validacion basica: todos los campos obligatorios.
      if (!nombre || !descripcion || !precio || !stock || !categoriaId || !subcategoriaId) {
        Alert.alert('Error', 'Todos los campos son obligatorios, incluyendo categoría y subcategoría');
            return;//detiene la ejecucion si hay la peticion http 
        }

      const precioNum = parseFloat(precio);
      const stockNum = parseInt(stock, 10);
      const categoriaNum = parseInt(categoriaId, 10);
      const subcategoriaNum = parseInt(subcategoriaId, 10);

      if (Number.isNaN(precioNum) || precioNum <= 0) {
        Alert.alert('Error', 'El precio debe ser un número mayor a 0');
        return;
      }

      if (Number.isNaN(stockNum) || stockNum < 0) {
        Alert.alert('Error', 'El stock debe ser un número entero mayor o igual a 0');
        return;
      }

      if (Number.isNaN(categoriaNum) || Number.isNaN(subcategoriaNum)) {
        Alert.alert('Error', 'Categoría y subcategoría deben ser IDs numéricos válidos');
        return;
      }

        setLoading(true);// Desabilita el boton durante la peticion 
        try {
            // contruye el objeto de datos convirtendolod precio y stock a numerico
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
                // modo edicion llama a updateProduct con el id del producto
                //se usa id como fallback 
                await updateProduct(producto.id || producto.id, data);
                Alert.alert('Exitoso', 'producto actualizado');
            } else {
                //cuando el formulario esta vacio se comporta como crecain
                await createProduct(data);
                Alert.alert('Exito', 'Producto creado');
            }
            router.back();// regresa a admin/productos despues de guardar
        } catch (error: unknown) {
            //si la peticion falla muestra el error real del servidor si está disponible
            const message = (error as any)?.response?.data?.message || (error as any)?.message || 'No se pudo guardar el producto';
            Alert.alert('Error', String(message));
        } finally {
            setLoading(false);//Habilita el boton nuevamente
        }
    };
// ── RENDERIZADO ───────────────────────────────────────────────────────────
  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* ── CAMPO: Nombre ───────────────────────────────────────────────── */}
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        value={nombre}
        onChangeText={setNombre} // Actualiza el estado al escribir.
      />

      {/* ── CAMPO: Descripción ──────────────────────────────────────────── */}
      <Text style={styles.label}>Descripcion</Text>
      <TextInput
        style={styles.input}
        value={descripcion}
        onChangeText={setDescripcion}
        multiline // Permite múltiples líneas para textos largos.
      />

      {/* ── CAMPO: Precio ───────────────────────────────────────────────── */}
      <Text style={styles.label}>Precio</Text>
      <TextInput
        style={styles.input}
        value={precio}
        onChangeText={setPrecio}
        keyboardType="numeric" // Muestra teclado numérico en dispositivos móviles.
      />

      {/* ── CAMPO: Stock ────────────────────────────────────────────────── */}
      <Text style={styles.label}>Stock</Text>
      <TextInput
        style={styles.input}
        value={stock}
        onChangeText={setStock}
        keyboardType="numeric"
      />

      {/* ── CAMPO: Categoría ID ─────────────────────────────────────────── */}
      <Text style={styles.label}>Categoría ID</Text>
      <TextInput
        style={styles.input}
        value={categoriaId}
        onChangeText={(value) => {
          setCategoriaId(value);
          setSubcategoriaId('');
        }}
        keyboardType="numeric"
        placeholder="ID de la categoría"
      />

      {/* ── CAMPO: Subcategoría ID ─────────────────────────────────────── */}
      <Text style={styles.label}>Subcategoría ID</Text>
      <TextInput
        style={styles.input}
        value={subcategoriaId}
        onChangeText={setSubcategoriaId}
        keyboardType="numeric"
        placeholder="ID de la subcategoría"
      />

      <Text style={styles.helper}>
        Categorías: {categorias.map((cat) => `${cat.id}: ${cat.nombre}`).join(' | ') || 'Cargando...'}
      </Text>
      <Text style={styles.helper}>
        Subcategorías: {subcategoriasFiltradas.map((sub) => `${sub.id}: ${sub.nombre}`).join(' | ') || 'Seleccione una categoría'}
      </Text>

      {/* ── CAMPO: URL Imagen ───────────────────────────────────────────── */}
      <Text style={styles.label}>URL Imagen</Text>
      <TextInput
        style={styles.input}
        value={imagenUrl}
        onChangeText={setImagenUrl}
        // Sin keyboardType especial: admite cualquier texto (URL o ruta).
      />

      {/* ── BOTÓN DE GUARDAR ────────────────────────────────────────────── */}
      {/* El título cambia según el modo: "Actualizar" si edita, "Crear" si es nuevo. */}
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

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Contenedor del ScrollView: padding interior, fondo claro similar a la web.
  // flexGrow: 1 hace que ocupe toda la pantalla aunque el contenido sea corto.
  container: { padding: 20, backgroundColor: '#f9f6f2', flexGrow: 1 },
  // Etiqueta de campo: negrita con margen superior para separar campos.
  label: { fontWeight: 'bold', marginTop: 10, color: '#3e2f25' },
  // Campo de texto: borde gris suave, esquinas redondeadas, padding interior.
  input: { borderWidth: 1, borderColor: '#b87a5a', borderRadius: 5, padding: 8, marginTop: 5, marginBottom: 10, backgroundColor: '#fff' },
  helper: { fontSize: 12, color: '#666', marginBottom: 8 },
  button: { marginTop: 20, backgroundColor: '#b87a5a', borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
