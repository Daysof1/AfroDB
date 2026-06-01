/**
 * Es el contexto global del carrito de compras
 * funiona en do modos segun si el usuario esta autenticado 
 * sin session lee y escribe en async Storage (carrito local)
 * con sesion lee y escribe en backend via api rest
 * al iniciar sesion funciona automaticamente el carrito local al backend para que el usuario
 * no pierda los productos agregados sin cuenta
 * Exone items totales y las acciones : agregar cambiar cantidad eliminar vy vaciar 
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import carritoService from '../services/carritoService';

const CarritoContext = createContext(null);

export function CarritoProvider ({ children }) {
    //lee isAuthenticated e isloading del contexto del autenticacion
    const { isAuthenticated, isLoadingSession} = useAuth();

    //Estado carrito
    const [items, setItems ] = useState([]); // lista de productos en el carrito
    const [totalItems, setTotalItems] = useState(0); //suma de cantidades 
    const [total, setTotal] = useState(0); //precio total
    const [loading, setLoading] = useState(true); // true mientras carga el carrito

    //Rastrea si el usuario estaba autenticado en el render anterior para detectar en el momento exacto de inicio de sesion
    const prevAuthenticated = useRef(false);

    /**
     * hydrate
     * carga o recarga el carrito desde el origen correcto local o backend
     * se llama al montar el provider y despues de cada operacion
     */
    const hydrate = useCallback(async () => {
        //Espera a que authcontext termine de restaurar la sesion gardada 
        if (isLoadingSession) {
            return;
        }

        /**
         * Fusion al iniciar sesion
         * si el usuario acaba de iniciar sesion paso de false a true
         * sube los items del carrito local al backend antes de leerlo
         * asi no se pierden los productos agregados sin cuenta 
         */

        if (isAuthenticated && !prevAuthenticated.current) {
            try {
                await carritoService.mergeLocalToBackend();
            } catch {
                //si la fusion falla continua sin bloquear 
            }
        }

        //actualiza la referencia para el proximo render
        prevAuthenticated.current = isAuthenticated;

        setLoading(true);
        try {
            //getCarrito decide internamente si consulta el backend o asyncStorage
            const snapshot = await carritoService.getCarrito(isAuthenticated);
            setItems(snapshot.items);
            setTotalItems(snapshot.totalItems);
            setTotal(snapshot.total);
        } catch {
            // si fallla muestra carrito vacio sin productos
            setItems([]);
            setTotalItems(0);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, isLoadingSession]);

    //se ejecuta cada vez que cambia isAthenticated o isLoadingSession
    useEffect(() => {
        hydrate();
    }, [hydrate]);

    //Mientras haya sesión activa, reconsulta el carrito de forma periódica.
    //Esto mantiene la app alineada si el carrito cambia desde otro cliente o Postman.
    useEffect(() => {
        if (isLoadingSession || !isAuthenticated) {
            return undefined;
        }

        const intervalId = setInterval(() => {
            hydrate();
        }, 5000);

        return () => clearInterval(intervalId);
    }, [hydrate, isAuthenticated, isLoadingSession]);

    /**
     * agregar producto
     * agrega producto al carrito (local o backend) y recarga el estado
     */

    const agregarProducto = useCallback(
        async (producto, cantidad = 1) => {
            await carritoService.addToCarrito({ isAuthenticated, producto, cantidad});
            await hydrate();
        },
        [hydrate, isAuthenticated]
    );

    /** cambiar cantidad
     * modifica la cantidad de un item ya existent en el carrito
     */

    const cambiarCantidad = useCallback(
        async (itemId, cantidad) => {
            await carritoService.updateCantidad({ isAuthenticated, itemId, cantidad});
            await hydrate();
        },
        [hydrate, isAuthenticated]
    );

    /**
     * Eliminar un item del carrito por su id
     */

    const eliminarItem = useCallback(
        async (itemId) => {
            await carritoService.removeItem({ isAuthenticated, itemId });
            await hydrate();
        },
        [hydrate, isAuthenticated]
    );

    /**
     * vaciar carrito
     * elimina todos los ite ms del carrito de ua vez
     */
    
    const vaciarCarrito = useCallback(async () => {
        await carritoService.clearCarrito(isAuthenticated);
        await hydrate();
    }, [hydrate, isAuthenticated]);

    /**useMemo evita reacer el objeto en cada render innecesario */
    const value= useMemo(
        () => ({
            items, // array iten normalizados
            totalItems, //cantidad total de unidades
            total, //precio total del carrito
            loading, //true mientras se carga
            refreshCarrito: hydrate, //permite forzar una recarga manual
            agregarProducto, 
            cambiarCantidad,
            eliminarItem,
            vaciarCarrito,

        }),
    [items, totalItems, total, loading, hydrate, agregarProducto, cambiarCantidad, eliminarItem, vaciarCarrito]);

    return <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>;
    
}

/**
     * HOOK
     * simplifica el acceso al contexto y lanza un error descriptivo si se usa fuera del arbol de CarritoProvider
     */
export function useCarrito() {
    const context = useContext(CarritoContext);
    if (!context) {
        throw new Error('useCarrito debe usarse dentro de un CarritoProvider');
    }

    return context;
}
    