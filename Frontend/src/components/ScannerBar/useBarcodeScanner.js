import { useEffect, useState } from "react";

export const useBarcodeScanner = ({ onScan }) => {
const [barcode, setBarcode] = useState("");

useEffect(() => {
    let buffer = "";
    let timeout = null;

    const handleKeyDown = (e) => {
    if (timeout) clearTimeout(timeout);
    
    if (e.key === "Enter") {
        if (buffer.length > 2) {
            onScan(buffer);
            setBarcode(buffer);
        }
        buffer = "";
    } else {
        if (e.key.length === 1) {
            buffer += e.key;
        }
    }

    timeout = setTimeout(() => {
        buffer = "";
    }, 100);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
    window.removeEventListener("keydown", handleKeyDown);
    if (timeout) clearTimeout(timeout);
    };
}, [onScan]);

return barcode;
};