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

import { Alert, Button, ScrollView, StyleSheet, Text, TextInput} from "react-native";

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

type Categoria = { id: number; nombre: string };
type Subcategoria = { id: number; nombre: string; categoriaId: number };

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
    const [imagen, setImagen] = useState(producto?.imagen ?? '');
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

          setCategorias(Array.isArray(cats) ? cats : []);
          setSubcategorias(Array.isArray(subs) ? subs : []);
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
        // validacion basica los 4 campos obligatorios no pueden estar vacios 
      if (!nombre || !descripcion || !precio || !stock || !categoriaId || !subcategoriaId) {
        Alert.alert('Error', 'Todos los campos son obligatorios, incluyendo categoría y subcategoría');
            return;//detiene la ejecucion si hay la peticion http 
        }

        setLoading(true);// Desabilita el boton durante la peticion 
        try {
            // contruye el objeto de datos convirtendolod precio y stock a numerico
            const data = {
                nombre,
                descripcion,
                precio: parseFloat(precio),
                stock: parseInt(stock, 10),
                imagen,
              categoriaId: parseInt(categoriaId, 10),
              subcategoriaId: parseInt(subcategoriaId, 10),
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
        } catch {
            //si la peticion falla muesra el eror a usuario
            Alert.alert('Error', 'No se pudo guardar el producto');
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
        value={imagen}
        onChangeText={setImagen}
        // Sin keyboardType especial: admite cualquier texto (URL o ruta).
      />

      {/* ── BOTÓN DE GUARDAR ────────────────────────────────────────────── */}
      {/* El título cambia según el modo: "Actualizar" si edita, "Crear" si es nuevo. */}
      {/* disabled evita envíos múltiples mientras loading=true. */}
      <Button
        title={editing ? 'Actualizar' : 'Crear'}
        onPress={handleSubmit}
        disabled={loading}
      />
    </ScrollView>
  );
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Contenedor del ScrollView: padding interior, fondo blanco.
  // flexGrow: 1 hace que ocupe toda la pantalla aunque el contenido sea corto.
  container: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },
  // Etiqueta de campo: negrita con margen superior para separar campos.
  label: { fontWeight: 'bold', marginTop: 10 },
  // Campo de texto: borde gris, esquinas ligeramente redondeadas, padding interior.
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 8, marginTop: 5, marginBottom: 10 },
  helper: { fontSize: 12, color: '#666', marginBottom: 8 },
});
