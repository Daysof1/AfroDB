/**
 * ============================================
 * UTILIDADES DE EXPORTACIÓN
 * ============================================
 * Funciones para exportar datos a PDF y Excel
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

/**
 * Configurar fuente para español en jsPDF
 */
const configurarPDF = (doc, titulo) => {
  // Logo o encabezado
  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text(titulo, 14, 20);
  
  // Información adicional
  doc.setFontSize(10);
  doc.setTextColor(100);
  const fecha = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Generado: ${fecha}`, 14, 28);
  
  return 35; // Posición Y donde comenzar la tabla
};

/**
 * Exportar categorías a PDF
 */
export const exportarCategoriasAPDF = (categorias) => {
  const doc = new jsPDF();
  const startY = configurarPDF(doc, 'REPORTE DE CATEGORÍAS');
  
  const tableData = categorias.map(cat => [
    cat.id,
    cat.nombre,
    cat.descripcion || '-',
    cat.activo ? 'Activo' : 'Inactivo',
    new Date(cat.createdAt).toLocaleDateString('es-CO')
  ]);
  
  autoTable(doc, {
    startY,
    head: [['ID', 'Nombre', 'Descripción', 'Estado', 'Fecha Creación']],
    body: tableData,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 10 }
  });
  
  // Agregar totales
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setTextColor(40);
  doc.text(`Total de categorías: ${categorias.length}`, 14, finalY);
  doc.text(`Activas: ${categorias.filter(c => c.activo).length}`, 14, finalY + 7);
  doc.text(`Inactivas: ${categorias.filter(c => !c.activo).length}`, 14, finalY + 14);
  
  doc.save(`categorias_${Date.now()}.pdf`);
};

/**
 * Exportar subcategorías a PDF
 */
export const exportarSubcategoriasAPDF = (subcategorias, categorias) => {
  const doc = new jsPDF();
  const startY = configurarPDF(doc, 'REPORTE DE SUBCATEGORÍAS');
  
  const tableData = subcategorias.map(sub => {
    const categoria = categorias.find(c => c.id === sub.categoriaId);
    return [
      sub.id,
      sub.nombre,
      categoria?.nombre || '-',
      sub.descripcion || '-',
      sub.activo ? 'Activo' : 'Inactivo'
    ];
  });
  
  autoTable(doc, {
    startY,
    head: [['ID', 'Nombre', 'Categoría', 'Descripción', 'Estado']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 10 }
  });
  
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.text(`Total de subcategorías: ${subcategorias.length}`, 14, finalY);
  doc.text(`Activas: ${subcategorias.filter(s => s.activo).length}`, 14, finalY + 7);
  
  doc.save(`subcategorias_${Date.now()}.pdf`);
};

/**
 * Exportar productos a PDF
 */
export const exportarProductosAPDF = (productos) => {
  const doc = new jsPDF('landscape'); // Modo horizontal para más columnas
  const startY = configurarPDF(doc, 'REPORTE DE PRODUCTOS');
  
  const tableData = productos.map(prod => [
    prod.id,
    prod.nombre,
    prod.categoria?.nombre || '-',
    prod.subcategoria?.nombre || '-',
    `$${Number(prod.precio).toLocaleString('es-CO')}`,
    prod.stock,
    prod.activo ? 'Activo' : 'Inactivo'
  ]);
  
  autoTable(doc, {
    startY,
    head: [['ID', 'Nombre', 'Categoría', 'Subcategoría', 'Precio', 'Stock', 'Estado']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [46, 204, 113], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 10 }
  });
  
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  const valorTotal = productos.reduce((sum, p) => sum + (Number(p.precio) * p.stock), 0);
  doc.text(`Total de productos: ${productos.length}`, 14, finalY);
  doc.text(`Stock total: ${productos.reduce((sum, p) => sum + p.stock, 0)} unidades`, 14, finalY + 7);
  doc.text(`Valor inventario: $${valorTotal.toLocaleString('es-CO')}`, 14, finalY + 14);
  
  doc.save(`productos_${Date.now()}.pdf`);
};

/**
 * Exportar usuarios a PDF
 */
export const exportarUsuariosAPDF = (usuarios) => {
  const doc = new jsPDF();
  const startY = configurarPDF(doc, 'REPORTE DE USUARIOS');
  
  const tableData = usuarios.map(usr => [
    usr.id,
    usr.nombre,
    usr.email,
    usr.rol,
    usr.telefono || '-',
    usr.activo ? 'Activo' : 'Inactivo'
  ]);
  
  autoTable(doc, {
    startY,
    head: [['ID', 'Nombre', 'Email', 'Rol', 'Teléfono', 'Estado']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [241, 196, 15], textColor: 40, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 10 }
  });
  
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.text(`Total de usuarios: ${usuarios.length}`, 14, finalY);
  doc.text(`Administradores: ${usuarios.filter(u => u.rol === 'administrador').length}`, 14, finalY + 7);
  doc.text(`Auxiliares: ${usuarios.filter(u => u.rol === 'auxiliar').length}`, 14, finalY + 14);
  doc.text(`Clientes: ${usuarios.filter(u => u.rol === 'cliente').length}`, 14, finalY + 21);
  
  doc.save(`usuarios_${Date.now()}.pdf`);
};

/**
 * Exportar pedidos a PDF
 */
export const exportarPedidosAPDF = (pedidos) => {
  const doc = new jsPDF('landscape');
  const startY = configurarPDF(doc, 'REPORTE DE PEDIDOS');
  
  const tableData = pedidos.map(ped => [
    `#${ped.id}`,
    ped.Usuario?.nombre || '-',
    ped.Usuario?.email || '-',
    `$${Number(ped.total).toLocaleString('es-CO')}`,
    ped.estado,
    new Date(ped.createdAt).toLocaleDateString('es-CO'),
    ped.telefono
  ]);
  
  autoTable(doc, {
    startY,
    head: [['ID', 'Cliente', 'Email', 'Total', 'Estado', 'Fecha', 'Teléfono']],
    body: tableData,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [155, 89, 182], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 10 }
  });
  
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  const totalVentas = pedidos.reduce((sum, p) => sum + Number(p.total), 0);
  doc.text(`Total de pedidos: ${pedidos.length}`, 14, finalY);
  doc.text(`Pendientes: ${pedidos.filter(p => p.estado === 'pendiente').length}`, 14, finalY + 7);
  doc.text(`Entregados: ${pedidos.filter(p => p.estado === 'entregado').length}`, 14, finalY + 14);
  doc.text(`Ventas totales: $${totalVentas.toLocaleString('es-CO')}`, 14, finalY + 21);
  
  doc.save(`pedidos_${Date.now()}.pdf`);
};

