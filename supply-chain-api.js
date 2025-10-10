import studiesDatabase from '../data/studies-database.json';
import supplyChainMapping from '../data/supply-chain-mapping.json';

export default function handler(req, res) {
  const { studyId } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  try {
    // Trova lo studio principale
    const mainStudy = findStudyById(studyId);
    if (!mainStudy) {
      return res.status(404).json({ error: 'Studio non trovato' });
    }

    // Identifica l'industria dello studio
    const industry = identifyStudyIndustry(studyId);
    if (!industry) {
      return res.status(404).json({ error: 'Industria non identificata per questo studio' });
    }

    // Identifica il livello dello studio nella supply chain
    const studyLevel = identifyStudyLevel(studyId, industry);
    if (!studyLevel) {
      return res.status(404).json({ error: 'Livello supply chain non identificato' });
    }

    // Genera studi correlati
    const correlatedStudies = generateCorrelatedStudies(industry, studyLevel, studyId);

    // Costruisci la risposta
    const response = {
      main_study: mainStudy,
      industry: {
        id: industry,
        ...supplyChainMapping.supply_chain_industries[industry]
      },
      current_level: studyLevel,
      correlated_studies: correlatedStudies,
      cross_market_studies: findCrossMarketStudies(mainStudy),
      request_info: {
        contact_email: supplyChainMapping.ui_settings.links.contact_email,
        plimsoll_site: supplyChainMapping.ui_settings.links.plimsoll_site,
        info_link: supplyChainMapping.ui_settings.links.plimsoll_info
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Errore API supply-chain:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
}

// Funzioni helper
function findStudyById(studyId) {
  // Cerca negli studi disponibili nel database
  for (const market of Object.values(studiesDatabase)) {
    const study = market.find(s => s.id === studyId || s.rep_code === studyId);
    if (study) return study;
  }

  // Cerca negli studi delle mappature supply chain
  for (const industry of Object.values(supplyChainMapping.supply_chain_industries)) {
    for (const level of Object.values(industry.levels)) {
      const allStudies = [...level.studies.available, ...level.studies.missing];
      const study = allStudies.find(s => s.id === studyId);
      if (study) return study;
    }
  }

  return null;
}

function identifyStudyIndustry(studyId) {
  // Cerca nelle mappature supply chain
  for (const [industryKey, industryData] of Object.entries(supplyChainMapping.supply_chain_industries)) {
    for (const levelData of Object.values(industryData.levels)) {
      const allStudies = [...levelData.studies.available, ...levelData.studies.missing];
      if (allStudies.some(study => study.id === studyId)) {
        return industryKey;
      }
    }
  }

  // Se non trovato nelle mappature, usa logica basata su keywords
  const study = findStudyById(studyId);
  if (!study) return null;

  return identifyIndustryByKeywords(study.keywords || []);
}

function identifyIndustryByKeywords(keywords) {
  const keywordMappings = {
    'AUTOMOTIVE': ['automotive', 'auto', 'car', 'vehicle', 'motore', 'componenti auto', 'ricambi'],
    'FOOD_BEVERAGE': ['food', 'beverage', 'alimentare', 'cibo', 'pasta', 'dairy', 'meat', 'bakery'],
    'CONSTRUCTION': ['construction', 'building', 'cement', 'concrete', 'edilizia', 'costruzioni'],
    'TEXTILE_FASHION': ['textile', 'fashion', 'clothing', 'tessile', 'abbigliamento', 'fibres'],
    'PHARMACEUTICAL': ['pharmaceutical', 'pharma', 'medical', 'farmaceutico', 'medicina'],
    'ENERGY': ['energy', 'renewable', 'electricity', 'energetico', 'elettrico', 'solare']
  };

  for (const [industry, industryKeywords] of Object.entries(keywordMappings)) {
    if (keywords.some(keyword => 
      industryKeywords.some(ik => 
        keyword.toLowerCase().includes(ik.toLowerCase())
      )
    )) {
      return industry;
    }
  }

  return 'AUTOMOTIVE'; // Default fallback
}

function identifyStudyLevel(studyId, industry) {
  const industryData = supplyChainMapping.supply_chain_industries[industry];
  if (!industryData) return null;

  for (const [levelKey, levelData] of Object.entries(industryData.levels)) {
    const allStudies = [...levelData.studies.available, ...levelData.studies.missing];
    if (allStudies.some(study => study.id === studyId)) {
      return {
        key: levelKey,
        level: levelData.level,
        name_it: levelData.name_it,
        name_en: levelData.name_en
      };
    }
  }

  return null;
}

function generateCorrelatedStudies(industry, currentLevel, excludeStudyId) {
  const industryData = supplyChainMapping.supply_chain_industries[industry];
  const correlationRules = supplyChainMapping.correlation_rules.upstream_downstream.rules;
  
  const rule = correlationRules.find(r => r.if_level === currentLevel.level);
  if (!rule) return { upstream: [], downstream: [], same_level: [] };

  const result = {
    upstream: [],
    downstream: [],
    same_level: []
  };

  // Trova studi upstream
  rule.show_upstream.forEach(levelNumber => {
    const levelData = Object.values(industryData.levels).find(l => l.level === levelNumber);
    if (levelData) {
      const studies = [...levelData.studies.available, ...levelData.studies.missing]
        .filter(s => s.id !== excludeStudyId);
      result.upstream.push({
        level: levelNumber,
        level_name: levelData.name_it,
        studies
      });
    }
  });

  // Trova studi downstream
  rule.show_downstream.forEach(levelNumber => {
    const levelData = Object.values(industryData.levels).find(l => l.level === levelNumber);
    if (levelData) {
      const studies = [...levelData.studies.available, ...levelData.studies.missing]
        .filter(s => s.id !== excludeStudyId);
      result.downstream.push({
        level: levelNumber,
        level_name: levelData.name_it,
        studies
      });
    }
  });

  // Trova studi stesso livello
  const sameLevelData = Object.values(industryData.levels).find(l => l.level === currentLevel.level);
  if (sameLevelData) {
    const studies = [...sameLevelData.studies.available, ...sameLevelData.studies.missing]
      .filter(s => s.id !== excludeStudyId);
    result.same_level = studies;
  }

  return result;
}

function findCrossMarketStudies(mainStudy) {
  const crossMarketStudies = [];
  const availableMarkets = supplyChainMapping.correlation_rules.cross_market.markets;
  
  // Cerca studi simili in altri mercati basandosi su keywords e nome
  for (const market of availableMarkets) {
    if (market === mainStudy.market) continue;
    
    // Logica per trovare studi correlati in altri mercati
    // Questo dovrebbe essere implementato basandosi sul database reale
    const similarStudies = findSimilarStudiesInMarket(mainStudy, market);
    if (similarStudies.length > 0) {
      crossMarketStudies.push({
        market,
        studies: similarStudies
      });
    }
  }
  
  return crossMarketStudies;
}

function findSimilarStudiesInMarket(referenceStudy, targetMarket) {
  // Implementazione semplificata - dovrebbe cercare nel database reale
  // basandosi su similarità di keywords, nome, codici ATECO/NACE
  return [];
}