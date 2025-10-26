/*
 * ui.js (v7.16 - Remove Footer Debug, Verify Callback Storage)
 * - Removes temporary alert() and console.log from _setupFooter.
 * - Adds a log in init() to confirm _callbacks object structure after assignment.
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
    console.log("[ui.js] Initializing v7.16..."); // Version bump
    // 1. Store Callbacks
    console.log("[ui.js] Step 1: Storing callbacks...");
    _callbacks = { ..._callbacks, ...callbacks };
     // --- ADDED: Log the structure AFTER merging ---
     console.log("[ui.js] Callbacks stored. Verifying 'onFooterAction':", typeof _callbacks.onFooterAction);
     // Verify essential callback exists
    if (typeof _callbacks.onFooterAction !== 'function') {
         console.error("[ui.js] FATAL: Required callback 'onFooterAction' is missing or not a function!");
         throw new Error("UI Init failed: Required callback 'onFooterAction' is missing.");
    }

    // 2. Find DOM Elements
    console.log("[ui.js] Step 2: Finding essential DOM elements...");
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

    // 3. Setup Event Listeners
    console.log("[ui.js] Step 3: Setting up event listeners...");
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
 * --- Footer Event Listener Logic (Confirmed v7.11 Correctness, removed debug) ---
 */
function _setupFooter() {
    console.log("[ui.js] Setting up footer listener (v7.16 - debug removed)..."); // Version bump
    if(!_dom.footer) throw new Error("UI Init failed: Footer element not found.");
    if (typeof _callbacks.onFooterAction !== 'function') throw new Error("UI Init failed: Required callback 'onFooterAction' is missing.");
    console.log("[ui.js] Footer element and callback verified.");

    _dom.footer.addEventListener('click', (e) => {
        const button = e.target.closest('.dock-button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        console.log(`[ui.js] Footer button clicked! Action='${action}'`);

        if (action === 'add' || action === 'store' || action === 'shuffle') {
            // --- REMOVED DEBUG ---
            // console.log(`[ui.js] DEBUG: Is onFooterAction a function? `, typeof _callbacks.onFooterAction === 'function');
            // alert(`UI trying to call main.js for action: ${action}`);
            // --- END REMOVED ---

            // Call main.js if callback exists (already checked in init)
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
// ... (Modal functions remain largely the same, ensure safety checks) ...
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
async function _handleDayClick(dia) { /* ... v7.8 logic ... */ }
function _createMemoryItemHTML(memoria, context) { /* ... v7.8 logic ... */ }
function _renderMemoryList(listId, memories) { /* ... v7.8 logic ... */ }
function showModalStatus(elementId, message, isError) { /* ... v7.8 logic ... */ }
function showMusicResults(tracks) { /* ... v7.8 logic ... */ }
function showPlaceResults(places) { /* ... v7.8 logic ... */ }
function handleMemoryTypeChange() { /* ... v7.8 logic ... */ }

// --- 6. Creación de Elementos del DOM (Constructores) ---
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
export const ui = {
    init,
    updateLoginUI,
    drawCalendar, // Exporting the restored drawing function
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

