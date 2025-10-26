/*
 * ui.js (v6.0 - English Translation)
 * User Interface (DOM) Module.
 * Handles drawing, modal creation, and DOM events.
 * Knows nothing about Firestore.
 */

// --- Internal State ---
const _dom = {
    appContent: null,
    monthNameDisplay: null,
    navPrev: null,
    navNext: null,
    footer: null,
    mainLoader: null,
    spotlightHeader: null,
    spotlightList: null,
};

const _modals = {
    preview: null,
    edit: null,
    store: null,
    storeList: null,
    search: null,
};

let _callbacks = {
    onMonthChange: (dir) => console.warn("onMonthChange not implemented"),
    onDayClick: (dia) => console.warn("onDayClick not implemented"),
    onFooterAction: (action) => console.warn("onFooterAction not implemented"),
    onLogin: () => console.warn("onLogin not implemented"),
    onLogout: () => console.warn("onLogout not implemented"),
    onSaveDayName: (diaId, name) => console.warn("onSaveDayName not implemented"),
    onSaveMemory: (diaId, data, isEditing) => console.warn("onSaveMemory not implemented"),
    onDeleteMemory: (diaId, memId) => console.warn("onDeleteMemory not implemented"),
    onSearchMusic: (term) => console.warn("onSearchMusic not implemented"),
    onSearchPlace: (term) => console.warn("onSearchPlace not implemented"),
    onStoreCategoryClick: (type) => console.warn("onStoreCategoryClick not implemented"),
    onStoreLoadMore: () => console.warn("onStoreLoadMore not implemented"),
    onStoreItemClick: (diaId) => console.warn("onStoreItemClick not implemented"),
    onSearchSubmit: (term) => console.warn("onSearchSubmit not implemented"),
};

// Editing Temp State
let _currentDay = null;      
let _currentMemories = []; 
let _isEditingMemory = false; 
let _selectedMusicTrack = null;
let _selectedPlace = null;


// --- 1. Init & Main Functions ---

/**
 * Initializes the UI module.
 * @param {Object} callbacks - Callback functions from main.js
 */
function init(callbacks) {
    console.log("UI: Initializing...");
    _callbacks = { ..._callbacks, ...callbacks }; 

    _dom.appContent = document.getElementById('app-content');
    _dom.monthNameDisplay = document.getElementById('month-name-display');
    _dom.navPrev = document.getElementById('prev-month');
    _dom.navNext = document.getElementById('next-month');
    _dom.footer = document.querySelector('.footer-dock');
    _dom.mainLoader = document.getElementById('main-loader');
    _dom.spotlightHeader = document.getElementById('spotlight-date-header');
    _dom.spotlightList = document.getElementById('today-memory-spotlight');

    if (!_dom.appContent || !_dom.navPrev || !_dom.footer) {
        console.error("UI: Missing critical DOM elements (app-content, nav, footer).");
        return;
    }

    _setupNavigation();
    _setupFooter();
    
    console.log("UI: Initialized and events connected.");
}

/**
 * Shows or hides the main loader.
 * @param {string|null} message - Message to display (null to hide).
 * @param {boolean} show - Force show/hide.
 */
function setLoading(message, show) {
    if (!_dom.mainLoader) {
        _dom.mainLoader = _createMainLoader();
        document.body.appendChild(_dom.mainLoader);
    }
    
    if (show) {
        _dom.mainLoader.querySelector('span').textContent = message || "Loading...";
        _dom.mainLoader.classList.add('visible');
    } else {
        _dom.mainLoader.classList.remove('visible');
    }
}

/**
 * Updates the login UI (avatar, button)
 * @param {Object} user - Firebase user object or null.
 */
function updateLoginUI(user) {
    const loginSection = document.getElementById('login-section');
    if (!loginSection) return;

    if (user) {
        // User logged in
        loginSection.innerHTML = `
            <div id="user-info">
                <img id="user-img" src="${user.photoURL || 'https://placehold.co/30x30/ccc/fff?text=?'}" alt="Avatar">
                <!-- Hiding name as requested -->
                <span id="user-name" style="display: none;">${user.displayName || 'User'}</span>
            </div>
            <button id="login-btn" class="header-icon-btn" title="Logout">
                <span class="material-icons-outlined">logout</span>
            </button>
        `;
        const logoutBtn = document.getElementById('login-btn');
        if (logoutBtn) logoutBtn.onclick = () => _callbacks.onLogout();
        
    } else {
        // User logged out
        loginSection.innerHTML = `
            <button id="login-btn" class="header-icon-btn" title="Login with Google">
                <span class="material-icons-outlined">login</span>
            </button>
        `;
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) loginBtn.onclick = () => _callbacks.onLogin();
    }
}

// --- 2. Main Content Rendering ---

/**
 * Draws the calendar grid for a month.
 * @param {string} monthName - Name of the month.
 * @param {Array} days - Array of day objects for that month.
 * @param {string} todayId - Today's ID (e.g., "10-26").
 */
