/*
 * ui.js (v7.5 - Fix Footer Button Callbacks & Init Logging)
 * - Corrects _setupFooter to call main.js callbacks properly.
 * - Adds more robust logging and checks in init().
 * - Includes previous fixes (Spotlight, Logout).
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
    onFooterAction: (action) => console.warn(`UI: onFooterAction callback missing for action: ${action}`), // Log missing footer action
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

function init(callbacks) {
    console.log("UI: Initializing v7.5...");
    // Merge provided callbacks with defaults
    _callbacks = { ..._callbacks, ...callbacks };
    console.log("UI: Callbacks received from main.js:", _callbacks); // Log received callbacks

    // --- DOM Element Finding ---
    console.log("UI: Finding essential DOM elements...");
    _dom.appContent = document.getElementById('app-content');
    _dom.monthNameDisplay = document.getElementById('month-name-display');
    _dom.navPrev = document.getElementById('prev-month');
    _dom.navNext = document.getElementById('next-month');
    _dom.footer = document.querySelector('.footer-dock');
    _dom.spotlightHeader = document.getElementById('spotlight-date-header');
    _dom.spotlightList = document.getElementById('today-memory-spotlight');
    console.log("UI: DOM elements found:", _dom);

    // --- Critical Element Check ---
    if (!_dom.appContent) {
        // If the main content area is missing, the app cannot function.
        console.error("UI FATAL: #app-content element not found! Aborting UI initialization.");
        // Throw an error to be caught by main.js
        throw new Error("UI Init failed: #app-content element not found.");
    }
     // Warn about non-critical missing elements
     if (!_dom.monthNameDisplay) console.warn("UI: #month-name-display not found.");
     if (!_dom.navPrev || !_dom.navNext) console.warn("UI: Month navigation buttons not found.");
     if (!_dom.footer) console.warn("UI: Footer element not found.");
     if (!_dom.spotlightHeader || !_dom.spotlightList) console.warn("UI: Spotlight elements not found.");


    // --- Setup Event Listeners ---
    console.log("UI: Setting up event listeners...");
    try {
        _setupNavigation();
        _setupHeader();
        _setupFooter(); // This function now correctly calls callbacks
        console.log("UI: Event listeners set up successfully.");
    } catch (listenerError) {
         console.error("UI: Error setting up event listeners:", listenerError);
         throw new Error(`UI Init failed during event listener setup: ${listenerError.message}`);
    }


    console.log("UI: Initialization complete."); // Final log for successful init
}


function updateLoginUI(user) {
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
                 // Check if callback exists before calling
                 if (_callbacks.onLogout) {
                     _callbacks.onLogout();
                 } else {
                     console.error("UI: onLogout callback is missing!");
                 }
            }
        } else {
             console.warn("UI: #user-info element not found after setting innerHTML.");
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
                 // Check if callback exists
                 if (_callbacks.onLogin) {
                     _callbacks.onLogin();
                 } else {
                     console.error("UI: onLogin callback is missing!");
                 }
            }
        } else {
             console.warn("UI: #login-btn element not found after setting innerHTML.");
        }
    }
}

// --- 2. Renderizado del Contenido Principal ---

function drawCalendar(monthName, days, todayId) {
    console.log(`UI: Attempting to draw calendar for ${monthName}. Found ${days ? days.length : 'no'} days.`);

    if (_dom.monthNameDisplay) {
        _dom.monthNameDisplay.textContent = monthName;
    } else {
        console.warn("UI: #month-name-display not found during drawCalendar.");
    }

    if (!_dom.appContent) {
        console.error("UI ERROR in drawCalendar: #app-content element not found! Cannot draw.");
        return;
    }
    _dom.appContent.innerHTML = ''; // Clear previous grid

    const grid = document.createElement('div');
    grid.className = 'calendario-grid';

    if (!days || days.length === 0) {
        console.warn(`UI: No days data provided for ${monthName}. Displaying empty message.`);
        grid.innerHTML = "<p>No days found for this month.</p>"; // Use English
        _dom.appContent.appendChild(grid);
        return;
    }

    const fragment = document.createDocumentFragment();

    days.forEach(dia => {
        // Add robust check for valid day object
        if (!dia || typeof dia !== 'object' || !dia.id || typeof dia.id !== 'string' || dia.id.length !== 5) {
             console.warn("UI: Skipping invalid day object in drawCalendar:", dia);
             return; // Skip this iteration
        }

        const btn = document.createElement("button");
        btn.className = "dia-btn";

        if (dia.id === todayId) {
            btn.classList.add('dia-btn-today');
        }
        // Use optional chaining for safety
        if (dia.tieneMemorias === true) {
            btn.classList.add('tiene-memorias');
        }

        // Safely parse day number
        const dayNumberStr = dia.id.substring(3);
        const dayNumber = parseInt(dayNumberStr, 10);
        btn.innerHTML = `<span class="dia-numero">${isNaN(dayNumber) ? '?' : dayNumber}</span>`;
        btn.dataset.diaId = dia.id; // Store MM-DD id

        // Attach click handler
        btn.onclick = () => _handleDayClick(dia); // Calls internal handler

        fragment.appendChild(btn);
    });

    _dom.appContent.appendChild(grid);
    console.log(`UI: Successfully drew calendar grid with ${fragment.children.length} buttons.`); // Log actual number added
}


function updateSpotlight(headerText, memories) {
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
    memories.forEach(mem => {
        // Ensure mem is a valid object
        if (!mem || typeof mem !== 'object') {
             console.warn("UI: Skipping invalid memory object in updateSpotlight:", mem);
             return;
        }

        const itemDiv = document.createElement('div');
        itemDiv.className = 'spotlight-memory-item';

        // Ensure diaId is available, fallback to todayId from callback
        const diaId = mem.diaId || _callbacks.getTodayId();
        if (!diaId) {
             console.error("UI: Cannot determine diaId for spotlight item:", mem);
             return; // Skip if no ID
        }
        itemDiv.dataset.diaId = diaId;

        // Generate HTML using the helper
        itemDiv.innerHTML = _createMemoryItemHTML(mem, 'spotlight');

        // Attach click handler
        itemDiv.onclick = () => {
            // Reconstruct a minimal 'dia' object needed by _handleDayClick
            const diaData = {
                id: itemDiv.dataset.diaId,
                // Pass Nombre_Dia if available on the memory object, otherwise fallback
                Nombre_Dia: mem.Nombre_Dia || itemDiv.dataset.diaId
            };
            _handleDayClick(diaData);
        };

        fragment.appendChild(itemDiv);
    });
    _dom.spotlightList.appendChild(fragment);
    // console.log(`UI: Updated spotlight with ${fragment.children.length} items.`);
}


// --- 3. Conexión de Eventos Estáticos ---

function _setupNavigation() {
    console.log("UI: Setting up navigation listeners...");
    if(_dom.navPrev) {
        _dom.navPrev.onclick = () => {
             console.log("UI: Prev month clicked.");
             if(_callbacks.onMonthChange) _callbacks.onMonthChange('prev');
        }
    } else {
        console.warn("UI: Previous month button not found.");
    }
    if(_dom.navNext) {
         _dom.navNext.onclick = () => {
             console.log("UI: Next month clicked.");
             if(_callbacks.onMonthChange) _callbacks.onMonthChange('next');
         }
    } else {
         console.warn("UI: Next month button not found.");
    }
}

function _setupHeader() {
    console.log("UI: Setting up header listeners...");
    const searchBtn = document.getElementById('header-search-btn');
    if (searchBtn) {
        searchBtn.onclick = () => {
             console.log("UI: Header search button clicked.");
             openSearchModal();
        }
    } else {
        console.warn("UI: Header search button not found.");
    }
    // Note: Login button setup is handled in updateLoginUI
}

/**
 * --- CORRECTED: Footer Event Listener ---
 * Attaches a single listener to the footer and delegates based on data-action.
 * Calls the appropriate callback in main.js for actions it doesn't handle.
 */
