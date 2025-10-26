/*
 * ui.js (v5.0)
 * Módulo de Interfaz de Usuario (DOM).
 * Se encarga de dibujar, crear modales y manejar eventos del DOM.
 * No sabe nada de Firestore.
 */

// --- Estado Interno del Módulo ---
// Guardamos referencias a los elementos del DOM para no buscarlos constantemente
const _dom = {
    appContent: null,
    monthNameDisplay: null,
    navPrev: null,
    navNext: null,
    footer: null,
    mainLoader: null,
    spotlightHeader: null,
    spotlightList: null,
};

// Guardamos referencias a los modales (se crean bajo demanda)
const _modals = {
    preview: null,
    edit: null,
    store: null,
    storeList: null,
    search: null, // Nuevo modal
};

// Guardamos los callbacks (funciones) que nos pasa main.js
let _callbacks = {
    onMonthChange: (dir) => console.warn("onMonthChange no implementado"),
    onDayClick: (dia) => console.warn("onDayClick no implementado"),
    onFooterAction: (action) => console.warn("onFooterAction no implementado"),
    onLogin: () => console.warn("onLogin no implementado"),
    onLogout: () => console.warn("onLogout no implementado"),
    onSaveDayName: (diaId, name) => console.warn("onSaveDayName no implementado"),
    onSaveMemory: (diaId, data, isEditing) => console.warn("onSaveMemory no implementado"),
    onDeleteMemory: (diaId, memId) => console.warn("onDeleteMemory no implementado"),
    onSearchMusic: (term) => console.warn("onSearchMusic no implementado"),
    onSearchPlace: (term) => console.warn("onSearchPlace no implementado"),
    onStoreCategoryClick: (type) => console.warn("onStoreCategoryClick no implementado"),
    onStoreLoadMore: () => console.warn("onStoreLoadMore no implementado"),
    onStoreItemClick: (diaId) => console.warn("onStoreItemClick no implementado"),
    onSearchSubmit: (term) => console.warn("onSearchSubmit no implementado"), // Nuevo callback
};

// Estado temporal para la edición
let _currentDay = null;      // El día (ej. {id: "01-01", ...}) del modal abierto
let _currentMemories = []; // La lista de memorias del modal abierto
let _isEditingMemory = false; // Flag para saber si estamos editando o añadiendo
let _selectedMusicTrack = null;
let _selectedPlace = null;


// --- 1. Inicialización y Funciones Principales ---

/**
 * Inicializa el módulo de UI.
 * Busca los elementos principales del DOM y conecta los callbacks.
 * @param {Object} callbacks - Objeto con todas las funciones de main.js
 */
function init(callbacks) {
    console.log("UI: Inicializando...");
    _callbacks = { ..._callbacks, ...callbacks }; // Fusionar callbacks

    // Buscar elementos principales
    _dom.appContent = document.getElementById('app-content');
    _dom.monthNameDisplay = document.getElementById('month-name-display');
    _dom.navPrev = document.getElementById('prev-month');
    _dom.navNext = document.getElementById('next-month');
    _dom.footer = document.querySelector('.footer-dock');
    _dom.mainLoader = document.getElementById('main-loader');
    _dom.spotlightHeader = document.getElementById('spotlight-date-header');
    _dom.spotlightList = document.getElementById('today-memory-spotlight');

    if (!_dom.appContent || !_dom.navPrev || !_dom.footer) {
        console.error("UI: Faltan elementos críticos del DOM (app-content, nav, footer).");
        return;
    }

    // Conectar eventos estáticos
    _setupNavigation();
    _setupFooter();
    
    console.log("UI: Inicializada y eventos conectados.");
}

/**
 * Muestra u oculta el loader principal.
 * @param {string|null} message - El mensaje a mostrar (null para ocultar).
 * @param {boolean} show - Forzar mostrar/ocultar.
 */
function setLoading(message, show) {
    if (!_dom.mainLoader) {
        _dom.mainLoader = _createMainLoader();
        document.body.appendChild(_dom.mainLoader);
    }
    
    if (show) {
        _dom.mainLoader.querySelector('span').textContent = message || "Cargando...";
        _dom.mainLoader.classList.add('visible');
    } else {
        _dom.mainLoader.classList.remove('visible');
    }
}

/**
 * Actualiza el UI del login (avatar, botón)
 * @param {Object} user - El objeto de usuario de Firebase, o null.
 */
function updateLoginUI(user) {
    const loginSection = document.getElementById('login-section');
    if (!loginSection) return;

    if (user) {
        // Usuario logueado
        loginSection.innerHTML = `
            <div id="user-info">
                <img id="user-img" src="${user.photoURL || 'https://placehold.co/30x30/ccc/fff?text=?'}" alt="Avatar">
                <span id="user-name">${user.displayName || 'Usuario'}</span>
            </div>
            <button id="login-btn" class="header-icon-btn" title="Logout">
                <span class="material-icons-outlined">logout</span>
            </button>
        `;
        const logoutBtn = document.getElementById('login-btn');
        if (logoutBtn) logoutBtn.onclick = () => _callbacks.onLogout();
        
    } else {
        // Usuario no logueado
        loginSection.innerHTML = `
            <button id="login-btn" class="header-icon-btn" title="Login with Google">
                <span class="material-icons-outlined">login</span>
            </button>
        `;
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) loginBtn.onclick = () => _callbacks.onLogin();
    }
}

// --- 2. Renderizado del Contenido Principal ---

/**
 * Dibuja el grid del calendario para un mes.
 * @param {string} monthName - Nombre del mes (ej. "Octubre").
 * @param {Array} days - Array de objetos de día para ese mes.
 * @param {string} todayId - El ID de hoy (ej. "10-26").
 */