/**
 * Exportar categorías a Excel
 */
export const exportarCategoriasAExcel = async (categorias) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Categorías');
  
  const fecha = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Título
  worksheet.mergeCells('A1:E1');
  const tituloCell = worksheet.getCell('A1');
  tituloCell.value = 'REPORTE DE CATEGORÍAS';
  tituloCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  tituloCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2980B9' }
  };
  tituloCell.alignment = { vertical: 'middle', horizontal: 'center' };
  tituloCell.border = {
    top: { style: 'thick' },
    bottom: { style: 'thick' },
    left: { style: 'thick' },
    right: { style: 'thick' }
  };
  worksheet.getRow(1).height = 30;
  
  // Fecha
  worksheet.mergeCells('A2:E2');
  const fechaCell = worksheet.getCell('A2');
  fechaCell.value = `Generado: ${fecha}`;
  fechaCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF555555' } };
  fechaCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFECF0F1' }
  };
  fechaCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;
  
  // Encabezados
  const encabezados = ['ID', 'Nombre', 'Descripción', 'Estado', 'Fecha Creación'];
  const headerRow = worksheet.getRow(4);
  headerRow.values = encabezados;
  headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3498DB' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Datos
  let rowIndex = 5;
  categorias.forEach(cat => {
    const row = worksheet.getRow(rowIndex);
    row.values = [
      cat.id,
      cat.nombre,
      cat.descripcion || '',
      cat.activo ? '✓ Activo' : '✗ Inactivo',
      new Date(cat.createdAt).toLocaleDateString('es-CO')
    ];
    row.alignment = { vertical: 'middle' };
    row.eachCell((cell, colNumber) => {
      if (colNumber === 4) {
        cell.font = { bold: true, color: { argb: cat.activo ? 'FF27AE60' : 'FFE74C3C' } };
      }
    });
    rowIndex++;
  });
  
  // Resumen
  rowIndex++;
  const resumenRow = worksheet.getRow(rowIndex);
  resumenRow.getCell(1).value = '📊 RESUMEN';
  resumenRow.getCell(1).font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  resumenRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF27AE60' }
  };
  resumenRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
  resumenRow.height = 25;
  
  rowIndex++;
  worksheet.getRow(rowIndex).values = ['Total de categorías:', categorias.length];
  worksheet.getRow(rowIndex).font = { bold: true };
  
  rowIndex++;
  worksheet.getRow(rowIndex).values = ['✓ Activas:', categorias.filter(c => c.activo).length];
  worksheet.getRow(rowIndex).getCell(1).font = { color: { argb: 'FF27AE60' } };
  
  rowIndex++;
  worksheet.getRow(rowIndex).values = ['✗ Inactivas:', categorias.filter(c => !c.activo).length];
  worksheet.getRow(rowIndex).getCell(1).font = { color: { argb: 'FFE74C3C' } };
  
  // Anchos de columna
  worksheet.columns = [
    { width: 8 },
    { width: 30 },
    { width: 50 },
    { width: 15 },
    { width: 18 }
  ];
  
  // Descargar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `categorias_${Date.now()}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Exportar subcategorías a Excel
 */
