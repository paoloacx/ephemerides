/*
 * ui.js (v7.4)
 * - Fixes Spotlight display (year box, correct icon, text only)
 * - Fixes Logout button (avatar is trigger)
 * - Ensures calendar draws correctly after init
 */

// --- Estado Interno del Módulo ---
const _dom = {
    appContent: null,
    monthNameDisplay: null,
    navPrev: null,
    navNext: null,
    footer: null,
    spotlightHeader: null,
    spotlightList: null,
};

const _modals = {
    preview: null,
    edit: null,
    store: null,
    storeList: null,
    search: null,
    settings: null, 
};

let _callbacks = {
    isUserLoggedIn: () => false, 
    onEditFromPreview: (dia, memories) => console.warn("onEditFromPreview no implementado"),
    loadMemoriesForDay: async (diaId) => { console.warn("loadMemoriesForDay not implemented"); return []; }, 
    getAllDaysData: () => { console.warn("getAllDaysData not implemented"); return []; }, 
    getTodayId: () => { console.warn("getTodayId not implemented"); return ''; }, 
    onMonthChange: (dir) => console.warn("onMonthChange no implementado"),
    onFooterAction: (action) => console.warn("onFooterAction no implementado"),
    onLogin: () => console.warn("onLogin no implementado"),
    onLogout: () => console.warn("onLogout no implementado"),
    onSaveDayName: (diaId, name) => console.warn("onSaveDayName no implementado"),
    onSaveMemory: (diaId, data, isEditing) => console.warn("onSaveMemory no implementado"),
    onDeleteMemory: (diaId, memId) => console.warn("onDeleteMemory no implementado"),
    onSearchMusic: (term) => console.warn("onSearchMusic no implementado"),
    onSearchPlace: (term) => console.warn("onSearchPlace no implementado"),
    onStoreCategoryClick: (type) => console.warn("onStoreCategoryClick no implementado"),
    onStoreLoadMore: () => console.warn("onStoreLoadMore no implementado"),
    onStoreItemClick: (diaId) => console.warn("onStoreItemClick no implementado"),
    onSearchSubmit: (term) => console.warn("onSearchSubmit no implementado"),
};

let _currentDay = null;      
let _currentMemories = []; 
let _isEditingMemory = false; 
let _selectedMusicTrack = null;
let _selectedPlace = null;


// --- 1. Inicialización y Funciones Principales ---

function init(callbacks) {
    console.log("UI: Initializing v7.4..."); // Version bump
    _callbacks = { ..._callbacks, ...callbacks }; 

    _dom.appContent = document.getElementById('app-content');
    _dom.monthNameDisplay = document.getElementById('month-name-display');
    _dom.navPrev = document.getElementById('prev-month');
    _dom.navNext = document.getElementById('next-month');
    _dom.footer = document.querySelector('.footer-dock');
    _dom.spotlightHeader = document.getElementById('spotlight-date-header');
    _dom.spotlightList = document.getElementById('today-memory-spotlight');

    if (!_dom.appContent) {
        console.error("UI FATAL: #app-content element not found!");
        document.body.innerHTML = '<p style="color:red; padding: 20px;">UI Error: Could not find main content area. App cannot load.</p>';
        return; 
    }
     if (!_dom.navPrev || !_dom.navNext) console.warn("UI: Month navigation buttons not found.");
     if (!_dom.footer) console.warn("UI: Footer element not found.");


    _setupNavigation();
    _setupHeader(); 
    _setupFooter();
    
    // Initial UI update based on auth state is now handled by the first
    // call to handleAuthStateChange from main.js after initAuthListener.

    console.log("UI: Initialized and events connected.");
}


