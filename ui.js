/*
 * ui.js (v6.3)
 * - Moves search trigger to header
 * - Adds "Settings" dialog
 * - Changes date input to "Year Only"
 */

// --- Estado Interno del Módulo ---
// ... (sin cambios)
const _dom = {
    appContent: null,
    monthNameDisplay: null,
    navPrev: null,
    navNext: null,
    footer: null,
    // REMOVED: mainLoader
    spotlightHeader: null,
    spotlightList: null,
};

const _modals = {
    preview: null,
    edit: null,
    store: null,
    storeList: null,
    search: null,
    settings: null, // NEW: Settings dialog
};

let _callbacks = {
    // ... (sin cambios)
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
    onStoreLoadMore: () => console.warn("onStoreLoadMore no implemented"),
    onStoreItemClick: (diaId) => console.warn("onStoreItemClick not implemented"),
    onSearchSubmit: (term) => console.warn("onSearchSubmit not implemented"),
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
    // REMOVED: _dom.mainLoader
    _dom.spotlightHeader = document.getElementById('spotlight-date-header');
    _dom.spotlightList = document.getElementById('today-memory-spotlight');

    if (!_dom.appContent || !_dom.navPrev || !_dom.footer) {
        console.error("UI: Missing critical DOM elements (app-content, nav, footer).");
        return;
    }

    // Conectar eventos estáticos
    _setupNavigation();
    _setupHeader(); // NEW: Connect header buttons
    _setupFooter();
    
    console.log("UI: Initialized and events connected.");
}

// REMOVED: setLoading function is gone.

function updateLoginUI(user) {
    // ... (sin cambios)
    const loginSection = document.getElementById('login-section');
    if (!loginSection) return;

    if (user) {
        loginSection.innerHTML = `
            <div id="user-info">
                <img id="user-img" src="${user.photoURL || 'https://placehold.co/30x30/ccc/fff?text=?'}" alt="Avatar">
                <span id="user-name">${user.displayName || 'User'}</span>
            </div>
            <button id="login-btn" class="header-icon-btn" title="Logout">
                <span class="material-icons-outlined">logout</span>
            </button>
        `;
        const logoutBtn = document.getElementById('login-btn');
        if (logoutBtn) logoutBtn.onclick = () => _callbacks.onLogout();
        
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
    // ... (sin cambios)
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
        
        btn.innerHTML = `<span class="dia-numero">${parseInt(dia.id.substring(3), 10)}</span>`;
        btn.dataset.diaId = dia.id;
        
        btn.onclick = () => _callbacks.onDayClick(dia);
        
        fragment.appendChild(btn);
    });
    
    _dom.appContent.appendChild(grid);
    console.log(`UI: Drew calendar with ${days.length} days.`);
}

function updateSpotlight(headerText, memories) {
    // ... (sin cambios)
    if (_dom.spotlightHeader) {
        _dom.spotlightHeader.textContent = headerText;
    }
    
    if (!_dom.spotlightList) return;
    
    _dom.spotlightList.innerHTML = '';
    if (memories.length === 0) {
        _dom.spotlightList.innerHTML = `<p class="list-placeholder">No memories for this day.</p>`;
        return;
    }
    
    const fragment = document.createDocumentFragment();
    memories.forEach(mem => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'spotlight-memory-item';
        
        // Asignar diaId (puede venir de la búsqueda)
        const diaId = mem.diaId;
        if (diaId) {
            itemDiv.dataset.diaId = diaId;
        }

        itemDiv.innerHTML = _createMemoryItemHTML(mem, 'spotlight');
        
        // Click listener para el Spotlight
        itemDiv.onclick = () => {
            if (diaId) {
                _callbacks.onStoreItemClick(diaId); // Reutilizar la lógica del Store
            }
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

/**
 * NEW: Connects header buttons
 */
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
            // Acciones que main.js debe manejar
            if (action === 'add' || action === 'store' || action === 'shuffle') {
                _callbacks.onFooterAction(action);
            }
            // Acciones que UI.js maneja internamente
            else if (action === 'settings') {
                openSettingsDialog(); // CHANGED: Was 'search', now 'settings'
            }
        }
    });
}