export const exportarSubcategoriasAExcel = async (subcategorias, categorias) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Subcategorías');
  
  const fecha = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Título
  worksheet.mergeCells('A1:F1');
  const tituloCell = worksheet.getCell('A1');
  tituloCell.value = 'REPORTE DE SUBCATEGORÍAS';
  tituloCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  tituloCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3498DB' }
  };
  tituloCell.alignment = { vertical: 'middle', horizontal: 'center' };
  tituloCell.border = {
    top: { style: 'thick' },
    bottom: { style: 'thick' },
    left: { style: 'thick' },
    right: { style: 'thick' }
  };
  worksheet.getRow(1).height = 30;
  
  // Fecha
  worksheet.mergeCells('A2:F2');
  const fechaCell = worksheet.getCell('A2');
  fechaCell.value = `Generado: ${fecha}`;
  fechaCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF555555' } };
  fechaCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFECF0F1' }
  };
  fechaCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;
  
  // Encabezados
  const encabezados = ['ID', 'Nombre', 'Categoría', 'Descripción', 'Estado', 'Fecha Creación'];
  const headerRow = worksheet.getRow(4);
  headerRow.values = encabezados;
  headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3498DB' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Datos
  let rowIndex = 5;
  subcategorias.forEach(sub => {
    const categoria = categorias.find(c => c.id === sub.categoriaId);
    const row = worksheet.getRow(rowIndex);
    row.values = [
      sub.id,
      sub.nombre,
      categoria?.nombre || '',
      sub.descripcion || '',
      sub.activo ? '✓ Activo' : '✗ Inactivo',
      new Date(sub.createdAt).toLocaleDateString('es-CO')
    ];
    row.alignment = { vertical: 'middle' };
    row.eachCell((cell, colNumber) => {
      if (colNumber === 5) {
        cell.font = { bold: true, color: { argb: sub.activo ? 'FF27AE60' : 'FFE74C3C' } };
      }
    });
    rowIndex++;
  });
  
  // Resumen
  rowIndex++;
  const resumenRow = worksheet.getRow(rowIndex);
  resumenRow.getCell(1).value = '📊 RESUMEN';
  resumenRow.getCell(1).font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  resumenRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF27AE60' }
  };
  resumenRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
  resumenRow.height = 25;
  
  rowIndex++;
  worksheet.getRow(rowIndex).values = ['Total de subcategorías:', subcategorias.length];
  worksheet.getRow(rowIndex).font = { bold: true };
  
  rowIndex++;
  worksheet.getRow(rowIndex).values = ['✓ Activas:', subcategorias.filter(s => s.activo).length];
  worksheet.getRow(rowIndex).getCell(1).font = { color: { argb: 'FF27AE60' } };
  
  rowIndex++;
  worksheet.getRow(rowIndex).values = ['✗ Inactivas:', subcategorias.filter(s => !s.activo).length];
  worksheet.getRow(rowIndex).getCell(1).font = { color: { argb: 'FFE74C3C' } };
  
  // Anchos de columna
  worksheet.columns = [
    { width: 8 },
    { width: 30 },
    { width: 25 },
    { width: 45 },
    { width: 15 },
    { width: 18 }
  ];
  
  // Descargar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `subcategorias_${Date.now()}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Exportar productos a Excel
 */
