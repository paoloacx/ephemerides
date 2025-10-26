/*
 * ui.js (v7.8 - Robust Init Checks & Definite Footer Fix)
 * - Adds null checks before attaching listeners in init() helpers.
 * - Ensures _setupFooter reliably calls main.js callbacks.
 * - Includes previous fixes (Spotlight undefined, Logout).
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
    console.log("UI: Initializing v7.8..."); // Version bump
    // 1. Store Callbacks
    _callbacks = { ..._callbacks, ...callbacks };
    console.log("UI: Callbacks received.");

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
        console.error("UI FATAL: #app-content element NOT FOUND! Aborting UI initialization.");
        throw new Error("UI Init failed: Required element #app-content not found in HTML.");
    } else {
         console.log("UI Step 2: #app-content found.");
    }
    // Warn about non-critical missing elements
     if (!_dom.monthNameDisplay) console.warn("UI WARNING: #month-name-display not found.");
     if (!_dom.navPrev) console.warn("UI WARNING: #prev-month button not found.");
     if (!_dom.navNext) console.warn("UI WARNING: #next-month button not found.");
     if (!_dom.footer) console.warn("UI WARNING: Footer (.footer-dock) not found.");
     if (!_dom.spotlightHeader) console.warn("UI WARNING: #spotlight-date-header not found.");
     if (!_dom.spotlightList) console.warn("UI WARNING: #today-memory-spotlight not found.");
     console.log("UI Step 2: DOM element finding complete.");


    // 3. Setup Event Listeners with Error Handling and Null Checks
    console.log("UI Step 3: Setting up event listeners...");
    try {
        _setupNavigation(); // Has internal null checks now
        _setupHeader();     // Has internal null checks now
        _setupFooter();     // Has internal null checks now and CORRECTED logic
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
             userInfoDiv.onclick = () => {
                 console.log("UI: Logout triggered by avatar click.");
                 // Check if callback exists before calling
                 if (_callbacks.onLogout) {
                     _callbacks.onLogout();
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
             loginBtn.onclick = () => {
                 console.log("UI: Login triggered.");
                 // Check if callback exists
                 if (_callbacks.onLogin) {
                     _callbacks.onLogin();
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
    try {
        days.forEach(dia => {
            if (!dia || typeof dia !== 'object' || !dia.id || typeof dia.id !== 'string' || dia.id.length !== 5) {
                 console.warn("UI: Skipping invalid day object in drawCalendar loop:", dia);
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
    } catch (loopError) {
         console.error("UI ERROR during drawCalendar loop:", loopError);
         grid.innerHTML = `<p style="color:red;">Error creating day buttons: ${loopError.message}</p>`;
    }

    _dom.appContent.appendChild(grid);
    console.log(`UI: Appended calendar grid with ${buttonsCreated} buttons to #app-content.`);
}


/**
 * Updates the content of the "Today Spotlight" section.
 * @param {string} headerText - The text for the spotlight header.
 * @param {Array<object>} memories - An array of memory objects.
 */
function updateSpotlight(headerText, memories) {
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

    _dom.spotlightList.innerHTML = '';
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
    console.log("UI: Setting up navigation listeners...");
    // Safely attach listeners only if elements exist
    if(_dom.navPrev) {
        _dom.navPrev.onclick = () => {
             console.log("UI: Prev month clicked.");
             if(_callbacks.onMonthChange) _callbacks.onMonthChange('prev');
             else console.error("UI: onMonthChange callback missing!");
        }
    } else {
        console.warn("UI: Previous month button (#prev-month) not found. Listener not attached.");
    }
    if(_dom.navNext) {
         _dom.navNext.onclick = () => {
             console.log("UI: Next month clicked.");
             if(_callbacks.onMonthChange) _callbacks.onMonthChange('next');
             else console.error("UI: onMonthChange callback missing!");
         }
    } else {
         console.warn("UI: Next month button (#next-month) not found. Listener not attached.");
    }
}

