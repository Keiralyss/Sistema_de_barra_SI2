import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect,useState } from "react";

function ScannerQR(){
    const [scanResult, setScanResult]= useState(null);

    useEffect(() =>{
            const scanner = new Html5QrcodeScanner('reader',{
        qrbox:{
            with: 250,
            height: 250,
        },
        fps: 5
    })

    scanner.render(success, error);

    function success(result){
        scanner.clear();
        setScanResult(result);
    }

    function error(err){
        console.warn(err);
    }
    }, []);



    return(
        <div className="CodeQR">
            <h1>Scaneo de QR</h1>
            {
                scanResult
                ? <div>Success: <a href={"http://"+ scanResult}>{scanResult}</a></div>
                : <div id="reader"></div>
            }
        </div>
    );
}

export default ScannerQR;