import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';

function ScannerQR({ addScannedItem }) {
  const [scanResult, setScanResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const elementId = 'reader';
    const scanner = new Html5QrcodeScanner(elementId, {
      qrbox: {
        width: 300,
        height: 300,
      },
      fps: 10,
      disableFlip: true,
      aspectRatio: 1.0,
      videoConstraints: {
        facingMode: "environment"
      }
    });

    const success = (result) => {
      scanner.clear();
      setScanResult(result);
      addScannedItem({ codigo: result, hora: new Date().toLocaleTimeString() });
      navigate('/'); 
    };

    const error = (err) => {
      console.warn(err);
    };

    scanner.render(success, error);

    return () => {
      scanner.clear().catch(error => {
        console.error("Fallo al detener el escáner al desmontar:", error);
      });
    };
  }, [addScannedItem, navigate]);

  return (
    <div className="CodeQR" style={{ textAlign: 'center', margin: '20px' }}>
      <h1>Scaneo de QR</h1>
      {
        scanResult
          ? (
            <div>
              <h2>¡Escaneo Exitoso!</h2>
              <p>Código detectado: <strong>{scanResult}</strong></p>
              <a href={"http://" + scanResult} target="_blank" rel="noopener noreferrer">Ir a URL</a>
            </div>
          )
          : <div id="reader" style={{ width: '400px', margin: 'auto' }}></div>
      }
    </div>
  );
}

export default ScannerQR;