function updateLoginUI(user) {
    const loginSection = document.getElementById('login-section');
    if (!loginSection) return;

    if (user) {
        // --- CHANGED: Avatar is now the logout trigger ---
        loginSection.innerHTML = `
            <div id="user-info" title="Logout (Click Avatar)"> 
                <img id="user-img" src="${user.photoURL || 'https://placehold.co/30x30/ccc/fff?text=?'}" alt="Avatar">
                <span id="user-name">${user.displayName || 'User'}</span> 
            </div>
        `;
        const userInfoDiv = document.getElementById('user-info');
        if (userInfoDiv) userInfoDiv.onclick = () => {
             console.log("UI: Logout triggered by avatar click.");
             _callbacks.onLogout();
        }
        
    } else {
        loginSection.innerHTML = `
            <button id="login-btn" class="header-icon-btn" title="Login with Google">
                <span class="material-icons-outlined">login</span>
            </button>
        `;
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) loginBtn.onclick = () => _callbacks.onLogin();
    }
}

// --- 2. Renderizado del Contenido Principal ---

function drawCalendar(monthName, days, todayId) {
    console.log(`UI: Attempting to draw calendar for ${monthName}. Found ${days ? days.length : 'no'} days.`); 
    
    if (_dom.monthNameDisplay) {
        _dom.monthNameDisplay.textContent = monthName;
    } else {
        console.warn("UI: #month-name-display not found.");
    }

    if (!_dom.appContent) {
        console.error("UI ERROR in drawCalendar: #app-content element not found! Cannot draw.");
        return; 
    }
    _dom.appContent.innerHTML = ''; 

    const grid = document.createElement('div');
    grid.className = 'calendario-grid';
    
    if (!days || days.length === 0) {
        console.warn(`UI: No days data provided for ${monthName}. Displaying empty message.`);
        grid.innerHTML = "<p>No days found for this month.</p>";
        _dom.appContent.appendChild(grid);
        return;
    }

    const fragment = document.createDocumentFragment();
    
    days.forEach(dia => {
        if (!dia || !dia.id) {
             console.warn("UI: Skipping invalid day object in drawCalendar:", dia);
             return; 
        }

        const btn = document.createElement("button");
        btn.className = "dia-btn";
        
        if (dia.id === todayId) {
            btn.classList.add('dia-btn-today');
        }
        if (dia.tieneMemorias) {
            btn.classList.add('tiene-memorias');
        }
        
        const dayNumber = parseInt(dia.id.substring(3), 10);
        btn.innerHTML = `<span class="dia-numero">${isNaN(dayNumber) ? '?' : dayNumber}</span>`;
        btn.dataset.diaId = dia.id;
        
        btn.onclick = () => _handleDayClick(dia); 
        
        fragment.appendChild(btn);
    });
    
    _dom.appContent.appendChild(grid);
    console.log(`UI: Successfully drew calendar with ${days.length} days.`); 
}


function updateSpotlight(headerText, memories) {
    if (_dom.spotlightHeader) {
        _dom.spotlightHeader.textContent = headerText;
    }
    
    if (!_dom.spotlightList) {
         console.warn("UI: #today-memory-spotlight not found.");
         return;
    }
    
    _dom.spotlightList.innerHTML = '';
    if (!memories || memories.length === 0) {
        _dom.spotlightList.innerHTML = `<p class="list-placeholder">No memories for today.</p>`; 
        return;
    }
    
    const fragment = document.createDocumentFragment();
    memories.forEach(mem => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'spotlight-memory-item';
        
        // Ensure diaId is available for the click handler
        const diaId = mem.diaId || _callbacks.getTodayId(); 
        itemDiv.dataset.diaId = diaId;

        // --- Use the updated HTML generator ---
        itemDiv.innerHTML = _createMemoryItemHTML(mem, 'spotlight'); 
        
        itemDiv.onclick = () => {
            const diaData = { 
                id: itemDiv.dataset.diaId, 
                Nombre_Dia: mem.Nombre_Dia || itemDiv.dataset.diaId // Pass name if available
            };
            _handleDayClick(diaData); 
        };

        fragment.appendChild(itemDiv);
    });
    _dom.spotlightList.appendChild(fragment);
}


