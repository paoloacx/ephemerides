/*
 * main.js (v3.4)
 * Controlador principal de Ephemerides.
 * Orquesta los módulos: auth, store, api, ui.
 * Gestiona el estado de la aplicación.
 */

// --- Importaciones de Módulos ---
// CORRECCIÓN: Importamos 'db' y 'auth' desde firebase.js
import { initFirebase, db, auth } from './firebase.js'; 
// CORRECCIÓN: 'auth' ya no se importa desde aquí
import { initAuthListener, handleLogin, handleLogout } from './auth.js';
import { 
    // CORRECCIÓN: 'store' (la variable) no se importa, solo las funciones
    checkAndRunApp as storeCheckAndRun,
    loadAllDaysData,
    loadMemoriesForDay,
    saveDayName,
    saveMemory,
    deleteMemory,
    searchMemories,
    getTodaySpotlight,
    getMemoriesByType,
    getNamedDays,
    findMemoryById // Asumiendo que store.js tiene esta función
} from './store.js';
// CORRECCIÓN: 'api' (la variable) no se importa
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
        lastVisible: null, // Para paginación
        isLoading: false,
    }
};

// --- 1. Inicialización de la App ---

/**
 * Función principal que arranca la aplicación.
 */
async function checkAndRunApp() {
    console.log("Iniciando Ephemerides v3.4 (Modular)...");
    
    try {
        // Mostrar mensaje de carga inicial
        ui.setLoading("Verificando base de datos...", true);

        // Inicializar Firebase (esto es síncrono)
        initFirebase();
        
        // Configurar el listener de autenticación
        initAuthListener(handleAuthStateChange);
        
        // Verificar y/o generar la base de datos de 366 días
        // Pasamos un callback para actualizar el estado de carga
        await storeCheckAndRun((message) => ui.setLoading(message, true));
        
        // Cargar todos los datos de los días
        ui.setLoading("Cargando calendario...", true);
        state.allDaysData = await loadAllDaysData();

        if (state.allDaysData.length === 0) {
            throw new Error("La base de datos está vacía después de la verificación.");
        }
        
        // Calcular el ID de hoy (solo una vez)
        const today = new Date();
        state.todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        
        // Inicializar la UI (conectar todos los callbacks)
        ui.init(getUICallbacks());
        
        // Dibujar el mes actual por primera vez
        drawCurrentMonth();
        
        // Cargar el Spotlight de Hoy
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
    
    // Pedir a store.js las memorias y el nombre del día
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
    
    // Filtrar los días que pertenecen a este mes
    const diasDelMes = state.allDaysData.filter(dia => 
        parseInt(dia.id.substring(0, 2), 10) === monthNumber
    );
    
    // Dibujar el calendario
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
    
    // TODO: Recargar memorias si las reglas de seguridad dependen del UID
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
 * Decide si abrir el modal de Preview o el de Edición.
 * @param {Object} dia - El objeto de día clicado.
 */
async function handleDayClick(dia) {
    // Si el usuario está logueado, abre "Editar", si no, abre "Preview".
    // TODO: ¿Permitir que el usuario logueado también vea "Preview" primero?
    
    // Cargar las memorias para este día
    // ui.setLoading("Cargando memorias...", true); // Esto oculta el grid, mejor un loader en el modal
    const memories = await loadMemoriesForDay(dia.id);
    // ui.setLoading(null, false); // Limpiar loader principal
    
    if (state.currentUser) {
        // Usuario logueado: Abrir modal de edición
        ui.openEditModal(dia, memories, state.allDaysData);
    } else {
        // Usuario no logueado: Abrir modal de vista previa
        ui.openPreviewModal(dia, memories);
    }
}

/**
 * Maneja los clics en los botones del footer.
 * @param {string} action - 'add', 'store', 'shuffle', 'search'.
 * @param {*} [payload] - Datos adicionales (ej. memId para 'edit-memory').
 */
function handleFooterAction(action, payload) {
    switch (action) {
        case 'add':
            // Abrir modal de edición en modo "Añadir" (dia=null)
            // Asume que no hay memorias que cargar (array vacío)
            ui.openEditModal(null, [], state.allDaysData);
            break;
            
        case 'store':
            ui.openStoreModal();
            break;
            
        case 'shuffle':
            handleShuffleClick();
            break;
            
        case 'search':
            handleSearchClick();
            break;
        
        // Este es un "hack" llamado desde ui.js para rellenar el formulario
        case 'edit-memory':
            handleEditMemoryClick(payload); // payload es el memId
            break;
            
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
    
    // Esperar a que el DOM se actualice y luego abrir el modal
    setTimeout(() => {
        handleDayClick(randomDia); // Reutiliza la lógica de clic
    }, 100); // 100ms de gracia
    
    window.scrollTo(0, 0);
}

/**
 * Pide un término de búsqueda y muestra los resultados.
 */
async function handleSearchClick() {
    const searchTerm = prompt("Buscar en todas las memorias:");
    if (!searchTerm || searchTerm.trim() === '') return;
    
    const term = searchTerm.trim().toLowerCase();
    
    ui.setLoading(`Buscando "${term}"...`, true);
    
    // store.js hace la búsqueda lenta de 366 consultas
    const results = await searchMemories(term);
    
    // Limpiar el loader y mostrar resultados (usando el spotlight)
    ui.setLoading(null, false);
    
    if (results.length === 0) {
        ui.updateSpotlight(`No hay resultados para "${term}"`, []);
    } else {
        // Reutilizamos el Spotlight para mostrar los resultados de búsqueda
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
        // 1. Convertir fecha string a Timestamp (lógica de negocio)
        try {
            const dateParts = memoryData.Fecha_Original.split('-'); // YYYY-MM-DD
            const utcDate = new Date(Date.UTC(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])));
            if (isNaN(utcDate.getTime())) throw new Error('Fecha inválida');
            memoryData.Fecha_Original = utcDate; // store.js lo convertirá
        } catch (e) {
            throw new Error('Formato de fecha original inválido.');
        }
        
        // 2. Lógica de subida de imagen (TODO)
        if (memoryData.Tipo === 'Imagen' && memoryData.file) {
            // ... lógica de subida ...
            // memoryData.ImagenURL = await uploadImage(memoryData.file);
        }

        // 3. Guardar en Firestore
        const memoryId = isEditing ? memoryData.id : null;
        await saveMemory(diaId, memoryData, memoryId);
        
        // 4. Actualizar UI
        ui.showModalStatus('memoria-status', isEditing ? 'Memoria actualizada' : 'Memoria guardada', false);
        ui.resetMemoryForm();
        
        // 5. Recargar la lista de memorias en el modal
        const updatedMemories = await loadMemoriesForDay(diaId);
        // ui.js debe tener una función para actualizar solo la lista
        // (La función _renderMemoryList no es pública, main.js no debería llamarla)
        // Solución:
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
        
    } catch (err) {
        console.error("Error guardando memoria:", err);
        ui.showModalStatus('memoria-status', `Error: ${err.message}`, true);
        // Reactivar el botón si falla
        const saveBtn = document.getElementById('save-memoria-btn');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = isEditing ? 'Actualizar Memoria' : 'Añadir Memoria';
        }
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
        
        // Recargar la lista de memorias
        const updatedMemories = await loadMemoriesForDay(diaId);
        
        // Volver a renderizar la lista en el modal
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
        
    } catch (err) {
        console.error("Error borrando memoria:", err);
        ui.showModalStatus('memoria-status', `Error: ${err.message}`, true);
    }
}

