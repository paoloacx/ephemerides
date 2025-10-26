/* ui.js - v3.1 (Con Modales de Almacén) */

// --- SVG Icons ---
const editIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg>`;
const deleteIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m3 0l-.5 8.5a.5.5 0 1 0 .998.06l.5-8.5a.5.5 0 1 0-.998.06m3 .5l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Z"/></svg>`;
const pencilIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/></svg>`;
const loginIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M10 3.5a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 1 1 0v2A1.5 1.5 0 0 1 9.5 14h-8A1.5 1.5 0 0 1 0 12.5v-9A1.5 1.5 0 0 1 1.5 2h8A1.5 1.5 0 0 1 11 3.5v2a.5.5 0 0 1-1 0z"/><path fill-rule="evenodd" d="M4.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H14.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708z"/></svg>`;

// --- Selectores de Elementos ---
const appContent = document.getElementById("app-content");
const monthNameDisplayEl = document.getElementById("month-name-display");

// --- Estado Interno de UI ---
let _onDayClickCallback = null;
let _onEditMemoryClickCallback = null;
let _onDeleteMemoryClickCallback = null;
let _onSaveDayNameCallback = null;
let _onSaveMemorySubmitCallback = null;
let _onSearchMusicCallback = null;
let _onSearchPlaceCallback = null;
// Callbacks para el Almacén
let _onStoreCategoryClickCallback = null;
let _onStoreLoadMoreCallback = null;


// --- Funciones de Configuración (Setup) ---

/**
 * Configura los botones de navegación de mes.
 * @param {function} onPrev - Callback para el botón 'prev'.
 * @param {function} onNext - Callback para el botón 'next'.
 */
export function setupNavigation(onPrev, onNext) {
    document.getElementById("prev-month").onclick = onPrev;
    document.getElementById("next-month").onclick = onNext;
}

/**
 * Configura los botones del footer.
 * @param {function} onSearch - Callback para 'Search'.
 * @param {function} onShuffle - Callback para 'Shuffle'.
 * @param {function} onAdd - Callback para 'Add Memory'.
 * @param {function} onStore - Callback para 'Store'.
 */
export function setupFooter(onSearch, onShuffle, onAdd, onStore) {
    // document.getElementById('btn-hoy').onclick = onToday; // Eliminado
    document.getElementById('btn-buscar').onclick = onSearch;
    document.getElementById('btn-shuffle').onclick = onShuffle;
    document.getElementById('btn-add-memory').onclick = onAdd;
    document.getElementById('btn-store').onclick = onStore; // Añadido
}

/**
 * Configura el botón de refrescar.
 * @param {function} onRefresh - Callback para 'Refresh'.
 */
export function setupRefreshButton(onRefresh) {
// ... (código existente sin cambios)
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.onclick = onRefresh;
    }
}

// --- Funciones de Renderizado (Dibujo) ---

/**
 * Actualiza la UI de login en el header.
 * @param {object|null} user - El objeto de usuario, o null.
// ... (código existente sin cambios)
 * @param {function} logoutCallback - Función a llamar al hacer clic en 'logout'.
 */
export function updateLoginUI(user, loginCallback, logoutCallback) {
// ... (código existente sin cambios)
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
// ... (código existente sin cambios)
    const userImg = document.getElementById('user-img');
    
    if (user) {
// ... (código existente sin cambios)
        if (userInfo) userInfo.style.display = 'flex';
        if (userName) userName.textContent = user.displayName || user.email || 'User';
// ... (código existente sin cambios)
        if (userImg) userImg.src = user.photoURL || 'https://placehold.co/30x30/ccc/fff?text=?';
        if (loginBtn) {
// ... (código existente sin cambios)
            loginBtn.innerHTML = loginIconSVG;
            loginBtn.title = "Logout";
// ... (código existente sin cambios)
            loginBtn.onclick = logoutCallback;
        }
    } else {
// ... (código existente sin cambios)
        if (userInfo) userInfo.style.display = 'none';
        if (loginBtn) {
// ... (código existente sin cambios)
            loginBtn.innerHTML = `<img src="https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1OLUbq VilNfRHXkvdR8VdVAbkuQGcuSgs5nbDbpaE8nhzo6g=s0-w24-h24-p-k-rw-no" alt="G" style="width: 24px; height: 24px; border-radius: 50%;">`;
            loginBtn.title = "Login with Google";
// ... (código existente sin cambios)
            loginBtn.onclick = loginCallback;
        }
    }
}

/**
 * Muestra un mensaje de carga en el contenido principal.
// ... (código existente sin cambios)
 */
export function setLoading(message) {
    appContent.innerHTML = `<p>${message}</p>`;
}

/**
 * Dibuja el grid del calendario.
// ... (código existente sin cambios)
 * @param {function} onDayClick - Callback a ejecutar al hacer clic en un día.
 */
export function drawCalendarGrid(daysOfMonth, expectedDays, todayId, currentMonthIndex, onDayClick) {
// ... (código existente sin cambios)
    appContent.innerHTML = `<div class="calendario-grid" id="grid-dias"></div>`;
    const grid = document.getElementById("grid-dias");
// ... (código existente sin cambios)
    const today = new Date(); // Necesario para comparar el mes

    if (daysOfMonth.length === 0) {
// ... (código existente sin cambios)
        grid.innerHTML = "<p>No days found.</p>";
        return;
    }
    
    if (daysOfMonth.length !== expectedDays) {
// ... (código existente sin cambios)
        console.warn(`ALERT: Found ${daysOfMonth.length}/${expectedDays} days for month ${currentMonthIndex}.`);
    }

// ... (código existente sin cambios)
    // Guarda el callback globalmente
    _onDayClickCallback = onDayClick;

    daysOfMonth.forEach(dia => {
// ... (código existente sin cambios)
        const btn = document.createElement("button");
        btn.className = "dia-btn";
// ... (código existente sin cambios)
        btn.innerHTML = `<span class="dia-numero">${dia.id.substring(3)}</span>`;
        btn.dataset.diaId = dia.id; // Guardamos el ID

        if (dia.id === todayId && currentMonthIndex === today.getMonth()) {
// ... (código existente sin cambios)
            btn.classList.add('dia-btn-today');
        }

// ... (código existente sin cambios)
        // Asigna el evento
        btn.addEventListener('click', () => _onDayClickCallback(dia));
        grid.appendChild(btn);
    });
// ... (código existente sin cambios)
    console.log(`Rendered ${daysOfMonth.length} buttons.`);
}

