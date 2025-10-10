// Supply Chain System - Main Logic (Updated for Alphabetical Listing)
class SupplyChainSystem {
  constructor() {
    this.allStudies = [];
    this.filteredStudies = [];
    this.selectedStudy = null;
    this.correlationsData = null;
    
    this.initializeSystem();
  }

  async initializeSystem() {
    console.log('🏭 Inizializzazione Sistema Supply Chain Plimsoll');
    
    try {
      // Carica i dati degli studi
      await this.loadStudiesData();
      
      // Carica le correlazioni
      await this.loadCorrelationsData();
      
      // Ordina alfabeticamente per nome native
      this.sortStudiesAlphabetically();
      
      // Renderizza la lista iniziale (tutti gli studi)
      this.renderAllStudies();
      
      // Aggiorna le statistiche
      this.updateStatistics();
      
      // Bind eventi
      this.bindEvents();
      
      console.log(`✅ Sistema inizializzato: ${this.allStudies.length} studi caricati`);
      
    } catch (error) {
      console.error('❌ Errore inizializzazione:', error);
      this.showError('Errore nel caricamento del database studi');
    }
  }

  async loadStudiesData() {
    try {
      const response = await fetch('data/all-markets-studies.json');
      const data = await response.json();
      this.allStudies = data.studies || [];
      this.marketsData = data.markets || {};
    } catch (error) {
      console.error('Errore caricamento studi:', error);
      throw error;
    }
  }

  async loadCorrelationsData() {
    try {
      const response = await fetch('data/supply-chain-correlations.json');
      this.correlationsData = await response.json();
    } catch (error) {
      console.error('Errore caricamento correlazioni:', error);
      throw error;
    }
  }

  sortStudiesAlphabetically() {
    this.allStudies.sort((a, b) => {
      return a.name_native.localeCompare(b.name_native, 'it', { 
        sensitivity: 'base',
        ignorePunctuation: true 
      });
    });
    
    this.filteredStudies = [...this.allStudies];
  }

  renderAllStudies() {
    const loadingState = document.getElementById('loadingState');
    const studiesGrid = document.getElementById('studiesGrid');
    
    if (loadingState) loadingState.style.display = 'none';
    if (studiesGrid) {
      studiesGrid.style.display = 'block';
      this.renderStudiesGrid(this.filteredStudies);
    }
    
    this.updateResultsCount(this.filteredStudies.length);
  }

  renderStudiesGrid(studies) {
    const gridContainer = document.getElementById('studiesGrid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    if (studies.length === 0) {
      document.getElementById('noResults').style.display = 'block';
      return;
    }

    document.getElementById('noResults').style.display = 'none';

    studies.forEach(study => {
      const studyCard = this.createStudyCard(study);
      gridContainer.appendChild(studyCard);
    });
  }

  createStudyCard(study) {
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4 mb-3';

    const statusBadge = study.status === 'available' 
      ? '<span class="badge bg-success mb-2"><i class="fas fa-check"></i> 🟢 Disponibile</span>'
      : '<span class="badge bg-warning mb-2"><i class="fas fa-envelope"></i> 🟡 Invia richiesta</span>';

    const marketFlag = this.marketsData[study.market]?.flag || '🏳️';
    const marketName = this.marketsData[study.market]?.name || study.market;

    card.innerHTML = `
      <div class="card h-100 study-card ${study.status === 'missing' ? 'missing-study' : 'available-study'}" 
           data-study-id="${study.id}">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            ${statusBadge}
            <span class="badge bg-secondary">${marketFlag} ${marketName}</span>
          </div>
          
          <h6 class="card-title study-title" style="cursor: pointer;" onclick="supplyChainSystem.showStudyDetails('${study.id}')">
            <i class="fas fa-external-link-alt"></i> ${study.name_native}
          </h6>
          
          <p class="card-subtitle text-muted mb-2">${study.name_english}</p>
          
          <div class="codes-section mb-2">
            <small class="d-block"><strong>ATECO:</strong> ${study.ateco}</small>
            <small class="d-block"><strong>NACE:</strong> ${study.nace}</small>
          </div>
          
          <p class="card-text sector-description">
            <small>${study.sector_description || study.description_native}</small>
          </p>
          
          <div class="d-flex justify-content-between align-items-center">
            <div class="correlations-info">
              <small class="text-muted">
                <i class="fas fa-sitemap"></i> 
                ${this.getCorrelationsCount(study.id)} correlati
              </small>
            </div>
            
            <div class="action-buttons">
              ${study.status === 'available' 
                ? `<a href="https://www.plimsoll.it" target="_blank" class="btn btn-success btn-sm">
                     <i class="fas fa-shopping-cart"></i> Acquista
                   </a>`
                : `<button class="btn btn-warning btn-sm" onclick="supplyChainSystem.requestStudy('${study.id}')">
                     <i class="fas fa-envelope"></i> Richiedi
                   </button>`
              }
            </div>
          </div>
        </div>
      </div>
    `;

    return card;
  }

