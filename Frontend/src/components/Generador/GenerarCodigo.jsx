import { useState } from "react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { jsPDF } from "jspdf";

export default function GenerarCodigo() {
    const [texto, setTexto] = useState("");
    const [tipo, setTipo] = useState("qr");
    const [imagen, setImagen] = useState(null);

    const generar = async () => {
        if (!texto) return alert("Escribe un texto primero.");

        if (tipo === "qr") {
            const dataURL = await QRCode.toDataURL(texto, { width: 300 });
            setImagen(dataURL);
        } else {
            try {
                const canvas = document.createElement("canvas");
                JsBarcode(canvas, texto, { format: "CODE128", width: 2, height: 60 });
                const dataURL = canvas.toDataURL("image/png");
                setImagen(dataURL);
            } catch (err) {
                alert("Error generando código de barras: " + err.message);
            }
        }
    };

    const guardarEnDB = async () => {
        if (!texto) return alert("Escribe un texto primero.");

        const payload = {
            id_equipo: Number(texto),   // Puedes cambiar esto si quieres otro ID
            Codigo_qr: Number(texto),   // El QR o código de barra será el ID
            Tipo_equipo: tipo === "qr" ? "QR" : "Barcode",
            Descripcion: "Equipo generado desde GenerarCodigo.jsx",
            Estado: "Disponible"
        };

        try {
            const resp = await fetch("http://localhost:5000/api/equipos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await resp.json();

            if (resp.ok) {
                alert("Equipo guardado correctamente en la base de datos");
            } else {
                alert("Error: " + data.error);
            }
        } catch (err) {
            alert("Error de conexión con el servidor");
        }
    };

    const descargarPDF = () => {
        if (!imagen) return alert("Primero genera el código");

        const pdf = new jsPDF();
        pdf.text("Código generado:", 10, 10);
        pdf.addImage(imagen, "PNG", 10, 20, 150, 80);
        pdf.save("codigo_generado.pdf");
    };

    return (
        <div style={{ padding: "20px", color: "white" }}>
            <h2>Generar Código (QR o Código de Barras)</h2>

            <div style={{ marginBottom: "10px" }}>
                <label>Texto a codificar: </label>
                <input 
                    type="text" 
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    style={{ padding: "5px", width: "250px" }}
                />
            </div>

            <div style={{ marginBottom: "10px" }}>
                <label>Tipo de código: </label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                    <option value="qr">Código QR</option>
                    <option value="barcode">Código de Barras</option>
                </select>
            </div>

            <button onClick={generar} style={{ marginRight: "10px" }}>
                Generar
            </button>

            {/* Solo mostrar si ya generaste la imagen */}
            {imagen && (
                <>
                    <div style={{ marginTop: "20px" }}>
                        <img src={imagen} alt="Código generado" />
                    </div>

                    <button 
                        onClick={descargarPDF} 
                        style={{ marginTop: "10px", marginRight: "10px" }}
                    >
                        Descargar PDF
                    </button>

                    <button 
                        onClick={guardarEnDB} 
                        style={{ marginTop: "10px", background: "#2596be", color: "white" }}
                    >
                        Guardar en Base de Datos
                    </button>
                </>
            )}
        </div>
    );

}