/**
 * Actualiza el nombre del mes en la navegación.
// ... (código existente sin cambios)
 */
export function updateMonthName(name) {
    monthNameDisplayEl.textContent = name;
}

/**
 * Dibuja la lista de resultados de búsqueda.
// ... (código existente sin cambios)
 * @param {function} onResultClick - Callback al hacer clic en un resultado.
 */
export function drawSearchResults(term, results, onResultClick) {
    if (results.length === 0) {
// ... (código existente sin cambios)
        appContent.innerHTML = `<p>No results for "${term}".</p>`;
        return;
    }
    
    console.log(`Found ${results.length}.`);
// ... (código existente sin cambios)
    appContent.innerHTML = `<h3>Results for "${term}" (${results.length}):</h3>`;
    const resultsList = document.createElement('div');
// ... (código existente sin cambios)
    resultsList.id = 'search-results-list';
    
    results.forEach(mem => {
// ... (código existente sin cambios)
        const itemDiv = document.createElement('div');
        itemDiv.className = 'memoria-item search-result';
// ... (código existente sin cambios)
        let fechaStr = 'Unknown date';
        if (mem.Fecha_Original?.toDate) {
// ... (código existente sin cambios)
            try {
                fechaStr = mem.Fecha_Original.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
// ... (código existente sin cambios)
            } catch(e) { /* fallback */ }
        }
        
        let contentHTML = `<small><b>${mem.diaNombre} (${mem.diaId})</b> - ${fechaStr}</small>`;
// ... (código existente sin cambios)
        switch (mem.Tipo) {
            case 'Lugar': contentHTML += `📍 ${mem.LugarNombre || 'Place'}`; break;
// ... (código existente sin cambios)
            case 'Musica':
                if (mem.CancionData?.trackName) contentHTML += `🎵 <strong>${mem.CancionData.trackName}</strong> by ${mem.CancionData.artistName}`;
// ... (código existente sin cambios)
                else contentHTML += `🎵 ${mem.CancionInfo || 'Music'}`;
                break;
            case 'Imagen':
// ... (código existente sin cambios)
                contentHTML += `🖼️ Image`;
                if (mem.ImagenURL) contentHTML += ` (<a href="${mem.ImagenURL}" target="_blank">View</a>)`;
// ... (código existente sin cambios)
                if (mem.Descripcion) contentHTML += `<br>${mem.Descripcion}`;
                break;
// ... (código existente sin cambios)
            default: contentHTML += mem.Descripcion || ''; break;
        }
        itemDiv.innerHTML = `<div class="memoria-item-content">${contentHTML}</div>`;
// ... (código existente sin cambios)
        itemDiv.style.cursor = 'pointer';
        itemDiv.onclick = () => onResultClick(mem); // Llama al callback
// ... (código existente sin cambios)
        resultsList.appendChild(itemDiv);
    });
    appContent.appendChild(resultsList);
}

/** Muestra un error en la página principal. */
export function showAppError(message) {
// ... (código existente sin cambios)
    appContent.innerHTML = `<p class="error">${message}</p>`;
}

/** Pide al usuario un término de búsqueda. */
export function promptSearch() {
// ... (código existente sin cambios)
    return prompt("Search memories:");
}

// --- UI: Modales (Preview) ---

/** Abre el modal de vista previa. */
export function openPreviewModal(dia, onEditClick) {
// ... (código existente sin cambios)
    let modal = document.getElementById('preview-modal');
    if (!modal) {
// ... (código existente sin cambios)
        modal = _createPreviewModal(onEditClick);
    }
    
    document.getElementById('preview-title').textContent = `${dia.Nombre_Dia} ${dia.Nombre_Especial !== 'Unnamed Day' ? '('+dia.Nombre_Especial+')' : ''}`;
// ... (código existente sin cambios)
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);
    
// ... (código existente sin cambios)
    // Mostramos 'loading' mientras main.js busca las memorias
    showMemoryListLoading('preview-memorias-list');
}

/** Cierra el modal de vista previa. */
export function closePreviewModal() {
// ... (código existente sin cambios)
    const modal = document.getElementById('preview-modal');
    if (modal) {
// ... (código existente sin cambios)
        modal.classList.remove('visible');
        setTimeout(() => { modal.style.display = 'none'; }, 200);
    }
}

/** Crea el HTML del modal de vista previa (función helper). */
function _createPreviewModal(onEditClick) {
// ... (código existente sin cambios)
    const modal = document.createElement('div');
    modal.id = 'preview-modal';
// ... (código existente sin cambios)
    modal.className = 'modal-preview';
    modal.innerHTML = `
        <div class="modal-preview-content">
// ... (código existente sin cambios)
            <div class="modal-preview-header">
                <h3 id="preview-title"></h3>
// ... (código existente sin cambios)
                <button id="edit-from-preview-btn" title="Edit this day">${pencilIconSVG}</button>
            </div>
            <div class="modal-preview-memorias">
// ... (código existente sin cambios)
                <h4>Memories:</h4>
                <div id="preview-memorias-list">Loading...</div>
// ... (código existente sin cambios)
            </div>
            <button id="close-preview-btn" class="aqua-button">Close</button>
// ... (código existente sin cambios)
        </div>`;
    document.body.appendChild(modal);
    
    document.getElementById('close-preview-btn').onclick = closePreviewModal;
// ... (código existente sin cambios)
    modal.onclick = (e) => {
        if (e.target.id === 'preview-modal') closePreviewModal();
// ... (código existente sin cambios)
    };
    
    document.getElementById('edit-from-preview-btn').onclick = onEditClick;
// ... (código existente sin cambios)
    return modal;
}

// --- UI: Modales (Edición) ---