/**
 * (Hack) Busca una memoria y le dice a la UI que rellene el formulario.
 * @param {string} memId - El ID de la memoria.
 */
async function handleEditMemoryClick(memId) {
    if (!memId) return;
    
    // Le pedimos a store.js que encuentre la memoria
    // Esta función necesita ser creada en store.js
    const memory = await findMemoryById(memId); 
    
    if (memory) {
        ui.fillFormForEdit(memory);
    } else {
        ui.showModalStatus('memoria-status', 'Error: No se encontró la memoria para editar.', true);
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
        // ui.js debería tener una función showErrorMusicResults
        // ui.showMusicResultsError(err.message);
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
        // ui.showPlaceResultsError(err.message);
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
    
    // Abrir el modal de lista
    const title = `Almacén: ${type}`;
    ui.openStoreListModal(title);
    
    try {
        let result;
        if (type === 'Nombres') {
            result = await getNamedDays(10); // Límite de 10
        } else {
            result = await getMemoriesByType(type, 10); // Límite de 10
        }
        
        // Actualizar estado de paginación
        state.store.lastVisible = result.lastVisible;
        state.store.isLoading = false;
        
        // Enviar datos a la UI
        ui.updateStoreList(result.items, false, result.hasMore); // false = reemplazar
        
    } catch (err) {
        console.error(`Error cargando categoría ${type}:`, err);
        // TODO: Mostrar error en el modal de lista
        ui.updateStoreList([], false, false); // Limpiar lista
        // Mostrar el error de Firebase (enlace del índice)
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
        
        // Actualizar estado
        state.store.lastVisible = result.lastVisible;
        state.store.isLoading = false;
        
        // Enviar datos a la UI (modo append)
        ui.updateStoreList(result.items, true, result.hasMore); // true = añadir
        
    } catch (err) {
        console.error(`Error cargando más ${currentType}:`, err);
        state.store.isLoading = false;
        // TODO: Mostrar error
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
    
    // Cerrar todos los modales del Almacén
    ui.closeStoreListModal();
    ui.closeStoreModal();
    
    // Navegar a ese mes y abrir el día
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

