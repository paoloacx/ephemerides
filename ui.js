/*
 * ui.js (v7.7 - Fix Calendar Draw, Spotlight Undefined, Footer Callback)
 * - Adds try/catch within drawCalendar loop for robustness.
 * - Fixes _createMemoryItemHTML to handle undefined memory properties.
 * - Definitively fixes _setupFooter callback logic.
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
    console.log("UI: Initializing v7.7..."); // Version bump
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


    // 3. Setup Event Listeners with Error Handling
    console.log("UI Step 3: Setting up event listeners...");
    try {
        _setupNavigation();
        _setupHeader();
        _setupFooter(); // <-- This is now fixed
        console.log("UI Step 3: Event listeners set up successfully.");
    } catch (listenerError) {
         console.error("UI FATAL: Error setting up event listeners:", listenerError);
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
    // --- ADDED: Try...Catch around the loop ---
    try {
        days.forEach(dia => {
            // Robust check for valid day object
            if (!dia || typeof dia !== 'object' || !dia.id || typeof dia.id !== 'string' || dia.id.length !== 5) {
                 console.warn("UI: Skipping invalid day object in drawCalendar loop:", dia);
                 return; // Skip this iteration
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
        }); // End forEach loop
    } catch (loopError) {
         console.error("UI ERROR during drawCalendar loop:", loopError);
         // Display an error message within the grid
         grid.innerHTML = `<p style="color:red;">Error creating day buttons: ${loopError.message}</p>`;
    }

    // Append the fragment (even if empty due to errors)
    _dom.appContent.appendChild(grid);
    // --- ADDED: Final log AFTER appending ---
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

    _dom.spotlightList.innerHTML = ''; // Clear previous
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

        // --- Use the corrected HTML generator ---
        itemDiv.innerHTML = _createMemoryItemHTML(mem, 'spotlight');

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

/** Attaches listeners to month navigation buttons. */
function _setupNavigation() {
    console.log("UI: Setting up navigation listeners...");
    if(_dom.navPrev) {
        _dom.navPrev.onclick = () => {
             console.log("UI: Prev month clicked.");
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
             openSearchModal();
        }
    } else {
        console.warn("UI: Header search button (#header-search-btn) not found.");
    }
    // Login button setup is handled in updateLoginUI
}

/**
 * --- CORRECTED AGAIN: Footer Event Listener Logic ---
 * Ensures the callback to main.js is reliably called for relevant actions.
 */
function _setupFooter() {
    console.log("UI: Setting up footer listener (v7.6)...");
    if(!_dom.footer) {
         console.error("UI FATAL: Footer element (.footer-dock) not found. Cannot set up footer listeners.");
         throw new Error("UI Init failed: Footer element not found.");
    }

    // Use event delegation on the footer element
    _dom.footer.addEventListener('click', (e) => {
        // Find the closest ancestor button element with the data-action
        const button = e.target.closest('.dock-button[data-action]');
        if (!button) {
            // console.log("UI Footer Click: Not on a relevant button.");
            return; // Click was not on a button with data-action
        }

        // Get the action from the button's data attribute
        const action = button.dataset.action;
        console.log(`UI: Footer button clicked with action='${action}'`); // Log the detected action

        // --- THE FIX: Correctly check action and call callback ---
        if (action === 'add' || action === 'store' || action === 'shuffle') {
            // These actions require main.js logic
            if (_callbacks.onFooterAction) {
                console.log(`UI: Calling onFooterAction callback for '${action}'...`);
                _callbacks.onFooterAction(action); // Call main.js
            } else {
                console.error(`UI: onFooterAction callback is missing! Cannot execute action: ${action}`);
                alert(`Error: Action '${action}' is not configured.`);
            }
        } else if (action === 'settings') {
            // This action is handled internally by ui.js
            console.log("UI: Handling 'settings' action internally.");
            openSettingsDialog();
        } else {
            // Log any other unexpected actions
            console.warn(`UI: Click on footer button with unknown action: ${action}`);
        }
        // --- END FIX ---
    });
    console.log("UI: Footer listener attached successfully.");
}



// --- 4. Creación y Manejo de Modales ---
// ... (Modal functions largely unchanged, ensure safety checks) ...
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

/**
 * Handles clicks on day buttons or spotlight items. Always opens Preview first.
 * @param {object} dia - Minimal day object { id, Nombre_Dia }
 */
