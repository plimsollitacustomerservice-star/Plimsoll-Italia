// Plimsoll App - Applicazione principale per Catalogo Settori
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Avvio Catalogo Studi Plimsoll...');
    
    // Inizializza Data Manager
    window.dataManager = new PlimsollDataManager();
    await dataManager.initialize();
    
    // Setup event listeners
    setupEventListeners();
    
    // Inizializzazioni UI
    setupUI();
    
    console.log('✅ Catalogo Plimsoll pronto!');
});

function setupEventListeners() {
    // Ricerca
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                dataManager.filters.search = this.value;
                dataManager.applyFiltersAndSort();
                dataManager.renderTable();
                dataManager.updatePagination();
            }, 300);
        });
    }

    // Filtri
    const countryFilter = document.getElementById('countryFilter');
    const naceFilter = document.getElementById('naceFilter');
    const descriptionFilter = document.getElementById('descriptionFilter');
    const sortBy = document.getElementById('sortBy');

    if (countryFilter) {
        countryFilter.addEventListener('change', function() {
            dataManager.filters.country = this.value;
            applyFilters();
        });
    }

    if (naceFilter) {
        naceFilter.addEventListener('change', function() {
            dataManager.filters.nace = this.value;
            applyFilters();
        });
    }

    if (descriptionFilter) {
        descriptionFilter.addEventListener('change', function() {
            dataManager.filters.description = this.value;
            applyFilters();
        });
    }

    if (sortBy) {
        sortBy.addEventListener('change', function() {
            dataManager.sortBy = this.value;
            applyFilters();
        });
    }

    // Reset filtri
    const resetFilters = document.getElementById('resetFilters');
    if (resetFilters) {
        resetFilters.addEventListener('click', function() {
            // Reset form
            if (searchInput) searchInput.value = '';
            if (countryFilter) countryFilter.value = '';
            if (naceFilter) naceFilter.value = '';
            if (descriptionFilter) descriptionFilter.value = '';
            if (sortBy) sortBy.value = 'name_asc';
            
            // Reset filtri
            dataManager.filters = {
                search: '', country: '', nace: '', description: ''
            };
            dataManager.sortBy = 'name_asc';
            
            applyFilters();
        });
    }

    // Items per page
    const itemsPerPage = document.getElementById('itemsPerPage');
    if (itemsPerPage) {
        itemsPerPage.addEventListener('change', function() {
            dataManager.itemsPerPage = parseInt(this.value);
            dataManager.currentPage = 1;
            dataManager.renderTable();
            dataManager.updatePagination();
        });
    }

    // Paginazione
    const firstPage = document.getElementById('firstPage');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const lastPage = document.getElementById('lastPage');

    if (firstPage) firstPage.addEventListener('click', () => dataManager.firstPage());
    if (prevPage) prevPage.addEventListener('click', () => dataManager.prevPage());
    if (nextPage) nextPage.addEventListener('click', () => dataManager.nextPage());
    if (lastPage) lastPage.addEventListener('click', () => dataManager.lastPage());

    // Export
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            showExportOptions();
        });
    }

    // Header sorting
    document.addEventListener('click', function(e) {
        if (e.target.closest('.sortable')) {
            const th = e.target.closest('.sortable');
            const sortField = th.dataset.sort;
            
            // Toggle sort direction
            if (dataManager.sortBy === sortField + '_asc') {
                dataManager.sortBy = sortField + '_desc';
            } else {
                dataManager.sortBy = sortField + '_asc';
            }
            
            // Update visual indicators
            updateSortIndicators(th, dataManager.sortBy.endsWith('_desc'));
            
            applyFilters();
        }
    });

    // Responsive menu toggle (se presente)
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            const dropdown = document.getElementById('dropdownMenu');
            if (dropdown) {
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            }
        });
    }

    // Click outside to close dropdown
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('dropdownMenu');
        const menuToggle = document.getElementById('menuToggle');
        
        if (dropdown && menuToggle && !menuToggle.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

function applyFilters() {
    dataManager.applyFiltersAndSort();
    dataManager.renderTable();
    dataManager.updatePagination();
}

function updateSortIndicators(activeHeader, isDesc) {
    // Reset tutti gli indicatori
    document.querySelectorAll('.sortable i').forEach(icon => {
        icon.className = 'fas fa-sort';
    });
    
    // Imposta indicatore per colonna attiva
    const icon = activeHeader.querySelector('i');
    if (icon) {
        icon.className = isDesc ? 'fas fa-sort-down' : 'fas fa-sort-up';
    }
}

function setupUI() {
    // Aggiungi smooth scrolling per anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Setup tooltips
    setupTooltips();
    
    // Setup performance monitoring
    monitorPerformance();
}

function setupTooltips() {
    // Semplice implementazione tooltips usando title attribute
    document.querySelectorAll('[title]').forEach(element => {
        element.addEventListener('mouseenter', function() {
            // Placeholder per tooltip personalizzati se necessario
        });
    });
}

function showExportOptions() {
    // Mostra opzioni di export
    const options = [
        { text: '📄 Esporta CSV', action: () => dataManager.exportFilteredData('csv') },
        { text: '📊 Esporta Excel', action: () => dataManager.exportFilteredData('excel') },
        { text: '📋 Copia negli appunti', action: () => copyToClipboard() }
    ];
    
    // Crea menu contestuale
    const menu = createContextMenu(options);
    document.body.appendChild(menu);
    
    // Posiziona menu
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        const rect = exportBtn.getBoundingClientRect();
        menu.style.left = rect.left + 'px';
        menu.style.top = (rect.bottom + 5) + 'px';
    }
    
    // Auto remove dopo 5 secondi
    setTimeout(() => {
        if (menu.parentNode) {
            menu.parentNode.removeChild(menu);
        }
    }, 5000);
}