/**
 * Abre el modal de edición/añadir.
// ... (código existente sin cambios)
 * @param {function} onSearchPlace - Callback para buscar lugar (recibe término).
 */
export function openEditModal(day, allDays, onSaveDayName, onSaveMemorySubmit, onSearchMusic, onSearchPlace) {
// ... (código existente sin cambios)
    const isAdding = !day;
    let modal = document.getElementById('edit-add-modal');
// ... (código existente sin cambios)
    
    // Guardar callbacks globalmente
    _onSaveDayNameCallback = onSaveDayName;
// ... (código existente sin cambios)
    _onSaveMemorySubmitCallback = onSaveMemorySubmit;
    _onSearchMusicCallback = onSearchMusic;
// ... (código existente sin cambios)
    _onSearchPlaceCallback = onSearchPlace;

    if (!modal) {
// ... (código existente sin cambios)
        modal = _createEditModal(allDays);
    }

// ... (código existente sin cambios)
    // Configurar modal basado en modo (Añadir vs Editar)
    const daySelectionSection = document.getElementById('day-selection-section');
// ... (código existente sin cambios)
    const dayNameSection = document.getElementById('day-name-section');
    const daySelect = document.getElementById('edit-mem-day');
// ... (código existente sin cambios)
    const yearInput = document.getElementById('edit-mem-year');
    const titleEl = document.getElementById('edit-modal-title');
// ... (código existente sin cambios)
    const nameInput = document.getElementById('nombre-especial-input');
    const memoriesList = document.getElementById('edit-memorias-list');
// ... (código existente sin cambios)
    const formTitle = document.getElementById('memory-form-title');

    if (isAdding) {
// ... (código existente sin cambios)
        if(daySelectionSection) daySelectionSection.style.display = 'block';
        if(dayNameSection) dayNameSection.style.display = 'none';
// ... (código existente sin cambios)
        if (daySelect && day) daySelect.value = day.id; // Usa el día actual (de 'day')
        if(yearInput) yearInput.value = new Date().getFullYear();
// ... (código existente sin cambios)
        formTitle.textContent = "Add New Memory";
        memoriesList.innerHTML = '<p class="list-placeholder">Add memories below.</p>';
// ... (código existente sin cambios)
    } else {
        if(daySelectionSection) daySelectionSection.style.display = 'none';
// ... (código existente sin cambios)
        if(dayNameSection) dayNameSection.style.display = 'block';
        titleEl.textContent = `Editing: ${day.Nombre_Dia} (${day.id})`;
// ... (código existente sin cambios)
        nameInput.value = day.Nombre_Especial === 'Unnamed Day' ? '' : day.Nombre_Especial;
        formTitle.textContent = "Add/Edit Memories";
// ... (código existente sin cambios)
        showMemoryListLoading('edit-memorias-list'); // Mostrar 'loading'
    }
    
    resetMemoryForm();
// ... (código existente sin cambios)
    handleMemoryTypeChange();
    document.getElementById('save-status').textContent = '';
// ... (código existente sin cambios)
    document.getElementById('memoria-status').textContent = '';
    const confirmDialog = document.getElementById('confirm-delete-dialog');
// ... (código existente sin cambios)
    if(confirmDialog) confirmDialog.style.display = 'none';
    
    modal.style.display = 'flex';
// ... (código existente sin cambios)
    setTimeout(() => modal.classList.add('visible'), 10);
}

/** Cierra el modal de edición. */
export function closeEditModal() {
// ... (código existente sin cambios)
    const modal = document.getElementById('edit-add-modal');
    if (modal) {
// ... (código existente sin cambios)
        modal.classList.remove('visible');
        setTimeout(() => { modal.style.display = 'none'; }, 200);
    }
// ... (código existente sin cambios)
    // Limpiar callbacks
    _onSaveDayNameCallback = null;
// ... (código existente sin cambios)
    _onSaveMemorySubmitCallback = null;
    _onSearchMusicCallback = null;
// ... (código existente sin cambios)
    _onSearchPlaceCallback = null;
}

