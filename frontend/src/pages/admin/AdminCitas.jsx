import { useState } from 'react';
import '../Admin.css';

export default function AdminCitas() {
  const [citas, setCitas] = useState([
    { id: 1, cliente: 'María González', profesional: 'Dr. Juan', servicio: 'Consulta Capilar', fecha: '2026-04-15', estado: 'Confirmada' },
    { id: 2, cliente: 'Ana Pérez', profesional: 'Dra. Sofia', servicio: 'Tratamiento Facial', fecha: '2026-04-16', estado: 'Pendiente' },
  ]);

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Gestión de Citas</h1>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Profesional</th>
              <th>Servicio</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {citas.map(cita => (
              <tr key={cita.id}>
                <td>{cita.cliente}</td>
                <td>{cita.profesional}</td>
                <td>{cita.servicio}</td>
                <td>{cita.fecha}</td>
                <td>
                  <span className={`badge ${cita.estado === 'Confirmada' ? 'badge-success' : 'badge-warning'}`}>
                    {cita.estado}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm btn-secondary">👁️ Ver</button>
                  <button className="btn btn-sm btn-danger">❌ Cancelar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