// --- 3. Conexión de Eventos Estáticos ---

function _setupNavigation() {
    if(_dom.navPrev) _dom.navPrev.onclick = () => _callbacks.onMonthChange('prev');
    if(_dom.navNext) _dom.navNext.onclick = () => _callbacks.onMonthChange('next');
}

function _setupHeader() {
    const searchBtn = document.getElementById('header-search-btn');
    if (searchBtn) {
        searchBtn.onclick = () => openSearchModal();
    } else {
        console.warn("UI: Header search button not found.");
    }
}

function _setupFooter() {
    if(!_dom.footer) return; 

    _dom.footer.addEventListener('click', (e) => {
        const button = e.target.closest('.dock-button');
        if (!button) return;
        
        const action = button.dataset.action;
        if (action) {
            if (action === 'add' || action === 'store' || action === 'shuffle') {
                _callbacks.onFooterAction(action);
            }
            else if (action === 'settings') {
                openSettingsDialog(); 
            }
        }
    });
}

// --- 4. Creación y Manejo de Modales ---

// --- Modal de Preview ---
function openPreviewModal(dia, memories) {
    _currentDay = dia;
    _currentMemories = memories || []; 

    if (!_modals.preview) {
        _modals.preview = _createPreviewModal();
        if (!_modals.preview) return; 
    }
    
    const title = _modals.preview.querySelector('.modal-header h3');
    const editBtn = _modals.preview.querySelector('.header-edit-btn');
    
    const displayName = dia.Nombre_Dia || dia.id; 
    if(title) title.textContent = `${displayName} ${dia.Nombre_Especial && dia.Nombre_Especial !== 'Unnamed Day' ? `(${dia.Nombre_Especial})` : ''}`;
    
    if(editBtn) {
        if (_callbacks.isUserLoggedIn()) {
            editBtn.classList.add('visible');
        } else {
            editBtn.classList.remove('visible');
        }
    }
    
    _renderMemoryList('preview-memorias-list', _currentMemories);
    
    _modals.preview.classList.add('visible');
}

function closePreviewModal() {
    if (_modals.preview) _modals.preview.classList.remove('visible');
}

function _handleEditFromPreview() {
    if (_currentDay && _callbacks.onEditFromPreview) {
        closePreviewModal();
        _callbacks.onEditFromPreview(_currentDay, _currentMemories); 
    }
}

// --- Modal de Edición (Edit/Add) ---
function openEditModal(dia, memories, allDays) {
    const isAdding = !dia;
    
    if (isAdding) {
        const todayId = _callbacks.getTodayId(); 
        const availableDays = allDays || _callbacks.getAllDaysData(); 
        _currentDay = availableDays.find(d => d.id === todayId) || availableDays[0];
         if (!_currentDay) { 
            console.error("UI: Cannot open Add modal, no day data available.");
            alert("Error: Calendar data not loaded.");
            return;
        }
        _currentMemories = [];
    } else {
        _currentDay = dia;
        _currentMemories = memories || []; 
    }
    
    if (!_modals.edit) {
        _modals.edit = _createEditModal();
        if (!_modals.edit) return; 
        _populateDaySelect(allDays || _callbacks.getAllDaysData()); 
        _bindEditModalEvents();
    }
    
    const daySelectionSection = _modals.edit.querySelector('#day-selection-section');
    const dayNameSection = _modals.edit.querySelector('#day-name-section');
    const daySelect = _modals.edit.querySelector('#edit-mem-day');
    const yearInput = _modals.edit.querySelector('#memoria-fecha-year'); 
    const titleEl = _modals.edit.querySelector('#edit-modal-title');
    const nameInput = _modals.edit.querySelector('#nombre-especial-input');
    
    if (isAdding) {
        if(daySelectionSection) daySelectionSection.style.display = 'block';
        if(dayNameSection) dayNameSection.style.display = 'none';
        if(daySelect) daySelect.value = _currentDay.id;
        if(yearInput) yearInput.value = new Date().getFullYear(); 
    } else {
        if(daySelectionSection) daySelectionSection.style.display = 'none';
        if(dayNameSection) dayNameSection.style.display = 'block';
        const displayName = _currentDay.Nombre_Dia || _currentDay.id;
        if(titleEl) titleEl.textContent = `Editing: ${displayName} (${_currentDay.id})`;
        if(nameInput) nameInput.value = _currentDay.Nombre_Especial === 'Unnamed Day' ? '' : _currentDay.Nombre_Especial;
    }
    
    _renderMemoryList('edit-memorias-list', _currentMemories);
    resetMemoryForm(); 
    showModalStatus('save-status', '', false);
    showModalStatus('memoria-status', '', false);
    
    _modals.edit.classList.add('visible');
}

