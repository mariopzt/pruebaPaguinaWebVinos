const { openai } = require('@ai-sdk/openai');
const { generateText } = require('ai');

// Modelo de memoria en MongoDB (opcional)
const mongoose = require('mongoose');

// Schema para memoria de conversación
const conversationMemorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  history: [{
    role: { type: String, enum: ['user', 'assistant'] },
    content: String,
    action: String,
    timestamp: { type: Date, default: Date.now }
  }],
  updatedAt: { type: Date, default: Date.now }
});

const ConversationMemory = mongoose.model('ConversationMemory', conversationMemorySchema);

/**
 * Procesar comando de IA
 * POST /api/ai/command
 */
exports.processCommand = async (req, res, next) => {
  try {
    const { message, context, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mensaje requerido' 
      });
    }

    // Verificar API key
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'API key de OpenAI no configurada',
        response: 'Lo siento, el servicio de IA no está configurado correctamente.',
        action: 'error'
      });
    }

    // Construir contexto de vinos
    const winesContext = context?.wines?.slice(0, 10).map(w => 
      `- ${w.name}: ${w.type}, ${w.stock || 0} unidades, €${w.price || 0}`
    ).join('\n') || 'Sin vinos en contexto';

    // Construir prompt del sistema
    const systemPrompt = `Eres el asistente IA de VinosStK, una aplicación de gestión de bodega de vinos.

CONTEXTO ACTUAL:
- Usuario: ${context?.user || 'Usuario'}
- Fecha: ${new Date().toLocaleDateString('es-ES')}
- Vinos disponibles en la bodega:
${winesContext}

CAPACIDADES:
1. Buscar y filtrar vinos de la bodega (search_wine, filter_wines)
2. Gestionar stock (update_wine, add_wine, delete_wine)
3. Navegar por la aplicación (navigate)
4. Mostrar estadísticas (show_stats)
5. Responder preguntas generales sobre vinos con tus conocimientos (none)

FORMATO DE RESPUESTA (JSON obligatorio):
{
  "action": "nombre_accion" | "none",
  "response": "Tu respuesta conversacional aquí",
  "data": { /* datos relevantes para la acción */ }
}

ACCIONES DISPONIBLES:
- search_wine: { "query": "término de búsqueda" }
- filter_wines: { "type": "tinto|blanco|rosado", "price": { "min": 0, "max": 100 }, "stock": "low|high" }
- update_wine: { "id": "wine_id", "changes": { "stock": 10, "price": 15 } }
- add_wine: { "name": "...", "type": "...", "price": 0, "stock": 0 }
- delete_wine: { "id": "wine_id" }
- navigate: { "view": "home|bodega|agotados|pedidos|tareas|ajustes" }
- show_stats: { "type": "ventas|stock|popular" }
- none: Para respuestas conversacionales o preguntas sobre vinos/regiones

REGLAS IMPORTANTES:
- Responde SIEMPRE en español
- Sé amable y profesional
- NUNCA digas "voy a buscar" - responde directamente con tu conocimiento
- Si te preguntan sobre vinos de una región (Galicia, A Coruña, Ribera, etc.), responde con información útil de tu conocimiento
- Cuando pregunten sobre vinos específicos, menciona denominaciones de origen, tipos de uva, características, etc.
- Mantén respuestas informativas pero concisas (máximo 3-4 párrafos)
- SIEMPRE responde en formato JSON válido
- NO prometas hacer búsquedas, simplemente responde con la información`;

    // Construir historial de mensajes
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Agregar historial previo (limitado)
    if (history && Array.isArray(history)) {
      history.slice(-6).forEach(msg => {
        messages.push({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
        });
      });
    }

    // Agregar mensaje actual
    messages.push({ role: 'user', content: message });

    // Llamar a OpenAI
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      messages,
      temperature: 0.7,
      maxTokens: 500
    });

    // Parsear respuesta JSON
    let parsedResponse;
    try {
      // Intentar extraer JSON de la respuesta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = {
          action: 'none',
          response: text,
          data: null
        };
      }
    } catch (parseError) {
      console.error('Error parseando respuesta de IA:', parseError);
      parsedResponse = {
        action: 'none',
        response: text,
        data: null
      };
    }

    // Log para debug
    console.log('[AI Command]', { 
      message, 
      action: parsedResponse.action,
      responsePreview: parsedResponse.response?.substring(0, 100) 
    });

    res.json({
      success: true,
      ...parsedResponse
    });

  } catch (error) {
    console.error('Error en processCommand:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      response: 'Lo siento, ocurrió un error al procesar tu mensaje.',
      action: 'error'
    });
  }
};

/**
 * Búsqueda web
 * POST /api/ai/web-search
 */
exports.webSearch = async (req, res, next) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        message: 'Query requerido' 
      });
    }

    // Por ahora, retornamos una respuesta simulada
    // En producción, podrías usar APIs como SerpAPI, Google Custom Search, etc.
    res.json({
      success: true,
      query,
      results: [
        {
          title: 'Resultado de búsqueda simulado',
          snippet: `Información sobre "${query}"`,
          url: '#'
        }
      ],
      message: 'Búsqueda web no implementada completamente. Configura una API de búsqueda.'
    });

  } catch (error) {
    console.error('Error en webSearch:', error);
    next(error);
  }
};

/**
 * Obtener memoria de conversación
 * GET /api/ai/memory
 */
exports.getMemory = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.json({ success: true, history: [] });
    }

    const memory = await ConversationMemory.findOne({ userId: req.user._id });
    
    res.json({
      success: true,
      history: memory?.history || []
    });

  } catch (error) {
    console.error('Error en getMemory:', error);
    next(error);
  }
};

/**
 * Guardar memoria de conversación
 * POST /api/ai/memory
 */
exports.saveMemory = async (req, res, next) => {
  try {
    const { history } = req.body;
    
    if (!req.user) {
      return res.json({ success: true });
    }

    await ConversationMemory.findOneAndUpdate(
      { userId: req.user._id },
      { 
        history: history?.slice(-50) || [], // Limitar a últimas 50 interacciones
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ success: true });

  } catch (error) {
    console.error('Error en saveMemory:', error);
    next(error);
  }
};

/**
 * Limpiar memoria de conversación
 * DELETE /api/ai/memory
 */
exports.clearMemory = async (req, res, next) => {
  try {
    if (req.user) {
      await ConversationMemory.findOneAndDelete({ userId: req.user._id });
    }
    
    res.json({ success: true });

  } catch (error) {
    console.error('Error en clearMemory:', error);
    next(error);
  }
};

