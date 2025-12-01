import API from '../api'; 

export async function requestLoan(payload) {
  // payload shape:
  // { fk_id_Profesor_solicitante, fk_id_Profesor_beneficiario, fk_id_equipo, fecha_devolucion }
  const res = await API.post('/loans/request', payload);
  return res.data;
}

export async function returnLoanByScan({ returnedById, scannedPayload }) {
  const payload = {
    returned_by: returnedById,
    scanned: scannedPayload
  };
  const res = await API.post('/loans/return', payload);
  return res.data;
}