function closeEditModal() {
    if (_modals.edit) _modals.edit.classList.remove('visible');
}

function resetMemoryForm() {
    _isEditingMemory = false;
    _selectedMusicTrack = null;
    _selectedPlace = null;
    
    const form = _modals.edit?.querySelector('#memory-form');
    if (!form) return;
    
    form.reset();
    const saveBtn = document.getElementById('save-memoria-btn');
    if(saveBtn) {
        saveBtn.textContent = 'Add Memory';
        delete saveBtn.dataset.editingId; 
    }
    const itunesResults = document.getElementById('itunes-results');
    const placeResults = document.getElementById('place-results');
    if(itunesResults) itunesResults.innerHTML = '';
    if(placeResults) placeResults.innerHTML = '';
    
    handleMemoryTypeChange(); 
}


function fillFormForEdit(memoria) {
    if (!_modals.edit || !memoria) return; 
    
    _isEditingMemory = true;
    _selectedMusicTrack = null;
    _selectedPlace = null;
    
    const typeSelect = _modals.edit.querySelector('#memoria-type');
    const yearInput = _modals.edit.querySelector('#memoria-fecha-year'); 
    const descTextarea = _modals.edit.querySelector('#memoria-desc');
    const placeInput = _modals.edit.querySelector('#memoria-place-search');
    const musicInput = _modals.edit.querySelector('#memoria-music-search');
    const imageDescInput = _modals.edit.querySelector('#memoria-image-desc');
    const saveButton = _modals.edit.querySelector('#save-memoria-btn');
    
    if (!typeSelect || !yearInput || !descTextarea || !placeInput || !musicInput || !imageDescInput || !saveButton) {
        console.error("UI: Could not find all form elements for editing.");
        return;
    }

    saveButton.dataset.editingId = memoria.id;

    if (memoria.Fecha_Original?.toDate) {
        try {
            yearInput.value = memoria.Fecha_Original.toDate().getFullYear();
        } catch (e) {
            yearInput.value = new Date().getFullYear(); 
        }
    } else {
        yearInput.value = new Date().getFullYear(); 
    }

    typeSelect.value = memoria.Tipo || 'Text';
    handleMemoryTypeChange();
    
    const itunesResults = document.getElementById('itunes-results');
    const placeResults = document.getElementById('place-results');
    if(itunesResults) itunesResults.innerHTML = '';
    if(placeResults) placeResults.innerHTML = '';

    switch (memoria.Tipo) {
        case 'Place':
            placeInput.value = memoria.LugarNombre || '';
            _selectedPlace = memoria.LugarData ? { name: memoria.LugarNombre, ...memoria.LugarData } : null;
            break;
        case 'Music':
            musicInput.value = memoria.CancionInfo || '';
            _selectedMusicTrack = memoria.CancionData || null;
            break;
        case 'Image':
            imageDescInput.value = memoria.Descripcion || '';
            break;
        default: // 'Text'
            descTextarea.value = memoria.Descripcion || '';
            break;
    }
    
    saveButton.textContent = 'Update Memory';
    
    const formTitle = _modals.edit.querySelector('#memory-form-title');
    if (formTitle) {
        formTitle.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
    }
}

