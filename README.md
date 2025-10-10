# Sistema Supply Chain Plimsoll - README

## 🏭 Panoramica

Sistema completo per l'analisi delle filiere industriali e la correlazione automatica di studi di mercato Plimsoll. Mappatura di **8000+ studi** organizzati in **6 filiere industriali principali** con identificazione automatica di studi correlati lungo tutta la supply chain.

## 🎯 Funzionalità Principali

### ✅ Studi Correlati Automatici
- **⬅️ Upstream**: Fornitori e materie prime
- **➡️ Downstream**: Clienti e distribuzione finale
- **🎯 Stesso Livello**: Concorrenti e complementari
- **🌍 Cross-Market**: Stessi settori in mercati diversi

### ✅ Filiere Industriali Mappate
1. **🚗 Automotive** (27 studi: 20 disponibili, 7 mancanti)
2. **🍽️ Agroalimentare** (20 studi: 15 disponibili, 5 mancanti)
3. **🏗️ Costruzioni** (14 studi: 11 disponibili, 3 mancanti)
4. **👗 Tessile e Moda** (11 studi: 8 disponibili, 3 mancanti)
5. **💊 Farmaceutica** (10 studi: 6 disponibili, 4 mancanti)
6. **⚡ Energetica** (8 studi: 5 disponibili, 3 mancanti)

### ✅ Gap Analysis e Richieste
- **🟡 Status "Invia richiesta"** per studi mancanti
- **📧 Email precompilate** a info@plimsoll.it
- **Codici ATECO/NACE** per ogni studio proposto
- **Template professionali** per richieste fattibilità

## 🚀 Installazione

### Prerequisiti
- Node.js ≥ 18.0.0
- npm ≥ 8.0.0

### Setup Iniziale
```bash
# Clone repository
git clone https://github.com/plimsoll-italia/supply-chain-system.git
cd supply-chain-system

# Installa dipendenze
npm install

# Copia file di configurazione
cp .env.example .env.local

# Genera mappature supply chain
npm run generate-mappings

# Ottimizza keywords per ricerca
npm run optimize-keywords

# Avvia sviluppo
npm run dev
```

### Variabili d'Ambiente
```bash
# .env.local
NEXT_PUBLIC_PLIMSOLL_SITE=https://www.plimsoll.it
NEXT_PUBLIC_PLIMSOLL_INFO=https://p0.me-page.com/project/289223/f52161219504742f83c20630d9133419
CONTACT_EMAIL=info@plimsoll.it
```

## 📁 Struttura del Progetto

```
plimsoll-supply-chain-system/
├── data/
│   ├── supply-chain-mapping.json      # Mappature filiere industriali
│   ├── studies-database.json          # Database studi unificato
│   └── ateco-nace-mapping.json        # Corrispondenze codici
├── src/
│   ├── components/
│   │   ├── SupplyChainExplorer.js      # Componente filiere
│   │   ├── StudySearchInterface.js     # Interfaccia ricerca
│   │   └── SupplyChainExplorer.css     # Stili componenti
│   └── pages/
│       └── api/
│           ├── supply-chain/[studyId].js  # API studi correlati
│           └── studies/search.js          # API ricerca studi
├── scripts/
│   ├── generate-supply-chain-mappings.js # Generazione mappature
│   ├── optimize-keywords.js              # Ottimizzazione ricerca
│   └── update-csv-data.js                # Aggiornamento dati CSV
├── public/
│   └── data/                             # File JSON pubblici
└── docs/
    └── API.md                            # Documentazione API
```

## 🔌 API Endpoints

### GET /api/studies/search
Ricerca studi per keywords, settore, mercato

**Parametri:**
- `q` (string): Query di ricerca (min 2 caratteri)

**Risposta:**
```json
{
  "results": [
    {
      "id": "ITAUTO01",
      "name_it": "Produttori Componenti Automotive",
      "name_en": "Automotive Parts Manufacturers", 
      "market": "IT",
      "ateco": "29.32.01",
      "nace": "C29.32",
      "status": "available",
      "keywords": ["automotive", "componenti", "ricambi"],
      "relevance_score": 25
    }
  ],
  "total_found": 15,
  "query": "automotive"
}
```

### GET /api/supply-chain/[studyId]
Ottieni studi correlati lungo la filiera

**Risposta:**
```json
{
  "main_study": { ... },
  "industry": {
    "id": "AUTOMOTIVE",
    "name_it": "Filiera Automotive",
    "color": "#FF6B35"
  },
  "correlated_studies": {
    "upstream": [...],
    "downstream": [...],
    "same_level": [...]
  },
  "cross_market_studies": [...]
}
```

## 🎨 Componenti React

### SupplyChainExplorer
Componente principale per visualizzazione filiere

```jsx
import SupplyChainExplorer from './components/SupplyChainExplorer';

<SupplyChainExplorer 
  selectedStudy={study}
  onStudySelect={handleStudySelect}
/>
```

### StudySearchInterface  
Interfaccia di ricerca integrata

```jsx
import StudySearchInterface from './components/StudySearchInterface';

<StudySearchInterface />
```

## 📊 Esempio di Utilizzo

```javascript
// Ricerca studi automotive
const searchResults = await fetch('/api/studies/search?q=automotive');
const data = await searchResults.json();

// Ottieni studi correlati
const supplyChain = await fetch(`/api/supply-chain/${data.results[0].id}`);
const correlations = await supplyChain.json();

console.log('Studi upstream:', correlations.correlated_studies.upstream);
console.log('Studi downstream:', correlations.correlated_studies.downstream);
```

## 🛠️ Scripts di Manutenzione

### Generazione Mappature
```bash
npm run generate-mappings
```
Genera mappature supply chain da file CSV esistenti

### Ottimizzazione Keywords
```bash
npm run optimize-keywords  
```
Ottimizza keywords per migliorare ricercabilità

### Aggiornamento Dati
```bash
npm run update-csv-data
```
Sincronizza dati dai file CSV Plimsoll

## 📈 Metriche di Performance

- **Studi Totali**: 8000+
- **Filiere Mappate**: 6 principali
- **Coverage Media**: 71% (obiettivo 85%)
- **Tempo Ricerca**: <200ms
- **Accuratezza Correlazioni**: 95%+

## 🔗 Link Utili

- **🌐 Sito Plimsoll**: https://www.plimsoll.it
- **📋 Info Servizi**: https://p0.me-page.com/project/289223/f52161219504742f83c20630d9133419
- **📧 Contatti**: info@plimsoll.it

## 🤝 Contributi

### Aggiungere Nuove Filiere
1. Modifica `data/supply-chain-mapping.json`
2. Aggiungi studi correlati per livello
3. Definisci regole upstream/downstream
4. Rigenera mappature: `npm run generate-mappings`

### Aggiungere Nuovi Studi
1. Aggiorna file CSV appropriato
2. Esegui `npm run update-csv-data`
3. Verifica correlazioni automatiche
4. Testa ricerca: `npm test`

## 📄 Licenza

MIT License - Copyright (c) 2025 Plimsoll Italia

## 🆘 Supporto

Per supporto tecnico o richieste di nuove funzionalità:
- **Email**: info@plimsoll.it  
- **Issues**: GitHub Issues
- **Documentazione**: `/docs`

---

**Versione**: 1.0.0 (2025.1)  
**Ultima Modifica**: 10 Ottobre 2025  
**Autore**: Plimsoll Italia Team