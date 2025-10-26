/*
 * ui.js (v7.1)
 * - Fixes Spotlight display (year only, correct icons)
 * - Fixes Logout button overlap (avatar is now the logout trigger)
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
    loadMemoriesForDay: async (diaId) => { console.warn("loadMemoriesForDay not implemented"); return []; }, // Add default
    getAllDaysData: () => { console.warn("getAllDaysData not implemented"); return []; }, // Add default
    onMonthChange: (dir) => console.warn("onMonthChange no implementado"),
    // REMOVED: onDayClick - now handled internally by _handleDayClick
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
    console.log("UI: Initializing...");
    _callbacks = { ..._callbacks, ...callbacks }; 

    _dom.appContent = document.getElementById('app-content');
    _dom.monthNameDisplay = document.getElementById('month-name-display');
    _dom.navPrev = document.getElementById('prev-month');
    _dom.navNext = document.getElementById('next-month');
    _dom.footer = document.querySelector('.footer-dock');
    _dom.spotlightHeader = document.getElementById('spotlight-date-header');
    _dom.spotlightList = document.getElementById('today-memory-spotlight');

    if (!_dom.appContent || !_dom.navPrev || !_dom.footer) {
        console.error("UI: Missing critical DOM elements (app-content, nav, footer).");
        return;
    }

    _setupNavigation();
    _setupHeader(); 
    _setupFooter();
    
    // Initial UI update based on auth state (important!)
    updateLoginUI(_callbacks.isUserLoggedIn() ? auth.currentUser : null); // Assumes 'auth' is globally accessible or passed in

    console.log("UI: Initialized and events connected.");
}


function updateLoginUI(user) {
    const loginSection = document.getElementById('login-section');
    if (!loginSection) return;

    if (user) {
        // --- CHANGED: Avatar is now the logout trigger ---
        loginSection.innerHTML = `
            <div id="user-info" title="Logout"> 
                <img id="user-img" src="${user.photoURL || 'https://placehold.co/30x30/ccc/fff?text=?'}" alt="Avatar">
                <!-- Username hidden by CSS -->
                <span id="user-name">${user.displayName || 'User'}</span> 
            </div>
            <!-- Logout button removed -->
        `;
        const userInfoDiv = document.getElementById('user-info');
        if (userInfoDiv) userInfoDiv.onclick = () => _callbacks.onLogout(); 
        
    } else {
        // --- Login button remains the same ---
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
    _dom.monthNameDisplay.textContent = monthName;
    
    if (!_dom.appContent) {
        console.error("UI: app-content element not found, cannot draw calendar.");
        return; // Exit if container doesn't exist
    }
    _dom.appContent.innerHTML = ''; 
    
    const grid = document.createElement('div');
    grid.className = 'calendario-grid';
    
    if (!days || days.length === 0) {
        grid.innerHTML = "<p>No days found for this month.</p>";
        _dom.appContent.appendChild(grid);
        return;
    }

    const fragment = document.createDocumentFragment();
    
    days.forEach(dia => {
        const btn = document.createElement("button");
        btn.className = "dia-btn";
        
        if (dia.id === todayId) {
            btn.classList.add('dia-btn-today');
        }
        if (dia.tieneMemorias) {
            btn.classList.add('tiene-memorias');
        }
        
        btn.innerHTML = `<span class="dia-numero">${parseInt(dia.id.substring(3), 10)}</span>`;
        btn.dataset.diaId = dia.id;
        
        btn.onclick = () => _handleDayClick(dia); 
        
        fragment.appendChild(btn);
    });
    
    _dom.appContent.appendChild(grid);
    console.log(`UI: Drew calendar with ${days.length} days.`);
}

function updateSpotlight(headerText, memories) {
    if (_dom.spotlightHeader) {
        _dom.spotlightHeader.textContent = headerText;
    }
    
    if (!_dom.spotlightList) return;
    
    _dom.spotlightList.innerHTML = '';
    // --- CHANGED: Use specific message ---
    if (!memories || memories.length === 0) {
        _dom.spotlightList.innerHTML = `<p class="list-placeholder">No memories for today.</p>`; 
        return;
    }
    
    const fragment = document.createDocumentFragment();
    memories.forEach(mem => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'spotlight-memory-item';
        
        const diaId = mem.diaId; 
        // Ensure diaId is set correctly, especially for spotlight which should always be today's ID
        itemDiv.dataset.diaId = diaId || _callbacks.getTodayId(); // Need callback for todayId

        // --- CHANGED: Context 'spotlight' passed ---
        itemDiv.innerHTML = _createMemoryItemHTML(mem, 'spotlight'); 
        
        itemDiv.onclick = () => {
            // Reconstruct a minimal 'dia' object for _handleDayClick
            const diaData = { 
                id: itemDiv.dataset.diaId, 
                // We don't necessarily have Nombre_Dia or Nombre_Especial here easily, 
                // but _handleDayClick primarily needs the ID.
                Nombre_Dia: itemDiv.dataset.diaId // Use ID as fallback name
            };
            _handleDayClick(diaData); 
        };

        fragment.appendChild(itemDiv);
    });
    _dom.spotlightList.appendChild(fragment);
}


// --- 3. Conexión de Eventos Estáticos ---

function _setupNavigation() {
    _dom.navPrev.onclick = () => _callbacks.onMonthChange('prev');
    _dom.navNext.onclick = () => _callbacks.onMonthChange('next');
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
    _currentMemories = memories; 

    if (!_modals.preview) {
        _modals.preview = _createPreviewModal();
    }
    
    const title = _modals.preview.querySelector('.modal-header h3');
    const editBtn = _modals.preview.querySelector('.header-edit-btn');
    
    title.textContent = `${dia.Nombre_Dia} ${dia.Nombre_Especial !== 'Unnamed Day' ? `(${dia.Nombre_Especial})` : ''}`;
    
    if (_callbacks.isUserLoggedIn()) {
        editBtn.classList.add('visible');
    } else {
        editBtn.classList.remove('visible');
    }
    
    _renderMemoryList('preview-memorias-list', memories);
    
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
        const today = new Date();
        const todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        _currentDay = allDays.find(d => d.id === todayId) || allDays[0];
         if (!_currentDay) { // Safety check if allDays is empty
            console.error("UI: Cannot open Add modal, no day data available.");
            alert("Error: Calendar data not loaded.");
            return;
        }
        _currentMemories = [];
    } else {
        _currentDay = dia;
        _currentMemories = memories || []; // Ensure memories is an array
    }
    
    if (!_modals.edit) {
        _modals.edit = _createEditModal();
        _populateDaySelect(allDays);
        _bindEditModalEvents();
    }
    
    const daySelectionSection = _modals.edit.querySelector('#day-selection-section');
    const dayNameSection = _modals.edit.querySelector('#day-name-section');
    const daySelect = _modals.edit.querySelector('#edit-mem-day');
    const yearInput = _modals.edit.querySelector('#memoria-fecha-year'); 
    const titleEl = _modals.edit.querySelector('#edit-modal-title');
    const nameInput = _modals.edit.querySelector('#nombre-especial-input');
    
    if (isAdding) {
        daySelectionSection.style.display = 'block';
        dayNameSection.style.display = 'none';
        daySelect.value = _currentDay.id;
        yearInput.value = new Date().getFullYear(); 
    } else {
        daySelectionSection.style.display = 'none';
        dayNameSection.style.display = 'block';
        titleEl.textContent = `Editing: ${_currentDay.Nombre_Dia} (${_currentDay.id})`;
        nameInput.value = _currentDay.Nombre_Especial === 'Unnamed Day' ? '' : _currentDay.Nombre_Especial;
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
        delete saveBtn.dataset.editingId; // Clear editing ID
    }
    const itunesResults = document.getElementById('itunes-results');
    const placeResults = document.getElementById('place-results');
    if(itunesResults) itunesResults.innerHTML = '';
    if(placeResults) placeResults.innerHTML = '';
    
    handleMemoryTypeChange(); 
}


function fillFormForEdit(memoria) {
    if (!_modals.edit) return;
    
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
    
    // --- CHANGED: Save editing ID on the button ---
    if(saveButton) saveButton.dataset.editingId = memoria.id;

    if (memoria.Fecha_Original?.toDate) {
        try {
            yearInput.value = memoria.Fecha_Original.toDate().getFullYear();
        } catch (e) {
            yearInput.value = new Date().getFullYear(); // Fallback
        }
    } else {
        yearInput.value = new Date().getFullYear(); // Fallback
    }

    typeSelect.value = memoria.Tipo || 'Text';
    handleMemoryTypeChange();
    
    // Clear previous search results
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
        formTitle.scrollIntoView({ behavior: 'smooth' });
    }
}

// --- Modales de "Store" ---
function openStoreModal() {
    if (!_modals.store) {
        _modals.store = _createStoreModal();
    }
    _modals.store.classList.add('visible');
}
function closeStoreModal() {
    if (_modals.store) _modals.store.classList.remove('visible');
}
function openStoreListModal(title) {
    if (!_modals.storeList) {
        _modals.storeList = _createStoreListModal();
    }
    _modals.storeList.querySelector('.modal-header h3').textContent = title;
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
    
    if (!append) {
        listDiv.innerHTML = ''; 
    }
    
    if (!append && items.length === 0) {
        listDiv.innerHTML = '<p class="list-placeholder">No items found.</p>';
    }
    
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
        const itemDiv = _createStoreListItem(item);
        fragment.appendChild(itemDiv);
    });
    listDiv.appendChild(fragment);
    
    loadMoreBtn.style.display = hasMore ? 'block' : 'none';
}

// --- Modal de Búsqueda ---
function openSearchModal() {
    if (!_modals.search) {
        _modals.search = _createSearchModal();
    }
    _modals.search.classList.add('visible');
    _modals.search.querySelector('#search-input').focus();
}
function closeSearchModal() {
    if (_modals.search) {
        _modals.search.classList.remove('visible');
        _modals.search.querySelector('#search-form').reset();
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
    }
    _modals.settings.classList.add('visible');
}


// --- 5. Lógica de UI interna (Helpers) ---

async function _handleDayClick(dia) {
    // Always load memories first
    const memories = await _callbacks.loadMemoriesForDay(dia.id); 

    // Always open Preview modal first
    openPreviewModal(dia, memories);
}


function _createMemoryItemHTML(memoria, context) {
    let contentHTML = '';
    let artworkHTML = '';
    // --- CHANGED: Use only year for spotlight/preview/edit ---
    let fechaStr = 'Unknown Year'; 
    if (memoria.Fecha_Original?.toDate) {
        try {
            fechaStr = memoria.Fecha_Original.toDate().getFullYear().toString();
        } catch (e) { fechaStr = 'Invalid Date'; }
    } else if (memoria.Fecha_Original) {
         // Attempt to parse if it's a string YYYY-MM-DD
         if (typeof memoria.Fecha_Original === 'string' && memoria.Fecha_Original.length >= 4) {
             fechaStr = memoria.Fecha_Original.substring(0, 4);
         } else {
             fechaStr = memoria.Fecha_Original.toString(); // Fallback
         }
    }

    // --- CHANGED: Add year as small text ---
    contentHTML += `<small>${fechaStr}</small>`; 
    
    // --- CHANGED: Use correct icon based on type ---
    let icon = 'notes'; // Default icon
    switch (memoria.Tipo) {
        case 'Place': icon = 'place'; break;
        case 'Music': icon = 'music_note'; break;
        case 'Image': icon = 'image'; break;
    }
    contentHTML += `<span><span class="material-icons-outlined">${icon}</span> `; // Add icon

    // Add specific content based on type
    switch (memoria.Tipo) {
        case 'Place':
            contentHTML += `${memoria.LugarNombre || 'Place'}</span>`;
            break;
        case 'Music':
            if (memoria.CancionData?.trackName) {
                contentHTML += `<strong>${memoria.CancionData.trackName}</strong> by ${memoria.CancionData.artistName}</span>`;
                if(memoria.CancionData.artworkUrl60) {
                    artworkHTML = `<img src="${memoria.CancionData.artworkUrl60}" class="memoria-artwork">`;
                }
            } else {
                contentHTML += `${memoria.CancionInfo || 'Music'}</span>`;
            }
            break;
        case 'Image':
            contentHTML += `${memoria.Descripcion || 'Image'}</span>`;
            if (memoria.ImagenURL) {
                contentHTML += ` <small>(<a href="${memoria.ImagenURL}" target="_blank" rel="noopener">View Image</a>)</small>`;
            }
            break;
        case 'Text':
        default:
            contentHTML += `${memoria.Descripcion || 'Memory'}</span>`;
            break;
    }
    
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

    return `${artworkHTML}<div class="memoria-item-content">${contentHTML}</div>${actionsHTML}`;
}

function _renderMemoryList(listId, memories) {
    const listDiv = document.getElementById(listId);
    if (!listDiv) return;
    
    listDiv.innerHTML = '';
    if (!memories || memories.length === 0) {
        listDiv.innerHTML = `<p class="list-placeholder">No memories for this day.</p>`;
        return;
    }
    
    const fragment = document.createDocumentFragment();
    memories.forEach(mem => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'memoria-item';
        const context = (listId === 'preview-memorias-list') ? 'preview-modal' : 'edit-modal';
        itemDiv.innerHTML = _createMemoryItemHTML(mem, context);
        fragment.appendChild(itemDiv);
    });
    listDiv.appendChild(fragment);
}

function showModalStatus(elementId, message, isError) {
    const statusEl = document.getElementById(elementId);
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `modal-status ${isError ? 'error' : 'success'}`;
    
    if (!isError && message) {
        setTimeout(() => {
            if (statusEl.textContent === message) {
                statusEl.textContent = '';
                statusEl.className = 'modal-status';
            }
        }, 2500);
    }
}

function showMusicResults(tracks) {
    const resultsDiv = document.getElementById('itunes-results');
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = '';
    if (!tracks || tracks.length === 0) {
        resultsDiv.innerHTML = '<p class="list-placeholder">No results</p>';
        return;
    }
    
    tracks.forEach(track => {
        const trackDiv = document.createElement('div');
        trackDiv.className = 'itunes-track';
        const artworkUrl = track.artworkUrl100 || track.artworkUrl60 || '';
        trackDiv.innerHTML = `
            <img src="${artworkUrl}" class="itunes-artwork" style="${artworkUrl ? '' : 'display:none;'}">
            <div class="itunes-track-info">
                <div class="itunes-track-name">${track.trackName || '?'}</div>
                <div class="itunes-track-artist">${track.artistName || '?'}</div>
            </div>
        `;
        trackDiv.onclick = () => {
            _selectedMusicTrack = track;
            document.getElementById('memoria-music-search').value = `${track.trackName} - ${track.artistName}`;
            resultsDiv.innerHTML = ''; 
            trackDiv.classList.add('selected'); 
            resultsDiv.appendChild(trackDiv);
        };
        resultsDiv.appendChild(trackDiv);
    });
}

function showPlaceResults(places) {
    const resultsDiv = document.getElementById('place-results');
    if (!resultsDiv) return;

    resultsDiv.innerHTML = '';
    if (!places || places.length === 0) {
        resultsDiv.innerHTML = '<p class="list-placeholder">No results</p>';
        return;
    }
    
    places.forEach(place => {
        const placeDiv = document.createElement('div');
        placeDiv.className = 'place-result';
        placeDiv.textContent = place.display_name;
        
        placeDiv.onclick = () => {
            _selectedPlace = {
                name: place.display_name,
                lat: place.lat,
                lon: place.lon,
                osm_id: place.osm_id,
                osm_type: place.osm_type
            };
            document.getElementById('memoria-place-search').value = place.display_name;
            resultsDiv.innerHTML = ''; 
            placeDiv.classList.add('selected'); 
            resultsDiv.appendChild(placeDiv);
        };
        resultsDiv.appendChild(placeDiv);
    });
}

function handleMemoryTypeChange() {
    const type = document.getElementById('memoria-type')?.value || 'Text';
    ['Text','Place','Music','Image'].forEach(id => {
        const el = document.getElementById(`input-type-${id}`);
        if (el) el.style.display = 'none';
    });
    const selectedEl = document.getElementById(`input-type-${type}`);
    if (selectedEl) selectedEl.style.display = 'block';
    
    if (type !== 'Music') _selectedMusicTrack = null;
    if (type !== 'Place') _selectedPlace = null;
}


// --- 6. Creación de Elementos del DOM (Constructores) ---

function _createPreviewModal() {
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
}

function _createEditModal() {
    const modal = document.createElement('div');
    modal.id = 'edit-add-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-content-scrollable">
                
                <div class="modal-section" id="day-selection-section" style="display: none;">
                    <h3>Add Memory To...</h3>
                    <label for="edit-mem-day">Day (MM-DD):</label>
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
                        
                        <div id="input-type-Text">
                            <label for="memoria-desc">Description:</label>
                            <textarea id="memoria-desc" placeholder="Write memory..."></textarea>
                        </div>
                        <div id="input-type-Place" style="display: none;">
                            <label for="memoria-place-search">Search Place:</label>
                            <input type="text" id="memoria-place-search" placeholder="e.g., Eiffel Tower">
                            <div id="place-results"></div>
                        </div>
                        <div id="input-type-Music" style="display: none;">
                            <label for="memoria-music-search">Search Music:</label>
                            <input type="text" id="memoria-music-search" placeholder="e.g., Bohemian Rhapsody">
                            <div id="itunes-results"></div>
                        </div>
                        <div id="input-type-Image" style="display: none;">
                            <label for="memoria-image-upload">Image File:</label>
                            <input type="file" id="memoria-image-upload" accept="image/*">
                            <label for="memoria-image-desc">Description (optional):</label>
                            <input type="text" id="memoria-image-desc" placeholder="Image description...">
                        </div>
                        
                        <button type="submit" id="save-memoria-btn" class="aqua-button">Add Memory</button>
                        <p id="memoria-status" class="modal-status"></p>
                    </form>
                </div>
            </div>
            
            <div class="modal-main-buttons">
                <button id="close-edit-add-btn" class="modal-cancel-btn">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
}


function _bindEditModalEvents() {
    if (!_modals.edit) return;

    _modals.edit.querySelector('#close-edit-add-btn').onclick = closeEditModal;
    
    _modals.edit.querySelector('#save-name-btn').onclick = () => {
        const newName = _modals.edit.querySelector('#nombre-especial-input').value;
        if (_currentDay) {
            _callbacks.onSaveDayName(_currentDay.id, newName);
        }
    };
    
    _modals.edit.querySelector('#memoria-type').onchange = handleMemoryTypeChange;
    
    _modals.edit.querySelector('#memoria-place-search').onblur = (e) => {
        const term = e.target.value.trim();
        // Prevent search if user just clicked a result
        setTimeout(() => { 
            if (term && !_selectedPlace) _callbacks.onSearchPlace(term);
        }, 150); // Delay to allow click event on results
    };
    _modals.edit.querySelector('#memoria-music-search').onblur = (e) => {
        const term = e.target.value.trim();
        setTimeout(() => {
            if (term && !_selectedMusicTrack) _callbacks.onSearchMusic(term);
        }, 150);
    };

    _modals.edit.querySelector('#memory-form').onsubmit = (e) => {
        e.preventDefault();
        const saveBtn = _modals.edit.querySelector('#save-memoria-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        const yearInput = _modals.edit.querySelector('#memoria-fecha-year');
        const year = yearInput.value.trim();
        const diaId = _modals.edit.querySelector('#day-selection-section').style.display !== 'none' 
                    ? _modals.edit.querySelector('#edit-mem-day').value 
                    : _currentDay.id;

        if (!year || !/^\d{4}$/.test(year) || parseInt(year) < 1800 || parseInt(year) > new Date().getFullYear() + 1) {
            showModalStatus('memoria-status', 'Please enter a valid 4-digit year.', true);
            saveBtn.disabled = false;
            saveBtn.textContent = _isEditingMemory ? 'Update Memory' : 'Add Memory';
            return;
        }

        const fechaStr = `${year}-${diaId}`; // Format: "YYYY-MM-DD"

        const type = _modals.edit.querySelector('#memoria-type').value;
        const memoryData = {
            id: _isEditingMemory ? document.getElementById('save-memoria-btn').dataset.editingId : null,
            Fecha_Original: fechaStr, 
            Tipo: type,
            Descripcion: null, LugarNombre: null, LugarData: null,
            CancionInfo: null, CancionData: null, ImagenURL: null, file: null
        };

        switch (type) {
            case 'Text':
                memoryData.Descripcion = _modals.edit.querySelector('#memoria-desc').value.trim();
                break;
            case 'Place':
                memoryData.LugarNombre = _modals.edit.querySelector('#memoria-place-search').value.trim();
                if (_selectedPlace) {
                    memoryData.LugarData = { lat: _selectedPlace.lat, lon: _selectedPlace.lon, osm_id: _selectedPlace.osm_id, osm_type: _selectedPlace.osm_type };
                }
                break;
            case 'Music':
                memoryData.CancionInfo = _modals.edit.querySelector('#memoria-music-search').value.trim();
                if (_selectedMusicTrack) {
                    memoryData.CancionData = { trackId: _selectedMusicTrack.trackId, artistName: _selectedMusicTrack.artistName, trackName: _selectedMusicTrack.trackName, artworkUrl60: _selectedMusicTrack.artworkUrl60, trackViewUrl: _selectedMusicTrack.trackViewUrl };
                }
                break;
            case 'Image':
                memoryData.Descripcion = _modals.edit.querySelector('#memoria-image-desc').value.trim();
                const fileInput = _modals.edit.querySelector('#memoria-image-upload');
                if (fileInput.files.length > 0) {
                    memoryData.file = fileInput.files[0];
                }
                break;
        }

        if (_isEditingMemory) {
             memoryData.id = document.getElementById('save-memoria-btn').dataset.editingId;
        }

        _callbacks.onSaveMemory(diaId, memoryData, _isEditingMemory);
    };
    
    const listDiv = _modals.edit.querySelector('#edit-memorias-list');
    listDiv.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        
        if (editBtn) {
            const memId = editBtn.dataset.memoriaId;
            const memToEdit = _currentMemories.find(m => m.id === memId);
            if (memToEdit) {
                fillFormForEdit(memToEdit); // Also sets dataset.editingId
            }
        }
        
        if (deleteBtn) {
            const memId = deleteBtn.dataset.memoriaId;
            const memToDelete = _currentMemories.find(m => m.id === memId);
            if (memToDelete && _currentDay) {
                _showConfirmDelete(memToDelete);
            }
        }
    });

    _modals.edit.querySelector('#confirm-delete-no').onclick = () => {
        _modals.edit.querySelector('#confirm-delete-dialog').style.display = 'none';
    };
    _modals.edit.querySelector('#confirm-delete-yes').onclick = () => {
        const memId = _modals.edit.querySelector('#confirm-delete-yes').dataset.memId;
        if (memId && _currentDay) {
            _callbacks.onDeleteMemory(_currentDay.id, memId);
        }
        _modals.edit.querySelector('#confirm-delete-dialog').style.display = 'none';
    };
}


function _showConfirmDelete(memoria) {
    const dialog = _modals.edit.querySelector('#confirm-delete-dialog');
    const text = _modals.edit.querySelector('#confirm-delete-text');
    const btnYes = _modals.edit.querySelector('#confirm-delete-yes');
    
    let desc = memoria.Tipo;
    if (memoria.Descripcion) desc = memoria.Descripcion.substring(0, 30) + (memoria.Descripcion.length > 30 ? '...' : '');
    else if (memoria.LugarNombre) desc = memoria.LugarNombre;
    else if (memoria.CancionInfo) desc = memoria.CancionInfo;
    
    text.textContent = `Are you sure you want to delete "${desc}"?`;
    btnYes.dataset.memId = memoria.id;
    dialog.style.display = 'block';
}

function _populateDaySelect(allDays) {
    const select = document.getElementById('edit-mem-day');
    if (!select || !allDays) return; // Add check for allDays
    
    select.innerHTML = '';
    const fragment = document.createDocumentFragment();
    allDays.forEach(dia => {
        const option = document.createElement('option');
        option.value = dia.id; 
        option.textContent = dia.Nombre_Dia; 
        fragment.appendChild(option);
    });
    select.appendChild(fragment);
}

function _createStoreModal() {
    const modal = document.createElement('div');
    modal.id = 'store-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Store</h3>
                <button class="modal-close-btn" title="Close">
                    <span class="material-icons-outlined">close</span>
                </button>
            </div>
            <div class="modal-content-scrollable" style="padding: 0;"> </div>
        </div>
    `;
    
    const scrollableDiv = modal.querySelector('.modal-content-scrollable');
    const categories = [
        { type: 'Names', icon: 'label', label: 'Named Days' },
        { type: 'Place', icon: 'place', label: 'Places' },
        { type: 'Music', icon: 'music_note', label: 'Music' },
        { type: 'Image', icon: 'image', label: 'Images' },
        { type: 'Text', icon: 'notes', label: 'Text Notes' },
    ];
    const fragment = document.createDocumentFragment();
    categories.forEach(cat => fragment.appendChild(_createStoreCategoryButton(cat.type, cat.icon, cat.label)));
    scrollableDiv.appendChild(fragment);

    modal.querySelector('.modal-close-btn').onclick = closeStoreModal;
    modal.onclick = (e) => { if (e.target.id === 'store-modal') closeStoreModal(); };
    document.body.appendChild(modal);
    return modal;
}

function _createStoreCategoryButton(type, icon, label) {
    const btn = document.createElement('button');
    btn.className = 'store-category-btn';
    btn.innerHTML = `<span class="material-icons-outlined">${icon}</span><span>${label}</span>`;
    btn.onclick = () => _callbacks.onStoreCategoryClick(type);
    return btn;
}

function _createStoreListModal() {
    const modal = document.createElement('div');
    modal.id = 'store-list-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Store: Results</h3>
                <button class="modal-close-btn" title="Close">
                    <span class="material-icons-outlined">close</span>
                </button>
            </div>
            <div class="modal-content-scrollable">
                <div id="store-list"><p class="list-placeholder">Loading...</p></div>
                <button id="store-load-more-btn" class="aqua-button" style="display: none;">Load More</button>
            </div>
        </div>
    `;
    
    modal.querySelector('.modal-close-btn').onclick = closeStoreListModal;
    modal.onclick = (e) => { if (e.target.id === 'store-list-modal') closeStoreListModal(); };
    modal.querySelector('#store-load-more-btn').onclick = () => _callbacks.onStoreLoadMore();
    document.body.appendChild(modal);
    return modal;
}

function _createStoreListItem(item) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'store-list-item';
    itemDiv.onclick = () => _callbacks.onStoreItemClick(item.diaId);
    
    let icon = 'notes';
    let title = 'Memory';
    let subtitle = item.diaId;
    
    if (item.type === 'Names') {
        icon = 'label';
        title = item.Nombre_Especial;
        subtitle = item.Nombre_Dia; 
    } else {
        const date = item.Fecha_Original?.toDate();
        subtitle = date ? date.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}) : item.diaId;

        switch (item.Tipo) {
            case 'Place': icon = 'place'; title = item.LugarNombre; break;
            case 'Music': icon = 'music_note'; title = item.CancionInfo || 'Music Track'; break;
            case 'Image': icon = 'image'; title = item.Descripcion || 'Image'; break;
            case 'Text': default: icon = 'notes'; title = (item.Descripcion || 'Text Note').substring(0, 50) + ( (item.Descripcion?.length || 0) > 50 ? '...' : '' ); break;
        }
    }
    
    itemDiv.innerHTML = `
        <span class="material-icons-outlined">${icon}</span>
        <div class="store-list-item-content">
            <span>${title}</span>
            <small>${subtitle}</small>
        </div>
    `;
    return itemDiv;
}

function _createSearchModal() {
    const modal = document.createElement('div');
    modal.id = 'search-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <form id="search-form">
                <div class="modal-header">
                    <h3>Search Memories</h3>
                    <button type="button" class="modal-close-btn" title="Close">
                        <span class="material-icons-outlined">close</span>
                    </button>
                </div>
                <div class="modal-content-scrollable">
                    <div class="modal-section">
                        <label for="search-input">Search Term:</label>
                        <input type="text" id="search-input" placeholder="e.g., pizza, paris..." required>
                    </div>
                </div>
                <div class="modal-main-buttons">
                    <button type="button" class="modal-cancel-btn">Cancel</button>
                    <button type="submit" class="aqua-button">Search</button>
                </div>
            </form>
        </div>
    `;

    const form = modal.querySelector('#search-form');
    const closeBtn = modal.querySelector('.modal-close-btn');
    const cancelBtn = modal.querySelector('.modal-cancel-btn');

    closeBtn.onclick = closeSearchModal;
    cancelBtn.onclick = closeSearchModal;
    modal.onclick = (e) => { if (e.target.id === 'search-modal') closeSearchModal(); };
    
    form.onsubmit = (e) => {
        e.preventDefault();
        const term = modal.querySelector('#search-input').value.trim();
        if (term) {
            _callbacks.onSearchSubmit(term);
        }
    };
    
    document.body.appendChild(modal);
    return modal;
}


function _createDialog(id, title, message) {
    const dialogOverlay = document.createElement('div');
    dialogOverlay.id = id;
    dialogOverlay.className = 'dialog-overlay'; 
    dialogOverlay.innerHTML = `
        <div class="dialog-content">
            <h4>${title}</h4>
            <p>${message}</p>
            <button class="dialog-button">OK</button>
        </div>
    `;
    document.body.appendChild(dialogOverlay);
    
    const closeBtn = dialogOverlay.querySelector('.dialog-button');
    closeBtn.onclick = () => dialogOverlay.classList.remove('visible');
    
    dialogOverlay.onclick = (e) => {
        if (e.target.id === id) {
            dialogOverlay.classList.remove('visible');
        }
    };
    return dialogOverlay;
}


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

