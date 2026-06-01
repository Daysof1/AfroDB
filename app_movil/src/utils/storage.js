import AsyncStorage from '@react-native-async-storage/async-storage';

const memoryStore = new Map();
//respaldo temporal en memoria asi AsyncStorage 

//Ejecuta una funcon async y  si falla devuelve un valor por defecto
//se usa para centralizar el manejo silencioso de errores

async function safeCall(fn, fallbackValue) {
    try {
        return await fn();
    } catch {
        return fallbackValue;
    }
}

// lee una calve del alamcenimiento 
//primero intenta por AsyncStorage y si falla usa el respaldo de memoria

export async function storageGetItem(key) {
    const value = await safeCall(() => AsyncStorage.getItem(key), null);
    if (value !== null) {
        return value;
    }
    return memoryStore.has(key) ? memoryStore.get(key) : null;
}

// guarda un clave en asyncstorage
// si no puede persistir la almacena en la memoria virtual
export async function storageSetItem(key, value) {
    const ok = await safeCall(async() => {
        await AsyncStorage.setItem(key, value);
        return true;
    }, false);
    if (!ok) {
        memoryStore.set(key, value);
    }
}

//Elimina varias claves a la vez
// Siempre limpia primero el respaldo en memoria y lueggo intenta en asyncstorage

export async function storageMultiRemove(keys) {
    // siempre limpiar memoryStorage primero
    keys.forEach((key) => memoryStore.delete(key));
    await safeCall(async() => {
        await AsyncStorage.multiRemove(keys);
    }, null);
}