async function _handleDayClick(dia) {
    // Basic validation
    if (!dia || !dia.id) {
        console.error("UI: Invalid day object passed to _handleDayClick:", dia);
        return;
    }
    console.log(`UI: Handling click for day ${dia.id}. Opening Preview modal...`);

    // Always open Preview modal first
    try {
        // Show loading state *inside* the preview modal?
        // ui.showPreviewLoading(true); // Example
        const memories = await _callbacks.loadMemoriesForDay(dia.id);
        // ui.showPreviewLoading(false);
        console.log(`UI: Memories loaded for ${dia.id}. Opening Preview modal.`);

        // Ensure 'dia' object has Nombre_Dia for the preview title
        // If Nombre_Dia wasn't passed (e.g., from spotlight fallback), try to find it
        if (!dia.Nombre_Dia) {
             const allDays = _callbacks.getAllDaysData();
             const dayData = allDays.find(d => d.id === dia.id);
             dia.Nombre_Dia = dayData ? dayData.Nombre_Dia : dia.id; // Use name or fallback to ID
        }
        openPreviewModal(dia, memories); // Open preview with loaded data

    } catch (error) {
        // ui.showPreviewLoading(false);
        console.error(`UI: Error loading memories for day ${dia.id} click:`, error);
        alert(`Error loading memories for ${dia.Nombre_Dia || dia.id}. Please try again.`);
    }
}


/**
 * Generates HTML for a single memory item, adapting for different contexts.
 * @param {object} memoria - The memory data object.
 * @param {string} context - 'spotlight', 'preview-modal', or 'edit-modal'.
 * @returns {string} - The HTML string for the memory item.
 */
