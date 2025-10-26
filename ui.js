/*
 * Módulo ui.js (v4.0)
 * Responsable de TODA la manipulación del DOM.
 * No sabe nada de Firebase. Solo recibe datos y callbacks.
 * ¡Ahora usa Google Material Icons!
 */

// --- Estado Interno y Selectores ---
// (Podríamos cachear elementos si el rendimiento fuera un problema)
const appContent = document.getElementById("app-content");
const monthNameDisplayEl = document.getElementById("month-name-display");

// --- API Pública del Módulo ---

/**
 * Inicializa los listeners de los elementos estáticos (header, nav, footer).
 * Esta función recibe un objeto con todos los "callbacks" (manejadores)
 * que el main.js quiere que se ejecuten.
 * @param {object} handlers - Objeto con funciones (ej. onPrevMonth, onNextMonth, etc.)
 */
function setupStaticListeners(handlers) {
    // Navegación de Mes
    document.getElementById("prev-month").onclick = handlers.onPrevMonth;
    document.getElementById("next-month").onclick = handlers.onNextMonth;

    // Header
    document.getElementById('refresh-btn').onclick = handlers.onRefresh;

    // Footer
    document.getElementById('btn-add-memory').onclick = handlers.onAddMemory;
    document.getElementById('btn-store').onclick = handlers.onStore;
    document.getElementById('btn-shuffle').onclick = handlers.onShuffle;
    document.getElementById('btn-buscar').onclick = handlers.onSearch;

    // Login (el botón se crea dinámicamente, pero el listener es estático)
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.onclick = () => {
            // El estado de 'isLoggedIn' se determina en el momento del clic
            if (loginBtn.dataset.isLoggedIn === 'true') {
                handlers.onLogout();
            } else {
                handlers.onLogin();
            }
        };
    }
}

/**
 * Actualiza la UI del botón de login y el saludo.
 * @param {object | null} user - El objeto de usuario de Firebase, o null.
 */
function updateLoginUI(user) {
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const userImg = document.getElementById('user-img');

    if (!loginBtn || !userInfo || !userName || !userImg) return;

    if (user) {
        // Logueado
        userInfo.style.display = 'flex';
        userName.textContent = user.displayName || 'Usuario';
        userImg.src = user.photoURL || `https://placehold.co/30x30/ccc/fff?text=${user.displayName?.[0] || '?'}`;
        loginBtn.innerHTML = _createLoginButton(true); // Icono de 'logout'
        loginBtn.title = "Logout";
        loginBtn.dataset.isLoggedIn = 'true';
    } else {
        // Deslogueado
        userInfo.style.display = 'none';
        loginBtn.innerHTML = _createLoginButton(false); // Icono de 'login'
        loginBtn.title = "Login with Google";
        loginBtn.dataset.isLoggedIn = 'false';
    }
}

/**
 * Dibuja el grid del calendario para un mes específico.
 * @param {string} monthName - El nombre del mes (ej. "October").
 * @param {Array<object>} daysOfMonth - Array de objetos 'dia' para ese mes.
 * @param {string} todayId - El ID del día de hoy (ej. "10-26").
 * @param {function} onDayClick - Callback que se ejecuta al pulsar un día.
 */
function drawCalendar(monthName, daysOfMonth, todayId, onDayClick) {
    monthNameDisplayEl.textContent = monthName;

    let gridHTML = '<div class="calendario-grid" id="grid-dias">';
    
    if (daysOfMonth.length === 0) {
        gridHTML += "<p>No days found for this month.</p>";
    } else {
        daysOfMonth.forEach(dia => {
            const dayNum = dia.id.substring(3);
            const isToday = dia.id === todayId;
            const hasMemories = dia.tieneMemorias; // Asumimos que main.js nos pasa esto

            let classes = "dia-btn";
            if (isToday) classes += " dia-btn-today";
            if (hasMemories) classes += " tiene-memorias";

            gridHTML += `
                <button class="${classes}" data-dia-id="${dia.id}">
                    <span class="dia-numero">${dayNum}</span>
                </button>
            `;
        });
    }
    
    gridHTML += '</div>';
    appContent.innerHTML = gridHTML;

    // Añadir listeners después de crear el HTML
    const grid = document.getElementById("grid-dias");
    if (grid) {
        grid.addEventListener('click', (event) => {
            const button = event.target.closest('.dia-btn');
            if (button && button.dataset.diaId) {
                onDayClick(button.dataset.diaId);
            }
        });
    }
}

/**
 * Muestra el widget "Spotlight" de "Hoy".
 * @param {string} dateHeader - El texto (ej. "Today, 26 de Octubre").
 * @param {Array<object>} memories - Array de objetos 'memoria'.
 */
function drawTodaySpotlight(dateHeader, memories) {
    // (Esta función es llamada por main.js ANTES de drawCalendar)
    let spotlightHTML = `
        <h2 id="spotlight-date-header">${dateHeader}</h2>
        <div id="today-memory-spotlight">
    `;

    if (memories.length > 0) {
        memories.forEach(mem => {
            spotlightHTML += createMemoryItemHTML(mem, 'spotlight');
        });
    } else {
        spotlightHTML += '<p class="list-placeholder" style="color: #ccc;">No memories for today.</p>';
    }

    spotlightHTML += '</div>';
    
    // Inyecta el spotlight ANTES del contenido principal de la app
    // (main.js llamará a drawCalendar después, que sobrescribirá appContent)
    appContent.innerHTML = spotlightHTML;
}

