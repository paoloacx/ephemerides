/*
 * ui.js (v6.2 - Removed Main Loader)
 * User Interface (DOM) Module.
 */

// --- Internal State ---
const _dom = {
    appContent: null,
    monthNameDisplay: null,
    navPrev: null,
    navNext: null,
    footer: null,
    // REMOVED: mainLoader reference
    spotlightHeader: null,
    spotlightList: null,
};

// Modals (created on demand)
const _modals = {
    preview: null,
    edit: null,
    store: null,
    storeList: null,
    search: null,
};

// Callbacks from main.js
let _callbacks = {
    // ... (callbacks remain the same)
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
    // REMOVED: No need to find mainLoader
    _dom.spotlightHeader = document.getElementById('spotlight-date-header');
    _dom.spotlightList = document.getElementById('today-memory-spotlight');

    if (!_dom.appContent || !_dom.navPrev || !_dom.footer) {
        console.error("UI: Missing critical DOM elements (app-content, nav, footer).");
        return;
    }

    _setupNavigation();
    _setupFooter();
    
    // REMOVED: No need to create loader if not found
    
    console.log("UI: Initialized and events connected.");
}

// REMOVED: setLoading function is gone

/**
 * Updates the login UI (avatar, button)
 * @param {Object} user - Firebase user object or null.
 */
function updateLoginUI(user) {
    const loginSection = document.getElementById('login-section');
    if (!loginSection) return;

    if (user) {
        // User logged in - Avatar is clickable for logout
        loginSection.innerHTML = `
            <div id="user-info" title="Logout" style="cursor: pointer;">
                <img id="user-img" src="${user.photoURL || 'https://placehold.co/30x30/ccc/fff?text=?'}" alt="Avatar">
                <span id="user-name" style="display: none;">${user.displayName || 'User'}</span>
            </div>
        `;
        const userInfo = document.getElementById('user-info');
        if (userInfo) userInfo.onclick = () => _callbacks.onLogout();
        
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
    if (_dom.monthNameDisplay) {
        _dom.monthNameDisplay.textContent = monthName;
    }
    
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
        // Use placeholder style for consistency
        _dom.spotlightList.innerHTML = '<div class="list-placeholder">No memories for this day.</div>'; 
        return;
    }
    
    const fragment = document.createDocumentFragment();
    memories.forEach(mem => {
        fragment.appendChild(_createMemoryItemHTML(mem, 'spotlight'));
    });
    _dom.spotlightList.appendChild(fragment);
}


