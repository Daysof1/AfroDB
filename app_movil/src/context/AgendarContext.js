/**
 * Contexto Global de Citas
 * Gestiona el estado de citas agendadas del usuario autenticado
 * Funciones: obtener mis citas, crear cita, cancelar cita
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import citaService from '../services/citaService';

const AgendarContext = createContext(null);

export function AgendarProvider({ children }) {
    const { isAuthenticated, isLoadingSession } = useAuth();

    // Estado de citas
    const [citas, setCitas] = useState([]); // Lista de citas del usuario
    const [loading, setLoading] = useState(true); // true mientras carga las citas
    const [refreshing, setRefreshing] = useState(false); // true durante pull-to-refresh

    /**
     * hydrate
     * Obtiene las citas del usuario desde el backend
     */
    const hydrate = useCallback(async () => {
        if (isLoadingSession || !isAuthenticated) {
            setLoading(false);
            setCitas([]);
            return;
        }

        setLoading(true);
        try {
            const citasData = await citaService.obtenerMisCitas();
            setCitas(Array.isArray(citasData) ? citasData : []);
        } catch (error) {
            console.log('Error al cargar citas:', error);
            setCitas([]);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, isLoadingSession]);

    /**
     * Se ejecuta al montar y cuando cambia isAuthenticated o isLoadingSession
     */
    useEffect(() => {
        hydrate();
    }, [hydrate]);

    /**
     * crearCita
     * Agenda una nueva cita con los servicios especificados
     * @param {Object} datoCita - { fecha: 'YYYY-MM-DD', hora: 'HH:MM', servicios: [id], profesionalId?, nota? }
     */
    const crearCita = useCallback(
        async (datoCita) => {
            try {
                const nuevaCita = await citaService.agendarCita(datoCita);
                // Agrega la nueva cita a la lista
                setCitas(prev => [nuevaCita, ...prev]);
                return nuevaCita;
            } catch (error) {
                throw error;
            }
        },
        []
    );

    /**
     * cancelarCita
     * Cancela una cita existente
     */
    const cancelarCita = useCallback(
        async (citaId) => {
            try {
                await citaService.cancelarCita(citaId);
                // Remueve la cita cancelada
                setCitas(prev => prev.filter(c => c.id !== citaId));
            } catch (error) {
                throw error;
            }
        },
        []
    );

    /**
     * refreshCitas
     * Recarga las citas manualmente
     */
    const refreshCitas = useCallback(async () => {
        setRefreshing(true);
        try {
            const citasData = await citaService.obtenerMisCitas();
            setCitas(Array.isArray(citasData) ? citasData : []);
        } catch (error) {
            console.log('Error al refrescar citas:', error);
        } finally {
            setRefreshing(false);
        }
    }, []);

    // useMemo evita recrear el objeto en cada render
    const value = useMemo(
        () => ({
            citas,
            loading,
            refreshing,
            crearCita,
            cancelarCita,
            refreshCitas,
        }),
        [citas, loading, refreshing, crearCita, cancelarCita, refreshCitas]
    );

    return (
        <AgendarContext.Provider value={value}>
            {children}
        </AgendarContext.Provider>
    );
}

/**
 * Hook useAgendar
 * Simplifica el acceso al contexto de citas
 */
export function useAgendar() {
    const context = useContext(AgendarContext);
    if (!context) {
        throw new Error('useAgendar debe usarse dentro de un AgendarProvider');
    }
    return context;
}
    