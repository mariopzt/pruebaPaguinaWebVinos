const { openai } = require('@ai-sdk/openai');
const { generateText } = require('ai');
const Wine = require('../models/Wine');

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
    const winesContext = context?.wines?.slice(0, 30).map(w => 
      `- "${w.name}" | Bodega: ${w.stock || 0} | Restaurante: ${w.restaurantStock || 0} | €${w.price || 0}`
    ).join('\n') || 'Sin vinos';

    // Construir prompt del sistema
    const systemPrompt = `Eres el asistente IA de VinosStK con CONTROL TOTAL sobre la bodega de vinos.

VINOS ACTUALES:
${winesContext}

ACCIONES QUE PUEDES EJECUTAR:

1. **update_stock** - Modificar stock (uno o varios vinos):
   Para UN vino: { "wines": [{ "name": "NombreVino", "stockChange": -5, "field": "stock" }] }
   Para VARIOS: { "wines": [
     { "name": "Vino1", "stockChange": -2, "field": "stock" },
     { "name": "Vino2", "stockChange": -2, "field": "stock" },
     { "name": "Vino3", "stockChange": -2, "field": "stock" }
   ]}
   - stockChange: NEGATIVO para quitar, POSITIVO para añadir
   - field: "stock" (bodega) o "restaurantStock" (restaurante)

2. **set_stock** - Establecer stock exacto:
   { "wines": [{ "name": "NombreVino", "stock": 50, "field": "stock" }] }

3. **add_wine** - Agregar vino(s):
   Un vino: { "wines": [{ "name": "Rioja Reserva", "type": "Tinto", "price": 18, "stock": 25 }] }
   Varios vinos: { "wines": [
     { "name": "Rioja Reserva", "type": "Tinto", "price": 18, "stock": 25 },
     { "name": "Albariño", "type": "Blanco", "price": 12, "stock": 30 },
     { "name": "Ribera del Duero", "type": "Tinto", "price": 22, "stock": 15 }
   ]}
   - Cuando pidan "crea X vinos", genera X vinos con nombres realistas españoles

4. **delete_wine** - Eliminar vino:
   { "name": "NombreVino" }

5. **none** - Solo responder sin acción

FORMATO DE RESPUESTA (JSON):
{
  "action": "update_stock" | "set_stock" | "add_wine" | "delete_wine" | "none",
  "response": "Mensaje confirmando la acción",
  "data": { ... }
}

EJEMPLOS:

Usuario: "Quita 2 del stock a todos los vinos"
{
  "action": "update_stock",
  "response": "He restado 2 unidades del stock de bodega a todos los vinos.",
  "data": { "wines": [
    { "name": "Vino1", "stockChange": -2, "field": "stock" },
    { "name": "Vino2", "stockChange": -2, "field": "stock" },
    ...
  ]}
}

Usuario: "Suma 10 al Rioja y al Ribera"
{
  "action": "update_stock", 
  "response": "He añadido 10 unidades al Rioja y al Ribera.",
  "data": { "wines": [
    { "name": "Rioja", "stockChange": 10, "field": "stock" },
    { "name": "Ribera", "stockChange": 10, "field": "stock" }
  ]}
}

Usuario: "Pon el stock del Albariño en 100"
{
  "action": "set_stock",
  "response": "He establecido el stock del Albariño en 100 unidades.",
  "data": { "wines": [{ "name": "Albariño", "stock": 100, "field": "stock" }] }
}

Usuario: "Elimina el vino Tempranillo"
{
  "action": "delete_wine",
  "response": "He eliminado el vino Tempranillo de la bodega.",
  "data": { "name": "Tempranillo" }
}

Usuario: "Crea 5 vinos nuevos"
→ Genera 5 vinos ÚNICOS con nombres de bodegas y vinos españoles REALES y VARIADOS
→ Usa tu conocimiento para crear nombres auténticos (Rioja, Ribera del Duero, Rías Baixas, Rueda, Priorat, Jumilla, Toro, Bierzo, Penedès, etc.)
→ Varía entre tintos, blancos y rosados
→ Precios realistas entre 8€ y 45€
→ Stock aleatorio entre 10 y 50

REGLAS:
- Responde SIEMPRE en español y JSON válido
- Usa los nombres EXACTOS de los vinos del contexto cuando modifiques stock
- Para CREAR vinos: genera nombres CREATIVOS y DIFERENTES cada vez
- Usa tu conocimiento de vinos españoles reales (bodegas famosas, D.O., variedades)
- Incluye variedad: Tempranillo, Garnacha, Albariño, Verdejo, Godello, Mencía, Monastrell, etc.
- Para operaciones múltiples, incluye TODOS los vinos en el array "wines"
- Cuando pidan "crea X vinos", genera EXACTAMENTE X vinos DIFERENTES y ÚNICOS
- NO repitas los mismos vinos, sé CREATIVO con los nombres
- Confirma siempre qué hiciste en "response"
- Si el usuario dice "todos los vinos", incluye todos los del contexto`;

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
      temperature: 0.7, // Más creativo para generar vinos variados
      maxTokens: 2000
    });

    // Parsear respuesta JSON
    let parsedResponse;
    try {
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

    console.log('[AI Command]', { 
      message, 
      action: parsedResponse.action,
      data: parsedResponse.data
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
 * Búsqueda web - Genera imágenes de vinos
 * POST /api/ai/web-search
 */
exports.webSearch = async (req, res, next) => {
  try {
    const { query, type = 'image' } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        message: 'Query requerido' 
      });
    }

    // Generar URLs de imágenes de vinos usando servicios gratuitos
    const wineImages = [
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400',
      'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400',
      'https://images.unsplash.com/photo-1586370434639-0fe43b2d32e6?w=400',
      'https://images.unsplash.com/photo-1567529692333-de9fd6772897?w=400',
      'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400',
      'https://images.unsplash.com/photo-1560148218-1a83060f7b32?w=400',
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400',
      'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=400',
    ];

    // Seleccionar imagen aleatoria
    const randomImage = wineImages[Math.floor(Math.random() * wineImages.length)];

    res.json({
      success: true,
      query,
      image: randomImage,
      results: [{ url: randomImage, title: query }]
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
        history: history?.slice(-50) || [],
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