/**
 * Muestra los resultados de una búsqueda en el 'main'.
 * @param {string} searchTerm - El término buscado.
 * @param {Array<object>} results - Array de objetos 'memoria' encontrados.
 * @param {function} onResultClick - Callback al pulsar un resultado.
 */
function drawSearchResults(searchTerm, results, onResultClick) {
    let html = `<h2 id="spotlight-date-header">Resultados para "${searchTerm}" (${results.length}):</h2>`;
    
    if (results.length === 0) {
        html += `<p class="list-placeholder" style="color: #ccc; padding: 20px;">No se encontraron recuerdos.</p>`;
    } else {
        html += '<div id="search-results-list" style="padding-top: 10px;">';
        results.forEach(mem => {
            // Reutilizamos la lógica de 'createMemoryItemHTML'
            html += createMemoryItemHTML(mem, 'search-result', onResultClick);
        });
        html += '</div>';
    }
    
    appContent.innerHTML = html;

    // Añadir listeners para los resultados de búsqueda
    const resultsList = document.getElementById("search-results-list");
    if (resultsList) {
        resultsList.addEventListener('click', (event) => {
            const item = event.target.closest('.search-result-item');
            if (item && item.dataset.diaId) {
                onResultClick(item.dataset.diaId);
            }
        });
    }
}

// --- Lógica de Modales ---

/**
 * Abre el modal de "Preview" (Vista Previa).
 * @param {object} dayData - El objeto del día.
 * @param {Array<object>} memories - Array de memorias para ese día.
 * @param {function} onEditClick - Callback para el botón de editar.
 */
function openPreviewModal(dayData, memories, onEditClick) {
    let modal = document.getElementById('preview-modal');
    if (!modal) {
        modal = _createPreviewModal();
        document.body.appendChild(modal);
    }

    // Configurar listeners (solo se hace una vez)
    const closeBtn = document.getElementById('close-preview-btn');
    const editBtn = document.getElementById('edit-from-preview-btn');
    
    closeBtn.onclick = closePreviewModal;
    editBtn.onclick = onEditClick; // Asigna el callback
    
    modal.onclick = (e) => {
        if (e.target.id === 'preview-modal') {
            closePreviewModal();
        }
    };

    // Rellenar datos
    const title = document.getElementById('preview-title');
    const listDiv = document.getElementById('preview-memorias-list');
    
    const dayName = dayData.Nombre_Especial !== 'Unnamed Day' 
        ? `(${dayData.Nombre_Especial})` 
        : '';
    title.textContent = `${dayData.Nombre_Dia} ${dayName}`;

    _populateMemoryList(listDiv, memories, 'preview');
    
    // Mostrar modal
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);
}

function closePreviewModal() {
    const modal = document.getElementById('preview-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 200);
    }
}

/**
 * Abre el modal de "Edición/Añadir".
 * @param {object | null} dayData - El objeto del día (o null si es "Añadir").
 * @param {Array<object>} memories - Las memorias existentes de ese día.
 * @param {Array<object>} allDays - Array de todos los días (para el <select>).
 * @param {object} handlers - Objeto con todos los callbacks (onSaveName, onSaveMemory, etc.)
 */
function openEditModal(dayData, memories, allDays, handlers) {
    let modal = document.getElementById('edit-add-modal');
    if (!modal) {
        modal = _createEditModal(allDays);
        document.body.appendChild(modal);
        // Asignar handlers estáticos del modal la primera vez
        _setupEditModalStaticHandlers(handlers);
    }

    const isAdding = !dayData;
    
    // Configurar modo
    document.getElementById('day-selection-section').style.display = isAdding ? 'block' : 'none';
    document.getElementById('day-name-section').style.display = isAdding ? 'none' : 'block';

    if (isAdding) {
        // Modo Añadir: Usar el día de hoy como default
        const today = new Date();
        const todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        document.getElementById('edit-mem-day').value = todayId;
        document.getElementById('edit-mem-year').value = today.getFullYear();
        document.getElementById('memory-form-title').textContent = "Add New Memory";
        _populateMemoryList(document.getElementById('edit-memorias-list'), [], 'edit', handlers); // Lista vacía
    } else {
        // Modo Edición: Rellenar con datos del día
        document.getElementById('edit-modal-title').textContent = `Editing: ${dayData.Nombre_Dia} (${dayData.id})`;
        const nameInput = document.getElementById('nombre-especial-input');
        nameInput.value = dayData.Nombre_Especial === 'Unnamed Day' ? '' : dayData.Nombre_Especial;
        document.getElementById('memory-form-title').textContent = "Add/Edit Memories";
        _populateMemoryList(document.getElementById('edit-memorias-list'), memories, 'edit', handlers);
    }

    // Resetear formulario y estado
    resetMemoryForm();
    showStatus('', 'save-status');
    showStatus('', 'memoria-status');
    document.getElementById('confirm-delete-dialog').style.display = 'none';
    
    // Mostrar modal
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);
}

function closeEditModal() {
    const modal = document.getElementById('edit-add-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 200);
    }
}

/**
 * Abre el modal del "Almacén" (Selector de Categorías).
 * @param {function} onCategoryClick - Callback al pulsar una categoría.
 */
function openStoreModal(onCategoryClick) {
    let modal = document.getElementById('store-modal');
    if (!modal) {
        modal = _createStoreModal();
        document.body.appendChild(modal);
        
        // Asignar listeners a los botones de categoría
        modal.addEventListener('click', (e) => {
            const button = e.target.closest('.store-category-btn');
            if (button && button.dataset.type) {
                onCategoryClick(button.dataset.type, button.dataset.title);
            }
            if (e.target.id === 'store-modal' || e.target.id === 'close-store-btn') {
                closeStoreModal();
            }
        });
    }
    
    // Mostrar modal
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);
}

