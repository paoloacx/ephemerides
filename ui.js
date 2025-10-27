/*
 * ui.js (v4.3 - Corregido)
 * Módulo de interfaz de usuario.
 * Se encarga de TODA la manipulación del DOM.
 * Recibe datos y "callbacks" (funciones) de main.js.
 */

// --- Variables privadas del módulo (Estado de la UI) ---
let callbacks = {}; // Almacena las funciones de main.js
let _currentDay = null; // El día abierto en el modal de edición
let _currentMemories = []; // Las memorias del día abierto
let _allDaysData = []; // Referencia a todos los días (para el <select>)
let _isEditingMemory = false; // Estado del formulario (Añadir vs Editar)

// --- Funciones de Inicialización ---

/**
 * Inicializa el módulo de UI y conecta los callbacks de main.js
 * @param {Object} mainCallbacks - Objeto con todas las funciones de main.js
 */
function init(mainCallbacks) {
    console.log("UI Module init (v4.3)");
    callbacks = mainCallbacks;
    
    // Conectar eventos estáticos (navegación, footer, etc.)
    _bindNavEvents();
    _bindFooterEvents();
    _bindLoginEvents(); // Conecta el botón de login del header
    _bindGlobalListeners(); // Clics para cerrar modales
}

/**
 * Conecta los eventos de navegación (mes anterior/siguiente)
 */
function _bindNavEvents() {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    
    if (prevBtn) {
        prevBtn.onclick = () => {
            if (callbacks.onMonthChange) callbacks.onMonthChange('prev');
        };
    }
    if (nextBtn) {
        nextBtn.onclick = () => {
            if (callbacks.onMonthChange) callbacks.onMonthChange('next');
        };
    }
}

/**
 * Conecta los eventos del footer dock
 */
function _bindFooterEvents() {
    document.getElementById('btn-add-memory')?.addEventListener('click', () => {
        if (callbacks.onFooterAction) callbacks.onFooterAction('add');
    });
    document.getElementById('btn-store')?.addEventListener('click', () => {
        if (callbacks.onFooterAction) callbacks.onFooterAction('store');
    });
    document.getElementById('btn-shuffle')?.addEventListener('click', () => {
        if (callbacks.onFooterAction) callbacks.onFooterAction('shuffle');
    });
    document.getElementById('btn-search')?.addEventListener('click', () => {
        if (callbacks.onFooterAction) callbacks.onFooterAction('search');
    });
}

/**
 * Conecta los eventos de login/logout
 */
function _bindLoginEvents() {
    // El botón se crea dinámicamente, usamos delegación en el header
    const header = document.querySelector('header');
    header?.addEventListener('click', (e) => {
        const loginBtn = e.target.closest('#login-btn');
        if (!loginBtn) return;
        
        const action = loginBtn.dataset.action;
        if (action === 'login' && callbacks.onLogin) {
            callbacks.onLogin();
        } else if (action === 'logout' && callbacks.onLogout) {
            callbacks.onLogout();
        }
    });
}

/**
 * Añade listeners globales (ej. cerrar modales al hacer clic fuera)
 */
function _bindGlobalListeners() {
    document.body.addEventListener('click', (e) => {
        // Cerrar modales si se hace clic en el fondo
        if (e.target.classList.contains('modal-preview')) closePreviewModal();
        if (e.target.classList.contains('modal-edit')) closeEditModal();
        if (e.target.classList.contains('modal-store')) closeStoreModal();
        if (e.target.classList.contains('modal-store-list')) closeStoreListModal();
    });
}

// --- Funciones de Renderizado Principal ---

/**
 * Muestra un mensaje de carga en el 'app-content'
 * @param {string} message - El mensaje a mostrar
 * @param {boolean} show - Mostrar u ocultar
 */
function setLoading(message, show) {
    const appContent = document.getElementById('app-content');
    if (!appContent) return;

    if (show) {
        appContent.innerHTML = `<p class="loading-message">${message}</p>`;
    } else {
        // Se limpia automáticamente al llamar a drawCalendar
        // Pero lo dejamos por si se usa en otros sitios
        const loading = appContent.querySelector('.loading-message');
        if (loading) loading.remove();
    }
}

/**
 * Actualiza la UI de login/logout en el header
 * @param {Object} user - El objeto de usuario de Firebase (o null)
 */
function updateLoginUI(user) {
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const userImg = document.getElementById('user-img');

    if (!loginBtn || !userInfo || !userName || !userImg) return;

    if (user) {
        userInfo.style.display = 'flex';
        userName.textContent = user.displayName || 'Usuario';
        userImg.src = user.photoURL || `https://placehold.co/30x30/ccc/fff?text=${user.displayName ? user.displayName[0] : '?'}`;
        // Recrear el botón para logout
        _createLoginButton(true);
    } else {
        userInfo.style.display = 'none';
        // Recrear el botón para login
        _createLoginButton(false);
    }
}

/**
 * Dibuja la cuadrícula del calendario para un mes
 * @param {string} monthName - Nombre del mes (ej. "Octubre")
 * @param {Array} days - Array de objetos de día para ese mes
 * @param {string} todayId - ID del día de hoy (ej. "10-26")
 */
