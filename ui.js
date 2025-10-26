/*
 * ui.js (v7.11 - Final Footer Fix & Stricter Init Error Handling)
 * - Makes init() throw errors if critical listener setups fail.
 * - Ensures _setupFooter reliably calls main.js callbacks.
 * - Adds even more detailed logging.
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

// Default callbacks to prevent errors if main.js doesn't provide them
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

/**
 * Initializes the UI module. Finds DOM elements, sets up static listeners.
 * Throws an error if critical elements (#appContent, .footer-dock) are missing or setup fails.
 * @param {Object} callbacks - Functions provided by main.js
 */
function init(callbacks) {
    console.log("[ui.js] Initializing v7.11..."); // Version bump
    // 1. Store Callbacks
    console.log("[ui.js] Step 1: Storing callbacks...");
    _callbacks = { ..._callbacks, ...callbacks };
     // Verify essential callbacks exist EARLY - Footer depends on this
    if (typeof _callbacks.onFooterAction !== 'function') {
         console.error("[ui.js] FATAL: Required callback 'onFooterAction' is missing or not a function! Cannot initialize Footer.");
         throw new Error("UI Init failed: Required callback 'onFooterAction' is missing.");
    }
    console.log("[ui.js] Callbacks stored.");

    // 2. Find DOM Elements with CRITICAL Error Checking
    console.log("[ui.js] Step 2: Finding essential DOM elements...");
    _dom.appContent = document.getElementById('app-content');
    _dom.footer = document.querySelector('.footer-dock'); // Footer is critical

    // --- CRITICAL CHECKS ---
    if (!_dom.appContent) {
        console.error("[ui.js] FATAL: #app-content element NOT FOUND! Aborting UI initialization.");
        throw new Error("UI Init failed: Required element #app-content not found.");
    } else {
         console.log("[ui.js] Step 2: #app-content found successfully.");
    }
    if (!_dom.footer) {
         console.error("[ui.js] FATAL: Footer element (.footer-dock) NOT FOUND! Aborting UI initialization.");
         throw new Error("UI Init failed: Required element .footer-dock not found.");
    } else {
         console.log("[ui.js] Step 2: Footer found successfully.");
    }
    // --- End Critical Checks ---

    // Find non-critical elements (warn if missing)
    _dom.monthNameDisplay = document.getElementById('month-name-display');
    _dom.navPrev = document.getElementById('prev-month');
    _dom.navNext = document.getElementById('next-month');
    _dom.spotlightHeader = document.getElementById('spotlight-date-header');
    _dom.spotlightList = document.getElementById('today-memory-spotlight');

    if (!_dom.monthNameDisplay) console.warn("[ui.js] WARNING: #month-name-display not found.");
    if (!_dom.navPrev) console.warn("[ui.js] WARNING: #prev-month button not found.");
    if (!_dom.navNext) console.warn("[ui.js] WARNING: #next-month button not found.");
    if (!_dom.spotlightHeader) console.warn("[ui.js] WARNING: #spotlight-date-header not found.");
    if (!_dom.spotlightList) console.warn("[ui.js] WARNING: #today-memory-spotlight not found.");
    console.log("[ui.js] Step 2: DOM element finding complete.");


    // 3. Setup Event Listeners with Individual Error Handling
    console.log("[ui.js] Step 3: Setting up event listeners...");
    let setupError = null; // Variable to store the first error encountered

    // Setup Navigation
    try {
        console.log("[ui.js] Step 3a: Setting up navigation listeners...");
        _setupNavigation(); // Has internal null checks, but callback check is crucial
        console.log("[ui.js] Step 3a: Navigation listeners OK.");
    } catch (navError) {
         console.error("[ui.js] ERROR setting up navigation listeners:", navError);
         if (!setupError) setupError = navError; // Store the first error
    }

    // Setup Header
    try {
        console.log("[ui.js] Step 3b: Setting up header listeners...");
        _setupHeader(); // Has internal null checks
        console.log("[ui.js] Step 3b: Header listeners OK.");
    } catch (headerError) {
         console.error("[ui.js] ERROR setting up header listeners:", headerError);
         if (!setupError) setupError = headerError;
    }

    // Setup Footer - CRITICAL FOR BUTTONS
    try {
        console.log("[ui.js] Step 3c: Setting up footer listener...");
        _setupFooter(); // Contains the DEFINITIVELY corrected logic
        console.log("[ui.js] Step 3c: Footer listener OK.");
    } catch (footerError) {
         console.error("[ui.js] ERROR setting up footer listener:", footerError);
         if (!setupError) setupError = footerError;
         // Do not re-throw here, let the final check handle it
    }

    // --- FINAL CHECK for Setup Errors ---
    if (setupError) {
         console.error("[ui.js] FATAL: One or more event listener setups failed. Throwing error to main.js.", setupError);
         // Throw the first error encountered to stop initialization
         throw new Error(`UI Init failed during event listener setup: ${setupError.message}`);
    } else {
        console.log("[ui.js] Step 3: All event listeners set up successfully.");
    }


    // 4. Final Log
    console.log("[ui.js] Initialization function (init) completed successfully."); // If we reach here, init succeeded
}


