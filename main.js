/*
 * main.js (v4.1 - Corregido)
 * Controlador principal de Ephemerides.
 * Orquesta los módulos: auth, store, api, ui.
 * Gestiona el estado de la aplicación.
 */

// --- Importaciones de Módulos ---
import { initFirebase, db, auth } from './firebase.js'; 
import { initAuthListener, handleLogin, handleLogout } from './auth.js';
import { 
    checkAndRunApp as storeCheckAndRun,
    loadAllDaysData,
    loadMemoriesForDay,
    saveDayName,
    saveMemory,
    deleteMemory,
    searchMemories,
    getTodaySpotlight,
    getMemoriesByType,
    getNamedDays
} from './store.js';
import { searchiTunes, searchNominatim } from './api.js';
import { ui } from './ui.js';

// --- Estado Global de la App ---
let state = {
    allDaysData: [],
    currentMonthIndex: new Date().getMonth(),
    currentUser: null,
    todayId: '',
    
    // Estado del modal "Almacén"
    store: {
        currentType: null, // 'Lugar', 'Musica', 'Nombres', etc.
        isLoading: false,
        lastVisible: null, // Para paginación
    }
};

// --- 1. Inicialización de la App ---

/**
 * Función principal que arranca la aplicación.
 */
async function checkAndRunApp() {
    console.log("Iniciando Ephemerides v4.1 (Modular)...");
    
    try {
        ui.setLoading("Verificando base de datos...", true);
        initFirebase();
        initAuthListener(handleAuthStateChange);
        
        await storeCheckAndRun((message) => ui.setLoading(message, true));
        
        ui.setLoading("Cargando calendario...", true);
        state.allDaysData = await loadAllDaysData();

        if (state.allDaysData.length === 0) {
            throw new Error("La base de datos está vacía después de la verificación.");
        }
        
        const today = new Date();
        // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
        // Era .part() y debía ser .padStart()
        state.todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        
        // Inicializar la UI (conectar todos los callbacks)
        ui.init(getUICallbacks());
        
        drawCurrentMonth();
        loadTodaySpotlight();
        
    } catch (err) {
        console.error("Error crítico durante el arranque:", err);
        ui.setLoading(`Error crítico: ${err.message}. Por favor, recarga.`, true);
    }
}

/**
 * Carga los datos del "Spotlight" para el día de hoy.
 */
async function loadTodaySpotlight() {
    const today = new Date();
    const dateString = `Hoy, ${today.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`;
    
    const spotlightData = await getTodaySpotlight(state.todayId);
    
    if (spotlightData) {
        const fullDateString = `${dateString} ${spotlightData.dayName !== 'Unnamed Day' ? `(${spotlightData.dayName})` : ''}`;
        ui.updateSpotlight(fullDateString, spotlightData.memories);
    }
}

/**
 * Dibuja el mes actual en el calendario.
 */
function drawCurrentMonth() {
    const monthName = new Date(2024, state.currentMonthIndex, 1).toLocaleDateString('es-ES', { month: 'long' });
    const monthNumber = state.currentMonthIndex + 1;
    
    const diasDelMes = state.allDaysData.filter(dia => 
        parseInt(dia.id.substring(0, 2), 10) === monthNumber
    );
    
    ui.drawCalendar(monthName, diasDelMes, state.todayId);
}


// --- 2. Callbacks y Manejadores de Eventos ---

/**
 * Devuelve un objeto con todas las funciones "callback" que ui.js necesita.
 * @returns {Object}
 */
function getUICallbacks() {
    return {
        // Navegación y Footer
        onMonthChange: handleMonthChange,
        onDayClick: handleDayClick,
        onFooterAction: handleFooterAction,
        
        // Autenticación
        onLogin: handleLogin,
        onLogout: handleLogout,
        
        // Acciones del Modal de Edición
        onSaveDayName: handleSaveDayName,
        onSaveMemory: handleSaveMemorySubmit,
        onDeleteMemory: handleDeleteMemory,
        
        // Acciones de API
        onSearchMusic: handleMusicSearch,
        onSearchPlace: handlePlaceSearch,
        
        // Acciones del Modal "Almacén"
        onStoreCategoryClick: handleStoreCategoryClick,
        onStoreLoadMore: handleStoreLoadMore,
        onStoreItemClick: handleStoreItemClick,

        // ¡NUEVO! Acción del Modal "Buscar"
        onSearchSubmit: handleSearchSubmit, 
    };
}