export const exportarProductosAExcel = async (productos) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Productos');
  
  const fecha = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Título
  worksheet.mergeCells('A1:H1');
  const tituloCell = worksheet.getCell('A1');
  tituloCell.value = 'REPORTE DE PRODUCTOS';
  tituloCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  tituloCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2ECC71' }
  };
  tituloCell.alignment = { vertical: 'middle', horizontal: 'center' };
  tituloCell.border = {
    top: { style: 'thick' },
    bottom: { style: 'thick' },
    left: { style: 'thick' },
    right: { style: 'thick' }
  };
  worksheet.getRow(1).height = 30;
  
  // Fecha
  worksheet.mergeCells('A2:H2');
  const fechaCell = worksheet.getCell('A2');
  fechaCell.value = `Generado: ${fecha}`;
  fechaCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF555555' } };
  fechaCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFECF0F1' }
  };
  fechaCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;
  
  // Encabezados
  const encabezados = ['ID', 'Nombre', 'Categoría', 'Subcategoría', 'Precio', 'Stock', 'Valor Inventario', 'Estado'];
  const headerRow = worksheet.getRow(4);
  headerRow.values = encabezados;
  headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2ECC71' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Datos
  let rowIndex = 5;
  let valorTotalInventario = 0;
  let stockTotal = 0;
  
  productos.forEach(prod => {
    const valorInv = Number(prod.precio) * prod.stock;
    valorTotalInventario += valorInv;
    stockTotal += prod.stock;
    
    const row = worksheet.getRow(rowIndex);
    row.values = [
      prod.id,
      prod.nombre,
      prod.categoria?.nombre || '',
      prod.subcategoria?.nombre || '',
      Number(prod.precio),
      prod.stock,
      valorInv,
      prod.activo ? '✓ Activo' : '✗ Inactivo'
    ];
    row.alignment = { vertical: 'middle' };
    row.eachCell((cell, colNumber) => {
      if (colNumber === 5 || colNumber === 7) {
        cell.numFmt = '$#,##0';
      }
      if (colNumber === 8) {
        cell.font = { bold: true, color: { argb: prod.activo ? 'FF27AE60' : 'FFE74C3C' } };
      }
    });
    rowIndex++;
  });
  
  // Resumen
  rowIndex++;
  const resumenRow = worksheet.getRow(rowIndex);
  resumenRow.getCell(1).value = '📊 RESUMEN';
  resumenRow.getCell(1).font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  resumenRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF27AE60' }
  };
  resumenRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
  resumenRow.height = 25;
  
  rowIndex++;
  worksheet.getRow(rowIndex).values = ['Total de productos:', productos.length];
  worksheet.getRow(rowIndex).font = { bold: true };
  
  rowIndex++;
  worksheet.getRow(rowIndex).values = ['📦 Stock total:', stockTotal + ' unidades'];
  worksheet.getRow(rowIndex).font = { bold: true };
  
  rowIndex++;
  const valorRow = worksheet.getRow(rowIndex);
  valorRow.values = ['💵 Valor total inventario:', valorTotalInventario];
  valorRow.font = { bold: true };
  valorRow.getCell(2).numFmt = '$#,##0';
  
  rowIndex++;
  worksheet.getRow(rowIndex).values = ['✓ Activos:', productos.filter(p => p.activo).length];
  worksheet.getRow(rowIndex).getCell(1).font = { color: { argb: 'FF27AE60' } };
  
  // Anchos de columna
  worksheet.columns = [
    { width: 8 },
    { width: 35 },
    { width: 18 },
    { width: 18 },
    { width: 15 },
    { width: 10 },
    { width: 18 },
    { width: 15 }
  ];
  
  // Descargar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `productos_${Date.now()}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Exportar usuarios a Excel
 */
