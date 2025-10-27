/*
 * ui.js (v4.1)
 * Módulo de Interfaz de Usuario (UI) para Ephemerides
 * Gestiona toda la manipulación del DOM (dibujar, crear modales, gestionar eventos).
 */

// --- Variables de Estado Internas ---
let state = {
    // Callbacks (funciones) proporcionados por main.js
    onMonthChange: (direction) => console.warn('onMonthChange not set', direction),
    onDayClick: (dia) => console.warn('onDayClick not set', dia),
    onFooterAction: (action) => console.warn('onFooterAction not set', action),
    onLogin: () => console.warn('onLogin not set'),
    onLogout: () => console.warn('onLogout not set'),
    
    // Callbacks para modales (interacciones)
    onSaveDayName: (diaId, newName) => console.warn('onSaveDayName not set', diaId, newName),
    onSaveMemory: (diaId, memoryData, isEditing) => console.warn('onSaveMemory not set', diaId, memoryData, isEditing),
    onDeleteMemory: (diaId, memId) => console.warn('onDeleteMemory not set', diaId, memId),
    onSearchMusic: (term) => console.warn('onSearchMusic not set', term),
    onSearchPlace: (term) => console.warn('onSearchPlace not set', term),
    
    onStoreCategoryClick: (type) => console.warn('onStoreCategoryClick not set', type),
    onStoreLoadMore: () => console.warn('onStoreLoadMore not set'),
    onStoreItemClick: (diaId) => console.warn('onStoreItemClick not set', diaId),

    // Estado interno
    isEditModalOpen: false,
    isPreviewModalOpen: false,
    isStoreModalOpen: false,
    isStoreListModalOpen: false,
    editingMemory: null, // Guarda el objeto de memoria que se está editando
    selectedMusicTrack: null, // Almacena el objeto de música seleccionado
    selectedPlace: null, // Almacena el objeto de lugar seleccionado
};

// --- Elementos del DOM (cache) ---
// Se cachean aquí para evitar múltiples `getElementById`
const dom = {};

/**
 * Inicializa el módulo de UI cacheando los elementos principales
 * y conectando los eventos estáticos (header, nav, footer).
 */
function init(callbacks) {
    console.log("UI Module Init (v4.1)");
    
    // Cachear elementos estáticos
    dom.appContent = document.getElementById('app-content');
    dom.monthNameDisplay = document.getElementById('month-name-display');
    dom.spotlightSection = document.getElementById('spotlight-section');
    dom.spotlightDateHeader = document.getElementById('spotlight-date-header');
    dom.spotlightList = document.getElementById('today-memory-spotlight');

    // Conectar callbacks de main.js
    if (callbacks.onMonthChange) state.onMonthChange = callbacks.onMonthChange;
    if (callbacks.onDayClick) state.onDayClick = callbacks.onDayClick;
    if (callbacks.onFooterAction) state.onFooterAction = callbacks.onFooterAction;
    if (callbacks.onLogin) state.onLogin = callbacks.onLogin;
    if (callbacks.onLogout) state.onLogout = callbacks.onLogout;
    
    // Callbacks de modales
    if (callbacks.onSaveDayName) state.onSaveDayName = callbacks.onSaveDayName;
    if (callbacks.onSaveMemory) state.onSaveMemory = callbacks.onSaveMemory;
    if (callbacks.onDeleteMemory) state.onDeleteMemory = callbacks.onDeleteMemory;
    if (callbacks.onSearchMusic) state.onSearchMusic = callbacks.onSearchMusic;
    if (callbacks.onSearchPlace) state.onSearchPlace = callbacks.onSearchPlace;
    
    if (callbacks.onStoreCategoryClick) state.onStoreCategoryClick = callbacks.onStoreCategoryClick;
    if (callbacks.onStoreLoadMore) state.onStoreLoadMore = callbacks.onStoreLoadMore;
    if (callbacks.onStoreItemClick) state.onStoreItemClick = callbacks.onStoreItemClick;

    // Conectar eventos estáticos
    _connectNavEvents();
    _connectFooterEvents();
    _connectLoginEvents(); // Conecta el botón de login/logout del header
    
    console.log("UI Event Listeners Connected.");
}

// --- Funciones de Conexión de Eventos ---

function _connectNavEvents() {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    
    if (prevBtn) prevBtn.onclick = () => state.onMonthChange('prev');
    if (nextBtn) nextBtn.onclick = () => state.onMonthChange('next');
}

function _connectFooterEvents() {
    document.getElementById('btn-add-memory')?.addEventListener('click', () => state.onFooterAction('add'));
    document.getElementById('btn-store')?.addEventListener('click', () => state.onFooterAction('store'));
    document.getElementById('btn-shuffle')?.addEventListener('click', () => state.onFooterAction('shuffle'));
    document.getElementById('btn-buscar')?.addEventListener('click', () => state.onFooterAction('search'));
}