/**
 * Se llama cuando el estado de autenticación cambia (login/logout).
 * @param {Object} user - El objeto de usuario de Firebase, o null.
 */
function handleAuthStateChange(user) {
    state.currentUser = user;
    ui.updateLoginUI(user);
    console.log("Estado de autenticación cambiado:", user ? user.uid : "Logged out");
}

/**
 * Maneja los clics en los botones de navegación (mes anterior/siguiente).
 * @param {string} direction - 'prev' o 'next'.
 */
function handleMonthChange(direction) {
    if (direction === 'prev') {
        state.currentMonthIndex = (state.currentMonthIndex - 1 + 12) % 12;
    } else {
        state.currentMonthIndex = (state.currentMonthIndex + 1) % 12;
    }
    drawCurrentMonth();
}

/**
 * Maneja el clic en un día del calendario.
 * @param {Object} dia - El objeto de día clicado.
 */
async function handleDayClick(dia) {
    // ui.setLoading("Cargando memorias...", true); // Loader en modal es mejor
    const memories = await loadMemoriesForDay(dia.id);
    // ui.setLoading(null, false);
    
    if (state.currentUser) {
        ui.openEditModal(dia, memories, state.allDaysData);
    } else {
        ui.openPreviewModal(dia, memories);
    }
}

/**
 * Maneja los clics en los botones del footer (Add, Store, Shuffle).
 * 'Search' ahora es manejado internamente por ui.js para abrir el modal.
 * @param {string} action - 'add', 'store', 'shuffle'.
 */
function handleFooterAction(action) {
    switch (action) {
        case 'add':
            ui.openEditModal(null, [], state.allDaysData);
            break;
            
        case 'store':
            ui.openStoreModal();
            break;
            
        case 'shuffle':
            handleShuffleClick();
            break;
        
        // 'search' ya no se maneja aquí
            
        default:
            console.warn("Acción de footer desconocida:", action);
    }
}

/**
 * Navega a un día aleatorio.
 */
function handleShuffleClick() {
    if (state.allDaysData.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * state.allDaysData.length);
    const randomDia = state.allDaysData[randomIndex];
    const randomMonthIndex = parseInt(randomDia.id.substring(0, 2), 10) - 1;
    
    if (state.currentMonthIndex !== randomMonthIndex) {
        state.currentMonthIndex = randomMonthIndex;
        drawCurrentMonth();
    }
    
    setTimeout(() => {
        handleDayClick(randomDia);
    }, 100);
    
    window.scrollTo(0, 0);
}

/**
 * ¡NUEVO! Maneja el envío del formulario de búsqueda (desde ui.js).
 * @param {string} term - Término de búsqueda.
 */
async function handleSearchSubmit(term) {
    console.log("Buscando término:", term);
    
    // ui.js ya ha deshabilitado el botón
    
    // Llamar a la búsqueda (lenta) de store.js
    const results = await searchMemories(term.toLowerCase());
    
    // Cerrar el modal de búsqueda
    ui.closeSearchModal();
    
    // Mostrar resultados en el Spotlight
    if (results.length === 0) {
        ui.updateSpotlight(`No hay resultados para "${term}"`, []);
    } else {
        ui.updateSpotlight(`Resultados para "${term}" (${results.length})`, results);
    }
}


// --- 3. Lógica de Modales (Controlador) ---

/**
 * Guarda el nuevo nombre especial para un día.
 * @param {string} diaId - El ID del día (ej. "01-01").
 * @param {string} newName - El nuevo nombre.
 */