/**
 * Updates the login UI elements (avatar/button).
 * @param {object|null} user - The Firebase user object or null.
 */
function updateLoginUI(user) {
    // ... (logic from v7.5 is correct) ...
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

/**
 * Draws the calendar grid for the specified month.
 * @param {string} monthName - The name of the month (e.g., "October").
 * @param {Array<object>} days - An array of day objects for the month.
 * @param {string} todayId - The ID of the current day (e.g., "10-26").
 */
function drawCalendar(monthName, days, todayId) {
    // ... (logic from v7.5 is correct, ensure logging) ...
    console.log(`UI: Drawing calendar grid for ${monthName}. Received ${days ? days.length : 'NO'} days.`);

    if (_dom.monthNameDisplay) {
        _dom.monthNameDisplay.textContent = monthName;
    } else {
        console.warn("UI: #month-name-display not found during drawCalendar.");
    }

    if (!_dom.appContent) {
        console.error("UI ERROR in drawCalendar: #app-content element not found! Cannot draw calendar.");
        return;
    }
    _dom.appContent.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'calendario-grid';

    if (!days || days.length === 0) {
        console.warn(`UI: No valid days data provided for ${monthName}. Displaying empty message.`);
        grid.innerHTML = "<p>No days found for this month.</p>";
        _dom.appContent.appendChild(grid);
        return;
    }

    const fragment = document.createDocumentFragment();
    let buttonsCreated = 0;
    console.log("UI: Starting loop to create day buttons...");
    try {
        days.forEach((dia, index) => {
            if (!dia || typeof dia !== 'object' || !dia.id || typeof dia.id !== 'string' || dia.id.length !== 5) {
                 console.warn(`UI: Skipping invalid day object at index ${index} in drawCalendar loop:`, dia);
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
        console.log("UI: Finished loop creating day buttons.");
    } catch (loopError) {
         console.error("UI ERROR during drawCalendar button creation loop:", loopError);
         grid.innerHTML = `<p style="color:red;">Error creating calendar view: ${loopError.message}</p>`;
    }

    _dom.appContent.appendChild(grid);
    console.log(`UI: Appended calendar grid container to #app-content. ${buttonsCreated} buttons added.`);
}


/**
 * Updates the content of the "Today Spotlight" section.
 * @param {string} headerText - The text for the spotlight header.
 * @param {Array<object>} memories - An array of memory objects.
 */
function updateSpotlight(headerText, memories) {
    // ... (logic from v7.5 seems correct) ...
    console.log(`UI: Updating spotlight. Header: "${headerText}". Memories: ${memories ? memories.length : 0}`);
    if (_dom.spotlightHeader) {
        _dom.spotlightHeader.textContent = headerText;
    } else {
         console.warn("UI: #spotlight-date-header not found.");
    }

    if (!_dom.spotlightList) {
         console.warn("UI: #today-memory-spotlight not found.");
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
             console.warn("UI: Skipping invalid memory object in updateSpotlight:", mem);
             return;
        }

        const itemDiv = document.createElement('div');
        itemDiv.className = 'spotlight-memory-item';

        const diaId = mem.diaId || _callbacks.getTodayId();
        if (!diaId) {
             console.error("UI: Cannot determine diaId for spotlight item:", mem);
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
    console.log(`UI: Updated spotlight with ${itemsCreated} memory items.`);
}


// --- 3. Conexión de Eventos Estáticos ---

/** Attaches listeners to month navigation buttons safely. */
function _setupNavigation() {
    console.log("[ui.js] Setting up navigation listeners...");
    // Safely attach listeners only if elements exist and callback exists
    if (_dom.navPrev) {
         if (typeof _callbacks.onMonthChange === 'function') {
            _dom.navPrev.onclick = () => {
                 console.log("UI: Prev month clicked.");
                 _callbacks.onMonthChange('prev');
            }
            console.log("[ui.js] Prev month listener attached.");
         } else {
              // Log error but DO NOT THROW, navigation is not strictly critical for basic function
              console.error("UI ERROR: Cannot attach Prev month listener - onMonthChange callback missing!");
         }
    } else {
        console.warn("UI WARNING: Previous month button (#prev-month) not found.");
    }

    if (_dom.navNext) {
         if (typeof _callbacks.onMonthChange === 'function') {
             _dom.navNext.onclick = () => {
                 console.log("UI: Next month clicked.");
                 _callbacks.onMonthChange('next');
             }
             console.log("[ui.js] Next month listener attached.");
         } else {
              console.error("UI ERROR: Cannot attach Next month listener - onMonthChange callback missing!");
         }
    } else {
         console.warn("UI WARNING: Next month button (#next-month) not found.");
    }
}


/** Attaches listener to the header search button safely. */
function _setupHeader() {
    console.log("[ui.js] Setting up header listeners...");
    const searchBtn = document.getElementById('header-search-btn');
    if (searchBtn) {
        searchBtn.onclick = () => {
             console.log("UI: Header search button clicked.");
             openSearchModal(); // Directly call UI function
        }
        console.log("[ui.js] Header search listener attached.");
    } else {
        // This is non-critical, just warn
        console.warn("UI WARNING: Header search button (#header-search-btn) not found.");
    }
    // Login button setup is handled dynamically in updateLoginUI
}

/**
 * --- DEFINITIVELY CORRECTED FINAL TIME (v7.10): Footer Event Listener Logic ---
 * Attaches a single listener to the footer and reliably calls main.js callbacks for relevant actions.
 */
function _setupFooter() {
    console.log("[ui.js] Setting up footer listener (v7.10)..."); // Ensure version log is correct
    if(!_dom.footer) {
         // Footer is critical for core actions, throw error if missing
         console.error("UI FATAL: Footer element (.footer-dock) not found. Cannot set up essential footer listeners.");
         throw new Error("UI Init failed: Footer element not found.");
    }

    // Check that the necessary callback exists *before* adding the listener
    if (typeof _callbacks.onFooterAction !== 'function') {
         console.error("UI FATAL: onFooterAction callback is missing or not a function! Footer buttons (Add, Store, Shuffle) will not work.");
         // Throw error because these actions are essential
         throw new Error("UI Init failed: Required callback 'onFooterAction' is missing.");
    } else {
         console.log("[ui.js] onFooterAction callback found.");
    }

    // Use event delegation on the footer element
    console.log("[ui.js] Adding click listener to footer...");
    _dom.footer.addEventListener('click', (e) => {
        // Find the closest ancestor button element that has a data-action attribute
        const button = e.target.closest('.dock-button[data-action]');
        if (!button) {
            // console.log("[ui.js] Footer click ignored (not on a button with data-action).");
            return; // Click was not on a relevant button
        }

        // Get the action identifier
        const action = button.dataset.action;
        console.log(`[ui.js] Footer button clicked! Action='${action}'`); // Clearer log

        // --- THE ACTUAL FINAL FIX v7.10 ---
        // Decide how to handle the action
        if (action === 'add' || action === 'store' || action === 'shuffle') {
            // These actions require main.js logic
            console.log(`[ui.js] Action '${action}' requires main.js. Calling onFooterAction callback...`);
            // ** Call the callback provided by main.js **
            _callbacks.onFooterAction(action);
        } else if (action === 'settings') {
            // This action is handled entirely within ui.js
            console.log("[ui.js] Handling 'settings' action internally.");
            openSettingsDialog();
        } else {
            // Log any other unexpected actions found in data-action
            console.warn(`[ui.js] Click on footer button with unknown action: ${action}`);
        }
        // --- END FIX ---
    });
    console.log("[ui.js] Footer listener attached successfully.");
}



// --- 4. Creación y Manejo de Modales ---
// ... (Modal functions largely unchanged, ensure safety checks) ...
// openPreviewModal, closePreviewModal, _handleEditFromPreview
// openEditModal, closeEditModal, resetMemoryForm, fillFormForEdit
// openStoreModal, closeStoreModal, openStoreListModal, closeStoreListModal, updateStoreList
// openSearchModal, closeSearchModal
// openSettingsDialog
function openPreviewModal(dia, memories) { /* ... v7.8 logic ... */ }
function closePreviewModal() { /* ... v7.8 logic ... */ }
function _handleEditFromPreview() { /* ... v7.8 logic ... */ }
function openEditModal(dia, memories, allDays) { /* ... v7.8 logic ... */ }
function closeEditModal() { /* ... v7.8 logic ... */ }
function resetMemoryForm() { /* ... v7.8 logic ... */ }
function fillFormForEdit(memoria) { /* ... v7.8 logic ... */ }
function openStoreModal() { /* ... v7.8 logic ... */ }
function closeStoreModal() { /* ... v7.8 logic ... */ }
function openStoreListModal(title) { /* ... v7.8 logic ... */ }
function closeStoreListModal() { /* ... v7.8 logic ... */ }
function updateStoreList(items, append = false, hasMore = false) { /* ... v7.8 logic ... */ }
function openSearchModal() { /* ... v7.8 logic ... */ }
function closeSearchModal() { /* ... v7.8 logic ... */ }
function openSettingsDialog() { /* ... v7.8 logic ... */ }

// --- 5. Lógica de UI interna (Helpers) ---
// ... (_handleDayClick needs careful review, ensure callbacks are checked) ...
// ... (_createMemoryItemHTML needs fix for undefined) ...
// ... (_renderMemoryList needs safety checks) ...
// ... (showModalStatus, showMusicResults, showPlaceResults, handleMemoryTypeChange remain the same) ...
async function _handleDayClick(dia) { /* ... v7.8 logic ... */ }
function _createMemoryItemHTML(memoria, context) { /* ... v7.8 logic ... */ }
function _renderMemoryList(listId, memories) { /* ... v7.8 logic ... */ }
function showModalStatus(elementId, message, isError) { /* ... v7.8 logic ... */ }
function showMusicResults(tracks) { /* ... v7.8 logic ... */ }
function showPlaceResults(places) { /* ... v7.8 logic ... */ }
function handleMemoryTypeChange() { /* ... v7.8 logic ... */ }

// --- 6. Creación de Elementos del DOM (Constructores) ---
// ... (Ensure all _create... functions have try/catch blocks and return null on failure) ...
function _createPreviewModal() { /* ... v7.8 logic ... */ }
function _createEditModal() { /* ... v7.8 logic ... */ }
function _bindEditModalEvents() { /* ... v7.8 logic ... */ }
function _showConfirmDelete(memoria) { /* ... v7.8 logic ... */ }
function _populateDaySelect(allDays) { /* ... v7.8 logic ... */ }
function _createStoreModal() { /* ... v7.8 logic ... */ }
function _createStoreCategoryButton(type, icon, label) { /* ... v7.8 logic ... */ }
function _createStoreListModal() { /* ... v7.8 logic ... */ }
function _createStoreListItem(item) { /* ... v7.8 logic ... */ }
function _createSearchModal() { /* ... v7.8 logic ... */ }
function _createDialog(id, title, message) { /* ... v7.8 logic ... */ }


// --- 7. Exportación del Módulo ---
// Ensure all functions needed by main.js are present
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