/** Crea el HTML del modal de edición (función helper). */
function _createEditModal(allDays) {
// ... (código existente sin cambios)
    const modal = document.createElement('div');
    modal.id = 'edit-add-modal';
// ... (código existente sin cambios)
    modal.className = 'modal-edit';
    modal.innerHTML = `
        <div class="modal-content">
// ... (código existente sin cambios)
            <div class="modal-content-scrollable">
                <div class="modal-section" id="day-selection-section" style="display: none;">
                     <h3>Add Memory To...</h3>
// ... (código existente sin cambios)
                     <label for="edit-mem-day">Day (MM-DD):</label>
                     <select id="edit-mem-day"></select>
// ... (código existente sin cambios)
                     <label for="edit-mem-year">Year of Memory:</label>
                     <input type="number" id="edit-mem-year" placeholder="YYYY" min="1800" max="${new Date().getFullYear() + 1}" required>
// ... (código existente sin cambios)
                </div>
                <div class="modal-section" id="day-name-section" style="display: none;">
                    <h3 id="edit-modal-title"></h3>
// ... (código existente sin cambios)
                    <label for="nombre-especial-input">Name this day:</label>
                    <input type="text" id="nombre-especial-input" placeholder="e.g., Pizza Day" maxlength="25">
// ... (código existente sin cambios)
                    <button id="save-name-btn" class="aqua-button">Save Day Name</button>
                    <p id="save-status"></p>
// ... (código existente sin cambios)
                </div>
                <div class="modal-section memorias-section">
                    <h4>Memories</h4>
// ... (código existente sin cambios)
                    <div id="edit-memorias-list">Loading...</div>
                    <form id="memory-form">
                         <p class="section-description" id="memory-form-title">Add/Edit Memory</p>
// ... (código existente sin cambios)
                         <label for="memoria-fecha">Original Date:</label>
                         <input type="date" id="memoria-fecha" required>
// ... (código existente sin cambios)
                         <label for="memoria-type">Type:</label>
                         <select id="memoria-type">
                             <option value="Texto">Description</option>
// ... (código existente sin cambios)
                             <option value="Lugar">Place</option>
                             <option value="Musica">Music</option>
// ... (código existente sin cambios)
                             <option value="Imagen">Image</option>
                         </select>
                         <div class="add-memory-input-group" id="input-type-Texto"><label for="memoria-desc">Description:</label><textarea id="memoria-desc" placeholder="Write memory..."></textarea></div>
// ... (código existente sin cambios)
                         <div class="add-memory-input-group" id="input-type-Lugar"><label for="memoria-place-search">Search:</label><input type="text" id="memoria-place-search"><button type="button" class="aqua-button" id="btn-search-place">Search</button><div id="place-results"></div></div>
                         <div class="add-memory-input-group" id="input-type-Musica"><label for="memoria-music-search">Search:</label><input type="text" id="memoria-music-search"><button type="button" class="aqua-button" id="btn-search-itunes">Search</button><div id="itunes-results"></div></div>
// ... (código existente sin cambios)
                         <div class="add-memory-input-group" id="input-type-Imagen"><label for="memoria-image-upload">Image:</label><input type="file" id="memoria-image-upload" accept="image/*"><label for="memoria-image-desc">Desc:</label><input type="text" id="memoria-image-desc"><div id="image-upload-status"></div></div>
                         <button type="submit" id="save-memoria-btn" class="aqua-button">Add Memory</button>
// ... (código existente sin cambios)
                         <p id="memoria-status"></p>
                    </form>
                </div>
// ... (código existente sin cambios)
                <div id="confirm-delete-dialog" style="display: none;">
                    <p id="confirm-delete-text"></p>
// ... (código existente sin cambios)
                    <button id="confirm-delete-no" class="aqua-button">Cancel</button>
                    <button id="confirm-delete-yes" class="aqua-button delete-confirm">Delete</button>
// ... (código existente sin cambios)
                </div>
             </div>
            <div class="modal-main-buttons">
// ... (código existente sin cambios)
                <button id="close-edit-add-btn">Close</button>
            </div>
// ... (código existente sin cambios)
        </div>`;
    document.body.appendChild(modal);
    
    // Poblar el <select> de días
// ... (código existente sin cambios)
    const daySelect = modal.querySelector('#edit-mem-day');
    if (daySelect && daySelect.options.length === 0) {
// ... (código existente sin cambios)
        allDays.forEach(d => {
            const o=document.createElement('option');
// ... (código existente sin cambios)
            o.value=d.id;
            o.textContent=d.Nombre_Dia;
// ... (código existente sin cambios)
            daySelect.appendChild(o);
        });
    }
    
// ... (código existente sin cambios)
    // Asignar listeners estáticos
    document.getElementById('close-edit-add-btn').onclick = closeEditModal;
// ... (código existente sin cambios)
    modal.onclick = (e) => { if (e.target.id === 'edit-add-modal') closeEditModal(); };
    document.getElementById('confirm-delete-no').onclick = () => {
// ... (código existente sin cambios)
        document.getElementById('confirm-delete-dialog').style.display = 'none';
    };
    document.getElementById('memoria-type').addEventListener('change', handleMemoryTypeChange);
    
// ... (código existente sin cambios)
    // Asignar listeners que llaman a callbacks
    document.getElementById('btn-search-itunes').onclick = () => {
// ... (código existente sin cambios)
        const term = document.getElementById('memoria-music-search').value.trim();
        if (_onSearchMusicCallback) _onSearchMusicCallback(term);
    };
    document.getElementById('btn-search-place').onclick = () => {
// ... (código existente sin cambios)
        const term = document.getElementById('memoria-place-search').value.trim();
        if (_onSearchPlaceCallback) _onSearchPlaceCallback(term);
    };
    document.getElementById('memory-form').onsubmit = (e) => {
// ... (código existente sin cambios)
        e.preventDefault();
        if (_onSaveMemorySubmitCallback) _onSaveMemorySubmitCallback();
    };
    document.getElementById('save-name-btn').onclick = () => {
// ... (código existente sin cambios)
        const newName = document.getElementById('nombre-especial-input').value.trim();
        if (_onSaveDayNameCallback) _onSaveDayNameCallback(newName);
    };
    
    const fileInput = document.getElementById('memoria-image-upload');
// ... (código existente sin cambios)
    const imageStatus = document.getElementById('image-upload-status');
    if(fileInput && imageStatus) {
// ... (código existente sin cambios)
        fileInput.onchange = (e) => imageStatus.textContent = e.target.files?.[0] ? `Selected: ${e.target.files[0].name}` : '';
    }
    
    return modal;
}

// --- UI: Lista de Memorias ---

/**
 * Dibuja la lista de memorias en un div (preview o edit).
// ... (código existente sin cambios)
 * @param {function} onDelete - Callback para borrar (recibe memoria).
 */