function _createMemoryItemHTML(memoria, context) {
    let contentHTML = '';
    let artworkHTML = ''; // For music artwork

    // --- Year Extraction (Safe) ---
    let yearStr = '????'; // Default if date is invalid/missing
    try {
        if (memoria.Fecha_Original?.toDate) { // Check if it's a Firestore Timestamp
            yearStr = memoria.Fecha_Original.toDate().getFullYear().toString();
        } else if (typeof memoria.Fecha_Original === 'string' && memoria.Fecha_Original.length >= 4) {
            // Handle cases where it might be a 'YYYY-MM-DD' string after edits
            yearStr = memoria.Fecha_Original.substring(0, 4);
            // Basic validation for the extracted year string
            if (!/^\d{4}$/.test(yearStr)) yearStr = '????';
        } else if (memoria.Fecha_Original instanceof Date) { // Handle JS Date object
             yearStr = memoria.Fecha_Original.getFullYear().toString();
        }
    } catch (e) {
        console.warn("UI: Error extracting year from Fecha_Original:", memoria.Fecha_Original, e);
    }
    // --- End Year Extraction ---

    // --- Icon Selection ---
    let icon = 'notes'; // Default icon
    // Use optional chaining for safety when accessing memoria.Tipo
    switch (memoria?.Tipo) {
        case 'Place': icon = 'place'; break;
        case 'Music': icon = 'music_note'; break;
        case 'Image': icon = 'image'; break;
        default: icon = 'notes'; break; // Explicit default
    }
    // --- End Icon Selection ---

    // --- Build HTML based on Context ---
    if (context === 'spotlight') {
        // Spotlight format: [Year Box] [Icon] [Text Content Div [Span]]
        contentHTML = `<span class="spotlight-year-box">${yearStr}</span>`; // Year box
        contentHTML += `<span class="material-icons-outlined">${icon}</span>`; // Icon
        contentHTML += `<div class="spotlight-memory-content"><span>`; // Start content wrapper

        // Add specific text content (handle undefined properties safely)
        switch (memoria?.Tipo) {
            case 'Place':
                contentHTML += `${memoria.LugarNombre || 'Place'}`; // Fallback text
                break;
            case 'Music':
                if (memoria.CancionData?.trackName) {
                    contentHTML += `<strong>${memoria.CancionData.trackName}</strong> by ${memoria.CancionData.artistName}`;
                     // Add artwork if available (for spotlight too?)
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
                 const maxLength = 40; // Max length for spotlight items
                 // Truncate if necessary
                 contentHTML += description.length > maxLength ? description.substring(0, maxLength) + '...' : description;
                break;
        }
        contentHTML += `</span></div>`; // Close content span and div

    } else { // Context is 'preview-modal' or 'edit-modal'
        // Format: [Small Year] [Icon Span + Text Span]
        contentHTML = `<small>${yearStr}</small>`; // Year as small text
        contentHTML += `<span><span class="material-icons-outlined">${icon}</span> `; // Start content span + icon

        // Add specific text content (handle undefined properties safely)
        switch (memoria?.Tipo) {
            case 'Place':
                contentHTML += `${memoria.LugarNombre || 'Place'}`;
                break;
            case 'Music':
                if (memoria.CancionData?.trackName) {
                    contentHTML += `<strong>${memoria.CancionData.trackName}</strong> by ${memoria.CancionData.artistName}`;
                    if(memoria.CancionData.artworkUrl60) {
                        // Artwork only in non-spotlight contexts? Decide based on design.
                        artworkHTML = `<img src="${memoria.CancionData.artworkUrl60}" class="memoria-artwork" onerror="this.style.display='none'">`;
                    }
                } else {
                    contentHTML += `${memoria.CancionInfo || 'Music'}`;
                }
                break;
            case 'Image':
                contentHTML += `${memoria.Descripcion || 'Image'}`;
                // Add view link only in modals, not spotlight
                if (memoria.ImagenURL) {
                    contentHTML += ` <small>(<a href="${memoria.ImagenURL}" target="_blank" rel="noopener">View</a>)</small>`;
                }
                break;
            case 'Text':
            default:
                 // Show full description in modals
                 contentHTML += memoria.Descripcion || 'Memory';
                break;
        }
         contentHTML += `</span>`; // Close content span
    }
    // --- End Building HTML ---

    // --- Actions (Edit/Delete buttons) only for 'edit-modal' context ---
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
    // --- End Actions ---

    // --- Combine and Return ---
    if (context === 'spotlight') {
         // Spotlight structure: [Artwork (optional)] [Year Box] [Icon] [Content Div]
         return `${artworkHTML}${contentHTML}`; // artworkHTML might be empty
    } else {
         // Other structure: [Artwork (optional)] [Content Div [Small Year] [Content Span]] [Actions (optional)]
         return `${artworkHTML}<div class="memoria-item-content">${contentHTML}</div>${actionsHTML}`;
    }
    // --- End Combine ---
}


/**
 * Renders a list of memory items into a specified container.
 * @param {string} listId - The ID of the container element (e.g., 'preview-memorias-list').
 * @param {Array<object>} memories - The array of memory objects to render.
 */
function _renderMemoryList(listId, memories) {
    const listDiv = document.getElementById(listId);
    if (!listDiv) {
         console.error(`UI: Could not find list container #${listId} to render memories.`);
         return;
    }

    listDiv.innerHTML = ''; // Clear previous content
    // Determine placeholder text based on context
    const placeholderText = listId === 'preview-memorias-list' ? 'No memories found for this day.'
                         : listId === 'edit-memorias-list' ? 'No memories added yet. Use the form below.'
                         : 'No memories available.'; // Default fallback

    if (!memories || memories.length === 0) {
        listDiv.innerHTML = `<p class="list-placeholder">${placeholderText}</p>`;
        return;
    }

    // Determine context based on the list ID
    const context = listId.includes('preview') ? 'preview-modal'
                  : listId.includes('edit') ? 'edit-modal'
                  : 'unknown'; // Default if ID doesn't match expected patterns

    const fragment = document.createDocumentFragment();
    let itemsRendered = 0;
    memories.forEach(mem => {
        // Basic validation of memory object
        if (!mem || typeof mem !== 'object' || !mem.id) {
             console.warn(`UI: Skipping invalid memory object in _renderMemoryList (ID: ${listId}):`, mem);
             return; // Skip invalid memory objects
        }
        const itemDiv = document.createElement('div');
        // Apply base class, context-specific class might be needed if styling differs significantly
        itemDiv.className = 'memoria-item';
        try {
            itemDiv.innerHTML = _createMemoryItemHTML(mem, context); // Generate HTML
            fragment.appendChild(itemDiv);
            itemsRendered++;
        } catch (renderError) {
             console.error(`UI: Error rendering memory item (ID: ${mem.id}) in list ${listId}:`, renderError, mem);
             // Optionally add an error placeholder for this item
             // const errorDiv = document.createElement('div');
             // errorDiv.className = 'memoria-item error';
             // errorDiv.textContent = 'Error rendering this memory.';
             // fragment.appendChild(errorDiv);
        }
    });
    listDiv.appendChild(fragment); // Append all items at once
    // console.log(`UI: Rendered ${itemsRendered} memories into #${listId}.`);
}


// ... (showModalStatus, showMusicResults, showPlaceResults, handleMemoryTypeChange remain the same) ...
function showModalStatus(elementId, message, isError) { /* ... */ }
function showMusicResults(tracks) { /* ... */ }
function showPlaceResults(places) { /* ... */ }
function handleMemoryTypeChange() { /* ... */ }


// --- 6. Creación de Elementos del DOM (Constructores) ---
// ... (Ensure all _create... functions have try/catch blocks and return null on failure) ...
function _createPreviewModal() { /* ... v7.4 logic with try/catch ... */ }
function _createEditModal() { /* ... v7.4 logic with try/catch ... */ }
function _bindEditModalEvents() { /* ... v7.4 logic with safety checks ... */ }
function _showConfirmDelete(memoria) { /* ... v7.4 logic with safety checks ... */ }
function _populateDaySelect(allDays) { /* ... v7.4 logic with safety checks ... */ }
function _createStoreModal() { /* ... v7.4 logic with try/catch ... */ }
function _createStoreCategoryButton(type, icon, label) { /* ... v7.4 logic ... */ }
function _createStoreListModal() { /* ... v7.4 logic with try/catch ... */ }
function _createStoreListItem(item) { /* ... v7.4 logic with safety checks ... */ }
function _createSearchModal() { /* ... v7.4 logic with try/catch ... */ }
function _createDialog(id, title, message) { /* ... v7.4 logic with try/catch ... */ }


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
    // handleMemoryTypeChange, // Keep internal if only called internally
    openStoreModal,
    closeStoreModal,
    openStoreListModal,
    closeStoreListModal,
    updateStoreList,
    openSearchModal,
    closeSearchModal,
    openSettingsDialog, // Keep if called internally by footer setup
};

