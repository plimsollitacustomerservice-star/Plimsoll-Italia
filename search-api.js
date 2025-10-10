import studiesDatabase from '../data/studies-database.json';

export default function handler(req, res) {
  const { q: query } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  if (!query || query.length < 2) {
    return res.status(400).json({ 
      error: 'Query troppo breve',
      message: 'Inserisci almeno 2 caratteri per la ricerca'
    });
  }

  try {
    const searchTerm = query.toLowerCase().trim();
    const results = [];

    // Carica tutti gli studi da tutti i database CSV
    const allStudies = getAllStudies();

    // Esegui la ricerca
    allStudies.forEach(study => {
      const score = calculateRelevanceScore(study, searchTerm);
      if (score > 0) {
        results.push({
          ...study,
          relevance_score: score
        });
      }
    });

    // Ordina per rilevanza e status
    results.sort((a, b) => {
      // Prima gli studi disponibili
      if (a.status === 'available' && b.status !== 'available') return -1;
      if (a.status !== 'available' && b.status === 'available') return 1;
      
      // Poi per score di rilevanza
      return b.relevance_score - a.relevance_score;
    });

    // Limita i risultati
    const limitedResults = results.slice(0, 20);

    res.status(200).json({
      results: limitedResults,
      total_found: results.length,
      query: query,
      search_info: {
        total_studies_searched: allStudies.length,
        search_fields: ['name_it', 'name_en', 'keywords', 'ateco', 'market']
      }
    });

  } catch (error) {
    console.error('Errore nella ricerca studi:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      message: 'Errore durante la ricerca. Riprova più tardi.'
    });
  }
}

