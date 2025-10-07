// Gestione dati del catalogo
class DataManager {
    constructor() {
        this.sectors = [];
        this.filteredSectors = [];
        this.currentPage = 1;
        this.itemsPerPage = 50;
        this.naceMapping = {};
        this.atecoMapping = {};
        
        this.initializeData();
    }

    async initializeData() {
        try {
            await this.loadNaceMapping();
            await this.loadSectorsData();
            this.updateDashboard();
        } catch (error) {
            console.error('Errore inizializzazione dati:', error);
            this.showToast('Errore nel caricamento dei dati iniziali', 'error');
        }
    }

    async loadNaceMapping() {
        try {
            const response = await fetch('data/ateco-nace.json');
            const data = await response.json();
            this.naceMapping = data.nace;
            this.atecoMapping = data.ateco;
            this.populateNaceFilter();
        } catch (error) {
            console.warn('File mappatura NACE non trovato, utilizzo dati predefiniti');
            this.createDefaultMapping();
        }
    }

    createDefaultMapping() {
        this.naceMapping = {
            'A': 'Agricoltura, silvicoltura e pesca',
            'B': 'Estrazione di minerali da cave e miniere',
            'C': 'Attività manifatturiere',
            'D': 'Fornitura di energia elettrica, gas, vapore',
            'E': 'Fornitura di acqua, reti fognarie, gestione rifiuti',
            'F': 'Costruzioni',
            'G': 'Commercio all\'ingrosso e al dettaglio',
            'H': 'Trasporto e magazzinaggio',
            'I': 'Attività dei servizi alloggio e ristorazione',
            'J': 'Servizi di informazione e comunicazione',
            'K': 'Attività finanziarie e assicurative',
            'L': 'Attività immobiliari',
            'M': 'Attività professionali, scientifiche e tecniche',
            'N': 'Noleggio, agenzie di viaggio, servizi di supporto',
            'O': 'Amministrazione pubblica e difesa',
            'P': 'Istruzione',
            'Q': 'Sanità e assistenza sociale',
            'R': 'Attività artistiche, sportive, intrattenimento',
            'S': 'Altre attività di servizi',
            'T': 'Attività di famiglie e convivenze',
            'U': 'Organizzazioni ed organismi extraterritoriali'
        };
        this.populateNaceFilter();
    }

    async loadSectorsData() {
        try {
            const response = await fetch('data/sectors.json');
            const data = await response.json();
            this.sectors = data.sectors || [];
            this.filteredSectors = [...this.sectors];
        } catch (error) {
            console.warn('File settori non trovato, inizializzazione con array vuoto');
            this.sectors = [];
            this.filteredSectors = [];
        }
    }