function _connectLoginEvents() {
    const loginBtn = document.getElementById('login-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    
    if (loginBtn) {
        // La acción (login o logout) se determina en updateLoginUI
        loginBtn.onclick = () => {
            // El estado actual (logueado o no) lo decide la UI
            const isUserLoggedIn = loginBtn.dataset.isLoggedIn === 'true';
            if (isUserLoggedIn) {
                state.onLogout();
            } else {
                state.onLogin();
            }
        };
    }
    
    if (refreshBtn) {
        refreshBtn.onclick = () => window.location.reload();
    }
}

// --- Renderizado Principal ---

/**
 * Dibuja el grid del calendario para un mes específico.
 * @param {string} monthName - El nombre del mes (ej. "Octubre").
 * @param {Array} days - Array de objetos de día para ese mes.
 * @param {string} todayId - El ID del día de hoy (ej. "10-26").
 */
function drawCalendar(monthName, days, todayId) {
    if (!dom.appContent || !dom.monthNameDisplay) {
        console.error("UI no inicializada. Faltan appContent o monthNameDisplay.");
        return;
    }
    
    dom.monthNameDisplay.textContent = monthName;
    
    // Limpiar grid anterior
    dom.appContent.innerHTML = ''; 
    
    const grid = document.createElement('div');
    grid.className = 'calendario-grid';
    
    const fragment = document.createDocumentFragment();

    days.forEach(dia => {
        const btn = document.createElement("button");
        btn.className = "dia-btn";
        btn.dataset.diaId = dia.id;
        
        // Extraer el número del día (ej. "05" -> "5")
        const dayNumber = parseInt(dia.id.substring(3), 10);
        btn.innerHTML = `<span class="dia-numero">${dayNumber}</span>`;
        
        // Marcar si tiene memorias
        if (dia.tieneMemorias) {
            btn.classList.add('tiene-memorias');
        }
        
        // Marcar si es hoy (banda roja)
        if (dia.id === todayId) {
            btn.classList.add('dia-btn-today');
        }

        btn.addEventListener('click', () => state.onDayClick(dia));
        fragment.appendChild(btn);
    });
    
    grid.appendChild(fragment);
    dom.appContent.appendChild(grid);
}

/**
 * Actualiza el widget "Spotlight" con las memorias de hoy.
 * @param {string} dateString - El string de la fecha de hoy (ej. "Hoy, 26 de Octubre").
 * @param {Array} memories - Array de objetos de memoria.
 */
function updateSpotlight(dateString, memories) {
    if (!dom.spotlightSection || !dom.spotlightDateHeader || !dom.spotlightList) {
        console.warn("Elementos del Spotlight no encontrados.");
        return;
    }

    if (memories.length > 0) {
        dom.spotlightSection.style.display = 'block';
        dom.spotlightDateHeader.textContent = dateString;
        
        dom.spotlightList.innerHTML = ''; // Limpiar
        const fragment = document.createDocumentFragment();
        
        memories.forEach(mem => {
            const memHTML = _createMemoryItemHTML(mem, false); // false = no mostrar acciones
            const itemDiv = document.createElement('div');
            itemDiv.className = 'spotlight-memory-item';
            itemDiv.innerHTML = memHTML;
            fragment.appendChild(itemDiv);
        });
        dom.spotlightList.appendChild(fragment);
        
    } else {
        // Ocultar si no hay memorias para hoy
        dom.spotlightSection.style.display = 'none';
    }
}

/**
 * Actualiza la UI del header para reflejar el estado de login.
 * @param {Object} user - El objeto de usuario de Firebase, o null.
 */
function updateLoginUI(user) {
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const userImg = document.getElementById('user-img');

    if (!loginBtn || !userInfo || !userName || !userImg) {
        console.error("Elementos de UI de Login no encontrados.");
        return;
    }
    
    if (user) {
        // Usuario logueado
        userInfo.style.display = 'flex';
        userName.textContent = user.displayName || 'Usuario';
        userImg.src = user.photoURL || 'https://placehold.co/30x30/ccc/fff?text=?';
        
        // Cambiar botón a "Logout"
        loginBtn.innerHTML = `<span class="material-icons-outlined">logout</span>`;
        loginBtn.title = "Logout";
        loginBtn.dataset.isLoggedIn = 'true';
        
    } else {
        // Usuario no logueado
        userInfo.style.display = 'none';
        
        // Cambiar botón a "Login"
        const googleIconHTML = _createLoginButton(); // Usar la función interna
        loginBtn.innerHTML = googleIconHTML;
        loginBtn.title = "Login con Google";
        loginBtn.dataset.isLoggedIn = 'false';
    }
}

// --- Funciones de Modales ---

// --- Modal de Preview (Vista) ---

function openPreviewModal(dia, memories) {
    if (state.isPreviewModalOpen) return;
    state.isPreviewModalOpen = true;

    let modal = document.getElementById('preview-modal');
    if (!modal) {
        modal = _createPreviewModal();
        document.body.appendChild(modal);
    }
    
    // Rellenar datos
    const titleEl = document.getElementById('preview-title');
    const listEl = document.getElementById('preview-memorias-list');
    
    if (titleEl) {
         titleEl.textContent = `${dia.Nombre_Dia} ${dia.Nombre_Especial !== 'Unnamed Day' ? '('+dia.Nombre_Especial+')' : ''}`;
    }
    
    // Cargar memorias
    _renderMemoryList(listEl, memories, false, null); // false = sin acciones

    // Conectar eventos (se reconectan cada vez para asegurar IDs correctos)
    document.getElementById('close-preview-btn').onclick = closePreviewModal;
    document.getElementById('edit-from-preview-btn').onclick = () => {
        closePreviewModal();
        // Le dice a main.js que abra el modal de edición
        state.onDayClick(dia); 
    };
    
    // Cierre al hacer clic fuera
    modal.onclick = (e) => {
        if (e.target.id === 'preview-modal') {
            closePreviewModal();
        }
    };

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);
}

function closePreviewModal() {
    const modal = document.getElementById('preview-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.style.display = 'none';
            state.isPreviewModalOpen = false;
        }, 200);
    }
}

// --- Modal de Edición (Añadir/Editar) ---

