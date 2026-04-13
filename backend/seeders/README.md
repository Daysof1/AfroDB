# 🌱 Seeders - Datos de Prueba

## 📋 Archivos

- `adminSeeder.js` - Crea usuario administrador por defecto
- `datosCompletos.seeder.js` - Ejecuta todos los seeders para datos completos de prueba

## 🚀 Cómo Usar

### Ejecutar Todos los Datos de Prueba
```bash
cd backend
node seeders/datosCompletos.seeder.js
```

### Solo Administrador
```bash
cd backend
node seeders/adminSeeder.js
```

## 📊 Datos Creados

### Usuarios de Prueba
| Email | Contraseña | Rol | Nombre |
|-------|------------|-----|--------|
| admin@afrodb.com | Admin123! | administrador | Administrador Sistema |
| maria.profesional@afrodb.com | Profe123! | profesional | María González |
| carlos.profesional@afrodb.com | Profe123! | profesional | Carlos Rodríguez |
| ana.profesional@afrodb.com | Profe123! | profesional | Ana López |
| juan.cliente@afrodb.com | Cliente123! | cliente | Juan Pérez |
| laura.cliente@afrodb.com | Cliente123! | cliente | Laura Martínez |
| sofia.auxiliar@afrodb.com | Auxiliar123! | auxiliar | Sofia Ramírez |

### Contenido Completo
- ✅ 1 Administrador
- ✅ 5 Categorías
- ✅ 10 Subcategorías
- ✅ 8 Especialidades
- ✅ 6 Usuarios de prueba
- ✅ 6 Productos
- ✅ 5 Servicios
- ✅ Asignaciones profesional-especialidad

## ⚠️ Notas

- Los seeders son idempotentes (puedes ejecutarlos múltiples veces)
- Las contraseñas se encriptan automáticamente
- Desactivan temporalmente las restricciones FK durante la ejecución