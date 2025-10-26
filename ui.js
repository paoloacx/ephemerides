/* ui.js */
/* Módulo para toda la manipulación del DOM (la vista) */

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
 * @param {function} onToday - Callback para 'Today'.
 * @param {function} onSearch - Callback para 'Search'.
 * @param {function} onShuffle - Callback para 'Shuffle'.
 * @param {function} onAdd - Callback para 'Add Memory'.
 */
export function setupFooter(onToday, onSearch, onShuffle, onAdd) {
    document.getElementById('btn-hoy').onclick = onToday;
    document.getElementById('btn-buscar').onclick = onSearch;
    document.getElementById('btn-shuffle').onclick = onShuffle;
    document.getElementById('btn-add-memory').onclick = onAdd;
}

/**
 * Configura el botón de refrescar.
 * @param {function} onRefresh - Callback para 'Refresh'.
 */
export function setupRefreshButton(onRefresh) {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.onclick = onRefresh;
    }
}

// --- Funciones de Renderizado (Dibujo) ---

/**
 * Actualiza la UI de login en el header.
 * @param {object|null} user - El objeto de usuario, o null.
 * @param {function} loginCallback - Función a llamar al hacer clic en 'login'.
 * @param {function} logoutCallback - Función a llamar al hacer clic en 'logout'.
 */
export function updateLoginUI(user, loginCallback, logoutCallback) {
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const userImg = document.getElementById('user-img');
    
    if (user) {
        if (userInfo) userInfo.style.display = 'flex';
        if (userName) userName.textContent = user.displayName || user.email || 'User';
        if (userImg) userImg.src = user.photoURL || 'https://placehold.co/30x30/ccc/fff?text=?';
        if (loginBtn) {
            loginBtn.innerHTML = loginIconSVG;
            loginBtn.title = "Logout";
            loginBtn.onclick = logoutCallback;
        }
    } else {
        if (userInfo) userInfo.style.display = 'none';
        if (loginBtn) {
            loginBtn.innerHTML = `<img src="https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1OLUbq VilNfRHXkvdR8VdVAbkuQGcuSgs5nbDbpaE8nhzo6g=s0-w24-h24-p-k-rw-no" alt="G" style="width: 24px; height: 24px; border-radius: 50%;">`;
            loginBtn.title = "Login with Google";
            loginBtn.onclick = loginCallback;
        }
    }
}

/**
 * Muestra un mensaje de carga en el contenido principal.
 * @param {string} message - El mensaje a mostrar.
 */
export function setLoading(message) {
    appContent.innerHTML = `<p>${message}</p>`;
}

/**
 * Dibuja el grid del calendario.
 * @param {Array} daysOfMonth - Array de objetos 'dia' para el mes actual.
 * @param {number} expectedDays - Número de días esperados para el mes.
 * @param {string} todayId - El ID del día de hoy (ej. "10-26").
 * @param {number} currentMonthIndex - Índice del mes actual (0-11).
 * @param {function} onDayClick - Callback a ejecutar al hacer clic en un día.
 */
export function drawCalendarGrid(daysOfMonth, expectedDays, todayId, currentMonthIndex, onDayClick) {
    appContent.innerHTML = `<div class="calendario-grid" id="grid-dias"></div>`;
    const grid = document.getElementById("grid-dias");
    const today = new Date(); // Necesario para comparar el mes

    if (daysOfMonth.length === 0) {
        grid.innerHTML = "<p>No days found.</p>";
        return;
    }
    
    if (daysOfMonth.length !== expectedDays) {
        console.warn(`ALERT: Found ${daysOfMonth.length}/${expectedDays} days for month ${currentMonthIndex}.`);
    }

    // Guarda el callback globalmente
    _onDayClickCallback = onDayClick;

    daysOfMonth.forEach(dia => {
        const btn = document.createElement("button");
        btn.className = "dia-btn";
        btn.innerHTML = `<span class="dia-numero">${dia.id.substring(3)}</span>`;
        btn.dataset.diaId = dia.id; // Guardamos el ID

        if (dia.id === todayId && currentMonthIndex === today.getMonth()) {
            btn.classList.add('dia-btn-today');
        }

        // Asigna el evento
        btn.addEventListener('click', () => _onDayClickCallback(dia));
        grid.appendChild(btn);
    });
    console.log(`Rendered ${daysOfMonth.length} buttons.`);
}