function openEditModal(dia, memories, allDays) {
    if (state.isEditModalOpen) return;
    state.isEditModalOpen = true;
    state.editingMemory = null; // Resetea por si acaso

    let modal = document.getElementById('edit-add-modal');
    if (!modal) {
        modal = _createEditModal(allDays);
        document.body.appendChild(modal);
        // Conectar eventos estáticos del formulario (solo una vez)
        _connectEditModalEvents();
    }
    
    // --- Configurar el modal ---
    const isAdding = !dia; // Si no hay 'dia', es el modo "Añadir" desde el footer
    
    // Referencias a elementos internos
    const daySelectionSection = document.getElementById('day-selection-section');
    const dayNameSection = document.getElementById('day-name-section');
    const daySelect = document.getElementById('edit-mem-day');
    const yearInput = document.getElementById('edit-mem-year');
    const titleEl = document.getElementById('edit-modal-title');
    const nameInput = document.getElementById('nombre-especial-input');
    const memoriesList = document.getElementById('edit-memorias-list');

    if (isAdding) {
        daySelectionSection.style.display = 'block';
        dayNameSection.style.display = 'none';
        
        // Poner la fecha de hoy por defecto
        const today = new Date();
        const todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        daySelect.value = todayId;
        yearInput.value = today.getFullYear();
        
        // Limpiar lista de memorias
        _renderMemoryList(memoriesList, [], true, todayId); // true = con acciones

    } else {
        daySelectionSection.style.display = 'none';
        dayNameSection.style.display = 'block';
        
        // Rellenar datos del día
        titleEl.textContent = `Editando: ${dia.Nombre_Dia} (${dia.id})`;
        nameInput.value = dia.Nombre_Especial === 'Unnamed Day' ? '' : dia.Nombre_Especial;
        
        // Cargar memorias del día
        _renderMemoryList(memoriesList, memories, true, dia.id); // true = con acciones
        
        // Conectar botón de guardar nombre (necesita el dia.id)
        document.getElementById('save-name-btn').onclick = () => {
            const newName = document.getElementById('nombre-especial-input').value.trim();
            state.onSaveDayName(dia.id, newName);
        };
    }
    
    // Reseteos finales
    resetMemoryForm(); // Limpia el formulario
    showModalStatus('save-status', ''); // Limpia mensajes de estado
    showModalStatus('memoria-status', '');
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
            state.isEditModalOpen = false;
            state.editingMemory = null; // Limpiar estado de edición
        }, 200);
    }
}

/**
 * Conecta los eventos del formulario de edición/añadir.
 * Se llama solo una vez, cuando se crea el modal.
 */
function _connectEditModalEvents() {
    // Botón principal de cierre
    document.getElementById('close-edit-add-btn').onclick = closeEditModal;
    
    // Cierre al hacer clic fuera
    document.getElementById('edit-add-modal').onclick = (e) => {
        if (e.target.id === 'edit-add-modal') {
            closeEditModal();
        }
    };
    
    // Botón de cancelar borrado
    document.getElementById('confirm-delete-no').onclick = () => {
        document.getElementById('confirm-delete-dialog').style.display = 'none';
    };

    // Cambio de tipo de memoria
    document.getElementById('memoria-type').addEventListener('change', handleMemoryTypeChange);

    // Búsquedas de API
    document.getElementById('btn-search-itunes').onclick = _handleMusicSearch;
    document.getElementById('btn-search-place').onclick = _handlePlaceSearch;
    
    // Submit del formulario (guardar/actualizar memoria)
    document.getElementById('memory-form').onsubmit = _handleMemoryFormSubmit;
    
    // Lista de memorias (delegación de eventos para editar/borrar)
    document.getElementById('edit-memorias-list').addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        const diaId = e.target.closest('.memoria-item')?.dataset.diaId; // Necesitamos saber el día
        
        if (!diaId) return;

        if (editBtn) {
            const memId = editBtn.dataset.memoriaId;
            // Busca la memoria en los datos locales (pasados por main.js)
            // (Esta parte es un poco compleja, asumimos que main.js pasará los datos)
            // Por ahora, solo llamamos al callback
            _startEditMemory(memId);
            
        } else if (deleteBtn) {
            const memId = deleteBtn.dataset.memoriaId;
            const memInfo = deleteBtn.dataset.memoriaInfo || "esta memoria";
            _confirmDeleteMemory(diaId, memId, memInfo);
        }
    });
}

// --- Modal "Almacén" (Categorías) ---

function openStoreModal() {
    if (state.isStoreModalOpen) return;
    state.isStoreModalOpen = true;

    let modal = document.getElementById('store-modal');
    if (!modal) {
        modal = _createStoreModal();
        document.body.appendChild(modal);
        
        // Conectar eventos (solo una vez)
        modal.onclick = (e) => {
            if (e.target.id === 'store-modal') closeStoreModal();
        };
        document.getElementById('close-store-btn').onclick = closeStoreModal;
        
        // Conectar botones de categoría
        document.getElementById('store-cat-named-days').onclick = () => state.onStoreCategoryClick('Nombres');
        document.getElementById('store-cat-places').onclick = () => state.onStoreCategoryClick('Lugar');
        document.getElementById('store-cat-music').onclick = () => state.onStoreCategoryClick('Musica');
        document.getElementById('store-cat-photos').onclick = () => state.onStoreCategoryClick('Imagen');
        document.getElementById('store-cat-notes').onclick = () => state.onStoreCategoryClick('Texto');
    }
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);
}

function closeStoreModal() {
    const modal = document.getElementById('store-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.style.display = 'none';
            state.isStoreModalOpen = false;
        }, 200);
    }
}

// --- Modal "Almacén" (Lista de Resultados) ---

function openStoreListModal(title) {
    if (state.isStoreListModalOpen) return;
    state.isStoreListModalOpen = true;

    let modal = document.getElementById('store-list-modal');
    if (!modal) {
        modal = _createStoreListModal();
        document.body.appendChild(modal);
        
        // Conectar eventos (solo una vez)
        modal.onclick = (e) => {
            if (e.target.id === 'store-list-modal') closeStoreListModal();
        };
        document.getElementById('close-store-list-btn').onclick = closeStoreListModal;
        document.getElementById('store-load-more-btn').onclick = () => state.onStoreLoadMore();
    }
    
    // Actualizar título y limpiar lista
    document.getElementById('store-list-title').textContent = title;
    document.getElementById('store-list-results').innerHTML = '<p class="list-placeholder">Cargando...</p>';
    document.getElementById('store-load-more-btn').style.display = 'none'; // Ocultar hasta que haya resultados

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);
}

function closeStoreListModal() {
    const modal = document.getElementById('store-list-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.style.display = 'none';
            state.isStoreListModalOpen = false;
        }, 200);
    }
}

/**
 * Actualiza la lista de resultados del "Almacén".
 * @param {Array} items - Array de memorias o días nombrados.
 * @param {boolean} append - Si es true, añade los items; si es false, reemplaza.
 * @param {boolean} hasMore - Si es true, muestra el botón "Cargar más".
 */
