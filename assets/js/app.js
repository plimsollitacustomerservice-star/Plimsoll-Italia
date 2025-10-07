// Applicazione principale
class PlimsollCatalogApp {
    constructor() {
        this.currentEditId = null;
        this.selectedSectors = new Set();
        
        this.initializeEventListeners();
        this.loadInitialData();
    }

    initializeEventListeners() {
        // Upload
        const uploadBtn = document.getElementById('uploadBtn');
        const uploadModal = document.getElementById('uploadModal');
        const fileInput = document.getElementById('fileInput');
        const uploadZone = document.getElementById('uploadZone');

        uploadBtn.addEventListener('click', () => this.openUploadModal());
        uploadZone.addEventListener('click', () => fileInput.click());
        uploadZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadZone.addEventListener('drop', (e) => this.handleFileDrop(e));
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Search and filters
        const searchInput = document.getElementById('searchInput');
        const countryFilter = document.getElementById('countryFilter');
        const naceFilter = document.getElementById('naceFilter');
        const statusFilter = document.getElementById('statusFilter');

        searchInput.addEventListener('input', () => this.applyFilters());
        countryFilter.addEventListener('change', () => this.applyFilters());
        naceFilter.addEventListener('change', () => this.applyFilters());
        statusFilter.addEventListener('change', () => this.applyFilters());

        // Table actions
        const selectAll = document.getElementById('selectAll');
        const bulkEditBtn = document.getElementById('bulkEditBtn');
        const addSectorBtn = document.getElementById('addSectorBtn');

        selectAll.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        bulkEditBtn.addEventListener('click', () => this.openBulkEditModal());
        addSectorBtn.addEventListener('click', () => this.openAddSectorModal());

        // Pagination
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');

        prevPage.addEventListener('click', () => this.changePage(-1));
        nextPage.addEventListener('click', () => this.changePage(1));

        // Export
        const exportBtn = document.getElementById('exportBtn');
        exportBtn.addEventListener('click', () => this.openExportModal());

        // Modals
        this.initializeModals();

        // Edit form
        const editForm = document.getElementById('editForm');
        editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
    }

