import { useState, useCallback, useRef } from 'react';
import api from '../api/axios';

/**
 * Hook para comunicación con la IA
 * Maneja comandos, memoria de conversación y acciones
 */
export function useAI({ wines, onWinesChange, onUIChange, currentUser }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const abortControllerRef = useRef(null);

  // Enviar mensaje a la IA
  const sendMessage = useCallback(async (message) => {
    if (!message.trim()) return null;

    setIsLoading(true);
    setError(null);

    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await api.post('/ai/command', {
        message,
        context: {
          wines: wines?.slice(0, 20), // Limitar contexto
          user: currentUser?.name || 'Usuario',
          timestamp: new Date().toISOString()
        },
        history: conversationHistory.slice(-10) // Últimas 10 interacciones
      }, {
        signal: abortControllerRef.current.signal
      });

      const result = response.data;

      // Agregar a historial
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: message },
        { role: 'assistant', content: result.response, action: result.action }
      ]);

      // Ejecutar acción si existe
      if (result.action && result.action !== 'none') {
        await executeCommand(result);
      }

      return result;
    } catch (err) {
      if (err.name === 'AbortError') return null;
      const errorMsg = err.response?.data?.message || err.message || 'Error al comunicarse con la IA';
      setError(errorMsg);
      console.error('Error en useAI:', err);
      return { response: errorMsg, action: 'error' };
    } finally {
      setIsLoading(false);
    }
  }, [wines, currentUser, conversationHistory]);

  // Ejecutar comando de la IA
  const executeCommand = useCallback(async (command) => {
    if (!command || !command.action) return;

    try {
      switch (command.action) {
        case 'search_wine':
          // Buscar vinos
          if (onUIChange) {
            onUIChange({ searchTerm: command.data?.query || '' });
          }
          break;

        case 'filter_wines':
          // Filtrar vinos por tipo, precio, etc.
          if (onUIChange) {
            onUIChange({ 
              filterType: command.data?.type,
              filterPrice: command.data?.price,
              filterStock: command.data?.stock
            });
          }
          break;

        case 'add_wine':
          // Agregar un vino
          if (command.data && onWinesChange) {
            // Aquí se podría llamar al servicio para crear el vino
            console.log('Agregar vino:', command.data);
          }
          break;

        case 'update_wine':
          // Actualizar un vino
          if (command.data?.id && onWinesChange) {
            console.log('Actualizar vino:', command.data);
          }
          break;

        case 'delete_wine':
          // Eliminar un vino
          if (command.data?.id && onWinesChange) {
            console.log('Eliminar vino:', command.data.id);
          }
          break;

        case 'navigate':
          // Navegar a una sección
          if (onUIChange) {
            onUIChange({ currentView: command.data?.view });
          }
          break;

        case 'show_stats':
          // Mostrar estadísticas
          if (onUIChange) {
            onUIChange({ showStats: true, statsType: command.data?.type });
          }
          break;

        case 'web_search':
          // Búsqueda web
          return await webSearch(command.data?.query);

        default:
          console.log('Acción no reconocida:', command.action);
      }
    } catch (err) {
      console.error('Error ejecutando comando:', err);
      setError('Error al ejecutar la acción');
    }
  }, [onWinesChange, onUIChange]);

  // Búsqueda web
  const webSearch = useCallback(async (query) => {
    if (!query) return null;

    try {
      const response = await api.post('/ai/web-search', { query });
      return response.data;
    } catch (err) {
      console.error('Error en búsqueda web:', err);
      return null;
    }
  }, []);

  // Obtener memoria de conversación del servidor
  const loadMemory = useCallback(async () => {
    try {
      const response = await api.get('/ai/memory');
      if (response.data?.history) {
        setConversationHistory(response.data.history);
      }
    } catch (err) {
      console.error('Error cargando memoria:', err);
    }
  }, []);

  // Guardar memoria de conversación
  const saveMemory = useCallback(async () => {
    try {
      await api.post('/ai/memory', { history: conversationHistory });
    } catch (err) {
      console.error('Error guardando memoria:', err);
    }
  }, [conversationHistory]);

  // Limpiar historial
  const clearHistory = useCallback(() => {
    setConversationHistory([]);
    setError(null);
  }, []);

  // Cancelar petición en curso
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  }, []);

  return {
    sendMessage,
    isLoading,
    error,
    conversationHistory,
    clearHistory,
    cancel,
    loadMemory,
    saveMemory,
    webSearch
  };
}

export default useAI;