/**
 * Actualiza el nombre del mes en la navegación.
 * @param {string} name - El nombre del mes.
 */
export function updateMonthName(name) {
    monthNameDisplayEl.textContent = name;
}

/**
 * Dibuja la lista de resultados de búsqueda.
 * @param {string} term - El término buscado.
 * @param {Array} results - Array de memorias encontradas.
 * @param {function} onResultClick - Callback al hacer clic en un resultado.
 */
export function drawSearchResults(term, results, onResultClick) {
    if (results.length === 0) {
        appContent.innerHTML = `<p>No results for "${term}".</p>`;
        return;
    }
    
    console.log(`Found ${results.length}.`);
    appContent.innerHTML = `<h3>Results for "${term}" (${results.length}):</h3>`;
    const resultsList = document.createElement('div');
    resultsList.id = 'search-results-list';
    
    results.forEach(mem => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'memoria-item search-result';
        let fechaStr = 'Unknown date';
        if (mem.Fecha_Original?.toDate) {
            try {
                fechaStr = mem.Fecha_Original.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            } catch(e) { /* fallback */ }
        }
        
        let contentHTML = `<small><b>${mem.diaNombre} (${mem.diaId})</b> - ${fechaStr}</small>`;
        switch (mem.Tipo) {
            case 'Lugar': contentHTML += `📍 ${mem.LugarNombre || 'Place'}`; break;
            case 'Musica':
                if (mem.CancionData?.trackName) contentHTML += `🎵 <strong>${mem.CancionData.trackName}</strong> by ${mem.CancionData.artistName}`;
                else contentHTML += `🎵 ${mem.CancionInfo || 'Music'}`;
                break;
            case 'Imagen':
                contentHTML += `🖼️ Image`;
                if (mem.ImagenURL) contentHTML += ` (<a href="${mem.ImagenURL}" target="_blank">View</a>)`;
                if (mem.Descripcion) contentHTML += `<br>${mem.Descripcion}`;
                break;
            default: contentHTML += mem.Descripcion || ''; break;
        }
        itemDiv.innerHTML = `<div class="memoria-item-content">${contentHTML}</div>`;
        itemDiv.style.cursor = 'pointer';
        itemDiv.onclick = () => onResultClick(mem); // Llama al callback
        resultsList.appendChild(itemDiv);
    });
    appContent.appendChild(resultsList);
}

/** Muestra un error en la página principal. */
export function showAppError(message) {
    appContent.innerHTML = `<p class="error">${message}</p>`;
}

/** Pide al usuario un término de búsqueda. */
export function promptSearch() {
    return prompt("Search memories:");
}

// --- UI: Modales (Preview) ---

/** Abre el modal de vista previa. */
export function openPreviewModal(dia, onEditClick) {
    let modal = document.getElementById('preview-modal');
    if (!modal) {
        modal = _createPreviewModal(onEditClick);
    }
    
    document.getElementById('preview-title').textContent = `${dia.Nombre_Dia} ${dia.Nombre_Especial !== 'Unnamed Day' ? '('+dia.Nombre_Especial+')' : ''}`;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);
    
    // Mostramos 'loading' mientras main.js busca las memorias
    showMemoryListLoading('preview-memorias-list');
}

/** Cierra el modal de vista previa. */
export function closePreviewModal() {
    const modal = document.getElementById('preview-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => { modal.style.display = 'none'; }, 200);
    }
}