function drawCalendar(monthName, days, todayId) {
    _dom.monthNameDisplay.textContent = monthName;
    
    if (!_dom.appContent) return;
    _dom.appContent.innerHTML = ''; 
    
    const grid = document.createElement('div');
    grid.className = 'calendario-grid';
    
    if (days.length === 0) {
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
        
        btn.innerHTML = `<span class="dia-numero">${dia.id.substring(3)}</span>`;
        btn.dataset.diaId = dia.id;
        
        btn.addEventListener('click', () => _callbacks.onDayClick(dia));
        
        fragment.appendChild(btn);
    });
    
    grid.appendChild(fragment);
    _dom.appContent.appendChild(grid);
    console.log(`UI: Calendar drawn with ${days.length} days.`);
}

/**
 * Updates the "Spotlight" widget
 * @param {string} dateString - Header text (e.g., "Today, October 26")
 * @param {Array} memories - Array of memory objects (max 3)
 */
function updateSpotlight(dateString, memories) {
    if (_dom.spotlightHeader) {
        _dom.spotlightHeader.textContent = dateString;
    }
    
    if (!_dom.spotlightList) return;
    _dom.spotlightList.innerHTML = ''; 
    
    if (memories.length === 0) {
        _dom.spotlightList.innerHTML = '<div class="list-placeholder" style="color: #555; padding: 10px 5px;">No memories for this day.</div>';
        return;
    }
    
    const fragment = document.createDocumentFragment();
    memories.forEach(mem => {
        fragment.appendChild(_createMemoryItemHTML(mem, 'spotlight'));
    });
    _dom.spotlightList.appendChild(fragment);
}


// --- 3. Modal Logic (Creation & Management) ---

// --- PREVIEW MODAL ---
function openPreviewModal(dia, memories) {
    _currentDay = dia;
    _currentMemories = memories;
    
    if (!_modals.preview) {
        _modals.preview = _createPreviewModal();
        document.body.appendChild(_modals.preview);
    }
    
    const titleEl = _modals.preview.querySelector('.modal-header h3');
    const specialName = (dia.Nombre_Especial && dia.Nombre_Especial !== 'Unnamed Day') ? ` (${dia.Nombre_Especial})` : '';
    titleEl.textContent = `${dia.Nombre_Dia}${specialName}`;
    
    _renderMemoryList('preview-memorias-list', memories);
    
    _modals.preview.classList.add('visible');
}

function closePreviewModal() {
    if (_modals.preview) {
        _modals.preview.classList.remove('visible');
    }
}

// --- EDIT MODAL ---
function openEditModal(dia, memories, allDays) {
    const isAdding = !dia;
    
    if (isAdding) {
        const today = new Date();
        const todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        _currentDay = allDays.find(d => d.id === todayId) || allDays[0];
        _currentMemories = [];
    } else {
        _currentDay = dia;
        _currentMemories = memories;
    }
    
    if (!_currentDay) {
        console.error("UI: Cannot open edit modal, _currentDay is null.");
        return;
    }

    if (!_modals.edit) {
        _modals.edit = _createEditModal(allDays);
        document.body.appendChild(_modals.edit);
    }

    resetMemoryForm();
    showModalStatus('save-status', '', false);
    showModalStatus('memoria-status', '', false);

    const daySelectionSection = _modals.edit.querySelector('#day-selection-section');
    const dayNameSection = _modals.edit.querySelector('#day-name-section');
    const daySelect = _modals.edit.querySelector('#edit-mem-day');
    const formTitle = _modals.edit.querySelector('#memory-form-title');

    if (isAdding) {
        daySelectionSection.style.display = 'block';
        dayNameSection.style.display = 'none';
        daySelect.value = _currentDay.id; 
        formTitle.textContent = "Add New Memory";
        _renderMemoryList('edit-memorias-list', []); 
    } else {
        daySelectionSection.style.display = 'none';
        dayNameSection.style.display = 'block';
        
        _modals.edit.querySelector('#edit-modal-title').textContent = `Editing: ${_currentDay.Nombre_Dia}`;
        _modals.edit.querySelector('#nombre-especial-input').value = (_currentDay.Nombre_Especial === 'Unnamed Day' ? '' : _currentDay.Nombre_Especial);
        
        formTitle.textContent = "Add/Edit Memories";
        _renderMemoryList('edit-memorias-list', _currentMemories);
    }
    
    _modals.edit.classList.add('visible');
}

function closeEditModal() {
    if (_modals.edit) {
        _modals.edit.classList.remove('visible');
    }
}

// --- STORE MODAL (Selector) ---
function openStoreModal() {
    if (!_modals.store) {
        _modals.store = _createStoreModal();
        document.body.appendChild(_modals.store);
    }
    _modals.store.classList.add('visible');
}

function closeStoreModal() {
    if (_modals.store) {
        _modals.store.classList.remove('visible');
    }
}