export function drawMemoriesList(listId, memories, onEdit, onDelete) {
// ... (código existente sin cambios)
    const memoriasListDiv = document.getElementById(listId);
    if (!memoriasListDiv) return;

    if (memories.length === 0) {
// ... (código existente sin cambios)
        memoriasListDiv.innerHTML = '<p class="list-placeholder">No memories yet.</p>';
        return;
    }

// ... (código existente sin cambios)
    memoriasListDiv.innerHTML = '';
    const fragment = document.createDocumentFragment();
// ... (código existente sin cambios)
    const isEditList = (listId === 'edit-memorias-list');
    
    // Guardar callbacks
// ... (código existente sin cambios)
    _onEditMemoryClickCallback = onEdit;
    _onDeleteMemoryClickCallback = onDelete;

    memories.forEach((memoria) => {
// ... (código existente sin cambios)
        const itemDiv = document.createElement('div');
        itemDiv.className = 'memoria-item';
// ... (código existente sin cambios)
        
        let fechaStr = 'Unknown date';
        if (memoria.Fecha_Original?.toDate) {
// ... (código existente sin cambios)
            try {
                fechaStr = memoria.Fecha_Original.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
// ... (código existente sin cambios)
            } catch(e) { /* fallback */ }
        }
        
        let contentHTML = `<small>${fechaStr}</small>`;
// ... (código existente sin cambios)
        let artworkHTML = '';
        
        switch (memoria.Tipo) {
// ... (código existente sin cambios)
            case 'Lugar': contentHTML += `📍 ${memoria.LugarNombre || 'Place'}`; break;
            case 'Musica':
// ... (código existente sin cambios)
                if (memoria.CancionData?.trackName) {
                    contentHTML += `🎵 <strong>${memoria.CancionData.trackName}</strong> by ${memoria.CancionData.artistName}`;
// ... (código existente sin cambios)
                    if(memoria.CancionData.artworkUrl60) artworkHTML = `<img src="${memoria.CancionData.artworkUrl60}" class="memoria-artwork">`;
                } else {
// ... (código existente sin cambios)
                    contentHTML += `🎵 ${memoria.CancionInfo || 'Music'}`;
                }
                break;
            case 'Imagen':
// ... (código existente sin cambios)
                contentHTML += `🖼️ Image`;
                if (memoria.ImagenURL) contentHTML += ` (<a href="${memoria.ImagenURL}" target="_blank">View</a>)`;
// ... (código existente sin cambios)
                if (memoria.Descripcion) contentHTML += `<br>${memoria.Descripcion}`;
                break;
// ... (código existente sin cambios)
            default: contentHTML += memoria.Descripcion || ''; break;
        }
        
        const actionsHTML = isEditList ? `
            <div class="memoria-actions">
// ... (código existente sin cambios)
                <button class="edit-btn" title="Edit" data-memoria-id="${memoria.id}">${editIconSVG}</button>
                <button class="delete-btn" title="Delete" data-memoria-id="${memoria.id}">${deleteIconSVG}</button>
// ... (código existente sin cambios)
            </div>` : '';
            
        itemDiv.innerHTML = `${artworkHTML}<div class="memoria-item-content">${contentHTML}</div>${actionsHTML}`;
// ... (código existente sin cambios)
        fragment.appendChild(itemDiv);
    });
    
    memoriasListDiv.appendChild(fragment);

// ... (código existente sin cambios)
    // Asignar listeners si es la lista de edición
    if (isEditList) {
// ... (código existente sin cambios)
        _attachMemoryActionListeners(memoriasListDiv, memories);
    }
}

/** Asigna listeners de clic a los botones de editar/borrar (función helper). */
function _attachMemoryActionListeners(listDiv, memories) {
// ... (código existente sin cambios)
    listDiv.addEventListener('click', (event) => {
        const editButton = event.target.closest('.edit-btn');
// ... (código existente sin cambios)
        const deleteButton = event.target.closest('.delete-btn');
        
        if (editButton) {
// ... (código existente sin cambios)
            const memId = editButton.getAttribute('data-memoria-id');
            const memToEdit = memories.find(m => m.id === memId);
// ... (código existente sin cambios)
            if (memToEdit && _onEditMemoryClickCallback) {
                _onEditMemoryClickCallback(memToEdit);
            }
        } else if (deleteButton) {
// ... (código existente sin cambios)
            const memId = deleteButton.getAttribute('data-memoria-id');
            const memToDelete = memories.find(m => m.id === memId);
// ... (código existente sin cambios)
            if (memToDelete && _onDeleteMemoryClickCallback) {
                const displayInfo = memToDelete.Descripcion || memToDelete.LugarNombre || memToDelete.CancionInfo || "this memory";
// ... (código existente sin cambios)
                _onDeleteMemoryClickCallback(memToDelete, displayInfo);
            }
        }
    });
}

/** Muestra 'Loading...' en una lista de memorias. */
export function showMemoryListLoading(listId) {
// ... (código existente sin cambios)
    const listDiv = document.getElementById(listId);
    if (listDiv) listDiv.innerHTML = 'Loading...';
}

/** Muestra un error en una lista de memorias. */
export function showMemoryListError(listId) {
// ... (código existente sin cambios)
    const listDiv = document.getElementById(listId);
    if (listDiv) listDiv.innerHTML = '<p class="error">Error loading memories.</p>';
}

// --- UI: Formulario de Memorias ---

/** Muestra/oculta campos del formulario según el tipo. */
export function handleMemoryTypeChange() {
// ... (código existente sin cambios)
    const type = document.getElementById('memoria-type').value;
    ['Texto','Lugar','Musica','Imagen'].forEach(id => {
// ... (código existente sin cambios)
        const div = document.getElementById(`input-type-${id}`);
        if(div) div.style.display = (type === id) ? 'block' : 'none';
// ... (código existente sin cambios)
    });
    
    if(type !== 'Musica') document.getElementById('itunes-results').innerHTML = '';
// ... (código existente sin cambios)
    if(type !== 'Lugar') document.getElementById('place-results').innerHTML = '';
    if(type !== 'Imagen') {
// ... (código existente sin cambios)
        document.getElementById('memoria-image-upload').value = null;
        document.getElementById('image-upload-status').textContent = '';
    }
}

/** Dibuja los resultados de búsqueda de música. */
export function drawMusicSearchResults(results, onSelect) {
// ... (código existente sin cambios)
    const resultsDiv = document.getElementById('itunes-results');
    resultsDiv.innerHTML = '';
// ... (código existente sin cambios)
    results.forEach(track => {
        const div = document.createElement('div');
// ... (código existente sin cambios)
        div.className = 'itunes-track';
        const artwork = track.artworkUrl100 || track.artworkUrl60 || '';
// ... (código existente sin cambios)
        div.innerHTML = `
            <img src="${artwork}" class="itunes-artwork" style="${artwork ? '' : 'display:none;'}" onerror="this.style.display='none';">
            <div class="itunes-track-info">
// ... (código existente sin cambios)
                <div class="itunes-track-name">${track.trackName || '?'}</div>
                <div class="itunes-track-artist">${track.artistName || '?'}</div>
// ... (código existente sin cambios)
            </div>
            <div class="itunes-track-select">➔</div>`;
// ... (código existente sin cambios)
        
        div.onclick = () => {
            document.getElementById('memoria-music-search').value = `${track.trackName} - ${track.artistName}`;
// ... (código existente sin cambios)
            resultsDiv.innerHTML = `<div class="itunes-track selected"><img src="${artwork}" class="itunes-artwork" style="${artwork ? '' : 'display:none;'}">... <span style="color:green;">✓</span></div>`;
            onSelect(track); // Llama al callback del controlador con el track
// ... (código existente sin cambios)
        };
        resultsDiv.appendChild(div);
    });
}