/** Crea el HTML del modal de vista previa (función helper). */
function _createPreviewModal(onEditClick) {
    const modal = document.createElement('div');
    modal.id = 'preview-modal';
    modal.className = 'modal-preview';
    modal.innerHTML = `
        <div class="modal-preview-content">
            <div class="modal-preview-header">
                <h3 id="preview-title"></h3>
                <button id="edit-from-preview-btn" title="Edit this day">${pencilIconSVG}</button>
            </div>
            <div class="modal-preview-memorias">
                <h4>Memories:</h4>
                <div id="preview-memorias-list">Loading...</div>
            </div>
            <button id="close-preview-btn" class="aqua-button">Close</button>
        </div>`;
    document.body.appendChild(modal);
    
    document.getElementById('close-preview-btn').onclick = closePreviewModal;
    modal.onclick = (e) => {
        if (e.target.id === 'preview-modal') closePreviewModal();
    };
    
    document.getElementById('edit-from-preview-btn').onclick = onEditClick;
    return modal;
}

// --- UI: Modales (Edición) ---

/**
 * Abre el modal de edición/añadir.
 * @param {object|null} day - El objeto 'dia'. Null si es para 'Añadir'.
 * @param {Array} allDays - El array completo de días (para el <select>).
 * @param {function} onSaveDayName - Callback al guardar nombre (recibe diaId, newName).
 * @param {function} onSaveMemorySubmit - Callback al enviar formulario de memoria.
 * @param {function} onSearchMusic - Callback para buscar música (recibe término).
 * @param {function} onSearchPlace - Callback para buscar lugar (recibe término).
 */
export function openEditModal(day, allDays, onSaveDayName, onSaveMemorySubmit, onSearchMusic, onSearchPlace) {
    const isAdding = !day;
    let modal = document.getElementById('edit-add-modal');
    
    // Guardar callbacks globalmente
    _onSaveDayNameCallback = onSaveDayName;
    _onSaveMemorySubmitCallback = onSaveMemorySubmit;
    _onSearchMusicCallback = onSearchMusic;
    _onSearchPlaceCallback = onSearchPlace;

    if (!modal) {
        modal = _createEditModal(allDays);
    }

    // Configurar modal basado en modo (Añadir vs Editar)
    const daySelectionSection = document.getElementById('day-selection-section');
    const dayNameSection = document.getElementById('day-name-section');
    const daySelect = document.getElementById('edit-mem-day');
    const yearInput = document.getElementById('edit-mem-year');
    const titleEl = document.getElementById('edit-modal-title');
    const nameInput = document.getElementById('nombre-especial-input');
    const memoriesList = document.getElementById('edit-memorias-list');
    const formTitle = document.getElementById('memory-form-title');

    if (isAdding) {
        if(daySelectionSection) daySelectionSection.style.display = 'block';
        if(dayNameSection) dayNameSection.style.display = 'none';
        if (daySelect && day) daySelect.value = day.id; // Usa el día actual (de 'day')
        if(yearInput) yearInput.value = new Date().getFullYear();
        formTitle.textContent = "Add New Memory";
        memoriesList.innerHTML = '<p class="list-placeholder">Add memories below.</p>';
    } else {
        if(daySelectionSection) daySelectionSection.style.display = 'none';
        if(dayNameSection) dayNameSection.style.display = 'block';
        titleEl.textContent = `Editing: ${day.Nombre_Dia} (${day.id})`;
        nameInput.value = day.Nombre_Especial === 'Unnamed Day' ? '' : day.Nombre_Especial;
        formTitle.textContent = "Add/Edit Memories";
        showMemoryListLoading('edit-memorias-list'); // Mostrar 'loading'
    }
    
    resetMemoryForm();
    handleMemoryTypeChange();
    document.getElementById('save-status').textContent = '';
    document.getElementById('memoria-status').textContent = '';
    const confirmDialog = document.getElementById('confirm-delete-dialog');
    if(confirmDialog) confirmDialog.style.display = 'none';
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);
}