// --- 4. Creación y Manejo de Modales ---

// ... (Modal Preview sin cambios)
function openPreviewModal(dia, memories) {
    _currentDay = dia;
    _currentMemories = memories;

    if (!_modals.preview) {
        _modals.preview = _createPreviewModal();
    }
    
    const title = _modals.preview.querySelector('.modal-header h3');
    title.textContent = `${dia.Nombre_Dia} ${dia.Nombre_Especial !== 'Unnamed Day' ? `(${dia.Nombre_Especial})` : ''}`;
    
    _renderMemoryList('preview-memorias-list', memories);
    
    _modals.preview.classList.add('visible');
}
function closePreviewModal() {
    if (_modals.preview) _modals.preview.classList.remove('visible');
}

// --- Modal de Edición (Edit/Add) ---

function openEditModal(dia, memories, allDays) {
    const isAdding = !dia;
    
    if (isAdding) {
        // Modo "Añadir"
        const today = new Date();
        const todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        _currentDay = allDays.find(d => d.id === todayId) || allDays[0];
        _currentMemories = [];
    } else {
        // Modo "Editar"
        _currentDay = dia;
        _currentMemories = memories;
    }
    
    if (!_modals.edit) {
        _modals.edit = _createEditModal();
        _populateDaySelect(allDays);
        _bindEditModalEvents();
    }
    
    // Configurar el modal según el modo
    const daySelectionSection = _modals.edit.querySelector('#day-selection-section');
    const dayNameSection = _modals.edit.querySelector('#day-name-section');
    const daySelect = _modals.edit.querySelector('#edit-mem-day');
    const yearInput = _modals.edit.querySelector('#memoria-fecha-year'); // CHANGED
    const titleEl = _modals.edit.querySelector('#edit-modal-title');
    const nameInput = _modals.edit.querySelector('#nombre-especial-input');
    
    if (isAdding) {
        daySelectionSection.style.display = 'block';
        dayNameSection.style.display = 'none';
        daySelect.value = _currentDay.id;
        yearInput.value = new Date().getFullYear(); // CHANGED
    } else {
        daySelectionSection.style.display = 'none';
        dayNameSection.style.display = 'block';
        titleEl.textContent = `Editing: ${dia.Nombre_Dia} (${dia.id})`;
        nameInput.value = dia.Nombre_Especial === 'Unnamed Day' ? '' : dia.Nombre_Especial;
        // El año se rellenará si se edita una memoria
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
    document.getElementById('save-memoria-btn').textContent = 'Add Memory';
    document.getElementById('itunes-results').innerHTML = '';
    document.getElementById('place-results').innerHTML = '';
    
    handleMemoryTypeChange(); // Ocultar/mostrar campos
}

/**
 * Rellena el formulario de memoria con los datos de una memoria existente.
 * @param {Object} memoria - La memoria a editar.
 */
function fillFormForEdit(memoria) {
    if (!_modals.edit) return;
    
    _isEditingMemory = true;
    _selectedMusicTrack = null;
    _selectedPlace = null;
    
    // Buscar elementos del formulario
    const typeSelect = _modals.edit.querySelector('#memoria-type');
    const yearInput = _modals.edit.querySelector('#memoria-fecha-year'); // CHANGED
    const descTextarea = _modals.edit.querySelector('#memoria-desc');
    const placeInput = _modals.edit.querySelector('#memoria-place-search');
    const musicInput = _modals.edit.querySelector('#memoria-music-search');
    const imageDescInput = _modals.edit.querySelector('#memoria-image-desc');
    const saveButton = _modals.edit.querySelector('#save-memoria-btn');
    
    // Rellenar fecha (solo año)
    // CHANGED: Logic for year input
    if (memoria.Fecha_Original?.toDate) {
        try {
            yearInput.value = memoria.Fecha_Original.toDate().getFullYear();
        } catch (e) {
            yearInput.value = new Date().getFullYear(); // Fallback
        }
    } else {
        yearInput.value = new Date().getFullYear(); // Fallback
    }

    // Rellenar tipo y campos
    typeSelect.value = memoria.Tipo || 'Text';
    handleMemoryTypeChange();
    
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
            // TODO: Mostrar URL de imagen actual
            break;
        default: // 'Text'
            descTextarea.value = memoria.Descripcion || '';
            break;
    }
    
    saveButton.textContent = 'Update Memory';
    
    // Mover el scroll hasta el formulario
    const formTitle = _modals.edit.querySelector('#memory-form-title');
    if (formTitle) {
        formTitle.scrollIntoView({ behavior: 'smooth' });
    }
}

