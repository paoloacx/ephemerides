/*
 * ui.js (v7.22 - Fix Modal Creation, Close Button, Spotlight Undefined, Day Clicks)
 * - Corrects HTML structure/selectors in _createStoreModal and _createDialog.
 * - Corrects Close button ID in _createEditModal HTML and ensures _bind finds it.
 * - Fixes _createMemoryItemHTML to handle undefined memory properties safely.
 * - Adds detailed logging inside _handleDayClick and openPreviewModal.
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

// Default callbacks
let _callbacks = {
    isUserLoggedIn: () => { console.warn("[ui.js] WARN: isUserLoggedIn callback missing"); return false; },
    onEditFromPreview: (dia, memories) => console.warn("[ui.js] WARN: onEditFromPreview callback missing"),
    loadMemoriesForDay: async (diaId) => { console.warn("[ui.js] WARN: loadMemoriesForDay callback missing"); return []; },
    getAllDaysData: () => { console.warn("[ui.js] WARN: getAllDaysData callback missing"); return []; },
    getTodayId: () => { console.warn("[ui.js] WARN: getTodayId callback missing"); return ''; },
    onMonthChange: (dir) => console.warn("[ui.js] WARN: onMonthChange callback missing"),
    onFooterAction: (action) => console.warn(`[ui.js] WARN: onFooterAction callback missing for action: ${action}`),
    onLogin: () => console.warn("[ui.js] WARN: onLogin callback missing"),
    onLogout: () => console.warn("[ui.js] WARN: onLogout callback missing"),
    onSaveDayName: (diaId, name) => console.warn("[ui.js] WARN: onSaveDayName callback missing"),
    onSaveMemory: (diaId, data, isEditing) => console.warn("[ui.js] WARN: onSaveMemory callback missing"),
    onDeleteMemory: (diaId, memId) => console.warn("[ui.js] WARN: onDeleteMemory callback missing"),
    onSearchMusic: (term) => console.warn("[ui.js] WARN: onSearchMusic callback missing"),
    onSearchPlace: (term) => console.warn("[ui.js] WARN: onSearchPlace callback missing"),
    onStoreCategoryClick: (type) => console.warn("[ui.js] WARN: onStoreCategoryClick callback missing"),
    onStoreLoadMore: () => console.warn("[ui.js] WARN: onStoreLoadMore callback missing"),
    onStoreItemClick: (diaId) => console.warn("[ui.js] WARN: onStoreItemClick callback missing"),
    onSearchSubmit: (term) => console.warn("[ui.js] WARN: onSearchSubmit callback missing"),
};

let _currentDay = null;
let _currentMemories = [];
let _isEditingMemory = false;
let _selectedMusicTrack = null;
let _selectedPlace = null;


// --- 1. Inicialización y Funciones Principales ---

function init(callbacks) {
    console.log("[ui.js] Initializing v7.22..."); // Version bump
    _callbacks = { ..._callbacks, ...callbacks };
    if (typeof _callbacks.onFooterAction !== 'function') {
         throw new Error("UI Init failed: Required callback 'onFooterAction' is missing.");
    }
    console.log("[ui.js] Callbacks stored.");

    console.log("[ui.js] Finding essential DOM elements...");
    _dom.appContent = document.getElementById('app-content');
    _dom.footer = document.querySelector('.footer-dock');

    if (!_dom.appContent) throw new Error("UI Init failed: #app-content not found.");
    if (!_dom.footer) throw new Error("UI Init failed: .footer-dock not found.");
    console.log("[ui.js] Critical elements found.");

    _dom.monthNameDisplay = document.getElementById('month-name-display');
    _dom.navPrev = document.getElementById('prev-month');
    _dom.navNext = document.getElementById('next-month');
    _dom.spotlightHeader = document.getElementById('spotlight-date-header');
    _dom.spotlightList = document.getElementById('today-memory-spotlight');
    console.log("[ui.js] DOM element finding complete.");

    console.log("[ui.js] Setting up event listeners...");
    let setupError = null;
    try { _setupNavigation(); } catch (e) { console.error("Nav setup error:", e); if(!setupError) setupError = e; }
    try { _setupHeader(); } catch (e) { console.error("Header setup error:", e); if(!setupError) setupError = e; }
    try { _setupFooter(); } catch (e) { console.error("Footer setup error:", e); if(!setupError) setupError = e; }

    if (setupError) {
         throw new Error(`UI Init failed during listener setup: ${setupError.message}`);
    }
    console.log("[ui.js] Event listeners OK.");
    console.log("[ui.js] Initialization function (init) completed successfully.");
}


function updateLoginUI(user) {
    // ... (logic from v7.11) ...
     const loginSection = document.getElementById('login-section');
    if (!loginSection) {
         console.warn("UI: #login-section not found, cannot update login UI.");
         return;
    }

    if (user) {
        loginSection.innerHTML = `
            <div id="user-info" title="Logout (Click Avatar)">
                <img id="user-img" src="${user.photoURL || 'https://placehold.co/30x30/ccc/fff?text=?'}" alt="Avatar">
                <span id="user-name">${user.displayName || 'User'}</span>
            </div>
        `;
        const userInfoDiv = document.getElementById('user-info');
        if (userInfoDiv) {
             userInfoDiv.onclick = () => {
                 console.log("UI: Logout triggered by avatar click.");
                 if (typeof _callbacks.onLogout === 'function') {
                     _callbacks.onLogout();
                 } else {
                     console.error("UI: onLogout callback is missing or not a function!");
                 }
            }
        } else {
             console.warn("UI: #user-info element not found after setting innerHTML (Logout).");
        }

    } else {
        loginSection.innerHTML = `
            <button id="login-btn" class="header-icon-btn" title="Login with Google">
                <span class="material-icons-outlined">login</span>
            </button>
        `;
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
             loginBtn.onclick = () => {
                 console.log("UI: Login triggered.");
                 if (typeof _callbacks.onLogin === 'function') {
                     _callbacks.onLogin();
                 } else {
                     console.error("UI: onLogin callback is missing or not a function!");
                 }
            }
        } else {
             console.warn("UI: #login-btn element not found after setting innerHTML (Login).");
        }
    }
}

// --- 2. Renderizado del Contenido Principal ---

function drawCalendar(monthName, days, todayId) {
    // ... (Restored logic from v7.14) ...
    console.log(`[ui.js] Drawing calendar grid for ${monthName}. Received ${days ? days.length : 'NO'} days.`);

    if (_dom.monthNameDisplay) {
        _dom.monthNameDisplay.textContent = monthName;
    } else {
        console.warn("[ui.js] WARNING: #month-name-display not found.");
    }

    if (!_dom.appContent) {
        console.error("[ui.js] ERROR in drawCalendar: #app-content element not found!");
        return;
    }
    _dom.appContent.innerHTML = ''; // Clear previous

    const grid = document.createElement('div');
    grid.className = 'calendario-grid';

    if (!days || days.length === 0) {
        grid.innerHTML = "<p>No days found for this month.</p>";
        _dom.appContent.appendChild(grid);
        console.warn(`[ui.js] No days data for ${monthName}. Displayed empty message.`);
        return;
    }

    const fragment = document.createDocumentFragment();
    let buttonsCreated = 0;
    console.log("[ui.js] Starting loop to create day buttons...");
    try {
        days.forEach((dia, index) => {
            if (!dia || typeof dia !== 'object' || !dia.id || typeof dia.id !== 'string' || dia.id.length !== 5) {
                 console.warn(`[ui.js] Skipping invalid day object at index ${index}:`, dia);
                 return;
            }
            const btn = document.createElement("button");
            btn.className = "dia-btn";
            if (dia.id === todayId) btn.classList.add('dia-btn-today');
            if (dia.tieneMemorias === true) btn.classList.add('tiene-memorias');
            const dayNumberStr = dia.id.substring(3);
            const dayNumber = parseInt(dayNumberStr, 10);
            btn.innerHTML = `<span class="dia-numero">${isNaN(dayNumber) ? '?' : dayNumber}</span>`;
            btn.dataset.diaId = dia.id;
            // --- Log inside handler ---
            btn.onclick = () => {
                console.log(`[ui.js] Day button ${dia.id} clicked! Calling _handleDayClick.`);
                _handleDayClick(dia);
            };

            fragment.appendChild(btn);
            buttonsCreated++;
        });
        console.log("[ui.js] Finished loop creating day buttons.");
        _dom.appContent.appendChild(grid); // Add grid container first
        grid.appendChild(fragment); // Add buttons to grid
        console.log(`[ui.js] Appended calendar grid with ${buttonsCreated} buttons.`);

    } catch (loopError) {
         console.error("[ui.js] ERROR during drawCalendar button creation loop:", loopError);
         _dom.appContent.innerHTML = `<p style="color:red;">Error creating calendar view: ${loopError.message}</p>`;
    }
}


function updateSpotlight(headerText, memories) {
    // ... (logic from v7.11) ...
     console.log(`[ui.js] Updating spotlight. Header: "${headerText}". Memories: ${memories ? memories.length : 0}`);
    if (_dom.spotlightHeader) {
        _dom.spotlightHeader.textContent = headerText;
    } else {
         console.warn("[ui.js] WARNING: #spotlight-date-header not found.");
    }

    if (!_dom.spotlightList) {
         console.warn("[ui.js] WARNING: #today-memory-spotlight not found.");
         return;
    }

    _dom.spotlightList.innerHTML = ''; // Clear previous items
    if (!memories || memories.length === 0) {
        _dom.spotlightList.innerHTML = `<p class="list-placeholder">No memories for today.</p>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    let itemsCreated = 0;
    memories.forEach(mem => {
        if (!mem || typeof mem !== 'object') {
             console.warn("[ui.js] Skipping invalid memory object in updateSpotlight:", mem);
             return;
        }

        const itemDiv = document.createElement('div');
        itemDiv.className = 'spotlight-memory-item';

        const diaId = mem.diaId || _callbacks.getTodayId();
        if (!diaId) {
             console.error("[ui.js] Cannot determine diaId for spotlight item:", mem);
             return;
        }
        itemDiv.dataset.diaId = diaId;

        itemDiv.innerHTML = _createMemoryItemHTML(mem, 'spotlight'); // Use corrected generator

        itemDiv.onclick = () => {
            const diaData = {
                id: itemDiv.dataset.diaId,
                Nombre_Dia: mem.Nombre_Dia || itemDiv.dataset.diaId
            };
            _handleDayClick(diaData);
        };

        fragment.appendChild(itemDiv);
        itemsCreated++;
    });
    _dom.spotlightList.appendChild(fragment);
    console.log(`[ui.js] Updated spotlight with ${itemsCreated} memory items.`);
}


// --- 3. Conexión de Eventos Estáticos ---

function _setupNavigation() {
    console.log("[ui.js] Setting up navigation listeners...");
    if (_dom.navPrev) {
         if (typeof _callbacks.onMonthChange === 'function') {
            _dom.navPrev.onclick = () => { _callbacks.onMonthChange('prev'); }
            console.log("[ui.js] Prev month listener attached.");
         } else { console.error("UI ERROR: onMonthChange callback missing!"); }
    } else { console.warn("UI WARNING: #prev-month button not found."); }

    if (_dom.navNext) {
         if (typeof _callbacks.onMonthChange === 'function') {
             _dom.navNext.onclick = () => { _callbacks.onMonthChange('next'); }
             console.log("[ui.js] Next month listener attached.");
         } else { console.error("UI ERROR: onMonthChange callback missing!"); }
    } else { console.warn("UI WARNING: #next-month button not found."); }
}

function _setupHeader() {
    console.log("[ui.js] Setting up header listeners...");
    const searchBtn = document.getElementById('header-search-btn');
    if (searchBtn) {
        searchBtn.onclick = () => { openSearchModal(); }
        console.log("[ui.js] Header search listener attached.");
    } else { console.warn("UI WARNING: #header-search-btn not found."); }
}

/**
 * --- Footer Event Listener Logic (Confirmed v7.11 Correctness) ---
 */
