// frontend/src/components/EquipmentList.jsx
import React, { useEffect, useState } from 'react';
import API from '../../api';
import LoanModal from './LoanModal'; // ajusta la ruta si tu LoanModal está en otra carpeta
import ExportPdfButton from '../Reportes/ExportPdfButton';

export default function EquipmentList({ currentUserId, currentUserRut, onLoanSuccess }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    API.get('/equipos')
      .then(res => { if (!mounted) return; setItems(res.data ?? []); })
      .catch(err => { console.error(err); setItems([]); })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [refreshKey]);

  const openLoan = (equipo) => {
    console.log('openLoan currentUserId=', currentUserId, 'currentUserRut=', currentUserRut);
    setSelectedEquipo(equipo);
    setModalOpen(true);
  };
  const handleModalClose = () => { setModalOpen(false); setSelectedEquipo(null); };

  const handleLoanSuccess = (result) => {
    setRefreshKey(k => k + 1);
    if (typeof onLoanSuccess === 'function') onLoanSuccess(result);
    handleModalClose();
  };

  const columns = [
    { header: 'ID', key: 'id_equipo' },
    { header: 'QR', key: 'Codigo_qr' },
    { header: 'Tipo', key: 'Tipo_equipo' },
    { header: 'Descripción', key: 'Descripcion' },
    { header: 'Estado', key: 'Estado' },
  ];

  return (
    <div>
      <h3>Inventario de Equipos</h3>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <ExportPdfButton columns={columns} data={items} title="Inventario_de_Equipos" />
        <small style={{ color: '#666' }}>Exportar inventario a PDF</small>
      </div>

      {loading ? <div>Cargando equipos...</div> : (
        <table className="simple-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              {columns.map(c => <th key={c.key}>{c.header}</th>)}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={columns.length + 1}>No hay equipos.</td></tr>
            ) : items.map(eq => (
              <tr key={eq.id_equipo}>
                <td>{eq.id_equipo}</td>
                <td>{eq.Codigo_qr}</td>
                <td>{eq.Tipo_equipo}</td>
                <td>{eq.Descripcion}</td>
                <td>{eq.Estado}</td>
                <td>
                  {eq.Estado && eq.Estado.toLowerCase() === 'disponible' ? (
                    <button onClick={() => openLoan(eq)}>Solicitar préstamo</button>
                  ) : (
                    <button disabled style={{ opacity: 0.6 }}>No disponible</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && selectedEquipo && (
        <LoanModal
          equipo={selectedEquipo}
          onClose={handleModalClose}
          onSuccess={handleLoanSuccess}
          currentUserId={currentUserId}
          currentUserRut={currentUserRut}
        />
      )}
    </div>
  );
}