function closeStoreModal() {
    const modal = document.getElementById('store-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 200);
    }
}

/**
 * Abre el modal de "Lista del Almacén" (Resultados).
 * @param {string} title - Título del modal (ej. "Lugares").
 * @param {Array<object>} items - Array de items a mostrar.
 * @param {boolean} hasMore - Si hay más items para cargar.
 * @param {object} handlers - Callbacks (onBack, onLoadMore, onItemClick).
 */
function openStoreListModal(title, items, hasMore, handlers) {
    let modal = document.getElementById('store-list-modal');
    if (!modal) {
        modal = _createStoreListModal();
        document.body.appendChild(modal);
        
        // Asignar listeners estáticos
        modal.onclick = (e) => {
            if (e.target.id === 'store-list-modal') {
                closeStoreListModal();
            }
        };
    }
    
    // Asignar handlers dinámicos
    document.getElementById('store-list-back-btn').onclick = handlers.onBack;
    document.getElementById('store-load-more-btn').onclick = handlers.onLoadMore;

    // Configurar
    document.getElementById('store-list-title').textContent = title;
    document.getElementById('store-load-more-btn').style.display = hasMore ? 'block' : 'none';
    
    _populateStoreList(items, handlers.onItemClick);

    // Mostrar modal
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);
}

function closeStoreListModal() {
    const modal = document.getElementById('store-list-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 200);
    }
}

/**
 * Añade nuevos items a la lista del almacén (paginación).
 * @param {Array<object>} items - Nuevos items a añadir.
 * @param {boolean} hasMore - Si sigue habiendo más items.
 * @param {function} onItemClick - Callback al pulsar un item.
 */
function appendStoreListItems(items, hasMore, onItemClick) {
    const listDiv = document.getElementById('store-results-list');
    const loadMoreBtn = document.getElementById('store-load-more-btn');
    
    if (!listDiv || !loadMoreBtn) return;
    
    // Quita el placeholder si existe
    const placeholder = listDiv.querySelector('.list-placeholder');
    if (placeholder) placeholder.remove();
    
    // Añade nuevos items
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
        const itemHTML = createStoreListItem(item);
        const div = document.createElement('div');
        div.innerHTML = itemHTML;
        div.firstElementChild.onclick = () => onItemClick(item.diaId);
        fragment.appendChild(div.firstElementChild);
    });
    listDiv.appendChild(fragment);
    
    // Oculta el botón si no hay más
    loadMoreBtn.style.display = hasMore ? 'block' : 'none';
    showStatus('', 'store-list-status');
}


// --- Funciones de Formulario y Estado ---

/**
 * Resetea el formulario de añadir/editar memoria a su estado inicial.
 */
function resetMemoryForm() {
    const form = document.getElementById('memory-form');
    if (form) form.reset();
    
    const saveButton = document.getElementById('save-memoria-btn');
    if (saveButton) {
        saveButton.textContent = 'Add Memory';
        saveButton.classList.remove('update-mode');
    }
    
    showStatus('', 'memoria-status');
    document.getElementById('itunes-results').innerHTML = '';
    document.getElementById('place-results').innerHTML = '';
    document.getElementById('image-upload-status').textContent = '';
    
    handleMemoryTypeChange(); // Asegura que se muestren los campos correctos
}

/**
 * Carga los datos de una memoria en el formulario para edición.
 * @param {object} memoria - El objeto de la memoria a editar.
 */
function fillMemoryForm(memoria) {
    document.getElementById('memoria-type').value = memoria.Tipo || 'Texto';
    const fechaInput = document.getElementById('memoria-fecha');
    if (memoria.Fecha_Original?.toDate) {
        try {
            fechaInput.value = memoria.Fecha_Original.toDate().toISOString().split('T')[0];
        } catch (e) { fechaInput.value = ''; }
    } else {
        fechaInput.value = '';
    }

    // Limpiar todos los campos
    document.getElementById('memoria-desc').value = '';
    document.getElementById('memoria-place-search').value = '';
    document.getElementById('memoria-music-search').value = '';
    document.getElementById('memoria-image-desc').value = '';
    document.getElementById('itunes-results').innerHTML = '';
    document.getElementById('place-results').innerHTML = '';
    document.getElementById('image-upload-status').textContent = '';
    document.getElementById('memoria-image-upload').value = null;

    // Rellenar el campo específico
    switch (memoria.Tipo) {
        case 'Lugar':
            document.getElementById('memoria-place-search').value = memoria.LugarNombre || '';
            break;
        case 'Musica':
            document.getElementById('memoria-music-search').value = memoria.CancionInfo || '';
            break;
        case 'Imagen':
            document.getElementById('memoria-image-desc').value = memoria.Descripcion || '';
            document.getElementById('image-upload-status').textContent = memoria.ImagenURL ? `Imagen guardada. Selecciona una nueva para reemplazar.` : '';
            break;
        case 'Texto':
        default:
            document.getElementById('memoria-desc').value = memoria.Descripcion || '';
            break;
    }
    
    document.getElementById('save-memoria-btn').textContent = 'Update Memory';
    document.getElementById('save-memoria-btn').classList.add('update-mode');
    handleMemoryTypeChange();
}

/**
 * Muestra u oculta los campos del formulario según el tipo de memoria.
 */