// --- Modales de "Store" ---
function openStoreModal() {
    if (!_modals.store) {
        _modals.store = _createStoreModal();
        if (!_modals.store) return;
    }
    _modals.store.classList.add('visible');
}
function closeStoreModal() {
    if (_modals.store) _modals.store.classList.remove('visible');
}
function openStoreListModal(title) {
    if (!_modals.storeList) {
        _modals.storeList = _createStoreListModal();
        if (!_modals.storeList) return;
    }
    const header = _modals.storeList.querySelector('.modal-header h3');
    if(header) header.textContent = title;
    _modals.storeList.classList.add('visible');
    updateStoreList([], false, false); 
}
function closeStoreListModal() {
    if (_modals.storeList) _modals.storeList.classList.remove('visible');
}
function updateStoreList(items, append = false, hasMore = false) {
    if (!_modals.storeList) return;
    
    const listDiv = _modals.storeList.querySelector('#store-list');
    const loadMoreBtn = _modals.storeList.querySelector('#store-load-more-btn');
    
    if (!listDiv || !loadMoreBtn) {
        console.error("UI: Store list modal elements not found.");
        return;
    }

    if (!append) {
        listDiv.innerHTML = ''; 
    }
    
    if (!append && items.length === 0) {
        listDiv.innerHTML = '<p class="list-placeholder">No items found.</p>';
    } else {
        if (append && listDiv.querySelector('.list-placeholder')) {
             listDiv.innerHTML = '';
        }
        const fragment = document.createDocumentFragment();
        items.forEach(item => {
            const itemDiv = _createStoreListItem(item);
            fragment.appendChild(itemDiv);
        });
        listDiv.appendChild(fragment);
    }
    
    loadMoreBtn.style.display = hasMore ? 'block' : 'none';
}

// --- Modal de Búsqueda ---
function openSearchModal() {
    if (!_modals.search) {
        _modals.search = _createSearchModal();
         if (!_modals.search) return;
    }
    _modals.search.classList.add('visible');
    try {
        _modals.search.querySelector('#search-input')?.focus();
    } catch (e) {
        console.warn("UI: Could not focus search input.", e);
    }
}
function closeSearchModal() {
    if (_modals.search) {
        _modals.search.classList.remove('visible');
        _modals.search.querySelector('#search-form')?.reset();
    }
}

// --- Diálogo de "Settings" ---
function openSettingsDialog() {
    if (!_modals.settings) {
        _modals.settings = _createDialog(
            'settings-dialog', 
            'Settings', 
            'Settings is Coming Soon. Check back later!'
        );
         if (!_modals.settings) return;
    }
    _modals.settings.classList.add('visible');
}


// --- 5. Lógica de UI interna (Helpers) ---

async function _handleDayClick(dia) {
    if (!dia || !dia.id) {
        console.error("UI: Invalid day object passed to _handleDayClick:", dia);
        return;
    }
    console.log(`UI: Handling click for day ${dia.id}`); 

    // Always open Preview modal first
    try {
        console.log(`UI: Loading memories for ${dia.id}...`);
        const memories = await _callbacks.loadMemoriesForDay(dia.id); 
        console.log(`UI: Memories loaded for ${dia.id}, opening Preview.`);
        // Ensure 'dia' object has Nombre_Dia for the preview title
        if (!dia.Nombre_Dia) {
             const allDays = _callbacks.getAllDaysData();
             const dayData = allDays.find(d => d.id === dia.id);
             dia.Nombre_Dia = dayData ? dayData.Nombre_Dia : dia.id;
        }
        openPreviewModal(dia, memories); 
    } catch (error) {
        console.error("UI: Error loading memories for day click:", error);
        alert(`Error loading memories for ${dia.Nombre_Dia || dia.id}. Please try again.`);
    }
}


