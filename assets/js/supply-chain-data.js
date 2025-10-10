// Supply Chain Data - Database degli studi con correlazioni
const SUPPLY_CHAIN_DATA = {
  studies: {
    "ITFI86": {
      id: "ITFI86",
      name_it: "Supermercati",
      name_en: "Supermarkets",
      description: "Supermercati con superficie di vendita superiore a 2.500 mq che operano nel settore della grande distribuzione organizzata",
      ateco: "47.11.10",
      nace: "G",
      market: "IT",
      status: "available",
      industry: "FOOD_BEVERAGE",
      level: 4, // Distribution level
      keywords: ["supermercati", "GDO", "retail", "distribuzione", "grande distribuzione"]
    },
    "ITMA23": {
      id: "ITMA23", 
      name_it: "Concessionarie AUDI",
      name_en: "AUDI Car Dealers",
      description: "Concessionarie autorizzate per la vendita di autoveicoli Audi nuovi e usati",
      ateco: "45.11.02",
      nace: "G",
      market: "IT",
      status: "available",
      industry: "AUTOMOTIVE",
      level: 4, // Distribution level
      keywords: ["concessionarie", "AUDI", "automotive", "auto", "dealers"]
    },
    "ITTK67": {
      id: "ITTK67",
      name_it: "Software Gestionali - ERP", 
      name_en: "ERP Management Software",
      description: "Sviluppatori e fornitori di software gestionali ERP per la gestione integrata dei processi aziendali",
      ateco: "62.01.00",
      nace: "J",
      market: "IT", 
      status: "available",
      industry: "TECHNOLOGY",
      level: 2,
      keywords: ["ERP", "software", "gestionale", "management", "enterprise"]
    },
    "ITCO45": {
      id: "ITCO45",
      name_it: "Costruzioni Edili Generali",
      name_en: "General Building Construction", 
      description: "Imprese di costruzioni generali specializzate in edilizia residenziale e commerciale",
      ateco: "41.20.00",
      nace: "F",
      market: "IT",
      status: "available", 
      industry: "CONSTRUCTION",
      level: 3,
      keywords: ["costruzioni", "edilizia", "building", "construction", "residenziale"]
    },
    "ITCS34": {
      id: "ITCS34",
      name_it: "Consulenza Aziendale",
      name_en: "Business Consulting",
      description: "Società di consulenza specializzate in advisory strategico, organizzativo e operativo",
      ateco: "70.22.00", 
      nace: "M",
      market: "IT",
      status: "available",
      industry: "SERVICES", 
      level: 5,
      keywords: ["consulenza", "advisory", "strategico", "business", "consulting"]
    },
    // Studi mancanti (esempi)
    "ITAUTO_SENSORS": {
      id: "ITAUTO_SENSORS",
      name_it: "Sensori Automotive",
      name_en: "Automotive Sensors", 
      description: "Produttori di sensori e componentistica elettronica per veicoli",
      ateco: "26.51.01",
      nace: "C",
      market: "IT",
      status: "missing",
      industry: "AUTOMOTIVE",
      level: 2,
      keywords: ["sensori", "automotive", "elettronica", "ADAS", "components"]
    },
    "ITFOOD_ALTPROTEIN": {
      id: "ITFOOD_ALTPROTEIN", 
      name_it: "Proteine Alternative",
      name_en: "Alternative Protein Processing",
      description: "Produttori di proteine vegetali e alternative alla carne tradizionale",
      ateco: "10.89.09",
      nace: "C", 
      market: "IT",
      status: "missing",
      industry: "FOOD_BEVERAGE",
      level: 2,
      keywords: ["proteine alternative", "plant-based", "vegetali", "carne vegetale"]
    },
    "ITCONST_SUSTAINABLE": {
      id: "ITCONST_SUSTAINABLE",
      name_it: "Materiali Edili Sostenibili", 
      name_en: "Sustainable Building Materials",
      description: "Produttori di materiali da costruzione eco-sostenibili e a basso impatto ambientale",
      ateco: "23.99.01",
      nace: "C",
      market: "IT", 
      status: "missing",
      industry: "CONSTRUCTION",
      level: 1,
      keywords: ["materiali sostenibili", "eco-building", "green materials", "sostenibilità"]
    }
  },

  // Mappatura correlazioni supply chain
  correlations: {
    "ITFI86": { // Supermercati
      upstream: ["ITFOOD_PROCESSORS", "ITFOOD_WHOLESALE", "ITFOOD_ALTPROTEIN"],
      downstream: ["ITLOG_DELIVERY", "ITFOOD_ECOMMERCE"],
      same_level: ["ITHYPER_MARKETS", "ITDISCOUNT_STORES"],
      cross_market: ["UKSUP01", "FRSUP01"]
    },
    "ITMA23": { // Concessionarie AUDI
      upstream: ["ITAUTO_PARTS", "ITAUTO_SENSORS", "ITAUTO_MANUFACTURING"],
      downstream: ["ITAUTO_INSURANCE", "ITAUTO_LEASING", "ITAUTO_AFTERSALES"],
      same_level: ["ITBMW_DEALERS", "ITMERCEDES_DEALERS"],
      cross_market: ["UKAUDI01", "FRAUDI01"]
    },
    "ITCO45": { // Costruzioni
      upstream: ["ITCEMENT_PROD", "ITSTEEL_SUPPLIERS", "ITCONST_SUSTAINABLE"],
      downstream: ["ITREAL_ESTATE", "ITFACILITY_MGMT"],
      same_level: ["ITINFRA_CONSTRUCTION", "ITRESIDENTIAL_DEV"],
      cross_market: ["UKCONST01", "FRCONST01"]
    }
  },

  // Definizione delle industrie e livelli
  industries: {
    "AUTOMOTIVE": {
      name_it: "Filiera Automotive",
      name_en: "Automotive Supply Chain",
      icon: "🚗",
      color: "#FF6B35",
      levels: {
        1: "Materie Prime",
        2: "Componentistica", 
        3: "Assemblaggio",
        4: "Distribuzione",
        5: "Servizi Post-Vendita"
      }
    },
    "FOOD_BEVERAGE": {
      name_it: "Filiera Agroalimentare",
      name_en: "Food & Beverage Supply Chain", 
      icon: "🍽️",
      color: "#2ECC71",
      levels: {
        1: "Produzione Agricola",
        2: "Trasformazione",
        3: "Packaging", 
        4: "Distribuzione",
        5: "Retail"
      }
    },
    "CONSTRUCTION": {
      name_it: "Filiera Costruzioni",
      name_en: "Construction Supply Chain",
      icon: "🏗️", 
      color: "#F39C12",
      levels: {
        1: "Materie Prime",
        2: "Prodotti Edili",
        3: "Costruzione",
        4: "Servizi Immobiliari"
      }
    },
    "TEXTILE_FASHION": {
      name_it: "Filiera Tessile e Moda", 
      name_en: "Textile & Fashion Supply Chain",
      icon: "👗",
      color: "#9B59B6",
      levels: {
        1: "Fibre e Filati",
        2: "Produzione Tessile", 
        3: "Retail Moda"
      }
    },
    "PHARMACEUTICAL": {
      name_it: "Filiera Farmaceutica",
      name_en: "Pharmaceutical Supply Chain",
      icon: "💊", 
      color: "#E74C3C",
      levels: {
        1: "Ricerca e Sviluppo",
        2: "Produzione",
        3: "Distribuzione"
      }
    },
    "ENERGY": {
      name_it: "Filiera Energetica", 
      name_en: "Energy Supply Chain",
      icon: "⚡",
      color: "#F1C40F",
      levels: {
        1: "Produzione",
        2: "Distribuzione"
      }
    }
  },

  // Studi placeholder per correlazioni
  placeholder_studies: {
    "ITFOOD_PROCESSORS": {
      name_it: "Industrie Alimentari",
      name_en: "Food Processing Industries",
      status: "available",
      ateco: "10.85.00"
    },
    "ITAUTO_PARTS": {
      name_it: "Componenti Automotive",
      name_en: "Automotive Parts", 
      status: "available",
      ateco: "29.32.01"
    },
    "ITCEMENT_PROD": {
      name_it: "Produttori di Cemento",
      name_en: "Cement Producers",
      status: "available", 
      ateco: "23.51.01"
    },
    "ITLOG_DELIVERY": {
      name_it: "Servizi di Consegna",
      name_en: "Delivery Services",
      status: "missing",
      ateco: "53.20.01"
    },
    "ITAUTO_INSURANCE": {
      name_it: "Assicurazioni Auto", 
      name_en: "Auto Insurance",
      status: "available",
      ateco: "65.12.01"
    }
  }
};

// Esporta per uso globale
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUPPLY_CHAIN_DATA;
} else {
  window.SUPPLY_CHAIN_DATA = SUPPLY_CHAIN_DATA;
}