async function handleSaveDayName(diaId, newName) {
    try {
        await saveDayName(diaId, newName);
        
        // Actualizar estado local
        const dayIndex = state.allDaysData.findIndex(d => d.id === diaId);
        if (dayIndex !== -1) {
            state.allDaysData[dayIndex].Nombre_Especial = newName || "Unnamed Day";
        }
        
        ui.showModalStatus('save-status', 'Nombre guardado', false);
        drawCurrentMonth(); // Redibujar por si el nombre cambió
        
    } catch (err) {
        console.error("Error guardando nombre:", err);
        ui.showModalStatus('save-status', `Error: ${err.message}`, true);
    }
}

/**
 * Recibe los datos del formulario de memoria (desde ui.js) y los guarda.
 * @param {string} diaId - El ID del día.
 * @param {Object} memoryData - Los datos del formulario.
 * @param {boolean} isEditing - True si es una actualización.
 */
async function handleSaveMemorySubmit(diaId, memoryData, isEditing) {
    
    try {
        // 1. Convertir fecha string a Objeto Date
        try {
            const dateParts = memoryData.Fecha_Original.split('-'); // YYYY-MM-DD
            const utcDate = new Date(Date.UTC(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])));
            if (isNaN(utcDate.getTime())) throw new Error('Fecha inválida');
            memoryData.Fecha_Original = utcDate; // store.js lo convertirá a Timestamp
        } catch (e) {
            throw new Error('Formato de fecha original inválido.');
        }
        
        // 2. Lógica de subida de imagen (TODO)
        if (memoryData.Tipo === 'Imagen' && memoryData.file) {
            // ... lógica de subida ...
            // memoryData.ImagenURL = await uploadImage(memoryData.file);
            console.warn("Subida de imagen aún no implementada.");
            // Por ahora, borramos el 'file' para que no intente guardarlo en Firestore
            delete memoryData.file;
        }

        // 3. Guardar en Firestore
        const memoryId = isEditing ? memoryData.id : null;
        await saveMemory(diaId, memoryData, memoryId);
        
        // 4. Actualizar UI
        ui.showModalStatus('memoria-status', isEditing ? 'Memoria actualizada' : 'Memoria guardada', false);
        ui.resetMemoryForm();
        
        // 5. Recargar la lista de memorias en el modal
        const updatedMemories = await loadMemoriesForDay(diaId);
        // Volver a abrir/refrescar el modal de edición con los datos actualizados
        ui.openEditModal(
            state.allDaysData.find(d => d.id === diaId),
            updatedMemories,
            state.allDaysData
        );
        
        // 6. Actualizar el grid (para el punto azul)
        const dayIndex = state.allDaysData.findIndex(d => d.id === diaId);
        if (dayIndex !== -1 && !state.allDaysData[dayIndex].tieneMemorias) {
            state.allDaysData[dayIndex].tieneMemorias = true;
            drawCurrentMonth();
        }
        
        // 7. Recargar el spotlight si estábamos editando el día de hoy
        if (diaId === state.todayId) {
            loadTodaySpotlight();
        }
        
    } catch (err) {
        console.error("Error guardando memoria:", err);
        ui.showModalStatus('memoria-status', `Error: ${err.message}`, true);
        // Reactivar el botón si falla (ui.js debería hacer esto)
    }
}

/**
 * Borra una memoria.
 * @param {string} diaId - El ID del día.
 * @param {string} memId - El ID de la memoria.
 */
async function handleDeleteMemory(diaId, memId) {
    try {
        await deleteMemory(diaId, memId);
        ui.showModalStatus('memoria-status', 'Memoria borrada', false);
        
        const updatedMemories = await loadMemoriesForDay(diaId);
        
        // Refrescar el modal de edición
        ui.openEditModal(
            state.allDaysData.find(d => d.id === diaId),
            updatedMemories,
            state.allDaysData
        );

        // Comprobar si era la última memoria y actualizar el grid
        if (updatedMemories.length === 0) {
            const dayIndex = state.allDaysData.findIndex(d => d.id === diaId);
            if (dayIndex !== -1) {
                state.allDaysData[dayIndex].tieneMemorias = false;
                drawCurrentMonth();
            }
        }

        // Recargar el spotlight si estábamos editando el día de hoy
        if (diaId === state.todayId) {
            loadTodaySpotlight();
        }
        
    } catch (err) {
        console.error("Error borrando memoria:", err);
        ui.showModalStatus('memoria-status', `Error: ${err.message}`, true);
    }
}


