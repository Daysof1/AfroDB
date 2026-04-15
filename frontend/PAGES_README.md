# AfroDB - Páginas Frontend

Este documento describe la estructura de las páginas creadas para la aplicación AfroDB.

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Navbar.jsx      # Barra de navegación
│   ├── Navbar.css
│   ├── Sidebar.jsx     # Barra lateral de navegación
│   └── Sidebar.css
├── pages/              # Páginas por rol
│   ├── admin/          # Páginas de administrador
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminProductos.jsx
│   │   ├── AdminServicios.jsx
│   │   ├── AdminCategorias.jsx
│   │   └── AdminCitas.jsx
│   ├── cliente/        # Páginas de cliente
│   │   ├── ClienteCatalogo.jsx
│   │   ├── ClienteCarrito.jsx
│   │   ├── ClientePedidos.jsx
│   │   ├── ClienteProfesionales.jsx
│   │   ├── ClienteServicios.jsx
│   │   └── ClienteCitas.jsx
│   ├── profesional/    # Páginas de profesional
│   │   ├── ProfesionalDashboard.jsx
│   │   ├── ProfesionalCitas.jsx
│   │   ├── ProfesionalPerfil.jsx
│   │   └── ProfesionalEspecialidades.jsx
│   ├── Admin.css       # Estilos para páginas admin
│   ├── Cliente.css     # Estilos para páginas cliente
│   └── Profesional.css # Estilos para páginas profesional
├── App.jsx             # Componente principal con rutas
├── App.css             # Estilos generales
└── main.jsx            # Punto de entrada
```

## 🎯 Características

### Para Administradores
- **Dashboard**: Estadísticas generales y acceso rápido
- **Productos**: Crear, editar y eliminar productos
- **Servicios**: Gestionar servicios disponibles
- **Categorías**: Administrar categorías de productos
- **Citas**: Ver y gestionar citas de clientes

### Para Clientes
- **Catálogo**: Explorar productos con filtros de búsqueda
- **Carrito**: Agregar/eliminar productos y ver resumen de compra
- **Pedidos**: Ver historial de pedidos
- **Servicios**: Ver servicios disponibles
- **Profesionales**: Listar y ver perfiles de profesionales
- **Citas**: Agendar y gestionar citas

### Para Profesionales
- **Dashboard**: Estadísticas personales y próximas citas
- **Mis Citas**: Ver y actualizar estado de citas
- **Mi Perfil**: Editar información profesional
- **Especialidades**: Gestionar especialidades/servicios

## 🎨 Temas de Color

```css
--color-primary: #c8a27a      /* Marrón claro - primario */
--color-secondary: #e6d3b3    /* Beige - secundario */
--color-accent: #a57c63       /* Marrón oscuro - acentos */
--color-bg: #f9f6f2           /* Fondo crema */
--color-text: #3e2f25         /* Texto oscuro */
--color-white: #ffffff        /* Blanco */
```

## 🚀 Cómo Usar

### Instalación
```bash
npm install
npm install react-router-dom bootstrap
```

### Desarrollo
```bash
npm run start
```

### Seleccionar Rol
Al abrir la aplicación, verás una pantalla de login donde puedes seleccionar tu rol:
- 👨‍💼 Administrador
- 👤 Cliente
- 👨‍⚕️ Profesional

### Rutas Disponibles

#### Administrador
- `/admin/dashboard` - Panel principal
- `/admin/productos` - Gestión de productos
- `/admin/servicios` - Gestión de servicios
- `/admin/categorias` - Gestión de categorías
- `/admin/citas` - Gestión de citas

#### Cliente
- `/cliente/catalogo` - Catálogo de productos
- `/cliente/carrito` - Carrito de compras
- `/cliente/pedidos` - Mis pedidos
- `/cliente/servicios` - Servicios disponibles
- `/cliente/profesionales` - Listado de profesionales
- `/cliente/citas` - Mis citas

#### Profesional
- `/profesional/dashboard` - Panel principal
- `/profesional/citas` - Mis citas
- `/profesional/perfil` - Mi perfil
- `/profesional/especialidades` - Mis especialidades

## 📝 Notas Importantes

1. **Datos de Prueba**: Actualmente las páginas usan datos de prueba en el estado local. Necesitas conectarlas con la API del backend.

2. **Autenticación**: La selección de rol se guarda en `localStorage`. En producción, deberías usar tokens JWT del backend.

3. **Responsive**: Las páginas son responsive y se adaptan a dispositivos móviles.

4. **Componentes Compartidos**:
   - **Navbar**: Muestra diferentes menús según el rol
   - **Sidebar**: Navegación lateral con opciones específicas por rol

## 🔄 Próximos Pasos

1. Conectar con la API del backend
2. Implementar autenticación real con JWT
3. Agregar validaciones de formulario
4. Implementar carga de imágenes
5. Agregar notificaciones/toasts
6. Mejorar manejo de errores

## 📦 Dependencias

- `react` - ^19.2.4
- `react-dom` - ^19.2.4
- `react-router-dom` - Última versión
- `bootstrap` - Última versión (opcional, para componentes UI)

## 👨‍💻 Componentes Personalizados

### Navbar.jsx
- Componente de navegación superior
- Menús diferentes según el rol del usuario
- Botón de cierre de sesión

### Sidebar.jsx
- Barra lateral de navegación
- Colapsa en dispositivos móviles
- Enlaces contextuales por rol

## 🎓 Guía de Desarrollo

Para agregar una nueva página:

1. Crea el archivo en la carpeta correspondiente (`/pages/admin`, `/pages/cliente`, etc.)
2. Exporpla el componente como default export
3. Importa en `App.jsx`
4. Agrega la ruta en el componente `<Routes>`

Ejemplo:
```jsx
// pages/admin/AdminNuevaPagina.jsx
export default function AdminNuevaPagina() {
  return <div className="admin-page">{/* contenido */}</div>
}

// App.jsx
import AdminNuevaPagina from './pages/admin/AdminNuevaPagina'
// Agregar en Routes:
<Route path="/admin/nueva-pagina" element={<AdminNuevaPagina />} />
```

---

**Fecha de Creación**: 14 de Abril de 2026
**Versión**: 1.0
