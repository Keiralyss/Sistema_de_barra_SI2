import React, { useState, useEffect } from 'react';
import './Login.css';
import { validarInput, isRequired, minLength, noSpaces, isSafeInput, maxLength } from './validators';
import { FaUserTie, FaLock } from "react-icons/fa";

const loginAPI = async (usuario, password) => {
    const URL = 'http://localhost:5000/api/login'; 

    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Error en el login");
        }

        return data;

    } catch (error) {
        throw error;
    }
};


const Login = ({ onLoginSuccess }) => {
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [errorUsuario, setErrorUsuario] = useState(null);
    const [errorPassword, setErrorPassword] = useState(null);
    const [errorGeneral, setErrorGeneral] = useState('');
    
    const [recordarme, setRecordarme] = useState(false);

 
    const validarUsuario = () => {
        const error = validarInput(usuario, [isRequired, noSpaces, minLength(3), maxLength(60)]);
        setErrorUsuario(error);
        return error;
    };

    const validarPassword = () => {
        const error = validarInput(password, [isRequired]);
        setErrorPassword(error);
        return error;
    };

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuarioGuardado');
        if (usuarioGuardado){
            setUsuario(usuarioGuardado);
            setRecordarme(true);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorGeneral('');
        const errorEnUsuario = validarUsuario();
        const errorEnPassword = validarPassword();
        
        if (errorEnUsuario || errorEnPassword) {
            return; 
        }

        setIsLoading(true);

        try {
            const respuesta = await loginAPI(usuario, password);
            
            if (recordarme) {
                localStorage.setItem('usuarioGuardado', usuario);
            } else {
                localStorage.removeItem('usuarioGuardado');
            }


            onLoginSuccess(respuesta.nombre); 

        } catch (errorObjeto) {
            const mensaje = errorObjeto.message || "Error desconocido";
            setErrorGeneral(mensaje);
            setPassword('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="wrapper">
            <form onSubmit={handleSubmit}>
                <h1>Login</h1>
                
                <div className={`input-box ${errorUsuario ? 'error-border' : ''}`}>
                    <input 
                        type="text" 
                        placeholder='Rut' 
                        value={usuario} 
                        onChange={(e) => setUsuario(e.target.value)}
                        onBlur={validarUsuario}
                    />
                     <FaUserTie className='icon'/> 
                </div>
                {errorUsuario && <span className="field-error">{errorUsuario}</span>}

                <div className={`input-box ${errorPassword ? 'error-border' : ''}`}>
                    <input 
                        type="password" 
                        placeholder='Contraseña'
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={validarPassword}
                    />
                    <FaLock className='icon'/>
                </div>
                {errorPassword && <span className="field-error">{errorPassword}</span>}

                {errorGeneral && <div className="error-message">{errorGeneral}</div>}

                <div className="remember-forgot">
                    <label>
                        <input 
                            type="checkbox" 
                            checked={recordarme} 
                            onChange={(e) => setRecordarme(e.target.checked)}
                        />
                        Recuerdame
                    </label>
                    <a href="#">¿Olvidaste la contraseña?</a>
                </div>

                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Cargando...' : 'Login'}
                </button>

                <div className="register-link">
                    <p>¿No tiene una cuenta? <a href="#">Solicitar</a></p>
                </div>
            </form>
        </div>
    );
};

export default Login;