// --- STORE LIST MODAL (Results) ---
function openStoreListModal(title) {
    if (!_modals.storeList) {
        _modals.storeList = _createStoreListModal();
        document.body.appendChild(_modals.storeList);
    }
    
    _modals.storeList.querySelector('.modal-header h3').textContent = title;
    _modals.storeList.querySelector('#store-list-items').innerHTML = '';
    _modals.storeList.querySelector('#store-list-loading').textContent = 'Loading...';
    _modals.storeList.querySelector('#store-load-more-btn').style.display = 'none';
    
    _modals.storeList.classList.add('visible');
}

function closeStoreListModal() {
    if (_modals.storeList) {
        _modals.storeList.classList.remove('visible');
    }
}

/**
 * Fills the "Store" results list
 * @param {Array} items - Array of memories or days
 * @param {boolean} append - true to append, false to replace
 * @param {boolean} hasMore - true if more results can be loaded
 */
function updateStoreList(items, append = false, hasMore = false) {
    if (!_modals.storeList) return;
    
    const listEl = _modals.storeList.querySelector('#store-list-items');
    const loadingEl = _modals.storeList.querySelector('#store-list-loading');
    const loadMoreBtn = _modals.storeList.querySelector('#store-load-more-btn');
    
    if (!append) {
        listEl.innerHTML = ''; 
    }
    
    if (items.length === 0 && !append) {
        loadingEl.textContent = 'No results found.';
    } else {
        loadingEl.textContent = '';
    }
    
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
        fragment.appendChild(_createStoreListItem(item));
    });
    listEl.appendChild(fragment);
    
    loadMoreBtn.style.display = hasMore ? 'block' : 'none';
}


// --- SEARCH MODAL (New) ---
/**
 * Opens the search modal.
 */
function openSearchModal() {
    if (!_modals.search) {
        _modals.search = _createSearchModal();
        document.body.appendChild(_modals.search);
    }
    
    const input = _modals.search.querySelector('#search-input');
    const status = _modals.search.querySelector('#search-status');
    const btn = _modals.search.querySelector('#search-submit-btn');
    
    input.value = '';
    status.textContent = '';
    btn.disabled = false;
    btn.textContent = 'Search';
    
    _modals.search.classList.add('visible');
    setTimeout(() => input.focus(), 100); 
}

function closeSearchModal() {
    if (_modals.search) {
        _modals.search.classList.remove('visible');
    }
}

// --- Modal Utilities ---

/**
 * Shows a status message inside the active modal.
 * @param {string} elId - 'save-status' or 'memoria-status'
 * @param {string} message - The message to show
 * @param {boolean} isError - true if it's an error
 */
function showModalStatus(elId, message, isError) {
    const modal = _modals.edit; 
    if (!modal) return;
    
    const statusEl = modal.querySelector(`#${elId}`);
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = 'modal-status';
    if (isError) {
        statusEl.classList.add('error');
    } else {
        statusEl.classList.add('success');
    }
    
    if (!isError && message) {
        setTimeout(() => {
            if (statusEl.textContent === message) {
                statusEl.textContent = '';
                statusEl.className = 'modal-status';
            }
        }, 3000);
    }
}

/**
 * Resets the add/edit memory form.
 */
function resetMemoryForm() {
    const form = _modals.edit?.querySelector('#memory-form');
    if (!form) return;
    
    form.reset();
    _isEditingMemory = false;
    _selectedMusicTrack = null;
    _selectedPlace = null;
    
    showMusicResults([]);
    showPlaceResults([]);
    
    const saveBtn = form.querySelector('#save-memoria-btn');
    saveBtn.textContent = 'Add Memory';
    saveBtn.disabled = false;
    
    const status = form.querySelector('#image-upload-status');
    if (status) status.textContent = '';

    handleMemoryTypeChange(); 
}

/**
 * Fills the memory form for editing.
 * @param {Object} memoria - The memory object to edit.
 */
function fillFormForEdit(memoria) {
    if (!_modals.edit) return;

    _isEditingMemory = true;
    const form = _modals.edit.querySelector('#memory-form');
    
    form.querySelector('#memoria-type').value = memoria.Tipo || 'Text';
    if (memoria.Fecha_Original?.toDate) {
        try {
            form.querySelector('#memoria-fecha').value = memoria.Fecha_Original.toDate().toISOString().split('T')[0];
        } catch(e) { console.warn("Invalid date:", e); }
    }
    
    switch (memoria.Tipo) {
        case 'Place':
            form.querySelector('#memoria-place-search').value = memoria.LugarNombre || '';
            _selectedPlace = memoria.LugarData ? { name: memoria.LugarNombre, ...memoria.LugarData } : null;
            break;
        case 'Music':
            form.querySelector('#memoria-music-search').value = memoria.CancionInfo || '';
            _selectedMusicTrack = memoria.CancionData || null;
            break;
        case 'Image':
            form.querySelector('#memoria-image-desc').value = memoria.Descripcion || '';
            form.querySelector('#image-upload-status').textContent = memoria.ImagenURL ? 'Image saved.' : 'No image.';
            break;
        case 'Text':
        default:
            form.querySelector('#memoria-desc').value = memoria.Descripcion || '';
            break;
    }
    
    handleMemoryTypeChange(); 
    
    const saveBtn = form.querySelector('#save-memoria-btn');
    saveBtn.textContent = 'Update Memory';
    saveBtn.disabled = false;
    
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    form.querySelector('#memoria-fecha').focus();
}