function drawCalendar(monthName, days, todayId) {
    _dom.monthNameDisplay.textContent = monthName;
    
    if (!_dom.appContent) return;
    _dom.appContent.innerHTML = ''; // Limpiar contenido anterior
    
    const grid = document.createElement('div');
    grid.className = 'calendario-grid';
    
    if (days.length === 0) {
        grid.innerHTML = "<p>No se encontraron días para este mes.</p>";
        _dom.appContent.appendChild(grid);
        return;
    }

    const fragment = document.createDocumentFragment();
    
    days.forEach(dia => {
        const btn = document.createElement("button");
        btn.className = "dia-btn";
        
        // Añadir clases especiales
        if (dia.id === todayId) {
            btn.classList.add('dia-btn-today');
        }
        if (dia.tieneMemorias) {
            btn.classList.add('tiene-memorias');
        }
        
        btn.innerHTML = `<span class="dia-numero">${dia.id.substring(3)}</span>`;
        btn.dataset.diaId = dia.id;
        
        // Conectar evento de clic
        btn.addEventListener('click', () => _callbacks.onDayClick(dia));
        
        fragment.appendChild(btn);
    });
    
    grid.appendChild(fragment);
    _dom.appContent.appendChild(grid);
    console.log(`UI: Dibujado calendario con ${days.length} días.`);
}

/**
 * Actualiza el widget "Spotlight"
 * @param {string} dateString - El texto de la cabecera (ej. "Hoy, 26 de Octubre")
 * @param {Array} memories - Array de objetos de memoria (máx 3)
 */
function updateSpotlight(dateString, memories) {
    if (_dom.spotlightHeader) {
        _dom.spotlightHeader.textContent = dateString;
    }
    
    if (!_dom.spotlightList) return;
    _dom.spotlightList.innerHTML = ''; // Limpiar
    
    if (memories.length === 0) {
        _dom.spotlightList.innerHTML = '<div class="list-placeholder" style="color: #555; padding: 10px 5px;">No hay memorias para este día.</div>';
        return;
    }
    
    const fragment = document.createDocumentFragment();
    memories.forEach(mem => {
        fragment.appendChild(_createMemoryItemHTML(mem, 'spotlight'));
    });
    _dom.spotlightList.appendChild(fragment);
}


// --- 3. Lógica de Modales (Creación y Gestión) ---

// --- PREVIEW MODAL ---
function openPreviewModal(dia, memories) {
    _currentDay = dia;
    _currentMemories = memories;
    
    if (!_modals.preview) {
        _modals.preview = _createPreviewModal();
        document.body.appendChild(_modals.preview);
    }
    
    // Rellenar datos
    const titleEl = _modals.preview.querySelector('.modal-header h3');
    const specialName = (dia.Nombre_Especial && dia.Nombre_Especial !== 'Unnamed Day') ? ` (${dia.Nombre_Especial})` : '';
    titleEl.textContent = `${dia.Nombre_Dia}${specialName}`;
    
    _renderMemoryList('preview-memorias-list', memories);
    
    // Mostrar
    _modals.preview.classList.add('visible');
}

function closePreviewModal() {
    if (_modals.preview) {
        _modals.preview.classList.remove('visible');
    }
}

// --- EDIT MODAL ---
function openEditModal(dia, memories, allDays) {
    const isAdding = !dia;
    
    if (isAdding) {
        // Modo "Añadir" - Usamos un día por defecto (hoy)
        const today = new Date();
        const todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        _currentDay = allDays.find(d => d.id === todayId) || allDays[0];
        _currentMemories = [];
    } else {
        // Modo "Editar"
        _currentDay = dia;
        _currentMemories = memories;
    }
    
    if (!_currentDay) {
        console.error("UI: No se pudo abrir el modal de edición, _currentDay está nulo.");
        return;
    }

    if (!_modals.edit) {
        _modals.edit = _createEditModal(allDays);
        document.body.appendChild(_modals.edit);
    }

    // Resetear el formulario
    resetMemoryForm();
    showModalStatus('save-status', '', false);
    showModalStatus('memoria-status', '', false);

    // Rellenar datos según el modo
    const daySelectionSection = _modals.edit.querySelector('#day-selection-section');
    const dayNameSection = _modals.edit.querySelector('#day-name-section');
    const daySelect = _modals.edit.querySelector('#edit-mem-day');
    const formTitle = _modals.edit.querySelector('#memory-form-title');

    if (isAdding) {
        daySelectionSection.style.display = 'block';
        dayNameSection.style.display = 'none';
        daySelect.value = _currentDay.id; // Seleccionar día por defecto
        formTitle.textContent = "Añadir Nueva Memoria";
        _renderMemoryList('edit-memorias-list', []); // Lista vacía
    } else {
        daySelectionSection.style.display = 'none';
        dayNameSection.style.display = 'block';
        
        _modals.edit.querySelector('#edit-modal-title').textContent = `Editando: ${_currentDay.Nombre_Dia}`;
        _modals.edit.querySelector('#nombre-especial-input').value = (_currentDay.Nombre_Especial === 'Unnamed Day' ? '' : _currentDay.Nombre_Especial);
        
        formTitle.textContent = "Añadir/Editar Memorias";
        _renderMemoryList('edit-memorias-list', _currentMemories);
    }
    
    // Mostrar
    _modals.edit.classList.add('visible');
}

function closeEditModal() {
    if (_modals.edit) {
        _modals.edit.classList.remove('visible');
    }
}