export function showMusicSearchLoading() {
// ... (código existente sin cambios)
    document.getElementById('itunes-results').innerHTML = '<p>Searching...</p>';
}

export function showMusicSearchError(message) {
// ... (código existente sin cambios)
    document.getElementById('itunes-results').innerHTML = `<p class="error">${message}</p>`;
}

/** Dibuja los resultados de búsqueda de lugares. */
export function drawPlaceSearchResults(results, onSelect) {
// ... (código existente sin cambios)
    const resultsDiv = document.getElementById('place-results');
    resultsDiv.innerHTML = '';
// ... (código existente sin cambios)
    results.forEach(place => {
        const div = document.createElement('div');
// ... (código existente sin cambios)
        div.className = 'place-result';
        div.innerHTML = `${place.display_name}`;
// ... (código existente sin cambios)
        div.onclick = () => {
            const placeData = {
// ... (código existente sin cambios)
                name: place.display_name,
                lat: place.lat,
// ... (código existente sin cambios)
                lon: place.lon,
                osm_id: place.osm_id,
// ... (código existente sin cambios)
                osm_type: place.osm_type
            };
            document.getElementById('memoria-place-search').value = place.display_name;
// ... (código existente sin cambios)
            resultsDiv.innerHTML = `<p class="success">Selected: ${place.display_name}</p>`;
            onSelect(placeData); // Llama al callback con los datos
// ... (código existente sin cambios)
        };
        resultsDiv.appendChild(div);
    });
}

export function showPlaceSearchLoading() {
// ... (código existente sin cambios)
    document.getElementById('place-results').innerHTML = '<p>Searching...</p>';
}

export function showPlaceSearchError(message) {
// ... (código existente sin cambios)
    document.getElementById('place-results').innerHTML = `<p class="error">${message}</p>`;
}

/** Rellena el formulario de memoria para editar. */
export function fillEditForm(memoria) {
// ... (código existente sin cambios)
    document.getElementById('memoria-type').value = memoria.Tipo || 'Texto';
    handleMemoryTypeChange();
    
    const fechaInput = document.getElementById('memoria-fecha');
// ... (código existente sin cambios)
    if (memoria.Fecha_Original?.toDate) {
        try { fechaInput.value = memoria.Fecha_Original.toDate().toISOString().split('T')[0]; } catch(e){ fechaInput.value = ''; }
// ... (código existente sin cambios)
    } else {
        fechaInput.value = '';
    }
    
// ... (código existente sin cambios)
    // Limpiar campos y resultados
    document.getElementById('place-results').innerHTML = '';
// ... (código existente sin cambios)
    document.getElementById('itunes-results').innerHTML = '';
    document.getElementById('image-upload-status').textContent = '';
// ... (código existente sin cambios)
    document.getElementById('memoria-image-upload').value = null;
    
    // Rellenar campos específicos
// ... (código existente sin cambios)
    document.getElementById('memoria-desc').value = (memoria.Tipo === 'Texto' || memoria.Tipo === 'Imagen') ? (memoria.Descripcion || '') : '';
    document.getElementById('memoria-place-search').value = (memoria.Tipo === 'Lugar') ? (memoria.LugarNombre || '') : '';
// ... (código existente sin cambios)
    document.getElementById('memoria-music-search').value = (memoria.Tipo === 'Musica') ? (memoria.CancionInfo || '') : '';
    document.getElementById('memoria-image-desc').value = (memoria.Tipo === 'Imagen') ? (memoria.Descripcion || '') : '';

    if (memoria.Tipo === 'Imagen') {
// ... (código existente sin cambios)
        document.getElementById('image-upload-status').textContent = memoria.ImagenURL ? `Current image saved.` : 'No image file selected.';
    }

// ... (código existente sin cambios)
    // Configurar botón de guardar
    const saveButton = document.getElementById('save-memoria-btn');
// ... (código existente sin cambios)
    saveButton.textContent = 'Update Memory';
    saveButton.classList.add('update-mode');
}

/** Resetea el formulario de memoria. */
export function resetMemoryForm() {
// ... (código existente sin cambios)
    const f = document.getElementById('memory-form');
    if(f) {
// ... (código existente sin cambios)
        f.reset();
        const b = document.getElementById('save-memoria-btn');
// ... (código existente sin cambios)
        if(b) {
            b.textContent = 'Add Memory';
// ... (código existente sin cambios)
            b.classList.remove('update-mode');
        }
        document.getElementById('memoria-status').textContent = '';
// ... (código existente sin cambios)
        document.getElementById('itunes-results').innerHTML = '';
        document.getElementById('place-results').innerHTML = '';
// ... (código existente sin cambios)
        document.getElementById('image-upload-status').textContent = '';
        handleMemoryTypeChange();
// ... (código existente sin cambios)
    }
}