function createContextMenu(options) {
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.cssText = `
        position: fixed;
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 0.375rem;
        box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15);
        z-index: 1000;
        min-width: 200px;
        padding: 0.5rem 0;
    `;
    
    options.forEach(option => {
        const item = document.createElement('div');
        item.className = 'context-menu-item';
        item.textContent = option.text;
        item.style.cssText = `
            padding: 0.5rem 1rem;
            cursor: pointer;
            transition: background-color 0.2s;
        `;
        
        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = '#f8f9fa';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = '';
        });
        
        item.addEventListener('click', () => {
            option.action();
            menu.parentNode.removeChild(menu);
        });
        
        menu.appendChild(item);
    });
    
    // Click outside to close
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target)) {
                if (menu.parentNode) {
                    menu.parentNode.removeChild(menu);
                }
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
    
    return menu;
}

function copyToClipboard() {
    const data = dataManager.filteredSectors;
    const text = data.map(sector => 
        `${sector.name}\t${sector.country}\t${sector.nace}\t${sector.ateco}\t${sector.description || ''}`
    ).join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification('✅ Dati copiati negli appunti', 'success');
    }).catch(() => {
        showNotification('❌ Errore nella copia', 'error');
    });
}

function showNotification(message, type = 'info') {
    // Rimuovi notifiche esistenti
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
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
        animation: slideInRight 0.3s ease;
        cursor: pointer;
    `;
    
    // Add slide animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
    
    // Click to dismiss
    toast.addEventListener('click', () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
}

function monitorPerformance() {
    // Monitor performance e usage
    let lastActivity = Date.now();
    
    // Track user activity
    ['click', 'keypress', 'scroll'].forEach(event => {
        document.addEventListener(event, () => {
            lastActivity = Date.now();
        });
    });
    
    // Performance logging
    if (console && typeof console.log === 'function') {
        setTimeout(() => {
            const sectorsCount = dataManager ? dataManager.sectors.length : 0;
            const filteredCount = dataManager ? dataManager.filteredSectors.length : 0;
            
            console.log(`📊 Performance Plimsoll Catalog:
- Settori caricati: ${sectorsCount.toLocaleString()}
- Settori filtrati: ${filteredCount.toLocaleString()}  
- Memoria utilizzata: ${(performance.memory?.usedJSHeapSize / 1048576).toFixed(1) || 'N/A'} MB
- Tempo di caricamento: ${(performance.timing.loadEventEnd - performance.timing.navigationStart)} ms`);
        }, 2000);
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Quick search functions for hero buttons
function quickSearch(keyword) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput && dataManager) {
        searchInput.value = keyword;
        dataManager.filters.search = keyword;
        applyFilters();
        
        // Scroll to table
        const tableSection = document.querySelector('.table-section');
        if (tableSection) {
            tableSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        showNotification(`🔍 Ricerca: "${keyword}" - ${dataManager.filteredSectors.length} risultati`, 'info');
    }
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('Errore applicazione:', e.error);
    showNotification('❌ Si è verificato un errore. Ricarica la pagina.', 'error');
});

// Service Worker registration (optional)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('SW registered:', registration))
        .catch(error => console.log('SW registration failed:', error));
}