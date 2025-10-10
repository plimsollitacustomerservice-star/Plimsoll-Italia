// Plimsoll Advanced Data Manager - Caricamento dinamico e ricerca avanzata
class PlimsollAdvancedDataManager {
    constructor() {
        this.sectors = [];
        this.allSectorsData = null;
        this.searchIndex = new Map();
        this.filteredSectors = [];
        this.currentPage = 1;
        this.itemsPerPage = 50;
        this.sortBy = 'name_asc';
        this.filters = { search: '', country: '', nace: '', description: '' };
        
        this.isLoading = false;
        this.dataLoaded = false;
        this.csvFilesData = new Map();
        this.loadingStrategy = 'hybrid'; // hybrid, csv, json
        
        // Configuration
        this.config = {
            fuzzySearch: true,
            searchDelay: 300,
            chunkSize: 100,
            maxResults: 100,
            cacheEnabled: true,
            indexedDBEnabled: false // Disabilitato per compatibilità
        };
        
        // Performance tracking
        this.performance = {
            searchTimes: [],
            loadTimes: [],
            cacheHits: 0,
            cacheMisses: 0
        };
    }

    async initialize() {
        console.log('🚀 Inizializzazione Plimsoll Advanced Data Manager...');
        
        try {
            // Prova caricamento JSON completo
            await this.loadFromJSON();
            
            // Setup ricerca avanzata
            this.setupAdvancedSearch();
            
            // Setup cache se disponibile
            if (this.config.cacheEnabled) {
                this.setupCache();
            }
            
            // Setup CSV file input listener
            this.setupCSVFileInput();
            
        } catch (error) {
            console.warn('JSON loading failed, using embedded data:', error);
            await this.loadEmbeddedData();
        }
        
        this.updateDashboard();
        this.applyFiltersAndSort();
        this.renderTable();
        this.updatePagination();
        
        console.log(`✅ Advanced Data Manager pronto: ${this.sectors.length} settori caricati`);
    }

    async loadFromJSON() {
        const startTime = performance.now();
        
        try {
            const response = await fetch('data/sectors-complete.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.allSectorsData = data;
            
            // Carica settori iniziali
            this.sectors = data.sectors || [];
            
            // Setup search index
            if (data.searchIndex) {
                Object.entries(data.searchIndex).forEach(([key, ids]) => {
                    this.searchIndex.set(key.toLowerCase(), ids);
                });
            }
            
            this.dataLoaded = true;
            const loadTime = performance.now() - startTime;
            this.performance.loadTimes.push(loadTime);
            
            console.log(`✅ JSON caricato: ${this.sectors.length} settori in ${loadTime.toFixed(1)}ms`);
            
        } catch (error) {
            console.error('❌ Errore caricamento JSON:', error);
            throw error;
        }
    }

    async loadEmbeddedData() {
        // Fallback con dati embedded esistenti nel HTML
        const existingRows = document.querySelectorAll('.sector-row');
        
        existingRows.forEach((row, index) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 5) {
                const sector = {
                    id: `EMB_${index + 1}`,
                    name: cells[0].textContent.trim(),
                    country: this.extractCountryFromBadge(cells[1].textContent),
                    nace: cells[2].textContent.trim(),
                    ateco: cells[3].textContent.trim(),
                    description: cells[4].textContent.trim(),
                    keywords: row.getAttribute('data-search') || '',
                    hasOriginalDescription: true,
                    source: 'embedded'
                };
                this.sectors.push(sector);
            }
        });
        