/**
 * Shows/hides form inputs based on memory type.
 */
function handleMemoryTypeChange() {
    const modal = _modals.edit;
    if (!modal) return;
    
    const type = modal.querySelector('#memoria-type').value;
    
    ['Text', 'Place', 'Music', 'Image'].forEach(id => {
        const group = modal.querySelector(`#input-type-${id}`);
        if (group) group.style.display = 'none';
    });
    
    const selectedGroup = modal.querySelector(`#input-type-${type}`);
    if (selectedGroup) {
        selectedGroup.style.display = 'block';
    }
    
    if (type !== 'Music') _selectedMusicTrack = null;
    if (type !== 'Place') _selectedPlace = null;
}

// --- 4. List & Result Rendering ---

/**
 * Shows iTunes search results.
 * @param {Array} tracks - Array of iTunes tracks.
 */
function showMusicResults(tracks) {
    const resultsEl = _modals.edit?.querySelector('#itunes-results');
    if (!resultsEl) return;
    
    resultsEl.innerHTML = '';
    if (tracks.length === 0) {
        resultsEl.innerHTML = '<div class="list-placeholder" style="padding: 10px 0;">No results.</div>';
        return;
    }
    
    const fragment = document.createDocumentFragment();
    tracks.forEach(track => {
        const trackEl = document.createElement('div');
        trackEl.className = 'itunes-track';
        
        const artwork = track.artworkUrl60 || track.artworkUrl100 || '';
        trackEl.innerHTML = `
            <img src="${artwork}" class="itunes-artwork" style="${artwork ? '' : 'display:none;'}">
            <div class="itunes-track-info">
                <div class="itunes-track-name">${track.trackName}</div>
                <div class="itunes-track-artist">${track.artistName}</div>
            </div>
        `;
        
        trackEl.onclick = () => {
            _selectedMusicTrack = track;
            _modals.edit.querySelector('#memoria-music-search').value = `${track.trackName} - ${track.artistName}`;
            resultsEl.innerHTML = '';
            resultsEl.appendChild(trackEl); 
            trackEl.classList.add('selected');
        };
        
        fragment.appendChild(trackEl);
    });
    resultsEl.appendChild(fragment);
}

/**
 * Shows Nominatim (place) search results.
 * @param {Array} places - Array of places.
 */
function showPlaceResults(places) {
    const resultsEl = _modals.edit?.querySelector('#place-results');
    if (!resultsEl) return;

    resultsEl.innerHTML = '';
    if (places.length === 0) {
        resultsEl.innerHTML = '<div class="list-placeholder" style="padding: 10px 0;">No results.</div>';
        return;
    }

    const fragment = document.createDocumentFragment();
    places.forEach(place => {
        const placeEl = document.createElement('div');
        placeEl.className = 'place-result';
        placeEl.textContent = place.display_name;
        
        placeEl.onclick = () => {
            _selectedPlace = {
                name: place.display_name,
                lat: place.lat,
                lon: place.lon,
                osm_id: place.osm_id,
                osm_type: place.osm_type
            };
            _modals.edit.querySelector('#memoria-place-search').value = place.display_name;
            resultsEl.innerHTML = '';
            resultsEl.appendChild(placeEl); 
            placeEl.classList.add('selected');
        };
        
        fragment.appendChild(placeEl);
    });
    resultsEl.appendChild(fragment);
}

/**
 * (Private) Renders the memory list in a modal.
 * @param {string} listId - ID of the <div> element to render into.
 * @param {Array} memories - Array of memory objects.
 */
function _renderMemoryList(listId, memories) {
    const listEl = document.getElementById(listId);
    if (!listEl) return;
    
    listEl.innerHTML = '';
    
    if (memories.length === 0) {
        listEl.innerHTML = '<div class="list-placeholder">No memories for this day.</div>';
        return;
    }
    
    const fragment = document.createDocumentFragment();
    memories.forEach(mem => {
        const mode = (listId === 'edit-memorias-list') ? 'edit' : 'preview';
        fragment.appendChild(_createMemoryItemHTML(mem, mode));
    });
    listEl.appendChild(fragment);
}


// --- 5. HTML Builders (Private) ---

/**
 * (Private) Connects navigation events (Prev/Next Month).
 */
function _setupNavigation() {
    _dom.navPrev.onclick = () => _callbacks.onMonthChange('prev');
    _dom.navNext.onclick = () => _callbacks.onMonthChange('next');
}

/**
 * (Private) Connects footer events.
 */
function _setupFooter() {
    _dom.footer.addEventListener('click', (e) => {
        const btn = e.target.closest('.dock-button');
        if (!btn) return;
        
        const action = btn.dataset.action;
        if (!action) return;
        
        if (action === 'search') {
            openSearchModal(); // Open modal directly
        } else {
            // Other actions are handled by main.js
            _callbacks.onFooterAction(action);
        }
    });
}