function drawCalendar(monthName, days, todayId) {
    const monthNameDisplay = document.getElementById('month-name-display');
    const appContent = document.getElementById('app-content');
    
    if (monthNameDisplay) monthNameDisplay.textContent = monthName;
    if (!appContent) return;

    const grid = document.createElement('div');
    grid.className = 'calendario-grid';
    
    days.forEach(dia => {
        const btn = document.createElement('button');
        btn.className = 'dia-btn';
        btn.innerHTML = `<span class="dia-numero">${parseInt(dia.id.substring(3))}</span>`;
        
        // Añadir clases de estado
        if (dia.id === todayId) btn.classList.add('dia-btn-today');
        if (dia.tieneMemorias) btn.classList.add('tiene-memorias');
        
        btn.addEventListener('click', () => {
            if (callbacks.onDayClick) callbacks.onDayClick(dia);
        });
        
        grid.appendChild(btn);
    });
    
    appContent.innerHTML = ''; // Limpiar "Loading..." o el grid anterior
    appContent.appendChild(grid);
}

/**
 * Actualiza el widget "Spotlight"
 * @param {string} title - El título (ej. "Hoy, 26 de octubre")
 * @param {Array} memories - Array de objetos de memoria
 */
function updateSpotlight(title, memories) {
    const titleEl = document.getElementById('spotlight-date-header');
    const listEl = document.getElementById('today-memory-spotlight');

    if (titleEl) titleEl.textContent = title;
    if (!listEl) return;
    
    listEl.innerHTML = ''; // Limpiar
    
    if (!memories || memories.length === 0) {
        listEl.innerHTML = '<p class="list-placeholder">No hay memorias destacadas.</p>';
        return;
    }
    
    memories.forEach(mem => {
        const itemEl = document.createElement('div');
        itemEl.className = 'spotlight-memory-item';
        // Usamos la misma función de renderizado que los modales
        itemEl.innerHTML = createMemoryItemHTML(mem, false); // false = no mostrar acciones
        
        // Hacemos que el item sea clicable para ir a ese día
        itemEl.addEventListener('click', () => {
            if (callbacks.onStoreItemClick) callbacks.onStoreItemClick(mem.diaId);
        });
        
        listEl.appendChild(itemEl);
    });
}


// --- Modal: Vista Previa (Preview) ---

let previewModal = null;
function createPreviewModal() {
    if (previewModal) return; // Ya existe

    previewModal = document.createElement('div');
    previewModal.id = 'preview-modal';
    previewModal.className = 'modal-preview';
    previewModal.innerHTML = `
        <div class="modal-preview-content">
            <div class="modal-preview-header">
                <h3 id="preview-title"></h3>
                <button id="edit-from-preview-btn" class="modal-icon-btn" title="Editar este día">
                    <span class="material-icons-outlined">edit</span>
                </button>
            </div>
            <div class="modal-preview-memorias">
                <h4>Memorias:</h4>
                <div id="preview-memorias-list"></div>
            </div>
            <button id="close-preview-btn" class="aqua-button">Cerrar</button>
        </div>`;
    document.body.appendChild(previewModal);
    
    // Conectar eventos
    document.getElementById('close-preview-btn')?.addEventListener('click', closePreviewModal);
    document.getElementById('edit-from-preview-btn')?.addEventListener('click', () => {
        // Llama a 'add' pero con el día actual
        if (callbacks.onFooterAction && _currentDay) {
            closePreviewModal();
            // Retraso para que la animación de cierre termine
            setTimeout(() => {
                callbacks.onDayClick(_currentDay); // Reutiliza la lógica de clic
            }, 250);
        }
    });
}

function openPreviewModal(dia, memories) {
    createPreviewModal(); // Asegurarse de que existe
    _currentDay = dia; // Guardar día actual para el botón "Editar"
    
    const titleEl = document.getElementById('preview-title');
    const listEl = document.getElementById('preview-memorias-list');
    
    const dayName = dia.Nombre_Especial !== 'Unnamed Day' ? ` (${dia.Nombre_Especial})` : '';
    if (titleEl) titleEl.textContent = `${dia.Nombre_Dia}${dayName}`;
    
    // Renderizar lista
    _renderMemoryList(listEl, memories, false); // false = sin acciones

    previewModal.style.display = 'flex';
    setTimeout(() => previewModal.classList.add('visible'), 10);
}

function closePreviewModal() {
    if (!previewModal) return;
    previewModal.classList.remove('visible');
    setTimeout(() => {
        previewModal.style.display = 'none';
        _currentDay = null; // Limpiar
    }, 200);
}

// --- Modal: Edición (Edit/Add) ---

