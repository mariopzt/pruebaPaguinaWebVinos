const { openai } = require('@ai-sdk/openai');
const { generateText } = require('ai');
const Wine = require('../models/Wine');
const axios = require('axios');
const cheerio = require('cheerio');

// Modelo de memoria en MongoDB (opcional)
const mongoose = require('mongoose');

/**
 * Scrapear información de vinos de múltiples fuentes
 */
async function scrapeWineFromWeb(wineName) {
  const results = [];
  
  // Headers para simular navegador
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
  };

  try {
    // 1. Buscar en Vinissimus (tienda española de vinos)
    const vinissimusUrl = `https://www.vinissimus.com/es/buscar/?q=${encodeURIComponent(wineName)}`;
    console.log('[AI] Buscando en Vinissimus:', vinissimusUrl);
    
    const vinissimusRes = await axios.get(vinissimusUrl, { headers, timeout: 8000 });
    const $v = cheerio.load(vinissimusRes.data);
    
    // Buscar el primer resultado de vino
    const firstWine = $v('.product-card').first();
    if (firstWine.length) {
      const wineTitle = firstWine.find('.product-card__name').text().trim();
      const wineInfo = firstWine.find('.product-card__info').text().trim();
      const wineRegion = firstWine.find('.product-card__region').text().trim();
      
      if (wineTitle) {
        results.push({
          source: 'Vinissimus',
          name: wineTitle,
          info: `${wineInfo} ${wineRegion}`.trim()
        });
      }
    }
  } catch (e) {
    console.log('[AI] Error Vinissimus:', e.message);
  }

  try {
    // 2. Buscar DIRECTAMENTE en Google el vino + Vivino para obtener la página exacta
    const googleVivinoUrl = `https://www.google.com/search?q=${encodeURIComponent(wineName + ' site:vivino.com')}&hl=es`;
    console.log('[AI] Buscando en Google+Vivino...');
    
    const googleRes = await axios.get(googleVivinoUrl, { 
      headers: {
        ...headers,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }, 
      timeout: 8000 
    });
    
    const $g = cheerio.load(googleRes.data);
    const snippets = [];
    
    $g('.VwiC3b, .IsZvec, .lEBKkf, span').each((i, el) => {
      const text = $g(el).text().trim();
      if (text && text.length > 20) {
        snippets.push(text);
      }
    });
    
    const allText = snippets.join(' ').toLowerCase();
    
    // Detectar D.O. en los snippets - LISTA COMPLETA
    const doPatterns = [
      { pattern: /ribeira\s*sacra/i, name: 'Ribeira Sacra' },
      { pattern: /ribeiro(?!\s*sacra)/i, name: 'Ribeiro' },
      { pattern: /rías\s*baixas|rias\s*baixas/i, name: 'Rías Baixas' },
      { pattern: /ribera\s*(del\s*)?duero/i, name: 'Ribera del Duero' },
      { pattern: /rioja/i, name: 'Rioja' },
      { pattern: /rueda/i, name: 'Rueda' },
      { pattern: /bierzo/i, name: 'Bierzo' },
      { pattern: /priorat/i, name: 'Priorat' },
      { pattern: /toro(?!\s+de)/i, name: 'Toro' },
      { pattern: /jumilla/i, name: 'Jumilla' },
      { pattern: /valdeorras/i, name: 'Valdeorras' },
      { pattern: /monterrei/i, name: 'Monterrei' },
      { pattern: /terra\s*alta/i, name: 'Terra Alta' },
      { pattern: /penedés|penedes/i, name: 'Penedés' },
      { pattern: /somontano/i, name: 'Somontano' },
      { pattern: /cariñena/i, name: 'Cariñena' },
      { pattern: /campo\s*de\s*borja/i, name: 'Campo de Borja' },
      { pattern: /calatayud/i, name: 'Calatayud' },
      { pattern: /navarra/i, name: 'Navarra' },
      { pattern: /txakoli|chacolí/i, name: 'Txakoli' },
      { pattern: /méntrida|mentrida/i, name: 'Méntrida' },
      { pattern: /la\s*mancha/i, name: 'La Mancha' },
      { pattern: /manchuela/i, name: 'Manchuela' },
      { pattern: /yecla/i, name: 'Yecla' },
      { pattern: /alicante/i, name: 'Alicante' },
      { pattern: /utiel.?requena/i, name: 'Utiel-Requena' },
      { pattern: /valencia/i, name: 'Valencia' },
      { pattern: /condado\s*de\s*huelva/i, name: 'Condado de Huelva' },
      { pattern: /jerez|sherry/i, name: 'Jerez' },
      { pattern: /montilla.?moriles/i, name: 'Montilla-Moriles' },
      { pattern: /málaga/i, name: 'Málaga' }
    ];
    
    const grapePatterns = [
      { pattern: /godello/i, name: 'Godello' },
      { pattern: /treixadura/i, name: 'Treixadura' },
      { pattern: /albari[ñn]o/i, name: 'Albariño' },
      { pattern: /menc[ií]a/i, name: 'Mencía' },
      { pattern: /tempranillo/i, name: 'Tempranillo' },
      { pattern: /garnacha/i, name: 'Garnacha' },
      { pattern: /verdejo/i, name: 'Verdejo' },
      { pattern: /monastrell/i, name: 'Monastrell' }
    ];
    
    const foundDOs = doPatterns.filter(p => p.pattern.test(allText)).map(p => p.name);
    const foundGrapes = grapePatterns.filter(p => p.pattern.test(allText)).map(p => p.name);
    
    if (foundDOs.length > 0 || foundGrapes.length > 0) {
      const info = [
        foundDOs.length > 0 ? `D.O.: ${foundDOs[0]}` : '',
        foundGrapes.length > 0 ? `Uvas: ${foundGrapes.join(', ')}` : '',
        'Galicia, España'
      ].filter(Boolean).join(' | ');
      
      results.push({
        source: 'Vivino/Google',
        name: wineName,
        info: info
      });
      
      console.log('[AI] ✅ Encontrado:', info);
    }
  } catch (e) {
    console.log('[AI] Error Google+Vivino:', e.message);
  }

  try {
    // 3. Buscar directamente la página del vino en Vivino
    const vivinoSearchUrl = `https://www.vivino.com/search/wines?q=${encodeURIComponent(wineName)}`;
    console.log('[AI] Buscando en Vivino directo:', vivinoSearchUrl);
    
    const vivinoRes = await axios.get(vivinoSearchUrl, { 
      headers, 
      timeout: 10000,
      maxRedirects: 5
    });
    
    const $v = cheerio.load(vivinoRes.data);
    const pageText = $v('body').text().replace(/\s+/g, ' ');
    
    // Buscar patrones específicos en el HTML
    const doMatch = pageText.match(/(?:D\.?O\.?|Denominación|Region|Región)[:\s]*(Ribeiro|Rías Baixas|Ribera del Duero|Rioja|Rueda|Bierzo|Priorat|Valdeorras)/i);
    const grapeMatch = pageText.match(/(?:Uva|Grape|Varietal)[:\s]*((?:Godello|Treixadura|Albariño|Mencía|Tempranillo|Garnacha|Verdejo)(?:[,\s]+(?:Godello|Treixadura|Albariño|Mencía|Tempranillo|Garnacha|Verdejo))*)/i);
    
    if (doMatch || grapeMatch) {
      const info = [
        doMatch ? `D.O.: ${doMatch[1]}` : '',
        grapeMatch ? `Uvas: ${grapeMatch[1]}` : ''
      ].filter(Boolean).join(' | ');
      
      if (info && !results.some(r => r.info.includes(doMatch?.[1] || ''))) {
        results.push({
          source: 'Vivino',
          name: wineName,
          info: info
        });
        console.log('[AI] ✅ Vivino directo:', info);
      }
    }
  } catch (e) {
    console.log('[AI] Error Vivino directo:', e.message);
  }

  try {
    // 3. Buscar en Bodeboca (tienda española)
    const bodebocaUrl = `https://www.bodeboca.com/buscar?q=${encodeURIComponent(wineName)}`;
    console.log('[AI] Buscando en Bodeboca:', bodebocaUrl);
    
    const bodebocaRes = await axios.get(bodebocaUrl, { headers, timeout: 8000 });
    const $b = cheerio.load(bodebocaRes.data);
    
    const wineCard = $b('.product-card, .wine-card, [class*="product"]').first();
    const wineText = wineCard.text().replace(/\s+/g, ' ').trim().substring(0, 300);
    
    if (wineText && wineText.length > 20) {
      results.push({
        source: 'Bodeboca',
        name: wineName,
        info: wineText
      });
    }
  } catch (e) {
    console.log('[AI] Error Bodeboca:', e.message);
  }

  try {
    // 4. Búsqueda en DuckDuckGo HTML (más permisivo que Google)
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(wineName + ' vino bodega denominación origen uva España')}`;
    console.log('[AI] Buscando en DuckDuckGo:', wineName);
    
    const ddgRes = await axios.get(ddgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html'
      },
      timeout: 10000
    });
    
    const $ddg = cheerio.load(ddgRes.data);
    const ddgText = $ddg('body').text().replace(/\s+/g, ' ');
    
    // Buscar D.O.s
    const allDOs = [
      'Ribeira Sacra', 'Ribeiro', 'Rías Baixas', 'Rias Baixas',
      'Ribera del Duero', 'Rioja', 'Rueda', 'Bierzo', 'Priorat',
      'Valdeorras', 'Monterrei', 'Toro', 'Jumilla', 'Somontano',
      'Penedés', 'Cariñena', 'Navarra', 'La Mancha', 'Yecla'
    ];
    
    const allGrapes = [
      'Mencía', 'Mencia', 'Godello', 'Treixadura', 'Albariño', 'Albarino',
      'Tempranillo', 'Garnacha', 'Verdejo', 'Monastrell', 'Bobal', 'Moscatel'
    ];
    
    let ddgFoundDO = null;
    let ddgFoundGrapes = [];
    
    for (const doName of allDOs) {
      if (ddgText.toLowerCase().includes(doName.toLowerCase())) {
        ddgFoundDO = doName;
        console.log('[AI] ✅ DuckDuckGo encontró D.O.:', doName);
        break;
      }
    }
    
    for (const grape of allGrapes) {
      if (ddgText.toLowerCase().includes(grape.toLowerCase())) {
        ddgFoundGrapes.push(grape);
      }
    }
    ddgFoundGrapes = [...new Set(ddgFoundGrapes)].slice(0, 3);
    
    if (ddgFoundDO || ddgFoundGrapes.length > 0) {
      results.push({
        source: 'DuckDuckGo',
        name: wineName,
        info: [
          ddgFoundDO ? `D.O.: ${ddgFoundDO}` : '',
          ddgFoundGrapes.length > 0 ? `Uvas: ${ddgFoundGrapes.join(', ')}` : ''
        ].filter(Boolean).join(' | ')
      });
      console.log('[AI] ✅ DuckDuckGo info:', ddgFoundDO, ddgFoundGrapes);
    }
  } catch (e) {
    console.log('[AI] Error DuckDuckGo:', e.message);
  }

  try {
    // 5. Búsqueda en Google como respaldo
    const queries = [
      `"${wineName}" vino denominación origen bodega`,
      `${wineName} vino España D.O. uva`
    ];
    
    for (const searchQuery of queries) {
      try {
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&hl=es&num=10`;
        console.log('[AI] Google query:', searchQuery);
        
        const googleRes = await axios.get(googleUrl, { 
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
          }, 
          timeout: 10000 
        });
        
        const $g = cheerio.load(googleRes.data);
        const pageText = $g('body').text().replace(/\s+/g, ' ');
        
        // Buscar D.O.s en todo el texto de Google
        const allDOs = [
          'Ribeira Sacra', 'Ribeiro', 'Rías Baixas', 'Rias Baixas',
          'Ribera del Duero', 'Rioja', 'Rueda', 'Bierzo', 'Priorat',
          'Valdeorras', 'Monterrei', 'Toro', 'Jumilla', 'Somontano',
          'Penedés', 'Cariñena', 'Navarra', 'La Mancha', 'Yecla',
          'Alicante', 'Valencia', 'Jerez', 'Málaga', 'Condado de Huelva'
        ];
        
        const allGrapes = [
          'Mencía', 'Mencia', 'Godello', 'Treixadura', 'Albariño', 'Albarino',
          'Tempranillo', 'Garnacha', 'Verdejo', 'Monastrell', 'Bobal',
          'Graciano', 'Mazuelo', 'Cariñena', 'Viura', 'Macabeo', 'Parellada',
          'Xarel·lo', 'Palomino', 'Pedro Ximénez', 'Moscatel'
        ];
        
        let foundDO = null;
        let foundGrapes = [];
        
        for (const doName of allDOs) {
          if (pageText.toLowerCase().includes(doName.toLowerCase())) {
            foundDO = doName;
            console.log('[AI] ✅ Google encontró D.O.:', doName);
            break;
          }
        }
        
        for (const grape of allGrapes) {
          if (pageText.toLowerCase().includes(grape.toLowerCase())) {
            foundGrapes.push(grape);
          }
        }
        foundGrapes = [...new Set(foundGrapes)].slice(0, 3);
        
        if (foundDO || foundGrapes.length > 0) {
          const info = [
            foundDO ? `D.O.: ${foundDO}` : '',
            foundGrapes.length > 0 ? `Uvas: ${foundGrapes.join(', ')}` : ''
          ].filter(Boolean).join(' | ');
          
          // Solo añadir si es info nueva
          if (!results.some(r => r.info === info)) {
            results.push({
              source: 'Google',
              name: wineName,
              info: info
            });
            console.log('[AI] ✅ Google info:', info);
          }
          
          // Si encontramos D.O., no seguir buscando
          if (foundDO) break;
        }
      } catch (e) {
        console.log('[AI] Error en query Google:', e.message);
      }
    }
  } catch (e) {
    console.log('[AI] Error Google general:', e.message);
  }

  return results;
}

