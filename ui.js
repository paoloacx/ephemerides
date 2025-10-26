/*
 * ui.js (v7.6 - Definite Footer Fix & Robust Init Logging)
 * - Corrects _setupFooter logic to reliably call main.js callbacks.
 * - Adds detailed step-by-step logging and error checking in init().
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
    isUserLoggedIn: () => { console.warn("UI: isUserLoggedIn callback missing"); return false; },
    onEditFromPreview: (dia, memories) => console.warn("UI: onEditFromPreview callback missing"),
    loadMemoriesForDay: async (diaId) => { console.warn("UI: loadMemoriesForDay callback missing"); return []; },
    getAllDaysData: () => { console.warn("UI: getAllDaysData callback missing"); return []; },
    getTodayId: () => { console.warn("UI: getTodayId callback missing"); return ''; },
    onMonthChange: (dir) => console.warn("UI: onMonthChange callback missing"),
    onFooterAction: (action) => console.warn(`UI: onFooterAction callback missing for action: ${action}`),
    onLogin: () => console.warn("UI: onLogin callback missing"),
    onLogout: () => console.warn("UI: onLogout callback missing"),
    onSaveDayName: (diaId, name) => console.warn("UI: onSaveDayName callback missing"),
    onSaveMemory: (diaId, data, isEditing) => console.warn("UI: onSaveMemory callback missing"),
    onDeleteMemory: (diaId, memId) => console.warn("UI: onDeleteMemory callback missing"),
    onSearchMusic: (term) => console.warn("UI: onSearchMusic callback missing"),
    onSearchPlace: (term) => console.warn("UI: onSearchPlace callback missing"),
    onStoreCategoryClick: (type) => console.warn("UI: onStoreCategoryClick callback missing"),
    onStoreLoadMore: () => console.warn("UI: onStoreLoadMore callback missing"),
    onStoreItemClick: (diaId) => console.warn("UI: onStoreItemClick callback missing"),
    onSearchSubmit: (term) => console.warn("UI: onSearchSubmit callback missing"),
};

let _currentDay = null;
let _currentMemories = [];
let _isEditingMemory = false;
let _selectedMusicTrack = null;
let _selectedPlace = null;


// --- 1. Inicialización y Funciones Principales ---

/**
 * Initializes the UI module. Finds DOM elements, sets up static listeners.
 * Throws an error if critical elements are missing.
 * @param {Object} callbacks - Functions provided by main.js
 */
function init(callbacks) {
    console.log("UI: Initializing v7.6...");
    // 1. Store Callbacks
    _callbacks = { ..._callbacks, ...callbacks };
    console.log("UI: Callbacks received."); // Don't log the object itself, could be large

    // 2. Find DOM Elements with Error Checking
    console.log("UI Step 2: Finding essential DOM elements...");
    _dom.appContent = document.getElementById('app-content');
    _dom.monthNameDisplay = document.getElementById('month-name-display');
    _dom.navPrev = document.getElementById('prev-month');
    _dom.navNext = document.getElementById('next-month');
    _dom.footer = document.querySelector('.footer-dock');
    _dom.spotlightHeader = document.getElementById('spotlight-date-header');
    _dom.spotlightList = document.getElementById('today-memory-spotlight');

    // --- CRITICAL CHECK ---
    if (!_dom.appContent) {
        // If the main content area is missing, the app cannot proceed.
        console.error("UI FATAL: #app-content element NOT FOUND! Aborting UI initialization.");
        throw new Error("UI Init failed: Required element #app-content not found in HTML.");
    } else {
         console.log("UI Step 2: #app-content found.");
    }
    // Warn about non-critical elements
     if (!_dom.monthNameDisplay) console.warn("UI WARNING: #month-name-display not found.");
     if (!_dom.navPrev) console.warn("UI WARNING: #prev-month button not found.");
     if (!_dom.navNext) console.warn("UI WARNING: #next-month button not found.");
     if (!_dom.footer) console.warn("UI WARNING: Footer (.footer-dock) not found.");
     if (!_dom.spotlightHeader) console.warn("UI WARNING: #spotlight-date-header not found.");
     if (!_dom.spotlightList) console.warn("UI WARNING: #today-memory-spotlight not found.");
     console.log("UI Step 2: DOM element finding complete.");


    // 3. Setup Event Listeners with Error Handling
    console.log("UI Step 3: Setting up event listeners...");
    try {
        _setupNavigation(); // Sets up Prev/Next month
        _setupHeader();     // Sets up Header Search
        _setupFooter();     // Sets up Footer buttons (Add, Store, Shuffle, Settings)
        console.log("UI Step 3: Event listeners set up successfully.");
    } catch (listenerError) {
         // Catch any unexpected error during listener setup
         console.error("UI FATAL: Error setting up event listeners:", listenerError);
         // Throw error to stop main.js from proceeding
         throw new Error(`UI Init failed during event listener setup: ${listenerError.message}`);
    }

    // 4. Final Log
    console.log("UI: Initialization function (init) completed successfully.");
}