  showStudyDetails(studyId) {
    const study = this.allStudies.find(s => s.id === studyId);
    if (!study) return;

    this.selectedStudy = study;
    
    // Popola i dettagli dello studio
    this.renderStudyDetails(study);
    
    // Popola gli studi correlati e filiera
    this.renderRelatedStudies(studyId);
    
    // Configura i pulsanti del modal
    this.configureModalButtons(study);
    
    // Mostra il modal
    const modal = new bootstrap.Modal(document.getElementById('studyDetailModal'));
    modal.show();
  }

  renderStudyDetails(study) {
    const container = document.getElementById('studyDetailsSection');
    const marketFlag = this.marketsData[study.market]?.flag || '🏳️';
    const marketName = this.marketsData[study.market]?.name || study.market;
    
    const statusBadge = study.status === 'available' 
      ? '<span class="badge bg-success fs-6"><i class="fas fa-check"></i> 🟢 Disponibile</span>'
      : '<span class="badge bg-warning fs-6"><i class="fas fa-envelope"></i> 🟡 Su Richiesta</span>';

    container.innerHTML = `
      <div class="study-details-card">
        <div class="row">
          <div class="col-md-8">
            <h4 class="study-main-title">${study.name_native}</h4>
            <h5 class="study-english-title text-muted">${study.name_english}</h5>
            
            <div class="study-description mt-3">
              <h6>📋 Descrizione Settore</h6>
              <p>${study.sector_description}</p>
              
              <h6>🔍 Descrizione Dettagliata</h6>
              <p><strong>Italiano:</strong> ${study.description_native}</p>
              <p><strong>English:</strong> ${study.description_english}</p>
            </div>

            <div class="keywords-section mt-3">
              <h6>🏷️ Keywords</h6>
              <div class="keywords-list">
                ${study.keywords.map(keyword => 
                  `<span class="badge bg-light text-dark me-1 mb-1">${keyword}</span>`
                ).join('')}
              </div>
            </div>
          </div>
          
          <div class="col-md-4">
            <div class="study-metadata">
              ${statusBadge}
              
              <div class="metadata-section mt-3">
                <h6>📍 Informazioni</h6>
                <p><strong>Mercato:</strong> ${marketFlag} ${marketName}</p>
                <p><strong>Settore:</strong> ${this.getIndustryName(study.industry)}</p>
                <p><strong>Livello Filiera:</strong> ${study.level}</p>
                <p><strong>ATECO:</strong> ${study.ateco}</p>
                <p><strong>NACE:</strong> ${study.nace}</p>
              </div>
              
              ${study.status === 'available' 
                ? `<a href="https://www.plimsoll.it" target="_blank" class="btn btn-success w-100 mb-2">
                     <i class="fas fa-external-link-alt"></i> Visita Plimsoll
                   </a>`
                : `<button class="btn btn-warning w-100 mb-2" onclick="supplyChainSystem.requestStudy('${study.id}')">
                     <i class="fas fa-envelope"></i> Richiedi Fattibilità
                   </button>`
              }
              
              <a href="https://p0.me-page.com/project/289223/f52161219504742f83c20630d9133419" target="_blank" class="btn btn-outline-info w-100">
                <i class="fas fa-info-circle"></i> Info Servizi Plimsoll
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('modalStudyTitle').textContent = study.name_native;
  }

  renderRelatedStudies(studyId) {
    const correlations = this.correlationsData?.correlations[studyId];
    
    if (!correlations) {
      // Genera correlazioni automatiche se non esistono
      correlations = this.generateAutomaticCorrelations(studyId);
    }
    
    // Render same market related studies
    this.renderSameMarketRelated(correlations);
    
    // Render supply chain studies
    this.renderSupplyChainStudies(correlations);
    
    // Render cross market studies
    this.renderCrossMarketStudies(correlations);
  }

  renderSameMarketRelated(correlations) {
    const container = document.getElementById('sameMarketRelated');
    container.innerHTML = '';
    
    const allRelated = [
      ...(correlations.upstream || []),
      ...(correlations.same_level || []),
      ...(correlations.downstream || [])
    ];
    
    if (allRelated.length === 0) {
      container.innerHTML = '<p class="text-muted">Nessuno studio correlato trovato</p>';
      return;
    }
    
    allRelated.forEach(related => {
      const relatedCard = this.createRelatedStudyCard(related, 'same-market');
      container.appendChild(relatedCard);
    });
  }

  renderSupplyChainStudies(correlations) {
    const container = document.getElementById('supplyChainStudies');
    container.innerHTML = '';
    
    // Upstream studies
    if (correlations.upstream?.length > 0) {
      const upstreamSection = document.createElement('div');
      upstreamSection.className = 'supply-chain-section mb-3';
      upstreamSection.innerHTML = '<h6 class="text-info">⬅️ Fornitori (Upstream)</h6>';
      
      correlations.upstream.forEach(study => {
        const card = this.createRelatedStudyCard(study, 'upstream');
        upstreamSection.appendChild(card);
      });
      
      container.appendChild(upstreamSection);
    }
    
    // Same level studies  
    if (correlations.same_level?.length > 0) {
      const sameLevelSection = document.createElement('div');
      sameLevelSection.className = 'supply-chain-section mb-3';
      sameLevelSection.innerHTML = '<h6 class="text-warning">🎯 Stesso Livello</h6>';
      
      correlations.same_level.forEach(study => {
        const card = this.createRelatedStudyCard(study, 'same-level');
        sameLevelSection.appendChild(card);
      });
      
      container.appendChild(sameLevelSection);
    }
    
    // Downstream studies
    if (correlations.downstream?.length > 0) {
      const downstreamSection = document.createElement('div');
      downstreamSection.className = 'supply-chain-section mb-3';
      downstreamSection.innerHTML = '<h6 class="text-success">➡️ Clienti (Downstream)</h6>';
      
      correlations.downstream.forEach(study => {
        const card = this.createRelatedStudyCard(study, 'downstream');
        downstreamSection.appendChild(card);
      });
      
      container.appendChild(downstreamSection);
    }
  }

  renderCrossMarketStudies(correlations) {
    const container = document.getElementById('crossMarketStudies');
    container.innerHTML = '';
    
    if (!correlations.cross_market || correlations.cross_market.length === 0) {
      container.innerHTML = '<div class="col-12"><p class="text-muted">Nessuno studio equivalente in altri mercati</p></div>';
      return;
    }
    
    correlations.cross_market.forEach(crossStudy => {
      const marketData = this.marketsData[crossStudy.market];
      const crossCard = document.createElement('div');
      crossCard.className = 'col-md-6 col-lg-3 mb-2';
      
      const statusBadge = crossStudy.status === 'available'
        ? '<span class="badge bg-success">🟢 Disponibile</span>' 
        : '<span class="badge bg-warning">🟡 Su Richiesta</span>';
      
      crossCard.innerHTML = `
        <div class="card border-info h-100">
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-start mb-2">
              ${statusBadge}
              <span class="badge bg-info">${marketData?.flag || '🏳️'} ${marketData?.name || crossStudy.market}</span>
            </div>
            <h6 class="card-title">${this.selectedStudy.name_native}</h6>
            <p class="card-text"><small>${crossStudy.description || 'Stesso studio in mercato diverso'}</small></p>
            
            ${crossStudy.status === 'available'
              ? `<a href="https://www.plimsoll.it" target="_blank" class="btn btn-success btn-sm w-100">Acquista</a>`
              : `<button class="btn btn-warning btn-sm w-100" onclick="supplyChainSystem.requestCrossMarketStudy('${crossStudy.id}', '${crossStudy.market}')">Richiedi</button>`
            }
          </div>
        </div>
      `;
      
      container.appendChild(crossCard);
    });
  }

  createRelatedStudyCard(study, type) {
    const card = document.createElement('div');
    card.className = `card mb-2 border-${type === 'upstream' ? 'info' : type === 'downstream' ? 'success' : 'warning'}`;
    
    const statusBadge = study.status === 'available'
      ? '<span class="badge bg-success">🟢</span>'
      : '<span class="badge bg-warning">🟡</span>';
    
    // Trova i dati completi dello studio se esiste
    const fullStudy = this.allStudies.find(s => s.id === study.id) || study;
    
    card.innerHTML = `
      <div class="card-body p-3">
        <div class="d-flex justify-content-between align-items-start">
          <div class="flex-grow-1">
            <h6 class="card-title mb-1">
              ${statusBadge} ${study.name_native || fullStudy.name_native}
            </h6>
            <p class="card-subtitle text-muted mb-2">
              ${study.name_english || fullStudy.name_english}
            </p>
            ${study.relation ? `<small class="text-info"><i class="fas fa-link"></i> ${study.relation}</small>` : ''}
            <div class="codes-info mt-1">
              <small class="text-muted">
                ATECO: ${fullStudy.ateco || 'N/A'} | NACE: ${fullStudy.nace || 'N/A'}
              </small>
            </div>
          </div>
          <div class="action-section">
            ${study.status === 'available' 
              ? `<button class="btn btn-outline-primary btn-sm" onclick="supplyChainSystem.showStudyDetails('${study.id}')">
                   <i class="fas fa-eye"></i> Dettagli
                 </button>`
              : `<button class="btn btn-outline-warning btn-sm" onclick="supplyChainSystem.requestStudy('${study.id}')">
                   <i class="fas fa-envelope"></i> Richiedi
                 </button>`
            }
          </div>
        </div>
      </div>
    `;
    
    return card;
  }

  generateAutomaticCorrelations(studyId) {
    const study = this.allStudies.find(s => s.id === studyId);
    if (!study) return {};
    
    // Genera correlazioni automatiche basate su industria e livello
    const sameIndustryStudies = this.allStudies.filter(s => 
      s.industry === study.industry && s.id !== studyId
    );
    
    const upstream = sameIndustryStudies.filter(s => s.level < study.level);
    const downstream = sameIndustryStudies.filter(s => s.level > study.level);
    const same_level = sameIndustryStudies.filter(s => s.level === study.level);
    
    // Cross market: stesso studio in mercati diversi
    const cross_market = this.allStudies.filter(s => 
      s.name_native === study.name_native && s.market !== study.market
    ).map(s => ({ id: s.id, market: s.market, status: s.status }));
    
    return {
      upstream: upstream.slice(0, 5),
      same_level: same_level.slice(0, 5), 
      downstream: downstream.slice(0, 5),
      cross_market
    };
  }

  requestStudy(studyId) {
    const study = this.allStudies.find(s => s.id === studyId) || 
                  { name_native: 'Studio Richiesto', name_english: 'Requested Study', ateco: 'N/A' };

    // Prepara il contenuto del modal di richiesta
    const content = document.getElementById('requestStudyContent');
    content.innerHTML = `
      <div class="alert alert-info">
        <h6><i class="fas fa-info-circle"></i> Studio da Richiedere</h6>
        <p><strong>Nome:</strong> ${study.name_native}</p>
        <p><strong>Nome Inglese:</strong> ${study.name_english}</p>
        <p><strong>Mercato:</strong> ${this.marketsData[study.market]?.name || study.market}</p>
        <p><strong>Codice ATECO:</strong> ${study.ateco}</p>
        <p><strong>Codice NACE:</strong> ${study.nace}</p>
      </div>
      
      <h6>📧 Procedura di Richiesta</h6>
      <p>Il team Plimsoll valuterà la fattibilità tecnica ed economica dello studio:</p>
      <ol>
        <li>Clicca "Invia Email" per aprire l'email precompilata</li>
        <li>Aggiungi eventuali specifiche sul target di aziende</li>
        <li>Invia la richiesta a info@plimsoll.it</li>
        <li>Riceverai risposta entro 3-5 giorni lavorativi</li>
      </ol>
    `;

    // Prepara email precompilata
    const emailSubject = `Richiesta Fattibilità Studio: ${study.name_native} (${study.market})`;
    const emailBody = `Gentile Team Plimsoll,

Vorrei richiedere la valutazione di fattibilità per lo sviluppo dello studio:

DETTAGLI STUDIO:
- Nome: ${study.name_native}
- Nome Inglese: ${study.name_english}  
- Mercato: ${this.marketsData[study.market]?.name || study.market}
- Codice ATECO: ${study.ateco}
- Codice NACE: ${study.nace}
- Settore: ${this.getIndustryName(study.industry)}

TARGET AZIENDE:
[Specificare il tipo di aziende di interesse]

AMBITO GEOGRAFICO:
[Indicare le regioni/zone di interesse specifico]

NOTE AGGIUNTIVE:
[Eventuali requisiti particolari]

Per maggiori informazioni sui vostri servizi:
https://p0.me-page.com/project/289223/f52161219504742f83c20630d9133419

Cordiali saluti,
[Nome]
[Azienda]
[Contatti]`;

    const emailLink = `mailto:info@plimsoll.it?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    document.getElementById('sendEmailBtn').href = emailLink;

    // Mostra il modal di richiesta
    const modal = new bootstrap.Modal(document.getElementById('requestStudyModal'));
    modal.show();
  }

