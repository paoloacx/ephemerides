/*
 * ui.js (v7.20 - Fix Modal Creation & Close Button)
 * - Adds try/catch inside _createStoreCategoryButton.
 * - Adds try/catch around problematic appendChild in _createStoreModal.
 * - Adds logging and try/catch to _bindEditModalEvents for close button.
 * - Adds log inside closeEditModal.
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
    console.log("[ui.js] Initializing v7.20 (Modal Creation Fix)..."); // Version bump
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
            btn.onclick = () => _handleDayClick(dia);

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
    console.log("[ui.js] openPreviewModal called for day:", dia?.id);
    _currentDay = dia;
    _currentMemories = memories || [];

    if (!_modals.preview) {
        console.log("[ui.js] Creating Preview modal element...");
        _modals.preview = _createPreviewModal();
        if (!_modals.preview) {
             console.error("[ui.js] Failed to create Preview modal in openPreviewModal.");
             return;
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
}

function closePreviewModal() {
    console.log("[ui.js] Closing Preview modal (removing '.visible')...");
    if (_modals.preview) _modals.preview.classList.remove('visible');
}

function _handleEditFromPreview() { /* ... v7.8 logic ... */ }

function openEditModal(dia, memories, allDays) {
    const isAdding = !dia;
    console.log(`[ui.js] openEditModal called. Mode: ${isAdding ? 'Add' : 'Edit'}. Day ID: ${dia ? dia.id : 'N/A'}`);

    // Determine _currentDay and _currentMemories
    if (isAdding) {
        const todayId = _callbacks.getTodayId();
        const availableDays = allDays || _callbacks.getAllDaysData();
        _currentDay = availableDays.find(d => d.id === todayId) || availableDays[0];
         if (!_currentDay) {
            console.error("UI: Cannot open Add modal - no valid day data found.");
            alert("Error: Calendar data seems unavailable.");
            return;
        }
        _currentMemories = [];
        console.log(`[ui.js] Add mode - Defaulting to day ${_currentDay.id}`);
    } else {
         if (!dia || !dia.id) {
              console.error("UI: Cannot open Edit modal - invalid 'dia' object provided:", dia);
              alert("Error opening day for editing.");
              return;
         }
        _currentDay = dia;
        _currentMemories = memories || [];
    }

    // Create modal if it doesn't exist
    if (!_modals.edit) {
        console.log("[ui.js] Creating Edit modal element for the first time...");
        _modals.edit = _createEditModal(); // This function now has try/catch
        if (!_modals.edit) {
             console.error("[ui.js] FATAL: Failed to create Edit modal element in openEditModal. Aborting open.");
             alert("Error displaying editor. Please check console.");
             return; // Stop if creation failed
        }
        // Populate day select and bind events only once after creation
        _populateDaySelect(allDays || _callbacks.getAllDaysData());
        _bindEditModalEvents();
    }

    // Configure modal based on mode (ensure elements exist)
    console.log("[ui.js] Configuring Edit modal content...");
    const daySelectionSection = _modals.edit.querySelector('#day-selection-section');
    const dayNameSection = _modals.edit.querySelector('#day-name-section');
    const daySelect = _modals.edit.querySelector('#edit-mem-day');
    const yearInput = _modals.edit.querySelector('#memoria-fecha-year');
    const titleEl = _modals.edit.querySelector('#edit-modal-title');
    const nameInput = _modals.edit.querySelector('#nombre-especial-input');

    if(!daySelectionSection || !dayNameSection || !daySelect || !yearInput || !titleEl || !nameInput){
         console.error("[ui.js] ERROR: Missing essential elements inside Edit modal during configuration!");
         alert("Error setting up editor form fields.");
         return; // Stop configuration if critical elements are missing
    }

    if (isAdding) {
        daySelectionSection.style.display = 'block';
        dayNameSection.style.display = 'none';
        daySelect.value = _currentDay.id;
        yearInput.value = new Date().getFullYear();
    } else {
        daySelectionSection.style.display = 'none';
        dayNameSection.style.display = 'block';
        const displayName = _currentDay.Nombre_Dia || _currentDay.id;
        titleEl.textContent = `Editing: ${displayName} (${_currentDay.id})`;
        nameInput.value = _currentDay.Nombre_Especial === 'Unnamed Day' ? '' : _currentDay.Nombre_Especial;
    }


    _renderMemoryList('edit-memorias-list', _currentMemories);
    resetMemoryForm();
    showModalStatus('save-status', '', false);
    showModalStatus('memoria-status', '', false);

    console.log("[ui.js] Edit modal configured. Attempting to show (add '.visible')...");
    _modals.edit.classList.add('visible');
}