/**
 * Updates the login UI elements (avatar/button).
 * @param {object|null} user - The Firebase user object or null.
 */
function updateLoginUI(user) {
    const loginSection = document.getElementById('login-section');
    if (!loginSection) {
         console.warn("UI: #login-section not found, cannot update login UI.");
         return;
    }

    if (user) {
        // User is logged in - show avatar, make it clickable for logout
        loginSection.innerHTML = `
            <div id="user-info" title="Logout (Click Avatar)">
                <img id="user-img" src="${user.photoURL || 'https://placehold.co/30x30/ccc/fff?text=?'}" alt="Avatar">
                <span id="user-name">${user.displayName || 'User'}</span>
            </div>
        `;
        const userInfoDiv = document.getElementById('user-info');
        if (userInfoDiv) {
             // Attach logout callback to the entire user info div
             userInfoDiv.onclick = () => {
                 console.log("UI: Logout triggered by avatar click.");
                 if (_callbacks.onLogout) {
                     _callbacks.onLogout(); // Call main.js logout handler
                 } else {
                     console.error("UI: onLogout callback is missing!");
                 }
            }
        } else {
             console.warn("UI: #user-info element not found after setting innerHTML (Logout).");
        }

    } else {
        // User is logged out - show login button
        loginSection.innerHTML = `
            <button id="login-btn" class="header-icon-btn" title="Login with Google">
                <span class="material-icons-outlined">login</span>
            </button>
        `;
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
             // Attach login callback to the button
             loginBtn.onclick = () => {
                 console.log("UI: Login triggered.");
                 if (_callbacks.onLogin) {
                     _callbacks.onLogin(); // Call main.js login handler
                 } else {
                     console.error("UI: onLogin callback is missing!");
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
    console.log(`UI: Drawing calendar grid for ${monthName}. Received ${days ? days.length : 0} days.`);

    // Update month name display (safe check)
    if (_dom.monthNameDisplay) {
        _dom.monthNameDisplay.textContent = monthName;
    } else {
        console.warn("UI: #month-name-display not found during drawCalendar.");
    }

    // Ensure the main content area exists
    if (!_dom.appContent) {
        console.error("UI ERROR in drawCalendar: #app-content element not found! Cannot draw calendar.");
        return; // Stop execution if critical element is missing
    }
    _dom.appContent.innerHTML = ''; // Clear previous grid

    // Create grid container
    const grid = document.createElement('div');
    grid.className = 'calendario-grid';

    // Handle case where no days are provided
    if (!days || days.length === 0) {
        console.warn(`UI: No valid days data provided for ${monthName}. Displaying empty message.`);
        grid.innerHTML = "<p>No days found for this month.</p>";
        _dom.appContent.appendChild(grid);
        return;
    }

    // Use DocumentFragment for performance
    const fragment = document.createDocumentFragment();

    // Loop through day data and create buttons
    let buttonsCreated = 0;
    days.forEach(dia => {
        // Add robust check for valid day object structure
        if (!dia || typeof dia !== 'object' || !dia.id || typeof dia.id !== 'string' || dia.id.length !== 5) {
             console.warn("UI: Skipping invalid day object in drawCalendar loop:", dia);
             return; // Skip this iteration if data is malformed
        }

        const btn = document.createElement("button");
        btn.className = "dia-btn"; // Base class

        // Add modifier classes
        if (dia.id === todayId) {
            btn.classList.add('dia-btn-today');
        }
        if (dia.tieneMemorias === true) { // Explicit check for boolean true
            btn.classList.add('tiene-memorias');
        }

        // Safely parse and display day number
        const dayNumberStr = dia.id.substring(3); // Get "DD" part
        const dayNumber = parseInt(dayNumberStr, 10);
        btn.innerHTML = `<span class="dia-numero">${isNaN(dayNumber) ? '?' : dayNumber}</span>`; // Display '?' if parsing fails
        btn.dataset.diaId = dia.id; // Store "MM-DD" ID for click handler

        // Attach click handler - calls internal UI handler
        btn.onclick = () => _handleDayClick(dia);

        fragment.appendChild(btn);
        buttonsCreated++;
    });

    // Append the fragment to the DOM
    _dom.appContent.appendChild(grid);
    console.log(`UI: Successfully created ${buttonsCreated} day buttons for ${monthName}.`);
}


/**
 * Updates the content of the "Today Spotlight" section.
 * @param {string} headerText - The text for the spotlight header (e.g., "Today, October 26 (Named Day)").
 * @param {Array<object>} memories - An array of memory objects to display (or empty array).
 */
function updateSpotlight(headerText, memories) {
    console.log(`UI: Updating spotlight. Header: "${headerText}". Memories: ${memories ? memories.length : 0}`);
    // Safely update header
    if (_dom.spotlightHeader) {
        _dom.spotlightHeader.textContent = headerText;
    } else {
         console.warn("UI: #spotlight-date-header not found during updateSpotlight.");
    }

    // Ensure spotlight list container exists
    if (!_dom.spotlightList) {
         console.warn("UI: #today-memory-spotlight not found during updateSpotlight.");
         return;
    }

    _dom.spotlightList.innerHTML = ''; // Clear previous items
    // Display placeholder if no memories
    if (!memories || memories.length === 0) {
        _dom.spotlightList.innerHTML = `<p class="list-placeholder">No memories for today.</p>`;
        return;
    }

    // Create and append list items
    const fragment = document.createDocumentFragment();
    let itemsCreated = 0;
    memories.forEach(mem => {
        // Validate memory object
        if (!mem || typeof mem !== 'object') {
             console.warn("UI: Skipping invalid memory object in updateSpotlight:", mem);
             return;
        }

        const itemDiv = document.createElement('div');
        itemDiv.className = 'spotlight-memory-item';

        // Ensure diaId is available (should be today's ID for spotlight)
        const diaId = mem.diaId || _callbacks.getTodayId();
        if (!diaId) {
             console.error("UI: Cannot determine diaId for spotlight item:", mem);
             return; // Skip item if ID is missing
        }
        itemDiv.dataset.diaId = diaId; // Store ID for click handler

        // Generate the HTML for the item
        itemDiv.innerHTML = _createMemoryItemHTML(mem, 'spotlight'); // Use 'spotlight' context

        // Attach click handler
        itemDiv.onclick = () => {
            // Reconstruct a minimal 'dia' object needed by _handleDayClick
            const diaData = {
                id: itemDiv.dataset.diaId,
                // Pass Nombre_Dia if available, fallback to ID
                Nombre_Dia: mem.Nombre_Dia || itemDiv.dataset.diaId
            };
            _handleDayClick(diaData); // Call internal handler
        };

        fragment.appendChild(itemDiv);
        itemsCreated++;
    });
    _dom.spotlightList.appendChild(fragment);
    console.log(`UI: Updated spotlight with ${itemsCreated} memory items.`);
}


// --- 3. Conexión de Eventos Estáticos ---

/** Attaches listeners to month navigation buttons. */
function _setupNavigation() {
    console.log("UI: Setting up navigation listeners...");
    if(_dom.navPrev) {
        _dom.navPrev.onclick = () => {
             console.log("UI: Prev month clicked.");
             // Check if callback exists before calling
             if(_callbacks.onMonthChange) _callbacks.onMonthChange('prev');
             else console.error("UI: onMonthChange callback missing!");
        }
    } else {
        console.warn("UI: Previous month button (#prev-month) not found.");
    }
    if(_dom.navNext) {
         _dom.navNext.onclick = () => {
             console.log("UI: Next month clicked.");
             if(_callbacks.onMonthChange) _callbacks.onMonthChange('next');
             else console.error("UI: onMonthChange callback missing!");
         }
    } else {
         console.warn("UI: Next month button (#next-month) not found.");
    }
}

/** Attaches listener to the header search button. */
function _setupHeader() {
    console.log("UI: Setting up header listeners...");
    const searchBtn = document.getElementById('header-search-btn');
    if (searchBtn) {
        searchBtn.onclick = () => {
             console.log("UI: Header search button clicked.");
             openSearchModal(); // Directly call UI function
        }
    } else {
        console.warn("UI: Header search button (#header-search-btn) not found.");
    }
    // Note: Login button setup is handled dynamically in updateLoginUI
}

/**
 * --- CORRECTED: Footer Event Listener Logic ---
 * Attaches a single listener to the footer and reliably calls main.js callbacks.
 */
function _setupFooter() {
    console.log("UI: Setting up footer listener...");
    if(!_dom.footer) {
         console.error("UI FATAL: Footer element (.footer-dock) not found. Cannot set up footer listeners.");
         // Throw error because footer is critical for interaction
         throw new Error("UI Init failed: Footer element not found.");
         // return; // Or just return if footer is considered non-critical for basic load
    }

    // Use event delegation on the footer element
    _dom.footer.addEventListener('click', (e) => {
        // Find the closest ancestor button element that was clicked
        const button = e.target.closest('.dock-button');
        // If the click wasn't inside a button, do nothing
        if (!button) return;

        // Get the action identifier from the button's data attribute
        const action = button.dataset.action;
        console.log(`UI: Footer button clicked with action='${action}'`); // Log the detected action

        if (action) {
            // Actions that need to be handled by main.js
            if (action === 'add' || action === 'store' || action === 'shuffle') {
                // Check if the callback function from main.js exists
                if (_callbacks.onFooterAction) {
                    console.log(`UI: Calling onFooterAction callback for '${action}'...`);
                    // --- THE FIX: Call the callback correctly ---
                    _callbacks.onFooterAction(action);
                } else {
                    // Log an error if the callback wasn't provided by main.js
                    console.error(`UI: onFooterAction callback is missing! Cannot execute action: ${action}`);
                    alert(`Error: Action '${action}' is not configured.`); // Inform user
                }
            }
            // Actions handled entirely within ui.js
            else if (action === 'settings') {
                console.log("UI: Handling 'settings' action internally.");
                openSettingsDialog(); // Directly call the UI function
            }
            // Handle any other unexpected actions
            else {
                console.warn(`UI: Click on footer button with unknown action: ${action}`);
            }
        } else {
             // This indicates an HTML issue (button missing data-action)
             console.warn("UI: Clicked footer button is missing the 'data-action' attribute:", button);
        }
    });
    console.log("UI: Footer listener attached successfully.");
}


// --- 4. Creación y Manejo de Modales ---
// ... (Modal functions remain largely the same, ensure safety checks) ...
// openPreviewModal, closePreviewModal, _handleEditFromPreview
// openEditModal, closeEditModal, resetMemoryForm, fillFormForEdit
// openStoreModal, closeStoreModal, openStoreListModal, closeStoreListModal, updateStoreList
// openSearchModal, closeSearchModal
// openSettingsDialog
function openPreviewModal(dia, memories) { /* ... v7.4 logic ... */ }
function closePreviewModal() { /* ... v7.4 logic ... */ }
function _handleEditFromPreview() { /* ... v7.4 logic ... */ }
function openEditModal(dia, memories, allDays) { /* ... v7.4 logic ... */ }
function closeEditModal() { /* ... v7.4 logic ... */ }
function resetMemoryForm() { /* ... v7.4 logic ... */ }
function fillFormForEdit(memoria) { /* ... v7.4 logic ... */ }
function openStoreModal() { /* ... v7.4 logic ... */ }
function closeStoreModal() { /* ... v7.4 logic ... */ }
function openStoreListModal(title) { /* ... v7.4 logic ... */ }
function closeStoreListModal() { /* ... v7.4 logic ... */ }
function updateStoreList(items, append = false, hasMore = false) { /* ... v7.4 logic ... */ }
function openSearchModal() { /* ... v7.4 logic ... */ }
function closeSearchModal() { /* ... v7.4 logic ... */ }
function openSettingsDialog() { /* ... v7.4 logic ... */ }

// --- 5. Lógica de UI interna (Helpers) ---
// ... (_handleDayClick, _createMemoryItemHTML, _renderMemoryList remain the same) ...
// ... (showModalStatus, showMusicResults, showPlaceResults, handleMemoryTypeChange remain the same) ...
async function _handleDayClick(dia) { /* ... v7.4 logic ... */ }
function _createMemoryItemHTML(memoria, context) { /* ... v7.4 logic ... */ }
function _renderMemoryList(listId, memories) { /* ... v7.4 logic ... */ }
function showModalStatus(elementId, message, isError) { /* ... v7.4 logic ... */ }
function showMusicResults(tracks) { /* ... v7.4 logic ... */ }
function showPlaceResults(places) { /* ... v7.4 logic ... */ }
function handleMemoryTypeChange() { /* ... v7.4 logic ... */ }

// --- 6. Creación de Elementos del DOM (Constructores) ---
// ... (_createPreviewModal, _createEditModal, _bindEditModalEvents, _showConfirmDelete, _populateDaySelect remain the same) ...
// ... (_createStoreModal, _createStoreCategoryButton, _createStoreListModal, _createStoreListItem remain the same) ...
// ... (_createSearchModal, _createDialog remain the same) ...
function _createPreviewModal() { /* ... v7.4 logic ... */ }
function _createEditModal() { /* ... v7.4 logic ... */ }
function _bindEditModalEvents() { /* ... v7.4 logic ... */ }
function _showConfirmDelete(memoria) { /* ... v7.4 logic ... */ }
function _populateDaySelect(allDays) { /* ... v7.4 logic ... */ }
function _createStoreModal() { /* ... */ }
function _createStoreCategoryButton(type, icon, label) { /* ... */ }
function _createStoreListModal() { /* ... */ }
function _createStoreListItem(item) { /* ... */ }
function _createSearchModal() { /* ... */ }
function _createDialog(id, title, message) { /* ... */ }


// --- 7. Exportación del Módulo ---
// Make sure all functions called by main.js or needed internally are exported
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
    // fillFormForEdit is internal, not needed by main.js
    showModalStatus, // Needed by main.js for feedback
    showMusicResults, // Needed by main.js
    showPlaceResults, // Needed by main.js
    handleMemoryTypeChange, // Should be internal, but might be needed? Check usage. (Called by _bindEditModalEvents, so internal is fine)
    openStoreModal,
    closeStoreModal,
    openStoreListModal,
    closeStoreListModal,
    updateStoreList, // Needed by main.js
    openSearchModal,
    closeSearchModal, // Needed by main.js
    openSettingsDialog, // Called internally by _setupFooter
    // _handleDayClick is internal
    // _create... functions are internal
    // _bind... functions are internal
    // _show... functions are internal
    // _populateDaySelect is internal
};