let editModal = null;
function createEditModal() {
    if (editModal) return; // Ya existe

    editModal = document.createElement('div');
    editModal.id = 'edit-add-modal';
    editModal.className = 'modal-edit';
    editModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-content-scrollable">
                
                <!-- Sección de Selección de Día (Solo para 'Añadir') -->
                <div class="modal-section" id="day-selection-section" style="display: none;">
                    <h3>Añadir Memoria a...</h3>
                    <label for="edit-mem-day">Día (MM-DD):</label>
                    <select id="edit-mem-day"></select>
                </div>

                <!-- Sección de Nombre del Día (Solo para 'Editar') -->
                <div class="modal-section" id="day-name-section" style="display: none;">
                    <h3 id="edit-modal-title"></h3>
                    <label for="nombre-especial-input">Nombrar este día:</label>
                    <input type="text" id="nombre-especial-input" placeholder="Ej. Día de la Pizza" maxlength="25">
                    <button id="save-name-btn" class="aqua-button">Guardar Nombre</button>
                    <p id="save-status" class="status-message"></p>
                </div>

                <!-- Sección de Memorias (Siempre visible) -->
                <div class="modal-section memorias-section">
                    <h4>Memorias</h4>
                    <div id="edit-memorias-list"></div>
                    
                    <form id="memory-form">
                        <p class="section-description" id="memory-form-title">Añadir/Editar Memoria</p>
                        
                        <label for="memoria-fecha">Fecha Original de la Memoria:</label>
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
                            <input type="text" id="memoria-place-search" placeholder="Ej. Torre Eiffel">
                            <button type="button" class="aqua-button" id="btn-search-place">Buscar</button>
                            <div id="place-results" class="search-results"></div>
                        </div>
                        <div class="add-memory-input-group" id="input-type-Musica">
                            <label for="memoria-music-search">Buscar Canción:</label>
                            <input type="text" id="memoria-music-search" placeholder="Ej. Bohemian Rhapsody">
                            <button type="button" class="aqua-button" id="btn-search-itunes">Buscar</button>
                            <div id="itunes-results" class="search-results"></div>
                        </div>
                        <div class="add-memory-input-group" id="input-type-Imagen">
                            <label for="memoria-image-upload">Subir Foto:</label>
                            <input type="file" id="memoria-image-upload" accept="image/*">
                            <label for="memoria-image-desc">Descripción (opcional):</label>
                            <input type="text" id="memoria-image-desc" placeholder="Añade un pie de foto...">
                            <div id="image-upload-status" class="status-message"></div>
                        </div>
                        
                        <button type="submit" id="save-memoria-btn" class="aqua-button">Añadir Memoria</button>
                        <p id="memoria-status" class="status-message"></p>
                    </form>
                </div>

                <!-- Diálogo de Confirmación (se mueve aquí) -->
                <div id="confirm-delete-dialog" style="display: none;">
                    <p id="confirm-delete-text"></p>
                    <button id="confirm-delete-no" class="aqua-button">Cancelar</button>
                    <button id="confirm-delete-yes" class="aqua-button delete-confirm">Borrar</button>
                </div>

            </div> <!-- Fin .modal-content-scrollable -->
            
            <div class="modal-main-buttons">
                <button id="close-edit-add-btn">Cerrar</button>
            </div>
        </div>
    `;
    document.body.appendChild(editModal);
    
    // Conectar eventos del modal
    _bindEditModalEvents();
}

/**
 * Conecta todos los eventos internos del modal de Edición/Añadir
 */
function _bindEditModalEvents() {
    // Botones principales
    document.getElementById('close-edit-add-btn')?.addEventListener('click', closeEditModal);
    document.getElementById('save-name-btn')?.addEventListener('click', () => {
        if (callbacks.onSaveDayName && _currentDay) {
            const input = document.getElementById('nombre-especial-input');
            callbacks.onSaveDayName(_currentDay.id, input.value.trim());
        }
    });

    // Formulario
    document.getElementById('memory-form')?.addEventListener('submit', _handleFormSubmit);
    document.getElementById('memoria-type')?.addEventListener('change', handleMemoryTypeChange);
    
    // Botones de búsqueda API
    document.getElementById('btn-search-itunes')?.addEventListener('click', () => {
        if (callbacks.onSearchMusic) {
            const term = document.getElementById('memoria-music-search').value;
            if (term) callbacks.onSearchMusic(term);
        }
    });
    document.getElementById('btn-search-place')?.addEventListener('click', () => {
        if (callbacks.onSearchPlace) {
            const term = document.getElementById('memoria-place-search').value;
            if (term) callbacks.onSearchPlace(term);
        }
    });
    
    // Diálogo de confirmación
    document.getElementById('confirm-delete-no')?.addEventListener('click', () => {
        document.getElementById('confirm-delete-dialog').style.display = 'none';
    });
    
    // Delegación de eventos para la lista de memorias (Editar/Borrar)
    const listEl = document.getElementById('edit-memorias-list');
    listEl?.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        
        if (editBtn) {
            const memoriaId = editBtn.dataset.memoriaId;
            // CORRECCIÓN: Llamar a la lógica local, no a main.js
            if (_currentMemories && _currentMemories.length > 0) {
                const memToEdit = _currentMemories.find(m => m.id === memoriaId);
                if (memToEdit) {
                    fillFormForEdit(memToEdit); // Llama a la función local
                } else {
                    console.error("No se encontró la memoria en _currentMemories:", memoriaId);
                    showModalStatus('memoria-status', 'Error: Memoria no encontrada.', true);
                }
            }
        }
        
        if (deleteBtn) {
            const memoriaId = deleteBtn.dataset.memoriaId;
            const mem = _currentMemories.find(m => m.id === memoriaId);
            const info = mem ? (mem.Descripcion || mem.LugarNombre || mem.CancionInfo || 'esta memoria') : 'esta memoria';
            _showConfirmDelete(memoriaId, info);
        }
    });
}

function openEditModal(dia, memories, allDays) {
    createEditModal(); // Asegurarse de que existe
    
    // Guardar estado
    _currentDay = dia; // Puede ser null (modo 'Añadir')
    _currentMemories = memories || [];
    _allDaysData = allDays || []; // Para el <select>
    
    const daySelection = document.getElementById('day-selection-section');
    const dayNameSection = document.getElementById('day-name-section');
    const titleEl = document.getElementById('edit-modal-title');
    const nameInput = document.getElementById('nombre-especial-input');
    const daySelect = document.getElementById('edit-mem-day');
    
    if (dia) {
        // --- Modo Edición (Día existente) ---
        daySelection.style.display = 'none';
        dayNameSection.style.display = 'block';
        
        const dayName = dia.Nombre_Especial !== 'Unnamed Day' ? ` (${dia.Nombre_Especial})` : '';
        titleEl.textContent = `Editando: ${dia.Nombre_Dia}${dayName}`;
        nameInput.value = dia.Nombre_Especial !== 'Unnamed Day' ? dia.Nombre_Especial : '';
        
    } else {
        // --- Modo Añadir (Día=null) ---
        daySelection.style.display = 'block';
        dayNameSection.style.display = 'none';
        
        // Poblar el <select> si no lo está
        if (daySelect.options.length === 0 && _allDaysData.length > 0) {
            _allDaysData.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.id;
                opt.textContent = d.Nombre_Dia;
                daySelect.appendChild(opt);
            });
        }
        
        // Seleccionar el día de hoy por defecto
        const today = new Date();
        const todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        daySelect.value = todayId;
    }
    
    // Renderizar lista de memorias (siempre)
    _renderMemoryList(document.getElementById('edit-memorias-list'), _currentMemories, true); // true = con acciones
    
    resetMemoryForm(); // Limpiar el formulario
    
    // Limpiar mensajes de estado
    showModalStatus('save-status', '', false);
    showModalStatus('memoria-status', '', false);
    document.getElementById('confirm-delete-dialog').style.display = 'none';

    editModal.style.display = 'flex';
    setTimeout(() => editModal.classList.add('visible'), 10);
}

function closeEditModal() {
    if (!editModal) return;
    editModal.classList.remove('visible');
    setTimeout(() => {
        editModal.style.display = 'none';
        // Limpiar estado
        _currentDay = null;
        _currentMemories = [];
        _allDaysData = [];
        _isEditingMemory = false;
    }, 200);
}

// --- Modal: Almacén (Store Selector) ---

let storeModal = null;
function createStoreModal() {
    if (storeModal) return;
    storeModal = document.createElement('div');
    storeModal.id = 'store-modal';
    storeModal.className = 'modal-store';
    
    const categories = [
        { type: 'Nombres', icon: 'label', label: 'Nombres de Día' },
        { type: 'Lugar', icon: 'place', label: 'Lugares' },
        { type: 'Musica', icon: 'music_note', label: 'Canciones' },
        { type: 'Imagen', icon: 'image', label: 'Fotos' },
        { type: 'Texto', icon: 'article', label: 'Notas' }
    ];
    
    let buttonsHTML = categories.map(cat => createStoreCategoryButton(cat.type, cat.icon, cat.label)).join('');
    
    storeModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-preview-header">
                <h3>Almacén de Memorias</h3>
            </div>
            <div class="modal-content-scrollable store-category-list">
                ${buttonsHTML}
            </div>
            <div class="modal-main-buttons">
                <button id="close-store-btn">Cerrar</button>
            </div>
        </div>
    `;
    document.body.appendChild(storeModal);
    
    // Conectar eventos
    document.getElementById('close-store-btn')?.addEventListener('click', closeStoreModal);
    storeModal.querySelector('.store-category-list')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.store-category-button');
        if (btn && callbacks.onStoreCategoryClick) {
            callbacks.onStoreCategoryClick(btn.dataset.type);
        }
    });
}