function updateStoreList(items, append, hasMore) {
    const listEl = document.getElementById('store-list-results');
    const loadMoreBtn = document.getElementById('store-load-more-btn');
    if (!listEl || !loadMoreBtn) return;

    if (!append) {
        listEl.innerHTML = ''; // Limpiar
    }
    
    // Si no es append y no hay items, mostrar placeholder
    if (!append && items.length === 0) {
        listEl.innerHTML = '<p class="list-placeholder">No se encontraron resultados.</p>';
    }

    // Crear y añadir items
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
        const itemHTML = _createStoreListItem(item);
        const itemDiv = document.createElement('div');
        itemDiv.className = 'store-list-item';
        itemDiv.innerHTML = itemHTML;
        
        // Añadir evento de clic para ir al día
        itemDiv.onclick = () => state.onStoreItemClick(item.diaId);
        
        fragment.appendChild(itemDiv);
    });
    listEl.appendChild(fragment);
    
    // Gestionar botón "Cargar más"
    loadMoreBtn.style.display = hasMore ? 'block' : 'none';
    
    // Limpiar placeholder si estábamos en modo append y era el primero
    const placeholder = listEl.querySelector('.list-placeholder');
    if (placeholder && items.length > 0) {
        placeholder.remove();
    }
}

// --- Funciones de Formulario y Estado ---

/**
 * Muestra los resultados de búsqueda de iTunes en el modal.
 * @param {Array} tracks - Array de objetos de canción.
 */
function showMusicResults(tracks) {
    const resultsEl = document.getElementById('itunes-results');
    if (!resultsEl) return;
    
    resultsEl.innerHTML = '';
    if (tracks.length === 0) {
        resultsEl.innerHTML = '<p class="list-placeholder">Sin resultados.</p>';
        return;
    }
    
    tracks.forEach(track => {
        const trackDiv = document.createElement('div');
        trackDiv.className = 'itunes-track';
        const artworkUrl = track.artworkUrl100 || track.artworkUrl60 || '';
        
        trackDiv.innerHTML = `
            <img src="${artworkUrl}" class="itunes-artwork" style="${artworkUrl ? '' : 'display:none;'}">
            <div class="itunes-track-info">
                <div class="itunes-track-name">${track.trackName || '?'}</div>
                <div class="itunes-track-artist">${track.artistName || '?'}</div>
            </div>
            <div class="itunes-track-select">
                <span class="material-icons-outlined">add_circle_outline</span>
            </div>
        `;
        
        trackDiv.onclick = () => {
            state.selectedMusicTrack = track; // Guardar el track seleccionado
            document.getElementById('memoria-music-search').value = `${track.trackName} - ${track.artistName}`;
            resultsEl.innerHTML = `<p class="list-placeholder success">Seleccionado: ${track.trackName}</p>`;
        };
        resultsEl.appendChild(trackDiv);
    });
}

/**
 * Muestra los resultados de búsqueda de Nominatim (lugares) en el modal.
 * @param {Array} places - Array de objetos de lugar.
 */
function showPlaceResults(places) {
    const resultsEl = document.getElementById('place-results');
    if (!resultsEl) return;

    resultsEl.innerHTML = '';
    if (places.length === 0) {
        resultsEl.innerHTML = '<p class="list-placeholder">Sin resultados.</p>';
        return;
    }

    places.forEach(place => {
        const placeDiv = document.createElement('div');
        placeDiv.className = 'place-result';
        placeDiv.innerHTML = `
            <span class="material-icons-outlined">place</span>
            <div class="place-result-info">${place.display_name}</div>
        `;
        
        placeDiv.onclick = () => {
            state.selectedPlace = {
                name: place.display_name,
                lat: place.lat,
                lon: place.lon,
                osm_id: place.osm_id,
                osm_type: place.osm_type
            };
            document.getElementById('memoria-place-search').value = place.display_name;
            resultsEl.innerHTML = `<p class="list-placeholder success">Seleccionado: ${place.display_name.substring(0, 30)}...</p>`;
        };
        resultsEl.appendChild(placeDiv);
    });
}

/**
 * Muestra un mensaje de estado en los modales.
 * @param {string} elementId - ID del elemento de estado (ej. 'save-status').
 * @param {string} message - El mensaje a mostrar.
 * @param {boolean} [isError=false] - Si es true, aplica la clase 'error'.
 */
function showModalStatus(elementId, message, isError = false) {
    const statusEl = document.getElementById(elementId);
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = isError ? 'error' : 'success';
        
        // Autolimpieza después de 3 segundos (excepto si es un error)
        if (!isError && message) {
            setTimeout(() => {
                if (statusEl.textContent === message) {
                    statusEl.textContent = '';
                }
            }, 3000);
        }
    }
}

/**
 * Resetea el formulario de añadir/editar memoria a su estado inicial.
 */
function resetMemoryForm() {
    state.editingMemory = null;
    state.selectedMusicTrack = null;
    state.selectedPlace = null;
    
    const form = document.getElementById('memory-form');
    if (form) form.reset();
    
    // Limpiar resultados de búsqueda
    document.getElementById('itunes-results').innerHTML = '';
    document.getElementById('place-results').innerHTML = '';
    
    // Resetear botón de guardar
    const saveBtn = document.getElementById('save-memoria-btn');
    if (saveBtn) {
        saveBtn.textContent = 'Añadir Memoria';
        saveBtn.disabled = false;
    }
    
    // Ocultar campos dinámicos
    handleMemoryTypeChange();
}

/**
 * Muestra/oculta los campos de entrada según el tipo de memoria seleccionado.
 */
function handleMemoryTypeChange() {
    const type = document.getElementById('memoria-type').value;
    
    // Ocultar todos primero
    ['Texto', 'Lugar', 'Musica', 'Imagen'].forEach(id => {
        const el = document.getElementById(`input-type-${id}`);
        if (el) el.style.display = 'none';
    });
    
    // Mostrar el seleccionado
    const selectedEl = document.getElementById(`input-type-${type}`);
    if (selectedEl) {
        selectedEl.style.display = 'block';
    }
    
    // Limpiar selecciones si se cambia de tipo
    if (type !== 'Musica') state.selectedMusicTrack = null;
    if (type !== 'Lugar') state.selectedPlace = null;
}