    populateNaceFilter() {
        const naceFilter = document.getElementById('naceFilter');
        if (!naceFilter) return;

        // Pulisce opzioni esistenti (tranne la prima)
        while (naceFilter.children.length > 1) {
            naceFilter.removeChild(naceFilter.lastChild);
        }

        // Aggiunge opzioni NACE
        Object.entries(this.naceMapping).forEach(([code, description]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${code} - ${description}`;
            naceFilter.appendChild(option);
        });
    }

    addSector(sectorData) {
        const newSector = {
            id: this.generateId(),
            name: sectorData.name,
            country: sectorData.country,
            nace: sectorData.nace || this.inferNaceFromName(sectorData.name),
            ateco: sectorData.ateco || this.inferAtecoFromNace(sectorData.nace),
            description: sectorData.description || this.generateDescription(sectorData.name),
            keywords: sectorData.keywords || this.generateKeywords(sectorData.name),
            lastUpdated: new Date().toISOString()
        };

        this.sectors.push(newSector);
        this.saveData();
        return newSector;
    }

    updateSector(id, updates) {
        const index = this.sectors.findIndex(s => s.id === id);
        if (index === -1) return false;

        this.sectors[index] = {
            ...this.sectors[index],
            ...updates,
            lastUpdated: new Date().toISOString()
        };

        this.saveData();
        return this.sectors[index];
    }

    deleteSector(id) {
        const index = this.sectors.findIndex(s => s.id === id);
        if (index === -1) return false;

        this.sectors.splice(index, 1);
        this.saveData();
        return true;
    }

    filterSectors(filters) {
        let filtered = [...this.sectors];

        // Filtro per testo di ricerca
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(sector =>
                sector.name.toLowerCase().includes(searchTerm) ||
                sector.description?.toLowerCase().includes(searchTerm) ||
                sector.keywords?.toLowerCase().includes(searchTerm) ||
                sector.nace?.toLowerCase().includes(searchTerm) ||
                sector.ateco?.toLowerCase().includes(searchTerm)
            );
        }

        // Filtro per paese
        if (filters.country) {
            filtered = filtered.filter(sector => sector.country === filters.country);
        }

        // Filtro per sezione NACE
        if (filters.nace) {
            filtered = filtered.filter(sector => sector.nace?.startsWith(filters.nace));
        }

        // Filtro per stato completezza
        if (filters.status) {
            filtered = filtered.filter(sector => {
                const hasDescription = sector.description && sector.description.length > 0;
                return filters.status === 'complete' ? hasDescription : !hasDescription;
            });
        }

        this.filteredSectors = filtered;
        this.currentPage = 1;
        return filtered;
    }

    getPaginatedSectors() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.filteredSectors.slice(startIndex, endIndex);
    }

    getTotalPages() {
        return Math.ceil(this.filteredSectors.length / this.itemsPerPage);
    }

    setPage(page) {
        const totalPages = this.getTotalPages();
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            return true;
        }
        return false;
    }

    generateId() {
        return 'sector_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    inferNaceFromName(name) {
        const nameWords = name.toLowerCase();
        
        // Mappature basate su parole chiave
        const naceKeywords = {
            'A': ['agricol', 'farm', 'pesca', 'allevamento', 'coltiva', 'viticoltura', 'zootecnia'],
            'C': ['fabbrica', 'produz', 'manufactur', 'industry', 'manifat', 'lavorazione'],
            'F': ['costruz', 'ediliz', 'building', 'immobil', 'casa'],
            'G': ['commercio', 'vendita', 'retail', 'wholesale', 'negozi', 'concession'],
            'H': ['trasport', 'logistic', 'shipping', 'autotrasport', 'corriere'],
            'I': ['hotel', 'ristoran', 'bar', 'albergo', 'accommodation', 'ristoraz'],
            'J': ['software', 'informatica', 'computer', 'telecomunicaz', 'internet', 'digital'],
            'K': ['banca', 'finanz', 'assicuraz', 'credito', 'investment', 'insurance'],
            'M': ['consulent', 'professional', 'tecnic', 'ingegneria', 'architect', 'legal'],
            'N': ['servizi', 'support', 'pulizie', 'security', 'manutenzione'],
            'R': ['sport', 'entertainment', 'giochi', 'cultura', 'spettacolo']
        };

        for (const [naceCode, keywords] of Object.entries(naceKeywords)) {
            if (keywords.some(keyword => nameWords.includes(keyword))) {
                return naceCode;
            }
        }

        return 'S'; // Default: Altre attività di servizi
    }

    inferAtecoFromNace(naceSection) {
        const naceToAtecoMapping = {
            'A': '01-03',
            'B': '05-09',
            'C': '10-33',
            'D': '35',
            'E': '36-39',
            'F': '41-43',
            'G': '45-47',
            'H': '49-53',
            'I': '55-56',
            'J': '58-63',
            'K': '64-66',
            'L': '68',
            'M': '69-75',
            'N': '77-82',
            'O': '84',
            'P': '85',
            'Q': '86-88',
            'R': '90-93',
            'S': '94-96',
            'T': '97-98',
            'U': '99'
        };

        return naceToAtecoMapping[naceSection] || '96.09';
    }

    generateDescription(name) {
        const cleanName = name.toLowerCase().trim();
        
        // Template per descrizioni basate sul tipo di settore
        const templates = {
            'concessionari': 'Concessionarie autorizzate per la vendita di autoveicoli e servizi post-vendita con assistenza tecnica specializzata.',
            'autofficin': 'Officine specializzate nella riparazione, manutenzione e assistenza tecnica di autoveicoli con servizi di diagnosi e ricambi.',
            'consulenz': 'Società di consulenza specializzate che forniscono servizi professionali e supporto tecnico alle imprese del settore.',
            'produz': 'Aziende manifatturiere che si occupano della produzione, lavorazione e commercializzazione di prodotti industriali.',
            'software': 'Società di sviluppo software e servizi informatici che forniscono soluzioni tecnologiche e sistemi digitali.',
            'costruz': 'Imprese di costruzioni e edilizia che realizzano opere civili, industriali e infrastrutture.',
            'commercio': 'Aziende commerciali che si occupano della distribuzione, vendita all\'ingrosso e al dettaglio di prodotti.',
            'servizi': 'Società di servizi che forniscono supporto professionale e attività specializzate alle imprese e ai privati.',
            'hotel': 'Strutture ricettive e servizi di ospitalità che offrono alloggio, ristorazione e servizi turistici.',
            'trasport': 'Aziende di trasporto e logistica che forniscono servizi di movimentazione merci e persone.'
        };

        // Trova il template più appropriato
        for (const [keyword, template] of Object.entries(templates)) {
            if (cleanName.includes(keyword)) {
                return template;
            }
        }

        // Template generico
        return `Aziende del settore ${name} che operano nel mercato fornendo prodotti e servizi specializzati ai propri clienti.`;
    }

    generateKeywords(name) {
        const nameWords = name.toLowerCase().split(/[\s,.-]+/);
        const commonWords = ['di', 'del', 'della', 'dei', 'delle', 'da', 'in', 'con', 'per', 'su', 'a', 'e', 'o', 'the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for'];
        
        // Filtra parole comuni e brevi
        const keywords = nameWords.filter(word => 
            word.length > 2 && !commonWords.includes(word)
        );

        // Aggiunge sinonimi basati sul contesto
        const contextKeywords = this.getContextKeywords(name);
        
        return [...new Set([...keywords, ...contextKeywords])].join(', ');
    }

    getContextKeywords(name) {
        const nameWords = name.toLowerCase();
        const contextMap = {
            'concessionari': ['automotive', 'automobili', 'vendita', 'auto'],
            'software': ['informatica', 'tecnologia', 'digitale', 'IT'],
            'costruz': ['edilizia', 'immobiliare', 'cantieri', 'opere'],
            'hotel': ['turismo', 'ospitalità', 'ristorazione', 'alloggio'],
            'consulenz': ['professionale', 'business', 'advisory', 'expertise']
        };

        for (const [keyword, contexts] of Object.entries(contextMap)) {
            if (nameWords.includes(keyword)) {
                return contexts;
            }
        }

        return [];
    }

    async processUploadedFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    let sectors = [];

                    if (file.name.endsWith('.csv')) {
                        sectors = this.parseCSV(data);
                    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                        sectors = this.parseExcel(data);
                    }

                    // Processa e integra i settori
                    const processedSectors = sectors.map(sector => ({
                        ...sector,
                        id: this.generateId(),
                        nace: sector.nace || this.inferNaceFromName(sector.name),
                        ateco: sector.ateco || this.inferAtecoFromNace(sector.nace),
                        description: sector.description || this.generateDescription(sector.name),
                        keywords: sector.keywords || this.generateKeywords(sector.name),
                        lastUpdated: new Date().toISOString()
                    }));

                    resolve({
                        fileName: file.name,
                        sectorsFound: processedSectors.length,
                        sectors: processedSectors
                    });
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Errore lettura file'));
            
            if (file.name.endsWith('.csv')) {
                reader.readAsText(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        });
    }

    parseCSV(csvData) {
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const sectors = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            if (values.length >= headers.length) {
                const sector = {};
                headers.forEach((header, index) => {
                    const key = this.normalizeHeaderKey(header);
                    sector[key] = values[index] || '';
                });
                
                if (sector.name && sector.name.length > 0) {
                    sectors.push(sector);
                }
            }
        }

        return sectors;
    }

    parseExcel(arrayBuffer) {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        return jsonData.map(row => ({
            name: row['Nome'] || row['Name'] || row['Sector'] || row['Settore'] || '',
            country: row['Paese'] || row['Country'] || row['Nazione'] || '',
            description: row['Descrizione'] || row['Description'] || '',
            nace: row['NACE'] || row['Nace'] || '',
            ateco: row['ATECO'] || row['Ateco'] || '',
            keywords: row['Keywords'] || row['Parole Chiave'] || ''
        }));
    }

    normalizeHeaderKey(header) {
        const mapping = {
            'nome': 'name',
            'name': 'name',
            'sector': 'name',
            'settore': 'name',
            'paese': 'country',
            'country': 'country',
            'nazione': 'country',
            'descrizione': 'description',
            'description': 'description',
            'nace': 'nace',
            'ateco': 'ateco',
            'keywords': 'keywords',
            'parole chiave': 'keywords'
        };

        return mapping[header.toLowerCase()] || header.toLowerCase();
    }

    mergeUploadedSectors(uploadedSectors) {
        let merged = 0;
        let added = 0;

        uploadedSectors.forEach(uploadedSector => {
            const existing = this.sectors.find(s => 
                s.name.toLowerCase() === uploadedSector.name.toLowerCase() &&
                s.country === uploadedSector.country
            );

            if (existing) {
                // Merge: aggiorna solo campi vuoti
                let updated = false;
                Object.keys(uploadedSector).forEach(key => {
                    if (uploadedSector[key] && !existing[key]) {
                        existing[key] = uploadedSector[key];
                        updated = true;
                    }
                });
                if (updated) {
                    existing.lastUpdated = new Date().toISOString();
                    merged++;
                }
            } else {
                // Aggiungi nuovo settore
                this.sectors.push(uploadedSector);
                added++;
            }
        });

        this.saveData();
        return { merged, added };
    }

    updateDashboard() {
        const totalSectors = this.sectors.length;
        const withDescription = this.sectors.filter(s => s.description && s.description.length > 0).length;
        const missingDescription = totalSectors - withDescription;
        const countries = [...new Set(this.sectors.map(s => s.country))].length;

        document.getElementById('totalSectors').textContent = totalSectors.toLocaleString();
        document.getElementById('withDescription').textContent = withDescription.toLocaleString();
        document.getElementById('missingDescription').textContent = missingDescription.toLocaleString();
        document.getElementById('countriesCovered').textContent = countries;
    }

    async saveData() {
        try {
            // In un ambiente reale, questo farebbe una chiamata API
            // Per ora salviamo in localStorage come backup
            localStorage.setItem('plimsoll_sectors', JSON.stringify({
                sectors: this.sectors,
                lastSaved: new Date().toISOString()
            }));

            // Trigger evento per GitHub sync (da implementare)
            this.triggerGitHubSync();
        } catch (error) {
            console.error('Errore salvataggio dati:', error);
            this.showToast('Errore nel salvataggio dei dati', 'error');
        }
    }

    async triggerGitHubSync() {
        // Placeholder per sincronizzazione con GitHub
        // Implementare con GitHub API o webhook
        console.log('Trigger GitHub sync - da implementare');
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    exportToCSV() {
        const headers = ['Nome', 'Paese', 'NACE', 'ATECO', 'Descrizione', 'Keywords'];
        const csvContent = [
            headers.join(','),
            ...this.sectors.map(sector => [
                `"${sector.name || ''}"`,
                `"${sector.country || ''}"`,
                `"${sector.nace || ''}"`,
                `"${sector.ateco || ''}"`,
                `"${sector.description || ''}"`,
                `"${sector.keywords || ''}"`
            ].join(','))
        ].join('\n');

        return csvContent;
    }

    exportToExcel() {
        const worksheet = XLSX.utils.json_to_sheet(
            this.sectors.map(sector => ({
                'Nome': sector.name || '',
                'Paese': sector.country || '',
                'Codice NACE': sector.nace || '',
                'Codice ATECO': sector.ateco || '',
                'Descrizione': sector.description || '',
                'Keywords': sector.keywords || '',
                'Ultimo Aggiornamento': sector.lastUpdated || ''
            }))
        );

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Catalogo Settori');
        
        return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    }
}

// Inizializza il data manager globalmente
let dataManager;
document.addEventListener('DOMContentLoaded', () => {
    dataManager = new DataManager();
});