// ... (Modales de "Store" y "Search" sin cambios)
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
    // Limpiar lista anterior
    updateStoreList([], false, false); 
}
function closeStoreListModal() {
    if (_modals.storeList) _modals.storeList.classList.remove('visible');
}

/**
 * Actualiza la lista en el modal "Store List"
 * @param {Array} items - Array de memorias o días
 * @param {boolean} append - true para añadir, false para reemplazar
 * @param {boolean} hasMore - true si hay más items para cargar
 */
function updateStoreList(items, append = false, hasMore = false) {
    if (!_modals.storeList) return;
    
    const listDiv = _modals.storeList.querySelector('#store-list');
    const loadMoreBtn = _modals.storeList.querySelector('#store-load-more-btn');
    
    if (!append) {
        listDiv.innerHTML = ''; // Limpiar
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
    
    // Gestionar botón "Load More"
    loadMoreBtn.style.display = hasMore ? 'block' : 'none';
}

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

/**
 * NEW: Opens the "Settings" dialog.
 */
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

function _createMemoryItemHTML(memoria, context) {
    // ... (sin cambios)
    let contentHTML = '';
    let artworkHTML = '';
    let fechaStr = 'Unknown Date';
    if (memoria.Fecha_Original?.toDate) {
        try {
            fechaStr = memoria.Fecha_Original.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) { /* fallback */ }
    } else if (memoria.Fecha_Original) {
         fechaStr = memoria.Fecha_Original.toString(); // Fallback si no es toDate
    }

    contentHTML += `<small>${fechaStr}</small>`;
    
    switch (memoria.Tipo) {
        case 'Place':
            contentHTML += `<span><span class="material-icons-outlined">place</span> ${memoria.LugarNombre || 'Place'}</span>`;
            break;
        case 'Music':
            if (memoria.CancionData?.trackName) {
                contentHTML += `<span><span class="material-icons-outlined">music_note</span> <strong>${memoria.CancionData.trackName}</strong> by ${memoria.CancionData.artistName}</span>`;
                if(memoria.CancionData.artworkUrl60) {
                    artworkHTML = `<img src="${memoria.CancionData.artworkUrl60}" class="memoria-artwork">`;
                }
            } else {
                contentHTML += `<span><span class="material-icons-outlined">music_note</span> ${memoria.CancionInfo || 'Music'}</span>`;
            }
            break;
        case 'Image':
            contentHTML += `<span><span class="material-icons-outlined">image</span> ${memoria.Descripcion || 'Image'}</span>`;
            if (memoria.ImagenURL) {
                contentHTML += ` <small>(<a href="${memoria.ImagenURL}" target="_blank" rel="noopener">View Image</a>)</small>`;
            }
            break;
        case 'Text':
        default:
            contentHTML += `<span><span class="material-icons-outlined">notes</span> ${memoria.Descripcion || 'Memory'}</span>`;
            break;
    }
    
    // Botones de acción (solo para modal de edición)
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
    // ... (sin cambios)
    const listDiv = document.getElementById(listId);
    if (!listDiv) return;
    
    listDiv.innerHTML = '';
    if (memories.length === 0) {
        listDiv.innerHTML = `<p class="list-placeholder">No memories for this day.</p>`;
        return;
    }
    
    const fragment = document.createDocumentFragment();
    memories.forEach(mem => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'memoria-item';
        itemDiv.innerHTML = _createMemoryItemHTML(mem, 'edit-modal');
        fragment.appendChild(itemDiv);
    });
    listDiv.appendChild(fragment);
}