/** Cierra el modal de edición. */
export function closeEditModal() {
    const modal = document.getElementById('edit-add-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => { modal.style.display = 'none'; }, 200);
    }
    // Limpiar callbacks
    _onSaveDayNameCallback = null;
    _onSaveMemorySubmitCallback = null;
    _onSearchMusicCallback = null;
    _onSearchPlaceCallback = null;
}

/** Crea el HTML del modal de edición (función helper). */
function _createEditModal(allDays) {
    const modal = document.createElement('div');
    modal.id = 'edit-add-modal';
    modal.className = 'modal-edit';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-content-scrollable">
                <div class="modal-section" id="day-selection-section" style="display: none;">
                     <h3>Add Memory To...</h3>
                     <label for="edit-mem-day">Day (MM-DD):</label>
                     <select id="edit-mem-day"></select>
                     <label for="edit-mem-year">Year of Memory:</label>
                     <input type="number" id="edit-mem-year" placeholder="YYYY" min="1800" max="${new Date().getFullYear() + 1}" required>
                </div>
                <div class="modal-section" id="day-name-section" style="display: none;">
                    <h3 id="edit-modal-title"></h3>
                    <label for="nombre-especial-input">Name this day:</label>
                    <input type="text" id="nombre-especial-input" placeholder="e.g., Pizza Day" maxlength="25">
                    <button id="save-name-btn" class="aqua-button">Save Day Name</button>
                    <p id="save-status"></p>
                </div>
                <div class="modal-section memorias-section">
                    <h4>Memories</h4>
                    <div id="edit-memorias-list">Loading...</div>
                    <form id="memory-form">
                         <p class="section-description" id="memory-form-title">Add/Edit Memory</p>
                         <label for="memoria-fecha">Original Date:</label>
                         <input type="date" id="memoria-fecha" required>
                         <label for="memoria-type">Type:</label>
                         <select id="memoria-type">
                             <option value="Texto">Description</option>
                             <option value="Lugar">Place</option>
                             <option value="Musica">Music</option>
                             <option value="Imagen">Image</option>
                         </select>
                         <div class="add-memory-input-group" id="input-type-Texto"><label for="memoria-desc">Description:</label><textarea id="memoria-desc" placeholder="Write memory..."></textarea></div>
                         <div class="add-memory-input-group" id="input-type-Lugar"><label for="memoria-place-search">Search:</label><input type="text" id="memoria-place-search"><button type="button" class="aqua-button" id="btn-search-place">Search</button><div id="place-results"></div></div>
                         <div class="add-memory-input-group" id="input-type-Musica"><label for="memoria-music-search">Search:</label><input type="text" id="memoria-music-search"><button type="button" class="aqua-button" id="btn-search-itunes">Search</button><div id="itunes-results"></div></div>
                         <div class="add-memory-input-group" id="input-type-Imagen"><label for="memoria-image-upload">Image:</label><input type="file" id="memoria-image-upload" accept="image/*"><label for="memoria-image-desc">Desc:</label><input type="text" id="memoria-image-desc"><div id="image-upload-status"></div></div>
                         <button type="submit" id="save-memoria-btn" class="aqua-button">Add Memory</button>
                         <p id="memoria-status"></p>
                    </form>
                </div>
                <div id="confirm-delete-dialog" style="display: none;">
                    <p id="confirm-delete-text"></p>
                    <button id="confirm-delete-no" class="aqua-button">Cancel</button>
                    <button id="confirm-delete-yes" class="aqua-button delete-confirm">Delete</button>
                </div>
             </div>
            <div class="modal-main-buttons">
                <button id="close-edit-add-btn">Close</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    
    // Poblar el <select> de días
    const daySelect = modal.querySelector('#edit-mem-day');
    if (daySelect && daySelect.options.length === 0) {
        allDays.forEach(d => {
            const o=document.createElement('option');
            o.value=d.id;
            o.textContent=d.Nombre_Dia;
            daySelect.appendChild(o);
        });
    }
    
    // Asignar listeners estáticos
    document.getElementById('close-edit-add-btn').onclick = closeEditModal;
    modal.onclick = (e) => { if (e.target.id === 'edit-add-modal') closeEditModal(); };
    document.getElementById('confirm-delete-no').onclick = () => {
        document.getElementById('confirm-delete-dialog').style.display = 'none';
    };
    document.getElementById('memoria-type').addEventListener('change', handleMemoryTypeChange);
    
    // Asignar listeners que llaman a callbacks
    document.getElementById('btn-search-itunes').onclick = () => {
        const term = document.getElementById('memoria-music-search').value.trim();
        if (_onSearchMusicCallback) _onSearchMusicCallback(term);
    };
    document.getElementById('btn-search-place').onclick = () => {
        const term = document.getElementById('memoria-place-search').value.trim();
        if (_onSearchPlaceCallback) _onSearchPlaceCallback(term);
    };
    document.getElementById('memory-form').onsubmit = (e) => {
        e.preventDefault();
        if (_onSaveMemorySubmitCallback) _onSaveMemorySubmitCallback();
    };
    document.getElementById('save-name-btn').onclick = () => {
        const newName = document.getElementById('nombre-especial-input').value.trim();
        if (_onSaveDayNameCallback) _onSaveDayNameCallback(newName);
    };
    
    const fileInput = document.getElementById('memoria-image-upload');
    const imageStatus = document.getElementById('image-upload-status');
    if(fileInput && imageStatus) {
        fileInput.onchange = (e) => imageStatus.textContent = e.target.files?.[0] ? `Selected: ${e.target.files[0].name}` : '';
    }
    
    return modal;
}

