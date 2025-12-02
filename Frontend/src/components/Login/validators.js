//Esto es para el patron obligatorio Strategy para validaciones, no se si ya lo habian usado o no pero aqui esta xd


//Campo Obligatorio
export const isRequired = (valor) => {
    return !valor || valor.trim() === '' ? "Este campo es obligatorio" : null;
};

//Longitud minima
export const minLength = (min) => (valor) => {
    return valor.length < min ? `Debe tener al menos ${min} caracteres` : null;
};

//Sin Espacios
export const noSpaces = (valor) => {
    return valor.includes(' ') ? "No puede contener espacios" : null;
};

//Longitud Maxima
export const maxLength = (max) => (valor) => {
    return valor && valor.length > max 
        ? `No puede tener más de ${max} caracteres` 
        : null;
};

//Validar RUT
export const isValidRUT = (valor) => {
    const rutRegex = /^\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]$/;
    return rutRegex.test(valor)
        ? null
        : "RUT inválido";
};


//Primer muro 
export const noHTML = (valor) => {
    const htmlRegex = /<[^>]*>/g;
    return htmlRegex.test(valor)
        ? "No se permiten etiquetas HTML"
        : null;
};


//Ejecutor
export const validarInput = (valor, estrategias) => {
    for (const estrategia of estrategias) {
        const error = estrategia(valor);
        if (error){
            return error;
        }
    }
    return null;
};