function handleMemoryTypeChange() {
    const type = document.getElementById('memoria-type').value;
    ['Texto', 'Lugar', 'Musica', 'Imagen'].forEach(id => {
        const div = document.getElementById(`input-type-${id}`);
        if (div) div.style.display = 'none';
    });
    
    const divToShow = document.getElementById(`input-type-${type}`);
    if (divToShow) divToShow.style.display = 'block';

    // Limpiar resultados si se cambia de tipo
    if (type !== 'Musica') document.getElementById('itunes-results').innerHTML = '';
    if (type !== 'Lugar') document.getElementById('place-results').innerHTML = '';
    if (type !== 'Imagen') document.getElementById('memoria-image-upload').value = null;
}

/**
 * Lee todos los valores del formulario de memoria.
 * @returns {object} - Objeto con los datos { diaId, year, memoryData, imageFile }
 * @throws {Error} - Si faltan datos o son inválidos.
 */
function getMemoryFormData() {
    let diaId;
    const daySelect = document.getElementById('edit-mem-day');
    const daySelectionVisible = document.getElementById('day-selection-section')?.style.display !== 'none';

    if (daySelectionVisible && daySelect?.value) {
        diaId = daySelect.value;
    } else {
        // Asumir que main.js ha guardado el día actual en un data-attribute
        const modal = document.getElementById('edit-add-modal');
        diaId = modal?.dataset.currentDayId;
    }

    const yearInput = document.getElementById('edit-mem-year');
    const year = parseInt(yearInput.value, 10);
    const type = document.getElementById('memoria-type').value;
    const fechaStr = document.getElementById('memoria-fecha').value;

    if (!diaId || !year || isNaN(year) || year < 1800 || year > new Date().getFullYear() + 10 || !fechaStr) {
        throw new Error('Día, año y fecha son obligatorios.');
    }

    let dateOfMemory;
    try {
        const dateParts = fechaStr.split('-'); // YYYY-MM-DD
        // Usar UTC para evitar problemas de zona horaria
        dateOfMemory = new Date(Date.UTC(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])));
        if (isNaN(dateOfMemory.getTime())) throw new Error('Fecha inválida');
    } catch (e) {
        throw new Error('Formato de fecha inválido.');
    }

    const memoryData = {
        // Fecha_Original se añadirá en main.js (necesita Timestamp)
        Tipo: type,
    };
    
    let imageFile = null;
    let isValid = false;

    switch (type) {
        case 'Texto':
            memoryData.Descripcion = document.getElementById('memoria-desc').value.trim();
            if (memoryData.Descripcion) isValid = true;
            break;
        case 'Lugar':
            // main.js añadirá 'LugarData' desde su estado 'selectedPlace'
            memoryData.LugarNombre = document.getElementById('memoria-place-search').value.trim();
            if (memoryData.LugarNombre) isValid = true;
            break;
        case 'Musica':
            // main.js añadirá 'CancionData' desde su estado 'selectedMusicTrack'
            memoryData.CancionInfo = document.getElementById('memoria-music-search').value.trim();
            if (memoryData.CancionInfo) isValid = true;
            break;
        case 'Imagen':
            memoryData.Descripcion = document.getElementById('memoria-image-desc').value.trim() || null;
            const fileInput = document.getElementById('memoria-image-upload');
            if (fileInput.files && fileInput.files[0]) {
                imageFile = fileInput.files[0];
                isValid = true; // Válido si hay un archivo
            } else {
                // Es válido si estamos editando Y no se ha seleccionado archivo nuevo
                const isEditing = document.getElementById('save-memoria-btn').classList.contains('update-mode');
                if (isEditing) isValid = true;
            }
            break;
    }

    if (!isValid) {
        throw new Error('Por favor, rellena los campos de la memoria o selecciona un archivo.');
    }

    return { diaId, year, memoryData, dateOfMemory, imageFile };
}


/**
 * Muestra los resultados de búsqueda de iTunes.
 * @param {Array<object>} results - Array de resultados.
 * @param {function} onSelect - Callback al seleccionar una canción.
 */
function showiTunesResults(results, onSelect) {
    const resultsDiv = document.getElementById('itunes-results');
    resultsDiv.innerHTML = '';
    if (results.length === 0) {
        resultsDiv.innerHTML = '<p class="list-placeholder">No results found.</p>';
        return;
    }
    
    results.forEach(track => {
        const trackDiv = document.createElement('div');
        trackDiv.className = 'itunes-track';
        const artwork = track.artworkUrl100 || track.artworkUrl60 || '';
        trackDiv.innerHTML = `
            <img src="${artwork}" class="itunes-artwork" style="${artwork ? '' : 'display:none;'}" onerror="this.style.display='none';">
            <div class="itunes-track-info">
                <div class="itunes-track-name">${track.trackName || '?'}</div>
                <div class="itunes-track-artist">${track.artistName || '?'}</div>
            </div>
            <div class="itunes-track-select">➔</div>
        `;
        trackDiv.onclick = () => {
            onSelect(track);
            // Actualizar UI para mostrar selección
            document.getElementById('memoria-music-search').value = `${track.trackName} - ${track.artistName}`;
            resultsDiv.innerHTML = `<p class="success" style="padding: 10px;">Seleccionado: ${track.trackName}</p>`;
        };
        resultsDiv.appendChild(trackDiv);
    });
}

/**
 * Muestra los resultados de búsqueda de Nominatim (Lugares).
 * @param {Array<object>} results - Array de resultados.
 * @param {function} onSelect - Callback al seleccionar un lugar.
 */