// --- UI: Lista de Memorias ---

/**
 * Dibuja la lista de memorias en un div (preview o edit).
 * @param {string} listId - ID del div ('preview-memorias-list' o 'edit-memorias-list').
 * @param {Array} memories - Array de objetos de memoria.
 * @param {function} onEdit - Callback para editar (recibe memoria).
 * @param {function} onDelete - Callback para borrar (recibe memoria).
 */
export function drawMemoriesList(listId, memories, onEdit, onDelete) {
    const memoriasListDiv = document.getElementById(listId);
    if (!memoriasListDiv) return;

    if (memories.length === 0) {
        memoriasListDiv.innerHTML = '<p class="list-placeholder">No memories yet.</p>';
        return;
    }

    memoriasListDiv.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const isEditList = (listId === 'edit-memorias-list');
    
    // Guardar callbacks
    _onEditMemoryClickCallback = onEdit;
    _onDeleteMemoryClickCallback = onDelete;

    memories.forEach((memoria) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'memoria-item';
        
        let fechaStr = 'Unknown date';
        if (memoria.Fecha_Original?.toDate) {
            try {
                fechaStr = memoria.Fecha_Original.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            } catch(e) { /* fallback */ }
        }
        
        let contentHTML = `<small>${fechaStr}</small>`;
        let artworkHTML = '';
        
        switch (memoria.Tipo) {
            case 'Lugar': contentHTML += `📍 ${memoria.LugarNombre || 'Place'}`; break;
            case 'Musica':
                if (memoria.CancionData?.trackName) {
                    contentHTML += `🎵 <strong>${memoria.CancionData.trackName}</strong> by ${memoria.CancionData.artistName}`;
                    if(memoria.CancionData.artworkUrl60) artworkHTML = `<img src="${memoria.CancionData.artworkUrl60}" class="memoria-artwork">`;
                } else {
                    contentHTML += `🎵 ${memoria.CancionInfo || 'Music'}`;
                }
                break;
            case 'Imagen':
                contentHTML += `🖼️ Image`;
                if (memoria.ImagenURL) contentHTML += ` (<a href="${memoria.ImagenURL}" target="_blank">View</a>)`;
                if (memoria.Descripcion) contentHTML += `<br>${memoria.Descripcion}`;
                break;
            default: contentHTML += memoria.Descripcion || ''; break;
        }
        
        const actionsHTML = isEditList ? `
            <div class="memoria-actions">
                <button class="edit-btn" title="Edit" data-memoria-id="${memoria.id}">${editIconSVG}</button>
                <button class="delete-btn" title="Delete" data-memoria-id="${memoria.id}">${deleteIconSVG}</button>
            </div>` : '';
            
        itemDiv.innerHTML = `${artworkHTML}<div class="memoria-item-content">${contentHTML}</div>${actionsHTML}`;
        fragment.appendChild(itemDiv);
    });
    
    memoriasListDiv.appendChild(fragment);

    // Asignar listeners si es la lista de edición
    if (isEditList) {
        _attachMemoryActionListeners(memoriasListDiv, memories);
    }
}