// --- STORE MODAL (Selector) ---
function openStoreModal() {
    if (!_modals.store) {
        _modals.store = _createStoreModal();
        document.body.appendChild(_modals.store);
    }
    _modals.store.classList.add('visible');
}

function closeStoreModal() {
    if (_modals.store) {
        _modals.store.classList.remove('visible');
    }
}

// --- STORE LIST MODAL (Resultados) ---
function openStoreListModal(title) {
    if (!_modals.storeList) {
        _modals.storeList = _createStoreListModal();
        document.body.appendChild(_modals.storeList);
    }
    
    _modals.storeList.querySelector('.modal-header h3').textContent = title;
    _modals.storeList.querySelector('#store-list-items').innerHTML = '';
    _modals.storeList.querySelector('#store-list-loading').textContent = 'Cargando...';
    _modals.storeList.querySelector('#store-load-more-btn').style.display = 'none';
    
    _modals.storeList.classList.add('visible');
}

function closeStoreListModal() {
    if (_modals.storeList) {
        _modals.storeList.classList.remove('visible');
    }
}

/**
 * Rellena la lista de resultados del "Almacén"
 * @param {Array} items - Array de memorias o días
 * @param {boolean} append - true para añadir al final, false para reemplazar
 * @param {boolean} hasMore - true si hay más resultados para cargar
 */
function updateStoreList(items, append = false, hasMore = false) {
    if (!_modals.storeList) return;
    
    const listEl = _modals.storeList.querySelector('#store-list-items');
    const loadingEl = _modals.storeList.querySelector('#store-list-loading');
    const loadMoreBtn = _modals.storeList.querySelector('#store-load-more-btn');
    
    if (!append) {
        listEl.innerHTML = ''; // Limpiar si no es "append"
    }
    
    if (items.length === 0 && !append) {
        loadingEl.textContent = 'No se encontraron resultados.';
    } else {
        loadingEl.textContent = '';
    }
    
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
        fragment.appendChild(_createStoreListItem(item));
    });
    listEl.appendChild(fragment);
    
    // Mostrar/ocultar botón "Cargar Más"
    loadMoreBtn.style.display = hasMore ? 'block' : 'none';
}


// --- SEARCH MODAL (Nuevo) ---
/**
 * Abre el modal de búsqueda.
 */
function openSearchModal() {
    if (!_modals.search) {
        _modals.search = _createSearchModal();
        document.body.appendChild(_modals.search);
    }
    
    // Limpiar y enfocar
    const input = _modals.search.querySelector('#search-input');
    const status = _modals.search.querySelector('#search-status');
    input.value = '';
    status.textContent = '';
    
    _modals.search.classList.add('visible');
    setTimeout(() => input.focus(), 100); // Enfocar después de la animación
}

function closeSearchModal() {
    if (_modals.search) {
        _modals.search.classList.remove('visible');
    }
}

// --- Utilidades de Modales ---

/**
 * Muestra un mensaje de estado dentro del modal activo.
 * @param {string} elId - 'save-status' o 'memoria-status'
 * @param {string} message - El mensaje a mostrar
 * @param {boolean} isError - true si es un error
 */
function showModalStatus(elId, message, isError) {
    const modal = _modals.edit; // Asumir que solo pasa en el modal de edición
    if (!modal) return;
    
    const statusEl = modal.querySelector(`#${elId}`);
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = 'modal-status';
    if (isError) {
        statusEl.classList.add('error');
    } else {
        statusEl.classList.add('success');
    }
    
    // Limpiar mensaje después de 3 segundos si no es error
    if (!isError && message) {
        setTimeout(() => {
            if (statusEl.textContent === message) {
                statusEl.textContent = '';
                statusEl.className = 'modal-status';
            }
        }, 3000);
    }
}

/**
 * Resetea el formulario de añadir/editar memoria.
 */
function resetMemoryForm() {
    const form = _modals.edit?.querySelector('#memory-form');
    if (!form) return;
    
    form.reset();
    _isEditingMemory = false;
    _selectedMusicTrack = null;
    _selectedPlace = null;
    
    // Ocultar resultados y resetear estados
    showMusicResults([]);
    showPlaceResults([]);
    
    const saveBtn = form.querySelector('#save-memoria-btn');
    saveBtn.textContent = 'Añadir Memoria';
    saveBtn.disabled = false;
    
    const status = form.querySelector('#image-upload-status');
    if (status) status.textContent = '';

    handleMemoryTypeChange(); // Asegurar que se muestran los inputs correctos
}

/**
 * Rellena el formulario de memoria para editar.
 * @param {Object} memoria - El objeto de memoria a editar.
 */
function fillFormForEdit(memoria) {
    if (!_modals.edit) return;

    _isEditingMemory = true;
    const form = _modals.edit.querySelector('#memory-form');
    
    // Rellenar campos comunes
    form.querySelector('#memoria-type').value = memoria.Tipo || 'Texto';
    if (memoria.Fecha_Original?.toDate) {
        try {
            // Formato YYYY-MM-DD
            form.querySelector('#memoria-fecha').value = memoria.Fecha_Original.toDate().toISOString().split('T')[0];
        } catch(e) { console.warn("Fecha inválida:", e); }
    }
    
    // Rellenar campos específicos
    switch (memoria.Tipo) {
        case 'Lugar':
            form.querySelector('#memoria-place-search').value = memoria.LugarNombre || '';
            _selectedPlace = memoria.LugarData ? { name: memoria.LugarNombre, ...memoria.LugarData } : null;
            break;
        case 'Musica':
            form.querySelector('#memoria-music-search').value = memoria.CancionInfo || '';
            _selectedMusicTrack = memoria.CancionData || null;
            break;
        case 'Imagen':
            form.querySelector('#memoria-image-desc').value = memoria.Descripcion || '';
            form.querySelector('#image-upload-status').textContent = memoria.ImagenURL ? 'Imagen guardada.' : 'No hay imagen.';
            break;
        case 'Texto':
        default:
            form.querySelector('#memoria-desc').value = memoria.Descripcion || '';
            break;
    }
    
    handleMemoryTypeChange(); // Mostrar los campos correctos
    
    const saveBtn = form.querySelector('#save-memoria-btn');
    saveBtn.textContent = 'Actualizar Memoria';
    saveBtn.disabled = false;
    
    // Hacer scroll y enfocar
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    form.querySelector('#memoria-fecha').focus();
}