function showModalStatus(elementId, message, isError) {
    // ... (sin cambios)
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
    // ... (sin cambios)
    const resultsDiv = document.getElementById('itunes-results');
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = '';
    if (tracks.length === 0) {
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
            resultsDiv.innerHTML = ''; // Limpiar resultados
            trackDiv.classList.add('selected'); // Marcar como seleccionado
            resultsDiv.appendChild(trackDiv);
        };
        resultsDiv.appendChild(trackDiv);
    });
}

function showPlaceResults(places) {
    // ... (sin cambios)
    const resultsDiv = document.getElementById('place-results');
    if (!resultsDiv) return;

    resultsDiv.innerHTML = '';
    if (places.length === 0) {
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
            resultsDiv.innerHTML = ''; // Limpiar
            placeDiv.classList.add('selected'); // Marcar
            resultsDiv.appendChild(placeDiv);
        };
        resultsDiv.appendChild(placeDiv);
    });
}

function handleMemoryTypeChange() {
    // ... (sin cambios)
    const type = document.getElementById('memoria-type')?.value || 'Text';
    ['Text','Place','Music','Image'].forEach(id => {
        const el = document.getElementById(`input-type-${id}`);
        if (el) el.style.display = 'none';
    });
    const selectedEl = document.getElementById(`input-type-${type}`);
    if (selectedEl) selectedEl.style.display = 'block';
    
    // Limpiar selecciones si se cambia de tipo
    if (type !== 'Music') _selectedMusicTrack = null;
    if (type !== 'Place') _selectedPlace = null;
}


// --- 6. Creación de Elementos del DOM (Constructores) ---