/** Asigna listeners de clic a los botones de editar/borrar (función helper). */
function _attachMemoryActionListeners(listDiv, memories) {
    listDiv.addEventListener('click', (event) => {
        const editButton = event.target.closest('.edit-btn');
        const deleteButton = event.target.closest('.delete-btn');
        
        if (editButton) {
            const memId = editButton.getAttribute('data-memoria-id');
            const memToEdit = memories.find(m => m.id === memId);
            if (memToEdit && _onEditMemoryClickCallback) {
                _onEditMemoryClickCallback(memToEdit);
            }
        } else if (deleteButton) {
            const memId = deleteButton.getAttribute('data-memoria-id');
            const memToDelete = memories.find(m => m.id === memId);
            if (memToDelete && _onDeleteMemoryClickCallback) {
                const displayInfo = memToDelete.Descripcion || memToDelete.LugarNombre || memToDelete.CancionInfo || "this memory";
                _onDeleteMemoryClickCallback(memToDelete, displayInfo);
            }
        }
    });
}

/** Muestra 'Loading...' en una lista de memorias. */
export function showMemoryListLoading(listId) {
    const listDiv = document.getElementById(listId);
    if (listDiv) listDiv.innerHTML = 'Loading...';
}

/** Muestra un error en una lista de memorias. */
export function showMemoryListError(listId) {
    const listDiv = document.getElementById(listId);
    if (listDiv) listDiv.innerHTML = '<p class="error">Error loading memories.</p>';
}

// --- UI: Formulario de Memorias ---

/** Muestra/oculta campos del formulario según el tipo. */
export function handleMemoryTypeChange() {
    const type = document.getElementById('memoria-type').value;
    ['Texto','Lugar','Musica','Imagen'].forEach(id => {
        const div = document.getElementById(`input-type-${id}`);
        if(div) div.style.display = (type === id) ? 'block' : 'none';
    });
    
    if(type !== 'Musica') document.getElementById('itunes-results').innerHTML = '';
    if(type !== 'Lugar') document.getElementById('place-results').innerHTML = '';
    if(type !== 'Imagen') {
        document.getElementById('memoria-image-upload').value = null;
        document.getElementById('image-upload-status').textContent = '';
    }
}

/** Dibuja los resultados de búsqueda de música. */
export function drawMusicSearchResults(results, onSelect) {
    const resultsDiv = document.getElementById('itunes-results');
    resultsDiv.innerHTML = '';
    results.forEach(track => {
        const div = document.createElement('div');
        div.className = 'itunes-track';
        const artwork = track.artworkUrl100 || track.artworkUrl60 || '';
        div.innerHTML = `
            <img src="${artwork}" class="itunes-artwork" style="${artwork ? '' : 'display:none;'}" onerror="this.style.display='none';">
            <div class="itunes-track-info">
                <div class="itunes-track-name">${track.trackName || '?'}</div>
                <div class="itunes-track-artist">${track.artistName || '?'}</div>
            </div>
            <div class="itunes-track-select">➔</div>`;
        
        div.onclick = () => {
            document.getElementById('memoria-music-search').value = `${track.trackName} - ${track.artistName}`;
            resultsDiv.innerHTML = `<div class="itunes-track selected"><img src="${artwork}" class="itunes-artwork" style="${artwork ? '' : 'display:none;'}">... <span style="color:green;">✓</span></div>`;
            onSelect(track); // Llama al callback del controlador con el track
        };
        resultsDiv.appendChild(div);
    });
}