function closeEditModal() {
    console.log("[ui.js] Closing Edit modal (removing '.visible')...");
    if (_modals.edit) _modals.edit.classList.remove('visible');
}
function resetMemoryForm() { /* ... v7.8 logic ... */ }
function fillFormForEdit(memoria) { /* ... v7.8 logic ... */ }

function openStoreModal() {
    console.log("[ui.js] openStoreModal called.");
    if (!_modals.store) {
        console.log("[ui.js] Creating Store modal element...");
        _modals.store = _createStoreModal(); // Has try/catch now
        if (!_modals.store) {
            // Error logged in _createStoreModal
            alert("Error displaying store. Please check console.");
            return;
        }
    }
    console.log("[ui.js] Attempting to show Store modal (add '.visible')...");
    _modals.store.classList.add('visible');
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
          if (!_modals.search) {
               console.error("[ui.js] Failed to create Search modal.");
               alert("Error displaying search. Please check console.");
               return;
          }
     }
     console.log("[ui.js] Attempting to show Search modal (add '.visible')...");
     _modals.search.classList.add('visible');
     try { _modals.search.querySelector('#search-input')?.focus(); }
     catch (e) { console.warn("UI: Could not focus search input.", e); }
}
function closeSearchModal() { console.log("[ui.js] Closing Search modal."); if (_modals.search) { /*...*/ } }

function openSettingsDialog() {
    console.log("[ui.js] openSettingsDialog called.");
    if (!_modals.settings) {
         console.log("[ui.js] Creating Settings dialog element...");
        _modals.settings = _createDialog('settings-dialog', 'Settings', 'Settings is Coming Soon. Check back later!'); // Has try/catch now
         if (!_modals.settings) {
              console.error("[ui.js] Failed to create Settings dialog.");
              alert("Error displaying settings info. Please check console.");
              return;
         }
    }
    console.log("[ui.js] Attempting to show Settings dialog (add '.visible')...");
    _modals.settings.classList.add('visible');
}

// --- 5. Lógica de UI interna (Helpers) ---
async function _handleDayClick(dia) { /* ... v7.8 logic ... */ }
function _createMemoryItemHTML(memoria, context) { /* ... v7.8 logic ... */ }
function _renderMemoryList(listId, memories) { /* ... v7.8 logic ... */ }
function showModalStatus(elementId, message, isError) { /* ... v7.8 logic ... */ }
function showMusicResults(tracks) { /* ... v7.8 logic ... */ }
function showPlaceResults(places) { /* ... v7.8 logic ... */ }
function handleMemoryTypeChange() { /* ... v7.8 logic ... */ }

// --- 6. Creación de Elementos del DOM (Constructores) ---

function _createPreviewModal() {
    console.log("[ui.js] _createPreviewModal: Attempting...");
    let modal = null;
    try {
        modal = document.createElement('div');
        modal.id = 'preview-modal';
        modal.className = 'modal-overlay';
        console.log("[ui.js] _createPreviewModal: Base div created.");
        try {
            modal.innerHTML = `...`; // Same HTML as v7.19
            console.log("[ui.js] _createPreviewModal: innerHTML OK.");
        } catch (htmlError) { throw htmlError; }

        const closeBtn = modal.querySelector('.modal-close-btn');
        const editBtn = modal.querySelector('.header-edit-btn');
        if (closeBtn) { closeBtn.onclick = closePreviewModal; } else { console.warn("Preview close btn missing!"); }
        if (editBtn) { editBtn.onclick = _handleEditFromPreview; } else { console.warn("Preview edit btn missing!"); }
        modal.onclick = (e) => { if (e.target === modal) closePreviewModal(); };

        document.body.appendChild(modal);
        console.log("[ui.js] _createPreviewModal: Success.");
        return modal;
    } catch (e) {
        console.error("[ui.js] CRITICAL ERROR in _createPreviewModal:", e);
        if (modal?.parentElement) document.body.removeChild(modal);
        return null;
    }
}