function _createPreviewModal() {
    // ... (sin cambios)
    const modal = document.createElement('div');
    modal.id = 'preview-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
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
                <!-- TODO: Botón de editar? -->
            </div>
        </div>
    `;
    
    modal.querySelector('.modal-close-btn').onclick = closePreviewModal;
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
                
                <!-- Sección de Selección de Día (Solo modo "Añadir") -->
                <div class="modal-section" id="day-selection-section" style="display: none;">
                    <h3>Add Memory To...</h3>
                    <label for="edit-mem-day">Day (MM-DD):</label>
                    <select id="edit-mem-day"></select>
                </div>
                
                <!-- Sección de Nombre del Día (Solo modo "Editar") -->
                <div class="modal-section" id="day-name-section" style="display: none;">
                    <h3 id="edit-modal-title">Editing Day</h3>
                    <label for="nombre-especial-input">Name this day:</label>
                    <input type="text" id="nombre-especial-input" placeholder="e.g., Pizza Day" maxlength="30">
                    <button id="save-name-btn" class="aqua-button">Save Day Name</button>
                    <p id="save-status" class="modal-status"></p>
                </div>
                
                <!-- Sección de Memorias (Siempre visible) -->
                <div class="modal-section memorias-section">
                    <h4>Memories</h4>
                    <div id="edit-memorias-list"></div>
                    
                    <!-- Confirmación de Borrado (se mueve aquí) -->
                    <div id="confirm-delete-dialog" style="display: none;">
                        <p id="confirm-delete-text"></p>
                        <button id="confirm-delete-no" class="aqua-button">Cancel</button>
                        <button id="confirm-delete-yes" class="aqua-button">Delete</button>
                    </div>

                    <h5 id="memory-form-title">Add / Edit Memory</h5>
                    <form id="memory-form">
                        
                        <!-- CHANGED: Input de Fecha a Año -->
                        <label for="memoria-fecha-year">Original Year:</label>
                        <input type="number" id="memoria-fecha-year" placeholder="YYYY" min="1800" max="${new Date().getFullYear()}" required>
                        
                        <label for="memoria-type">Type:</label>
                        <select id="memoria-type">
                            <option value="Text">Text</option>
                            <option value="Place">Place</option>
                            <option value="Music">Music</option>
                            <option value="Image">Image</option>
                        </select>
                        
                        <!-- Campos Dinámicos -->
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
    // ... (sin cambios)
    if (!_modals.edit) return;

    // Botón de cerrar
    _modals.edit.querySelector('#close-edit-add-btn').onclick = closeEditModal;
    
    // Botón de guardar nombre del día
    _modals.edit.querySelector('#save-name-btn').onclick = () => {
        const newName = _modals.edit.querySelector('#nombre-especial-input').value;
        if (_currentDay) {
            _callbacks.onSaveDayName(_currentDay.id, newName);
        }
    };
    
    // Selector de tipo de memoria
    _modals.edit.querySelector('#memoria-type').onchange = handleMemoryTypeChange;
    
    // Botones de búsqueda (API)
    // Usar 'input' para búsquedas en tiempo real? No, mejor con botón.
    // Necesitamos botones para Place y Music. Añadirlos al HTML...
    // OK, el HTML de _createEditModal no tiene botones. Los añadiremos.
    // ... (Revisión: _createEditModal no tiene botones, pero el CSS
    // no los soporta bien. Usaremos 'change' en el input de texto por ahora)
    _modals.edit.querySelector('#memoria-place-search').onchange = (e) => {
        const term = e.target.value.trim();
        if (term) _callbacks.onSearchPlace(term);
    };
    _modals.edit.querySelector('#memoria-music-search').onchange = (e) => {
        const term = e.target.value.trim();
        if (term) _callbacks.onSearchMusic(term);
    };

    // Formulario de memoria (Submit)
    _modals.edit.querySelector('#memory-form').onsubmit = (e) => {
        e.preventDefault();
        const saveBtn = _modals.edit.querySelector('#save-memoria-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        // --- CHANGED: Read year input ---
        const yearInput = _modals.edit.querySelector('#memoria-fecha-year');
        const year = yearInput.value.trim();
        const diaId = _modals.edit.querySelector('#edit-mem-day').value || _currentDay.id;

        if (!year || year.length !== 4) {
            showModalStatus('memoria-status', 'Please enter a valid 4-digit year.', true);
            saveBtn.disabled = false;
            saveBtn.textContent = _isEditingMemory ? 'Update Memory' : 'Add Memory';
            return;
        }

        // --- CHANGED: Construct full date string ---
        // El diaId es "MM-DD" (ej. "10-26")
        // Creamos la fecha "YYYY-MM-DD"
        const fechaStr = `${year}-${diaId}`;

        // Recolectar datos
        const type = _modals.edit.querySelector('#memoria-type').value;
        const memoryData = {
            id: _isEditingMemory ? _currentMemories.find(m => m.id === document.getElementById('save-memoria-btn').dataset.editingId)?.id : null,
            Fecha_Original: fechaStr, // main.js convertirá esto a Timestamp
            Tipo: type,
            Descripcion: null,
            LugarNombre: null,
            LugarData: null,
            CancionInfo: null,
            CancionData: null,
            ImagenURL: null, // TODO
            file: null
        };

        // Recolectar datos específicos del tipo
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
                // TODO: Mantener imagen existente si no se sube una nueva
                break;
        }

        // Enviar a main.js
        _callbacks.onSaveMemory(diaId, memoryData, _isEditingMemory);
    };
    
    // Delegación de eventos para botones de Editar/Borrar memoria
    const listDiv = _modals.edit.querySelector('#edit-memorias-list');
    listDiv.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        
        if (editBtn) {
            const memId = editBtn.dataset.memoriaId;
            const memToEdit = _currentMemories.find(m => m.id === memId);
            if (memToEdit) {
                // Guardar el ID que estamos editando
                document.getElementById('save-memoria-btn').dataset.editingId = memId;
                fillFormForEdit(memToEdit);
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

    // Eventos del diálogo de confirmación
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
    // ... (sin cambios)
    const dialog = _modals.edit.querySelector('#confirm-delete-dialog');
    const text = _modals.edit.querySelector('#confirm-delete-text');
    const btnYes = _modals.edit.querySelector('#confirm-delete-yes');
    
    let desc = memoria.Tipo;
    if (memoria.Descripcion) desc = memoria.Descripcion.substring(0, 30) + '...';
    else if (memoria.LugarNombre) desc = memoria.LugarNombre;
    else if (memoria.CancionInfo) desc = memoria.CancionInfo;
    
    text.textContent = `Are you sure you want to delete "${desc}"?`;
    btnYes.dataset.memId = memoria.id;
    dialog.style.display = 'block';
}

function _populateDaySelect(allDays) {
    // ... (sin cambios)
    const select = document.getElementById('edit-mem-day');
    if (!select) return;
    
    select.innerHTML = '';
    const fragment = document.createDocumentFragment();
    allDays.forEach(dia => {
        const option = document.createElement('option');
        option.value = dia.id; // "MM-DD"
        option.textContent = dia.Nombre_Dia; // "Day Month"
        fragment.appendChild(option);
    });
    select.appendChild(fragment);
}

// ... (Modales de "Store" y "Search" sin cambios)
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
            <div class="modal-content-scrollable" style="padding: 0;">
                <!-- Categorías -->
            </div>
        </div>
    `;
    
    const scrollableDiv = modal.querySelector('.modal-content-scrollable');
    
    // Añadir botones de categoría
    const categories = [
        { type: 'Names', icon: 'label', label: 'Named Days' },
        { type: 'Place', icon: 'place', label: 'Places' },
        { type: 'Music', icon: 'music_note', label: 'Music' },
        { type: 'Image', icon: 'image', label: 'Images' },
        { type: 'Text', icon: 'notes', label: 'Text Notes' },
    ];
    
    const fragment = document.createDocumentFragment();
    categories.forEach(cat => {
        const btn = _createStoreCategoryButton(cat.type, cat.icon, cat.label);
        fragment.appendChild(btn);
    });
    scrollableDiv.appendChild(fragment);

    modal.querySelector('.modal-close-btn').onclick = closeStoreModal;
    modal.onclick = (e) => {
        if (e.target.id === 'store-modal') closeStoreModal();
    };
    
    document.body.appendChild(modal);
    return modal;
}