/**
 * Muestra/oculta los inputs del formulario según el tipo de memoria.
 */
function handleMemoryTypeChange() {
    const modal = _modals.edit;
    if (!modal) return;
    
    const type = modal.querySelector('#memoria-type').value;
    
    // Ocultar todos
    ['Texto', 'Lugar', 'Musica', 'Imagen'].forEach(id => {
        const group = modal.querySelector(`#input-type-${id}`);
        if (group) group.style.display = 'none';
    });
    
    // Mostrar el seleccionado
    const selectedGroup = modal.querySelector(`#input-type-${type}`);
    if (selectedGroup) {
        selectedGroup.style.display = 'block';
    }
    
    // Limpiar selecciones si se cambia de tipo
    if (type !== 'Musica') _selectedMusicTrack = null;
    if (type !== 'Lugar') _selectedPlace = null;
}

// --- 4. Renderizado de Listas y Resultados ---

/**
 * Muestra los resultados de la búsqueda de iTunes.
 * @param {Array} tracks - Array de pistas de iTunes.
 */
function showMusicResults(tracks) {
    const resultsEl = _modals.edit?.querySelector('#itunes-results');
    if (!resultsEl) return;
    
    resultsEl.innerHTML = '';
    if (tracks.length === 0) {
        resultsEl.innerHTML = '<div class="list-placeholder" style="padding: 10px 0;">Sin resultados.</div>';
        return;
    }
    
    const fragment = document.createDocumentFragment();
    tracks.forEach(track => {
        const trackEl = document.createElement('div');
        trackEl.className = 'itunes-track';
        
        const artwork = track.artworkUrl60 || track.artworkUrl100 || '';
        trackEl.innerHTML = `
            <img src="${artwork}" class="itunes-artwork" style="${artwork ? '' : 'display:none;'}">
            <div class="itunes-track-info">
                <div class="itunes-track-name">${track.trackName}</div>
                <div class="itunes-track-artist">${track.artistName}</div>
            </div>
        `;
        
        // Evento de clic para seleccionar
        trackEl.onclick = () => {
            _selectedMusicTrack = track;
            // Actualizar input y limpiar resultados
            _modals.edit.querySelector('#memoria-music-search').value = `${track.trackName} - ${track.artistName}`;
            resultsEl.innerHTML = '';
            resultsEl.appendChild(trackEl); // Dejar solo el seleccionado
            trackEl.classList.add('selected');
        };
        
        fragment.appendChild(trackEl);
    });
    resultsEl.appendChild(fragment);
}

/**
 * Muestra los resultados de la búsqueda de Nominatim (lugares).
 * @param {Array} places - Array de lugares.
 */
function showPlaceResults(places) {
    const resultsEl = _modals.edit?.querySelector('#place-results');
    if (!resultsEl) return;

    resultsEl.innerHTML = '';
    if (places.length === 0) {
        resultsEl.innerHTML = '<div class="list-placeholder" style="padding: 10px 0;">Sin resultados.</div>';
        return;
    }

    const fragment = document.createDocumentFragment();
    places.forEach(place => {
        const placeEl = document.createElement('div');
        placeEl.className = 'place-result';
        placeEl.textContent = place.display_name;
        
        // Evento de clic para seleccionar
        placeEl.onclick = () => {
            _selectedPlace = {
                name: place.display_name,
                lat: place.lat,
                lon: place.lon,
                osm_id: place.osm_id,
                osm_type: place.osm_type
            };
            // Actualizar input y limpiar resultados
            _modals.edit.querySelector('#memoria-place-search').value = place.display_name;
            resultsEl.innerHTML = '';
            resultsEl.appendChild(placeEl); // Dejar solo el seleccionado
            placeEl.classList.add('selected');
        };
        
        fragment.appendChild(placeEl);
    });
    resultsEl.appendChild(fragment);
}

/**
 * (Privado) Renderiza la lista de memorias en un modal.
 * @param {string} listId - ID del elemento <div> donde renderizar.
 * @param {Array} memories - Array de objetos de memoria.
 */
function _renderMemoryList(listId, memories) {
    const listEl = document.getElementById(listId);
    if (!listEl) return;
    
    listEl.innerHTML = '';
    
    if (memories.length === 0) {
        listEl.innerHTML = '<div class="list-placeholder">No hay memorias para este día.</div>';
        return;
    }
    
    const fragment = document.createDocumentFragment();
    memories.forEach(mem => {
        // Usar 'edit' si el listId es 'edit-memorias-list'
        const mode = (listId === 'edit-memorias-list') ? 'edit' : 'preview';
        fragment.appendChild(_createMemoryItemHTML(mem, mode));
    });
    listEl.appendChild(fragment);
}


// --- 5. Constructores de HTML (Privados) ---