function openStoreModal() {
    createStoreModal(); // Asegurarse de que existe
    storeModal.style.display = 'flex';
    setTimeout(() => storeModal.classList.add('visible'), 10);
}

function closeStoreModal() {
    if (!storeModal) return;
    storeModal.classList.remove('visible');
    setTimeout(() => storeModal.style.display = 'none', 200);
}

// --- Modal: Almacén (Store List) ---

let storeListModal = null;
function createStoreListModal() {
    if (storeListModal) return;
    storeListModal = document.createElement('div');
    storeListModal.id = 'store-list-modal';
    storeListModal.className = 'modal-store-list'; // Clase diferente
    storeListModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-preview-header">
                <h3 id="store-list-title">Resultados</h3>
            </div>
            <div class="modal-content-scrollable" id="store-list-content">
                <!-- Los items se inyectan aquí -->
                <p class="list-placeholder">Cargando...</p>
            </div>
            <div class="modal-main-buttons">
                <button id="close-store-list-btn">Volver</button>
            </div>
        </div>
    `;
    document.body.appendChild(storeListModal);
    
    // Conectar eventos
    _bindStoreListModalEvents();
}

function _bindStoreListModalEvents() {
    document.getElementById('close-store-list-btn')?.addEventListener('click', closeStoreListModal);
    
    const contentEl = document.getElementById('store-list-content');
    contentEl?.addEventListener('click', (e) => {
        // Clic en "Cargar Más"
        const loadMoreBtn = e.target.closest('#load-more-btn');
        if (loadMoreBtn && callbacks.onStoreLoadMore) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.textContent = 'Cargando...';
            callbacks.onStoreLoadMore();
            return; // No propagar clic
        }
        
        // Clic en un item
        const itemEl = e.target.closest('.store-list-item');
        if (itemEl && callbacks.onStoreItemClick) {
            callbacks.onStoreItemClick(itemEl.dataset.diaId);
        }
    });
}

function openStoreListModal(title) {
    createStoreListModal(); // Asegurarse de que existe
    
    const titleEl = document.getElementById('store-list-title');
    const contentEl = document.getElementById('store-list-content');
    
    if (titleEl) titleEl.textContent = title;
    if (contentEl) contentEl.innerHTML = '<p class="list-placeholder">Cargando...</p>'; // Reset
    
    storeListModal.style.display = 'flex';
    setTimeout(() => storeListModal.classList.add('visible'), 10);
}

function closeStoreListModal() {
    if (!storeListModal) return;
    storeListModal.classList.remove('visible');
    setTimeout(() => storeListModal.style.display = 'none', 200);
}

/**
 * Actualiza la lista en el modal de Almacén
 * @param {Array} items - Array de memorias o días
 * @param {boolean} append - true si se añaden, false si se reemplazan
 * @param {boolean} hasMore - true si hay más items que cargar
 */
function updateStoreList(items, append = false, hasMore = false) {
    const contentEl = document.getElementById('store-list-content');
    if (!contentEl) return;
    
    // Quitar "Cargando..." o "Cargar Más" anterior
    const placeholder = contentEl.querySelector('.list-placeholder');
    if (placeholder) placeholder.remove();
    const loadMoreBtn = contentEl.querySelector('#load-more-btn');
    if (loadMoreBtn) loadMoreBtn.remove();
    
    // Si no es append y no hay items, mostrar placeholder
    if (!append && (!items || items.length === 0)) {
        contentEl.innerHTML = '<p class="list-placeholder">No se encontraron resultados.</p>';
        return;
    }
    
    // Si es la primera carga (no append), limpiar el contenedor
    if (!append) {
        contentEl.innerHTML = '';
    }
    
    // Crear y añadir items
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
        const itemEl = createStoreListItem(item);
        fragment.appendChild(itemEl);
    });
    contentEl.appendChild(fragment);
    
    // Añadir botón "Cargar Más" si es necesario
    if (hasMore) {
        const btn = document.createElement('button');
        btn.id = 'load-more-btn';
        btn.className = 'aqua-button';
        btn.textContent = 'Cargar Más (+10)';
        contentEl.appendChild(btn);
    } else if (items.length > 0) {
        // No hay más, pero hay items
        const end = document.createElement('p');
        end.className = 'list-placeholder';
        end.textContent = 'Fin de los resultados.';
        contentEl.appendChild(end);
    }
}

// --- Funciones de Ayuda (Helpers) de UI ---

/**
 * Renderiza la lista de memorias en un elemento contenedor
 * @param {HTMLElement} listEl - El <div> donde se renderiza la lista
 * @param {Array} memories - Array de objetos de memoria
 * @param {boolean} showActions - true para mostrar botones Editar/Borrar
 */
function _renderMemoryList(listEl, memories, showActions) {
    if (!listEl) return;
    listEl.innerHTML = ''; // Limpiar
    
    if (!memories || memories.length === 0) {
        listEl.innerHTML = '<p class="list-placeholder">No hay memorias para este día.</p>';
        return;
    }
    
    const fragment = document.createDocumentFragment();
    memories.forEach(mem => {
        const itemEl = document.createElement('div');
        itemEl.className = 'memoria-item';
        itemEl.innerHTML = createMemoryItemHTML(mem, showActions);
        fragment.appendChild(itemEl);
    });
    listEl.appendChild(fragment);
}

/**
 * Crea el HTML para un solo item de memoria
 * @param {Object} mem - El objeto de memoria
 * @param {boolean} showActions - true para mostrar botones
 * @returns {string} - El HTML interno
 */
function createMemoryItemHTML(mem, showActions) {
    let fechaStr = 'Fecha desconocida';
    if (mem.Fecha_Original) {
        try {
            // Asumimos que es un objeto Timestamp o similar
            const date = new Date(mem.Fecha_Original.seconds * 1000 || mem.Fecha_Original);
            fechaStr = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) { console.warn("Fecha inválida:", mem.Fecha_Original); }
    }
    
    let contentHTML = `<small>${fechaStr}</small>`;
    let artworkHTML = '';
    let icon = 'article'; // Default (Texto)

    switch (mem.Tipo) {
        case 'Lugar':
            icon = 'place';
            contentHTML += `${mem.LugarNombre || 'Lugar sin nombre'}`;
            break;
        case 'Musica':
            icon = 'music_note';
            if (mem.CancionData?.trackName) {
                contentHTML += `<strong>${mem.CancionData.trackName}</strong> by ${mem.CancionData.artistName}`;
                if(mem.CancionData.artworkUrl60) {
                    artworkHTML = `<img src="${mem.CancionData.artworkUrl60}" class="memoria-artwork" alt="Artwork">`;
                }
            } else {
                contentHTML += `${mem.CancionInfo || 'Canción sin nombre'}`;
            }
            break;
        case 'Imagen':
            icon = 'image';
            contentHTML += `${mem.Descripcion || 'Imagen'}`;
            if (mem.ImagenURL) {
                artworkHTML = `<img src="${mem.ImagenURL}" class="memoria-artwork" alt="Memoria">`;
            }
            break;
        case 'Texto':
        default:
            icon = 'article';
            contentHTML += mem.Descripcion || 'Nota vacía';
            break;
    }
    
    // Si no hay artwork, usamos el icono
    if (!artworkHTML) {
        artworkHTML = `<span class="memoria-icon material-icons-outlined">${icon}</span>`;
    }

    const actionsHTML = showActions ? `
        <div class="memoria-actions">
            <button class="edit-btn" title="Editar" data-memoria-id="${mem.id}">
                <span class="material-icons-outlined">edit</span>
            </button>
            <button class="delete-btn" title="Borrar" data-memoria-id="${mem.id}">
                <span class="material-icons-outlined">delete</span>
            </button>
        </div>` : '';
        
    return `${artworkHTML}<div class="memoria-item-content">${contentHTML}</div>${actionsHTML}`;
}

/**
 * Crea el HTML para un botón de categoría del Almacén
 * @param {string} type - El tipo (ej. 'Lugar')
 * @param {string} icon - El nombre del icono de Material Icons
 * @param {string} label - El texto del botón
 * @returns {string} - El HTML del botón
 */
function createStoreCategoryButton(type, icon, label) {
    return `
        <button class="store-category-button" data-type="${type}">
            <span class="material-icons-outlined">${icon}</span>
            <span>${label}</span>
            <span class="material-icons-outlined">chevron_right</span>
        </button>
    `;
}

/**
 * Crea un <div> para un item de la lista del Almacén
 * @param {Object} item - El objeto (memoria o día)
 * @returns {HTMLElement} - El elemento <div>
 */
function createStoreListItem(item) {
    const itemEl = document.createElement('div');
    itemEl.className = 'store-list-item';
    
    let contentHTML = '';
    
    if (item.type === 'Nombres') {
        // Es un Día con Nombre
        itemEl.dataset.diaId = item.id; // El ID del día
        contentHTML = `
            <span class="memoria-icon material-icons-outlined">label</span>
            <div class="memoria-item-content">
                <small>${item.Nombre_Dia}</small>
                <strong>${item.Nombre_Especial}</strong>
            </div>
        `;
    } else {
        // Es una Memoria (reutilizamos la lógica)
        itemEl.dataset.diaId = item.diaId; // ID del día al que pertenece
        itemEl.dataset.id = item.id; // ID de la memoria en sí
        
        // Creamos un HTML de memoria, pero sin acciones
        // Y añadimos el nombre del día
        const memoryHTML = createMemoryItemHTML(item, false);
        contentHTML = `
            ${memoryHTML}
            <div class="store-item-day-ref">${item.Nombre_Dia}</div>
        `;
    }
    
    itemEl.innerHTML = contentHTML;
    return itemEl;
}

/**
 * Muestra el diálogo de confirmación de borrado
 * @param {string} memId - ID de la memoria a borrar
 * @param {string} info - Texto descriptivo de la memoria
 */
function _showConfirmDelete(memId, info) {
    const dialog = document.getElementById('confirm-delete-dialog');
    const text = document.getElementById('confirm-delete-text');
    const yesBtn = document.getElementById('confirm-delete-yes');
    
    if (!dialog || !text || !yesBtn) return;
    
    text.textContent = `¿Seguro que quieres borrar "${info.substring(0, 50)}..."?`;
    
    // Limpiar listener anterior y añadir uno nuevo
    const newYesBtn = yesBtn.cloneNode(true); // Clonar para limpiar
    newYesBtn.addEventListener('click', () => {
        if (callbacks.onDeleteMemory && _currentDay) {
            dialog.style.display = 'none';
            callbacks.onDeleteMemory(_currentDay.id, memId);
        }
    });
    yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
    
    dialog.style.display = 'block';
}

/**
 * Recrea el botón de login/logout (necesario para cambiar listeners)
 * @param {boolean} isLoggedOut - true si el usuario está logueado (y el botón es para logout)
 */
function _createLoginButton(isLoggedOut) {
    const container = document.getElementById('login-btn-container');
    if (!container) {
        // Si no existe, crearlo
        const loginSection = document.getElementById('login-section');
        const btnContainer = document.createElement('div');
        btnContainer.id = 'login-btn-container';
        loginSection?.appendChild(btnContainer);
    }
    
    const btn = document.createElement('button');
    btn.id = 'login-btn';
    btn.className = 'header-login-btn';
    
    if (isLoggedOut) {
        btn.title = 'Cerrar sesión';
        btn.dataset.action = 'logout';
        btn.innerHTML = `<span class="material-icons-outlined">logout</span>`;
    } else {
        btn.title = 'Iniciar sesión con Google';
        btn.dataset.action = 'login';
        // Icono de Google (simplificado)
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path fill="#4285F4" d="M17.64 9.20455c0-.63864-.05727-1.25182-.16909-1.84091H9v3.48182h4.84364c-.20864 1.125-.84273 2.07818-1.77727 2.71136v2.25818h2.90864c1.70182-1.56682 2.68409-3.87409 2.68409-6.61045z"/><path fill="#34A853" d="M9 18c2.43 0 4.47182-.80591 5.96273-2.18045l-2.90864-2.25818c-.80591.54364-1.83682.86591-2.94.86591-2.27318 0-4.20727-1.53318-4.9-3.58227H1.07182v2.33318C2.56636 16.3 5.56 18 9 18z"/><path fill="#FBBC05" d="M4.1 10.71c-.22-.64-.35-1.32-.35-2.03s.13-.139.35-2.03V4.31H1.07C.38 5.67 0 7.29 0 9.03s.38 3.36 1.07 4.72l3.03-2.33v.03z"/><path fill="#EA4335" d="M9 3.57955c1.32136 0 2.50773.45455 3.44091 1.34591l2.58136-2.58136C13.46318.891364 11.4259 0 9 0 5.56 0 2.56636 1.70182 1.07182 4.31l3.02818 2.33318C4.79273 5.11273 6.72682 3.57955 9 3.57955z"/></svg>`;
    }
    
    const oldContainer = document.getElementById('login-btn-container');
    if(oldContainer) {
        oldContainer.innerHTML = ''; // Limpiar
        oldContainer.appendChild(btn); // Añadir nuevo botón
    }
}