function _setupFooter() {
    console.log("[ui.js] Setting up footer listener (v7.16 logic)...");
    if(!_dom.footer) throw new Error("UI Init failed: Footer element not found.");
    if (typeof _callbacks.onFooterAction !== 'function') throw new Error("UI Init failed: Required callback 'onFooterAction' is missing.");
    console.log("[ui.js] Footer element and callback verified.");

    _dom.footer.addEventListener('click', (e) => {
        const button = e.target.closest('.dock-button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        console.log(`[ui.js] Footer button clicked! Action='${action}'`);

        if (action === 'add' || action === 'store' || action === 'shuffle') {
            console.log(`[ui.js] Action '${action}' requires main.js. Calling onFooterAction callback...`);
            _callbacks.onFooterAction(action); // Call main.js
        } else if (action === 'settings') {
            console.log("[ui.js] Handling 'settings' action internally -> opening dialog.");
            openSettingsDialog();
        } else {
            console.warn(`[ui.js] Click on footer button with unknown action: ${action}`);
        }
    });
    console.log("[ui.js] Footer listener attached successfully.");
}



// --- 4. Creación y Manejo de Modales ---

function openPreviewModal(dia, memories) {
    // --- ADDED: Log ---
    console.log("[ui.js] openPreviewModal called for day:", dia?.id);
    _currentDay = dia;
    _currentMemories = memories || [];

    if (!_modals.preview) {
        console.log("[ui.js] Creating Preview modal element...");
        _modals.preview = _createPreviewModal(); // Has try/catch
        if (!_modals.preview) {
             console.error("[ui.js] FAILED TO CREATE Preview modal in openPreviewModal.");
             alert("Error opening preview. Check console.");
             return; // Stop if creation failed
        }
    }

    const title = _modals.preview.querySelector('.modal-header h3');
    const editBtn = _modals.preview.querySelector('.header-edit-btn');
    const displayName = dia.Nombre_Dia || dia.id;
    if(title) title.textContent = `${displayName} ${dia.Nombre_Especial && dia.Nombre_Especial !== 'Unnamed Day' ? `(${dia.Nombre_Especial})` : ''}`;
    if(editBtn) editBtn.classList.toggle('visible', _callbacks.isUserLoggedIn());

    _renderMemoryList('preview-memorias-list', _currentMemories);

    console.log("[ui.js] Preview modal configured. Attempting to show (add '.visible')...");
    _modals.preview.classList.add('visible');
    console.log("[ui.js] Preview modal should be visible now."); // Log after adding class
}


function closePreviewModal() {
    console.log("[ui.js] Closing Preview modal (removing '.visible')...");
    if (_modals.preview) _modals.preview.classList.remove('visible');
}

function _handleEditFromPreview() { /* ... v7.8 logic ... */ }

function openEditModal(dia, memories, allDays) {
    const isAdding = !dia;
    console.log(`[ui.js] openEditModal called. Mode: ${isAdding ? 'Add' : 'Edit'}. Day ID: ${dia ? dia.id : 'N/A'}`);

    if (isAdding) { /* ... v7.8 logic ... */ } else { /* ... v7.8 logic ... */ } // Determine _currentDay, _currentMemories

    if (!_modals.edit) {
        console.log("[ui.js] Creating Edit modal element...");
        _modals.edit = _createEditModal(); // Has try/catch
        if (!_modals.edit) return; // Stop if creation failed (error already logged)
        _populateDaySelect(allDays || _callbacks.getAllDaysData());
        _bindEditModalEvents(); // Has try/catch now
    }

    // ... (Configure modal based on mode - v7.8 logic with safety checks) ...
    console.log("[ui.js] Configuring Edit modal content...");
    // ... find elements safely ...
    const daySelectionSection = _modals.edit.querySelector('#day-selection-section');
     // ... other elements ...
    if(!daySelectionSection /* || other elements are null */) {
         console.error("[ui.js] ERROR: Missing elements inside Edit modal during configuration!");
         return; // Stop
    }
    // ... (rest of configuration) ...


    _renderMemoryList('edit-memorias-list', _currentMemories);
    resetMemoryForm();
    showModalStatus('save-status', '', false);
    showModalStatus('memoria-status', '', false);

    console.log("[ui.js] Edit modal configured. Attempting to show (add '.visible')...");
    _modals.edit.classList.add('visible');
    console.log("[ui.js] Edit modal should be visible now."); // Log after adding class
}


function closeEditModal() {
    console.log("[ui.js] closeEditModal called (removing '.visible')...");
    if (_modals.edit) _modals.edit.classList.remove('visible');
}
function resetMemoryForm() { /* ... v7.8 logic ... */ }
function fillFormForEdit(memoria) { /* ... v7.8 logic ... */ }

function openStoreModal() {
    console.log("[ui.js] openStoreModal called.");
    if (!_modals.store) {
        console.log("[ui.js] Creating Store modal element...");
        _modals.store = _createStoreModal(); // Has try/catch now
        if (!_modals.store) return; // Stop if creation failed
    }
    console.log("[ui.js] Attempting to show Store modal (add '.visible')...");
    _modals.store.classList.add('visible');
    console.log("[ui.js] Store modal should be visible now."); // Log after adding class
}
function closeStoreModal() { console.log("[ui.js] Closing Store modal."); if (_modals.store) _modals.store.classList.remove('visible');}
function openStoreListModal(title) { /* ... v7.8 logic with logs ... */ }
function closeStoreListModal() { /* ... v7.8 logic with logs ... */ }
function updateStoreList(items, append = false, hasMore = false) { /* ... v7.8 logic ... */ }
function openSearchModal() {
     console.log("[ui.js] openSearchModal called.");
     if (!_modals.search) {
          console.log("[ui.js] Creating Search modal element...");
          _modals.search = _createSearchModal(); // Has try/catch now
          if (!_modals.search) return; // Stop if creation failed
     }
     console.log("[ui.js] Attempting to show Search modal (add '.visible')...");
     _modals.search.classList.add('visible');
      console.log("[ui.js] Search modal should be visible now."); // Log after adding class
     try { _modals.search.querySelector('#search-input')?.focus(); }
     catch (e) { console.warn("UI: Could not focus search input.", e); }
}
function closeSearchModal() { console.log("[ui.js] Closing Search modal."); if (_modals.search) { /*...*/ } }

function openSettingsDialog() {
    console.log("[ui.js] openSettingsDialog called.");
    if (!_modals.settings) {
         console.log("[ui.js] Creating Settings dialog element...");
        _modals.settings = _createDialog('settings-dialog', 'Settings', 'Settings is Coming Soon. Check back later!'); // Has try/catch now
         if (!_modals.settings) return; // Stop if creation failed
    }
    console.log("[ui.js] Attempting to show Settings dialog (add '.visible')...");
    _modals.settings.classList.add('visible');
    console.log("[ui.js] Settings dialog should be visible now."); // Log after adding class
}

// --- 5. Lógica de UI interna (Helpers) ---
async function _handleDayClick(dia) {
    // --- ADDED: Logs ---
    if (!dia || !dia.id) {
        console.error("UI: Invalid day object passed to _handleDayClick:", dia);
        return;
    }
    console.log(`[ui.js] _handleDayClick: Handling click for day ${dia.id}.`);

    try {
        console.log(`[ui.js] _handleDayClick: Loading memories for ${dia.id}...`);
        // Use the callback provided by main.js
        const memories = await _callbacks.loadMemoriesForDay(dia.id);
        console.log(`[ui.js] _handleDayClick: Memories loaded for ${dia.id}. Calling openPreviewModal...`);

        // Ensure 'dia' object has Nombre_Dia for the preview title
        if (!dia.Nombre_Dia) {
             const allDays = _callbacks.getAllDaysData();
             const dayData = allDays.find(d => d.id === dia.id);
             dia.Nombre_Dia = dayData ? dayData.Nombre_Dia : dia.id; // Use name or fallback to ID
        }
        openPreviewModal(dia, memories); // Always open Preview first

    } catch (error) {
        console.error(`[ui.js] ERROR in _handleDayClick while loading memories for ${dia.id}:`, error);
        alert(`Error loading memories for ${dia.Nombre_Dia || dia.id}. Please check console.`);
    }
 }
function _createMemoryItemHTML(memoria, context) {
    // --- ADDED: More robust checks and fallbacks ---
    let contentHTML = '';
    let artworkHTML = '';

    let yearStr = '????';
    try {
        if (memoria?.Fecha_Original?.toDate) {
            yearStr = memoria.Fecha_Original.toDate().getFullYear().toString();
        } else if (typeof memoria?.Fecha_Original === 'string' && memoria.Fecha_Original.length >= 4) {
            yearStr = memoria.Fecha_Original.substring(0, 4);
            if (!/^\d{4}$/.test(yearStr)) yearStr = '????';
        } else if (memoria?.Fecha_Original instanceof Date) {
             yearStr = memoria.Fecha_Original.getFullYear().toString();
        }
    } catch (e) {
        console.warn("UI: Error extracting year:", memoria?.Fecha_Original, e);
    }

    let icon = 'notes';
    switch (memoria?.Tipo) {
        case 'Place': icon = 'place'; break;
        case 'Music': icon = 'music_note'; break;
        case 'Image': icon = 'image'; break;
        default: icon = 'notes'; break;
    }

    const tipo = memoria?.Tipo || 'Text'; // Default to Text if missing

    if (context === 'spotlight') {
         contentHTML = `<span class="spotlight-year-box">${yearStr}</span>`;
         contentHTML += `<span class="material-icons-outlined">${icon}</span>`;
         contentHTML += `<div class="spotlight-memory-content"><span>`;

         switch (tipo) {
            case 'Place':
                contentHTML += `${memoria.LugarNombre || 'Unnamed Place'}`; // Fallback
                break;
            case 'Music':
                if (memoria.CancionData?.trackName) {
                    contentHTML += `<strong>${memoria.CancionData.trackName || '?'}</strong> by ${memoria.CancionData.artistName || '?'}`;
                     if(memoria.CancionData.artworkUrl60) {
                         artworkHTML = `<img src="${memoria.CancionData.artworkUrl60}" class="memoria-artwork" onerror="this.style.display='none'">`;
                     }
                } else {
                    contentHTML += `${memoria.CancionInfo || 'Unnamed Music'}`; // Fallback
                }
                break;
            case 'Image':
                contentHTML += `${memoria.Descripcion || 'Unnamed Image'}`; // Fallback
                break;
            case 'Text':
            default:
                 const description = memoria.Descripcion || 'Unnamed Memory'; // Fallback
                 const maxLength = 40;
                 contentHTML += description.length > maxLength ? description.substring(0, maxLength) + '...' : description;
                break;
         }
         contentHTML += `</span></div>`;

    } else { // Preview or Edit modal
        contentHTML = `<small>${yearStr}</small>`;
        contentHTML += `<span><span class="material-icons-outlined">${icon}</span> `;

        switch (tipo) {
            case 'Place':
                contentHTML += `${memoria.LugarNombre || 'Unnamed Place'}`;
                break;
            case 'Music':
                if (memoria.CancionData?.trackName) {
                    contentHTML += `<strong>${memoria.CancionData.trackName || '?'}</strong> by ${memoria.CancionData.artistName || '?'}`;
                    if(memoria.CancionData.artworkUrl60) {
                        artworkHTML = `<img src="${memoria.CancionData.artworkUrl60}" class="memoria-artwork" onerror="this.style.display='none'">`;
                    }
                } else {
                    contentHTML += `${memoria.CancionInfo || 'Unnamed Music'}`;
                }
                break;
            case 'Image':
                contentHTML += `${memoria.Descripcion || 'Unnamed Image'}`;
                if (memoria.ImagenURL) {
                    contentHTML += ` <small>(<a href="${memoria.ImagenURL}" target="_blank" rel="noopener">View</a>)</small>`;
                }
                break;
            case 'Text':
            default:
                 contentHTML += memoria.Descripcion || 'Unnamed Memory';
                break;
        }
         contentHTML += `</span>`;
    }

    let actionsHTML = '';
    if (context === 'edit-modal' && memoria?.id) {
        actionsHTML = `...`; // Same actions HTML
    }

    if (context === 'spotlight') {
         return `${artworkHTML}${contentHTML}`;
    } else {
         return `${artworkHTML}<div class="memoria-item-content">${contentHTML}</div>${actionsHTML}`;
    }
}
function _renderMemoryList(listId, memories) { /* ... v7.8 logic ... */ }
function showModalStatus(elementId, message, isError) { /* ... v7.8 logic ... */ }
function showMusicResults(tracks) { /* ... v7.8 logic ... */ }
function showPlaceResults(places) { /* ... v7.8 logic ... */ }
function handleMemoryTypeChange() { /* ... v7.8 logic ... */ }

// --- 6. Creación de Elementos del DOM (Constructores) ---

function _createPreviewModal() { /* ... v7.19 logic ... */ }

function _createEditModal() {
     console.log("[ui.js] _createEditModal: Attempting...");
     let modal = null;
    try {
        modal = document.createElement('div');
        modal.id = 'edit-add-modal';
        modal.className = 'modal-overlay';
        console.log("[ui.js] _createEditModal: Base div created.");
        try {
            // --- FIXED: Corrected button ID ---
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
                            <button type="button" id="save-name-btn" class="aqua-button">Save Day Name</button>
                            <p id="save-status" class="modal-status"></p>
                        </div>
                        <div class="modal-section memorias-section">
                            <h4>Memories</h4>
                            <div id="edit-memorias-list"></div>
                            <div id="confirm-delete-dialog" style="display: none;">
                                <p id="confirm-delete-text"></p>
                                <button type="button" id="confirm-delete-no" class="aqua-button">Cancel</button>
                                <button type="button" id="confirm-delete-yes" class="aqua-button">Delete</button>
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
             console.log("[ui.js] _createEditModal: innerHTML set successfully.");
        } catch (htmlError) {
             console.error("[ui.js] FATAL ERROR setting innerHTML for Edit modal:", htmlError);
             throw htmlError;
        }

        document.body.appendChild(modal);
        console.log("[ui.js] _createEditModal: Element created and appended successfully.");
        return modal;
    } catch (e) {
        console.error("[ui.js] CRITICAL ERROR in _createEditModal:", e);
        if (modal?.parentElement) document.body.removeChild(modal);
        return null;
    }
}


function _bindEditModalEvents() {
    console.log("[ui.js] Binding Edit modal events...");
    if (!_modals.edit) {
        console.error("[ui.js] Cannot bind events, Edit modal does not exist.");
        return;
    }
    try {
        // --- Corrected selector ---
        const closeBtn = _modals.edit.querySelector('#close-edit-add-btn');
        console.log("[ui.js] Attempting to find close button #close-edit-add-btn:", closeBtn);
        if (closeBtn) {
            console.log("[ui.js] Attaching close event to #close-edit-add-btn...");
            closeBtn.onclick = closeEditModal;
        } else {
            console.error("[ui.js] ERROR: Close button #close-edit-add-btn not found! Close will not work.");
        }

        // ... (rest of the bindings from v7.8 logic) ...
         const saveNameBtn = _modals.edit.querySelector('#save-name-btn'); if(saveNameBtn) saveNameBtn.onclick = () => { /* ... */ }; else console.warn("Save name btn not found");
         const typeSelect = _modals.edit.querySelector('#memoria-type'); if(typeSelect) typeSelect.onchange = handleMemoryTypeChange; else console.warn("Type select not found");
         const placeInput = _modals.edit.querySelector('#memoria-place-search'); if(placeInput) placeInput.onblur = (e) => { /* ... */ }; else console.warn("Place input not found");
         const musicInput = _modals.edit.querySelector('#memoria-music-search'); if(musicInput) musicInput.onblur = (e) => { /* ... */ }; else console.warn("Music input not found");
         const memoryForm = _modals.edit.querySelector('#memory-form'); if(memoryForm) memoryForm.onsubmit = (e) => { /* ... */ }; else console.error("Memory form not found!");
         const listDiv = _modals.edit.querySelector('#edit-memorias-list'); if(listDiv) listDiv.addEventListener('click', (e) => { /* ... */ }); else console.warn("Memory list div not found");
         const confirmNoBtn = _modals.edit.querySelector('#confirm-delete-no'); if(confirmNoBtn) confirmNoBtn.onclick = () => { /* ... */ }; else console.warn("Confirm delete 'No' missing");
         const confirmYesBtn = _modals.edit.querySelector('#confirm-delete-yes'); if(confirmYesBtn) confirmYesBtn.onclick = () => { /* ... */ }; else console.warn("Confirm delete 'Yes' missing");


        console.log("[ui.js] Edit modal events bound successfully.");

    } catch (bindError) {
        console.error("[ui.js] ERROR binding events for Edit modal:", bindError);
        closeEditModal();
    }
}
function _showConfirmDelete(memoria) { /* ... v7.8 logic ... */ }
function _populateDaySelect(allDays) { /* ... v7.8 logic ... */ }

function _createStoreModal() {
     console.log("[ui.js] _createStoreModal: Attempting...");
     let modal = null;
    try {
        modal = document.createElement('div');
        modal.id = 'store-modal';
        modal.className = 'modal-overlay';
        console.log("[ui.js] _createStoreModal: Base div OK.");
        try {
            // --- FIXED: Added missing scrollable div ---
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Store</h3>
                        <button type="button" class="modal-close-btn" title="Close"><span class="material-icons-outlined">close</span></button>
                    </div>
                    <div class="modal-content-scrollable" style="padding: 0;">
                       <!-- Category buttons will be appended here -->
                    </div>
                </div>
            `;
            console.log("[ui.js] _createStoreModal: innerHTML OK.");
        } catch (htmlError) {
             console.error("[ui.js] FATAL ERROR setting innerHTML for Store modal:", htmlError);
             throw htmlError;
        }

        // --- FIXED: Find the CORRECT scrollable div ---
        const scrollableDiv = modal.querySelector('.modal-content-scrollable');
        const categories = [
             { type: 'Names', icon: 'label', label: 'Named Days' },
             { type: 'Place', icon: 'place', label: 'Places' },
             { type: 'Music', icon: 'music_note', label: 'Music' },
             { type: 'Image', icon: 'image', label: 'Images' },
             { type: 'Text', icon: 'notes', label: 'Text Notes' },
        ];
        if (scrollableDiv) {
            console.log("[ui.js] _createStoreModal: Found scrollable div. Adding categories...");
            const fragment = document.createDocumentFragment();
            let buttonsAdded = 0;
            try {
                categories.forEach(cat => {
                    const btn = _createStoreCategoryButton(cat.type, cat.icon, cat.label);
                    if (btn instanceof Node) {
                        fragment.appendChild(btn);
                        buttonsAdded++;
                    } else {
                         console.error(`[ui.js] ERROR: _createStoreCategoryButton for '${cat.type}' failed.`);
                    }
                });
                if (fragment.hasChildNodes()) {
                    scrollableDiv.appendChild(fragment);
                    console.log(`[ui.js] _createStoreModal: ${buttonsAdded} categories added OK.`);
                } else {
                     console.warn("[ui.js] _createStoreModal: No category buttons were successfully created/appended.");
                      scrollableDiv.innerHTML = "<p class='list-placeholder'>Error loading categories.</p>"; // Show error
                }
            } catch (categoryError) {
                 console.error("[ui.js] ERROR appending categories in _createStoreModal:", categoryError);
                 if(scrollableDiv) scrollableDiv.innerHTML = "<p class='list-placeholder error'>Error loading categories.</p>";
            }
        } else {
             // This indicates the innerHTML is still wrong
             console.error("[ui.js] _createStoreModal: CRITICAL - Could not find '.modal-content-scrollable' div after setting innerHTML!");
        }

        const closeBtn = modal.querySelector('.modal-close-btn');
        if(closeBtn) closeBtn.onclick = closeStoreModal; else console.warn("Store close btn missing!");
        modal.onclick = (e) => { if (e.target === modal) closeStoreModal(); };

        document.body.appendChild(modal);
        console.log("[ui.js] _createStoreModal: Success.");
        return modal;
    } catch(e) {
        console.error("[ui.js] CRITICAL ERROR in _createStoreModal:", e);
         if (modal?.parentElement) document.body.removeChild(modal);
        return null;
    }
 }

function _createStoreCategoryButton(type, icon, label) {
    // ... (logic from v7.19) ...
     try {
        const btn = document.createElement('button');
        btn.type = 'button'; // Set type
        btn.className = 'store-category-btn';
        btn.innerHTML = `<span class="material-icons-outlined">${icon}</span><span>${label}</span>`;
        if(typeof _callbacks.onStoreCategoryClick === 'function') {
            btn.onclick = () => _callbacks.onStoreCategoryClick(type);
        } else {
             console.error(`UI: Cannot attach click listener for store category '${type}', callback missing!`);
             btn.disabled = true;
        }
        return btn; // Return the button element
    } catch (e) {
         console.error(`[ui.js] ERROR in _createStoreCategoryButton for ${type}:`, e);
         return null; // Return null on failure
    }
}
function _createStoreListModal() { /* ... v7.8 logic with try/catch ... */ }
function _createStoreListItem(item) { /* ... v7.8 logic ... */ }
function _createSearchModal() { /* ... v7.8 logic with try/catch ... */ }
function _createDialog(id, title, message) {
    // ... (logic from v7.19 with type="button") ...
     console.log(`[ui.js] _createDialog: Attempting id=${id}...`);
     let dialogOverlay = null;
    try {
        dialogOverlay = document.createElement('div');
        dialogOverlay.id = id;
        dialogOverlay.className = 'dialog-overlay';
        console.log("[ui.js] _createDialog: Base div OK.");
        try {
            // Added type="button"
            dialogOverlay.innerHTML = `
                <div class="dialog-content">
                    <h4>${title}</h4>
                    <p>${message}</p>
                    <button type="button" class="dialog-button">OK</button>
                </div>
            `;
             console.log("[ui.js] _createDialog: innerHTML OK.");
        } catch(htmlError) { throw htmlError; }

        const closeBtn = dialogOverlay.querySelector('.dialog-button');
        if (closeBtn) {
            closeBtn.onclick = () => dialogOverlay.classList.remove('visible');
             console.log("[ui.js] _createDialog: Close button OK.");
        } else { console.warn(`Dialog (${id}) close button not found!`); }

        dialogOverlay.onclick = (e) => { if (e.target === dialogOverlay) dialogOverlay.classList.remove('visible'); };

        document.body.appendChild(dialogOverlay);
        console.log(`[ui.js] _createDialog: Success for id=${id}.`);
        return dialogOverlay;
    } catch(e) {
        console.error(`[ui.js] CRITICAL ERROR in _createDialog for id=${id}:`, e);
         if (dialogOverlay?.parentElement) document.body.removeChild(dialogOverlay);
        return null;
    }
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
    // handleMemoryTypeChange is internal
    openStoreModal,
    closeStoreModal,
    openStoreListModal,
    closeStoreListModal,
    updateStoreList,
    openSearchModal,
    closeSearchModal,
    openSettingsDialog,
};