// --- 3. Modal Logic (Creation & Management) ---
// ... (All modal creation and management functions remain the same) ...
// openPreviewModal, closePreviewModal, 
// openEditModal, closeEditModal,
// openStoreModal, closeStoreModal,
// openStoreListModal, closeStoreListModal, updateStoreList,
// openSearchModal, closeSearchModal,

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
    // Use English day name if available
    const dayNameToDisplay = dia.Nombre_Dia || `${new Date(2024, parseInt(dia.id.substring(0,2))-1, parseInt(dia.id.substring(3))).toLocaleDateString('en-US',{month:'long', day:'numeric'})}`;
    titleEl.textContent = `${dayNameToDisplay}${specialName}`;
    
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
        // Pass allDays only once during creation
        _modals.edit = _createEditModal(allDays); 
        document.body.appendChild(_modals.edit);
    }

    // Reset form state *before* potentially filling it
    resetMemoryForm(); 
    showModalStatus('save-status', '', false);
    showModalStatus('memoria-status', '', false);

    const daySelectionSection = _modals.edit.querySelector('#day-selection-section');
    const dayNameSection = _modals.edit.querySelector('#day-name-section');
    const daySelect = _modals.edit.querySelector('#edit-mem-day');
    const formTitle = _modals.edit.querySelector('#memory-form-title');
    // Use English day name if available
    const dayNameToDisplay = _currentDay.Nombre_Dia || `${new Date(2024, parseInt(_currentDay.id.substring(0,2))-1, parseInt(_currentDay.id.substring(3))).toLocaleDateString('en-US',{month:'long', day:'numeric'})}`;


    if (isAdding) {
        daySelectionSection.style.display = 'block';
        dayNameSection.style.display = 'none';
        daySelect.value = _currentDay.id; 
        formTitle.textContent = "Add New Memory";
        _renderMemoryList('edit-memorias-list', []); 
    } else {
        daySelectionSection.style.display = 'none';
        dayNameSection.style.display = 'block';
        
        _modals.edit.querySelector('#edit-modal-title').textContent = `Editing: ${dayNameToDisplay}`;
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
    _modals.storeList.querySelector('#store-list-items').innerHTML = ''; // Clear previous items
    _modals.storeList.querySelector('#store-list-loading').textContent = 'Loading...'; // Show loading
    _modals.storeList.querySelector('#store-load-more-btn').style.display = 'none'; // Hide load more
    
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
        listEl.innerHTML = ''; // Clear only if replacing
    }
    
    if (items.length === 0 && !append && listEl.children.length === 0) { // Check if list is truly empty
        loadingEl.textContent = 'No results found.';
    } else {
        loadingEl.textContent = ''; // Clear loading/no results message
    }
    
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
        fragment.appendChild(_createStoreListItem(item));
    });
    listEl.appendChild(fragment);
    
    loadMoreBtn.style.display = hasMore ? 'block' : 'none';
    // Ensure button text is correct
    loadMoreBtn.disabled = false;
    loadMoreBtn.textContent = 'Load More';
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
    
    // Reset state every time it opens
    const input = _modals.search.querySelector('#search-input');
    const status = _modals.search.querySelector('#search-status');
    const btn = _modals.search.querySelector('#search-submit-btn');
    
    input.value = '';
    status.textContent = '';
    btn.disabled = false;
    btn.textContent = 'Search';
    
    _modals.search.classList.add('visible');
    setTimeout(() => input.focus(), 100); // Focus after transition
}