export const exportarUsuariosAExcel = async (usuarios) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Usuarios');
  
  const fecha = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Título
  worksheet.mergeCells('A1:G1');
  const tituloCell = worksheet.getCell('A1');
  tituloCell.value = 'REPORTE DE USUARIOS';
  tituloCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF000000' } };
  tituloCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1C40F' }
  };
  tituloCell.alignment = { vertical: 'middle', horizontal: 'center' };
  tituloCell.border = {
    top: { style: 'thick' },
    bottom: { style: 'thick' },
    left: { style: 'thick' },
    right: { style: 'thick' }
  };
  worksheet.getRow(1).height = 30;
  
  // Fecha
  worksheet.mergeCells('A2:G2');
  const fechaCell = worksheet.getCell('A2');
  fechaCell.value = `Generado: ${fecha}`;
  fechaCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF555555' } };
  fechaCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFECF0F1' }
  };
  fechaCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;
  
  // Encabezados
  const encabezados = ['ID', 'Nombre', 'Email', 'Rol', 'Teléfono', 'Estado', 'Fecha Registro'];
  const headerRow = worksheet.getRow(4);
  headerRow.values = encabezados;
  headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF000000' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1C40F' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Datos
  let rowIndex = 5;
  usuarios.forEach(usr => {
    const row = worksheet.getRow(rowIndex);
    row.values = [
      usr.id,
      usr.nombre,
      usr.email,
      usr.rol,
      usr.telefono || '',
      usr.activo ? '✓ Activo' : '✗ Inactivo',
      new Date(usr.createdAt).toLocaleDateString('es-CO')
    ];
    row.alignment = { vertical: 'middle' };
    row.eachCell((cell, colNumber) => {
      if (colNumber === 6) {
        cell.font = { bold: true, color: { argb: usr.activo ? 'FF27AE60' : 'FFE74C3C' } };
      }
    });
    rowIndex++;
  });
  
  // Resumen
  rowIndex++;
  const resumenRow = worksheet.getRow(rowIndex);
  resumenRow.getCell(1).value = '📊 RESUMEN';
  resumenRow.getCell(1).font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  resumenRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF27AE60' }
  };
  resumenRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
  resumenRow.height = 25;
  
  rowIndex++;
  worksheet.getRow(rowIndex).values = ['Total de usuarios:', usuarios.length];
  worksheet.getRow(rowIndex).font = { bold: true };
  
  rowIndex++;
  worksheet.getRow(rowIndex).values = ['👑 Administradores:', usuarios.filter(u => u.rol === 'administrador').length];
  worksheet.getRow(rowIndex).font = { bold: true };
  
  rowIndex++;
  worksheet.getRow(rowIndex).values = ['💼 Auxiliares:', usuarios.filter(u => u.rol === 'auxiliar').length];
  worksheet.getRow(rowIndex).font = { bold: true };
  
  rowIndex++;
  worksheet.getRow(rowIndex).values = ['👥 Clientes:', usuarios.filter(u => u.rol === 'cliente').length];
  worksheet.getRow(rowIndex).font = { bold: true };
  
  rowIndex++;
  worksheet.getRow(rowIndex).values = ['✓ Activos:', usuarios.filter(u => u.activo).length];
  worksheet.getRow(rowIndex).getCell(1).font = { color: { argb: 'FF27AE60' } };
  
  // Anchos de columna
  worksheet.columns = [
    { width: 8 },
    { width: 30 },
    { width: 35 },
    { width: 18 },
    { width: 18 },
    { width: 15 },
    { width: 18 }
  ];
  
  // Descargar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `usuarios_${Date.now()}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Exportar pedidos a Excel
 */