  // Event handlers
  bindEvents() {
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');
    const marketFilter = document.getElementById('marketFilter');
    const industryFilter = document.getElementById('industryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const resetFilters = document.getElementById('resetFilters');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.performSearch(e.target.value);
      });
    }

    if (clearSearch) {
      clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        this.renderAllStudies();
      });
    }

    if (marketFilter) {
      marketFilter.addEventListener('change', () => this.applyFilters());
    }

    if (industryFilter) {
      industryFilter.addEventListener('change', () => this.applyFilters());
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.applyFilters());
    }

    if (resetFilters) {
      resetFilters.addEventListener('click', () => {
        searchInput.value = '';
        marketFilter.value = '';
        industryFilter.value = '';
        statusFilter.value = '';
        this.renderAllStudies();
      });
    }
  }

  performSearch(query) {
    if (!query || query.length < 2) {
      this.renderAllStudies();
      return;
    }

    const searchTerm = query.toLowerCase();
    const filtered = this.allStudies.filter(study => {
      return study.name_native.toLowerCase().includes(searchTerm) ||
             study.name_english.toLowerCase().includes(searchTerm) ||
             study.description_native.toLowerCase().includes(searchTerm) ||
             study.description_english.toLowerCase().includes(searchTerm) ||
             study.ateco.includes(searchTerm) ||
             study.nace.toLowerCase().includes(searchTerm) ||
             study.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm));
    });

    this.filteredStudies = filtered;
    this.renderStudiesGrid(filtered);
    this.updateResultsCount(filtered.length);
  }

  applyFilters() {
    const marketFilter = document.getElementById('marketFilter').value;
    const industryFilter = document.getElementById('industryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    let filtered = [...this.allStudies];

    if (marketFilter) {
      filtered = filtered.filter(study => study.market === marketFilter);
    }

    if (industryFilter) {
      filtered = filtered.filter(study => study.industry === industryFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(study => study.status === statusFilter);
    }

    this.filteredStudies = filtered;
    this.renderStudiesGrid(filtered);
    this.updateResultsCount(filtered.length);
  }

  getCorrelationsCount(studyId) {
    const correlations = this.correlationsData?.correlations[studyId];
    if (!correlations) return 0;
    
    return (correlations.upstream?.length || 0) +
           (correlations.same_level?.length || 0) + 
           (correlations.downstream?.length || 0) +
           (correlations.cross_market?.length || 0);
  }

  getIndustryName(industryCode) {
    const industryNames = {
      'AUTOMOTIVE': '🚗 Automotive',
      'FOOD_BEVERAGE': '🍽️ Agroalimentare',
      'CONSTRUCTION': '🏗️ Costruzioni',
      'TEXTILE_FASHION': '👗 Tessile e Moda',
      'PHARMACEUTICAL': '💊 Farmaceutica',
      'ENERGY': '⚡ Energia',
      'TECHNOLOGY': '💻 Tecnologia',
      'SERVICES': '🏢 Servizi',
      'MANUFACTURING': '🏭 Manifatturiero',
      'LOGISTICS': '🚛 Logistica',
      'FINANCE': '💰 Servizi Finanziari',
      'HEALTHCARE': '🏥 Sanità'
    };
    
    return industryNames[industryCode] || industryCode;
  }

  updateStatistics() {
    const totalStudies = this.allStudies.length;
    const availableStudies = this.allStudies.filter(s => s.status === 'available').length;
    const missingStudies = this.allStudies.filter(s => s.status === 'missing').length;
    
    document.getElementById('totalStudies').textContent = totalStudies.toLocaleString();
    document.getElementById('availableStudies').textContent = availableStudies.toLocaleString();
    document.getElementById('missingStudies').textContent = missingStudies.toLocaleString();
    
    // Aggiorna correlazioni
    const totalCorrelations = Object.keys(this.correlationsData?.correlations || {}).length * 4;
    document.getElementById('correlationsCount').textContent = `${(totalCorrelations / 1000).toFixed(1)}K+`;
  }

  updateResultsCount(count) {
    document.getElementById('resultsCount').textContent = count.toLocaleString();
    document.getElementById('totalCount').textContent = this.allStudies.length.toLocaleString();
  }

  configureModalButtons(study) {
    const requestBtn = document.getElementById('requestStudyBtn');
    if (study.status === 'missing') {
      requestBtn.style.display = 'block';
      requestBtn.onclick = () => this.requestStudy(study.id);
    } else {
      requestBtn.style.display = 'none';
    }
  }

  showError(message) {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
      loadingState.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle"></i> ${message}
        </div>
      `;
    }
  }
}

// Inizializzazione globale
let supplyChainSystem;

document.addEventListener('DOMContentLoaded', () => {
  supplyChainSystem = new SupplyChainSystem();
});