/**
 * Buscar información PRECISA sobre vinos en múltiples fuentes
 */
async function searchWineInfo(query) {
  const results = [];
  
  // Extraer SOLO el nombre del vino
  let wineName = query.toLowerCase();
  
  // Lista de palabras a eliminar (en orden)
  const wordsToRemove = [
    'háblame', 'hablame', 'dime', 'cuéntame', 'cuentame', 'busca', 'buscar',
    'info', 'información', 'informacion', 'sobre', 'acerca de', 'acerca',
    'en la web', 'en internet', 'del vino', 'el vino', 'un vino', 'la vino',
    'del', 'de', 'el', 'la', 'un', 'una', 'los', 'las', 'vino', 'vinos'
  ];
  
  for (const word of wordsToRemove) {
    wineName = wineName.replace(new RegExp(`^${word}\\s*`, 'gi'), '');
    wineName = wineName.replace(new RegExp(`\\s*${word}$`, 'gi'), '');
  }
  
  // Quitar caracteres especiales y normalizar espacios
  wineName = wineName
    .replace(/[?¿!¡.,;:]/g, '')
    .trim()
    .replace(/\s+/g, ' ');

  // Capitalizar cada palabra
  wineName = wineName.split(' ').map(w => 
    w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : ''
  ).filter(w => w.length > 0).join(' ');

  console.log('[AI] 🔍 Nombre del vino extraído:', wineName);

  try {
    // 1. Buscar en Wikipedia España - D.O. y bodegas
    const wikiSearches = [
      `${wineName} bodega vino`,
      `${wineName} denominación origen`,
      wineName
    ];

    for (const search of wikiSearches) {
      try {
        const wikiUrl = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(search)}&format=json&srlimit=5`;
        const wikiResponse = await axios.get(wikiUrl, { timeout: 4000 });
        
        if (wikiResponse.data?.query?.search?.length > 0) {
          for (const result of wikiResponse.data.query.search.slice(0, 3)) {
            // Filtrar resultados relevantes a vinos
            const title = result.title.toLowerCase();
            if (title.includes('vino') || title.includes('bodega') || 
                title.includes('ribeiro') || title.includes('ribera') ||
                title.includes('rioja') || title.includes('denominación') ||
                title.includes(wineName.toLowerCase().split(' ')[0])) {
              
              const extractUrl = `https://es.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(result.title)}&prop=extracts&exintro=true&explaintext=true&format=json`;
              const extractResponse = await axios.get(extractUrl, { timeout: 4000 });
              const pages = extractResponse.data?.query?.pages;
              
              if (pages) {
                const pageId = Object.keys(pages)[0];
                if (pages[pageId]?.extract && pages[pageId].extract.length > 100) {
                  results.push({
                    source: 'Wikipedia',
                    title: result.title,
                    content: pages[pageId].extract.substring(0, 600)
                  });
                }
              }
            }
          }
        }
      } catch (e) { /* continuar */ }
    }

    // 2. Buscar directamente la bodega/vino en Google via SerpAPI alternativa
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(wineName + ' bodega vino denominación origen uva')}&format=json&no_html=1&skip_disambig=1`;
      const ddgResponse = await axios.get(ddgUrl, { timeout: 4000 });
      
      if (ddgResponse.data?.Abstract) {
        results.push({
          source: 'DuckDuckGo',
          title: ddgResponse.data.Heading || wineName,
          content: ddgResponse.data.Abstract
        });
      }
      
      // Buscar en temas relacionados
      if (ddgResponse.data?.RelatedTopics?.length > 0) {
        for (const topic of ddgResponse.data.RelatedTopics.slice(0, 5)) {
          if (topic.Text && (
            topic.Text.toLowerCase().includes('vino') ||
            topic.Text.toLowerCase().includes('bodega') ||
            topic.Text.toLowerCase().includes('uva') ||
            topic.Text.toLowerCase().includes('denominación')
          )) {
            results.push({
              source: 'DuckDuckGo',
              title: 'Info relacionada',
              content: topic.Text
            });
          }
        }
      }
    } catch (e) { /* continuar */ }

    // 3. Buscar en Wikipedia la D.O. específica si el nombre sugiere una región
    const doKeywords = {
      'ribeiro': 'Denominación de Origen Ribeiro',
      'ribera': 'Denominación de Origen Ribera del Duero',
      'rioja': 'Denominación de Origen Calificada Rioja',
      'rueda': 'Denominación de Origen Rueda',
      'rías baixas': 'Denominación de Origen Rías Baixas',
      'rias baixas': 'Denominación de Origen Rías Baixas',
      'priorat': 'Denominación de Origen Calificada Priorat',
      'penedés': 'Denominación de Origen Penedès',
      'penedes': 'Denominación de Origen Penedès',
      'toro': 'Denominación de Origen Toro',
      'jumilla': 'Denominación de Origen Jumilla',
      'bierzo': 'Denominación de Origen Bierzo',
      'godello': 'Godello (uva)',
      'albariño': 'Albariño',
      'albarino': 'Albariño',
      'mencía': 'Mencía (uva)',
      'mencia': 'Mencía (uva)',
      'tempranillo': 'Tempranillo',
      'garnacha': 'Garnacha'
    };

    for (const [keyword, wikiTitle] of Object.entries(doKeywords)) {
      if (wineName.toLowerCase().includes(keyword)) {
        try {
          const doUrl = `https://es.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=extracts&exintro=true&explaintext=true&format=json`;
          const doResponse = await axios.get(doUrl, { timeout: 4000 });
          const pages = doResponse.data?.query?.pages;
          
          if (pages) {
            const pageId = Object.keys(pages)[0];
            if (pages[pageId]?.extract) {
              results.push({
                source: 'Wikipedia D.O.',
                title: wikiTitle,
                content: pages[pageId].extract.substring(0, 500)
              });
            }
          }
        } catch (e) { /* continuar */ }
        break;
      }
    }

  } catch (error) {
    console.error('Error en búsqueda de vino:', error.message);
  }

  // 4. Si no hay suficientes resultados, buscar en páginas de vinos (scraping)
  if (results.length < 2) {
    console.log('[AI] Pocos resultados, buscando en tiendas de vinos...');
    try {
      const webResults = await scrapeWineFromWeb(wineName);
      for (const wr of webResults) {
        results.push({
          source: wr.source,
          title: wr.name,
          content: wr.info
        });
      }
    } catch (e) {
      console.log('[AI] Error en scraping:', e.message);
    }
  }

  // Combinar resultados únicos
  const combined = results
    .map(r => `[${r.source}] ${r.title || ''}: ${r.content || r.info || ''}`)
    .filter(r => r.length > 20)
    .join('\n\n')
    .substring(0, 2500);

  console.log('[AI] Resultados totales encontrados:', results.length);
  
  return {
    results,
    combined: combined || null
  };
}

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

    // Detectar si es una pregunta sobre un vino específico - patrones ampliados
    const wineQuestionPatterns = [
      /qu[ée]\s+(tipo|clase|es|significa|variedad|uva)/i,
      /h[aá]blame\s+de/i,
      /información\s+(de|sobre|del)/i,
      /conoces?\s+(el\s+vino|a)/i,
      /sabes?\s+(qu[ée]|algo|sobre)/i,
      /cu[aá]l\s+es/i,
      /d[ií]me\s+(sobre|qu[ée])/i,
      /es\s+un\s+vino/i,
      /de\s+d[oó]nde\s+es/i,
      /origen\s+de/i,
      /busca\s+(en\s+la\s+web|info|información)/i,
      /buscar\s+(sobre|vino|info)/i,
      /sobre\s+el\s+vino/i,
      /vino\s+\w+/i,
      /bodega\s+\w+/i,
      /menc[ií]a/i,
      /tempranillo/i,
      /albari[ñn]o/i,
      /godello/i,
      /garnacha/i,
      /verdejo/i,
      /ribeiro/i,
      /ribera/i,
      /rioja/i,
      /d\.?o\.?\s+\w+/i,
      /denominaci[oó]n/i,
      /adega/i,
      /bodegas?\s+\w+/i
    ];
    
    // También buscar si el mensaje parece ser un nombre de vino (corto, con mayúsculas)
    const looksLikeWineName = message.length < 50 && /[A-Z]/.test(message) && !/^(hola|gracias|ok|si|no|vale)$/i.test(message);
    
    const isWineQuestion = wineQuestionPatterns.some(pattern => pattern.test(message)) || looksLikeWineName;
    let webSearchInfo = '';
    
    // DESACTIVADO: Búsqueda web (es muy lenta - solo usa info de la bodega)
    // Solo buscar en web si el usuario EXPLÍCITAMENTE pide buscar en internet
    const needsWebSearch = /busca\s+(en\s+)?(internet|web|google)|información\s+de\s+internet/i.test(message);
    
    if (isWineQuestion && needsWebSearch) {
      // Extraer posible nombre de vino de la pregunta
      const cleanedMessage = message.replace(/[?¿!¡.,]/g, '').trim();
      console.log('[AI] Búsqueda web solicitada para:', cleanedMessage);
      const searchResult = await searchWineInfo(cleanedMessage);
      if (searchResult.combined && searchResult.combined.length > 50) {
        webSearchInfo = `\n\n🔍 INFORMACIÓN DE BÚSQUEDA WEB (USA ESTOS DATOS):\n${searchResult.combined}`;
        console.log('[AI] ✅ Info encontrada:', searchResult.combined.substring(0, 200));
      }
    }

    // Construir contexto de vinos OPTIMIZADO (solo info esencial)
    const allWines = context?.wines || [];
    const winesContext = allWines.slice(0, 50).map(w => {
      // Solo enviar la info más importante para reducir tokens
      const parts = [
        `"${w.name}"`,
        w.type || 'Vino',
        w.region || '',
        w.grape || '',
        `Stock: ${w.stock || 0}`,
        `Rest: ${w.restaurantStock || 0}`,
        `€${w.price || 0}`
      ].filter(Boolean);
      return parts.join(' | ');
    }).join('\n') || 'Sin vinos';
    
    // Contar vinos agotados y formatear con TODA su información
    const agotadosWines = allWines.filter(w => (w.stock || 0) === 0);
    const agotadosCount = agotadosWines.length;
    const agotadosList = agotadosCount > 0 
      ? agotadosWines.map(w => {
          const parts = [
            `"${w.name}"`,
            w.type ? `(${w.type})` : null,
            w.year ? `${w.year}` : null,
            w.region ? `D.O. ${w.region}` : null,
            w.grape ? `Uvas: ${w.grape}` : null,
            w.price ? `€${w.price}` : null
          ].filter(Boolean);
          return parts.join(' - ');
        }).join('\n')
      : 'NO HAY VINOS AGOTADOS';

    // Construir prompt del sistema OPTIMIZADO
    const systemPrompt = `Asistente IA de VinosStK con control total de la bodega.
${webSearchInfo}

VINOS DISPONIBLES:
${winesContext}

${agotadosCount > 0 ? `AGOTADOS (${agotadosCount}): ${agotadosList}` : 'Sin vinos agotados.'}

ACCIONES (responde en JSON cuando modifiques stock/vinos):

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

3. **add_wine** - Agregar vino(s) con TODOS los campos:
   { "wines": [{
     "name": "Marqués de Riscal Reserva",
     "type": "Tinto",
     "year": 2019,
     "region": "D.O.Ca. Rioja",
     "grape": "Tempranillo, Graciano, Mazuelo",
     "price": 18,
     "stock": 25,
     "restaurantStock": 8
   }]}
   
   CAMPOS OBLIGATORIOS para cada vino:
   - name: Nombre completo del vino (bodega + tipo)
   - type: "Tinto", "Blanco", "Rosado", "Espumoso", "Dulce"
   - year: Año de cosecha (2018-2023)
   - region: D.O. completa (ej: "D.O. Ribera del Duero", "D.O. Rías Baixas")
   - grape: Uvas utilizadas (ej: "Tempranillo", "Albariño, Godello")
   - price: Precio en euros (8-50)
   - stock: Stock en bodega (10-50)
   - restaurantStock: Stock en restaurante (5-20)

4. **delete_wine** - Eliminar vino(s):
   Un vino: { "name": "NombreVino" }
   Varios vinos: { "wines": [{ "name": "Vino1" }, { "name": "Vino2" }] }
   TODOS los vinos: { "all": true }

5. **none** - Solo responder sin acción

FORMATO DE RESPUESTA (JSON):
{
  "action": "update_stock" | "set_stock" | "add_wine" | "delete_wine" | "none",
  "response": "Mensaje confirmando la acción",
  "data": { ... }
}

REGLAS RÁPIDAS:
- Responde EN ESPAÑOL siempre
- Lista vinos por stock: de MENOR a MAYOR
- Agotados: si hay en lista, responde con ellos; si no hay, di "no hay"
- Operaciones: responde en JSON { "action", "response", "data" }
- Preguntas: responde en texto normal

Responde en español. JSON para operaciones, texto para preguntas. Usa SOLO vinos de la lista.`;

    // Construir historial de mensajes
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Agregar historial previo (limitado a 3 para velocidad)
    if (history && Array.isArray(history)) {
      history.slice(-3).forEach(msg => {
        messages.push({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
        });
      });
    }

    // Agregar mensaje actual
    messages.push({ role: 'user', content: message });

    // Llamar a OpenAI con configuración optimizada para velocidad
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      messages,
      temperature: 0.3, // Más directo y rápido
      maxTokens: 800 // Reducido para respuestas más concisas y rápidas
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