export function showMusicSearchLoading() {
    document.getElementById('itunes-results').innerHTML = '<p>Searching...</p>';
}

export function showMusicSearchError(message) {
    document.getElementById('itunes-results').innerHTML = `<p class="error">${message}</p>`;
}

/** Dibuja los resultados de búsqueda de lugares. */
export function drawPlaceSearchResults(results, onSelect) {
    const resultsDiv = document.getElementById('place-results');
    resultsDiv.innerHTML = '';
    results.forEach(place => {
        const div = document.createElement('div');
        div.className = 'place-result';
        div.innerHTML = `${place.display_name}`;
        div.onclick = () => {
            const placeData = {
                name: place.display_name,
                lat: place.lat,
                lon: place.lon,
                osm_id: place.osm_id,
                osm_type: place.osm_type
            };
            document.getElementById('memoria-place-search').value = place.display_name;
            resultsDiv.innerHTML = `<p class="success">Selected: ${place.display_name}</p>`;
            onSelect(placeData); // Llama al callback con los datos
        };
        resultsDiv.appendChild(div);
    });
}

export function showPlaceSearchLoading() {
    document.getElementById('place-results').innerHTML = '<p>Searching...</p>';
}

export function showPlaceSearchError(message) {
    document.getElementById('place-results').innerHTML = `<p class="error">${message}</p>`;
}

/** Rellena el formulario de memoria para editar. */
export function fillEditForm(memoria) {
    document.getElementById('memoria-type').value = memoria.Tipo || 'Texto';
    handleMemoryTypeChange();
    
    const fechaInput = document.getElementById('memoria-fecha');
    if (memoria.Fecha_Original?.toDate) {
        try { fechaInput.value = memoria.Fecha_Original.toDate().toISOString().split('T')[0]; } catch(e){ fechaInput.value = ''; }
    } else {
        fechaInput.value = '';
    }
    
    // Limpiar campos y resultados
    document.getElementById('place-results').innerHTML = '';
    document.getElementById('itunes-results').innerHTML = '';
    document.getElementById('image-upload-status').textContent = '';
    document.getElementById('memoria-image-upload').value = null;
    
    // Rellenar campos específicos
    document.getElementById('memoria-desc').value = (memoria.Tipo === 'Texto' || memoria.Tipo === 'Imagen') ? (memoria.Descripcion || '') : '';
    document.getElementById('memoria-place-search').value = (memoria.Tipo === 'Lugar') ? (memoria.LugarNombre || '') : '';
    document.getElementById('memoria-music-search').value = (memoria.Tipo === 'Musica') ? (memoria.CancionInfo || '') : '';
    document.getElementById('memoria-image-desc').value = (memoria.Tipo === 'Imagen') ? (memoria.Descripcion || '') : '';

    if (memoria.Tipo === 'Imagen') {
        document.getElementById('image-upload-status').textContent = memoria.ImagenURL ? `Current image saved.` : 'No image file selected.';
    }

    // Configurar botón de guardar
    const saveButton = document.getElementById('save-memoria-btn');
    saveButton.textContent = 'Update Memory';
    saveButton.classList.add('update-mode');
}

/** Resetea el formulario de memoria. */
export function resetMemoryForm() {
    const f = document.getElementById('memory-form');
    if(f) {
        f.reset();
        const b = document.getElementById('save-memoria-btn');
        if(b) {
            b.textContent = 'Add Memory';
            b.classList.remove('update-mode');
        }
        document.getElementById('memoria-status').textContent = '';
        document.getElementById('itunes-results').innerHTML = '';
        document.getElementById('place-results').innerHTML = '';
        document.getElementById('image-upload-status').textContent = '';
        handleMemoryTypeChange();
    }
}