    initializeModals() {
        const modals = document.querySelectorAll('.modal');
        const closeButtons = document.querySelectorAll('.close');

        closeButtons.forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal);
            });
        });

        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });

        // Cancel buttons
        const cancelEdit = document.getElementById('cancelEdit');
        cancelEdit.addEventListener('click', () => {
            this.closeModal(document.getElementById('editModal'));
        });
    }

    async loadInitialData() {
        await this.delay(100); // Aspetta che dataManager sia inizializzato
        this.renderTable();
        this.updatePagination();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Upload functionality
    openUploadModal() {
        const modal = document.getElementById('uploadModal');
        modal.style.display = 'block';
        this.resetUploadModal();
    }

    resetUploadModal() {
        document.getElementById('uploadProgress').classList.add('hidden');
        document.getElementById('uploadResults').classList.add('hidden');
        document.getElementById('uploadZone').style.display = 'block';
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadZone').classList.add('dragover');
    }

    handleFileDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadZone').classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    async processFiles(files) {
        if (!files || files.length === 0) return;

        const validFiles = files.filter(file => 
            file.name.endsWith('.csv') || 
            file.name.endsWith('.xlsx') || 
            file.name.endsWith('.xls')
        );

        if (validFiles.length === 0) {
            dataManager.showToast('Nessun file valido selezionato', 'error');
            return;
        }

        // Show progress
        document.getElementById('uploadZone').style.display = 'none';
        document.getElementById('uploadProgress').classList.remove('hidden');
        const progressBar = document.querySelector('.progress-fill');
        const progressText = document.getElementById('progressText');

        let totalProcessed = 0;
        let allResults = [];

        for (const file of validFiles) {
            progressText.textContent = `Elaborazione ${file.name}...`;
            
            try {
                const result = await dataManager.processUploadedFile(file);
                allResults.push(result);
                
                // Merge sectors
                const mergeResult = dataManager.mergeUploadedSectors(result.sectors);
                result.merged = mergeResult.merged;
                result.added = mergeResult.added;
                
                totalProcessed++;
                const progress = (totalProcessed / validFiles.length) * 100;
                progressBar.style.width = `${progress}%`;
                
            } catch (error) {
                console.error(`Errore elaborazione ${file.name}:`, error);
                allResults.push({
                    fileName: file.name,
                    error: error.message
                });
            }
        }

        // Show results
        document.getElementById('uploadProgress').classList.add('hidden');
        this.showUploadResults(allResults);
        
        // Update interface
        dataManager.updateDashboard();
        this.applyFilters();
    }

    showUploadResults(results) {
        const resultsContainer = document.getElementById('uploadResults');
        let totalAdded = 0;
        let totalMerged = 0;

        const resultHTML = results.map(result => {
            if (result.error) {
                return `
                    <div class="upload-result error">
                        <strong>${result.fileName}</strong>: Errore - ${result.error}
                    </div>
                `;
            } else {
                totalAdded += result.added || 0;
                totalMerged += result.merged || 0;
                return `
                    <div class="upload-result success">
                        <strong>${result.fileName}</strong>: 
                        ${result.sectorsFound} settori trovati, 
                        ${result.added} nuovi aggiunti, 
                        ${result.merged} aggiornati
                    </div>
                `;
            }
        }).join('');

        resultsContainer.innerHTML = `
            <h3>Risultati Caricamento</h3>
            ${resultHTML}
            <div class="upload-summary">
                <strong>Totale: ${totalAdded} nuovi settori, ${totalMerged} aggiornamenti</strong>
            </div>
            <div class="upload-actions">
                <button class="btn primary" onclick="app.closeModal(document.getElementById('uploadModal'))">
                    Chiudi
                </button>
            </div>
        `;
        resultsContainer.classList.remove('hidden');

        if (totalAdded > 0 || totalMerged > 0) {
            dataManager.showToast(`Caricamento completato: ${totalAdded + totalMerged} settori elaborati`);
        }
    }

    // Filters and search
    applyFilters() {
        if (!dataManager) return;

        const filters = {
            search: document.getElementById('searchInput').value,
            country: document.getElementById('countryFilter').value,
            nace: document.getElementById('naceFilter').value,
            status: document.getElementById('statusFilter').value
        };

        dataManager.filterSectors(filters);
        this.renderTable();
        this.updatePagination();
    }

    // Table rendering
    renderTable() {
        if (!dataManager) return;

        const tbody = document.getElementById('sectorsTableBody');
        const sectors = dataManager.getPaginatedSectors();

        if (sectors.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <div style="padding: 2rem;">
                            <i class="fas fa-search" style="font-size: 3rem; color: var(--text-light); margin-bottom: 1rem;"></i>
                            <p>Nessun settore trovato</p>
                            <p style="color: var(--text-light);">Prova a modificare i filtri di ricerca</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = sectors.map(sector => this.renderSectorRow(sector)).join('');
        this.attachRowEventListeners();
    }

    renderSectorRow(sector) {
        const hasDescription = sector.description && sector.description.length > 0;
        const descriptionText = sector.description || 'Descrizione da completare';
        const keywords = sector.keywords || '';

        return `
            <tr data-sector-id="${sector.id}">
                <td>
                    <input type="checkbox" class="sector-checkbox" value="${sector.id}">
                </td>
                <td>
                    <div class="sector-name">${this.escapeHtml(sector.name)}</div>
                </td>
                <td>
                    <span class="country-badge country-${sector.country}">${sector.country}</span>
                </td>
                <td>
                    <span class="code-badge">${sector.nace || '-'}</span>
                </td>
                <td>
                    <span class="code-badge">${sector.ateco || '-'}</span>
                </td>
                <td>
                    <div class="description-cell ${hasDescription ? '' : 'text-muted'}" 
                         title="${this.escapeHtml(descriptionText)}">
                        ${this.escapeHtml(descriptionText)}
                    </div>
                </td>
                <td>
                    <div class="keywords">${this.escapeHtml(keywords)}</div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm primary edit-sector" title="Modifica">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm danger delete-sector" title="Elimina">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    attachRowEventListeners() {
        // Checkbox selection
        document.querySelectorAll('.sector-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectedSectors.add(e.target.value);
                } else {
                    this.selectedSectors.delete(e.target.value);
                }
                this.updateBulkEditButton();
            });
        });

        // Edit buttons
        document.querySelectorAll('.edit-sector').forEach(button => {
            button.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                const sectorId = row.dataset.sectorId;
                this.openEditModal(sectorId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-sector').forEach(button => {
            button.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                const sectorId = row.dataset.sectorId;
                this.deleteSector(sectorId);
            });
        });
    }

    updateBulkEditButton() {
        const bulkEditBtn = document.getElementById('bulkEditBtn');
        const count = this.selectedSectors.size;
        
        if (count > 0) {
            bulkEditBtn.textContent = `Modifica ${count} Settori`;
            bulkEditBtn.disabled = false;
        } else {
            bulkEditBtn.innerHTML = '<i class="fas fa-edit"></i> Modifica Multipla';
            bulkEditBtn.disabled = true;
        }
    }

    toggleSelectAll(checked) {
        document.querySelectorAll('.sector-checkbox').forEach(checkbox => {
            checkbox.checked = checked;
            if (checked) {
                this.selectedSectors.add(checkbox.value);
            } else {
                this.selectedSectors.delete(checkbox.value);
            }
        });
        this.updateBulkEditButton();
    }

    // Pagination
    changePage(direction) {
        if (!dataManager) return;

        const newPage = dataManager.currentPage + direction;
        if (dataManager.setPage(newPage)) {
            this.renderTable();
            this.updatePagination();
        }
    }

    updatePagination() {
        if (!dataManager) return;

        const totalPages = dataManager.getTotalPages();
        const currentPage = dataManager.currentPage;
        
        document.getElementById('pageInfo').textContent = 
            `Pagina ${currentPage} di ${totalPages}`;
        
        document.getElementById('prevPage').disabled = currentPage <= 1;
        document.getElementById('nextPage').disabled = currentPage >= totalPages;
    }

    // Edit functionality
    openEditModal(sectorId) {
        const sector = dataManager.sectors.find(s => s.id === sectorId);
        if (!sector) return;

        this.currentEditId = sectorId;
        
        document.getElementById('editModalTitle').textContent = 'Modifica Settore';
        document.getElementById('sectorName').value = sector.name || '';
        document.getElementById('sectorCountry').value = sector.country || '';
        document.getElementById('naceCode').value = sector.nace || '';
        document.getElementById('atecoCode').value = sector.ateco || '';
        document.getElementById('sectorDescription').value = sector.description || '';
        document.getElementById('sectorKeywords').value = sector.keywords || '';

        document.getElementById('editModal').style.display = 'block';
    }

    openAddSectorModal() {
        this.currentEditId = null;
        
        document.getElementById('editModalTitle').textContent = 'Nuovo Settore';
        document.getElementById('editForm').reset();
        document.getElementById('editModal').style.display = 'block';
    }

    handleEditSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('sectorName').value,
            country: document.getElementById('sectorCountry').value,
            nace: document.getElementById('naceCode').value,
            ateco: document.getElementById('atecoCode').value,
            description: document.getElementById('sectorDescription').value,
            keywords: document.getElementById('sectorKeywords').value
        };

        if (this.currentEditId) {
            // Update existing
            dataManager.updateSector(this.currentEditId, formData);
            dataManager.showToast('Settore aggiornato con successo');
        } else {
            // Add new
            dataManager.addSector(formData);
            dataManager.showToast('Nuovo settore aggiunto con successo');
        }

        this.closeModal(document.getElementById('editModal'));
        dataManager.updateDashboard();
        this.applyFilters();
    }

    deleteSector(sectorId) {
        const sector = dataManager.sectors.find(s => s.id === sectorId);
        if (!sector) return;

        if (confirm(`Sei sicuro di voler eliminare il settore "${sector.name}"?`)) {
            dataManager.deleteSector(sectorId);
            dataManager.showToast('Settore eliminato con successo');
            dataManager.updateDashboard();
            this.applyFilters();
        }
    }

    // Export functionality
    openExportModal() {
        const exportModal = document.createElement('div');
        exportModal.className = 'modal';
        exportModal.id = 'exportModal';
        exportModal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Esporta Catalogo</h2>
                <p>Seleziona il formato di esportazione:</p>
                <div class="export-options">
                    <button class="btn primary" onclick="app.exportData('csv')">
                        <i class="fas fa-file-csv"></i> Esporta CSV
                    </button>
                    <button class="btn primary" onclick="app.exportData('excel')">
                        <i class="fas fa-file-excel"></i> Esporta Excel
                    </button>
                    <button class="btn secondary" onclick="app.exportData('json')">
                        <i class="fas fa-file-code"></i> Esporta JSON
                    </button>
                </div>
                <div class="export-stats">
                    <p>Settori totali: <strong>${dataManager.sectors.length}</strong></p>
                    <p>Filtrati: <strong>${dataManager.filteredSectors.length}</strong></p>
                </div>
            </div>
        `;

        document.body.appendChild(exportModal);
        exportModal.style.display = 'block';

        // Add close functionality
        const closeBtn = exportModal.querySelector('.close');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(exportModal);
        });
    }

    exportData(format) {
        let content, filename, mimeType;

        switch (format) {
            case 'csv':
                content = dataManager.exportToCSV();
                filename = `plimsoll-catalog-${new Date().toISOString().split('T')[0]}.csv`;
                mimeType = 'text/csv';
                break;
            case 'excel':
                content = dataManager.exportToExcel();
                filename = `plimsoll-catalog-${new Date().toISOString().split('T')[0]}.xlsx`;
                mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                break;
            case 'json':
                content = JSON.stringify({
                    exportDate: new Date().toISOString(),
                    totalSectors: dataManager.sectors.length,
                    sectors: dataManager.sectors
                }, null, 2);
                filename = `plimsoll-catalog-${new Date().toISOString().split('T')[0]}.json`;
                mimeType = 'application/json';
                break;
        }

        this.downloadFile(content, filename, mimeType);
        
        // Close modal
        const exportModal = document.getElementById('exportModal');
        if (exportModal) {
            document.body.removeChild(exportModal);
        }

        dataManager.showToast(`Export ${format.toUpperCase()} completato`);
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Utility functions
    closeModal(modal) {
        modal.style.display = 'none';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PlimsollCatalogApp();
});
