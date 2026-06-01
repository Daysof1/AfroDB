// Este archivo centraliza axios para todas las peticiones HTTP al back
//Configura la URL base y ek tiempo maximo de espera dese las constates
//Interceptor de petición: adjunta automaticamente el token JWT si existe
//Interceptos de respuesta: normaliza los errores para que todo el codigo reciba
//siempre un objeto Error con un mensaje legible

import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS, STORAGE_KEYS } from '../utils/constants';
import { storageGetItem } from '../utils/storage';

// instancias de axios
const apiClient = axios.create ({
    baseURL: API_BASE_URL, // La baase de url que se conecta con el backend con puerto
    timeout: API_TIMEOUT_MS, //tiempo maximo, se cancela si el servidor dura mas
});

//Intyceptor de peticion
// se ejcuta antes de enviar cada request
// si hay token lo valida
//Autenticacion para que el backend pueda autenticar al usuario

apiClient.interceptors.request.use(
    async (config) => {
        const token = await storageGetItem(STORAGE_KEYS.token);

        if (token) {
            //Formato estandar Bearer Authorization: Bearer <token>
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    //si el interceptor falla (error de configuracion ) rechaza la peticion
    (error) => Promise.reject(error)
);

//Interceptor de respuesta
//Se ejecuta despues de recibir cada respuesta
//Respuesta con errores 4xx o 5xx /red extrae el mensaje del backend
//Si existe si no usa el mensaje de axios o un mensaje generico

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const backendMessagee = error.response?.data?.message;//mensaje del servidor
        const message = backendMessagee || error.message || 'Error de de conexion';
        return Promise.reject(new Error(message));
    }
);

export default apiClient;