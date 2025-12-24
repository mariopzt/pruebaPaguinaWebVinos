import { useState, useCallback, useRef } from 'react';
import api from '../api/axios';
import wineService from '../api/wineService';

/**
 * Hook para comunicación con la IA
 * Control total sobre vinos: crear, editar, eliminar, modificar stock
 * Chat se limpia al recargar la página
 */
export function useAI({ wines, onWinesChange, onUIChange, currentUser }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const abortControllerRef = useRef(null);

  // Buscar vino por nombre (búsqueda flexible)
  const findWineByName = useCallback((name) => {
    if (!wines || !name) return null;
    const searchName = name.toLowerCase().trim();
    
    // Búsqueda exacta
    let found = wines.find(w => w.name?.toLowerCase() === searchName);
    if (found) return found;
    
    // Búsqueda parcial
    found = wines.find(w => w.name?.toLowerCase().includes(searchName));
    if (found) return found;
    
    // Búsqueda inversa (nombre del vino contiene la búsqueda)
    found = wines.find(w => searchName.includes(w.name?.toLowerCase()));
    if (found) return found;
    
    // Búsqueda por palabras
    const words = searchName.split(' ').filter(w => w.length > 2);
    found = wines.find(w => {
      const wineName = w.name?.toLowerCase() || '';
      return words.some(word => wineName.includes(word));
    });
    
    return found;
  }, [wines]);

  // Ejecutar acción de modificar stock (uno o varios vinos)
  const executeUpdateStock = useCallback(async (data) => {
    const winesList = data.wines || [data];
    const results = [];
    const updatedWines = [...wines];

    for (const item of winesList) {
      const { name, wineName, stockChange, stock, field = 'stock' } = item;
      const targetName = name || wineName;
      
      if (!targetName) continue;

      const wine = findWineByName(targetName);
      if (!wine) {
        results.push({ name: targetName, success: false, error: 'No encontrado' });
        continue;
      }

      const wineId = wine._id || wine.id;
      const currentStock = wine[field] || 0;
      let newStock;

      if (stockChange !== undefined) {
        newStock = Math.max(0, currentStock + stockChange);
      } else if (stock !== undefined) {
        newStock = Math.max(0, stock);
      } else {
        continue;
      }

      try {
        // Actualizar en BD
        await wineService.updateWine(wineId, { [field]: newStock });
        
        // Actualizar en array local
        const idx = updatedWines.findIndex(w => (w._id || w.id) === wineId);
        if (idx !== -1) {
          updatedWines[idx] = { ...updatedWines[idx], [field]: newStock };
        }

        results.push({ 
          name: wine.name, 
          success: true, 
          field,
          oldStock: currentStock, 
          newStock,
          change: stockChange 
        });
        
        console.log(`✅ ${wine.name}: ${field} ${currentStock} → ${newStock}`);
      } catch (err) {
        console.error(`Error actualizando ${wine.name}:`, err);
        results.push({ name: wine.name, success: false, error: err.message });
      }
    }

    // Actualizar estado global
    if (onWinesChange && results.some(r => r.success)) {
      onWinesChange(updatedWines);
    }

    return results;
  }, [wines, findWineByName, onWinesChange]);

  // Ejecutar acción de agregar vino (uno o múltiples)
  const executeAddWine = useCallback(async (data) => {
    // Si es un array de vinos
    const winesList = data.wines || (data.name ? [data] : []);
    
    if (winesList.length === 0) {
      return { success: false, error: 'No hay vinos para crear' };
    }

    const results = [];
    const newWines = [];

    for (const wineData of winesList) {
      if (!wineData.name) continue;

      try {
        // Convertir grape string a grapeVariety array con porcentajes
        let grapeVariety = [];
        const grapeString = wineData.grape || '';
        if (grapeString) {
          const grapes = grapeString.split(',').map(g => g.trim()).filter(Boolean);
          const percentPerGrape = Math.floor(100 / grapes.length);
          const remainder = 100 - (percentPerGrape * grapes.length);
          grapeVariety = grapes.map((name, i) => ({
            name,
            percentage: percentPerGrape + (i === 0 ? remainder : 0)
          }));
        }

        const wine = {
          name: wineData.name,
          type: wineData.type || 'Tinto',
          price: wineData.price || Math.floor(Math.random() * 30) + 10,
          stock: wineData.stock || Math.floor(Math.random() * 50) + 10,
          restaurantStock: wineData.restaurantStock || Math.floor(Math.random() * 20) + 5,
          year: wineData.year || new Date().getFullYear() - Math.floor(Math.random() * 5),
          region: wineData.region || 'España',
          grape: grapeString,
          grapeVariety: grapeVariety,
          description: wineData.description || ''
        };

        const response = await wineService.createWine(wine);
        const newWine = response.data || response;
        newWines.push(newWine);
        results.push({ success: true, wine: newWine.name });
        console.log('✅ Vino creado:', newWine.name);
      } catch (err) {
        console.error('Error creando vino:', err);
        results.push({ success: false, name: wineData.name, error: err.message });
      }
    }

    // Actualizar estado global
    if (onWinesChange && newWines.length > 0) {
      onWinesChange(prev => [...prev, ...newWines]);
    }

    return results;
  }, [onWinesChange]);

  // Ejecutar acción de eliminar vino(s)
  const executeDeleteWine = useCallback(async (data) => {
    // Si es "all" o hay lista de wines, eliminar múltiples
    if (data?.all === true || data?.wines) {
      const winesToDelete = data.all ? wines : 
        (data.wines || []).map(w => findWineByName(w.name || w)).filter(Boolean);
      
      if (winesToDelete.length === 0) {
        return { success: false, error: 'No hay vinos para eliminar' };
      }

      const results = [];
      const deletedIds = [];

      for (const wine of winesToDelete) {
        try {
          const wineId = wine._id || wine.id;
          await wineService.deleteWine(wineId);
          deletedIds.push(wineId);
          results.push({ success: true, wine: wine.name });
          console.log('✅ Vino eliminado:', wine.name);
        } catch (err) {
          console.error('Error eliminando vino:', wine.name, err);
          results.push({ success: false, name: wine.name, error: err.message });
        }
      }

      if (onWinesChange && deletedIds.length > 0) {
        onWinesChange(prev => prev.filter(w => !deletedIds.includes(w._id || w.id)));
      }

      return results;
    }

    // Eliminar un solo vino
    const { name, id } = data || {};
    
    let wine;
    if (id) {
      wine = wines.find(w => (w._id || w.id) === id);
    } else if (name) {
      wine = findWineByName(name);
    }

    if (!wine) {
      return { success: false, error: 'Vino no encontrado' };
    }

    try {
      const wineId = wine._id || wine.id;
      await wineService.deleteWine(wineId);

      if (onWinesChange) {
        onWinesChange(prev => prev.filter(w => (w._id || w.id) !== wineId));
      }

      console.log('✅ Vino eliminado:', wine.name);
      return { success: true, wine: wine.name };
    } catch (err) {
      console.error('Error eliminando vino:', err);
      return { success: false, error: err.message };
    }
  }, [wines, findWineByName, onWinesChange]);

  // Ejecutar comando de la IA
  const executeCommand = useCallback(async (command) => {
    if (!command || !command.action) return null;

    const { action, data } = command;

    try {
      switch (action) {
        case 'update_stock':
        case 'set_stock':
          return await executeUpdateStock(data);

        case 'add_wine':
          return await executeAddWine(data);

        case 'delete_wine':
          return await executeDeleteWine(data);

        case 'navigate':
          if (onUIChange && data?.view) {
            onUIChange({ currentView: data.view });
          }
          return { success: true };

        case 'search_wine':
          if (onUIChange && data?.query) {
            onUIChange({ searchTerm: data.query });
          }
          return { success: true };

        default:
          return null;
      }
    } catch (err) {
      console.error('Error ejecutando comando:', err);
      setError('Error al ejecutar la acción');
      return { success: false, error: err.message };
    }
  }, [executeUpdateStock, executeAddWine, executeDeleteWine, onUIChange]);

  // Enviar mensaje a la IA
  const sendMessage = useCallback(async (message) => {
    if (!message.trim()) return null;

    setIsLoading(true);
    setError(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await api.post('/ai/command', {
        message,
        context: {
          wines: wines?.map(w => ({
            id: w._id || w.id,
            name: w.name,
            type: w.type,
            stock: w.stock || 0,
            restaurantStock: w.restaurantStock || 0,
            price: w.price || 0
          })),
          user: currentUser?.name || 'Usuario',
          timestamp: new Date().toISOString()
        },
        history: conversationHistory.slice(-10)
      }, {
        signal: abortControllerRef.current.signal
      });

      const result = response.data;

      // Agregar a historial
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: message },
        { role: 'assistant', content: result.response, action: result.action, data: result.data }
      ]);

      // Ejecutar acción si existe
      if (result.action && result.action !== 'none' && result.action !== 'response') {
        const actionResult = await executeCommand(result);
        result.actionResult = actionResult;
        
        // Log de resultados
        if (Array.isArray(actionResult)) {
          const successful = actionResult.filter(r => r.success).length;
          const failed = actionResult.filter(r => !r.success).length;
          console.log(`📊 Resultados: ${successful} exitosos, ${failed} fallidos`);
        }
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
  }, [wines, currentUser, conversationHistory, executeCommand]);

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
    cancel
  };
}

export default useAI;
