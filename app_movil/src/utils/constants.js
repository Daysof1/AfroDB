export const API_TIMEOUT_MS = 15000; // 15 segundos

//android emulador accede al localhost de mi pc mediante 10.0.2.2
//si usa dispositivo fisico cambia por la ip LAN o local: https://192.168.X.X:5000/api
export const API_BASE_URL = 'https://10.0.2.2:5000/api';

export const STORAGE_KEYS = {
    token: 'token',
    user: 'user',
    carritoLocal: 'carritoLocal',
};