function showPlaceResults(results, onSelect) {
    const resultsDiv = document.getElementById('place-results');
    resultsDiv.innerHTML = '';
    if (results.length === 0) {
        resultsDiv.innerHTML = '<p class="list-placeholder">No results found.</p>';
        return;
    }
    
    results.forEach(place => {
        const placeDiv = document.createElement('div');
        placeDiv.className = 'place-result';
        placeDiv.innerHTML = `${place.display_name}`;
        placeDiv.onclick = () => {
            const placeData = {
                name: place.display_name,
                lat: place.lat,
                lon: place.lon,
                osm_id: place.osm_id,
                osm_type: place.osm_type
            };
            onSelect(placeData);
            // Actualizar UI
            document.getElementById('memoria-place-search').value = place.display_name;
            resultsDiv.innerHTML = `<p class="success" style="padding: 10px;">Seleccionado.</p>`;
        };
        resultsDiv.appendChild(placeDiv);
    });
}

/**
 * Muestra un popup de confirmación de borrado.
 * @param {string} text - El texto a mostrar (ej. "Borrar 'Pizza Day'?")
 * @param {function} onConfirm - Callback si se pulsa "Sí".
 */
function showDeleteConfirm(text, onConfirm) {
    const dialog = document.getElementById('confirm-delete-dialog');
    const textEl = document.getElementById('confirm-delete-text');
    const yesBtn = document.getElementById('confirm-delete-yes');
    const noBtn = document.getElementById('confirm-delete-no');

    if (!dialog || !textEl || !yesBtn || !noBtn) return;
    
    textEl.textContent = text;
    
    // Asignar nuevos listeners
    yesBtn.onclick = ()D => {
        dialog.style.display = 'none';
        onConfirm();
    };
    noBtn.onclick = () => {
        dialog.style.display = 'none';
    };
    
    dialog.style.display = 'block';
}

/**
 * Muestra un mensaje de estado (loading, success, error) en un div específico.
 * @param {string} message - El mensaje a mostrar.
 * @param {string} elementId - El ID del elemento donde mostrar el mensaje.
 * @param {'success' | 'error' | ''} type - El tipo de mensaje.
 */
function showStatus(message, elementId, type = '') {
    const statusDiv = document.getElementById(elementId);
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = type; // 'success' o 'error' o ''
    }
}

/**
 * Inicializa el mapa de Leaflet en el div especificado.
 * @param {string} elementId - ID del div (ej. 'leaflet-map').
 * @param {number} lat - Latitud.
 * @param {number} lon - Longitud.
 * @param {string} markerText - Texto para el popup del marcador.
 * @returns {object} - La instancia del mapa de Leaflet.
 */