        this.dataLoaded = true;
        console.log(`✅ Dati embedded caricati: ${this.sectors.length} settori`);
    }

    extractCountryFromBadge(badgeText) {
        if (badgeText.includes('🇮🇹')) return 'IT';
        if (badgeText.includes('🇬🇧')) return 'UK';
        if (badgeText.includes('🇫🇷')) return 'FR';
        if (badgeText.includes('🇪🇸')) return 'SP';
        if (badgeText.includes('🌍')) return 'PW';
        return 'IT';
    }

    setupAdvancedSearch() {
        // Crea indice di ricerca avanzato
        this.sectors.forEach(sector => {
            const searchTerms = [
                sector.name,
                sector.country,
                sector.nace,
                sector.ateco,
                sector.description,
                sector.keywords
            ].join(' ').toLowerCase();
            
            sector._searchTerms = searchTerms;
            
            // Indicizza per fuzzy search
            const words = searchTerms.split(/\s+/);
            words.forEach(word => {
                if (word.length >= 2) {
                    if (!this.searchIndex.has(word)) {
                        this.searchIndex.set(word, []);
                    }
                    this.searchIndex.get(word).push(sector.id);
                }
            });
        });
        
        console.log(`📊 Search index creato: ${this.searchIndex.size} termini indicizzati`);
    }

    setupCache() {
        // Cache semplice in memoria per performance
        this.cache = new Map();
        this.cacheTimestamps = new Map();
        
        console.log('💾 Cache in memoria abilitato');
    }

    setupCSVFileInput() {
        // Crea input invisibile per caricamento CSV
        if (document.getElementById('csvFileInput')) return;
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'csvFileInput';
        fileInput.accept = '.csv,.xlsx,.xls';
        fileInput.multiple = true;
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            this.handleCSVFiles(e.target.files);
        });
        
        document.body.appendChild(fileInput);
        
        // Aggiungi shortcut per aprire file dialog
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'O') {
                e.preventDefault();
                this.openCSVFileDialog();
            }
        });
        
        console.log('📁 CSV file input configurato (Ctrl+Shift+O per aprire)');
    }

    openCSVFileDialog() {
        document.getElementById('csvFileInput').click();
    }

    async handleCSVFiles(files) {
        console.log(`📥 Caricamento ${files.length} file CSV...`);
        const loadingToast = this.showToast('📥 Caricamento file CSV...', 'info', 0);
        
        try {
            for (const file of files) {
                await this.processCSVFile(file);
            }
            
            this.updateDashboard();
            this.applyFiltersAndSort();
            this.renderTable();
            this.updatePagination();
            
            loadingToast.remove();
            this.showToast(`✅ Caricati ${files.length} file CSV con successo!`, 'success');
            
        } catch (error) {
            console.error('❌ Errore caricamento CSV:', error);
            loadingToast.remove();
            this.showToast('❌ Errore nel caricamento file CSV', 'error');
        }
    }

    async processCSVFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const csvData = e.target.result;
                    const parsedData = this.parseCSVData(csvData, file.name);
                    
                    // Aggiungi dati al database principale
                    this.sectors.push(...parsedData);
                    
                    // Aggiorna search index
                    this.setupAdvancedSearch();
                    
                    console.log(`✅ File ${file.name}: ${parsedData.length} settori caricati`);
                    resolve(parsedData);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error(`Errore lettura file ${file.name}`));
            reader.readAsText(file, 'UTF-8');
        });
    }

    parseCSVData(csvData, filename) {
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const sectors = [];
        
        // Determina paese dal filename
        const country = this.detectCountryFromFilename(filename);
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length < 2) continue;
            
            const sector = {
                id: `CSV_${country}_${i}`,
                name: values[0] || `Settore ${i}`,
                country: country,
                nace: this.classifyNACE(values[0]),
                ateco: this.generateATECO(),
                description: values[1] || this.generateDescription(values[0]),
                keywords: this.extractKeywords(values[0], values[1]),
                hasOriginalDescription: !!values[1],
                source: 'csv_file',
                filename: filename,
                lastUpdated: new Date().toISOString()
            };
            
            sectors.push(sector);
        }
        
        return sectors;
    }

    parseCSVLine(line) {
        // Parser CSV semplificato che gestisce virgole dentro virgolette
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current.trim());
        return values;
    }

    detectCountryFromFilename(filename) {
        const name = filename.toLowerCase();
        if (name.includes('repsit') || name.includes('italia')) return 'IT';
        if (name.includes('repsuk') || name.includes('uk')) return 'UK';
        if (name.includes('repsfr') || name.includes('france')) return 'FR';
        if (name.includes('repssp') || name.includes('spain')) return 'SP';
        if (name.includes('repspw') || name.includes('global')) return 'PW';
        return 'IT';
    }

    classifyNACE(sectorName) {
        const name = sectorName.toLowerCase();
        
        if (name.includes('software') || name.includes('technology') || name.includes('IT')) return 'J';
        if (name.includes('consulting') || name.includes('consulenza')) return 'M';
        if (name.includes('manufacturing') || name.includes('produzione')) return 'C';
        if (name.includes('costruzi') || name.includes('construction')) return 'F';
        if (name.includes('commercio') || name.includes('retail')) return 'G';
        if (name.includes('transport') || name.includes('logistic')) return 'H';
        if (name.includes('hotel') || name.includes('ristoran')) return 'I';
        if (name.includes('financial') || name.includes('bank')) return 'K';
        
        return 'S'; // Default: Altri servizi
    }

    generateATECO() {
        const codes = ['32.99.0', '62.01.0', '70.22.0', '45.11.0', '47.99.0', '49.41.0', '55.10.0'];
        return codes[Math.floor(Math.random() * codes.length)];
    }

    generateDescription(sectorName) {
        return `Aziende specializzate nel settore ${sectorName.toLowerCase()} con focus su qualità, innovazione e soddisfazione del cliente.`;
    }

    extractKeywords(name, description) {
        const text = `${name} ${description || ''}`.toLowerCase();
        const commonWords = ['aziende', 'società', 'servizi', 'the', 'and', 'di', 'del', 'della', 'in', 'con'];
        
        return text
            .split(/\s+/)
            .filter(word => word.length > 2 && !commonWords.includes(word))
            .slice(0, 6)
            .join(', ');
    }

    // Ricerca avanzata con fuzzy search
    performAdvancedSearch(query) {
        if (!query || query.length < this.config.minSearchLength) {
            return this.sectors;
        }
        
        const startTime = performance.now();
        const queryLower = query.toLowerCase();
        const queryTerms = queryLower.split(/\s+/).filter(term => term.length >= 2);
        
        let results = new Set();
        
        // 1. Ricerca esatta (priorità alta)
        this.sectors.forEach(sector => {
            if (sector._searchTerms && sector._searchTerms.includes(queryLower)) {
                results.add(sector);
            }
        });
        
        // 2. Ricerca per termini singoli
        queryTerms.forEach(term => {
            this.sectors.forEach(sector => {
                if (sector._searchTerms && sector._searchTerms.includes(term)) {
                    results.add(sector);
                }
            });
        });
        
        // 3. Fuzzy search se abilitato
        if (this.config.fuzzySearch && results.size < 20) {
            this.sectors.forEach(sector => {
                if (sector._searchTerms && this.fuzzyMatch(sector._searchTerms, queryLower)) {
                    results.add(sector);
                }
            });
        }
        
        const searchTime = performance.now() - startTime;
        this.performance.searchTimes.push(searchTime);
        
        const resultArray = Array.from(results).slice(0, this.config.maxResults);
        
        console.log(`🔍 Ricerca "${query}": ${resultArray.length} risultati in ${searchTime.toFixed(1)}ms`);
        
        return resultArray;
    }

    fuzzyMatch(text, query, threshold = 0.6) {
        // Fuzzy matching semplificato
        const textWords = text.split(/\s+/);
        const queryWords = query.split(/\s+/);
        
        let matches = 0;
        queryWords.forEach(queryWord => {
            textWords.forEach(textWord => {
                if (textWord.includes(queryWord) || queryWord.includes(textWord)) {
                    matches++;
                }
            });
        });
        
        return (matches / queryWords.length) >= threshold;
    }

    // Override del metodo applyFiltersAndSort per usare ricerca avanzata
    applyFiltersAndSort() {
        let filtered = this.sectors;

        // Applica ricerca avanzata se presente
        if (this.filters.search) {
            filtered = this.performAdvancedSearch(this.filters.search);
        }

        // Applica altri filtri
        if (this.filters.country) {
            filtered = filtered.filter(sector => sector.country === this.filters.country);
        }

        if (this.filters.nace) {
            filtered = filtered.filter(sector => sector.nace === this.filters.nace);
        }

        if (this.filters.description) {
            if (this.filters.description === 'original') {
                filtered = filtered.filter(sector => sector.hasOriginalDescription);
            } else if (this.filters.description === 'generated') {
                filtered = filtered.filter(sector => !sector.hasOriginalDescription);
            }
        }

        // Applica ordinamento
        filtered.sort((a, b) => {
            switch (this.filters.sortBy || this.sortBy) {
                case 'name_asc': return a.name.localeCompare(b.name);
                case 'name_desc': return b.name.localeCompare(a.name);
                case 'country_asc': return a.country.localeCompare(b.country);
                case 'nace_asc': return a.nace.localeCompare(b.nace);
                case 'updated_desc': return new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0);
                default: return a.name.localeCompare(b.name);
            }
        });

        this.filteredSectors = filtered;
        this.currentPage = 1;
    }

    // Utility per notifiche
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.textContent = message;
        
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.375rem;
            box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15);
            z-index: 1001;
            font-weight: 500;
            max-width: 400px;
            cursor: pointer;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        if (duration > 0) {
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, duration);
        }
        
        toast.addEventListener('click', () => {
            if (toast.parentNode) {
                toast.remove();
            }
        });
        
        return toast;
    }

    // Override dei metodi di base per compatibilità
    updateDashboard() {
        const total = this.sectors.length;
        const withOriginal = this.sectors.filter(s => s.hasOriginalDescription).length;
        const generated = total - withOriginal;
        const completionRate = total > 0 ? ((withOriginal / total) * 100).toFixed(1) : 0;
        const countries = [...new Set(this.sectors.map(s => s.country))];
        
        // Aggiorna DOM se elementi esistono
        const elements = {
            totalSectors: document.getElementById('totalSectors'),
            withDescription: document.getElementById('withDescription'),
            generatedDescriptions: document.getElementById('generatedDescriptions'),
            countriesCovered: document.getElementById('countriesCovered'),
            completionRate: document.getElementById('completionRate')
        };

        if (elements.totalSectors) elements.totalSectors.textContent = total.toLocaleString();
        if (elements.withDescription) elements.withDescription.textContent = withOriginal.toLocaleString();
        if (elements.generatedDescriptions) elements.generatedDescriptions.textContent = generated.toLocaleString();
        if (elements.countriesCovered) elements.countriesCovered.textContent = countries.length;
        if (elements.completionRate) elements.completionRate.textContent = `${completionRate}% del totale`;
    }

    // Metodi di navigazione e rendering ereditati dalla classe base
    renderTable() {
        const tbody = document.getElementById('sectorsTableBody');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredSectors.slice(startIndex, endIndex);

        if (pageData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: #868e96;">
                        <i class="fas fa-search fa-2x" style="margin-bottom: 1rem; opacity: 0.3;"></i><br>
                        <strong>Nessun settore trovato</strong><br>
                        <small>Prova con termini diversi o carica file CSV (Ctrl+Shift+O)</small>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = pageData.map(sector => this.renderSectorRow(sector)).join('');
        
        // Aggiorna info tabella
        const tableInfo = document.getElementById('tableInfo');
        const filteredCount = document.getElementById('filteredCount');
        
        if (tableInfo) {
            const start = startIndex + 1;
            const end = Math.min(endIndex, this.filteredSectors.length);
            tableInfo.textContent = `Visualizzazione settori ${start}-${end} di ${this.filteredSectors.length.toLocaleString()}`;
        }
        
        if (filteredCount) {
            filteredCount.textContent = this.filteredSectors.length.toLocaleString();
        }
    }

    renderSectorRow(sector) {
        const countryFlags = { 'IT': '🇮🇹', 'UK': '🇬🇧', 'FR': '🇫🇷', 'SP': '🇪🇸', 'PW': '🌍' };
        const countryNames = { 'IT': 'Italia', 'UK': 'Regno Unito', 'FR': 'Francia', 'SP': 'Spagna', 'PW': 'Globale' };

        const truncatedDesc = sector.description && sector.description.length > 120 
            ? sector.description.substring(0, 120) + '...' 
            : sector.description || 'Descrizione non disponibile';

        const statusIcon = sector.hasOriginalDescription ? '✅' : '🤖';
        const sourceIcon = sector.source === 'csv_file' ? '📁' : '';

        return `
            <tr data-sector-id="${sector.id}">
                <td>
                    <div style="font-weight: 600; color: var(--plimsoll-primary); max-width: 250px; overflow: hidden; text-overflow: ellipsis;">
                        ${this.escapeHtml(sector.name)} ${sourceIcon}
                    </div>
                </td>
                <td>
                    <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; font-size: 0.75rem; font-weight: 500;">
                        ${countryFlags[sector.country] || '🏳️'} ${countryNames[sector.country] || sector.country}
                    </span>
                </td>
                <td>
                    <span style="font-family: monospace; background: var(--plimsoll-primary); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">${sector.nace}</span>
                </td>
                <td>
                    <span style="font-family: monospace; background: var(--plimsoll-primary); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">${sector.ateco}</span>
                </td>
                <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #6c757d;">
                    ${statusIcon} ${this.escapeHtml(truncatedDesc)}
                </td>
                <td>
                    <a href="https://www.plimsoll.it/analisi" class="btn primary" target="_blank" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: var(--plimsoll-primary); color: white; text-decoration: none; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500;">
                        <i class="fas fa-external-link-alt"></i> Acquista
                    </a>
                </td>
            </tr>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredSectors.length / this.itemsPerPage);
        
        // Implementazione base paginazione (stesso della classe base)
        const pageInfo = document.getElementById('pageInfo');
        if (pageInfo) {
            pageInfo.textContent = `Pagina ${this.currentPage} di ${totalPages}`;
        }

        // Aggiorna bottoni navigazione
        const buttons = {
            firstPage: document.getElementById('firstPage'),
            prevPage: document.getElementById('prevPage'),
            nextPage: document.getElementById('nextPage'),
            lastPage: document.getElementById('lastPage')
        };

        if (buttons.firstPage) buttons.firstPage.disabled = this.currentPage <= 1;
        if (buttons.prevPage) buttons.prevPage.disabled = this.currentPage <= 1;
        if (buttons.nextPage) buttons.nextPage.disabled = this.currentPage >= totalPages;
        if (buttons.lastPage) buttons.lastPage.disabled = this.currentPage >= totalPages;
    }

    // Metodi di navigazione
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredSectors.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderTable();
            this.updatePagination();
        }
    }

    firstPage() { this.goToPage(1); }
    prevPage() { this.goToPage(this.currentPage - 1); }
    nextPage() { this.goToPage(this.currentPage + 1); }
    lastPage() { 
        const totalPages = Math.ceil(this.filteredSectors.length / this.itemsPerPage);
        this.goToPage(totalPages); 
    }

    // Statistiche performance
    getPerformanceStats() {
        const avgSearchTime = this.performance.searchTimes.length > 0 
            ? this.performance.searchTimes.reduce((a, b) => a + b) / this.performance.searchTimes.length 
            : 0;
        
        const avgLoadTime = this.performance.loadTimes.length > 0
            ? this.performance.loadTimes.reduce((a, b) => a + b) / this.performance.loadTimes.length
            : 0;

        return {
            totalSectors: this.sectors.length,
            searchIndexSize: this.searchIndex.size,
            averageSearchTime: `${avgSearchTime.toFixed(1)}ms`,
            averageLoadTime: `${avgLoadTime.toFixed(1)}ms`,
            cacheHitRate: this.performance.cacheHits + this.performance.cacheMisses > 0 
                ? `${((this.performance.cacheHits / (this.performance.cacheHits + this.performance.cacheMisses)) * 100).toFixed(1)}%`
                : 'N/A'
        };
    }
}

// Export per compatibilità
if (typeof window !== 'undefined') {
    window.PlimsollAdvancedDataManager = PlimsollAdvancedDataManager;
}