// Supply Chain System - Main JavaScript Logic
class SupplyChainSystem {
  constructor() {
    this.currentStudies = [];
    this.filteredStudies = [];
    this.selectedStudy = null;
    
    this.initializeSystem();
    this.bindEvents();
    this.loadInitialData();
  }

  initializeSystem() {
    console.log('🏭 Inizializzazione Sistema Supply Chain Plimsoll');
    this.updateStats();
  }

  bindEvents() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');
    const industryFilter = document.getElementById('industryFilter');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.performSearch(e.target.value);
      });
    }

    if (clearSearch) {
      clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        industryFilter.value = '';
        this.loadInitialData();
      });
    }

    if (industryFilter) {
      industryFilter.addEventListener('change', (e) => {
        this.filterByIndustry(e.target.value);
      });
    }
  }

  loadInitialData() {
    // Carica gli studi dal database
    const studies = Object.values(SUPPLY_CHAIN_DATA.studies);
    this.currentStudies = studies;
    this.filteredStudies = studies;
    this.renderStudiesTable(studies);
    this.updateResultsCount(studies.length);
  }

  performSearch(query) {
    if (!query || query.length < 2) {
      this.loadInitialData();
      return;
    }

    const searchTerm = query.toLowerCase();
    const filtered = this.currentStudies.filter(study => {
      return study.name_it.toLowerCase().includes(searchTerm) ||
             study.name_en.toLowerCase().includes(searchTerm) ||
             study.description.toLowerCase().includes(searchTerm) ||
             study.ateco.includes(searchTerm) ||
             study.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm));
    });

    this.filteredStudies = filtered;
    this.renderStudiesTable(filtered);
    this.updateResultsCount(filtered.length);
  }

  filterByIndustry(industry) {
    if (!industry) {
      this.loadInitialData();
      return;
    }

    const filtered = this.currentStudies.filter(study => study.industry === industry);
    this.filteredStudies = filtered;
    this.renderStudiesTable(filtered);
    this.updateResultsCount(filtered.length);
  }

  renderStudiesTable(studies) {
    const tableBody = document.getElementById('studiesTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    studies.forEach(study => {
      const row = this.createStudyRow(study);
      tableBody.appendChild(row);
    });
  }

  createStudyRow(study) {
    const row = document.createElement('tr');
    row.className = study.status === 'missing' ? 'table-warning' : '';

    const industry = SUPPLY_CHAIN_DATA.industries[study.industry] || {};
    const statusBadge = study.status === 'available' 
      ? '<span class="badge bg-success"><i class="fas fa-check"></i> Disponibile</span>'
      : '<span class="badge bg-warning"><i class="fas fa-envelope"></i> Invia richiesta</span>';

    const correlationsCount = this.getCorrelationsCount(study.id);

    row.innerHTML = `
      <td>
        <div class="study-title">
          <strong>${study.name_it}</strong>
          <br>
          <small class="text-muted">${study.name_en}</small>
        </div>
        <div class="study-description mt-1">
          <small>${study.description}</small>
        </div>
      </td>
      <td>
        <div class="codes-section">
          <span class="badge bg-secondary mb-1">ATECO: ${study.ateco}</span><br>
          <span class="badge bg-secondary">NACE: ${study.nace}</span>
        </div>
      </td>
      <td>${statusBadge}</td>
      <td>
        <span class="badge" style="background-color: ${industry.color || '#6c757d'}">
          ${industry.icon || '📊'} ${industry.name_it || 'N/A'}
        </span>
        <br>
        <small class="text-muted">Livello ${study.level || 'N/A'}</small>
      </td>
      <td class="text-center">
        <button class="btn btn-outline-primary btn-sm" onclick="supplyChainSystem.showSupplyChain('${study.id}')">
          <i class="fas fa-sitemap"></i> ${correlationsCount} correlati
        </button>
      </td>
      <td>
        ${study.status === 'available' 
          ? `<a href="https://www.plimsoll.it" target="_blank" class="btn btn-success btn-sm">
               <i class="fas fa-external-link-alt"></i> Acquista
             </a>`
          : `<button class="btn btn-warning btn-sm" onclick="supplyChainSystem.requestStudy('${study.id}')">
               <i class="fas fa-envelope"></i> Richiedi
             </button>`
        }
      </td>
    `;

    return row;
  }

  getCorrelationsCount(studyId) {
    const correlations = SUPPLY_CHAIN_DATA.correlations[studyId];
    if (!correlations) return 0;
    
    return (correlations.upstream?.length || 0) + 
           (correlations.downstream?.length || 0) + 
           (correlations.same_level?.length || 0) +
           (correlations.cross_market?.length || 0);
  }

  showSupplyChain(studyId) {
    const study = SUPPLY_CHAIN_DATA.studies[studyId];
    if (!study) return;

    this.selectedStudy = study;
    
    // Popola il modal title
    document.getElementById('modalStudyTitle').textContent = study.name_it;
    
    // Popola current study card
    this.renderCurrentStudyCard(study);
    
    // Popola le sezioni supply chain
    this.renderSupplyChainSections(studyId);
    
    // Mostra il modal
    const modal = new bootstrap.Modal(document.getElementById('supplyChainModal'));
    modal.show();
  }

  renderCurrentStudyCard(study) {
    const container = document.getElementById('currentStudyCard');
    if (!container) return;

    const industry = SUPPLY_CHAIN_DATA.industries[study.industry] || {};
    
    container.innerHTML = `
      <div class="card border-primary">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h6 class="card-title">${study.name_it}</h6>
              <p class="card-subtitle text-muted">${study.name_en}</p>
              <p class="card-text">${study.description}</p>
            </div>
            <div class="text-end">
              <span class="badge bg-primary">${study.market}</span>
              <br>
              <span class="badge bg-secondary mt-1">ATECO: ${study.ateco}</span>
              <br>
              <span class="badge" style="background-color: ${industry.color}">
                ${industry.icon} ${industry.name_it}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderSupplyChainSections(studyId) {
    const correlations = SUPPLY_CHAIN_DATA.correlations[studyId] || {};
    
    // Upstream
    this.renderSupplyChainSection('upstreamStudies', correlations.upstream || [], '⬅️');
    
    // Same Level
    this.renderSupplyChainSection('sameLevelStudies', correlations.same_level || [], '🎯');
    
    // Downstream  
    this.renderSupplyChainSection('downstreamStudies', correlations.downstream || [], '➡️');
    
    // Cross Market
    this.renderSupplyChainSection('crossMarketStudies', correlations.cross_market || [], '🌍');
  }

  renderSupplyChainSection(containerId, studyIds, icon) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (studyIds.length === 0) {
      container.innerHTML = `
        <div class="text-center text-muted py-3">
          <i class="fas fa-info-circle"></i>
          <p class="mb-0">Nessuno studio correlato</p>
        </div>
      `;
      return;
    }

    studyIds.forEach(studyId => {
      const study = SUPPLY_CHAIN_DATA.studies[studyId] || 
                   SUPPLY_CHAIN_DATA.placeholder_studies[studyId] || 
                   { name_it: studyId, name_en: studyId, status: 'missing', ateco: 'N/A' };

      const card = this.createCorrelatedStudyCard(study, icon);
      container.appendChild(card);
    });
  }

  createCorrelatedStudyCard(study, icon) {
    const card = document.createElement('div');
    card.className = `card mb-2 ${study.status === 'missing' ? 'border-warning' : 'border-success'}`;

    const statusBadge = study.status === 'available'
      ? '<span class="badge bg-success">🟢 Disponibile</span>'
      : '<span class="badge bg-warning">🟡 Invia richiesta</span>';

    card.innerHTML = `
      <div class="card-body p-3">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h6 class="card-title mb-1">${study.name_it}</h6>
            <p class="card-subtitle text-muted mb-2">${study.name_en}</p>
            <small class="text-muted">ATECO: ${study.ateco}</small>
          </div>
          <div class="text-end">
            ${statusBadge}
            <div class="mt-2">
              ${study.status === 'available' 
                ? `<a href="https://www.plimsoll.it" target="_blank" class="btn btn-success btn-sm">Acquista</a>`
                : `<button class="btn btn-warning btn-sm" onclick="supplyChainSystem.requestStudy('${study.id || study.name_en}')">Richiedi</button>`
              }
            </div>
          </div>
        </div>
      </div>
    `;

    return card;
  }

  requestStudy(studyId) {
    const study = SUPPLY_CHAIN_DATA.studies[studyId] || 
                 SUPPLY_CHAIN_DATA.placeholder_studies[studyId] ||
                 { name_it: studyId, name_en: studyId, ateco: 'N/A' };

    // Popola il contenuto del modal di richiesta
    const content = document.getElementById('requestStudyContent');
    content.innerHTML = `
      <div class="alert alert-info">
        <h6><i class="fas fa-info-circle"></i> Studio Richiesto</h6>
        <p><strong>Nome:</strong> ${study.name_it}</p>
        <p><strong>Nome Inglese:</strong> ${study.name_en}</p>
        <p><strong>Codice ATECO:</strong> ${study.ateco}</p>
      </div>
      
      <h6>📧 Come Procedere</h6>
      <p>Per richiedere la fattibilità di questo studio:</p>
      <ol>
        <li>Clicca "Invia Email" per aprire il client di posta</li>
        <li>L'email sarà pre-compilata con tutti i dettagli</li>
        <li>Aggiungi eventuali specifiche aggiuntive</li>
        <li>Invia la richiesta a info@plimsoll.it</li>
      </ol>
      
      <div class="alert alert-warning">
        <small><strong>Nota:</strong> Il team Plimsoll valuterà la fattibilità tecnica ed economica dello studio richiesto e ti risponderà entro 3-5 giorni lavorativi.</small>
      </div>
    `;

    // Prepara il link email
    const emailSubject = `Richiesta Fattibilità Studio: ${study.name_it} (${study.ateco})`;
    const emailBody = `Gentile Team Plimsoll,

Vorrei richiedere la fattibilità per lo sviluppo dello studio:
"${study.name_it}" / "${study.name_en}"

Dettagli Studio:
- Codice ATECO: ${study.ateco}
- Mercato di interesse: Italia
- Tipo richiesta: Studio di fattibilità

Target aziende di interesse:
[Specificare il tipo di aziende che interessano]

Note aggiuntive:
[Eventuali specifiche particolari]

Per maggiori informazioni sui servizi Plimsoll:
https://p0.me-page.com/project/289223/f52161219504742f83c20630d9133419

Cordiali saluti,
[Il vostro nome]
[La vostra azienda]
[Contatti]`;

    const emailLink = `mailto:info@plimsoll.it?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    
    document.getElementById('sendEmailBtn').href = emailLink;

    // Mostra il modal
    const modal = new bootstrap.Modal(document.getElementById('requestStudyModal'));
    modal.show();
  }

  updateStats() {
    const totalStudies = Object.keys(SUPPLY_CHAIN_DATA.studies).length;
    const industries = Object.keys(SUPPLY_CHAIN_DATA.industries).length;
    
    document.getElementById('totalStudies').textContent = totalStudies.toLocaleString();
    document.getElementById('industriesCount').textContent = industries;
  }

  updateResultsCount(count) {
    document.getElementById('resultsCount').textContent = count;
    document.getElementById('totalCount').textContent = Object.keys(SUPPLY_CHAIN_DATA.studies).length;
  }
}

// Inizializza il sistema quando la pagina è caricata
let supplyChainSystem;

document.addEventListener('DOMContentLoaded', () => {
  supplyChainSystem = new SupplyChainSystem();
  
  console.log('🚀 Sistema Supply Chain Plimsoll inizializzato con successo');
  console.log(`📊 ${Object.keys(SUPPLY_CHAIN_DATA.studies).length} studi caricati`);
  console.log(`🏭 ${Object.keys(SUPPLY_CHAIN_DATA.industries).length} filiere mappate`);
});