function initMap(elementId, lat, lon, markerText) {
    // Asegurarse de que el div está visible y limpio
    const mapDiv = document.getElementById(elementId);
    if (!mapDiv) {
        console.error(`Map container #${elementId} not found.`);
        return null;
    }
    mapDiv.innerHTML = ''; // Limpiar mapa anterior
    
    // Forzar un tamaño si no lo tiene (Leaflet lo necesita)
    if (!mapDiv.style.height) {
        mapDiv.style.height = '250px'; 
    }

    try {
        const map = L.map(elementId).setView([lat, lon], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        L.marker([lat, lon]).addTo(map)
            .bindPopup(markerText)
            .openPopup();
            
        // Forzar a Leaflet a recalcular el tamaño
        // (útil si estaba en un modal oculto)
        setTimeout(() => map.invalidateSize(), 100); 
            
        return map;
    } catch (e) {
        console.error("Error initializing Leaflet map:", e);
        mapDiv.innerHTML = `<p class="error">Error al cargar el mapa. ${e.message}</p>`;
        return null;
    }
}

// --- Funciones Privadas de Creación de HTML ---
// (Prefijo _ para indicar "privada" del módulo)

/**
 * Genera el HTML para el botón de login/logout.
 * @param {boolean} isLoggedIn - Si el usuario está logueado.
 * @returns {string} HTML del icono.
 */
function _createLoginButton(isLoggedIn) {
    if (isLoggedIn) {
        return '<span class="material-icons-outlined">logout</span>';
    } else {
        // Usar un icono de Google genérico o el de la 'G'
        // Por ahora, un icono estándar de login.
        return '<span class="material-icons-outlined">login</span>';
        // Alternativa:
        // return `<img src="https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1OLUbq VilNfRHXkvdR8VdVAbkuQGcuSgs5nbDbpaE8nhzo6g=s0-w24-h24-p-k-rw-no" alt="G" style="width: 24px; height: 24px; border-radius: 50%;">`;
    }
}

/**
 * Crea el elemento DOM del modal de "Preview".
 * @returns {HTMLElement} El elemento del modal.
 */
function _createPreviewModal() {
    const modal = document.createElement('div');
    modal.id = 'preview-modal';
    modal.className = 'modal'; // Clase base
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="preview-title"></h3>
                <button id="edit-from-preview-btn" title="Edit this day">
                    <span class="material-icons-outlined">drive_file_rename_outline</span>
                </button>
            </div>
            <div class="modal-content-scrollable">
                <div class="modal-section modal-preview-memorias">
                    <h4>Memorias:</h4>
                    <div id="preview-memorias-list">Loading...</div>
                </div>
            </div>
            <button id="close-preview-btn" class="aqua-button">Cerrar</button>
        </div>
    `;
    return modal;
}

/**
 * Crea el elemento DOM del modal de "Edición".
 * @param {Array<object>} allDays - Array de todos los días (para el <select>).
 * @returns {HTMLElement} El elemento del modal.
 */
function _createEditModal(allDays) {
    const modal = document.createElement('div');
    modal.id = 'edit-add-modal';
    modal.className = 'modal modal-edit';
    
    // Crear el <select> de días
    let dayOptions = '';
    allDays.forEach(d => {
        dayOptions += `<option value="${d.id}">${d.Nombre_Dia}</option>`;
    });

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-content-scrollable">
                
                <!-- Sección de Selección de Día (Solo modo Añadir) -->
                <div class="modal-section" id="day-selection-section" style="display: none;">
                     <h3>Añadir Memoria a...</h3>
                     <label for="edit-mem-day">Día (MM-DD):</label>
                     <select id="edit-mem-day">${dayOptions}</select>
                     <label for="edit-mem-year">Año de la Memoria:</label>
                     <input type="number" id="edit-mem-year" placeholder="YYYY" min="1800" max="${new Date().getFullYear() + 10}" required>
                </div>
                
                <!-- Sección de Nombre del Día (Solo modo Edición) -->
                <div class="modal-section" id="day-name-section" style="display: none;">
                    <h3 id="edit-modal-title"></h3>
                    <label for="nombre-especial-input">Nombrar este día:</label>
                    <input type="text" id="nombre-especial-input" placeholder="e.g., Día de la Pizza" maxlength="25">
                    <button id="save-name-btn" class="aqua-button">Guardar Nombre del Día</button>
                    <p id="save-status"></p>
                </div>
                
                <!-- Sección de Memorias (Siempre visible) -->
                <div class="modal-section memorias-section">
                    <h4>Memorias</h4>
                    <div id="edit-memorias-list">Loading...</div>
                    <form id="memory-form">
                         <p class="section-description" id="memory-form-title">Añadir/Editar Memoria</p>
                         
                         <label for="memoria-fecha">Fecha Original:</label>
                         <input type="date" id="memoria-fecha" required>
                         
                         <label for="memoria-type">Tipo:</label>
                         <select id="memoria-type">
                            <option value="Texto">📝 Nota</option>
                            <option value="Lugar">📍 Lugar</option>
                            <option value="Musica">🎵 Canción</option>
                            <option value="Imagen">🖼️ Foto</option>
                         </select>
                         
                         <!-- Inputs Dinámicos -->
                         <div class="add-memory-input-group" id="input-type-Texto">
                            <label for="memoria-desc">Descripción:</label>
                            <textarea id="memoria-desc" placeholder="Escribe tu recuerdo..."></textarea>
                         </div>
                         <div class="add-memory-input-group" id="input-type-Lugar">
                            <label for="memoria-place-search">Buscar Lugar:</label>
                            <input type="text" id="memoria-place-search" placeholder="Ej: Torre Eiffel, París">
                            <button type="button" class="aqua-button" id="btn-search-place">Buscar</button>
                            <div id="place-results"></div>
                         </div>
                         <div class="add-memory-input-group" id="input-type-Musica">
                            <label for="memoria-music-search">Buscar Canción/Artista:</label>
                            <input type="text" id="memoria-music-search" placeholder="Ej: Bohemian Rhapsody">
                            <button type="button" class="aqua-button" id="btn-search-itunes">Buscar</Búsqueda>
                            <div id="itunes-results"></div>
                         </div>
                         <div class="add-memory-input-group" id="input-type-Imagen">
                            <label for="memoria-image-upload">Subir Imagen:</label>
                            <input type="file" id="memoria-image-upload" accept="image/*">
                            <div id="image-upload-status"></div>
                            <label for="memoria-image-desc">Descripción (opcional):</label>
                            <input type="text" id="memoria-image-desc" placeholder="Descripción de la foto...">
                         </div>
                         
                         <button type="submit" id="save-memoria-btn" class="aqua-button">Añadir Memoria</button>
                         <p id="memoria-status"></p>
                    </form>
                </div>
                
                <!-- Diálogo de Confirmación (movido aquí) -->
                <div id="confirm-delete-dialog" style="display: none;">
                    <p id="confirm-delete-text"></p>
                    <button id="confirm-delete-no" class="aqua-button">Cancelar</button>
                    <button id="confirm-delete-yes" class="aqua-button">Borrar</button>
                </div>

            </div> <!-- Fin scrollable -->
            
            <!-- Botones Principales -->
            <div class="modal-main-buttons">
                <button id="close-edit-add-btn">Cerrar</button>
            </div>
        </div>
    `;
    return modal;
}

/**
 * Asigna los listeners estáticos al modal de Edición (solo se llama una vez).
 * @param {object} handlers - Objeto de callbacks de main.js
 */
function _setupEditModalStaticHandlers(handlers) {
    document.getElementById('close-edit-add-btn').onclick = closeEditModal;
    document.getElementById('edit-add-modal').onclick = (e) => {
        if (e.target.id === 'edit-add-modal') closeEditModal();
    };
    
    // Formulario
    document.getElementById('memory-form').onsubmit = (e) => {
        e.preventDefault();
        handlers.onSaveMemory();
    };
    document.getElementById('save-name-btn').onclick = handlers.onSaveName;
    
    // Select de Tipo
    document.getElementById('memoria-type').onchange = handleMemoryTypeChange;
    
    // Búsquedas API
    document.getElementById('btn-search-itunes').onclick = handlers.onSearchiTunes;
    document.getElementById('btn-search-place').onclick = handlers.onSearchPlace;

    // Confirmación de borrado
    document.getElementById('confirm-delete-no').onclick = () => {
        document.getElementById('confirm-delete-dialog').style.display = 'none';
    };
    // onConfirm (yes) se asigna dinámicamente en showDeleteConfirm
}


/**
 * Crea el elemento DOM del modal "Almacén" (Categorías).
 * @returns {HTMLElement} El elemento del modal.
 */
function _createStoreModal() {
    const modal = document.createElement('div');
    modal.id = 'store-modal';
    modal.className = 'modal modal-store';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Almacén</h3>
            </div>
            <div class="modal-content-scrollable">
                <div class="modal-section">
                    <p class="section-description">Explorar todas las memorias por tipo.</p>
                    ${createStoreCategoryButton('namedDays', 'Nombres de Día', 'label')}
                    ${createStoreCategoryButton('Lugar', 'Lugares', 'place')}
                    ${createStoreCategoryButton('Musica', 'Canciones', 'music_note')}
                    ${createStoreCategoryButton('Imagen', 'Fotos', 'image')}
                    ${createStoreCategoryButton('Texto', 'Notas', 'article')}
                </div>
            </div>
            <div class="modal-main-buttons">
                <button id="close-store-btn">Cerrar</button>
            </div>
        </div>
    `;
    return modal;
}

/**
 * Crea el elemento DOM del modal "Lista del Almacén" (Resultados).
 * @returns {HTMLElement} El elemento del modal.
 */
function _createStoreListModal() {
    const modal = document.createElement('div');
    modal.id = 'store-list-modal';
    modal.className = 'modal modal-store-list';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header" id="store-list-header">
                <button id="store-list-back-btn" title="Volver">
                    <span class="material-icons-outlined">arrow_back_ios</span>
                </button>
                <h3 id="store-list-title">Resultados</h3>
            </div>
            <div class="modal-content-scrollable">
                <div class="modal-section">
                    <div id="store-results-list">
                        <!-- Los resultados se inyectan aquí -->
                    </div>
                    <button id="store-load-more-btn" class="aqua-button">Cargar Más</button>
                    <p id="store-list-status"></p>
                </div>
            </div>
        </div>
    `;
    return modal;
}


// --- Funciones de Relleno de Listas (HTML) ---

/**
 * Rellena un div con la lista de memorias.
 * @param {HTMLElement} listDiv - El elemento <div> a rellenar.
 * @param {Array<object>} memories - Array de objetos de memoria.
 * @param {'preview' | 'edit'} mode - El modo (afecta si se añaden botones).
 * @param {object} [handlers] - Callbacks (onEditMemory, onDeleteMemory)
 */
function _populateMemoryList(listDiv, memories, mode, handlers) {
    if (memories.length === 0) {
        listDiv.innerHTML = '<p class="list-placeholder">No hay memorias para este día.</p>';
        return;
    }
    
    listDiv.innerHTML = ''; // Limpiar
    const fragment = document.createDocumentFragment();
    
    memories.forEach(mem => {
        const itemHTML = createMemoryItemHTML(mem, 'list');
        const actionsHTML = (mode === 'edit') ? `
            <div class="memoria-actions">
                <button class="edit-btn" title="Editar" data-memoria-id="${mem.id}">
                    <span class="material-icons-outlined">edit</span>
                </button>
                <button class="delete-btn" title="Borrar" data-memoria-id="${mem.id}">
                    <span class="material-icons-outlined">delete</span>
                </button>
            </div>
        ` : '';
        
        const div = document.createElement('div');
        div.className = 'memoria-item';
        div.innerHTML = itemHTML + actionsHTML;
        fragment.appendChild(div);
    });
    
    listDiv.appendChild(fragment);

    // Asignar listeners de edición/borrado si estamos en modo 'edit'
    if (mode === 'edit' && handlers) {
        listDiv.addEventListener('click', (event) => {
            const editButton = event.target.closest('.edit-btn');
            if (editButton) {
                handlers.onEditMemory(editButton.dataset.memoriaId);
                return; // Evitar bubbling
            }
            
            const deleteButton = event.target.closest('.delete-btn');
            if (deleteButton) {
                handlers.onDeleteMemory(deleteButton.dataset.memoriaId);
                return; // Evitar bubbling
            }
        });
        // Clonar para limpiar listeners antiguos (solución simple)
        // listDiv.replaceWith(listDiv.cloneNode(true)); 
    }
}

/**
 * Rellena la lista de resultados del Almacén.
 * @param {Array<object>} items - Array de items a mostrar.
 * @param {function} onItemClick - Callback al pulsar un item.
 */
function _populateStoreList(items, onItemClick) {
    const listDiv = document.getElementById('store-results-list');
    if (!listDiv) return;

    if (items.length === 0) {
        listDiv.innerHTML = '<p class="list-placeholder">No se encontraron items.</p>';
        return;
    }
    
    listDiv.innerHTML = ''; // Limpiar
    const fragment = document.createDocumentFragment();
    
    items.forEach(item => {
        const itemHTML = createStoreListItem(item);
        const div = document.createElement('div');
        div.innerHTML = itemHTML; // El HTML ya es un <button>
        // Asignar el callback
        div.firstElementChild.onclick = () => onItemClick(item.diaId);
        fragment.appendChild(div.firstElementChild);
    });
    
    listDiv.appendChild(fragment);
}


/**
 * Genera el HTML INTERNO para un item de memoria (reutilizable).
 * @param {object} mem - El objeto de memoria.
 * @param {'list' | 'spotlight' | 'search-result'} context - Dónde se mostrará.
 * @returns {string} HTML.
 */
function createMemoryItemHTML(mem, context) {
    let fechaStr = 'Fecha desconocida';
    if (mem.Fecha_Original?.toDate) {
        try {
            fechaStr = mem.Fecha_Original.toDate().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) { /* fallback */ }
    }
    
    let contentHTML = `<small>${fechaStr}</small>`;
    let icon = 'article'; // Icono por defecto (Texto)

    switch (mem.Tipo) {
        case 'Lugar':
            icon = 'place';
            contentHTML += `<strong>${mem.LugarNombre || 'Lugar'}</strong>`;
            if (mem.LugarData?.lat && context !== 'spotlight') {
                contentHTML += `<div id="map-${mem.id}" class="leaflet-map-preview" style="height: 150px; width: 100%; margin-top: 8px; border-radius: 5px;"></div>`;
            }
            break;
        case 'Musica':
            icon = 'music_note';
            if (mem.CancionData?.trackName) {
                contentHTML += `<strong>${mem.CancionData.trackName}</strong><small style="font-weight:normal; color: #777;"> by ${mem.CancionData.artistName}</small>`;
            } else {
                contentHTML += `<strong>${mem.CancionInfo || 'Canción'}</strong>`;
            }
            break;
        case 'Imagen':
            icon = 'image';
            contentHTML += `<strong>Foto</strong>`;
            if (mem.ImagenURL && context !== 'spotlight') {
                contentHTML += `<img src="${memI.ImagenURL}" style="width: 100%; max-height: 150px; object-fit: cover; margin-top: 8px; border-radius: 5px;" alt="Memoria" onerror="this.style.display='none'">`;
            }
            if (mem.Descripcion) {
                contentHTML += `<small style="font-weight:normal; color: #555; margin-top: 4px;">${mem.Descripcion}</small>`;
            }
            break;
        case 'Texto':
        default:
            icon = 'article';
            contentHTML += mem.Descripcion || 'Nota vacía';
            break;
    }

    // Componer el HTML final
    if (context === 'search-result') {
        // En búsqueda, necesitamos info del día
        const diaInfo = `${mem.diaNombre} (${mem.diaId})`;
        return `
            <button class="memoria-item search-result-item" data-dia-id="${mem.diaId}">
                <div class="memoria-item-content">
                    <span class="material-icons-outlined">${icon}</span>
                    <div>
                        <small style="color: #007aff; font-weight: bold;">${diaInfo}</small>
                        ${contentHTML}
                    </div>
                </div>
            </button>
        `;
    }
    
    if (context === 'spotlight') {
        return `
            <div class="spotlight-memory-item" data-memoria-id="${mem.id}">
                <span class="material-icons-outlined">${icon}</span>
                <div>${contentHTML}</div>
            </div>
        `;
    }

    // Contexto 'list' (en preview o edit)
    const artwork = (mem.Tipo === 'Musica' && mem.CancionData?.artworkUrl60)
        ? `<img src="${mem.CancionData.artworkUrl60}" class="memoria-artwork">`
        : '';
        
    return `
        ${artwork}
        <div class="memoria-item-content">
            <span class="material-icons-outlined" style="${artwork ? 'display:none;' : ''}">${icon}</span>
            <div>${contentHTML}</div>
        </div>
    `;
}

/**
 * Genera el HTML para un botón de categoría del Almacén.
 * @param {string} type - El tipo de memoria (ej. "Lugar").
 * @param {string} title - El texto del botón (ej. "Lugares").
 * @param {string} iconName - El nombre del icono de Material Icons.
 * @returns {string} HTML del botón.
 */
function createStoreCategoryButton(type, title, iconName) {
    return `
        <button class="store-category-btn" data-type="${type}" data-title="${title}">
            <span class="material-icons-outlined">${iconName}</span>
            ${title}
        </button>
    `;
}

/**
 * Genera el HTML para un item en la lista del Almacén.
 * @param {object} item - El objeto (puede ser Memoria o Día).
 * @returns {string} HTML del botón.
 */
function createStoreListItem(item) {
    let icon = 'article';
    let title = '';
    let subtitle = '';

    if (item.Nombre_Especial) {
        // Es un "Día Nombrado"
        icon = 'label';
        title = item.Nombre_Especial;
        subtitle = item.Nombre_Dia; // ej. "6 de Enero"
    } else {
        // Es una "Memoria"
        subtitle = `${item.diaNombre} (${item.diaId})`;
        switch (item.Tipo) {
            case 'Lugar':
                icon = 'place';
                title = item.LugarNombre;
                break;
            case 'Musica':
                icon = 'music_note';
                title = item.CancionInfo || 'Canción';
                break;
            case 'Imagen':
                icon = 'image';
                title = item.Descripcion || 'Foto';
                break;
            case 'Texto':
            default:
                icon = 'article';
                title = item.Descripcion?.substring(0, 50) + (item.Descripcion?.length > 50 ? '...' : '') || 'Nota';
                break;
        }
    }
    
    // Devolvemos un <button> para que sea semánticamente correcto
    return `
        <button class="memoria-item" data-dia-id="${item.diaId}">
            <div class="memoria-item-content">
                <span class="material-icons-outlined">${icon}</span>
                <div>
                    <strong>${title}</strong>
                    <small>${subtitle}</small>
                </div>
            </div>
        </button>
    `;
}


// --- Exportar API Pública ---
export const ui = {
    setupStaticListeners,
    updateLoginUI,
    drawCalendar,
    drawTodaySpotlight,
    drawSearchResults,
    openPreviewModal,
    closePreviewModal,
    openEditModal,
    closeEditModal,
    openStoreModal,
    closeStoreModal,
    openStoreListModal,
    closeStoreListModal,
    appendStoreListItems,
    resetMemoryForm,
    fillMemoryForm,
    handleMemoryTypeChange,
    getMemoryFormData,
    showiTunesResults,
    showPlaceResults,
    showDeleteConfirm,
    showStatus,
    initMap
};

