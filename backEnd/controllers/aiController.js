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
    
    if (isWineQuestion) {
      // Extraer posible nombre de vino de la pregunta
      const cleanedMessage = message.replace(/[?¿!¡.,]/g, '').trim();
      const allWines = context?.wines || [];
      
      // Revisar si el vino está en la bodega
      const wineInBodega = allWines.some(w => 
        cleanedMessage.toLowerCase().includes(w.name.toLowerCase()) ||
        w.name.toLowerCase().includes(cleanedMessage.toLowerCase())
      );
      
      // Solo buscar en web si:
      // 1. El usuario explícitamente pide buscar en internet, O
      // 2. El vino NO está en la bodega (para responder preguntas sobre vinos externos)
      const explicitWebRequest = /busca\s+(en\s+)?(internet|web|google)|información\s+de\s+internet/i.test(message);
      const needsWebSearch = explicitWebRequest || !wineInBodega;
      
      if (needsWebSearch) {
        console.log('[AI] Buscando info web para:', cleanedMessage, wineInBodega ? '(búsqueda explícita)' : '(vino no en bodega)');
        const searchResult = await searchWineInfo(cleanedMessage);
        if (searchResult.combined && searchResult.combined.length > 50) {
          webSearchInfo = `\n\n🔍 INFORMACIÓN DE BÚSQUEDA WEB (USA ESTOS DATOS):\n${searchResult.combined}`;
          console.log('[AI] ✅ Info encontrada:', searchResult.combined.substring(0, 200));
        } else {
          webSearchInfo = `\n\n⚠️ No encontré información adicional en internet.`;
          console.log('[AI] ⚠️ Info limitada para:', cleanedMessage);
        }
      } else {
        console.log('[AI] ✅ Vino encontrado en bodega, sin búsqueda web:', cleanedMessage);
      }
    }

    // Función para validar si una descripción es real (no basura)
    const isValidDescription = (desc) => {
      if (!desc || typeof desc !== 'string') return false;
      const cleaned = desc.trim();
      if (cleaned.length < 15) return false; // Mínimo 15 caracteres
      // Rechazar si es solo caracteres repetidos (ej: "qsdasdasd", "aaaaaaa")
      const uniqueChars = new Set(cleaned.toLowerCase().replace(/\s/g, ''));
      if (uniqueChars.size < 5) return false; // Debe tener al menos 5 caracteres únicos
      return true;
    };

    // Construir contexto de vinos OPTIMIZADO (solo info esencial + descripción VÁLIDA)
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
        `€${w.price || 0}`,
        isValidDescription(w.description) ? `Desc: ${w.description}` : null
      ].filter(Boolean);
      return parts.join(' | ');
    }).join('\n') || 'Sin vinos';
    
    // Vinos con descripción VÁLIDA (pre-filtrados para la IA)
    const winesWithDesc = allWines.filter(w => isValidDescription(w.description));
    const winesWithDescList = winesWithDesc.length > 0
      ? winesWithDesc.map(w => `"${w.name}" | ${w.type} | ${w.region || ''} | €${w.price} | Desc: ${w.description}`).join('\n')
      : 'NINGUNO - No hay vinos con descripción registrada';
    
    console.log(`\n📊 [DEBUG] ${winesWithDesc.length} vinos con descripción válida\n`);
    
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
    const systemPrompt = `Asistente IA de VinosStK con CONTROL TOTAL de la bodega.
Tienes acceso COMPLETO para: crear, modificar, eliminar vinos, cambiar stock, precios, descripciones, imágenes, etc.
${webSearchInfo}

⚠️ INSTRUCCIÓN CRÍTICA: La lista siguiente contiene ${allWines.slice(0, 50).length} vinos. DEBES revisar TODA la lista COMPLETA antes de responder cualquier pregunta sobre características, cantidades o búsquedas. NO te detengas en el primer resultado.

VINOS DISPONIBLES (${allWines.slice(0, 50).length} vinos):
${winesContext}

${agotadosCount > 0 ? `AGOTADOS (${agotadosCount}): ${agotadosList}` : 'Sin vinos agotados.'}

📝 VINOS CON DESCRIPCIÓN (${winesWithDesc.length} vinos):
${winesWithDescList}
(Si preguntan "¿qué vinos tienen descripción?" → copia SOLO esta lista, NO agregues otros)

ACCIONES (responde en JSON cuando modifiques stock/vinos):

1. **update_stock** - SUMAR o RESTAR stock (uno o varios vinos):
   
   ⭐ RESTAR de UN vino:
   { "wines": [{ "name": "Albariño Mar de Frades", "stockChange": -5, "field": "stock" }] }
   
   ⭐ RESTAR de VARIOS vinos:
   { "wines": [
     { "name": "Albariño Mar de Frades", "stockChange": -3, "field": "stock" },
     { "name": "Ribera del Duero", "stockChange": -2, "field": "stock" },
     { "name": "Godello Valdeorras", "stockChange": -1, "field": "stock" }
   ]}
   
   ⭐ SUMAR a UN vino:
   { "wines": [{ "name": "Rioja Reserva", "stockChange": 20, "field": "stock" }] }
   
   ⭐ SUMAR a VARIOS vinos:
   { "wines": [
     { "name": "Rioja Reserva", "stockChange": 15, "field": "stock" },
     { "name": "Priorat", "stockChange": 10, "field": "stock" },
     { "name": "Ribeiro", "stockChange": 25, "field": "stock" }
   ]}
   
   ⭐ MEZCLAR (restar unos, sumar otros):
   { "wines": [
     { "name": "Vino1", "stockChange": -5, "field": "stock" },
     { "name": "Vino2", "stockChange": 10, "field": "stock" }
   ]}
   
   REGLAS:
   - stockChange: NEGATIVO (-) para RESTAR/QUITAR
   - stockChange: POSITIVO (+) para SUMAR/AÑADIR
   - field: "stock" (bodega) o "restaurantStock" (restaurante)
   
   EJEMPLOS DE COMANDOS DEL USUARIO:
   - "Quita 5 botellas de Albariño" → stockChange: -5
   - "Resta 3 de Rioja y 2 de Ribera" → wines: [Rioja: -3, Ribera: -2]
   - "Añade 20 unidades de Godello" → stockChange: 20
   - "Suma 10 a Priorat y 15 a Ribeiro" → wines: [Priorat: 10, Ribeiro: 15]
   - "Vendí 2 Albariño y 3 Rioja" → stockChange: -2 y -3

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
     "restaurantStock": 8,
     "description": "Vino excepcional de crianza...",
     "image": "https://ejemplo.com/imagen.jpg"
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

4. **update_wine** - Modificar CUALQUIER campo de un vino (nombre, tipo, año, región, uvas, precio, descripción, imagen, etc.):
   
   ⚠️ USA ESTA ACCIÓN PARA:
   - Cambiar precio, descripción, imagen, nombre, tipo, año, región, uvas, ubicación
   - Añadir o modificar descripciones
   - Cambiar imágenes/fotos
   - Actualizar cualquier información del vino
   
   ⚠️ NO USES update_wine PARA STOCK - usa update_stock o set_stock
   
   EJEMPLOS:
   
   Cambiar descripción:
   { "name": "Albariño Mar de Frades", "updates": { 
     "description": "Vino blanco fresco y aromático de Rías Baixas con notas cítricas"
   }}
   
   Cambiar precio e imagen:
   { "name": "Ribera del Duero Reserva", "updates": { 
     "price": 28,
     "image": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3"
   }}
   
   Varios vinos a la vez:
   { "wines": [
     { "name": "Vino1", "updates": { "price": 20, "description": "Descripción nueva" }},
     { "name": "Vino2", "updates": { "type": "Rosado", "region": "D.O. Navarra" }}
   ]}
   
   CAMPOS MODIFICABLES:
   - name: Cambiar nombre del vino
   - type: Cambiar tipo ("Tinto", "Blanco", "Rosado", "Espumoso", "Dulce")
   - year: Cambiar año de cosecha
   - region: Cambiar región/D.O.
   - grape: Cambiar variedades de uva (string separado por comas)
   - price: Cambiar precio (número)
   - description: Cambiar/añadir descripción completa
   - image: Cambiar URL de imagen
   - alcoholContent: Cambiar % de alcohol
   - location: Cambiar ubicación física en bodega

5. **delete_wine** - Eliminar vino(s):
   
   ⚠️ IMPORTANTE: SIEMPRE incluye el nombre EXACTO del vino en "data"
   
   Eliminar UN vino:
   {
     "action": "delete_wine",
     "response": "He eliminado el vino 'NombreDelVino' de la bodega.",
     "data": { "name": "NombreDelVino" }
   }
   
   Eliminar VARIOS vinos:
   {
     "action": "delete_wine",
     "response": "He eliminado los vinos Vino1, Vino2 y Vino3.",
     "data": { "wines": [{ "name": "Vino1" }, { "name": "Vino2" }, { "name": "Vino3" }] }
   }
   
   Eliminar TODOS los vinos:
   {
     "action": "delete_wine",
     "response": "He eliminado todos los vinos de la bodega.",
     "data": { "all": true }
   }

6. **none** - Solo responder sin acción (consultas, preguntas, información)

🚨🚨🚨 REGLAS ABSOLUTAS - LEE ESTO 🚨🚨🚨

1. NUNCA MUESTRES JSON AL USUARIO. El JSON es SOLO para el sistema interno.
2. RESPONDE SIEMPRE en formato JSON válido (sin texto antes ni después).
3. El usuario SOLO verá el contenido del campo "response".
4. Los datos para ejecutar la acción van SIEMPRE dentro de "data".

FORMATO OBLIGATORIO (SIEMPRE):
{
  "action": "update_stock" | "set_stock" | "add_wine" | "update_wine" | "delete_wine" | "none",
  "response": "Texto amigable que verá el usuario",
  "data": { ... los datos para ejecutar la acción ... }
}

EJEMPLOS CORRECTOS:

✅ Eliminar un vino:
{"action":"delete_wine","response":"¡Listo! He eliminado el vino Mario de la bodega.","data":{"name":"Mario"}}

✅ Modificar un vino:
{"action":"update_wine","response":"¡Hecho! He cambiado el nombre del vino.","data":{"name":"Mario","updates":{"name":"Vino Nuevo"}}}

✅ Modificar varios vinos:
{"action":"update_wine","response":"¡Listo! He renombrado los vinos.","data":{"wines":[{"name":"Mario","updates":{"name":"Vino 1"}},{"name":"Otro","updates":{"name":"Vino 2"}}]}}

✅ BUSCAR Y PONER FOTO de un vino (busca en internet automáticamente):
{"action":"update_wine","response":"¡Listo! He buscado y actualizado la foto del vino Rioja.","data":{"name":"Rioja","updates":{"searchImage":true}}}

✅ BUSCAR FOTO para varios vinos:
{"action":"update_wine","response":"¡Hecho! He buscado fotos para todos los vinos.","data":{"wines":[{"name":"Rioja","updates":{"searchImage":true}},{"name":"Albariño","updates":{"searchImage":true}}]}}

🖼️ IMPORTANTE PARA IMÁGENES:
- Cuando el usuario pida "ponle una foto", "busca una imagen", "actualiza la foto" → usa searchImage: true
- El sistema buscará automáticamente una imagen apropiada del vino en internet
- NO inventes URLs de imágenes, solo pon searchImage: true

✅ Solo consulta:
{"action":"none","response":"Tienes 5 vinos tintos en la bodega.","data":null}

❌ ERRORES A EVITAR:
- NO escribas JSON suelto en la respuesta
- NO pongas "wines" fuera de "data" 
- NO uses markdown o texto antes/después del JSON
- NO muestres el JSON como parte de tu respuesta

🚫 REGLA CRÍTICA: NUNCA INVENTES INFORMACIÓN 🚫
- SOLO usa datos de "VINOS DISPONIBLES", NO inventes nada
- NO uses tu conocimiento general de vinos

⚠️ **FORMATO DE VINOS**: "Nombre" | Tipo | Región | Uvas | Stock | €precio | Desc: texto
- Si ves "Desc:" → SÍ tiene descripción
- Si NO ves "Desc:" → NO tiene descripción

**CUANDO PREGUNTEN "¿QUÉ VINOS TIENEN DESCRIPCIÓN?"**:
- COPIA EXACTAMENTE la sección "📝 VINOS CON DESCRIPCIÓN" de arriba
- NO agregues otros vinos que no estén en esa sección
- Si dice "${winesWithDesc.length} vinos", lista EXACTAMENTE ${winesWithDesc.length}, ni más ni menos

**CUANDO PREGUNTEN POR UN VINO ESPECÍFICO**:
- Si tiene "Desc:" → muestra esa descripción
- Si NO tiene "Desc:" → di "Este vino no tiene descripción registrada"

- Lista vinos por stock: de MENOR a MAYOR
- Para acciones: responde SOLO con JSON
- Para preguntas: responde con {"action":"none","response":"tu respuesta aquí","data":null}`;

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
        
        // CORRECCIÓN: Si la IA puso "wines" fuera de "data", moverlo dentro
        if (parsedResponse.wines && !parsedResponse.data) {
          console.log('[AI] Corrigiendo formato: moviendo "wines" dentro de "data"');
          parsedResponse.data = { wines: parsedResponse.wines };
          delete parsedResponse.wines;
        }
        
        // CORRECCIÓN: Si la IA puso "name" y "updates" fuera de "data", moverlos
        if (parsedResponse.name && parsedResponse.updates && !parsedResponse.data) {
          console.log('[AI] Corrigiendo formato: moviendo datos dentro de "data"');
          parsedResponse.data = { name: parsedResponse.name, updates: parsedResponse.updates };
          delete parsedResponse.name;
          delete parsedResponse.updates;
        }
        
        // CORRECCIÓN: Si solo hay "name" sin "data", moverlo
        if (parsedResponse.name && !parsedResponse.data && parsedResponse.action === 'delete_wine') {
          console.log('[AI] Corrigiendo formato: moviendo "name" dentro de "data"');
          parsedResponse.data = { name: parsedResponse.name };
          delete parsedResponse.name;
        }
        
      } else {
        parsedResponse = {
          action: 'none',
          response: text,
          data: null
        };
      }
    } catch (parseError) {
      console.error('Error parseando respuesta de IA:', parseError);
      console.error('Texto recibido:', text);
      parsedResponse = {
        action: 'none',
        response: text,
        data: null
      };
    }

    console.log('[AI Command]', { 
      message, 
      action: parsedResponse.action,
      hasData: !!parsedResponse.data,
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
 * Buscar imagen REAL de un vino específico en internet
 */
async function searchRealWineImage(wineName) {
  console.log(`🖼️ [IMAGE SEARCH] Buscando imagen real de: "${wineName}"`);
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
  };

  const foundImages = [];

  try {
    // 1. Buscar en Vivino (tienen imágenes de botellas de vinos)
    const vivinoSearchUrl = `https://www.vivino.com/search/wines?q=${encodeURIComponent(wineName)}`;
    console.log('[IMAGE] Buscando en Vivino...');
    
    const vivinoRes = await axios.get(vivinoSearchUrl, { headers, timeout: 8000 });
    const $v = cheerio.load(vivinoRes.data);
    
    // Buscar imágenes de vinos en Vivino
    $v('img[src*="vivino"], img[data-src*="vivino"], img[src*="images.vivino"]').each((i, el) => {
      let src = $v(el).attr('src') || $v(el).attr('data-src');
      if (src && src.includes('vivino') && !src.includes('avatar') && !src.includes('logo')) {
        // Mejorar calidad de imagen
        src = src.replace(/\/\d+x\d+\//, '/400x400/');
        foundImages.push({ url: src, source: 'Vivino' });
      }
    });
    
    console.log(`[IMAGE] Vivino: ${foundImages.length} imágenes encontradas`);
  } catch (e) {
    console.log('[IMAGE] Error Vivino:', e.message);
  }

  try {
    // 2. Buscar en Google Images
    const googleImageUrl = `https://www.google.com/search?q=${encodeURIComponent(wineName + ' vino botella')}&tbm=isch&hl=es`;
    console.log('[IMAGE] Buscando en Google Images...');
    
    const googleRes = await axios.get(googleImageUrl, { headers, timeout: 8000 });
    const $g = cheerio.load(googleRes.data);
    
    // Extraer URLs de imágenes del HTML de Google
    const htmlContent = googleRes.data;
    
    // Buscar URLs de imágenes en el JSON embebido
    const imgRegex = /\["(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi;
    let match;
    let count = 0;
    while ((match = imgRegex.exec(htmlContent)) !== null && count < 5) {
      const imgUrl = match[1];
      if (imgUrl && !imgUrl.includes('google') && !imgUrl.includes('gstatic') && imgUrl.length < 500) {
        foundImages.push({ url: imgUrl, source: 'Google' });
        count++;
      }
    }
    
    console.log(`[IMAGE] Google: ${count} imágenes encontradas`);
  } catch (e) {
    console.log('[IMAGE] Error Google:', e.message);
  }

  try {
    // 3. Buscar en Vinissimus (tienda española)
    const vinissimusUrl = `https://www.vinissimus.com/es/buscar/?q=${encodeURIComponent(wineName)}`;
    console.log('[IMAGE] Buscando en Vinissimus...');
    
    const vinissimusRes = await axios.get(vinissimusUrl, { headers, timeout: 8000 });
    const $vs = cheerio.load(vinissimusRes.data);
    
    $vs('img[src*="vinissimus"], img[data-src*="vinissimus"]').each((i, el) => {
      let src = $vs(el).attr('src') || $vs(el).attr('data-src');
      if (src && !src.includes('logo') && !src.includes('icon')) {
        if (!src.startsWith('http')) src = 'https://www.vinissimus.com' + src;
        foundImages.push({ url: src, source: 'Vinissimus' });
      }
    });
    
    console.log(`[IMAGE] Vinissimus: imágenes encontradas`);
  } catch (e) {
    console.log('[IMAGE] Error Vinissimus:', e.message);
  }

  try {
    // 4. Buscar en DuckDuckGo Images (más permisivo)
    const ddgUrl = `https://duckduckgo.com/?q=${encodeURIComponent(wineName + ' vino botella')}&iax=images&ia=images`;
    console.log('[IMAGE] Buscando en DuckDuckGo...');
    
    const ddgRes = await axios.get(ddgUrl, { 
      headers: {
        ...headers,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }, 
      timeout: 8000 
    });
    
    // DuckDuckGo usa un token, intentar extraer imágenes del HTML
    const ddgHtml = ddgRes.data;
    const ddgImgRegex = /vqd[^"]*"([^"]+)"|"(https?:\/\/[^"]+\.(?:jpg|jpeg|png)[^"]*)"/gi;
    let ddgMatch;
    let ddgCount = 0;
    while ((ddgMatch = ddgImgRegex.exec(ddgHtml)) !== null && ddgCount < 3) {
      const imgUrl = ddgMatch[2];
      if (imgUrl && !imgUrl.includes('duckduckgo') && imgUrl.length < 500) {
        foundImages.push({ url: imgUrl, source: 'DuckDuckGo' });
        ddgCount++;
      }
    }
  } catch (e) {
    console.log('[IMAGE] Error DuckDuckGo:', e.message);
  }

  // Devolver la primera imagen encontrada o null
  if (foundImages.length > 0) {
    console.log(`🖼️ [IMAGE SEARCH] ✅ Encontradas ${foundImages.length} imágenes`);
    return foundImages[0].url;
  }

  console.log(`🖼️ [IMAGE SEARCH] ❌ No se encontraron imágenes para: "${wineName}"`);
  return null;
}

/**
 * Búsqueda web - Busca imágenes REALES de vinos
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

    console.log(`🖼️ [WEB SEARCH] Buscando imagen para: "${query}"`);

    // Intentar buscar imagen real del vino
    const realImage = await searchRealWineImage(query);
    
    if (realImage) {
      console.log(`🖼️ [WEB SEARCH] ✅ Imagen real encontrada: ${realImage}`);
      return res.json({
        success: true,
        query,
        image: realImage,
        isReal: true,
        results: [{ url: realImage, title: query }]
      });
    }

    // Fallback: imágenes genéricas de Unsplash de alta calidad
    console.log(`🖼️ [WEB SEARCH] ⚠️ Usando imagen genérica de fallback`);
    const wineImages = [
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
      'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800&q=80',
      'https://images.unsplash.com/photo-1586370434639-0fe43b2d32e6?w=800&q=80',
      'https://images.unsplash.com/photo-1567529692333-de9fd6772897?w=800&q=80',
      'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=800&q=80',
      'https://images.unsplash.com/photo-1560148218-1a83060f7b32?w=800&q=80',
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80',
      'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=800&q=80',
    ];

    // Seleccionar imagen basada en el nombre (consistente)
    const nameHash = query.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const selectedImage = wineImages[nameHash % wineImages.length];

    res.json({
      success: true,
      query,
      image: selectedImage,
      isReal: false,
      results: [{ url: selectedImage, title: query }]
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