/**
 * Muestra un mensaje de carga principal en la app.
 * @param {string} message - El mensaje a mostrar (ej. "Cargando...").
 * @param {boolean} [show=true] - Si es false, limpia el mensaje.
 */
function setLoading(message, show = true) {
    if (!dom.appContent) return;
    
    if (show) {
        // Ocultar spotlight y grid
        if (dom.spotlightSection) dom.spotlightSection.style.display = 'none';
        dom.appContent.innerHTML = `<p class="loading-message">${message}</p>`;
    } else {
        dom.appContent.innerHTML = ''; // Limpiar
    }
}

// --- Funciones Privadas _helpers ---

/**
 * Genera el HTML interno para un item de memoria (usado en Spotlight y Modales).
 * @param {Object} memoria - El objeto de memoria.
 * @param {boolean} includeActions - Si es true, añade botones de editar/borrar.
 * @param {string} [diaId=null] - El ID del día (necesario para las acciones).
 * @returns {string} - El string HTML.
 */
function _createMemoryItemHTML(memoria, includeActions, diaId = null) {
    let contentHTML = '';
    let icon = 'article'; // Icono por defecto (Texto)

    // Formatear fecha
    let fechaStr = 'Fecha desconocida';
    if (memoria.Fecha_Original?.toDate) {
        try {
            fechaStr = memoria.Fecha_Original.toDate().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) { console.warn("Fecha inválida:", memoria.Fecha_Original); }
    }
    
    // Contenido específico por tipo
    switch (memoria.Tipo) {
        case 'Lugar':
            icon = 'place';
            contentHTML = `<strong>${memoria.LugarNombre || 'Lugar'}</strong>`;
            break;
        case 'Musica':
            icon = 'music_note';
            if (memoria.CancionData?.trackName) {
                contentHTML = `<strong>${memoria.CancionData.trackName}</strong><br><small>${memoria.CancionData.artistName}</small>`;
            } else {
                contentHTML = `<strong>${memoria.CancionInfo || 'Música'}</strong>`;
            }
            break;
        case 'Imagen':
            icon = 'image';
            contentHTML = `<strong>${memoria.Descripcion || 'Imagen'}</strong>`;
            if (memoria.ImagenURL) {
                // TODO: Mostrar thumbnail en lugar de enlace
                contentHTML += ` <small>(<a href="${memoria.ImagenURL}" target="_blank">ver</a>)</small>`;
            }
            break;
        default: // Texto
            icon = 'article';
            contentHTML = memoria.Descripcion || 'Nota';
            break;
    }
    
    // Acciones (Editar/Borrar)
    const actionsHTML = includeActions ? `
        <div class="memoria-actions">
            <button class="edit-btn" title="Editar" data-memoria-id="${memoria.id}">
                <span class="material-icons-outlined">edit</span>
            </button>
            <button class="delete-btn" title="Borrar" data-memoria-id="${memoria.id}" data-memoria-info="${memoria.Descripcion || memoria.LugarNombre || memoria.CancionInfo || 'memoria'}">
                <span class="material-icons-outlined">delete_outline</span>
            </button>
        </div>
    ` : '';
    
    // HTML final
    return `
        <div class="memoria-item-icon">
            <span class="material-icons-outlined">${icon}</span>
        </div>
        <div class="memoria-item-content">
            <small class="memoria-item-date">${fechaStr}</small>
            <div class="memoria-item-details">${contentHTML}</div>
        </div>
        ${actionsHTML}
    `;
}

/**
 * Genera el HTML para el botón de login de Google.
 * @returns {string} - El string HTML.
 */
function _createLoginButton() {
    // Usamos el icono oficial de Google (SVG inline)
    return `
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 48 48" class="google-icon">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
        </svg>
    `;
}

/**
 * Rellena un elemento de lista (<ul> o <div>) con memorias.
 * @param {HTMLElement} listEl - El elemento del DOM donde renderizar.
 * @param {Array} memories - El array de objetos de memoria.
 * @param {boolean} includeActions - Si se deben incluir botones de editar/borrar.
 * @param {string} diaId - El ID del día (necesario para las acciones).
 */
function _renderMemoryList(listEl, memories, includeActions, diaId) {
    if (!listEl) return;
    
    listEl.innerHTML = ''; // Limpiar
    
    if (memories.length === 0) {
        listEl.innerHTML = '<p class="list-placeholder">Aún no hay memorias.</p>';
        return;
    }
    
    const fragment = document.createDocumentFragment();
    memories.forEach(mem => {
        const itemHTML = _createMemoryItemHTML(mem, includeActions, diaId);
        const itemDiv = document.createElement('div');
        itemDiv.className = 'memoria-item';
        itemDiv.dataset.memoriaId = mem.id;
        itemDiv.dataset.diaId = diaId; // Guardamos el diaId aquí para la delegación de eventos
        itemDiv.innerHTML = itemHTML;
        fragment.appendChild(itemDiv);
    });
    listEl.appendChild(fragment);
}

// --- Lógica del Formulario de Edición ---

/**
 * Callback para el botón de buscar música.
 */
function _handleMusicSearch() {
    const input = document.getElementById('memoria-music-search');
    const resultsEl = document.getElementById('itunes-results');
    const searchTerm = input.value.trim();
    
    if (!searchTerm) {
        resultsEl.innerHTML = '<p class="list-placeholder error">Escribe un término de búsqueda.</p>';
        return;
    }
    
    resultsEl.innerHTML = '<p class="list-placeholder">Buscando...</p>';
    state.onSearchMusic(searchTerm); // Llama al controlador de main.js
}

/**
 * Callback para el botón de buscar lugar.
 */
function _handlePlaceSearch() {
    const input = document.getElementById('memoria-place-search');
    const resultsEl = document.getElementById('place-results');
    const searchTerm = input.value.trim();

    if (!searchTerm) {
        resultsEl.innerHTML = '<p class="list-placeholder error">Escribe un lugar.</p>';
        return;
    }

    resultsEl.innerHTML = '<p class="list-placeholder">Buscando...</p>';
    state.onSearchPlace(searchTerm); // Llama al controlador de main.js
}