export const exportarPedidosAExcel = async (pedidos) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Pedidos');
  
  const fecha = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Título
  worksheet.mergeCells('A1:G1');
  const tituloCell = worksheet.getCell('A1');
  tituloCell.value = 'REPORTE DE PEDIDOS';
  tituloCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  tituloCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF9B59B6' }
  };
  tituloCell.alignment = { vertical: 'middle', horizontal: 'center' };
  tituloCell.border = {
    top: { style: 'thick' },
    bottom: { style: 'thick' },
    left: { style: 'thick' },
    right: { style: 'thick' }
  };
  worksheet.getRow(1).height = 30;
  
  // Fecha
  worksheet.mergeCells('A2:G2');
  const fechaCell = worksheet.getCell('A2');
  fechaCell.value = `Generado: ${fecha}`;
  fechaCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF555555' } };
  fechaCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFECF0F1' }
  };
  fechaCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;
  
  // Encabezados
  const encabezados = ['ID', 'Cliente', 'Email', 'Teléfono', 'Total', 'Estado', 'Fecha Pedido'];
  const headerRow = worksheet.getRow(4);
  headerRow.values = encabezados;
  headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF9B59B6' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Datos
  let rowIndex = 5;
  let totalVentas = 0;
  
  pedidos.forEach(ped => {
    totalVentas += Number(ped.total);
    const row = worksheet.getRow(rowIndex);
    row.values = [
      ped.id,
      ped.Usuario?.nombre || '',
      ped.Usuario?.email || '',
      ped.telefono,
      Number(ped.total),
      ped.estado,
      new Date(ped.createdAt).toLocaleDateString('es-CO')
    ];
    row.alignment = { vertical: 'middle' };
    row.eachCell((cell, colNumber) => {
      if (colNumber === 5) {
        cell.numFmt = '$#,##0';
      }
    });
    rowIndex++;
  });
  
  // Resumen
  rowIndex++;
  const resumenRow = worksheet.getRow(rowIndex);
  resumenRow.getCell(1).value = '📊 RESUMEN';
  resumenRow.getCell(1).font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  resumenRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF27AE60' }
  };
  resumenRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
  resumenRow.height = 25;
  
  rowIndex++;
  worksheet.getRow(rowIndex).values = ['Total de pedidos:', pedidos.length];
  worksheet.getRow(rowIndex).font = { bold: true };
  
  rowIndex++;
  worksheet.getRow(rowIndex).values = ['🕒 Pendientes:', pedidos.filter(p => p.estado === 'pendiente').length];
  worksheet.getRow(rowIndex).font = { bold: true };
  
  rowIndex++;
  worksheet.getRow(rowIndex).values = ['💳 Pagados:', pedidos.filter(p => p.estado === 'pagado').length];
  worksheet.getRow(rowIndex).font = { bold: true };
  
  rowIndex++;
  worksheet.getRow(rowIndex).values = ['🚚 Enviados:', pedidos.filter(p => p.estado === 'enviado').length];
  worksheet.getRow(rowIndex).font = { bold: true };
  
  rowIndex++;
  worksheet.getRow(rowIndex).values = ['✓ Entregados:', pedidos.filter(p => p.estado === 'entregado').length];
  worksheet.getRow(rowIndex).getCell(1).font = { color: { argb: 'FF27AE60' } };
  
  rowIndex++;
  worksheet.getRow(rowIndex).values = ['✗ Cancelados:', pedidos.filter(p => p.estado === 'cancelado').length];
  worksheet.getRow(rowIndex).getCell(1).font = { color: { argb: 'FFE74C3C' } };
  
  rowIndex++;
  const ventasRow = worksheet.getRow(rowIndex);
  ventasRow.values = ['💵 Ventas totales:', totalVentas];
  ventasRow.font = { bold: true };
  ventasRow.getCell(2).numFmt = '$#,##0';
  
  // Anchos de columna
  worksheet.columns = [
    { width: 8 },
    { width: 30 },
    { width: 35 },
    { width: 18 },
    { width: 15 },
    { width: 15 },
    { width: 18 }
  ];
  
  // Descargar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pedidos_${Date.now()}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};