function _createStoreCategoryButton(type, icon, label) {
    // ... (sin cambios)
    const btn = document.createElement('button');
    btn.className = 'store-category-btn';
    btn.innerHTML = `
        <span class="material-icons-outlined">${icon}</span>
        <span>${label}</span>
    `;
    btn.onclick = () => _callbacks.onStoreCategoryClick(type);
    return btn;
}

function _createStoreListModal() {
    // ... (sin cambios)
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
                <div id="store-list">
                    <p class="list-placeholder">Loading...</p>
                </div>
                <button id="store-load-more-btn" class="aqua-button" style="display: none;">
                    Load More
                </button>
            </div>
        </div>
    `;
    
    modal.querySelector('.modal-close-btn').onclick = closeStoreListModal;
    modal.onclick = (e) => {
        if (e.target.id === 'store-list-modal') closeStoreListModal();
    };
    modal.querySelector('#store-load-more-btn').onclick = () => _callbacks.onStoreLoadMore();
    
    document.body.appendChild(modal);
    return modal;
}

function _createStoreListItem(item) {
    // ... (sin cambios)
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
            case 'Place':
                icon = 'place';
                title = item.LugarNombre;
                break;
            case 'Music':
                icon = 'music_note';
                title = item.CancionInfo || 'Music Track';
                break;
            case 'Image':
                icon = 'image';
                title = item.Descripcion || 'Image';
                break;
            case 'Text':
            default:
                icon = 'notes';
                title = (item.Descripcion || 'Text Note').substring(0, 50) + '...';
                break;
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
    // ... (sin cambios)
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
    modal.onclick = (e) => {
        if (e.target.id === 'search-modal') closeSearchModal();
    };
    
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


/**
 * NEW: Creates a generic iOS-style dialog
 */
function _createDialog(id, title, message) {
    const dialogOverlay = document.createElement('div');
    dialogOverlay.id = id;
    dialogOverlay.className = 'dialog-overlay'; // Uses .dialog-overlay CSS
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
    
    // Close on overlay click
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
    openSettingsDialog, // NEW: Export settings dialog
    // REMOVED: setLoading
};