/** Attaches listener to the header search button safely. */
function _setupHeader() {
    console.log("UI: Setting up header listeners...");
    const searchBtn = document.getElementById('header-search-btn');
    if (searchBtn) {
        searchBtn.onclick = () => {
             console.log("UI: Header search button clicked.");
             openSearchModal();
        }
    } else {
        // This is non-critical, just warn
        console.warn("UI: Header search button (#header-search-btn) not found. Listener not attached.");
    }
    // Login button setup is handled dynamically in updateLoginUI, no static listener needed here
}

/**
 * --- DEFINITIVELY CORRECTED: Footer Event Listener Logic ---
 * Attaches a single listener to the footer and reliably calls main.js callbacks for relevant actions.
 */
function _setupFooter() {
    console.log("UI: Setting up footer listener (v7.8)..."); // Version bump in log
    if(!_dom.footer) {
         // Footer is critical for core actions, throw error if missing
         console.error("UI FATAL: Footer element (.footer-dock) not found. Cannot set up essential footer listeners.");
         throw new Error("UI Init failed: Footer element not found.");
    }

    // Use event delegation on the footer element
    _dom.footer.addEventListener('click', (e) => {
        // Find the closest ancestor button element that has a data-action attribute
        const button = e.target.closest('.dock-button[data-action]');
        // If the click wasn't inside such a button, do nothing
        if (!button) {
            // console.log("UI Footer Click: Click target was not a dock button or descendant.");
            return;
        }

        // Get the action identifier from the button's data attribute
        const action = button.dataset.action;
        console.log(`UI: Footer button clicked with action='${action}'`); // Log the detected action

        // --- THE ACTUAL FIX ---
        // Check the action and decide whether to call main.js or handle internally
        if (action === 'add' || action === 'store' || action === 'shuffle') {
            // These actions need logic from main.js
            // Check if the callback function provided by main.js exists
            if (typeof _callbacks.onFooterAction === 'function') {
                console.log(`UI: Calling main.js onFooterAction callback for '${action}'...`);
                // ** Call the callback provided by main.js **
                _callbacks.onFooterAction(action);
            } else {
                // Log an error if the callback wasn't provided or isn't a function
                console.error(`UI: onFooterAction callback is missing or not a function! Cannot execute action: ${action}`);
                alert(`Error: Action '${action}' is not configured correctly.`); // Inform user
            }
        } else if (action === 'settings') {
            // This action is handled entirely within ui.js
            console.log("UI: Handling 'settings' action internally.");
            openSettingsDialog(); // Directly call the UI function
        } else {
            // Log any other unexpected actions found in data-action
            console.warn(`UI: Click on footer button with unknown or unhandled action: ${action}`);
        }
        // --- END FIX ---
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
// ... (_handleDayClick needs careful review, ensure callbacks are checked) ...
// ... (_createMemoryItemHTML needs fix for undefined) ...
// ... (_renderMemoryList needs safety checks) ...
// ... (showModalStatus, showMusicResults, showPlaceResults, handleMemoryTypeChange remain the same) ...
async function _handleDayClick(dia) { /* ... v7.4 logic ... */ }

/**
 * --- CORRECTED: Handles undefined properties in memory object ---
 * Generates HTML for a single memory item, adapting for different contexts.
 * @param {object} memoria - The memory data object.
 * @param {string} context - 'spotlight', 'preview-modal', or 'edit-modal'.
 * @returns {string} - The HTML string for the memory item.
 */
function _createMemoryItemHTML(memoria, context) {
    let contentHTML = '';
    let artworkHTML = '';

    // --- Year Extraction (Safe) ---
    let yearStr = '????';
    try {
        if (memoria?.Fecha_Original?.toDate) { // Optional chaining
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

    // --- Icon Selection (Safe) ---
    let icon = 'notes';
    switch (memoria?.Tipo) { // Optional chaining
        case 'Place': icon = 'place'; break;
        case 'Music': icon = 'music_note'; break;
        case 'Image': icon = 'image'; break;
        default: icon = 'notes'; break;
    }

    // --- Build HTML based on Context ---
    if (context === 'spotlight') {
        // Spotlight format: [Year Box] [Icon] [Text Content Div [Span]]
        contentHTML = `<span class="spotlight-year-box">${yearStr}</span>`;
        contentHTML += `<span class="material-icons-outlined">${icon}</span>`;
        contentHTML += `<div class="spotlight-memory-content"><span>`; // Start content wrapper

        // --- FIX: Safely access properties with fallbacks ---
        switch (memoria?.Tipo) {
            case 'Place':
                contentHTML += `${memoria.LugarNombre || 'Place'}`; // Fallback text
                break;
            case 'Music':
                if (memoria.CancionData?.trackName) {
                    contentHTML += `<strong>${memoria.CancionData.trackName || '?'}</strong> by ${memoria.CancionData.artistName || '?'}`;
                     if(memoria.CancionData.artworkUrl60) {
                         artworkHTML = `<img src="${memoria.CancionData.artworkUrl60}" class="memoria-artwork" onerror="this.style.display='none'">`;
                     }
                } else {
                    contentHTML += `${memoria.CancionInfo || 'Music'}`; // Fallback text
                }
                break;
            case 'Image':
                contentHTML += `${memoria.Descripcion || 'Image'}`; // Fallback text
                break;
            case 'Text':
            default:
                 const description = memoria.Descripcion || 'Memory'; // Fallback text
                 const maxLength = 40;
                 contentHTML += description.length > maxLength ? description.substring(0, maxLength) + '...' : description;
                break;
        }
        contentHTML += `</span></div>`; // Close content span and div

    } else { // Context is 'preview-modal' or 'edit-modal'
        contentHTML = `<small>${yearStr}</small>`;
        contentHTML += `<span><span class="material-icons-outlined">${icon}</span> `; // Start content span + icon

        // --- FIX: Safely access properties with fallbacks ---
        switch (memoria?.Tipo) {
            case 'Place':
                contentHTML += `${memoria.LugarNombre || 'Place'}`;
                break;
            case 'Music':
                if (memoria.CancionData?.trackName) {
                    contentHTML += `<strong>${memoria.CancionData.trackName || '?'}</strong> by ${memoria.CancionData.artistName || '?'}`;
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

    // --- Actions (only for 'edit-modal') ---
    let actionsHTML = '';
    if (context === 'edit-modal' && memoria?.id) { // Ensure ID exists for buttons
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

    // --- Combine and Return ---
    if (context === 'spotlight') {
         return `${artworkHTML}${contentHTML}`;
    } else {
         return `${artworkHTML}<div class="memoria-item-content">${contentHTML}</div>${actionsHTML}`;
    }
}


function _renderMemoryList(listId, memories) { /* ... v7.7 logic ... */ }
function showModalStatus(elementId, message, isError) { /* ... v7.7 logic ... */ }
function showMusicResults(tracks) { /* ... v7.7 logic ... */ }
function showPlaceResults(places) { /* ... v7.7 logic ... */ }
function handleMemoryTypeChange() { /* ... v7.7 logic ... */ }

// --- 6. Creación de Elementos del DOM (Constructores) ---
// ... (Ensure all _create... functions have try/catch blocks and return null on failure) ...
function _createPreviewModal() { /* ... v7.7 logic ... */ }
function _createEditModal() { /* ... v7.7 logic ... */ }
function _bindEditModalEvents() { /* ... v7.7 logic ... */ }
function _showConfirmDelete(memoria) { /* ... v7.7 logic ... */ }
function _populateDaySelect(allDays) { /* ... v7.7 logic ... */ }
function _createStoreModal() { /* ... v7.7 logic ... */ }
function _createStoreCategoryButton(type, icon, label) { /* ... v7.7 logic ... */ }
function _createStoreListModal() { /* ... v7.7 logic ... */ }
function _createStoreListItem(item) { /* ... v7.7 logic ... */ }
function _createSearchModal() { /* ... v7.7 logic ... */ }
function _createDialog(id, title, message) { /* ... v7.7 logic ... */ }


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