/**
 * (Private) Creates HTML for a memory item.
 * @param {Object} mem - The memory object.
 * @param {string} mode - 'preview', 'edit', or 'spotlight'
 * @returns {HTMLElement}
 */
function _createMemoryItemHTML(mem, mode = 'preview') {
    const itemEl = document.createElement('div');
    itemEl.className = (mode === 'spotlight') ? 'spotlight-memory-item' : 'memoria-item';
    
    let icon = 'article';
    let content = mem.Descripcion || 'Text memory';
    let artwork = '';
    
    switch (mem.Tipo) {
        case 'Place':
            icon = 'place';
            content = mem.LugarNombre || 'Place';
            break;
        case 'Music':
            icon = 'music_note';
            if (mem.CancionData) {
                content = `<strong>${mem.CancionData.trackName}</strong><br><small style="font-weight:normal;color:#555;">${mem.CancionData.artistName}</small>`;
                if (mem.CancionData.artworkUrl60 && mode !== 'spotlight') {
                    // Note: 'memoria' is not defined, should be 'mem'
                    artwork = `<img src="${mem.CancionData.artworkUrl60}" class="memoria-artwork">`;
                }
            } else {
                content = mem.CancionInfo || 'Music';
            }
            break;
        case 'Image':
            icon = 'image';
            content = mem.Descripcion || 'Image';
            if (mem.ImagenURL) {
                content += ` <a href="${mem.ImagenURL}" target="_blank" onclick="event.stopPropagation();">(View)</a>`;
            }
            break;
        case 'Text':
            // Already set
            break;
    }
    
    // Spotlight content (simpler)
    if (mode === 'spotlight') {
        let fechaStr = '';
        if (mem.Fecha_Original?.toDate) {
            fechaStr = mem.Fecha_Original.toDate().toLocaleDateString('en-US', { year: 'numeric' });
        }
        itemEl.innerHTML = `
            <span class="material-icons-outlined">${icon}</span>
            <div class="spotlight-memory-content">
                <small>${fechaStr} - ${mem.Tipo}</small>
                <span>${(mem.Tipo === 'Music' && mem.CancionData) ? mem.CancionData.trackName : (mem.LugarNombre || mem.Descripcion || mem.CancionInfo)}</span>
            </div>
        `;
        // Click on spotlight item opens the day
        itemEl.onclick = () => _callbacks.onStoreItemClick(mem.diaId);
        return itemEl;
    }

    // Preview/Edit content (more detailed)
    let fechaStr = 'Unknown date';
    if (mem.Fecha_Original?.toDate) {
        fechaStr = mem.Fecha_Original.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    
    const contentHTML = `
        ${artwork}
        <div class="memoria-item-content">
            <small>${fechaStr}</small>
            <span class="material-icons-outlined">${icon}</span>
            ${content}
        </div>
    `;
    
    const actionsHTML = (mode === 'edit') ? `
        <div class="memoria-actions">
            <button class="edit-btn" title="Edit" data-memoria-id="${mem.id}">
                <span class="material-icons-outlined">edit</span>
            </button>
            <button class="delete-btn" title="Delete" data-memoria-id="${mem.id}">
                <span class="material-icons-outlined">delete</span>
            </button>
        </div>
    ` : '';
    
    itemEl.innerHTML = contentHTML + actionsHTML;
    return itemEl;
}

/**
 * (Private) Creates HTML for a "Store" list item.
 * @param {Object} item - Memory or day object.
 * @returns {HTMLElement}
 */
function _createStoreListItem(item) {
    const itemEl = document.createElement('div');
    itemEl.className = 'store-list-item';
    itemEl.onclick = () => _callbacks.onStoreItemClick(item.diaId);
    
    let icon = 'article';
    let title = '...';
    let subtitle = '';
    
    if (item.type === 'Names') {
        icon = 'label';
        title = item.Nombre_Especial;
        subtitle = item.Nombre_Dia;
    } else {
        subtitle = item.Fecha_Original?.toDate ? item.Fecha_Original.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'No date';
        
        switch (item.Tipo) {
            case 'Place':
                icon = 'place';
                title = item.LugarNombre;
                break;
            case 'Music':
                icon = 'music_note';
                title = item.CancionData ? item.CancionData.trackName : item.CancionInfo;
                if (item.CancionData) subtitle += ` - ${item.CancionData.artistName}`;
                break;
            case 'Image':
                icon = 'image';
                title = item.Descripcion || 'Image';
                break;
            default: // Text
                icon = 'article';
                title = item.Descripcion || 'Note';
                break;
        }
    }
    
    // Sanitize title to prevent HTML injection
    const tempDiv = document.createElement('div');
    tempDiv.textContent = title;
    const safeTitle = tempDiv.innerHTML;

    itemEl.innerHTML = `
        <span class="material-icons-outlined">${icon}</span>
        <div class="store-list-item-content">
            <small>${subtitle}</small>
            <span>${safeTitle}</span>
        </div>
    `;
    return itemEl;
}

/**
 * (Private) Creates the HTML for the main loader.
 * @returns {HTMLElement}
 */
function _createMainLoader() {
    const loader = document.createElement('div');
    loader.id = 'main-loader';
    loader.innerHTML = `<span>Loading...</span>`;
    return loader;
}


// --- 6. Modal Builders (Private) ---

function _createPreviewModal() {
    const modal = document.createElement('div');
    modal.id = 'preview-modal';
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3></h3>
                <button class="modal-close-btn" title="Edit Day">
                    <span class="material-icons-outlined">edit</span>
                </button>
            </div>
            <div class="modal-content-scrollable">
                <div class="modal-section">
                    <h4>Memories:</h4>
                    <div id="preview-memorias-list" class="list-placeholder">Loading...</div>
                </div>
            </div>
            <div class="modal-main-buttons">
                <button class="modal-cancel-btn">Close</button>
            </div>
        </div>
    `;
    
    // Events
    modal.querySelector('.modal-cancel-btn').onclick = () => closePreviewModal();
    modal.querySelector('.modal-close-btn').onclick = () => {
        // On "Edit" click, close this and open edit modal
        if (_currentDay) {
            closePreviewModal();
            setTimeout(() => {
                // main.js will pass allDays
                _callbacks.onDayClick(_currentDay); // Re-trigger day click logic
            }, 200);
        }
    };
    modal.onclick = (e) => {
        if (e.target.id === 'preview-modal') closePreviewModal();
    };
    
    return modal;
}

function _createEditModal(allDays) {
    const modal = document.createElement('div');
    modal.id = 'edit-modal';
    modal.className = 'modal-overlay';
    
    const dayOptions = allDays.map(d => `<option value="${d.id}">${d.Nombre_Dia}</option>`).join('');
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="edit-modal-title">Edit Day</h3>
                <button class="modal-close-btn" title="Close">
                    <span class="material-icons-outlined">close</span>
                </button>
            </div>
            
            <div class="modal-content-scrollable">
                
                <!-- Day Selection Section (Add mode only) -->
                <div class="modal-section" id="day-selection-section" style="display: none;">
                    <label for="edit-mem-day">Add memory to:</label>
                    <select id="edit-mem-day">${dayOptions}</select>
                </div>
                
                <!-- Day Name Section (Edit mode only) -->
                <div class="modal-section" id="day-name-section">
                    <label for="nombre-especial-input">Name this day:</label>
                    <input type="text" id="nombre-especial-input" placeholder="e.g., Pizza Day" maxlength="30">
                    <button id="save-name-btn" class="aqua-button">Save Name</button>
                    <p id="save-status" class="modal-status"></p>
                </div>
                
                <!-- Memories Section (always visible) -->
                <div class="modal-section memorias-section">
                    <h4>Memories</h4>
                    <div id="edit-memorias-list"><div class="list-placeholder">Loading...</div></div>
                    
                    <!-- Add/Edit Memory Form -->
                    <form id="memory-form" style="margin-top: 20px;">
                        <h5 id="memory-form-title">Add/Edit Memory</h5>
                        
                        <label for="memoria-fecha">Original Date:</label>
                        <input type="date" id="memoria-fecha" required>
                        
                        <label for="memoria-type">Type:</label>
                        <select id="memoria-type">
                            <option value="Text">Note</option>
                            <option value="Place">Place</option>
                            <option value="Music">Song</option>
                            <option value="Image">Photo</option>
                        </select>
                        
                        <!-- Dynamic Inputs -->
                        <div class="add-memory-input-group" id="input-type-Text">
                            <label for="memoria-desc">Description:</label>
                            <textarea id="memoria-desc" placeholder="Write your memory..."></textarea>
                        </div>
                        
                        <div class="add-memory-input-group" id="input-type-Place">
                            <label for="memoria-place-search">Search Place:</label>
                            <input type="text" id="memoria-place-search" placeholder="e.g., Eiffel Tower, Paris">
                            <button type="button" id="btn-search-place" class="aqua-button">Search Place</button>
                            <div id="place-results"></div>
                        </div>
                        
                        <div class="add-memory-input-group" id="input-type-Music">
                            <label for="memoria-music-search">Search Song:</label>
                            <input type="text" id="memoria-music-search" placeholder="e.g., Bohemian Rhapsody, Queen">
                            <button type="button" id="btn-search-itunes" class="aqua-button">Search Song</button>
                            <div id="itunes-results"></div>
                        </div>
                        
                        <div class="add-memory-input-group" id="input-type-Image">
                            <label for="memoria-image-upload">Upload Photo:</label>
                            <input type="file" id="memoria-image-upload" accept="image/*">
                            <p id="image-upload-status" style="font-size: 12px; color: #555; margin: 0;"></p>
                            
                            <label for="memoria-image-desc">Description (optional):</label>
                            <input type="text" id="memoria-image-desc" placeholder="Photo description">
                        </div>
                        
                        <button type="submit" id="save-memoria-btn" class="aqua-button">Add Memory</button>
                        <p id="memoria-status" class="modal-status"></p>
                    </form>
                </div>

            </div> <!-- end .modal-content-scrollable -->
            
            <div class="modal-main-buttons">
                <button class="modal-cancel-btn">Close</button>
            </div>
            
            <!-- Delete confirmation dialog (moved here) -->
            <div id="confirm-delete-dialog" style="display: none;">
                <p id="confirm-delete-text">Are you sure you want to delete this?</p>
                <button id="confirm-delete-no" class="aqua-button">Cancel</button>
                <button id="confirm-delete-yes" class="aqua-button">Delete</button>
            </div>
        </div>
    `;
    
    _bindEditModalEvents(modal);
    
    return modal;
}

/**
 * (Private) Binds all events for the edit modal.
 * @param {HTMLElement} modal - The modal element.
 */
function _bindEditModalEvents(modal) {
    modal.querySelector('.modal-close-btn').onclick = () => closeEditModal();
    modal.querySelector('.modal-main-buttons .modal-cancel-btn').onclick = () => closeEditModal();
    modal.onclick = (e) => {
        if (e.target.id === 'edit-modal') closeEditModal();
    };
    
    modal.querySelector('#save-name-btn').onclick = () => {
        const newName = modal.querySelector('#nombre-especial-input').value;
        _callbacks.onSaveDayName(_currentDay.id, newName);
    };
    
    modal.querySelector('#memoria-type').onchange = () => handleMemoryTypeChange();
    
    modal.querySelector('#btn-search-itunes').onclick = () => {
        const term = modal.querySelector('#memoria-music-search').value;
        if (term.trim()) _callbacks.onSearchMusic(term.trim());
    };
    modal.querySelector('#btn-search-place').onclick = () => {
        const term = modal.querySelector('#memoria-place-search').value;
        if (term.trim()) _callbacks.onSearchPlace(term.trim());
    };
    
    // Memory Form Submit
    modal.querySelector('#memory-form').onsubmit = (e) => {
        e.preventDefault();
        
        const saveBtn = e.target.querySelector('#save-memoria-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        const type = modal.querySelector('#memoria-type').value;
        const diaSelect = modal.querySelector('#edit-mem-day');
        
        const diaId = (diaSelect.parentElement.style.display === 'none') ? _currentDay.id : diaSelect.value;
        
        const memoryData = {
            id: _isEditingMemory ? _currentMemories.find(m => m.id === _isEditingMemory.id)?.id : null,
            Fecha_Original: modal.querySelector('#memoria-fecha').value,
            Tipo: type
        };
        
        switch (type) {
            case 'Text':
                memoryData.Descripcion = modal.querySelector('#memoria-desc').value.trim();
                break;
            case 'Place':
                memoryData.LugarNombre = modal.querySelector('#memoria-place-search').value.trim();
                memoryData.LugarData = _selectedPlace ? { lat: _selectedPlace.lat, lon: _selectedPlace.lon, osm_id: _selectedPlace.osm_id, osm_type: _selectedPlace.osm_type } : null;
                break;
            case 'Music':
                memoryData.CancionInfo = modal.querySelector('#memoria-music-search').value.trim();
                memoryData.CancionData = _selectedMusicTrack ? { ..._selectedMusicTrack } : null;
                break;
            case 'Image':
                memoryData.Descripcion = modal.querySelector('#memoria-image-desc').value.trim();
                const fileInput = modal.querySelector('#memoria-image-upload');
                if (fileInput.files && fileInput.files[0]) {
                    memoryData.file = fileInput.files[0];
                    memoryData.ImagenURL = 'uploading...'; 
                }
                break;
        }
        
        _callbacks.onSaveMemory(diaId, memoryData, _isEditingMemory);
    };
    
    // Event delegation for memory list (Edit/Delete)
    modal.querySelector('#edit-memorias-list').addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        
        if (editBtn) {
            const memId = editBtn.dataset.memoriaId;
            const memoria = _currentMemories.find(m => m.id === memId);
            if (memoria) {
                fillFormForEdit(memoria);
            }
        }
        
        if (deleteBtn) {
            const memId = deleteBtn.dataset.memoriaId;
            const memoria = _currentMemories.find(m => m.id === memId);
            if (memoria) {
                _showConfirmDelete(memoria);
            }
        }
    });
    
    // Confirm Delete Dialog
    modal.querySelector('#confirm-delete-no').onclick = () => {
        modal.querySelector('#confirm-delete-dialog').style.display = 'none';
    };
}

