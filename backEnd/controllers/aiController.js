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
 * Detectar la INTENCIÓN del usuario ANTES de llamar a la IA
 * Esto evita confusiones entre foto/descripción/stock/etc
 */
function detectUserIntent(message) {
  const messageLower = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // PATRONES DE INTENCIÓN - ordenados por prioridad
  const intents = [
    // 1. CAMBIAR/PONER FOTO/IMAGEN
    {
      type: 'change_image',
      patterns: [
        /cambiar?(le)?\s*(la\s*)?(foto|imagen)/i,
        /pon(er|le)?\s*(una\s*)?(foto|imagen)/i,
        /actualizar?\s*(la\s*)?(foto|imagen)/i,
        /buscar?\s*(una\s*)?(foto|imagen)/i,
        /(foto|imagen)\s+(del?|al?)\s+vino/i,
        /nueva\s+(foto|imagen)/i,
        /(foto|imagen)\s+nueva/i,
        /cambiar?\s+(la\s+)?(foto|imagen)\s+(del?|al?)/i
      ],
      action: 'update_wine',
      field: 'image'
    },
    // 2. BUSCAR DESCRIPCIÓN EN WEB (automático)
    {
      type: 'search_description',
      patterns: [
        /buscar?\s*(una\s*)?descripcion/i,
        /busca(r|le)?\s+descripcion/i,
        /busca\s+(la\s+)?descripcion\s+(del?|al?|para)/i,
        /pon(er|le)?\s+(una\s+)?descripcion\s+(del?|al?)\s+/i,
        /descripcion\s+(del?|al?|para)\s+.*\s+(en\s+)?(la\s+)?(web|internet)/i,
        /generar?\s*(una\s*)?descripcion/i,
        /crear?\s*(una\s*)?descripcion/i,
        /descripcion(es)?\s+de\s+(la\s+)?web/i,
        /buscar?\s+descripcion(es)?/i,
        /agrega(r|les?)?\s+(una\s+)?descripcion/i,
        /anadir?(les?)?\s+(una\s+)?descripcion/i,
        /pon(er|le|les)?\s+(una\s+)?descripcion/i,
        /descripcion(es)?\s+(a\s+)?(cada|todos|los)\s+vino/i
      ],
      action: 'update_wine',
      field: 'description',
      searchWeb: true
    },
    // 2b. CAMBIAR DESCRIPCIÓN (manual - texto específico)
    {
      type: 'change_description',
      patterns: [
        /cambiar?(le)?\s*(la\s*)?descripcion\s+a\s+["']/i,
        /cambiar?(le)?\s*(la\s*)?descripcion\s+por\s+["']/i,
        /pon(er|le)?\s*(la\s*)?descripcion\s*[:=]\s*/i,
        /actualizar?\s*(la\s*)?descripcion\s+a\s+/i,
        /descripcion\s*[:=]\s*["']/i
      ],
      action: 'update_wine',
      field: 'description'
    },
    // 3. CAMBIAR PRECIO
    {
      type: 'change_price',
      patterns: [
        /cambiar?(le)?\s*(el\s*)?precio/i,
        /pon(er|le)?\s*(el\s*)?precio/i,
        /actualizar?\s*(el\s*)?precio/i,
        /precio\s+(del?|al?)/i,
        /nuevo\s+precio/i
      ],
      action: 'update_wine',
      field: 'price'
    },
    // 4. CAMBIAR STOCK (SUMAR/RESTAR)
    {
      type: 'modify_stock',
      patterns: [
        /quita(r)?\s+\d+/i,
        /resta(r)?\s+\d+/i,
        /anadir?\s+\d+/i,
        /sumar?\s+\d+/i,
        /agregar?\s+\d+/i,
        /\d+\s+(botella|unidad)/i,
        /vendi\s+\d+/i,
        /vendimos\s+\d+/i,
        /han\s+entrado\s+\d+/i,
        /llegaron\s+\d+/i
      ],
      action: 'update_stock'
    },
    // 5. ESTABLECER STOCK EXACTO
    {
      type: 'set_stock',
      patterns: [
        /pon(er|le)?\s+(\d+|el\s+stock)/i,
        /stock\s+(a|en|de)\s+\d+/i,
        /establecer?\s+stock/i,
        /\d+\s+en\s+stock/i
      ],
      action: 'set_stock'
    },
    // 6. ELIMINAR VINO
    {
      type: 'delete_wine',
      patterns: [
        /eliminar?\s+(el\s+)?vino/i,
        /borrar?\s+(el\s+)?vino/i,
        /quitar?\s+(el\s+)?vino/i,
        /elimina(r|lo)/i,
        /borra(r|lo)/i
      ],
      action: 'delete_wine'
    },
    // 7. AGREGAR VINO NUEVO
    {
      type: 'add_wine',
      patterns: [
        /agregar?\s+(un\s+)?nuevo?\s*vino/i,
        /anadir?\s+(un\s+)?nuevo?\s*vino/i,
        /crear?\s+(un\s+)?nuevo?\s*vino/i,
        /nuevo\s+vino/i,
        /vino\s+nuevo/i
      ],
      action: 'add_wine'
    },
    // 8. CONSULTA DESCRIPCIÓN
    {
      type: 'query_description',
      patterns: [
        /que\s+(vinos?|tienen?)\s+descripcion/i,
        /vinos?\s+con\s+descripcion/i,
        /tienen?\s+descripcion/i,
        /cuales?\s+tienen?\s+descripcion/i
      ],
      action: 'none',
      queryType: 'description_list'
    },
    // 9. CONSULTA AGOTADOS
    {
      type: 'query_out_of_stock',
      patterns: [
        /vinos?\s+agotados?/i,
        /que\s+esta\s+agotado/i,
        /sin\s+stock/i,
        /cuales?\s+estan?\s+agotados?/i
      ],
      action: 'none',
      queryType: 'out_of_stock'
    }
  ];

  // Detectar intención
  for (const intent of intents) {
    for (const pattern of intent.patterns) {
      if (pattern.test(messageLower)) {
        console.log(`[INTENT] ✅ Detectada intención: ${intent.type}`);
        return intent;
      }
    }
  }

  // Sin intención específica detectada
  return { type: 'general', action: 'none' };
}

/**
 * Buscar vino en la bodega por nombre (con coincidencia parcial)
 */
function findWineInBodega(wineName, allWines) {
  if (!wineName || !allWines || allWines.length === 0) return null;
  
  const searchName = wineName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  
  // 1. Coincidencia exacta
  let found = allWines.find(w => 
    w.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === searchName
  );
  if (found) return found;
  
  // 2. El vino contiene el nombre buscado
  found = allWines.find(w => 
    w.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(searchName)
  );
  if (found) return found;
  
  // 3. El nombre buscado contiene el nombre del vino
  found = allWines.find(w => 
    searchName.includes(w.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
  );
  if (found) return found;
  
  // 4. Coincidencia por palabras
  const searchWords = searchName.split(/\s+/).filter(w => w.length > 2);
  for (const wine of allWines) {
    const wineNameNorm = wine.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const matches = searchWords.filter(word => wineNameNorm.includes(word));
    if (matches.length >= 1 && matches.length >= searchWords.length * 0.5) {
      return wine;
    }
  }
  
  return null;
}

/**
 * Extraer nombre de vino del mensaje del usuario
 */
function extractWineNameFromMessage(message) {
  const messageLower = message.toLowerCase();
  
  // Patrones para extraer nombre de vino
  const extractPatterns = [
    /(?:del?|al?)\s+vino\s+["']?([^"'\n,]+?)["']?\s*(?:por|$|\.)/i,
    /vino\s+["']?([^"'\n,]+?)["']?\s*(?:por|$|\.)/i,
    /(?:cambiale|ponle|actualiza)\s+(?:la\s+)?(?:foto|imagen|descripcion|precio)\s+(?:del?|al?)\s+["']?([^"'\n,]+?)["']?/i,
    /["']([^"']+)["']/i,  // Texto entre comillas
  ];
  
  for (const pattern of extractPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      // Limpiar el nombre extraído
      let name = match[1].trim()
        .replace(/^(el|la|los|las|un|una)\s+/i, '')
        .replace(/\s+(por|con|de|del|al)$/i, '')
        .trim();
      
      if (name.length > 1 && name.length < 100) {
        return name;
      }
    }
  }
  
  // Si no encontró con patrones, intentar extraer palabras con mayúscula
  const words = message.split(/\s+/);
  const capitalizedWords = words.filter(w => 
    /^[A-ZÁÉÍÓÚÑ]/.test(w) && 
    !['Cambiale', 'Cambia', 'Ponle', 'Pon', 'Actualiza', 'Busca', 'Este', 'La', 'El', 'Del', 'Al', 'Por'].includes(w)
  );
  
  if (capitalizedWords.length > 0) {
    return capitalizedWords.join(' ');
  }
  
  return null;
}

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

    const allWines = context?.wines || [];
    
    // ========== DETECCIÓN DE INTENCIÓN PREVIA ==========
    const userIntent = detectUserIntent(message);
    console.log(`[AI] 🎯 Intención detectada: ${userIntent.type} (acción: ${userIntent.action})`);
    
    // Extraer nombre del vino mencionado
    const mentionedWineName = extractWineNameFromMessage(message);
    let foundWine = null;
    
    if (mentionedWineName) {
      foundWine = findWineInBodega(mentionedWineName, allWines);
      console.log(`[AI] 🍷 Vino mencionado: "${mentionedWineName}" → ${foundWine ? `Encontrado: "${foundWine.name}"` : 'NO encontrado'}`);
    }
    
    // ========== RESPUESTAS DIRECTAS SIN IA (para casos claros) ==========
    
    // Caso: Cambiar imagen de un vino que existe
    if (userIntent.type === 'change_image' && foundWine) {
      console.log(`[AI] ⚡ Respuesta directa: Cambiar imagen de "${foundWine.name}"`);
      
      try {
        // Buscar imagen REAL del vino
        const imageUrl = await searchRealWineImage(foundWine.name);
        
        if (imageUrl) {
          // Actualizar directamente en la base de datos
          const wineId = foundWine._id || foundWine.id;
          await Wine.findByIdAndUpdate(wineId, { image: imageUrl });
          
          console.log(`[AI] ✅ Imagen actualizada para "${foundWine.name}": ${imageUrl}`);
          
          return res.json({
            success: true,
            action: 'update_wine',
            response: `✅ ¡Listo! He actualizado la foto del vino "${foundWine.name}".`,
            data: { name: foundWine.name, updates: { image: imageUrl } },
            imageUpdated: true
          });
        } else {
          // No se encontró imagen, usar genérica
          const fallbackImages = [
            'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=800&fit=crop&q=80',
            'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&h=800&fit=crop&q=80',
            'https://images.unsplash.com/photo-1586370434639-0fe43b2d32e6?w=600&h=800&fit=crop&q=80'
          ];
          const nameHash = foundWine.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const fallbackUrl = fallbackImages[nameHash % fallbackImages.length];
          
          const wineId = foundWine._id || foundWine.id;
          await Wine.findByIdAndUpdate(wineId, { image: fallbackUrl });
          
          console.log(`[AI] ⚠️ Usando imagen genérica para "${foundWine.name}": ${fallbackUrl}`);
          
          return res.json({
            success: true,
            action: 'update_wine',
            response: `✅ He actualizado la foto del vino "${foundWine.name}" con una imagen de alta calidad.`,
            data: { name: foundWine.name, updates: { image: fallbackUrl } },
            imageUpdated: true
          });
        }
      } catch (imgError) {
        console.error(`[AI] ❌ Error actualizando imagen:`, imgError);
        // Continuar con el flujo normal de la IA
      }
    }
    
    // Caso: Cambiar imagen de vino que NO existe
    if (userIntent.type === 'change_image' && mentionedWineName && !foundWine) {
      console.log(`[AI] ⚠️ Vino no encontrado para cambiar imagen: "${mentionedWineName}"`);
      
      // Buscar sugerencias similares
      const suggestions = allWines
        .filter(w => w.name.toLowerCase().includes(mentionedWineName.toLowerCase().substring(0, 3)))
        .map(w => w.name)
        .slice(0, 3);
      
      const suggestionText = suggestions.length > 0 
        ? `\n\n¿Quizás te refieres a alguno de estos?: ${suggestions.join(', ')}`
        : '\n\nPuedes decirme el nombre exacto del vino para buscarlo.';
      
      return res.json({
        success: true,
        action: 'none',
        response: `No encontré un vino llamado "${mentionedWineName}" en la bodega.${suggestionText}`,
        data: null
      });
    }
    
    // ========== PRIMERO: Detectar si quiere descripciones para TODOS/CADA vino ==========
    const wantsAllDescriptions = /descripcion(es)?\s+(de\s+)?(todos|all|varios|cada|los\s+vinos)/i.test(message) ||
                                  /busca(r)?\s+descripcion(es)?\s+(para\s+)?(todos|all|cada)/i.test(message) ||
                                  /pon(er|le|les)?\s+descripcion(es)?\s+(a\s+)?(todos|all|cada)/i.test(message) ||
                                  /agrega(r|les?)?\s+(una\s+)?descripcion\s+(a\s+)?(todos|cada|los)/i.test(message) ||
                                  /(a\s+)?cada\s+vino/i.test(message) ||
                                  /(a\s+)?todos\s+(los\s+)?vinos/i.test(message) ||
                                  /descripcion(es)?\s+a\s+cada/i.test(message) ||
                                  /descripcion(es)?\s+a\s+todos/i.test(message);
    
    const mentionsDescription = /descripcion/i.test(message);
    
    // Caso: Buscar descripciones para TODOS los vinos (tiene prioridad)
    if (wantsAllDescriptions && mentionsDescription) {
      console.log(`[AI] ⚡ Detectado: Buscar descripciones para TODOS los vinos`);
      console.log(`[AI] Mensaje: "${message}"`);
      console.log(`[AI] wantsAllDescriptions: ${wantsAllDescriptions}, mentionsDescription: ${mentionsDescription}`);
      
      // Filtrar vinos sin descripción o con descripción vacía
      const winesWithoutDesc = allWines.filter(w => !w.description || w.description.trim().length < 20);
      
      if (winesWithoutDesc.length === 0) {
        return res.json({
          success: true,
          action: 'none',
          response: '✅ Todos los vinos ya tienen descripción.',
          data: null
        });
      }
      
      // Limitar a 10 vinos para no sobrecargar
      const winesToProcess = winesWithoutDesc.slice(0, 10);
      const updatedWines = [];
      const errors = [];
      
      for (const wine of winesToProcess) {
        try {
          const description = await searchWineDescription(wine.name, wine.type, wine.region);
          if (description) {
            const wineId = wine._id || wine.id;
            await Wine.findByIdAndUpdate(wineId, { description });
            updatedWines.push({ name: wine.name, description });
            console.log(`[AI] ✅ Descripción actualizada: ${wine.name}`);
          }
        } catch (err) {
          errors.push(wine.name);
          console.error(`[AI] ❌ Error con ${wine.name}:`, err.message);
        }
      }
      
      const remaining = winesWithoutDesc.length - winesToProcess.length;
      const remainingText = remaining > 0 ? `\n\n(Quedan ${remaining} vinos más sin descripción)` : '';
      
      return res.json({
        success: true,
        action: 'update_wine',
        response: `✅ ¡Listo! He actualizado las descripciones de ${updatedWines.length} vinos:\n\n${updatedWines.map(w => `• ${w.name}`).join('\n')}${remainingText}`,
        data: { wines: updatedWines.map(w => ({ name: w.name, updates: { description: w.description } })) },
        descriptionUpdated: true,
        updatedCount: updatedWines.length
      });
    }
    
    // ========== SEGUNDO: Buscar descripción de UN vino específico ==========
    if (userIntent.type === 'search_description' && foundWine && !wantsAllDescriptions) {
      console.log(`[AI] ⚡ Respuesta directa: Buscar descripción de "${foundWine.name}"`);
      
      try {
        // Buscar descripción en la web
        const description = await searchWineDescription(foundWine.name, foundWine.type, foundWine.region);
        
        if (description) {
          // Actualizar directamente en la base de datos
          const wineId = foundWine._id || foundWine.id;
          await Wine.findByIdAndUpdate(wineId, { description });
          
          console.log(`[AI] ✅ Descripción actualizada para "${foundWine.name}"`);
          
          return res.json({
            success: true,
            action: 'update_wine',
            response: `✅ ¡Listo! He buscado y actualizado la descripción del vino "${foundWine.name}":\n\n"${description}"`,
            data: { name: foundWine.name, updates: { description } },
            descriptionUpdated: true
          });
        }
      } catch (descError) {
        console.error(`[AI] ❌ Error buscando descripción:`, descError);
      }
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
    
    // NO buscar en web para acciones de modificación (cambiar foto, descripción, etc.)
    const isModificationAction = ['change_image', 'change_description', 'change_price', 'modify_stock', 'set_stock', 'delete_wine', 'add_wine'].includes(userIntent.type);
    
    const isWineQuestion = !isModificationAction && (wineQuestionPatterns.some(pattern => pattern.test(message)) || looksLikeWineName);
    let webSearchInfo = '';
    
    if (isWineQuestion) {
      // Extraer posible nombre de vino de la pregunta
      const cleanedMessage = message.replace(/[?¿!¡.,]/g, '').trim();
      
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
    // allWines ya está definido arriba
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

    // Información de contexto para la IA
    const intentContext = userIntent.type !== 'general' 
      ? `\n🎯 INTENCIÓN DETECTADA: ${userIntent.type.toUpperCase()} (acción: ${userIntent.action})
${foundWine ? `🍷 VINO OBJETIVO: "${foundWine.name}" - Este vino SÍ EXISTE en la bodega` : mentionedWineName ? `⚠️ VINO MENCIONADO: "${mentionedWineName}" - Buscar en la lista` : ''}`
      : '';

    // Construir prompt del sistema OPTIMIZADO
    const systemPrompt = `Asistente IA de VinosStK con CONTROL TOTAL de la bodega.
Tienes acceso COMPLETO para: crear, modificar, eliminar vinos, cambiar stock, precios, descripciones, imágenes, etc.
${intentContext}
${webSearchInfo}

🚨🚨🚨 REGLA CRÍTICA - LEE CON ATENCIÓN 🚨🚨🚨

**DISTINGUIR ENTRE TIPOS DE PETICIONES:**

1. **FOTO/IMAGEN** → Cuando el usuario mencione: foto, imagen, picture
   - Palabras clave: "cambiale la foto", "ponle imagen", "actualiza la foto", "busca foto"
   - Acción: update_wine con searchImage: true
   - ❌ NO RESPONDER sobre descripción cuando pidan foto
   - ❌ NO RESPONDER "no tiene descripción" cuando pidan foto

2. **DESCRIPCIÓN** → Cuando el usuario mencione: descripción, describir
   - Palabras clave: "cambiale la descripción", "añade descripción", "qué descripción tiene"
   - Acción: update_wine con description: "texto"
   
3. **STOCK** → Cuando el usuario mencione: botellas, unidades, cantidad, añadir, quitar, restar
   - Acción: update_stock o set_stock

4. **CONSULTA** → Preguntas sobre información
   - Acción: none

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

🖼️🖼️🖼️ MUY IMPORTANTE PARA FOTOS/IMÁGENES 🖼️🖼️🖼️

CUANDO EL USUARIO PIDA CAMBIAR **FOTO** O **IMAGEN**:
- Palabras clave: "cambiale la foto", "ponle foto", "actualiza la foto", "busca imagen", "nueva foto"
- SIEMPRE usa: searchImage: true
- NUNCA respondas sobre descripción
- NUNCA digas "no tiene descripción registrada"
- El sistema buscará automáticamente una imagen apropiada del vino en internet
- NO inventes URLs de imágenes, solo pon searchImage: true

EJEMPLOS DE PETICIONES DE FOTO:
- "cambiale la foto al vino Vandama" → {"action":"update_wine","response":"¡Listo! He buscado una nueva foto para Vandama.","data":{"name":"Vandama","updates":{"searchImage":true}}}
- "ponle imagen al Rioja" → {"action":"update_wine","response":"¡Hecho! He actualizado la imagen del Rioja.","data":{"name":"Rioja","updates":{"searchImage":true}}}
- "actualiza la foto de todos los vinos" → Usar array de wines con searchImage: true para cada uno

❌ ERRORES A EVITAR CON FOTOS:
- Si piden foto, NO digas "Este vino no tiene descripción registrada" 
- Si piden foto, NO confundas con descripción
- Si piden foto, USA searchImage: true

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

🔍 **BUSCAR VINOS - COINCIDENCIA FLEXIBLE**:
- Si el usuario dice "Vandama", busca vinos que CONTENGAN "Vandama" en su nombre
- Usa coincidencia parcial: "Rioja" puede encontrar "Marqués de Rioja Reserva"
- NO digas "no existe" si hay un vino similar en la lista
- Si no encuentras coincidencia exacta, menciona vinos similares

⚠️ **FORMATO DE VINOS**: "Nombre" | Tipo | Región | Uvas | Stock | €precio | Desc: texto
- Si ves "Desc:" → SÍ tiene descripción
- Si NO ves "Desc:" → NO tiene descripción

**CUANDO PREGUNTEN "¿QUÉ VINOS TIENEN DESCRIPCIÓN?"**:
- COPIA EXACTAMENTE la sección "📝 VINOS CON DESCRIPCIÓN" de arriba
- NO agregues otros vinos que no estén en esa sección
- Si dice "${winesWithDesc.length} vinos", lista EXACTAMENTE ${winesWithDesc.length}, ni más ni menos

**CUANDO PREGUNTEN POR LA DESCRIPCIÓN DE UN VINO ESPECÍFICO**:
- Si tiene "Desc:" → muestra esa descripción
- Si NO tiene "Desc:" → di "Este vino no tiene descripción registrada"
- ⚠️ SOLO di esto cuando pregunten por DESCRIPCIÓN, NO cuando pidan FOTO

**CUANDO PIDAN CAMBIAR LA FOTO/IMAGEN**:
- NUNCA respondas sobre descripción
- USA action: update_wine con searchImage: true
- Ejemplo: {"action":"update_wine","response":"¡Listo!","data":{"name":"NOMBRE_VINO","updates":{"searchImage":true}}}

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
 * Validar si una URL de imagen es segura y confiable
 */
function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  // Debe ser HTTPS
  if (!url.startsWith('https://')) return false;
  
  // Debe ser una imagen
  if (!/\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)) return false;
  
  // Lista negra de dominios problemáticos
  const blacklist = [
    'vinosyaguardientes.com',
    'encrypted-tbn',
    'googleusercontent.com',
    't0.gstatic.com',
    't1.gstatic.com',
    't2.gstatic.com',
    't3.gstatic.com'
  ];
  
  if (blacklist.some(domain => url.includes(domain))) return false;
  
  // URL no debe ser demasiado larga
  if (url.length > 300) return false;
  
  return true;
}

/**
 * Buscar DESCRIPCIÓN de un vino específico en internet
 */
async function searchWineDescription(wineName, wineType = '', wineRegion = '') {
  console.log(`📝 [DESC SEARCH] Buscando descripción para: "${wineName}"`);
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
  };

  let descriptions = [];
  let wineInfo = { grapes: [], region: '', type: wineType };

  try {
    // 1. Buscar en Google con términos específicos de vino
    const googleQuery = `"${wineName}" vino descripción notas cata bodega`;
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}&hl=es&num=10`;
    console.log('[DESC] Buscando en Google...');
    
    const googleRes = await axios.get(googleUrl, { headers, timeout: 10000 });
    const $g = cheerio.load(googleRes.data);
    
    // Extraer snippets de Google
    $g('.VwiC3b, .IsZvec, .lEBKkf').each((i, el) => {
      const text = $g(el).text().trim();
      if (text && text.length > 50 && text.length < 500) {
        // Filtrar solo textos que parezcan descripciones de vino
        if (/vino|bodega|uva|aroma|sabor|nota|cata|barrica|crianza|tanino|frut/i.test(text)) {
          descriptions.push(text);
        }
      }
    });
    
    // Extraer info de D.O. y uvas del texto
    const fullText = $g('body').text();
    const doPatterns = [
      /D\.?O\.?\s*(Ca\.?)?\s*(Ribeira Sacra|Ribeiro|Rías Baixas|Ribera del Duero|Rioja|Rueda|Bierzo|Priorat|Valdeorras|Monterrei|Toro|Jumilla|Somontano|Penedés|Navarra)/i
    ];
    const grapePatterns = [
      /(?:uvas?|variedad|elaborado con)\s*:?\s*(Mencía|Godello|Albariño|Tempranillo|Garnacha|Verdejo|Monastrell|Graciano|Mazuelo|Viura|Macabeo)/gi
    ];
    
    for (const pattern of doPatterns) {
      const match = fullText.match(pattern);
      if (match) wineInfo.region = match[0];
    }
    
    let grapeMatch;
    while ((grapeMatch = grapePatterns[0].exec(fullText)) !== null) {
      if (!wineInfo.grapes.includes(grapeMatch[1])) {
        wineInfo.grapes.push(grapeMatch[1]);
      }
    }
    
    console.log(`[DESC] Google: ${descriptions.length} descripciones encontradas`);
  } catch (e) {
    console.log('[DESC] Error Google:', e.message);
  }

  try {
    // 2. Buscar en DuckDuckGo
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(wineName + ' vino descripción notas de cata')}`;
    console.log('[DESC] Buscando en DuckDuckGo...');
    
    const ddgRes = await axios.get(ddgUrl, { headers, timeout: 10000 });
    const $ddg = cheerio.load(ddgRes.data);
    
    $ddg('.result__snippet').each((i, el) => {
      const text = $ddg(el).text().trim();
      if (text && text.length > 50 && text.length < 500) {
        if (/vino|bodega|uva|aroma|sabor|nota|cata|barrica/i.test(text)) {
          descriptions.push(text);
        }
      }
    });
    
    console.log(`[DESC] DuckDuckGo: Total ${descriptions.length} descripciones`);
  } catch (e) {
    console.log('[DESC] Error DuckDuckGo:', e.message);
  }

  // Si encontramos descripciones, crear una descripción completa
  if (descriptions.length > 0) {
    // Tomar la mejor descripción (la más completa)
    const bestDesc = descriptions
      .sort((a, b) => b.length - a.length)[0]
      .replace(/\s+/g, ' ')
      .trim();
    
    // Construir descripción final
    let finalDesc = bestDesc;
    
    // Añadir info de uvas y región si la encontramos y no está en la descripción
    if (wineInfo.grapes.length > 0 && !finalDesc.toLowerCase().includes(wineInfo.grapes[0].toLowerCase())) {
      finalDesc = `Elaborado con ${wineInfo.grapes.join(', ')}. ${finalDesc}`;
    }
    
    // Limpiar y limitar longitud
    finalDesc = finalDesc
      .replace(/\.\s*\./g, '.')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (finalDesc.length > 300) {
      finalDesc = finalDesc.substring(0, 297) + '...';
    }
    
    console.log(`📝 [DESC SEARCH] ✅ Descripción encontrada: ${finalDesc.substring(0, 100)}...`);
    return finalDesc;
  }

  // Si no encontramos nada, generar descripción genérica basada en el tipo
  console.log(`📝 [DESC SEARCH] ⚠️ Generando descripción genérica para: "${wineName}"`);
  
  const genericDescs = {
    'Tinto': `${wineName} es un vino tinto de carácter, con aromas a frutos rojos maduros y notas especiadas. En boca es equilibrado, con taninos suaves y un final persistente.`,
    'Blanco': `${wineName} es un vino blanco fresco y aromático, con notas florales y cítricas. En boca es ligero y refrescante, ideal para disfrutar como aperitivo o con mariscos.`,
    'Rosado': `${wineName} es un vino rosado elegante, con aromas a fresas y flores. En boca es fresco y afrutado, perfecto para días de verano.`,
    'Espumoso': `${wineName} es un espumoso de fina burbuja, con aromas a manzana verde y brioche. En boca es cremoso y refrescante.`,
    'Dulce': `${wineName} es un vino dulce con intensos aromas a frutas confitadas y miel. En boca es untuoso y equilibrado.`
  };
  
  return genericDescs[wineType] || genericDescs['Tinto'].replace('tinto', 'elegante');
}

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
        if (isValidImageUrl(src)) {
          foundImages.push({ url: src, source: 'Vivino' });
        }
      }
    });
    
    console.log(`[IMAGE] Vivino: ${foundImages.length} imágenes válidas encontradas`);
  } catch (e) {
    console.log('[IMAGE] Error Vivino:', e.message);
  }

  try {
    // 2. Buscar en Google Images (solo URLs seguras)
    const googleImageUrl = `https://www.google.com/search?q=${encodeURIComponent(wineName + ' vino botella')}&tbm=isch&hl=es`;
    console.log('[IMAGE] Buscando en Google Images...');
    
    const googleRes = await axios.get(googleImageUrl, { headers, timeout: 8000 });
    const htmlContent = googleRes.data;
    
    // Buscar URLs de imágenes en el JSON embebido
    const imgRegex = /\["(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi;
    let match;
    let count = 0;
    while ((match = imgRegex.exec(htmlContent)) !== null && count < 3) {
      const imgUrl = match[1];
      // Validar URL antes de agregar
      if (isValidImageUrl(imgUrl)) {
        foundImages.push({ url: imgUrl, source: 'Google' });
        count++;
      }
    }
    
    console.log(`[IMAGE] Google: ${count} imágenes válidas encontradas`);
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
        if (isValidImageUrl(src)) {
          foundImages.push({ url: src, source: 'Vinissimus' });
        }
      }
    });
    
    console.log(`[IMAGE] Vinissimus: imágenes válidas encontradas`);
  } catch (e) {
    console.log('[IMAGE] Error Vinissimus:', e.message);
  }

  // Omitimos DuckDuckGo por problemas de fiabilidad y CORS
  // Si necesitamos más fuentes, mejor usar APIs oficiales como Unsplash o Pexels

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

    // Fallback: imágenes genéricas de alta calidad de Unsplash y Pexels
    console.log(`🖼️ [WEB SEARCH] ⚠️ Usando imagen genérica de fallback`);
    const wineImages = [
      // Botellas de vino tinto
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1586370434639-0fe43b2d32e6?w=600&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&h=800&fit=crop&q=80',
      // Botellas de vino blanco
      'https://images.unsplash.com/photo-1560148218-1a83060f7b32?w=600&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1567529692333-de9fd6772897?w=600&h=800&fit=crop&q=80',
      // Botellas genéricas elegantes
      'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=600&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=600&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600&h=800&fit=crop&q=80',
      // Más variedad de Pexels (CDN confiable)
      'https://images.pexels.com/photos/2647933/pexels-photo-2647933.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop',
      'https://images.pexels.com/photos/3155472/pexels-photo-3155472.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop',
    ];

    // Seleccionar imagen basada en el nombre (consistente para el mismo vino)
    const nameHash = query.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const selectedImage = wineImages[nameHash % wineImages.length];

    res.json({
      success: true,
      query,
      image: selectedImage,
      isReal: false,
      message: 'Imagen genérica de alta calidad (no se encontró imagen específica del vino)',
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