/**
 * (Privado) Conecta los eventos de navegación (Mes Anterior/Siguiente).
 */
function _setupNavigation() {
    _dom.navPrev.onclick = () => _callbacks.onMonthChange('prev');
    _dom.navNext.onclick = () => _callbacks.onMonthChange('next');
}

/**
 * (Privado) Conecta los eventos del footer.
 */
function _setupFooter() {
    _dom.footer.addEventListener('click', (e) => {
        const btn = e.target.closest('.dock-button');
        if (!btn) return;
        
        const action = btn.dataset.action;
        if (!action) return;
        
        // ¡PUNTO 3! Cambiar lógica de 'search'
        if (action === 'search') {
            openSearchModal(); // Abrir modal en lugar de prompt
        } else {
            // El resto de acciones las maneja main.js
            _callbacks.onFooterAction(action);
        }
    });
}

/**
 * (Privado) Crea el HTML para un item de memoria.
 * @param {Object} mem - El objeto de memoria.
 * @param {string} mode - 'preview', 'edit', o 'spotlight'
 * @returns {HTMLElement}
 */
function _createMemoryItemHTML(mem, mode = 'preview') {
    const itemEl = document.createElement('div');
    itemEl.className = (mode === 'spotlight') ? 'spotlight-memory-item' : 'memoria-item';
    
    let icon = 'article';
    let content = mem.Descripcion || 'Memoria de texto';
    let artwork = '';
    
    switch (mem.Tipo) {
        case 'Lugar':
            icon = 'place';
            content = mem.LugarNombre || 'Lugar';
            break;
        case 'Musica':
            icon = 'music_note';
            if (mem.CancionData) {
                content = `<strong>${mem.CancionData.trackName}</strong><br><small style="font-weight:normal;color:#555;">${mem.CancionData.artistName}</small>`;
                if (mem.CancionData.artworkUrl60 && mode !== 'spotlight') {
                    artwork = `<img src="${memoria.CancionData.artworkUrl60}" class="memoria-artwork">`;
                }
            } else {
                content = mem.CancionInfo || 'Música';
            }
            break;
        case 'Imagen':
            icon = 'image';
            content = mem.Descripcion || 'Imagen';
            if (mem.ImagenURL) {
                content += ` <a href="${mem.ImagenURL}" target="_blank" onclick="event.stopPropagation();">(Ver)</a>`;
            }
            break;
    }
    
    // Contenido del Spotlight (más simple)
    if (mode === 'spotlight') {
        let fechaStr = '';
        if (mem.Fecha_Original?.toDate) {
            fechaStr = mem.Fecha_Original.toDate().toLocaleDateString('es-ES', { year: 'numeric' });
        }
        itemEl.innerHTML = `
            <span class="material-icons-outlined">${icon}</span>
            <div class="spotlight-memory-content">
                <small>${fechaStr} - ${mem.Tipo}</small>
                <span>${(mem.Tipo === 'Musica' && mem.CancionData) ? mem.CancionData.trackName : (mem.LugarNombre || mem.Descripcion || mem.CancionInfo)}</span>
            </div>
        `;
        return itemEl;
    }

    // Contenido de Preview/Edit (más detallado)
    let fechaStr = 'Fecha desconocida';
    if (mem.Fecha_Original?.toDate) {
        fechaStr = mem.Fecha_Original.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    
    const contentHTML = `
        ${artwork}
        <div class="memoria-item-content">
            <small>${fechaStr}</small>
            <span class="material-icons-outlined">${icon}</span>
            ${content}
        </div>
    `;
    
    // Añadir botones de acción solo para modo 'edit'
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
    
    itemEl.innerHTML = contentHTML + actionsHTML;
    return itemEl;
}

/**
 * (Privado) Crea el HTML para un item del "Almacén".
 * @param {Object} item - Objeto de memoria o día.
 * @returns {HTMLElement}
 */
function _createStoreListItem(item) {
    const itemEl = document.createElement('div');
    itemEl.className = 'store-list-item';
    itemEl.onclick = () => _callbacks.onStoreItemClick(item.diaId);
    
    let icon = 'article';
    let title = '...';
    let subtitle = '';
    
    if (item.type === 'Nombres') {
        icon = 'label';
        title = item.Nombre_Especial;
        subtitle = item.Nombre_Dia;
    } else {
        subtitle = item.Fecha_Original?.toDate ? item.Fecha_Original.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sin fecha';
        
        switch (item.Tipo) {
            case 'Lugar':
                icon = 'place';
                title = item.LugarNombre;
                break;
            case 'Musica':
                icon = 'music_note';
                title = item.CancionData ? item.CancionData.trackName : item.CancionInfo;
                if (item.CancionData) subtitle += ` - ${item.CancionData.artistName}`;
                break;
            case 'Imagen':
                icon = 'image';
                title = item.Descripcion || 'Imagen';
                break;
            default: // Texto
                icon = 'article';
                title = item.Descripcion || 'Nota';
                break;
        }
    }
    
    itemEl.innerHTML = `
        <span class="material-icons-outlined">${icon}</span>
        <div class="store-list-item-content">
            <small>${subtitle}</small>
            <span>${title}</span>
        </div>
    `;
    return itemEl;
}

/**
 * (Privado) Crea el HTML para el loader principal.
 * @returns {HTMLElement}
 */
function _createMainLoader() {
    const loader = document.createElement('div');
    loader.id = 'main-loader';
    loader.innerHTML = `<span>Cargando...</span>`;
    return loader;
}


// --- 6. Constructores de Modales (Privados) ---

function _createPreviewModal() {
    const modal = document.createElement('div');
    modal.id = 'preview-modal';
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3></h3>
                <button class="modal-close-btn" title="Cerrar">
                    <span class="material-icons-outlined">edit</span>
                </button>
            </div>
            <div class="modal-content-scrollable">
                <div class="modal-section">
                    <h4>Memorias:</h4>
                    <div id="preview-memorias-list" class="list-placeholder">Cargando...</div>
                </div>
            </div>
            <div class="modal-main-buttons">
                <button class="modal-cancel-btn">Cerrar</button>
            </div>
        </div>
    `;
    
    // Eventos
    modal.querySelector('.modal-cancel-btn').onclick = () => closePreviewModal();
    modal.querySelector('.modal-close-btn').onclick = () => {
        // Al pulsar "Editar", cerrar este y abrir el de edición
        if (_currentDay) {
            closePreviewModal();
            // Retrasar para que la animación de cierre termine
            setTimeout(() => {
                openEditModal(_currentDay, _currentMemories, []); // main.js pasará allDays
            }, 200);
        }
    };
    // Cerrar al pulsar fuera
    modal.onclick = (e) => {
        if (e.target.id === 'preview-modal') closePreviewModal();
    };
    
    return modal;
}

function _createEditModal(allDays) {
    const modal = document.createElement('div');
    modal.id = 'edit-modal';
    modal.className = 'modal-overlay';
    
    // Opciones del <select> de días
    const dayOptions = allDays.map(d => `<option value="${d.id}">${d.Nombre_Dia}</option>`).join('');
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="edit-modal-title">Editar Día</h3>
                <button class="modal-close-btn" title="Cerrar">
                    <span class="material-icons-outlined">close</span>
                </button>
            </div>
            
            <div class="modal-content-scrollable">
                
                <!-- Sección de Selección de Día (solo modo 'Añadir') -->
                <div class="modal-section" id="day-selection-section" style="display: none;">
                    <label for="edit-mem-day">Añadir memoria a:</label>
                    <select id="edit-mem-day">${dayOptions}</select>
                </div>
                
                <!-- Sección de Nombre de Día (solo modo 'Editar') -->
                <div class="modal-section" id="day-name-section">
                    <label for="nombre-especial-input">Nombrar este día:</label>
                    <input type="text" id="nombre-especial-input" placeholder="Ej: Día de la Pizza" maxlength="30">
                    <button id="save-name-btn" class="aqua-button">Guardar Nombre</button>
                    <p id="save-status" class="modal-status"></p>
                </div>
                
                <!-- Sección de Memorias (siempre visible) -->
                <div class="modal-section memorias-section">
                    <h4>Memorias</h4>
                    <div id="edit-memorias-list"><div class="list-placeholder">Cargando...</div></div>
                    
                    <!-- Formulario de Añadir/Editar Memoria -->
                    <form id="memory-form" style="margin-top: 20px;">
                        <h5 id="memory-form-title">Añadir/Editar Memoria</h5>
                        
                        <label for="memoria-fecha">Fecha Original:</label>
                        <input type="date" id="memoria-fecha" required>
                        
                        <label for="memoria-type">Tipo:</label>
                        <select id="memoria-type">
                            <option value="Texto">Nota</option>
                            <option value="Lugar">Lugar</option>
                            <option value="Musica">Canción</option>
                            <option value="Imagen">Foto</option>
                        </select>
                        
                        <!-- Inputs Dinámicos -->
                        <div class="add-memory-input-group" id="input-type-Texto">
                            <label for="memoria-desc">Descripción:</label>
                            <textarea id="memoria-desc" placeholder="Escribe tu recuerdo..."></textarea>
                        </div>
                        
                        <div class="add-memory-input-group" id="input-type-Lugar">
                            <label for="memoria-place-search">Buscar Lugar:</label>
                            <input type="text" id="memoria-place-search" placeholder="Ej: Torre Eiffel, París">
                            <button type="button" id="btn-search-place" class="aqua-button">Buscar Lugar</button>
                            <div id="place-results"></div>
                        </div>
                        
                        <div class="add-memory-input-group" id="input-type-Musica">
                            <label for="memoria-music-search">Buscar Canción:</label>
                            <input type="text" id="memoria-music-search" placeholder="Ej: Bohemian Rhapsody, Queen">
                            <button type="button" id="btn-search-itunes" class="aqua-button">Buscar Canción</button>
                            <div id="itunes-results"></div>
                        </div>
                        
                        <div class="add-memory-input-group" id="input-type-Imagen">
                            <label for="memoria-image-upload">Subir Foto:</label>
                            <input type="file" id="memoria-image-upload" accept="image/*">
                            <p id="image-upload-status" style="font-size: 12px; color: #555; margin: 0;"></p>
                            
                            <label for="memoria-image-desc">Descripción (opcional):</label>
                            <input type="text" id="memoria-image-desc" placeholder="Descripción de la foto">
                        </div>
                        
                        <button type="submit" id="save-memoria-btn" class="aqua-button">Añadir Memoria</button>
                        <p id="memoria-status" class="modal-status"></p>
                    </form>
                </div>

            </div> <!-- fin .modal-content-scrollable -->
            
            <div class="modal-main-buttons">
                <button class="modal-cancel-btn">Cerrar</button>
            </div>
            
            <!-- Diálogo de borrado (se moverá aquí) -->
            <div id="confirm-delete-dialog" style="display: none;">
                <p id="confirm-delete-text">¿Seguro que quieres borrar esto?</p>
                <button id="confirm-delete-no" class="aqua-button">Cancelar</button>
                <button id="confirm-delete-yes" class="aqua-button">Borrar</button>
            </div>
        </div>
    `;
    
    // Conectar eventos (usando delegación donde sea posible)
    _bindEditModalEvents(modal);
    
    return modal;
}

/**
 * (Privado) Conecta todos los eventos del modal de edición.
 * @param {HTMLElement} modal - El elemento modal.
 */
function _bindEditModalEvents(modal) {
    // Botón de Cerrar (superior)
    modal.querySelector('.modal-close-btn').onclick = () => closeEditModal();
    // Botón de Cerrar (footer)
    modal.querySelector('.modal-main-buttons .modal-cancel-btn').onclick = () => closeEditModal();
    // Cerrar al pulsar fuera
    modal.onclick = (e) => {
        if (e.target.id === 'edit-modal') closeEditModal();
    };
    
    // Guardar Nombre de Día
    modal.querySelector('#save-name-btn').onclick = () => {
        const newName = modal.querySelector('#nombre-especial-input').value;
        _callbacks.onSaveDayName(_currentDay.id, newName);
    };
    
    // Cambiar Tipo de Memoria
    modal.querySelector('#memoria-type').onchange = () => handleMemoryTypeChange();
    
    // Búsquedas API
    modal.querySelector('#btn-search-itunes').onclick = () => {
        const term = modal.querySelector('#memoria-music-search').value;
        if (term.trim()) _callbacks.onSearchMusic(term.trim());
    };
    modal.querySelector('#btn-search-place').onclick = () => {
        const term = modal.querySelector('#memoria-place-search').value;
        if (term.trim()) _callbacks.onSearchPlace(term.trim());
    };
    
    // Formulario de Memoria (Submit)
    modal.querySelector('#memory-form').onsubmit = (e) => {
        e.preventDefault();
        
        // Deshabilitar botón para evitar doble submit
        const saveBtn = e.target.querySelector('#save-memoria-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Guardando...';
        
        // Recoger datos
        const type = modal.querySelector('#memoria-type').value;
        const diaSelect = modal.querySelector('#edit-mem-day');
        
        // Determinar el diaId (si está en modo "Añadir" o "Editar")
        const diaId = (diaSelect.parentElement.style.display === 'none') ? _currentDay.id : diaSelect.value;
        
        const memoryData = {
            id: _isEditingMemory ? _currentMemories.find(m => m.id === _isEditingMemory.id)?.id : null, // ID si estamos editando
            Fecha_Original: modal.querySelector('#memoria-fecha').value,
            Tipo: type
        };
        
        // Recoger datos específicos del tipo
        switch (type) {
            case 'Texto':
                memoryData.Descripcion = modal.querySelector('#memoria-desc').value.trim();
                break;
            case 'Lugar':
                memoryData.LugarNombre = modal.querySelector('#memoria-place-search').value.trim();
                memoryData.LugarData = _selectedPlace ? { lat: _selectedPlace.lat, lon: _selectedPlace.lon, osm_id: _selectedPlace.osm_id, osm_type: _selectedPlace.osm_type } : null;
                break;
            case 'Musica':
                memoryData.CancionInfo = modal.querySelector('#memoria-music-search').value.trim();
                memoryData.CancionData = _selectedMusicTrack ? { ..._selectedMusicTrack } : null;
                break;
            case 'Imagen':
                memoryData.Descripcion = modal.querySelector('#memoria-image-desc').value.trim();
                const fileInput = modal.querySelector('#memoria-image-upload');
                if (fileInput.files && fileInput.files[0]) {
                    memoryData.file = fileInput.files[0];
                    memoryData.ImagenURL = 'subiendo...'; // Placeholder
                }
                break;
        }
        
        _callbacks.onSaveMemory(diaId, memoryData, _isEditingMemory);
    };
    
    // Delegación de eventos para lista de memorias (Editar/Borrar)
    modal.querySelector('#edit-memorias-list').addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        
        if (editBtn) {
            const memId = editBtn.dataset.memoriaId;
            const memoria = _currentMemories.find(m => m.id === memId);
            if (memoria) {
                fillFormForEdit(memoria);
            }
        }
        
        if (deleteBtn) {
            const memId = deleteBtn.dataset.memoriaId;
            const memoria = _currentMemories.find(m => m.id === memId);
            if (memoria) {
                // Mostrar diálogo de confirmación
                _showConfirmDelete(memoria);
            }
        }
    });
    
    // Diálogo de Confirmar Borrado
    modal.querySelector('#confirm-delete-no').onclick = () => {
        modal.querySelector('#confirm-delete-dialog').style.display = 'none';
    };
}

