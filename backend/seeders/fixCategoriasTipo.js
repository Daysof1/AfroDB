/**
 * ============================================
 * SCRIPT DE CORRECCIÓN - ASIGNAR TIPO A CATEGORÍAS
 * ============================================
 * Asigna el tipo correcto a las categorías existentes basándose en:
 * - Si tiene productos → tipo: 'producto'
 * - Si tiene servicios → tipo: 'servicio'
 * 
 * Ejecutar: node backend/seeders/fixCategoriasTipo.js
 */

const Sequelize = require('sequelize');
const { sequelize } = require('../config/database');
const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');
const Servicio = require('../models/Servicio');

const fixCategoriasTipo = async () => {
  try {
    console.log('🔧 Iniciando corrección de tipos de categorías...\n');
    
    // Obtener todas las categorías
    const categorias = await Categoria.findAll();
    console.log(`📦 Total de categorías encontradas: ${categorias.length}`);
    
    let actualizadas = 0;
    
    for (const categoria of categorias) {
      // Contar productos en esta categoría
      const totalProductos = await Producto.count({
        where: { categoriaId: categoria.id }
      });
      
      // Contar servicios en esta categoría
      const totalServicios = await Servicio.count({
        where: { categoriaId: categoria.id }
      });
      
      let tipoAsignado = null;
      
      // Lógica: si tiene más productos, es tipo producto. Si tiene más servicios, es tipo servicio.
      if (totalProductos > totalServicios && totalProductos > 0) {
        tipoAsignado = 'producto';
      } else if (totalServicios > totalProductos && totalServicios > 0) {
        tipoAsignado = 'servicio';
      } else if (totalProductos > 0) {
        tipoAsignado = 'producto'; // Por defecto productos
      } else if (totalServicios > 0) {
        tipoAsignado = 'servicio';
      } else {
        tipoAsignado = 'producto'; // Si no tiene nada, asignar como producto
      }
      
      // Solo actualizar si el tipo cambió o es NULL
      if (categoria.tipo !== tipoAsignado) {
        await categoria.update({ tipo: tipoAsignado });
        actualizadas++;
        console.log(`✅ ${categoria.nombre}: tipo=${tipoAsignado} (prod:${totalProductos}, serv:${totalServicios})`);
      } else {
        console.log(`⏭️  ${categoria.nombre}: ya tiene tipo=${categoria.tipo}`);
      }
    }
    
    console.log(`\n✨ Corrección completada. ${actualizadas} categorías actualizadas.`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixCategoriasTipo();
