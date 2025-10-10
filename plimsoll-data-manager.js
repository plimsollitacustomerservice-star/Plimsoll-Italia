// Plimsoll Data Manager - Gestisce caricamento e manipolazione dati
class PlimsollDataManager {
    constructor() {
        this.sectors = [];
        this.filteredSectors = [];
        this.currentPage = 1;
        this.itemsPerPage = 50;
        this.sortBy = 'name_asc';
        this.filters = {
            search: '',
            country: '',
            nace: '',
            description: ''
        };
        
        this.isLoading = false;
        this.dataLoaded = false;
    }

    async initialize() {
        console.log('🚀 Inizializzazione Plimsoll Data Manager...');
        await this.loadSectorsData();
        this.updateDashboard();
        this.applyFiltersAndSort();
        this.renderTable();
        this.updatePagination();
    }

    async loadSectorsData() {
        if (this.isLoading || this.dataLoaded) return;
        
        this.isLoading = true;
        this.showLoadingState();
        
        try {
            console.log('📊 Caricamento dati settori...');
            
            // Prova a caricare da data/sectors.json
            const response = await fetch('data/sectors.json');
            if (response.ok) {
                const data = await response.json();
                this.processLoadedData(data);
            } else {
                // Fallback: genera dati di esempio da file CSV
                console.log('⚠️ sectors.json non trovato, caricamento dati di esempio...');
                await this.generateSampleData();
            }
            
            this.dataLoaded = true;
            console.log(`✅ Caricati ${this.sectors.length} settori`);
            
        } catch (error) {
            console.error('❌ Errore caricamento dati:', error);
            await this.generateSampleData();
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    processLoadedData(data) {
        // Processa dati da sectors.json
        if (data.sample_sectors && data.sample_sectors.length > 0) {
            this.sectors = data.sample_sectors;
        } else if (data.sectors) {
            this.sectors = data.sectors;
        } else {
            // Usa metadati per creare struttura dati di esempio
            this.generateFromMetadata(data.metadata, data.statistics);
        }
        
        this.filteredSectors = [...this.sectors];
    }

    async generateSampleData() {
        // Genera dati di esempio basati sui CSV analizzati
        console.log('🔧 Generazione dati di esempio...');
        
        const sampleSectors = [
            // Italia - Automotive
            {
                id: 'IT_001',
                name: 'Concessionarie AUDI',
                name_native: 'Concessionarie AUDI',
                country: 'IT',
                nace: 'G',
                ateco: '45.11.0',
                description: 'Concessionarie autorizzate per la vendita di autoveicoli Audi nuovi e usati, con servizi completi di assistenza post-vendita, finanziamento, assicurazione e ricambi originali.',
                keywords: 'audi, concessionarie, automotive, automobili, vendita, assistenza',
                hasOriginalDescription: false,
                lastUpdated: '2025-10-10T15:25:00Z'
            },
            {
                id: 'IT_002',
                name: 'Autofficine e Riparazione Auto',
                country: 'IT',
                nace: 'G',
                ateco: '45.20.1',
                description: 'Officine meccaniche specializzate nella riparazione, manutenzione e assistenza tecnica di autoveicoli con servizi di diagnosi computerizzata.',
                keywords: 'riparazione, auto, officine, manutenzione, assistenza',
                hasOriginalDescription: true
            },
            
            // Regno Unito - Software
            {
                id: 'UK_001',
                name: 'Software Development Companies',
                country: 'UK',
                nace: 'J',
                ateco: '62.01.0',
                description: 'Companies specialising in software development, digital solutions and IT consulting services for businesses across various industries.',
                keywords: 'software, development, IT, digital, technology, consulting',
                hasOriginalDescription: true
            },
            {
                id: 'UK_002',
                name: 'Telecommunications Services',
                country: 'UK',
                nace: 'J',
                ateco: '61.10.0',
                description: 'Telecommunications companies providing mobile, fixed-line and internet services to residential and business customers.',
                keywords: 'telecommunications, mobile, internet, connectivity, communications',
                hasOriginalDescription: true
            },
            
            // Francia - Alimentare
            {
                id: 'FR_001',
                name: 'Abattage d\'Animaux de Boucherie',
                country: 'FR',
                nace: 'C',
                ateco: '10.11.0',
                description: 'Entreprises spécialisées dans l\'abattage et la transformation de produits carnés avec respect des normes sanitaires strictes.',
                keywords: 'abattoir, viande, transformation, alimentaire, boucherie',
                hasOriginalDescription: true
            },
            {
                id: 'FR_002',
                name: 'Produits Laitiers et Fromages',
                country: 'FR',
                nace: 'C',
                ateco: '10.51.0',
                description: 'Laiteries et fromageries spécialisées dans la transformation du lait en fromages, yaourts et produits dérivés.',
                keywords: 'lait, fromage, laiterie, transformation, alimentaire',
                hasOriginalDescription: false
            },
            
            // Spagna - Costruzioni
            {
                id: 'SP_001',
                name: 'Construcción de Edificios',
                country: 'SP',
                nace: 'F',
                ateco: '41.20.0',
                description: 'Empresas de construcción especializadas en edificación residencial y comercial con servicios completos.',
                keywords: 'construcción, edificios, inmobiliario, obras, arquitectura',
                hasOriginalDescription: true
            },
            {
                id: 'SP_002',
                name: 'Ingeniería Civil',
                country: 'SP',
                nace: 'F',
                ateco: '42.11.0',
                description: 'Empresas especializadas en infraestructuras civiles, carreteras, puentes y obras públicas.',
                keywords: 'ingeniería, civil, infraestructuras, carreteras, puentes',
                hasOriginalDescription: false
            },
            
            // Mercato Globale - Manifatturiero
            {
                id: 'PW_001',
                name: 'Global Manufacturing Industries',
                country: 'PW',
                nace: 'C',
                ateco: '32.99.0',
                description: 'International manufacturing companies specializing in industrial production and global supply chain management.',
                keywords: 'manufacturing, industrial, production, global, supply chain',
                hasOriginalDescription: true
            },
            {
                id: 'PW_002',
                name: 'International Trading Companies',
                country: 'PW',
                nace: 'G',
                ateco: '47.99.0',
                description: 'Global trading companies facilitating international commerce and distribution across multiple markets.',
                keywords: 'trading, international, commerce, distribution, export, import',
                hasOriginalDescription: false
            }
        ];

        // Espandi i dati con più settori simulati
        const expandedSectors = [...sampleSectors];
        const countries = ['IT', 'UK', 'FR', 'SP', 'PW'];
        const naces = ['A', 'B', 'C', 'F', 'G', 'H', 'I', 'J', 'M', 'S'];
        const sectorTypes = [
            'Consulting Services', 'Manufacturing', 'Retail Trade', 'Construction',
            'Transport Services', 'Food Industry', 'Tourism', 'Healthcare',
            'Education Services', 'Financial Services', 'Real Estate',
            'Agriculture', 'Mining', 'Energy', 'Technology'
        ];

        // Genera altri settori per raggiungere un numero significativo
        for (let i = 0; i < 100; i++) {
            const country = countries[Math.floor(Math.random() * countries.length)];
            const nace = naces[Math.floor(Math.random() * naces.length)];
            const sectorType = sectorTypes[Math.floor(Math.random() * sectorTypes.length)];
            
            expandedSectors.push({
                id: `${country}_${String(i + 100).padStart(3, '0')}`,
                name: `${sectorType} ${i + 1}`,
                country: country,
                nace: nace,
                ateco: this.generateAtecoFromNace(nace),
                description: `Aziende specializzate nel settore ${sectorType.toLowerCase()} con focus su innovazione e qualità del servizio.`,
                keywords: `${sectorType.toLowerCase()}, business, services, quality`,
                hasOriginalDescription: Math.random() > 0.4,
                lastUpdated: '2025-10-10T15:25:00Z'
            });
        }

        this.sectors = expandedSectors;
        this.filteredSectors = [...this.sectors];
    }

    generateAtecoFromNace(nace) {
        const naceAtecoMap = {
            'A': '01.50.0', 'B': '08.99.0', 'C': '32.99.0', 'F': '43.99.0',
            'G': '47.99.0', 'H': '53.20.0', 'I': '56.29.0', 'J': '63.99.0',
            'M': '74.90.0', 'S': '96.09.0'
        };
        return naceAtecoMap[nace] || '96.09.0';
    }

    applyFiltersAndSort() {
        let filtered = [...this.sectors];

        // Applica filtri
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(sector => 
                sector.name.toLowerCase().includes(searchTerm) ||
                (sector.description && sector.description.toLowerCase().includes(searchTerm)) ||
                (sector.keywords && sector.keywords.toLowerCase().includes(searchTerm)) ||
                sector.nace.toLowerCase().includes(searchTerm) ||
                sector.ateco.toLowerCase().includes(searchTerm)
            );
        }

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
                case 'name_asc':
                    return a.name.localeCompare(b.name);
                case 'name_desc':
                    return b.name.localeCompare(a.name);
                case 'country_asc':
                    return a.country.localeCompare(b.country);
                case 'nace_asc':
                    return a.nace.localeCompare(b.nace);
                case 'updated_desc':
                    return new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0);
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        this.filteredSectors = filtered;
        this.currentPage = 1; // Reset alla prima pagina
    }