/** Obtiene los datos del formulario de memoria. */
export function getMemoryFormData() {
// ... (código existente sin cambios)
    const type = document.getElementById('memoria-type').value;
    const fechaStr = document.getElementById('memoria-fecha').value;
// ... (código existente sin cambios)
    let memoryData = { Tipo: type, Fecha_Original: fechaStr };
    let imageFile = null;
// ... (código existente sin cambios)
    let isValid = !!fechaStr;

    switch (type) {
// ... (código existente sin cambios)
        case 'Texto':
            memoryData.Descripcion = document.getElementById('memoria-desc').value.trim();
// ... (código existente sin cambios)
            if (!memoryData.Descripcion) isValid = false;
            break;
// ... (código existente sin cambios)
        case 'Lugar':
            memoryData.LugarNombre = document.getElementById('memoria-place-search').value.trim();
// ... (código existente sin cambios)
            if (!memoryData.LugarNombre) isValid = false;
            break;
// ... (código existente sin cambios)
        case 'Musica':
            memoryData.CancionInfo = document.getElementById('memoria-music-search').value.trim();
// ... (código existente sin cambios)
            if (!memoryData.CancionInfo) isValid = false;
            break;
// ... (código existente sin cambios)
        case 'Imagen':
            const fileInput = document.getElementById('memoria-image-upload');
// ... (código existente sin cambios)
            memoryData.Descripcion = document.getElementById('memoria-image-desc').value.trim() || null;
            if (fileInput.files && fileInput.files[0]) {
// ... (código existente sin cambios)
                imageFile = fileInput.files[0];
                memoryData.ImagenURL = "placeholder_uploading";
// ... (código existente sin cambios)
            } else {
                // Si no hay archivo, solo es válido si estamos editando (isValid se chequeará en main.js)
// ... (código existente sin cambios)
            }
            break;
// ... (código existente sin cambios)
        default: isValid = false; break;
    }
    
    return { memoryData, imageFile, isValid };
}

/** Obtiene el día y año seleccionados en modo 'Añadir'. */
export function getDaySelectionData() {
// ... (código existente sin cambios)
    const daySelect = document.getElementById('edit-mem-day');
    const yearInput = document.getElementById('edit-mem-year');
// ... (código existente sin cambios)
    const daySelectionVisible = document.getElementById('day-selection-section')?.style.display !== 'none';

    if (daySelectionVisible && daySelect?.value && yearInput?.value) {
// ... (código existente sin cambios)
        const year = parseInt(yearInput.value, 10);
        if (!isNaN(year) && year >= 1800 && year <= new Date().getFullYear() + 1) {
// ... (código existente sin cambios)
            return { diaId: daySelect.value, year: year };
        }
    }
// ... (código existente sin cambios)
    return null;
}


/** Muestra el diálogo de confirmación de borrado. */
export function showDeleteConfirmation(displayInfo, onConfirm) {
// ... (código existente sin cambios)
    const dialog = document.getElementById('confirm-delete-dialog');
    const text = document.getElementById('confirm-delete-text');
// ... (código existente sin cambios)
    const yesButton = document.getElementById('confirm-delete-yes');
    
    const shortInfo = displayInfo ? (displayInfo.length > 50 ? displayInfo.substring(0, 47)+'...' : displayInfo) : 'this memory';
// ... (código existente sin cambios)
    text.textContent = `Delete "${shortInfo}"?`;
    dialog.style.display = 'block';
    
    const modalContent = document.querySelector('#edit-add-modal .modal-content');
// ... (código existente sin cambios)
    if(modalContent && !modalContent.contains(dialog)) {
        modalContent.appendChild(dialog);
    }
    
    yesButton.onclick = null; // Limpiar listener
// ... (código existente sin cambios)
    yesButton.onclick = () => {
        dialog.style.display = 'none';
// ... (código existente sin cambios)
        onConfirm(); // Llama al callback de confirmación
    };
}

// --- UI: Mensajes de Estado ---

export function showSaveDayNameStatus(message, isError = false) {
// ... (código existente sin cambios)
    const s = document.getElementById('save-status');
    if (!s) return;
// ... (código existente sin cambios)
    s.textContent = message;
    s.className = isError ? 'error' : 'success';
// ... (código existente sin cambios)
    if (!isError) {
        setTimeout(() => { s.textContent = ''; }, 1500);
    }
}

export function showSaveMemoryStatus(message, isError = false) {
// ... (código existente sin cambios)
    const s = document.getElementById('memoria-status');
    if (!s) return;
// ... (código existente sin cambios)
    s.textContent = message;
    s.className = isError ? 'error' : 'success';
// ... (código existente sin cambios)
    if (!isError) {
        setTimeout(() => { s.textContent = ''; }, 1500);
    }
}

// --- ¡NUEVO! UI: Modales del Almacén (Store) ---

/**
 * Abre el modal principal del Almacén (selector de categorías).
 * @param {function} onCategoryClick - Callback que se ejecuta al pulsar una categoría.
 */
export function openStoreModal(onCategoryClick) {
    _onStoreCategoryClickCallback = onCategoryClick;
    let modal = document.getElementById('store-modal');
    if (!modal) {
        modal = _createStoreModal();
    }
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);
}

/** Cierra el modal principal del Almacén. */
export function closeStoreModal() {
    const modal = document.getElementById('store-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => { modal.style.display = 'none'; }, 200);
    }
}

/**
 * Abre el modal de lista de resultados del Almacén.
 * @param {string} title - Título para el modal (ej. "Lugares").
 * @param {function} onLoadMore - Callback para cargar más resultados.
 */
export function openStoreListModal(title, onLoadMore) {
    _onStoreLoadMoreCallback = onLoadMore;
    let modal = document.getElementById('store-list-modal');
    if (!modal) {
        modal = _createStoreListModal();
    }
    
    document.getElementById('store-list-title').textContent = title;
    document.getElementById('store-list-results').innerHTML = ''; // Limpiar
    document.getElementById('store-load-more-btn').style.display = 'none'; // Ocultar botón
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);
    showStoreListLoading(); // Mostrar 'loading'
}

/** Cierra el modal de lista del Almacén. */
export function closeStoreListModal() {
    const modal = document.getElementById('store-list-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => { modal.style.display = 'none'; }, 200);
    }
}