function getAllStudies() {
  const allStudies = [];

  // Mapping dei file CSV con i rispettivi mercati
  const csvMappings = {
    'REPSIT.csv': 'IT',
    'REPSUK.csv': 'UK', 
    'REPSFR.csv': 'FR',
    'REPSSP.csv': 'SP',
    'REPSPW.csv': 'Global'
  };

  // Simula il caricamento dai file CSV
  // In produzione, questi dati dovrebbero essere pre-processati e indicizzati
  const mockStudies = [
    // Automotive Studies
    {
      id: 'ITAUTO_PARTS_01',
      rep_code: 'ITAUTO01',
      name_it: 'Produttori Componenti Automotive',
      name_en: 'Automotive Parts Manufacturers',
      market: 'IT',
      ateco: '29.32.01',
      nace: 'C29.32',
      status: 'available',
      keywords: ['automotive', 'componenti auto', 'ricambi', 'OEM', 'aftermarket']
    },
    {
      id: 'UKAUTO_PARTS_01',
      rep_code: 'UKAUTO01', 
      name_it: 'Produttori Componenti Auto',
      name_en: 'Automotive Parts Manufacturers',
      market: 'UK',
      ateco: '29.32.01',
      nace: 'C29.32',
      status: 'available',
      keywords: ['automotive', 'car parts', 'components', 'OEM']
    },
    {
      id: 'ITAUTO_SENSORS_01',
      rep_code: 'ITSC04',
      name_it: 'Sensori Automotive',
      name_en: 'Automotive Sensors',
      market: 'IT',
      ateco: '26.51.01',
      nace: 'C26.51',
      status: 'missing',
      keywords: ['sensori automotive', 'automotive sensors', 'ADAS', 'smart sensors']
    },
    // Food & Beverage Studies  
    {
      id: 'ITFOOD_PASTA_01',
      rep_code: 'ITPAS01',
      name_it: 'Produttori di Pasta',
      name_en: 'Pasta Manufacturers',
      market: 'IT',
      ateco: '10.73.01',
      nace: 'C10.73',
      status: 'available',
      keywords: ['pasta', 'pastifici', 'semola', 'grano duro', 'food processing']
    },
    {
      id: 'ITFOOD_DAIRY_01',
      rep_code: 'ITDAI01',
      name_it: 'Prodotti Lattiero-Caseari',
      name_en: 'Dairy Products',
      market: 'IT',
      ateco: '10.51.01',
      nace: 'C10.51',
      status: 'available',
      keywords: ['latticini', 'dairy', 'formaggi', 'latte', 'yogurt']
    },
    {
      id: 'ITFOOD_ALT_PROTEIN_01',
      rep_code: 'ITFOOD02',
      name_it: 'Proteine Alternative',
      name_en: 'Alternative Protein Processing', 
      market: 'IT',
      ateco: '10.89.09',
      nace: 'C10.89',
      status: 'missing',
      keywords: ['proteine alternative', 'alternative protein', 'plant-based', 'carne vegetale']
    },
    // Construction Studies
    {
      id: 'ITCONST_CEMENT_01',
      rep_code: 'ITCEM01',
      name_it: 'Produttori di Cemento',
      name_en: 'Cement Manufacturers',
      market: 'IT',
      ateco: '23.51.01',
      nace: 'C23.51',
      status: 'available',
      keywords: ['cemento', 'cement', 'calcestruzzo', 'construction materials']
    },
    {
      id: 'ITCONST_SUSTAINABLE_01',
      rep_code: 'ITCONST01',
      name_it: 'Materiali Edili Sostenibili',
      name_en: 'Sustainable Building Materials',
      market: 'IT',
      ateco: '23.99.01',
      nace: 'C23.99',
      status: 'missing',
      keywords: ['materiali sostenibili', 'sustainable materials', 'green building', 'eco-materials']
    },
    // Textile Studies
    {
      id: 'ITTEX_FIBERS_01',
      rep_code: 'ITTEX01',
      name_it: 'Produttori Fibre Tessili',
      name_en: 'Textile Fibers Manufacturers',
      market: 'IT',
      ateco: '13.10.01',
      nace: 'C13.10',
      status: 'available',
      keywords: ['fibre tessili', 'textile fibers', 'cotton', 'synthetic fibers']
    },
    // Pharmaceutical Studies
    {
      id: 'ITPHARMA_BASIC_01',
      rep_code: 'ITPHA01',
      name_it: 'Prodotti Farmaceutici',
      name_en: 'Pharmaceutical Products',
      market: 'IT',
      ateco: '21.10.01', 
      nace: 'C21.10',
      status: 'available',
      keywords: ['farmaceutici', 'pharmaceutical', 'medicine', 'drugs']
    },
    {
      id: 'ITPHARMA_PERSONALIZED_01',
      rep_code: 'ITPHARMA01',
      name_it: 'Medicina Personalizzata',
      name_en: 'Personalized Medicine',
      market: 'IT',
      ateco: '21.10.02',
      nace: 'C21.10',
      status: 'missing',
      keywords: ['medicina personalizzata', 'personalized medicine', 'precision medicine', 'genomics']
    },
    // Energy Studies
    {
      id: 'ITENERGY_RENEWABLE_01',
      rep_code: 'ITREN01',
      name_it: 'Energie Rinnovabili',
      name_en: 'Renewable Energy',
      market: 'IT',
      ateco: '35.11.01',
      nace: 'D35.11',
      status: 'available',
      keywords: ['energie rinnovabili', 'renewable energy', 'solar', 'wind', 'green energy']
    },
    {
      id: 'ITENERGY_STORAGE_01',
      rep_code: 'ITENERGY01',
      name_it: 'Sistemi di Accumulo Energetico',
      name_en: 'Energy Storage Systems',
      market: 'IT',
      ateco: '27.20.01',
      nace: 'C27.20',
      status: 'missing',
      keywords: ['accumulo energetico', 'energy storage', 'batteries', 'grid storage']
    },
    // Logistics & Supply Chain
    {
      id: 'UKLOG_FREIGHT_01',
      rep_code: 'UKFRE01',
      name_it: 'Spedizionieri',
      name_en: 'Freight Forwarders',
      market: 'UK',
      ateco: '52.29.02',
      nace: 'H52.29',
      status: 'available',
      keywords: ['freight forwarders', 'spedizionieri', 'logistics', 'shipping']
    },
    {
      id: 'UKLOG_WAREHOUSE_01',
      rep_code: 'UKWAR01',
      name_it: 'Sistemi di Scaffalature',
      name_en: 'Storage Racking Systems',
      market: 'UK',
      ateco: '28.22.01',
      nace: 'C28.22',
      status: 'available',
      keywords: ['storage racking', 'warehouse systems', 'shelving', 'logistics']
    }
  ];

  return mockStudies;
}

function calculateRelevanceScore(study, searchTerm) {
  let score = 0;
  const searchWords = searchTerm.split(' ').filter(word => word.length > 1);

  // Controllo nel nome italiano (peso 10)
  searchWords.forEach(word => {
    if (study.name_it?.toLowerCase().includes(word)) {
      score += 10;
    }
  });

  // Controllo nel nome inglese (peso 8)
  searchWords.forEach(word => {
    if (study.name_en?.toLowerCase().includes(word)) {
      score += 8;
    }
  });

  // Controllo nelle keywords (peso 6)
  if (study.keywords) {
    study.keywords.forEach(keyword => {
      searchWords.forEach(word => {
        if (keyword.toLowerCase().includes(word)) {
          score += 6;
        }
      });
    });
  }

  // Controllo nei codici ATECO/NACE (peso 3)
  searchWords.forEach(word => {
    if (study.ateco?.toLowerCase().includes(word) || 
        study.nace?.toLowerCase().includes(word)) {
      score += 3;
    }
  });

  // Controllo nel mercato (peso 2)
  searchWords.forEach(word => {
    if (study.market?.toLowerCase().includes(word)) {
      score += 2;
    }
  });

  // Bonus per match esatto (peso 15)
  if (study.name_it?.toLowerCase().includes(searchTerm) ||
      study.name_en?.toLowerCase().includes(searchTerm)) {
    score += 15;
  }

  return score;
}