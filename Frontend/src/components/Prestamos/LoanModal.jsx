// src/components/LoanModal.jsx
import React, { useState, useEffect } from 'react';
import API from '../../api'; // ajusta si tu path es distinto

export default function LoanModal({ equipo, onClose, onSuccess, currentUserId }) {
  const [beneficiarioId, setBeneficiarioId] = useState(currentUserId || '');
  const [fechaDevolucion, setFechaDevolucion] = useState('');
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    API.get('/profesores')
      .then(res => {
        if (!mounted) return;
        setProfesores(res.data || []);
      })
      .catch(console.error);
    return () => mounted = false;
  }, []);

  const handleSubmit = async () => {
    if (!beneficiarioId) return alert('Selecciona un beneficiario');
    if (!confirm(`Confirmar préstamo del equipo ${equipo.Tipo_equipo} (ID ${equipo.id_equipo}) a ID ${beneficiarioId}?`)) return;

    setLoading(true);
    try {
      const payload = {
        fk_id_Profesor_solicitante: currentUserId,
        fk_id_Profesor_beneficiario: Number(beneficiarioId),
        fk_id_equipo: Number(equipo.id_equipo),
        fecha_devolucion: fechaDevolucion || null
      };
      const res = await API.post('/loans/request', payload);
      if (res.data?.ok) {
        alert('Préstamo creado: ' + res.data.id_Prestamo);
        if (onSuccess) onSuccess(res.data);
      } else {
        alert('Error: ' + (res.data?.message || 'Error desconocido'));
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error en la solicitud');
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:480, background:'#fff', borderRadius:8, padding:16 }}>
        <h3>Solicitar préstamo — Equipo {equipo.Tipo_equipo} (ID {equipo.id_equipo})</h3>

        <label>Beneficiario (Profesor)</label>
        <select value={beneficiarioId} onChange={e=>setBeneficiarioId(e.target.value)}>
          <option value="">-- Seleccionar --</option>
          {profesores.map(p => <option key={p.id_Profesor} value={p.id_Profesor}>{p.Nombre} ({p.Email_institucional})</option>)}
        </select>

        <label>Fecha devolución (opcional)</label>
        <input type="date" value={fechaDevolucion} onChange={e=>setFechaDevolucion(e.target.value)} />

        <div style={{ display:'flex', gap:8, marginTop:12, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ background:'#ccc', color:'#000' }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={loading}>{loading ? 'Enviando...' : 'Confirmar préstamo'}</button>
        </div>
      </div>
    </div>
  );
}