    updateDashboard() {
        const total = this.sectors.length;
        const withOriginal = this.sectors.filter(s => s.hasOriginalDescription).length;
        const generated = total - withOriginal;
        const completionRate = total > 0 ? ((withOriginal / total) * 100).toFixed(1) : 0;
        
        const countries = [...new Set(this.sectors.map(s => s.country))];
        
        // Aggiorna DOM
        const totalEl = document.getElementById('totalSectors');
        const withDescEl = document.getElementById('withDescription');
        const generatedEl = document.getElementById('generatedDescriptions');
        const countriesEl = document.getElementById('countriesCovered');
        const completionEl = document.getElementById('completionRate');

        if (totalEl) totalEl.textContent = total.toLocaleString();
        if (withDescEl) withDescEl.textContent = withOriginal.toLocaleString();
        if (generatedEl) generatedEl.textContent = generated.toLocaleString();
        if (countriesEl) countriesEl.textContent = countries.length;
        if (completionEl) completionEl.textContent = `${completionRate}% del totale`;
    }

    renderTable() {
        const tbody = document.getElementById('sectorsTableBody');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredSectors.slice(startIndex, endIndex);

        if (pageData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center p-5">
                        <i class="fas fa-search fa-2x text-muted mb-3"></i>
                        <div><strong>Nessun settore trovato</strong></div>
                        <div class="text-muted">Modifica i filtri per vedere più risultati</div>
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
        const countryFlags = {
            'IT': '🇮🇹', 'UK': '🇬🇧', 'FR': '🇫🇷', 'SP': '🇪🇸', 'PW': '🌍'
        };
        
        const countryNames = {
            'IT': 'Italia', 'UK': 'Regno Unito', 'FR': 'Francia', 'SP': 'Spagna', 'PW': 'Globale'
        };

        const truncatedDesc = sector.description && sector.description.length > 150 
            ? sector.description.substring(0, 150) + '...' 
            : sector.description || 'Descrizione non disponibile';

        const descriptionClass = sector.hasOriginalDescription ? '' : 'text-muted';
        const statusIcon = sector.hasOriginalDescription ? '✅' : '🤖';

        return `
            <tr data-sector-id="${sector.id}">
                <td>
                    <div class="sector-name" title="${this.escapeHtml(sector.name)}">
                        ${this.escapeHtml(sector.name)}
                    </div>
                    ${sector.name_native && sector.name_native !== sector.name ? 
                        `<small class="text-muted">${this.escapeHtml(sector.name_native)}</small>` : ''}
                </td>
                <td>
                    <span class="country-badge">
                        ${countryFlags[sector.country] || '🏳️'} ${countryNames[sector.country] || sector.country}
                    </span>
                </td>
                <td>
                    <span class="nace-badge">${sector.nace}</span>
                </td>
                <td>
                    <span class="ateco-badge">${sector.ateco}</span>
                </td>
                <td class="description-cell ${descriptionClass}" title="${this.escapeHtml(truncatedDesc)}">
                    ${statusIcon} ${this.escapeHtml(truncatedDesc)}
                </td>
                <td class="keywords-cell" title="${this.escapeHtml(sector.keywords || '')}">
                    ${this.escapeHtml(sector.keywords || 'N/A')}
                </td>
                <td>
                    <button class="btn accent btn-sm" onclick="window.open('https://www.plimsoll.it/analisi', '_blank')" title="Acquista studio su www.plimsoll.it">
                        <i class="fas fa-external-link-alt"></i>
                        Acquista
                    </button>
                </td>
            </tr>
        `;
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredSectors.length / this.itemsPerPage);
        
        // Aggiorna info pagina
        const pageInfo = document.getElementById('pageInfo');
        if (pageInfo) {
            pageInfo.textContent = `Pagina ${this.currentPage} di ${totalPages}`;
        }

        // Aggiorna bottoni navigazione
        const firstBtn = document.getElementById('firstPage');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const lastBtn = document.getElementById('lastPage');

        if (firstBtn) firstBtn.disabled = this.currentPage <= 1;
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
        if (lastBtn) lastBtn.disabled = this.currentPage >= totalPages;

        // Genera numeri di pagina
        this.generatePageNumbers(totalPages);
    }