/** Crea el HTML del modal principal del Almacén (helper). */
function _createStoreModal() {
    const modal = document.createElement('div');
    modal.id = 'store-modal';
    modal.className = 'modal-preview'; // Reutilizamos estilo
    modal.innerHTML = `
        <div class="modal-preview-content">
            <div class="modal-preview-header">
                <h3>Almacén de Recuerdos</h3>
            </div>
            <div class="modal-preview-memorias" id="store-category-list">
                <button class="store-category-btn" data-type="Nombre_Especial">Nombres de Día</button>
                <button class="store-category-btn" data-type="Lugar">📍 Lugares</button>
                <button class="store-category-btn" data-type="Musica">🎵 Canciones</button>
                <button class="store-category-btn" data-type="Imagen">🖼️ Fotos</button>
                <button class="store-category-btn" data-type="Texto">📝 Notas</button>
            </div>
            <button id="close-store-btn" class="aqua-button">Cerrar</button>
        </div>`;
    document.body.appendChild(modal);

    modal.onclick = (e) => {
        if (e.target.id === 'store-modal') closeStoreModal();
    };
    document.getElementById('close-store-btn').onclick = closeStoreModal;
    
    // Asignar clicks a los botones de categoría
    modal.querySelectorAll('.store-category-btn').forEach(btn => {
        btn.onclick = () => {
            if (_onStoreCategoryClickCallback) {
                _onStoreCategoryClickCallback(btn.dataset.type, btn.textContent);
            }
        };
    });
    return modal;
}

/** Crea el HTML del modal de lista del Almacén (helper). */
function _createStoreListModal() {
    const modal = document.createElement('div');
    modal.id = 'store-list-modal';
    modal.className = 'modal-preview'; // Reutilizamos estilo
    modal.style.zIndex = '1002'; // Ponerlo encima del modal de almacén
    
    modal.innerHTML = `
        <div class="modal-preview-content">
            <div class="modal-preview-header">
                <button id="store-list-back-btn" title="Atrás">${pencilIconSVG.replace('bi-pencil-fill', 'bi-arrow-left').replace('M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z', 'M8 0a.5.5 0 0 1 .5.5v6.586l2.793-2.793a.5.5 0 1 1 .707.707l-3.5 3.5a.5.5 0 0 1-.707 0l-3.5-3.5a.5.5 0 1 1 .707-.707L7.5 7.086V.5A.5.5 0 0 1 8 0z')}</button> <!-- Icono de flecha izquierda -->
                <h3 id="store-list-title">Resultados</h3>
            </div>
            <div class="modal-preview-memorias" id="store-list-scroll">
                <div id="store-list-results"></div>
                <button id="store-load-more-btn" class="aqua-button">Cargar más (+10)</button>
            </div>
            <button id="close-store-list-btn" class="aqua-button">Cerrar</Lbutton>
        </div>`;
    document.body.appendChild(modal);

    modal.onclick = (e) => {
        if (e.target.id === 'store-list-modal') closeStoreListModal();
    };
    document.getElementById('close-store-list-btn').onclick = closeStoreListModal;
    document.getElementById('store-list-back-btn').onclick = closeStoreListModal; // Cierra este modal, volviendo al selector
    
    document.getElementById('store-load-more-btn').onclick = () => {
        if (_onStoreLoadMoreCallback) {
            _onStoreLoadMoreCallback();
        }
    };
    return modal;
}

/** Muestra 'Loading' en la lista del almacén. */
export function showStoreListLoading() {
    const listDiv = document.getElementById('store-list-results');
    if (listDiv) {
        listDiv.innerHTML = '<p>Loading...</p>';
    }
    const loadMoreBtn = document.getElementById('store-load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.style.display = 'none';
    }
}

/**
 * Dibuja/añade resultados a la lista del almacén.
 * @param {Array} memories - Array de memorias a añadir.
 * @param {boolean} hasMore - Si hay más resultados para cargar.
 * @param {function} onMemoryClick - Callback al pulsar una memoria.
 */
export function drawStoreList(memories, hasMore, onMemoryClick) {
    const listDiv = document.getElementById('store-list-results');
    const loadMoreBtn = document.getElementById('store-load-more-btn');
    
    // Si es la primera carga (innerHTML es 'Loading...'), limpiar
    if (listDiv.innerHTML.includes('<p>Loading')) {
        listDiv.innerHTML = '';
    }
    
    if (memories.length === 0 && listDiv.innerHTML === '') {
        listDiv.innerHTML = '<p class="list-placeholder">No hay recuerdos de este tipo.</p>';
    }

    const fragment = document.createDocumentFragment();
    memories.forEach(mem => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'memoria-item store-item'; // Estilo de memoria
        itemDiv.style.cursor = 'pointer';
        
        let fechaStr = 'Unknown';
        // 'mem.Fecha_Original' puede ser un Timestamp de Firestore o un string
        if (mem.Fecha_Original?.toDate) {
            fechaStr = mem.Fecha_Original.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } else if (typeof mem.Fecha_Original === 'string') {
            fechaStr = mem.Fecha_Original; // Para 'Nombres de Día'
        }
        
        let contentHTML = `<small><b>${mem.diaNombre || mem.id}</b> (${mem.diaId || 'Día'}) - ${fechaStr}</small>`;
        
        // Contenido basado en el tipo
        if (mem.Tipo === 'Nombre_Especial') {
            contentHTML += `🌟 <strong>${mem.Nombre_Especial}</strong>`;
        } else if (mem.Tipo === 'Lugar') {
            contentHTML += `📍 ${mem.LugarNombre || 'Lugar sin nombre'}`;
        } else if (mem.Tipo === 'Musica') {
            contentHTML += `🎵 ${mem.CancionInfo || 'Canción sin nombre'}`;
        } else if (mem.Tipo === 'Imagen') {
            contentHTML += `🖼️ ${mem.Descripcion || 'Imagen'}`;
        } else {
            contentHTML += `📝 ${mem.Descripcion?.substring(0, 50) || 'Nota'}${mem.Descripcion?.length > 50 ? '...' : ''}`;
        }

        itemDiv.innerHTML = `<div class="memoria-item-content">${contentHTML}</div>`;
        itemDiv.onclick = () => onMemoryClick(mem);
        fragment.appendChild(itemDiv);
    });
    
    listDiv.appendChild(fragment); // Añadir los nuevos
    
    // Gestionar el botón "Cargar Más"
    if (loadMoreBtn) {
        loadMoreBtn.style.display = hasMore ? 'block' : 'none';
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = 'Cargar más (+10)';
    }
}

/** Muestra 'Loading...' en el botón de cargar más. */
export function setStoreLoadMoreLoading() {
    const loadMoreBtn = document.getElementById('store-load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = 'Cargando...';
    }
}