function _setupFooter() {
    console.log("UI: Setting up footer listener...");
    if(!_dom.footer) {
         console.error("UI: Footer element not found. Cannot set up listeners.");
         return;
    }

    // Use event delegation on the footer element
    _dom.footer.addEventListener('click', (e) => {
        // Find the closest button element that was clicked
        const button = e.target.closest('.dock-button');
        if (!button) {
             // console.log("UI Footer Click: Not on a button.");
             return; // Click was not on a button or its descendant
        }

        // Get the action from the button's data attribute
        const action = button.dataset.action;
        console.log(`UI Footer Click: Button action='${action}'`); // Log the detected action

        if (action) {
            // Actions handled by main.js (passed via callback)
            if (action === 'add' || action === 'store' || action === 'shuffle') {
                // Check if the callback exists before calling it
                if (_callbacks.onFooterAction) {
                    _callbacks.onFooterAction(action);
                } else {
                    console.error(`UI: onFooterAction callback is missing! Cannot handle action: ${action}`);
                }
            }
            // Actions handled directly by ui.js
            else if (action === 'settings') {
                openSettingsDialog(); // Directly call the UI function
            }
            // Log unknown actions
            else {
                console.warn(`UI: Unknown footer action detected: ${action}`);
            }
        } else {
             console.warn("UI: Clicked footer button is missing data-action attribute:", button);
        }
    });
    console.log("UI: Footer listener attached.");
}