    generatePageNumbers(totalPages) {
        const pageNumbers = document.getElementById('pageNumbers');
        if (!pageNumbers) return;

        let pages = [];
        const current = this.currentPage;
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            pages = Array.from({ length: totalPages }, (_, i) => i + 1);
        } else {
            if (current <= 3) {
                pages = [1, 2, 3, 4, 5, '...', totalPages];
            } else if (current >= totalPages - 2) {
                pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            } else {
                pages = [1, '...', current - 1, current, current + 1, '...', totalPages];
            }
        }

        pageNumbers.innerHTML = pages.map(page => {
            if (page === '...') {
                return '<span class="page-ellipsis">...</span>';
            }
            return `
                <button class="page-number ${page === current ? 'active' : ''}" 
                        onclick="dataManager.goToPage(${page})">${page}</button>
            `;
        }).join('');
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

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoadingState() {
        const tbody = document.getElementById('sectorsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center p-5">
                        <div class="loading">
                            <i class="fas fa-spinner fa-spin fa-2x text-muted mb-3"></i>
                            <div><strong>Caricamento database settori...</strong></div>
                            <div class="text-muted">Elaborazione dati in corso...</div>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    hideLoadingState() {
        // La tabella verrà aggiornata con renderTable()
    }

    // Export functionality
    exportFilteredData(format = 'csv') {
        const data = this.filteredSectors;
        const filename = `plimsoll-settori-${new Date().toISOString().split('T')[0]}`;
        
        if (format === 'csv') {
            this.exportToCSV(data, filename);
        } else if (format === 'excel') {
            this.exportToExcel(data, filename);
        }
    }

    exportToCSV(data, filename) {
        const headers = ['Nome Settore', 'Paese', 'NACE', 'ATECO', 'Descrizione', 'Keywords', 'Tipo Descrizione'];
        const csvContent = [
            headers.join(','),
            ...data.map(sector => [
                `"${sector.name}"`,
                sector.country,
                sector.nace,
                sector.ateco,
                `"${(sector.description || '').replace(/"/g, '""')}"`,
                `"${(sector.keywords || '').replace(/"/g, '""')}"`,
                sector.hasOriginalDescription ? 'Originale' : 'Generata AI'
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        link.click();
    }

    exportToExcel(data, filename) {
        // Richiede libreria XLSX
        if (typeof XLSX === 'undefined') {
            console.warn('Libreria XLSX non caricata, export in CSV...');
            this.exportToCSV(data, filename);
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(data.map(sector => ({
            'Nome Settore': sector.name,
            'Paese': sector.country,
            'NACE': sector.nace,
            'ATECO': sector.ateco,
            'Descrizione': sector.description || '',
            'Keywords': sector.keywords || '',
            'Tipo Descrizione': sector.hasOriginalDescription ? 'Originale' : 'Generata AI',
            'Ultimo Aggiornamento': sector.lastUpdated || ''
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Settori Plimsoll');
        XLSX.writeFile(workbook, `${filename}.xlsx`);
    }
}

// Istanza globale
let dataManager;