/**
 * (Private) Shows the confirm delete dialog.
 * @param {Object} memoria - The memory to delete.
 */
function _showConfirmDelete(memoria) {
    const modal = _modals.edit;
    if (!modal) return;
    
    const dialog = modal.querySelector('#confirm-delete-dialog');
    const text = modal.querySelector('#confirm-delete-text');
    const yesBtn = modal.querySelector('#confirm-delete-yes');
    
    let desc = memoria.Descripcion || memoria.LugarNombre || memoria.CancionInfo || "this memory";
    if (desc.length > 40) desc = desc.substring(0, 40) + "...";
    
    text.textContent = `Are you sure you want to delete "${desc}"?`;
    dialog.style.display = 'block';
    
    yesBtn.onclick = () => {
        dialog.style.display = 'none';
        _callbacks.onDeleteMemory(_currentDay.id, memoria.id);
    };
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
            <div class="modal-content-scrollable">
                <!-- Category buttons added here -->
            </div>
            <div class="modal-main-buttons">
                <button class="modal-cancel-btn">Close</button>
            </div>
        </div>
    `;
    
    const scrollable = modal.querySelector('.modal-content-scrollable');
    scrollable.appendChild(_createStoreCategoryButton('Names', 'label', 'Day Names'));
    scrollable.appendChild(_createStoreCategoryButton('Place', 'place', 'Places'));
    scrollable.appendChild(_createStoreCategoryButton('Music', 'music_note', 'Songs'));
    scrollable.appendChild(_createStoreCategoryButton('Image', 'image', 'Photos'));
    scrollable.appendChild(_createStoreCategoryButton('Text', 'article', 'Notes'));
    
    // Events
    modal.querySelector('.modal-cancel-btn').onclick = () => closeStoreModal();
    modal.querySelector('.modal-close-btn').onclick = () => closeStoreModal();
    modal.onclick = (e) => {
        if (e.target.id === 'store-modal') closeStoreModal();
    };
    
    return modal;
}

function _createStoreCategoryButton(type, icon, text) {
    const btn = document.createElement('button');
    btn.className = 'store-category-btn';
    btn.dataset.type = type;
    btn.innerHTML = `
        <span class="material-icons-outlined">${icon}</span>
        ${text}
    `;
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
                <h3>Results</h3> <!-- Dynamic title -->
                <button class="modal-close-btn" title="Close">
                    <span class="material-icons-outlined">close</span>
                </button>
            </div>
            <div class="modal-content-scrollable">
                <div id="store-list-items">
                    <!-- Items go here -->
                </div>
                <div id="store-list-loading" class="list-placeholder" style="padding: 20px 0;">Loading...</div>
                <button id="store-load-more-btn" class="aqua-button" style="display: none; width: calc(100% - 70px); margin: 15px auto 15px 50px;">Load More</button>
            </div>
            <div class="modal-main-buttons">
                <button class="modal-cancel-btn">Back</button>
            </div>
        </div>
    `;
    
    // Events
    const closeBtn = () => closeStoreListModal();
    modal.querySelector('.modal-cancel-btn').onclick = closeBtn;
    modal.querySelector('.modal-close-btn').onclick = closeBtn;
    modal.onclick = (e) => {
        if (e.target.id === 'store-list-modal') closeBtn();
    };
    
    modal.querySelector('#store-load-more-btn').onclick = () => {
        _callbacks.onStoreLoadMore();
    };
    
    return modal;
}