/**
 * (Privado) Muestra el diálogo de confirmar borrado.
 * @param {Object} memoria - La memoria a borrar.
 */
function _showConfirmDelete(memoria) {
    const modal = _modals.edit;
    if (!modal) return;
    
    const dialog = modal.querySelector('#confirm-delete-dialog');
    const text = modal.querySelector('#confirm-delete-text');
    const yesBtn = modal.querySelector('#confirm-delete-yes');
    
    let desc = memoria.Descripcion || memoria.LugarNombre || memoria.CancionInfo || "esta memoria";
    if (desc.length > 40) desc = desc.substring(0, 40) + "...";
    
    text.textContent = `¿Seguro que quieres borrar "${desc}"?`;
    dialog.style.display = 'block';
    
    // Reasignar evento onclick
    yesBtn.onclick = () => {
        dialog.style.display = 'none';
        _callbacks.onDeleteMemory(_currentDay.id, memoria.id);
    };
}


function _createStoreModal() {
    const modal = document.createElement('div');
    modal.id = 'store-modal';
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Almacén</h3>
                <button class="modal-close-btn" title="Cerrar">
                    <span class="material-icons-outlined">close</span>
                </button>
            </div>
            <div class="modal-content-scrollable">
                <!-- Botones de Categoría se añaden aquí -->
            </div>
            <div class="modal-main-buttons">
                <button class="modal-cancel-btn">Cerrar</button>
            </div>
        </div>
    `;
    
    // Crear botones de categoría
    const scrollable = modal.querySelector('.modal-content-scrollable');
    scrollable.appendChild(_createStoreCategoryButton('Nombres', 'label', 'Nombres de Día'));
    scrollable.appendChild(_createStoreCategoryButton('Lugar', 'place', 'Lugares'));
    scrollable.appendChild(_createStoreCategoryButton('Musica', 'music_note', 'Canciones'));
    scrollable.appendChild(_createStoreCategoryButton('Imagen', 'image', 'Fotos'));
    scrollable.appendChild(_createStoreCategoryButton('Texto', 'article', 'Notas'));
    
    // Eventos
    modal.querySelector('.modal-cancel-btn').onclick = () => closeStoreModal();
    modal.querySelector('.modal-close-btn').onclick = () => closeStoreModal();
    modal.onclick = (e) => {
        if (e.target.id === 'store-modal') closeStoreModal();
    };
    
    return modal;
}

function _createStoreCategoryButton(type, icon, text) {
    const btn = document.createElement('button');
    btn.className = 'store-category-btn';
    btn.dataset.type = type;
    btn.innerHTML = `
        <span class="material-icons-outlined">${icon}</span>
        ${text}
    `;
    btn.onclick = () => _callbacks.onStoreCategoryClick(type);
    return btn;
}

function _createStoreListModal() {
    const modal = document.createElement('div');
    modal.id = 'store-list-modal';
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Resultados</h3> <!-- Título dinámico -->
                <button class="modal-close-btn" title="Cerrar">
                    <span class="material-icons-outlined">close</span>
                </button>
            </div>
            <div class="modal-content-scrollable">
                <div id="store-list-items">
                    <!-- Items van aquí -->
                </div>
                <div id="store-list-loading" class="list-placeholder" style="padding: 20px 0;">Cargando...</div>
                <button id="store-load-more-btn" class="aqua-button" style="display: none; width: calc(100% - 70px); margin: 15px auto 15px 50px;">Cargar Más</button>
            </div>
            <div class="modal-main-buttons">
                <button class="modal-cancel-btn">Volver</button>
            </div>
        </div>
    `;
    
    // Eventos
    const closeBtn = () => closeStoreListModal();
    modal.querySelector('.modal-cancel-btn').onclick = closeBtn;
    modal.querySelector('.modal-close-btn').onclick = closeBtn;
    modal.onclick = (e) => {
        if (e.target.id === 'store-list-modal') closeBtn();
    };
    
    modal.querySelector('#store-load-more-btn').onclick = () => {
        _callbacks.onStoreLoadMore();
    };
    
    return modal;
}