// --- 4. Lógica de API Externa (Controlador) ---

/**
 * Llama al módulo API para buscar música y pasa los resultados a la UI.
 * @param {string} term - Término de búsqueda.
 */
async function handleMusicSearch(term) {
    try {
        const tracks = await searchiTunes(term);
        ui.showMusicResults(tracks);
    } catch (err) {
        console.error("Error en búsqueda de iTunes:", err);
        ui.showModalStatus('memoria-status', 'Error buscando música', true);
    }
}

/**
 * Llama al módulo API para buscar lugares y pasa los resultados a la UI.
 * @param {string} term - Término de búsqueda.
 */
async function handlePlaceSearch(term) {
    try {
        const places = await searchNominatim(term);
        ui.showPlaceResults(places);
    } catch (err) {
        console.error("Error en búsqueda de Nominatim:", err);
        ui.showModalStatus('memoria-status', 'Error buscando lugares', true);
    }
}

// --- 5. Lógica del "Almacén" (Controlador) ---

/**
 * Maneja el clic en una categoría del Almacén.
 * @param {string} type - 'Nombres', 'Lugar', 'Musica', 'Texto', 'Imagen'
 */
async function handleStoreCategoryClick(type) {
    console.log("Cargando Almacén para:", type);
    
    // Resetear estado de paginación
    state.store.currentType = type;
    state.store.lastVisible = null;
    state.store.isLoading = true;
    
    const title = `Almacén: ${type}`;
    ui.openStoreListModal(title);
    
    try {
        let result;
        if (type === 'Nombres') {
            result = await getNamedDays(10);
        } else {
            result = await getMemoriesByType(type, 10);
        }
        
        state.store.lastVisible = result.lastVisible;
        state.store.isLoading = false;
        
        ui.updateStoreList(result.items, false, result.hasMore);
        
    } catch (err) {
        console.error(`Error cargando categoría ${type}:`, err);
        ui.updateStoreList([], false, false);
        if (err.code === 'failed-precondition') {
            console.error("¡ÍNDICE DE FIREBASE REQUERIDO!", err.message);
            alert("Error de Firebase: Se requiere un índice. Revisa la consola (F12) para ver el enlace de creación.");
        }
    }
}

/**
 * Carga la siguiente página de resultados en el Almacén.
 */
async function handleStoreLoadMore() {
    const { currentType, lastVisible, isLoading } = state.store;
    if (isLoading || !currentType || !lastVisible) return;
    
    console.log("Cargando más...", currentType);
    state.store.isLoading = true;
    
    try {
        let result;
        if (currentType === 'Nombres') {
            result = await getNamedDays(10, lastVisible);
        } else {
            result = await getMemoriesByType(currentType, 10, lastVisible);
        }
        
        state.store.lastVisible = result.lastVisible;
        state.store.isLoading = false;
        
        ui.updateStoreList(result.items, true, result.hasMore);
        
    } catch (err) {
        console.error(`Error cargando más ${currentType}:`, err);
        state.store.isLoading = false;
    }
}

/**
 * Maneja el clic en un item de la lista del Almacén (navega a ese día).
 * @param {string} diaId - El ID del día (ej. "05-14").
 */
function handleStoreItemClick(diaId) {
    const dia = state.allDaysData.find(d => d.id === diaId);
    if (!dia) {
        console.error("No se encontró el día:", diaId);
        return;
    }
    
    ui.closeStoreListModal();
    ui.closeStoreModal();
    
    const monthIndex = parseInt(dia.id.substring(0, 2), 10) - 1;
    if (state.currentMonthIndex !== monthIndex) {
        state.currentMonthIndex = monthIndex;
        drawCurrentMonth();
    }
    
    setTimeout(() => {
        handleDayClick(dia);
    }, 100);
    
    window.scrollTo(0, 0);
}


// --- 6. Ejecución Inicial ---
checkAndRunApp();