/**
 * Closes the search modal.
 */
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
    // Try to find the status element in the currently visible modal
    const visibleModal = document.querySelector('.modal-overlay.visible .modal-content');
    if (!visibleModal) return; 

    const statusEl = visibleModal.querySelector(`#${elId}`);
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = 'modal-status'; // Reset classes
    if (isError) {
        statusEl.classList.add('error');
    } else if (message) { // Only add success if there is a message
        statusEl.classList.add('success');
    }
    
    // Auto-clear success messages
    if (!isError && message) {
        setTimeout(() => {
            // Check if the message is still the same before clearing
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
    
    // Clear results lists visually
    showMusicResults([]); 
    showPlaceResults([]);
    
    const saveBtn = form.querySelector('#save-memoria-btn');
    if (saveBtn) {
        saveBtn.textContent = 'Add Memory';
        saveBtn.disabled = false;
    }
    
    const status = form.querySelector('#image-upload-status');
    if (status) status.textContent = '';

    // Ensure correct fields are shown for default type (Text)
    handleMemoryTypeChange(); 
}

/**
 * Fills the memory form for editing.
 * @param {Object} memoria - The memory object to edit.
 */
function fillFormForEdit(memoria) {
    if (!_modals.edit) return;

    _isEditingMemory = true; // Set editing flag
    const form = _modals.edit.querySelector('#memory-form');
    
    // Store the ID in a hidden way or use the flag
    // (We'll use _isEditingMemory flag + memoryData.id in submit handler)

    form.querySelector('#memoria-type').value = memoria.Tipo || 'Text';
    if (memoria.Fecha_Original?.toDate) {
        try {
            // Format YYYY-MM-DD
            form.querySelector('#memoria-fecha').value = memoria.Fecha_Original.toDate().toISOString().split('T')[0];
        } catch(e) { 
            console.warn("Invalid date in memory object:", e); 
            form.querySelector('#memoria-fecha').value = ''; // Clear if invalid
        }
    } else {
         form.querySelector('#memoria-fecha').value = ''; // Clear if missing
    }
    
    // Clear previous search results first
    showMusicResults([]);
    showPlaceResults([]);
    
    // Reset selections
    _selectedMusicTrack = null;
    _selectedPlace = null;

    // Fill fields based on type
    switch (memoria.Tipo) {
        case 'Place':
            form.querySelector('#memoria-place-search').value = memoria.LugarNombre || '';
            _selectedPlace = memoria.LugarData ? { name: memoria.LugarNombre, ...memoria.LugarData } : null;
            break;
        case 'Music':
            form.querySelector('#memoria-music-search').value = memoria.CancionInfo || '';
            _selectedMusicTrack = memoria.CancionData || null;
            // Optionally, display the selected track visually in results
            if (_selectedMusicTrack) showMusicResults([_selectedMusicTrack]);
            break;
        case 'Image':
            form.querySelector('#memoria-image-desc').value = memoria.Descripcion || '';
            form.querySelector('#image-upload-status').textContent = memoria.ImagenURL ? 'Current image saved.' : 'No image file selected.';
            break;
        case 'Text':
        default:
            form.querySelector('#memoria-desc').value = memoria.Descripcion || '';
            break;
    }
    
    handleMemoryTypeChange(); // Show correct fields
    
    const saveBtn = form.querySelector('#save-memoria-btn');
    saveBtn.textContent = 'Update Memory';
    saveBtn.disabled = false;
    
    // Scroll form into view and focus
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    // Focus the first relevant field (e.g., date)
    setTimeout(() => form.querySelector('#memoria-fecha').focus(), 150); 
}

/**
 * Shows/hides form inputs based on memory type select.
 */
function handleMemoryTypeChange() {
    const modal = _modals.edit;
    if (!modal) return;
    
    const type = modal.querySelector('#memoria-type').value;
    
    // Hide all groups first
    ['Text', 'Place', 'Music', 'Image'].forEach(id => {
        const group = modal.querySelector(`#input-type-${id}`);
        if (group) group.style.display = 'none';
    });
    
    // Show the selected one
    const selectedGroup = modal.querySelector(`#input-type-${type}`);
    if (selectedGroup) {
        selectedGroup.style.display = 'block';
    }
    
    // Clear selections if type changed away from Music/Place
    // (This prevents submitting old data if user changes type)
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
    
    resultsEl.innerHTML = ''; // Clear previous results
    if (!tracks || tracks.length === 0) {
        // Don't show "No results" if the list is meant to be empty (e.g., after selection)
        // resultsEl.innerHTML = '<div class="list-placeholder" style="padding: 10px 0;">No results.</div>';
        return;
    }
    
    const fragment = document.createDocumentFragment();
    tracks.forEach(track => {
        const trackEl = document.createElement('div');
        trackEl.className = 'itunes-track';
        // Add selected class if this track is the currently selected one
        if (_selectedMusicTrack && track.trackId === _selectedMusicTrack.trackId) {
            trackEl.classList.add('selected');
        }
        
        const artwork = track.artworkUrl60 || track.artworkUrl100 || '';
        trackEl.innerHTML = `
            <img src="${artwork}" class="itunes-artwork" style="${artwork ? '' : 'display:none;'}" alt="Artwork">
            <div class="itunes-track-info">
                <div class="itunes-track-name">${track.trackName || 'Unknown Track'}</div>
                <div class="itunes-track-artist">${track.artistName || 'Unknown Artist'}</div>
            </div>
        `;
        
        // Handle click to select
        trackEl.onclick = () => {
            _selectedMusicTrack = track;
            // Update input field
            const searchInput = _modals.edit?.querySelector('#memoria-music-search');
            if (searchInput) {
                 searchInput.value = `${track.trackName} - ${track.artistName}`;
            }
            // Visually update the list to show only the selected item
            showMusicResults([track]); 
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

    resultsEl.innerHTML = ''; // Clear previous
    if (!places || places.length === 0) {
        // Don't show "No results" if list is meant to be empty
        // resultsEl.innerHTML = '<div class="list-placeholder" style="padding: 10px 0;">No results.</div>';
        return;
    }

    const fragment = document.createDocumentFragment();
    places.forEach(place => {
        const placeEl = document.createElement('div');
        placeEl.className = 'place-result';
        // Add selected class if this place is the currently selected one
        if (_selectedPlace && place.osm_id === _selectedPlace.osm_id && place.osm_type === _selectedPlace.osm_type) {
             placeEl.classList.add('selected');
        }
        placeEl.textContent = place.display_name;
        
        // Handle click to select
        placeEl.onclick = () => {
            _selectedPlace = { // Store the selected place data
                name: place.display_name,
                lat: place.lat,
                lon: place.lon,
                osm_id: place.osm_id,
                osm_type: place.osm_type
            };
            // Update input field
            const searchInput = _modals.edit?.querySelector('#memoria-place-search');
            if(searchInput) {
                searchInput.value = place.display_name;
            }
            // Visually update the list
            showPlaceResults([place]); 
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
    // Find list element within the correct modal context
    let listEl;
    if (listId === 'preview-memorias-list' && _modals.preview) {
        listEl = _modals.preview.querySelector(`#${listId}`);
    } else if (listId === 'edit-memorias-list' && _modals.edit) {
        listEl = _modals.edit.querySelector(`#${listId}`);
    }
    
    if (!listEl) return;
    
    listEl.innerHTML = ''; // Clear previous items
    
    if (!memories || memories.length === 0) {
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
    if (_dom.navPrev) _dom.navPrev.onclick = () => _callbacks.onMonthChange('prev');
    if (_dom.navNext) _dom.navNext.onclick = () => _callbacks.onMonthChange('next');
}

/**
 * (Private) Connects footer events using event delegation.
 */
function _setupFooter() {
    if (!_dom.footer) return;
    
    _dom.footer.addEventListener('click', (e) => {
        const btn = e.target.closest('.dock-button');
        if (!btn) return;
        
        const action = btn.dataset.action;
        if (!action) return;
        
        if (action === 'search') {
            openSearchModal(); // Open search modal directly from UI
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
    
    let icon = 'article'; // Default icon
    let content = mem.Descripcion || 'Note'; // Default content
    let artwork = '';
    
    // Determine icon and main content based on type
    switch (mem.Tipo) {
        case 'Place':
            icon = 'place';
            content = mem.LugarNombre || 'Place';
            break;
        case 'Music':
            icon = 'music_note';
            if (mem.CancionData) {
                // Use innerHTML for bolding artist
                content = `<strong>${mem.CancionData.trackName || 'Unknown Track'}</strong><br><small style="font-weight:normal;color:#555;">${mem.CancionData.artistName || 'Unknown Artist'}</small>`;
                if (mem.CancionData.artworkUrl60 && mode !== 'spotlight') {
                    artwork = `<img src="${mem.CancionData.artworkUrl60}" class="memoria-artwork" alt="Artwork">`;
                }
            } else {
                content = mem.CancionInfo || 'Song'; // Fallback to info string
            }
            break;
        case 'Image':
            icon = 'image';
            content = mem.Descripcion || 'Photo';
            if (mem.ImagenURL) {
                // Prevent click propagation when clicking the link
                content += ` <a href="${mem.ImagenURL}" target="_blank" onclick="event.stopPropagation();">(View)</a>`; 
            }
            break;
        case 'Text':
            // Defaults are already set
            break;
    }
    
    // --- Spotlight Specific Rendering ---
    if (mode === 'spotlight') {
        let fechaStr = '';
        if (mem.Fecha_Original?.toDate) {
            fechaStr = mem.Fecha_Original.toDate().toLocaleDateString('en-US', { year: 'numeric' });
        }
        // Simplified content for spotlight
        let spotlightContentText = mem.LugarNombre || mem.Descripcion || mem.CancionInfo;
        if (mem.Tipo === 'Music' && mem.CancionData) {
            spotlightContentText = mem.CancionData.trackName;
        }

        itemEl.innerHTML = `
            <span class="material-icons-outlined">${icon}</span>
            <div class="spotlight-memory-content">
                <small>${fechaStr ? fechaStr + ' - ' : ''}${mem.Tipo}</small>
                <span>${spotlightContentText || 'Memory'}</span>
            </div>
        `;
        // Make spotlight items clickable to navigate to the day
        itemEl.onclick = () => _callbacks.onStoreItemClick(mem.diaId); 
        return itemEl;
    }

    // --- Preview/Edit Rendering ---
    let fechaStr = 'Unknown date';
    if (mem.Fecha_Original?.toDate) {
        try {
            fechaStr = mem.Fecha_Original.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        } catch (e) { console.warn("Error formatting date:", e); }
    }
    
    // Build the main content part
    const contentHTML = `
        ${artwork}
        <div class="memoria-item-content">
            <small>${fechaStr}</small>
            <div> 
              <span class="material-icons-outlined" style="font-size: 16px; margin-right: 5px; vertical-align: middle; margin-top: -2px; color: #666;">${icon}</span>
              ${content} 
            </div>
        </div>
    `;
    
    // Add actions only if in 'edit' mode
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
    
    // Determine content based on whether it's a Day or a Memory
    if (item.type === 'Names') { // It's a Day object
        icon = 'label';
        title = item.Nombre_Especial;
        subtitle = item.Nombre_Dia; // Use the English name
    } else { // It's a Memory object
        subtitle = item.Fecha_Original?.toDate 
                   ? item.Fecha_Original.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) 
                   : 'No date';
        
        switch (item.Tipo) {
            case 'Place':
                icon = 'place';
                title = item.LugarNombre || 'Unnamed Place';
                break;
            case 'Music':
                icon = 'music_note';
                title = item.CancionData ? (item.CancionData.trackName || 'Unknown Track') : (item.CancionInfo || 'Unknown Song');
                if (item.CancionData && item.CancionData.artistName) {
                    subtitle += ` - ${item.CancionData.artistName}`;
                }
                break;
            case 'Image':
                icon = 'image';
                title = item.Descripcion || 'Photo';
                break;
            default: // Text
                icon = 'article';
                title = item.Descripcion || 'Note';
                break;
        }
    }
    
    // Basic sanitization for title (prevent potential HTML issues)
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


// REMOVED: _createMainLoader function is gone

// --- 6. Modal Builders (Private) ---

// ... (Modal builder functions remain largely the same, but ensure English text) ...

function _createPreviewModal() {
    const modal = document.createElement('div');
    modal.id = 'preview-modal';
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3></h3> <!-- Title set dynamically -->
                <button class="modal-close-btn" title="Edit Day"> <!-- Changed title to "Edit Day" -->
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
    // Edit button on preview modal now directly calls onDayClick (like clicking the day again)
    modal.querySelector('.modal-close-btn').onclick = () => { 
        if (_currentDay) {
            closePreviewModal();
            // Simulate clicking the day again to potentially open edit modal
            setTimeout(() => { 
                _callbacks.onDayClick(_currentDay);
            }, 200); // Small delay for transition
        }
    };
    modal.onclick = (e) => { // Close on overlay click
        if (e.target.id === 'preview-modal') closePreviewModal();
    };
    
    return modal;
}

function _createEditModal(allDays) {
    const modal = document.createElement('div');
    modal.id = 'edit-modal';
    modal.className = 'modal-overlay';
    
    // Ensure day options use English names
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
            
            <!-- Delete confirmation dialog -->
            <div id="confirm-delete-dialog" style="display: none;">
                 <p id="confirm-delete-text">Are you sure?</p>
                 <button id="confirm-delete-no" class="aqua-button">Cancel</button>
                 <button id="confirm-delete-yes" class="aqua-button">Delete</button>
            </div>
        </div>
    `;
    
    _bindEditModalEvents(modal); // Attach all event listeners
    
    return modal;
}

/**
 * (Private) Binds all events for the edit modal.
 * @param {HTMLElement} modal - The modal element.
 */
function _bindEditModalEvents(modal) {
    // Basic close actions
    modal.querySelector('.modal-close-btn').onclick = () => closeEditModal();
    modal.querySelector('.modal-main-buttons .modal-cancel-btn').onclick = () => closeEditModal();
    modal.onclick = (e) => { // Close on overlay click
        if (e.target.id === 'edit-modal') closeEditModal();
    };
    
    // Save Day Name
    modal.querySelector('#save-name-btn').onclick = () => {
        const newName = modal.querySelector('#nombre-especial-input').value;
        if (_currentDay) { // Ensure _currentDay is set
             _callbacks.onSaveDayName(_currentDay.id, newName);
        }
    };
    
    // Type change selector
    modal.querySelector('#memoria-type').onchange = () => handleMemoryTypeChange();
    
    // API Search buttons
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
        
        // Determine the correct diaId (from select in 'Add' mode, or _currentDay in 'Edit' mode)
        const diaId = (modal.querySelector('#day-selection-section').style.display !== 'none') 
                      ? diaSelect.value 
                      : _currentDay.id;
        
        // Collect base data
        const memoryData = {
            id: _isEditingMemory ? (_currentMemories.find(m => m.id === memoria.id)?.id || null) : null, // Get ID if editing
            Fecha_Original: modal.querySelector('#memoria-fecha').value,
            Tipo: type
        };

        // Collect type-specific data
        switch (type) {
            case 'Text':
                memoryData.Descripcion = modal.querySelector('#memoria-desc').value.trim();
                break;
            case 'Place':
                memoryData.LugarNombre = modal.querySelector('#memoria-place-search').value.trim();
                // Use selectedPlace if available, otherwise clear LugarData
                memoryData.LugarData = _selectedPlace ? { lat: _selectedPlace.lat, lon: _selectedPlace.lon, osm_id: _selectedPlace.osm_id, osm_type: _selectedPlace.osm_type } : null;
                break;
            case 'Music':
                memoryData.CancionInfo = modal.querySelector('#memoria-music-search').value.trim();
                // Use selectedMusicTrack if available
                memoryData.CancionData = _selectedMusicTrack 
                    ? { trackId: _selectedMusicTrack.trackId, artistName: _selectedMusicTrack.artistName, trackName: _selectedMusicTrack.trackName, artworkUrl60: _selectedMusicTrack.artworkUrl60, trackViewUrl: _selectedMusicTrack.trackViewUrl } 
                    : null;
                 // Ensure CancionInfo is set even if only selected
                 if (_selectedMusicTrack && !memoryData.CancionInfo) {
                     memoryData.CancionInfo = `${_selectedMusicTrack.trackName} - ${_selectedMusicTrack.artistName}`;
                 }
                break;
            case 'Image':
                memoryData.Descripcion = modal.querySelector('#memoria-image-desc').value.trim();
                const fileInput = modal.querySelector('#memoria-image-upload');
                if (fileInput.files && fileInput.files[0]) {
                    memoryData.file = fileInput.files[0]; // Pass file object to main.js
                    memoryData.ImagenURL = 'uploading...'; // Placeholder
                } else if (_isEditingMemory) {
                    // Keep existing image URL if not changed during edit
                    const existingMem = _currentMemories.find(m => m.id === memoryData.id);
                    memoryData.ImagenURL = existingMem ? existingMem.ImagenURL : null;
                } else {
                    memoryData.ImagenURL = null; // No image for new memory
                }
                break;
        }
        
        // Pass data to main.js callback
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
                fillFormForEdit(memoria); // Fill form with this memory's data
            } else {
                console.error("Memory not found in _currentMemories:", memId);
            }
        }
        
        if (deleteBtn) {
            const memId = deleteBtn.dataset.memoriaId;
            const memoria = _currentMemories.find(m => m.id === memId);
            if (memoria) {
                _showConfirmDelete(memoria); // Show delete confirmation
            } else {
                 console.error("Memory not found in _currentMemories:", memId);
            }
        }
    });
    
    // Confirm Delete Dialog buttons
    modal.querySelector('#confirm-delete-no').onclick = () => {
        modal.querySelector('#confirm-delete-dialog').style.display = 'none';
    };
    // Yes button is bound in _showConfirmDelete
}

/**
 * (Private) Shows the confirm delete dialog.
 * @param {Object} memoria - The memory to delete.
 */
function _showConfirmDelete(memoria) {
    const modal = _modals.edit;
    if (!modal || !_currentDay) return; // Need _currentDay for context
    
    const dialog = modal.querySelector('#confirm-delete-dialog');
    const text = modal.querySelector('#confirm-delete-text');
    const yesBtn = modal.querySelector('#confirm-delete-yes');
    
    // Generate a short description for confirmation
    let desc = memoria.Descripcion || memoria.LugarNombre || memoria.CancionInfo || "this memory";
    if (desc.length > 40) desc = desc.substring(0, 40) + "...";
    
    text.textContent = `Are you sure you want to delete "${desc}"?`;
    dialog.style.display = 'block';
    
    // Re-bind the 'yes' button click handler every time
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
                <!-- Category buttons added dynamically -->
            </div>
            <div class="modal-main-buttons">
                <button class="modal-cancel-btn">Close</button>
            </div>
        </div>
    `;
    
    const scrollable = modal.querySelector('.modal-content-scrollable');
    // Add category buttons
    scrollable.appendChild(_createStoreCategoryButton('Names', 'label', 'Day Names'));
    scrollable.appendChild(_createStoreCategoryButton('Place', 'place', 'Places'));
    scrollable.appendChild(_createStoreCategoryButton('Music', 'music_note', 'Songs'));
    scrollable.appendChild(_createStoreCategoryButton('Image', 'image', 'Photos'));
    scrollable.appendChild(_createStoreCategoryButton('Text', 'article', 'Notes'));
    
    // Events
    const closeBtn = () => closeStoreModal();
    modal.querySelector('.modal-cancel-btn').onclick = closeBtn;
    modal.querySelector('.modal-close-btn').onclick = closeBtn;
    modal.onclick = (e) => { // Close on overlay click
        if (e.target.id === 'store-modal') closeBtn();
    };
    
    return modal;
}

// Helper to create category buttons for Store modal
function _createStoreCategoryButton(type, icon, text) {
    const btn = document.createElement('button');
    btn.className = 'store-category-btn';
    btn.dataset.type = type;
    btn.innerHTML = `
        <span class="material-icons-outlined">${icon}</span>
        ${text}
    `;
    // Attach click handler to call main.js callback
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
                <h3>Results</h3> <!-- Title set dynamically -->
                <button class="modal-close-btn" title="Close">
                    <span class="material-icons-outlined">close</span>
                </button>
            </div>
            <div class="modal-content-scrollable">
                <div id="store-list-items">
                    <!-- List items will be added here -->
                </div>
                <div id="store-list-loading" class="list-placeholder" style="padding: 20px 0;">Loading...</div>
                <button id="store-load-more-btn" class="aqua-button" style="display: none;">Load More</button>
            </div>
            <div class="modal-main-buttons">
                <button class="modal-cancel-btn">Back</button> <!-- Changed from Close -->
            </div>
        </div>
    `;
    
    // Events
    const closeBtn = () => closeStoreListModal();
    modal.querySelector('.modal-cancel-btn').onclick = closeBtn;
    modal.querySelector('.modal-close-btn').onclick = closeBtn;
    modal.onclick = (e) => { // Close on overlay click
        if (e.target.id === 'store-list-modal') closeBtn();
    };
    
    // Load More button click
    modal.querySelector('#store-load-more-btn').onclick = (e) => {
        e.target.disabled = true;
        e.target.textContent = 'Loading...';
        _callbacks.onStoreLoadMore();
    };
    
    return modal;
}


/**
 * (Private) Creates the Search Modal
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
    modal.onclick = (e) => { // Close on overlay click
        if (e.target.id === 'search-modal') closeBtn();
    };
    
    // Form submission
    modal.querySelector('#search-form').onsubmit = (e) => {
        e.preventDefault();
        const input = modal.querySelector('#search-input');
        const term = input.value.trim();
        
        if (term) {
            const btn = modal.querySelector('#search-submit-btn');
            btn.disabled = true;
            btn.textContent = 'Searching...';
            
            const status = modal.querySelector('#search-status');
            status.textContent = ''; // Clear status
            
            _callbacks.onSearchSubmit(term); // Call main.js to perform search
        }
    };
    
    return modal;
}


// --- 7. Module Export ---

export const ui = {
    init,
    // REMOVED: setLoading is no longer exported or used internally
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
    handleMemoryTypeChange, // Keep this exported as it's called by the select's onchange
    showMusicResults,
    showPlaceResults
};