function _createMemoryItemHTML(memoria, context) {
    let contentHTML = '';
    let artworkHTML = '';
    
    // Year extraction
    let yearStr = '????'; 
    if (memoria.Fecha_Original?.toDate) {
        try { yearStr = memoria.Fecha_Original.toDate().getFullYear().toString(); } 
        catch (e) { console.warn("Error getting year from Firestore Timestamp:", e); }
    } else if (typeof memoria.Fecha_Original === 'string' && memoria.Fecha_Original.length >= 4) {
         yearStr = memoria.Fecha_Original.substring(0, 4);
    } 

    // Icon selection
    let icon = 'notes'; // Default icon
    switch (memoria.Tipo) {
        case 'Place': icon = 'place'; break;
        case 'Music': icon = 'music_note'; break;
        case 'Image': icon = 'image'; break;
        default: icon = 'notes'; break; // Explicit default
    }

    // --- REWRITTEN for Spotlight vs Other contexts ---
    if (context === 'spotlight') {
         // Spotlight: [Year Box] [Icon] [Text Content]
         contentHTML = `<span class="spotlight-year-box">${yearStr}</span>`; 
         contentHTML += `<span class="material-icons-outlined">${icon}</span>`; 
         contentHTML += `<div class="spotlight-memory-content"><span>`; // Start content span

          // Add specific content (text only, no extra spans or icons inside)
         switch (memoria.Tipo) {
            case 'Place':
                contentHTML += `${memoria.LugarNombre || 'Place'}`;
                break;
            case 'Music':
                if (memoria.CancionData?.trackName) {
                    contentHTML += `<strong>${memoria.CancionData.trackName}</strong> by ${memoria.CancionData.artistName}`;
                } else {
                    contentHTML += `${memoria.CancionInfo || 'Music'}`;
                }
                break;
            case 'Image':
                contentHTML += `${memoria.Descripcion || 'Image'}`;
                break;
            case 'Text':
            default:
                 const description = memoria.Descripcion || 'Memory';
                 const maxLength = 40; // Max length for spotlight
                 contentHTML += description.length > maxLength ? description.substring(0, maxLength) + '...' : description;
                break;
         }
         contentHTML += `</span></div>`; // Close content span and div

    } else { 
        // Other contexts (Preview, Edit): [Small Year] [Icon Span + Text Span]
        contentHTML = `<small>${yearStr}</small>`; 
        contentHTML += `<span><span class="material-icons-outlined">${icon}</span> `; // Start content span + icon

        switch (memoria.Tipo) {
            case 'Place':
                contentHTML += `${memoria.LugarNombre || 'Place'}`;
                break;
            case 'Music':
                if (memoria.CancionData?.trackName) {
                    contentHTML += `<strong>${memoria.CancionData.trackName}</strong> by ${memoria.CancionData.artistName}`;
                    if(memoria.CancionData.artworkUrl60) {
                        artworkHTML = `<img src="${memoria.CancionData.artworkUrl60}" class="memoria-artwork" onerror="this.style.display='none'">`;
                    }
                } else {
                    contentHTML += `${memoria.CancionInfo || 'Music'}`;
                }
                break;
            case 'Image':
                contentHTML += `${memoria.Descripcion || 'Image'}`;
                if (memoria.ImagenURL) { 
                    contentHTML += ` <small>(<a href="${memoria.ImagenURL}" target="_blank" rel="noopener">View</a>)</small>`;
                }
                break;
            case 'Text':
            default:
                 contentHTML += memoria.Descripcion || 'Memory';
                break;
        }
         contentHTML += `</span>`; // Close content span
    }

    // Actions only for edit modal
    let actionsHTML = '';
    if (context === 'edit-modal') { 
        actionsHTML = `
            <div class="memoria-actions">
                <button class="edit-btn" title="Edit" data-memoria-id="${memoria.id}">
                    <span class="material-icons-outlined">edit</span>
                </button>
                <button class="delete-btn" title="Delete" data-memoria-id="${memoria.id}">
                    <span class="material-icons-outlined">delete_outline</span>
                </button>
            </div>
        `;
    }

    // Combine based on context
    if (context === 'spotlight') {
         // Spotlight structure: [Artwork (optional)] [Year Box] [Icon] [Content Div]
         return `${artworkHTML}${contentHTML}`; // artworkHTML might be empty
    } else {
         // Other structure: [Artwork (optional)] [Content Div [Small Year] [Content Span]] [Actions (optional)]
         return `${artworkHTML}<div class="memoria-item-content">${contentHTML}</div>${actionsHTML}`;
    }
}