// --- Lógica del Formulario de Memorias ---

let _selectedMusic = null;
let _selectedPlace = null;

/**
 * Maneja el envío del formulario de memoria
 * @param {Event} e - Evento de submit
 */
function _handleFormSubmit(e) {
    e.preventDefault();
    if (callbacks.onSaveMemory) {
        const saveBtn = document.getElementById('save-memoria-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Guardando...';

        let diaId;
        if (_currentDay) {
            diaId = _currentDay.id;
        } else {
            // Modo "Añadir", coger del <select>
            diaId = document.getElementById('edit-mem-day').value;
        }

        const formData = {
            id: _isEditingMemory ? document.getElementById('memory-form').dataset.editingId : null,
            Fecha_Original: document.getElementById('memoria-fecha').value,
            Tipo: document.getElementById('memoria-type').value,
        };
        
        // Añadir datos específicos del tipo
        switch (formData.Tipo) {
            case 'Texto':
                formData.Descripcion = document.getElementById('memoria-desc').value;
                break;
            case 'Lugar':
                if (_selectedPlace) {
                    formData.LugarNombre = _selectedPlace.name;
                    formData.LugarData = _selectedPlace.data;
                } else {
                    formData.LugarNombre = document.getElementById('memoria-place-search').value;
                    formData.LugarData = null;
                }
                break;
            case 'Musica':
                 if (_selectedMusic) {
                    formData.CancionInfo = `${_selectedMusic.trackName} - ${_selectedMusic.artistName}`;
                    formData.CancionData = _selectedMusic;
                } else {
                    formData.CancionInfo = document.getElementById('memoria-music-search').value;
                    formData.CancionData = null;
                }
                break;
            case 'Imagen':
                const fileInput = document.getElementById('memoria-image-upload');
                formData.Descripcion = document.getElementById('memoria-image-desc').value;
                formData.file = (fileInput.files && fileInput.files.length > 0) ? fileInput.files[0] : null;
                // Si estamos editando y no se sube archivo nuevo, main.js se encargará de mantener la URL antigua
                formData.ImagenURL = _isEditingMemory ? document.getElementById('memory-form').dataset.existingImageUrl : null;
                break;
        }
        
        callbacks.onSaveMemory(diaId, formData, _isEditingMemory);
    }
}

/**
 * Muestra/oculta los inputs del formulario según el tipo de memoria
 */
function handleMemoryTypeChange() {
    const type = document.getElementById('memoria-type').value;
    ['Texto', 'Lugar', 'Musica', 'Imagen'].forEach(id => {
        const el = document.getElementById(`input-type-${id}`);
        if (el) el.style.display = (id === type) ? 'block' : 'none';
    });
    // Limpiar selecciones si se cambia de tipo
    if (type !== 'Musica') showMusicResults([]);
    if (type !== 'Lugar') showPlaceResults([]);
}

/**
 * Rellena el formulario para editar una memoria existente
 * @param {Object} mem - El objeto de memoria
 */
function fillFormForEdit(mem) {
    if (!mem) return;
    
    resetMemoryForm(); // Limpiar primero
    _isEditingMemory = true;
    
    const form = document.getElementById('memory-form');
    const saveBtn = document.getElementById('save-memoria-btn');
    const typeSelect = document.getElementById('memoria-type');
    
    form.dataset.editingId = mem.id; // Guardar ID para el submit
    saveBtn.textContent = 'Actualizar Memoria';
    
    // Rellenar fecha
    if (mem.Fecha_Original) {
        try {
            const date = new Date(mem.Fecha_Original.seconds * 1000 || mem.Fecha_Original);
            document.getElementById('memoria-fecha').value = date.toISOString().split('T')[0];
        } catch(e) {
            document.getElementById('memoria-fecha').value = '';
        }
    }
    
    // Rellenar tipo y campos específicos
    typeSelect.value = mem.Tipo;
    handleMemoryTypeChange(); // Mostrar los campos correctos
    
    switch (mem.Tipo) {
        case 'Texto':
            document.getElementById('memoria-desc').value = mem.Descripcion || '';
            break;
        case 'Lugar':
            document.getElementById('memoria-place-search').value = mem.LugarNombre || '';
            if (mem.LugarData) {
                _selectedPlace = { name: mem.LugarNombre, data: mem.LugarData };
                showPlaceResults([_selectedPlace], true); // true = marcar como seleccionado
            }
            break;
        case 'Musica':
             document.getElementById('memoria-music-search').value = mem.CancionInfo || '';
             if (mem.CancionData) {
                _selectedMusic = mem.CancionData;
                showMusicResults([_selectedMusic], true); // true = marcar como seleccionado
             }
            break;
        case 'Imagen':
            document.getElementById('memoria-image-desc').value = mem.Descripcion || '';
            if (mem.ImagenURL) {
                document.getElementById('image-upload-status').textContent = `Imagen actual guardada.`;
                form.dataset.existingImageUrl = mem.ImagenURL; // Guardar URL
            }
            break;
    }
    
    // Scroll hasta el formulario
    document.querySelector('.modal-content-scrollable')?.scrollTo({
        top: document.getElementById('memory-form').offsetTop,
        behavior: 'smooth'
    });
}

/**
 * Limpia el formulario de memoria
 */
function resetMemoryForm() {
    _isEditingMemory = false;
    _selectedMusic = null;
    _selectedPlace = null;
    
    const form = document.getElementById('memory-form');
    if (!form) return;
    
    form.reset();
    form.dataset.editingId = '';
    form.dataset.existingImageUrl = '';
    
    document.getElementById('save-memoria-btn').textContent = 'Añadir Memoria';
    document.getElementById('save-memoria-btn').disabled = false;
    
    showMusicResults([]);
    showPlaceResults([]);
    document.getElementById('image-upload-status').textContent = '';
    
    handleMemoryTypeChange(); // Asegurarse de que se muestran los campos correctos
}

/**
 * Muestra los resultados de búsqueda de iTunes
 * @param {Array} tracks - Array de pistas
 * @param {boolean} isSelected - true si solo se muestra el item seleccionado
 */
function showMusicResults(tracks, isSelected = false) {
    const resultsEl = document.getElementById('itunes-results');
    if (!resultsEl) return;
    resultsEl.innerHTML = '';
    _selectedMusic = null;
    
    if (isSelected && tracks.length > 0) {
        // Mostrar solo el seleccionado
        const track = tracks[0];
        _selectedMusic = track;
        resultsEl.innerHTML = `<p class="search-result-selected">Seleccionado: ${track.trackName}</p>`;
        return;
    }
    
    if (tracks.length === 0) return;
    
    tracks.forEach(track => {
        const itemEl = document.createElement('div');
        itemEl.className = 'search-result-item';
        const artwork = track.artworkUrl60 || '';
        itemEl.innerHTML = `
            <img src="${artwork}" class="memoria-artwork" alt="" ${artwork ? '' : 'style="display:none;"'}>
            <div class="memoria-item-content">
                <small>${track.artistName}</small>
                <strong>${track.trackName}</strong>
            </div>
            <span class="material-icons-outlined">add_circle_outline</span>
        `;
        itemEl.addEventListener('click', () => {
            _selectedMusic = track;
            document.getElementById('memoria-music-search').value = `${track.trackName} - ${track.artistName}`;
            resultsEl.innerHTML = `<p class="search-result-selected">Seleccionado: ${track.trackName}</p>`;
        });
        resultsEl.appendChild(itemEl);
    });
}

/**
 * Muestra los resultados de búsqueda de Nominatim
 * @param {Array} places - Array de lugares
 * @param {boolean} isSelected - true si solo se muestra el item seleccionado
 */
function showPlaceResults(places, isSelected = false) {
    const resultsEl = document.getElementById('place-results');
    if (!resultsEl) return;
    resultsEl.innerHTML = '';
    _selectedPlace = null;

    if (isSelected && places.length > 0) {
        // Mostrar solo el seleccionado
        const place = places[0];
        _selectedPlace = { name: place.name, data: place.data };
        resultsEl.innerHTML = `<p class="search-result-selected">Seleccionado: ${place.name}</p>`;
        return;
    }

    if (places.length === 0) return;

    places.forEach(place => {
        const itemEl = document.createElement('div');
        itemEl.className = 'search-result-item';
        itemEl.innerHTML = `
            <span class="memoria-icon material-icons-outlined">place</span>
            <div class="memoria-item-content">
                <strong>${place.display_name}</strong>
            </div>
            <span class="material-icons-outlined">add_circle_outline</span>
        `;
        itemEl.addEventListener('click', () => {
            _selectedPlace = {
                name: place.display_name,
                data: { lat: place.lat, lon: place.lon, osm_id: place.osm_id, osm_type: place.osm_type }
            };
            document.getElementById('memoria-place-search').value = place.display_name;
            resultsEl.innerHTML = `<p class="search-result-selected">Seleccionado: ${place.name}</p>`;
        });
        resultsEl.appendChild(itemEl);
    });
}

/**
 * Muestra un mensaje de estado en un modal
 * @param {string} elementId - ID del elemento <p>
 * @param {string} message - Mensaje a mostrar
 * @param {boolean} isError - true si es un error
 */
function showModalStatus(elementId, message, isError) {
    const statusEl = document.getElementById(elementId);
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = isError ? 'status-message error' : 'status-message success';
    
    if (message) {
        // Ocultar mensaje después de 3 segundos
        setTimeout(() => {
            if (statusEl.textContent === message) {
                statusEl.textContent = '';
                statusEl.className = 'status-message';
            }
        }, 3000);
    }
}


// --- Exportaciones Públicas ---
// Se exporta un solo objeto 'ui' que contiene
// todas las funciones que main.js necesita llamar.
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
    
    // Formularios y Listas
    updateStoreList,
    resetMemoryForm,
    fillFormForEdit,
    showMusicResults,
    showPlaceResults,
    showModalStatus,
    handleMemoryTypeChange // Exponer para `window.` (aunque ya no se use)
};