/** Obtiene los datos del formulario de memoria. */
export function getMemoryFormData() {
    const type = document.getElementById('memoria-type').value;
    const fechaStr = document.getElementById('memoria-fecha').value;
    let memoryData = { Tipo: type, Fecha_Original: fechaStr };
    let imageFile = null;
    let isValid = !!fechaStr;

    switch (type) {
        case 'Texto':
            memoryData.Descripcion = document.getElementById('memoria-desc').value.trim();
            if (!memoryData.Descripcion) isValid = false;
            break;
        case 'Lugar':
            memoryData.LugarNombre = document.getElementById('memoria-place-search').value.trim();
            if (!memoryData.LugarNombre) isValid = false;
            break;
        case 'Musica':
            memoryData.CancionInfo = document.getElementById('memoria-music-search').value.trim();
            if (!memoryData.CancionInfo) isValid = false;
            break;
        case 'Imagen':
            const fileInput = document.getElementById('memoria-image-upload');
            memoryData.Descripcion = document.getElementById('memoria-image-desc').value.trim() || null;
            if (fileInput.files && fileInput.files[0]) {
                imageFile = fileInput.files[0];
                memoryData.ImagenURL = "placeholder_uploading";
            } else {
                // Si no hay archivo, solo es válido si estamos editando (isValid se chequeará en main.js)
            }
            break;
        default: isValid = false; break;
    }
    
    return { memoryData, imageFile, isValid };
}

/** Obtiene el día y año seleccionados en modo 'Añadir'. */
export function getDaySelectionData() {
    const daySelect = document.getElementById('edit-mem-day');
    const yearInput = document.getElementById('edit-mem-year');
    const daySelectionVisible = document.getElementById('day-selection-section')?.style.display !== 'none';

    if (daySelectionVisible && daySelect?.value && yearInput?.value) {
        const year = parseInt(yearInput.value, 10);
        if (!isNaN(year) && year >= 1800 && year <= new Date().getFullYear() + 1) {
            return { diaId: daySelect.value, year: year };
        }
    }
    return null;
}


/** Muestra el diálogo de confirmación de borrado. */
export function showDeleteConfirmation(displayInfo, onConfirm) {
    const dialog = document.getElementById('confirm-delete-dialog');
    const text = document.getElementById('confirm-delete-text');
    const yesButton = document.getElementById('confirm-delete-yes');
    
    const shortInfo = displayInfo ? (displayInfo.length > 50 ? displayInfo.substring(0, 47)+'...' : displayInfo) : 'this memory';
    text.textContent = `Delete "${shortInfo}"?`;
    dialog.style.display = 'block';
    
    const modalContent = document.querySelector('#edit-add-modal .modal-content');
    if(modalContent && !modalContent.contains(dialog)) {
        modalContent.appendChild(dialog);
    }
    
    yesButton.onclick = null; // Limpiar listener
    yesButton.onclick = () => {
        dialog.style.display = 'none';
        onConfirm(); // Llama al callback de confirmación
    };
}

// --- UI: Mensajes de Estado ---

export function showSaveDayNameStatus(message, isError = false) {
    const s = document.getElementById('save-status');
    if (!s) return;
    s.textContent = message;
    s.className = isError ? 'error' : 'success';
    if (!isError) {
        setTimeout(() => { s.textContent = ''; }, 1500);
    }
}

export function showSaveMemoryStatus(message, isError = false) {
    const s = document.getElementById('memoria-status');
    if (!s) return;
    s.textContent = message;
    s.className = isError ? 'error' : 'success';
    if (!isError) {
        setTimeout(() => { s.textContent = ''; }, 1500);
    }
}