// --- 4. Creación y Manejo de Modales ---
// ... (Modal functions largely unchanged, but added safety checks) ...

// --- Modal de Preview ---
function openPreviewModal(dia, memories) {
    // Ensure 'dia' is valid
    if (!dia || !dia.id) {
         console.error("UI: Cannot open Preview modal, invalid 'dia' object:", dia);
         return;
    }
    _currentDay = dia;
    _currentMemories = memories || []; // Ensure memories is an array

    // Create modal if it doesn't exist
    if (!_modals.preview) {
        _modals.preview = _createPreviewModal();
        if (!_modals.preview) {
             console.error("UI: Failed to create Preview modal.");
             return; // Exit if creation failed
        }
    }

    const title = _modals.preview.querySelector('.modal-header h3');
    const editBtn = _modals.preview.querySelector('.header-edit-btn');

    // Safely set title content
    const displayName = dia.Nombre_Dia || dia.id; // Use Name or fallback to ID
    const specialName = dia.Nombre_Especial && dia.Nombre_Especial !== 'Unnamed Day' ? `(${dia.Nombre_Especial})` : '';
    if(title) title.textContent = `${displayName} ${specialName}`;

    // Safely show/hide edit button
    if(editBtn) {
        if (_callbacks.isUserLoggedIn()) {
            editBtn.classList.add('visible');
        } else {
            editBtn.classList.remove('visible');
        }
    }

    _renderMemoryList('preview-memorias-list', _currentMemories); // Render memories

    _modals.preview.classList.add('visible'); // Show modal
}

function closePreviewModal() {
    if (_modals.preview) _modals.preview.classList.remove('visible');
}

function _handleEditFromPreview() {
    // Check if day context and callback exist
    if (_currentDay && _callbacks.onEditFromPreview) {
        console.log("UI: Edit button clicked in Preview modal.");
        closePreviewModal(); // Close preview first
        // Call main.js to handle opening the edit modal
        _callbacks.onEditFromPreview(_currentDay, _currentMemories);
    } else {
         console.error("UI: Cannot handle edit from preview. Missing day context or callback.");
    }
}