function _createEditModal() {
     console.log("[ui.js] _createEditModal: Attempting...");
     let modal = null;
    try {
        modal = document.createElement('div');
        modal.id = 'edit-add-modal';
        modal.className = 'modal-overlay';
        console.log("[ui.js] _createEditModal: Base div created.");
        try {
            modal.innerHTML = `...`; // Same HTML as v7.19 (with type="button")
             console.log("[ui.js] _createEditModal: innerHTML OK.");
        } catch (htmlError) {
             console.error("[ui.js] FATAL ERROR setting innerHTML for Edit modal:", htmlError);
             throw htmlError;
        }

        document.body.appendChild(modal);
        console.log("[ui.js] _createEditModal: Success.");
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
        // --- ADDED: Log before attaching close ---
        const closeBtn = _modals.edit.querySelector('#close-edit-add-btn');
        if (closeBtn) {
            console.log("[ui.js] Attaching close event to #close-edit-add-btn...");
            closeBtn.onclick = closeEditModal; // Assign function directly
        } else {
            console.error("[ui.js] ERROR: Close button #close-edit-add-btn not found in modal!");
        }

        // ... (rest of the bindings from v7.8 logic with null checks) ...
        const saveNameBtn = _modals.edit.querySelector('#save-name-btn');
        if(saveNameBtn) saveNameBtn.onclick = () => { /* ... */ }; else console.warn("Save name btn not found");

        const typeSelect = _modals.edit.querySelector('#memoria-type');
        if(typeSelect) typeSelect.onchange = handleMemoryTypeChange; else console.warn("Type select not found");

        const placeInput = _modals.edit.querySelector('#memoria-place-search');
        if(placeInput) placeInput.onblur = (e) => { /* ... */ }; else console.warn("Place input not found");

        const musicInput = _modals.edit.querySelector('#memoria-music-search');
        if(musicInput) musicInput.onblur = (e) => { /* ... */ }; else console.warn("Music input not found");

        const memoryForm = _modals.edit.querySelector('#memory-form');
        if(memoryForm) memoryForm.onsubmit = (e) => { /* ... */ }; else console.error("Memory form not found!");

        const listDiv = _modals.edit.querySelector('#edit-memorias-list');
        if(listDiv) listDiv.addEventListener('click', (e) => { /* ... */ }); else console.warn("Memory list div not found");

        const confirmNoBtn = _modals.edit.querySelector('#confirm-delete-no');
        const confirmYesBtn = _modals.edit.querySelector('#confirm-delete-yes');
        const confirmDialog = _modals.edit.querySelector('#confirm-delete-dialog');

        if (confirmNoBtn && confirmDialog) confirmNoBtn.onclick = () => { confirmDialog.style.display = 'none'; }; else console.warn("Confirm delete 'No' button or dialog missing");
        if (confirmYesBtn && confirmDialog) confirmYesBtn.onclick = () => { /* ... */ }; else console.warn("Confirm delete 'Yes' button or dialog missing");

        console.log("[ui.js] Edit modal events bound successfully.");

    } catch (bindError) {
        console.error("[ui.js] ERROR binding events for Edit modal:", bindError);
        // Optionally, try to close the modal if it exists to prevent a broken state
        if (_modals.edit) _modals.edit.classList.remove('visible');
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
            modal.innerHTML = `...`; // Same HTML
            console.log("[ui.js] _createStoreModal: innerHTML OK.");
        } catch (htmlError) { throw htmlError; }

        const scrollableDiv = modal.querySelector('.modal-content-scrollable');
        const categories = [ /* ... */ ];
        if (scrollableDiv) {
            const fragment = document.createDocumentFragment();
            // --- ADDED: Try/Catch around category button creation ---
            try {
                categories.forEach(cat => {
                    const btn = _createStoreCategoryButton(cat.type, cat.icon, cat.label);
                    if (!btn) throw new Error(`_createStoreCategoryButton returned null for ${cat.type}`);
                    fragment.appendChild(btn);
                });
                scrollableDiv.appendChild(fragment);
                console.log("[ui.js] _createStoreModal: Categories added OK.");
            } catch (categoryError) {
                 console.error("[ui.js] ERROR adding categories in _createStoreModal:", categoryError);
                 // Optionally add error message to scrollableDiv
                 // scrollableDiv.innerHTML = "<p style='color:red;'>Error loading categories.</p>";
            }
            // --- END Try/Catch ---
        } else {
             console.error("[ui.js] _createStoreModal: Scrollable div not found!");
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
    // --- ADDED: Try/Catch ---
    try {
        const btn = document.createElement('button');
        btn.type = 'button'; // Ensure type is button
        btn.className = 'store-category-btn';
        btn.innerHTML = `<span class="material-icons-outlined">${icon}</span><span>${label}</span>`;
        btn.onclick = () => _callbacks.onStoreCategoryClick(type);
        return btn;
    } catch (e) {
         console.error(`[ui.js] ERROR in _createStoreCategoryButton for ${type}:`, e);
         return null; // Return null if it fails
    }
    // --- END Try/Catch ---
}
function _createStoreListModal() { /* ... v7.8 logic with try/catch ... */ }
function _createStoreListItem(item) { /* ... v7.8 logic ... */ }
function _createSearchModal() { /* ... v7.8 logic with try/catch ... */ }
function _createDialog(id, title, message) { /* ... v7.8 logic with try/catch ... */ }


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

