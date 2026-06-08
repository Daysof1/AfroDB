/**
 * Este archivo es el formulario para crear o edita un servicioenel panel del admin
 * modo crear: se llega desde el boton + crear servicioen admin/servicios
 * n se recibe ningun parametro de ruta
 * modo editar se llega al precionar un servicio en la lista
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
import { createService, updateService } from '../../src/services/adminService';
import apiClient from '../../src/api/apiClient';
/**
 * tipo de servicio
 * estrucura del orduto recibido como parametro cuando edita
 */

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

type Categoria = { id: number; nombre: string };
type Subcategoria = { id: number; nombre: string; categoriaId: number };

export default function AdminServicioForm() {
    /**
     * navegacion 
     * use router permite navegar programaticamente 
     */
    const router  = useRouter();
    /**
     * Parametros de ruta
     * el parametro del servicio es opcional solo existe en modo editar
     * expo router son strings 
     */
    const params = useLocalSearchParams<{ servicio?: string }>();

    /**
     * servicio recibido
     * si exise el parametro intenta pasearlo como un json
     * si fala el parse (JSON malinformado), lo deja como undefined (modo de creacion)
     */
    let servicio: Servicio |undefined;
    if (params.servicio) {
        try {
            servicio = JSON.parse(params.servicio) as Servicio;
        } catch {
            servicio = undefined;// fallo silencioso se trata como formulario vacio
        }
    }

    /**
     * modo formulario
     * editing = true  modo edicion (servicio recibido)
     * editing = false modo creacion 
     */
    const editing = !!servicio;

    /**
     * EStado local campos del formulario
     * los campos d inicializan con los valores del servicio si se esta editando 
     * o en cadena vacia si se esta creando
     * El operador ??  devuelve el lado derecho solo si el izquierdo es null /undefined
     */

    const [nombre, setNombre] = useState(servicio?.nombre ?? '');
    const [descripcion, setDescripcion] = useState(servicio?.descripcion ?? '');
    //precio y duracion se guardan como string para facilitar la entrada de TextInput
    const [precio, setPrecio] = useState(servicio?.precio?.toString() ?? '');
    const [duracion, setDuracion] = useState(servicio?.duracion?.toString() ?? '');
    const [imagenUrl, setImagenUrl] = useState(servicio?.imagen ?? '');
    const [categoriaId, setCategoriaId] = useState(servicio?.categoriaId?.toString() ?? '');
    const [subcategoriaId, setSubcategoriaId] = useState(servicio?.subcategoriaId?.toString() ?? '');
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
        // validacion basica los campos obligatorios no pueden estar vacios 
      if (!nombre || !descripcion || !precio || !duracion || !categoriaId || !subcategoriaId) {
        Alert.alert('Error', 'Todos los campos son obligatorios, incluyendo duración, categoría y subcategoría');
            return;//detiene la ejecucion si hay la peticion http 
        }

        setLoading(true);// Desabilita el boton durante la peticion 
        try {
            // contruye el objeto de datos convirtendolod precio y duracion a numerico
            const data = {
                nombre,
                descripcion,
                precio: parseFloat(precio),
                duracion: parseInt(duracion, 10),
                imagenUrl,
              categoriaId: parseInt(categoriaId, 10),
              subcategoriaId: parseInt(subcategoriaId, 10),
            };

            if (editing && servicio) {
                // modo edicion llama a updateService con el id del servicio
                await updateService(servicio.id || servicio.id, data);
                Alert.alert('Exitoso', 'Servicio actualizado');
            } else {
                // cuando el formulario esta vacio se comporta como creación
                await createService(data);
                Alert.alert('Exito', 'Servicio creado');
            }
            router.back();// regresa a admin/servicios despues de guardar
        } catch {
            //si la peticion falla muesra el eror a usuario
            Alert.alert('Error', 'No se pudo guardar el servicio');
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

      {/* ── CAMPO: Duración ─────────────────────────────────────────────── */}
      <Text style={styles.label}>Duración (minutos)</Text>
      <TextInput
        style={styles.input}
        value={duracion}
        onChangeText={setDuracion}
        keyboardType="numeric"
        placeholder="Duración en minutos"
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
  input: { borderWidth: 1, borderColor: '#d6c5b4', borderRadius: 5, padding: 8, marginTop: 5, marginBottom: 10, backgroundColor: '#fff' },
  helper: { fontSize: 12, color: '#666', marginBottom: 8 },
  button: { marginTop: 20, backgroundColor: '#a56363', borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