/**
 * Callback para el submit del formulario de memoria.
 */
function _handleMemoryFormSubmit(event) {
    event.preventDefault();
    const saveBtn = document.getElementById('save-memoria-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = state.editingMemory ? 'Actualizando...' : 'Guardando...';
    
    // Determinar el diaId (modo "Añadir" vs "Editar")
    let diaId;
    const daySelectionSection = document.getElementById('day-selection-section');
    if (daySelectionSection.style.display === 'block') {
        diaId = document.getElementById('edit-mem-day').value;
    } else {
        // Estamos en modo edición, el día está en el título o en un estado
        // Esto es un poco frágil, main.js debería gestionar el 'diaId' actual
        // Por ahora, lo sacamos del primer item de la lista (si existe)
        const firstItem = document.getElementById('edit-memorias-list').querySelector('.memoria-item');
        if (firstItem) {
            diaId = firstItem.dataset.diaId;
        }
    }
    
    if (!diaId) {
        showModalStatus('memoria-status', 'Error: No se pudo determinar el día.', true);
        saveBtn.disabled = false;
        return;
    }

    // Recoger todos los datos del formulario
    const type = document.getElementById('memoria-type').value;
    const fechaStr = document.getElementById('memoria-fecha').value;
    
    // Validación básica
    if (!fechaStr) {
         showModalStatus('memoria-status', 'La fecha original es obligatoria.', true);
         saveBtn.disabled = false;
         saveBtn.textContent = state.editingMemory ? 'Actualizar Memoria' : 'Añadir Memoria';
         return;
    }

    let memoryData = {
        Fecha_Original: fechaStr, // main.js lo convertirá a Timestamp
        Tipo: type,
    };
    
    let isValid = true;
    
    switch (type) {
        case 'Texto':
            memoryData.Descripcion = document.getElementById('memoria-desc').value.trim();
            if (!memoryData.Descripcion) isValid = false;
            break;
        case 'Lugar':
            if (state.selectedPlace) {
                memoryData.LugarNombre = state.selectedPlace.name;
                memoryData.LugarData = { ...state.selectedPlace };
            } else {
                memoryData.LugarNombre = document.getElementById('memoria-place-search').value.trim();
                if (!memoryData.LugarNombre) isValid = false;
            }
            break;
        case 'Musica':
             if (state.selectedMusicTrack) {
                memoryData.CancionData = { ...state.selectedMusicTrack };
                memoryData.CancionInfo = `${state.selectedMusicTrack.trackName} - ${state.selectedMusicTrack.artistName}`;
            } else {
                memoryData.CancionInfo = document.getElementById('memoria-music-search').value.trim();
                if (!memoryData.CancionInfo) isValid = false;
            }
            break;
        case 'Imagen':
            // TODO: Implementar subida de archivo
            memoryData.Descripcion = document.getElementById('memoria-image-desc').value.trim() || null;
            const fileInput = document.getElementById('memoria-image-upload');
            if (fileInput.files && fileInput.files[0]) {
                 showModalStatus('memoria-status', 'La subida de imágenes no está implementada.', true);
                 isValid = false; // Bloquear guardado
            } else if (!state.editingMemory) {
                // Si es nueva memoria de imagen, el archivo es obligatorio
                // Si estamos editando, se asume que mantenemos la imagen anterior
                // (main.js se encargará de esa lógica)
            }
            break;
        default:
            isValid = false;
    }
    
    if (!isValid) {
        showModalStatus('memoria-status', 'Por favor, rellena los campos.', true);
        saveBtn.disabled = false;
        saveBtn.textContent = state.editingMemory ? 'Actualizar Memoria' : 'Añadir Memoria';
        return;
    }
    
    // Si estamos editando, pasamos el ID
    const isEditing = !!state.editingMemory;
    if (isEditing) {
        memoryData.id = state.editingMemory.id;
        // Si es tipo Imagen y no se subió archivo, main.js debe conservar la URL
        if (type === 'Imagen' && !memoryData.file) {
            memoryData.ImagenURL = state.editingMemory.ImagenURL;
        }
    }

    // Enviar al controlador
    state.onSaveMemory(diaId, memoryData, isEditing);
}

/**
 * Inicia la edición de una memoria (rellena el formulario).
 * @param {string} memId - El ID de la memoria a editar.
 */
function _startEditMemory(memId) {
    // Necesitamos encontrar el objeto memoria.
    // Esto es un punto débil: ui.js no tiene los datos.
    // Asumimos que main.js los tiene y nos los pasará.
    // Por ahora, buscaremos en los datos renderizados (frágil).
    
    const itemEl = document.querySelector(`.memoria-item[data-memoria-id="${memId}"]`);
    if (!itemEl) {
        console.error("No se pudo encontrar el elemento de la memoria para editar:", memId);
        return;
    }
    
    // Hack: main.js debería pasar el objeto memoria.
    // Como no lo tenemos, le pedimos a main.js que lo busque.
    // Esto es una mala práctica, pero es un parche temporal.
    // TODO: Refactorizar esto. main.js debe pasar los datos.
    
    // Simulación: asumimos que main.js nos da el objeto memoria
    // const memoria = main.js.findMemoryById(memId);
    
    // Como no podemos hacer eso, mostramos un aviso
    // showModalStatus('memoria-status', 'La edición debe ser manejada por main.js', true);
    
    // --- PARCHE TEMPORAL: Pedir a main.js que rellene el form ---
    // Esta es la única forma de hacerlo sin tener los datos.
    state.onFooterAction('edit-memory', memId);
}

/**
 * Carga los datos de una memoria en el formulario para editarla.
 * (Llamado por main.js)
 * @param {Object} memoria - El objeto de memoria completo.
 */
function fillFormForEdit(memoria) {
    if (!memoria) return;
    
    state.editingMemory = memoria; // ¡Guardamos la memoria!
    
    document.getElementById('memoria-type').value = memoria.Tipo || 'Texto';
    
    // Formatear fecha para input[type=date] (YYYY-MM-DD)
    if (memoria.Fecha_Original?.toDate) {
        try {
            document.getElementById('memoria-fecha').value = memoria.Fecha_Original.toDate().toISOString().split('T')[0];
        } catch(e) { /* fecha inválida */ }
    }
    
    // Limpiar campos y selecciones
    document.getElementById('memoria-desc').value = '';
    document.getElementById('memoria-place-search').value = '';
    document.getElementById('memoria-music-search').value = '';
    document.getElementById('memoria-image-desc').value = '';
    document.getElementById('itunes-results').innerHTML = '';
    document.getElementById('place-results').innerHTML = '';
    state.selectedMusicTrack = null;
    state.selectedPlace = null;

    // Rellenar campo específico
    switch (memoria.Tipo) {
        case 'Lugar':
            document.getElementById('memoria-place-search').value = memoria.LugarNombre || '';
            if (memoria.LugarData) state.selectedPlace = { name: memoria.LugarNombre, ...memoria.LugarData };
            break;
        case 'Musica':
            document.getElementById('memoria-music-search').value = memoria.CancionInfo || '';
            if (memoria.CancionData) state.selectedMusicTrack = memoria.CancionData;
            break;
        case 'Imagen':
            document.getElementById('memoria-image-desc').value = memoria.Descripcion || '';
            // TODO: Mostrar thumbnail de memoria.ImagenURL
            break;
        default: // Texto
            document.getElementById('memoria-desc').value = memoria.Descripcion || '';
            break;
    }
    
    // Cambiar botón
    document.getElementById('save-memoria-btn').textContent = 'Actualizar Memoria';
    
    // Mostrar campos correctos
    handleMemoryTypeChange();
    
    // Scroll y foco
    document.getElementById('memory-form').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('memoria-fecha').focus();
}


/**
 * Muestra el diálogo de confirmación para borrar una memoria.
 * @param {string} diaId - El ID del día.
 * @param {string} memId - El ID de la memoria.
 * @param {string} memInfo - Texto descriptivo de la memoria.
 */
function _confirmDeleteMemory(diaId, memId, memInfo) {
    const dialog = document.getElementById('confirm-delete-dialog');
    const textEl = document.getElementById('confirm-delete-text');
    const yesBtn = document.getElementById('confirm-delete-yes');
    
    textEl.textContent = `¿Seguro que quieres borrar "${memInfo.substring(0, 40)}..."?`;
    
    // Re-conectar el evento 'onclick' CADA VEZ
    // (Esto evita que se quede el ID antiguo si se cancela)
    yesBtn.onclick = () => {
        dialog.style.display = 'none';
        state.onDeleteMemory(diaId, memId); // Llama al controlador
    };
    
    dialog.style.display = 'block';
}


// --- Creación de Elementos del DOM (HTML) ---

/**
 * Crea el HTML para el Modal de Preview.
 * @returns {HTMLElement}
 */
function _createPreviewModal() {
    const modal = document.createElement('div');
    modal.id = 'preview-modal';
    modal.className = 'modal-preview';
    
    modal.innerHTML = `
        <div class="modal-preview-content">
            <div class="modal-preview-header">
                <h3 id="preview-title"></h3>
                <button id="edit-from-preview-btn" title="Editar este día">
                    <span class="material-icons-outlined">edit</span>
                </button>
            </div>
            <div class="modal-preview-body">
                <h4>Memorias:</h4>
                <div id="preview-memorias-list" class="modal-list-container">
                    <!-- Contenido rellenado por JS -->
                </div>
            </div>
            <div class="modal-footer-buttons">
                <button id="close-preview-btn" class="aqua-button">Cerrar</button>
            </div>
        </div>
    `;
    return modal;
}

/**
 * Crea el HTML para el Modal de Edición.
 * @param {Array} allDays - Array de todos los días para el <select>.
 * @returns {HTMLElement}
 */
function _createEditModal(allDays) {
    const modal = document.createElement('div');
    modal.id = 'edit-add-modal';
    modal.className = 'modal-edit';

    // Crear opciones del <select>
    const dayOptions = allDays.map(d => 
        `<option value="${d.id}">${d.Nombre_Dia}</option>`
    ).join('');

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-content-scrollable">
                
                <!-- Sección de Selección de Día (Modo "Añadir") -->
                <div class="modal-section" id="day-selection-section" style="display: none;">
                    <h3>Añadir Memoria a...</h3>
                    <label for="edit-mem-day">Día (MM-DD):</label>
                    <select id="edit-mem-day">${dayOptions}</select>
                    <label for="edit-mem-year">Año de la Memoria:</label>
                    <input type="number" id="edit-mem-year" placeholder="YYYY" min="1800" max="2100">
                </div>
                
                <!-- Sección de Nombre del Día (Modo "Editar") -->
                <div class="modal-section" id="day-name-section" style="display: none;">
                    <h3 id="edit-modal-title">Editando Día</h3>
                    <label for="nombre-especial-input">Nombrar este día:</label>
                    <input type="text" id="nombre-especial-input" placeholder="Ej. Día de la Pizza" maxlength="30">
                    <button id="save-name-btn" class="aqua-button">Guardar Nombre</button>
                    <p id="save-status" class="modal-status"></p>
                </div>
                
                <!-- Sección de Memorias (Siempre visible) -->
                <div class="modal-section memorias-section">
                    <h4>Memorias</h4>
                    <div id="edit-memorias-list" class="modal-list-container">
                        <!-- Contenido rellenado por JS -->
                    </div>
                    
                    <!-- Formulario de Añadir/Editar Memoria -->
                    <form id="memory-form">
                        <p class="section-description">Añadir Nueva Memoria</p>
                        
                        <label for="memoria-fecha">Fecha Original:</label>
                        <input type="date" id="memoria-fecha" required>
                        
                        <label for="memoria-type">Tipo:</label>
                        <select id="memoria-type">
                            <option value="Texto">Nota / Descripción</option>
                            <option value="Lugar">Lugar</option>
                            <option value="Musica">Música</option>
                            <option value="Imagen">Foto</option>
                        </select>
                        
                        <!-- Inputs Dinámicos -->
                        <div class="add-memory-input-group" id="input-type-Texto">
                            <label for="memoria-desc">Descripción:</label>
                            <textarea id="memoria-desc" placeholder="Escribe tu recuerdo..."></textarea>
                        </div>
                        
                        <div class="add-memory-input-group" id="input-type-Lugar">
                            <label for="memoria-place-search">Buscar Lugar:</label>
                            <input type="text" id="memoria-place-search" placeholder="Ej. Torre Eiffel, París">
                            <button type="button" class="aqua-button" id="btn-search-place">Buscar</button>
                            <div id="place-results" class="api-results-container"></div>
                        </div>
                        
                        <div class="add-memory-input-group" id="input-type-Musica">
                            <label for="memoria-music-search">Buscar Canción/Artista:</label>
                            <input type="text" id="memoria-music-search" placeholder="Ej. Bohemian Rhapsody, Queen">
                            <button type="button" class="aqua-button" id="btn-search-itunes">Buscar</button>
                            <div id="itunes-results" class="api-results-container"></div>
                        </div>
                        
                        <div class="add-memory-input-group" id="input-type-Imagen">
                            <label for="memoria-image-upload">Subir Foto:</label>
                            <input type="file" id="memoria-image-upload" accept="image/*">
                            <label for="memoria-image-desc">Descripción (opcional):</label>
                            <input type="text" id="memoria-image-desc" placeholder="Descripción de la foto">
                        </div>
                        
                        <button type="submit" id="save-memoria-btn" class="aqua-button">Añadir Memoria</button>
                        <p id="memoria-status" class="modal-status"></p>
                    </form>
                </div>
                
                <!-- Diálogo de Confirmación (Oculto) -->
                <div id="confirm-delete-dialog" style="display: none;">
                    <p id="confirm-delete-text">¿Confirmar borrado?</p>
                    <button id="confirm-delete-no" class="aqua-button">Cancelar</button>
                    <button id="confirm-delete-yes" class="aqua-button delete-confirm">Borrar</button>
                </div>
                 
            </div> <!-- Fin de .modal-content-scrollable -->
            
            <!-- Botones Fijos del Modal -->
            <div class="modal-main-buttons">
                <button id="close-edit-add-btn">Cerrar</button>
            </div>
        </div>
    `;
    return modal;
}

/**
 * Crea el HTML para el Modal "Almacén" (Categorías).
 * @returns {HTMLElement}
 */
function _createStoreModal() {
    const modal = document.createElement('div');
    modal.id = 'store-modal';
    modal.className = 'modal-store'; // Clase específica
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-content-scrollable">
                <div class="modal-section">
                    <h3>Almacén de Memorias</h3>
                    <p class="section-description">Ver todas las memorias por categoría.</p>
                    
                    <div class="store-category-grid">
                        ${_createStoreCategoryButton('Nombres', 'Nombres de Día', 'drive_file_rename_outline')}
                        ${_createStoreCategoryButton('Lugar', 'Lugares', 'place')}
                        ${_createStoreCategoryButton('Musica', 'Canciones', 'music_note')}
                        ${_createStoreCategoryButton('Imagen', 'Fotos', 'image')}
                        ${_createStoreCategoryButton('Texto', 'Notas', 'article')}
                    </div>
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
 * Helper para crear un botón de categoría del almacén.
 * @param {string} id - El ID para el botón (ej. 'Lugar').
 * @param {string} text - El texto a mostrar (ej. 'Lugares').
 * @param {string} iconName - El nombre del icono de Material Icons.
 * @returns {string} - El string HTML del botón.
 */
function _createStoreCategoryButton(id, text, iconName) {
    return `
        <button class="store-category-btn" id="store-cat-${id.toLowerCase()}">
            <span class="material-icons-outlined">${iconName}</span>
            <span>${text}</span>
        </button>
    `;
}

/**
 * Crea el HTML para el Modal "Almacén" (Lista de Resultados).
 * @returns {HTMLElement}
 */
function _createStoreListModal() {
    const modal = document.createElement('div');
    modal.id = 'store-list-modal';
    modal.className = 'modal-store-list'; // Clase específica
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header-fixed">
                <h3 id="store-list-title">Resultados</h3>
            </div>
            <div class="modal-content-scrollable">
                <div id="store-list-results" class="modal-list-container">
                    <!-- Contenido rellenado por JS -->
                </div>
                <button id="store-load-more-btn" class="aqua-button" style="display: none;">Cargar más</button>
            </div>
            <div class="modal-main-buttons">
                <button id="close-store-list-btn">Cerrar</button>
            </div>
        </div>
    `;
    return modal;
}

/**
 * Helper para crear el HTML de un item en la lista del Almacén.
 * @param {Object} item - Objeto de memoria o día nombrado.
 * @returns {string} - El string HTML del item.
 */
function _createStoreListItem(item) {
    // Es un "Día Nombrado"
    if (item.Nombre_Especial) {
        return `
            <div class="memoria-item-icon">
                <span class="material-icons-outlined">drive_file_rename_outline</span>
            </div>
            <div class="memoria-item-content">
                <small class="memoria-item-date">${item.Nombre_Dia} (${item.id})</small>
                <div class="memoria-item-details">
                    <strong>${item.Nombre_Especial}</strong>
                </div>
            </div>
        `;
    }
    
    // Es una "Memoria" (usamos la función existente)
    // Pasamos false para no incluir acciones de editar/borrar
    return _createMemoryItemHTML(item, false, item.diaId);
}


// --- Exportar la API Pública del Módulo ---

// Exportamos un objeto 'ui' que contiene todas las funciones
// que 'main.js' necesita llamar.
export const ui = {
    init,
    drawCalendar,
    updateSpotlight,
    updateLoginUI,
    openPreviewModal,
    closePreviewModal,
    openEditModal,
    closeEditModal,
    openStoreModal,
    closeStoreModal,
    openStoreListModal,
    closeStoreListModal,
    updateStoreList,
    showMusicResults,
    showPlaceResults,
    showModalStatus,
    resetMemoryForm,
    fillFormForEdit,
    handleMemoryTypeChange,
    setLoading, // <-- ¡Función añadida!
};