function _renderMemoryList(listId, memories) {
    const listDiv = document.getElementById(listId);
    if (!listDiv) {
         console.error(`UI: Could not find list container #${listId}`);
         return;
    }

    listDiv.innerHTML = '';
    if (!memories || memories.length === 0) {
        const placeholderText = listId === 'preview-memorias-list' ? 'No memories for this day.' : 'No memories added yet.';
        listDiv.innerHTML = `<p class="list-placeholder">${placeholderText}</p>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    memories.forEach(mem => {
        const itemDiv = document.createElement('div');
        // Use different class for spotlight items if needed for styling, but structure is handled by _createMemoryItemHTML
        itemDiv.className = (listId === 'today-memory-spotlight') ? 'spotlight-memory-item' : 'memoria-item'; 
        const context = (listId === 'preview-memorias-list') ? 'preview-modal' 
                      : (listId === 'edit-memorias-list') ? 'edit-modal' 
                      : 'spotlight'; // Assume spotlight otherwise
        itemDiv.innerHTML = _createMemoryItemHTML(mem, context);
        fragment.appendChild(itemDiv);
    });
    listDiv.appendChild(fragment);
}


// ... (showModalStatus, showMusicResults, showPlaceResults, handleMemoryTypeChange remain the same) ...
function showModalStatus(elementId, message, isError) { /* ... */ }
function showMusicResults(tracks) { /* ... */ }
function showPlaceResults(places) { /* ... */ }
function handleMemoryTypeChange() { /* ... */ }


// --- 6. Creación de Elementos del DOM (Constructores) ---
// ... (_createPreviewModal, _createEditModal, _bindEditModalEvents, _showConfirmDelete, _populateDaySelect remain largely the same, ensure safety checks) ...
// ... (_createStoreModal, _createStoreCategoryButton, _createStoreListModal, _createStoreListItem remain the same) ...
// ... (_createSearchModal, _createDialog remain the same) ...

function _createPreviewModal() { 
    try {
        const modal = document.createElement('div');
        modal.id = 'preview-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <button class="header-edit-btn" title="Edit Day">
                         <span class="material-icons-outlined">edit</span>
                    </button>
                    <h3></h3> 
                    <button class="modal-close-btn" title="Close">
                        <span class="material-icons-outlined">close</span>
                    </button>
                </div>
                <div class="modal-content-scrollable">
                    <div class="modal-section">
                        <h4>Memories:</h4>
                        <div id="preview-memorias-list"></div>
                    </div>
                </div>
            </div>
        `;
        
        modal.querySelector('.modal-close-btn').onclick = closePreviewModal;
        modal.querySelector('.header-edit-btn').onclick = _handleEditFromPreview; 
        
        modal.onclick = (e) => {
            if (e.target.id === 'preview-modal') closePreviewModal();
        };
        
        document.body.appendChild(modal);
        return modal;
    } catch (e) {
        console.error("UI: Error creating preview modal:", e);
        return null; 
    }
}
function _createEditModal() { 
     try {
        const modal = document.createElement('div');
        modal.id = 'edit-add-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-content-scrollable">
                    <div class="modal-section" id="day-selection-section" style="display: none;">
                        <h3>Add Memory To...</h3>
                        <label for="edit-mem-day">Day:</label>
                        <select id="edit-mem-day"></select>
                    </div>
                    <div class="modal-section" id="day-name-section" style="display: none;">
                        <h3 id="edit-modal-title">Editing Day</h3>
                        <label for="nombre-especial-input">Name this day:</label>
                        <input type="text" id="nombre-especial-input" placeholder="e.g., Pizza Day" maxlength="30">
                        <button id="save-name-btn" class="aqua-button">Save Day Name</button>
                        <p id="save-status" class="modal-status"></p>
                    </div>
                    <div class="modal-section memorias-section">
                        <h4>Memories</h4>
                        <div id="edit-memorias-list"></div>
                        <div id="confirm-delete-dialog" style="display: none;">
                            <p id="confirm-delete-text"></p>
                            <button id="confirm-delete-no" class="aqua-button">Cancel</button>
                            <button id="confirm-delete-yes" class="aqua-button">Delete</button>
                        </div>
                        <h5 id="memory-form-title">Add / Edit Memory</h5>
                        <form id="memory-form">
                            <label for="memoria-fecha-year">Original Year:</label>
                            <input type="number" id="memoria-fecha-year" placeholder="YYYY" min="1800" max="${new Date().getFullYear() + 1}" required> 
                            <label for="memoria-type">Type:</label>
                            <select id="memoria-type">
                                <option value="Text">Text</option>
                                <option value="Place">Place</option>
                                <option value="Music">Music</option>
                                <option value="Image">Image</option>
                            </select>
                            <div id="input-type-Text"><label for="memoria-desc">Description:</label><textarea id="memoria-desc" placeholder="Write memory..."></textarea></div>
                            <div id="input-type-Place" style="display: none;"><label for="memoria-place-search">Search Place:</label><input type="text" id="memoria-place-search" placeholder="e.g., Eiffel Tower"><div id="place-results"></div></div>
                            <div id="input-type-Music" style="display: none;"><label for="memoria-music-search">Search Music:</label><input type="text" id="memoria-music-search" placeholder="e.g., Bohemian Rhapsody"><div id="itunes-results"></div></div>
                            <div id="input-type-Image" style="display: none;"><label for="memoria-image-upload">Image File:</label><input type="file" id="memoria-image-upload" accept="image/*"><label for="memoria-image-desc">Description (optional):</label><input type="text" id="memoria-image-desc" placeholder="Image description..."></div>
                            <button type="submit" id="save-memoria-btn" class="aqua-button">Add Memory</button>
                            <p id="memoria-status" class="modal-status"></p>
                        </form>
                    </div>
                </div>
                <div class="modal-main-buttons">
                    <button type="button" id="close-edit-add-btn" class="modal-cancel-btn">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    } catch (e) {
        console.error("UI: Error creating edit modal:", e);
        return null;
    }
}
function _bindEditModalEvents() { /* ... */ } // Assume this remains correct for now
function _showConfirmDelete(memoria) { /* ... */ } // Assume this remains correct
function _populateDaySelect(allDays) { /* ... */ } // Assume this remains correct
function _createStoreModal() { /* ... */ } // Assume this remains correct
function _createStoreCategoryButton(type, icon, label) { /* ... */ } // Assume this remains correct
function _createStoreListModal() { /* ... */ } // Assume this remains correct
function _createStoreListItem(item) { /* ... */ } // Assume this remains correct
function _createSearchModal() { /* ... */ } // Assume this remains correct
function _createDialog(id, title, message) { /* ... */ } // Assume this remains correct


// --- 7. Exportación del Módulo ---
export const ui = {
    init,
    updateLoginUI,
    drawCalendar,
    updateSpotlight,
    openPreviewModal,
    closePreviewModal,
    openEditModal,
    closeEditModal,
    resetMemoryForm,
    showModalStatus,
    showMusicResults,
    showPlaceResults,
    handleMemoryTypeChange,
    openStoreModal,
    closeStoreModal,
    openStoreListModal,
    closeStoreListModal,
    updateStoreList,
    openSearchModal,
    closeSearchModal,
    openSettingsDialog, 
};