/**
 * (Private) NEW! Creates the Search Modal
 * @returns {HTMLElement}
 */
function _createSearchModal() {
    const modal = document.createElement('div');
    modal.id = 'search-modal';
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Search Memories</h3>
                <button class="modal-close-btn" title="Close">
                    <span class="material-icons-outlined">close</span>
                </button>
            </div>
            
            <form id="search-form">
                <div class="modal-content-scrollable">
                    <div class="modal-section">
                        <label for="search-input">Search term:</label>
                        <input type="text" id="search-input" placeholder="e.g., pizza, concert...">
                        <button type="submit" id="search-submit-btn" class="aqua-button">Search</button>
                        <p id="search-status" class="modal-status"></p>
                    </div>
                </div>
            </form>
            
            <div class="modal-main-buttons">
                <button type="button" class="modal-cancel-btn">Close</button>
            </div>
        </div>
    `;
    
    // Events
    const closeBtn = () => closeSearchModal();
    modal.querySelector('.modal-cancel-btn').onclick = closeBtn;
    modal.querySelector('.modal-close-btn').onclick = closeBtn;
    modal.onclick = (e) => {
        if (e.target.id === 'search-modal') closeBtn();
    };
    
    modal.querySelector('#search-form').onsubmit = (e) => {
        e.preventDefault();
        const input = modal.querySelector('#search-input');
        const term = input.value.trim();
        
        if (term) {
            const btn = modal.querySelector('#search-submit-btn');
            btn.disabled = true;
            btn.textContent = 'Searching...';
            
            const status = modal.querySelector('#search-status');
            status.textContent = '';
            
            _callbacks.onSearchSubmit(term);
        }
    };
    
    return modal;
}


// --- 7. Module Export ---

export const ui = {
    init,
    setLoading,
    updateLoginUI,
    drawCalendar,
    updateSpotlight,
    
    // Modals
    openPreviewModal,
    closePreviewModal,
    openEditModal,
    closeEditModal,
    openStoreModal,
    closeStoreModal,
    openStoreListModal,
    closeStoreListModal,
    updateStoreList,
    openSearchModal,  
    closeSearchModal, 
    
    // Forms & Results
    showModalStatus,
    resetMemoryForm,
    handleMemoryTypeChange,
    showMusicResults,
    showPlaceResults
};

