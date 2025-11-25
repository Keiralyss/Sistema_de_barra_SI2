import React, { useState } from 'react';
import { useBarcodeScanner } from './useBarcodeScanner.js';
import { useNavigate } from 'react-router-dom';

function ScannerPage({ addScannedItem }) {
  const [scannedCode, setScannedCode] = useState("Esperando...");
  const navigate = useNavigate();

  useBarcodeScanner({
    onScan: (code) => {
      console.log("Escaneado:", code);
      setScannedCode(code);
      addScannedItem({ codigo: code, hora: new Date().toLocaleTimeString() });
      navigate('/');  
    }
  });

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Página de Escaneo</h1>
      <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'gray' }}>
        Producto detectado: {scannedCode}
      </p>
      <p style={{ fontSize: '12px', color: 'gray' }}>
        (Usa la pistola USB o escribe rápido y presiona Enter)
      </p>
    </div>
  );
}

export default ScannerPage;