/**
 * (Privado) ¡NUEVO! Crea el modal de Búsqueda
 * @returns {HTMLElement}
 */
function _createSearchModal() {
    const modal = document.createElement('div');
    modal.id = 'search-modal';
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Buscar en Memorias</h3>
                <button class="modal-close-btn" title="Cerrar">
                    <span class="material-icons-outlined">close</span>
                </button>
            </div>
            
            <form id="search-form">
                <div class="modal-content-scrollable">
                    <div class="modal-section">
                        <label for="search-input">Término de búsqueda:</label>
                        <input type="text" id="search-input" placeholder="Ej: pizza, concierto...">
                        <button type="submit" id="search-submit-btn" class="aqua-button">Buscar</button>
                        <p id="search-status" class="modal-status"></p>
                    </div>
                </div>
            </form>
            
            <div class="modal-main-buttons">
                <button type="button" class="modal-cancel-btn">Cerrar</button>
            </div>
        </div>
    `;
    
    // Eventos
    const closeBtn = () => closeSearchModal();
    modal.querySelector('.modal-cancel-btn').onclick = closeBtn;
    modal.querySelector('.modal-close-btn').onclick = closeBtn;
    modal.onclick = (e) => {
        if (e.target.id === 'search-modal') closeBtn();
    };
    
    // Evento de Submit del formulario
    modal.querySelector('#search-form').onsubmit = (e) => {
        e.preventDefault();
        const input = modal.querySelector('#search-input');
        const term = input.value.trim();
        
        if (term) {
            // Deshabilitar botón
            const btn = modal.querySelector('#search-submit-btn');
            btn.disabled = true;
            btn.textContent = 'Buscando...';
            
            const status = modal.querySelector('#search-status');
            status.textContent = '';
            
            // Enviar término a main.js
            _callbacks.onSearchSubmit(term);
        }
    };
    
    return modal;
}


// --- 7. Exportación del Módulo ---

// Exportamos solo las funciones públicas que main.js necesita
export const ui = {
    init,
    setLoading,
    updateLoginUI,
    drawCalendar,
    updateSpotlight,
    
    // Modales
    openPreviewModal,
    closePreviewModal,
    openEditModal,
    closeEditModal,
    openStoreModal,
    closeStoreModal,
    openStoreListModal,
    closeStoreListModal,
    updateStoreList,
    openSearchModal,  // Exportar
    closeSearchModal, // Exportar
    
    // Formularios y Resultados
    showModalStatus,
    resetMemoryForm,
    handleMemoryTypeChange, // Exponer para `window`
    showMusicResults,
    showPlaceResults
};