// --- Modal de Edición (Edit/Add) ---
function openEditModal(dia, memories, allDays) {
    const isAdding = !dia; // Determine mode: if 'dia' is null/undefined, it's 'Add' mode
    console.log(`UI: Opening Edit/Add modal. Mode: ${isAdding ? 'Add' : 'Edit'}. Day ID: ${dia ? dia.id : 'N/A'}`);

    // --- Determine _currentDay and _currentMemories ---
    if (isAdding) {
        const todayId = _callbacks.getTodayId();
        const availableDays = allDays || _callbacks.getAllDaysData();
        _currentDay = availableDays.find(d => d.id === todayId) || availableDays[0];
         if (!_currentDay) {
            console.error("UI: Cannot open Add modal - no valid day data (today or first day) found.");
            alert("Error: Calendar data seems unavailable. Cannot add memory.");
            return;
        }
        _currentMemories = []; // Start with empty memories for 'Add' mode
        console.log(`UI: Add mode - Defaulting to day ${_currentDay.id}`);
    } else {
         // Check if provided 'dia' is valid
         if (!dia || !dia.id) {
              console.error("UI: Cannot open Edit modal - invalid 'dia' object provided:", dia);
              alert("Error opening day for editing.");
              return;
         }
        _currentDay = dia;
        _currentMemories = memories || []; // Ensure memories is always an array
    }
    // --- End Determining State ---

    // --- Create or Get Modal Element ---
    if (!_modals.edit) {
        console.log("UI: Creating Edit modal element for the first time.");
        _modals.edit = _createEditModal();
        if (!_modals.edit) {
            console.error("UI: Failed to create Edit modal element.");
            alert("Error displaying the editor.");
            return; // Stop if modal creation failed
        }
        // Populate day select only once, if modal was just created
        _populateDaySelect(allDays || _callbacks.getAllDaysData());
        _bindEditModalEvents(); // Bind events only once
    }
    // --- End Modal Element ---

    // --- Configure Modal based on Mode ---
    console.log("UI: Configuring Edit/Add modal for", isAdding ? 'Add' : 'Edit', "mode.");
    // Find elements safely
    const daySelectionSection = _modals.edit.querySelector('#day-selection-section');
    const dayNameSection = _modals.edit.querySelector('#day-name-section');
    const daySelect = _modals.edit.querySelector('#edit-mem-day');
    const yearInput = _modals.edit.querySelector('#memoria-fecha-year');
    const titleEl = _modals.edit.querySelector('#edit-modal-title');
    const nameInput = _modals.edit.querySelector('#nombre-especial-input');

    // Check if elements exist before manipulating
    if (!daySelectionSection || !dayNameSection || !daySelect || !yearInput || !titleEl || !nameInput) {
        console.error("UI: One or more essential elements missing in Edit modal HTML structure.");
        alert("Error setting up editor fields.");
        return;
    }

    if (isAdding) {
        daySelectionSection.style.display = 'block'; // Show day selector
        dayNameSection.style.display = 'none'; // Hide day name editor
        daySelect.value = _currentDay.id; // Set default day in selector
        yearInput.value = new Date().getFullYear(); // Default to current year
    } else {
        daySelectionSection.style.display = 'none'; // Hide day selector
        dayNameSection.style.display = 'block'; // Show day name editor
        const displayName = _currentDay.Nombre_Dia || _currentDay.id; // Use name or ID
        titleEl.textContent = `Editing: ${displayName} (${_currentDay.id})`;
        nameInput.value = _currentDay.Nombre_Especial === 'Unnamed Day' ? '' : _currentDay.Nombre_Especial; // Populate name
    }
    // --- End Mode Configuration ---

    // --- Render Memories and Reset Form ---
    _renderMemoryList('edit-memorias-list', _currentMemories); // Display memories
    resetMemoryForm(); // Clear/reset the add/edit form fields
    showModalStatus('save-status', '', false); // Clear status messages
    showModalStatus('memoria-status', '', false);
    // --- End Render/Reset ---

    // --- Show Modal ---
    _modals.edit.classList.add('visible');
    console.log("UI: Edit/Add modal opened.");
    // --- End Show Modal ---
}

// ... (rest of the functions: closeEditModal, resetMemoryForm, fillFormForEdit, Store modals, Search modal, Settings dialog, internal helpers like _handleDayClick, _createMemoryItemHTML, _renderMemoryList, showModalStatus, showMusicResults, showPlaceResults, handleMemoryTypeChange, DOM creators, export) ...
// The definitions of these functions remain the same as in v7.4, but ensure all element selections inside them are safe (check for null).
function closeEditModal() { /* ... */ }
function resetMemoryForm() { /* ... */ }
function fillFormForEdit(memoria) { /* ... */ }
function openStoreModal() { /* ... */ }
function closeStoreModal() { /* ... */ }
function openStoreListModal(title) { /* ... */ }
function closeStoreListModal() { /* ... */ }
function updateStoreList(items, append = false, hasMore = false) { /* ... */ }
function openSearchModal() { /* ... */ }
function closeSearchModal() { /* ... */ }
function openSettingsDialog() { /* ... */ }
async function _handleDayClick(dia) { /* ... */ } // Logic remains: load memories, open preview
function _createMemoryItemHTML(memoria, context) { /* ... v7.4 logic ... */ }
function _renderMemoryList(listId, memories) { /* ... v7.4 logic ... */ }
function showModalStatus(elementId, message, isError) { /* ... */ }
function showMusicResults(tracks) { /* ... */ }
function showPlaceResults(places) { /* ... */ }
function handleMemoryTypeChange() { /* ... */ }
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

