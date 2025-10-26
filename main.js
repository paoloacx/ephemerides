/* main.js - v3.2 (Con Lógica de Almacén) */

// --- Importaciones de Módulos ---
import { initAuthListener, handleLogin, handleLogout } from './auth.js';
import {
    generateCleanDatabase, loadAllDaysData, searchMemories,
    getMemoriesForDay, saveMemory, deleteMemory, updateDayName,
    getMemoriesByType, getNamedDays // ¡Nuevas importaciones!
} from './store.js';
import { searchiTunes, searchNominatim } from './api.js';
import * as ui from './ui.js';

// --- Importaciones de Funciones de Firebase ---
import { Timestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// --- Constantes ---
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // Incluye Feb 29

// --- Estado de la Aplicación (El "Cerebro") ---
let allDaysData = [];
let currentMonthIndex = new Date().getMonth();
let currentMemories = [];      // Caché de memorias para el modal de edición
let editingMemoryId = null;    // ID de la memoria que se está editando
let currentlyOpenDay = null; // Día (preview o edit)
let selectedMusicTrack = null; // Track de iTunes seleccionado
let selectedPlace = null;      // Lugar de Nominatim seleccionado
let currentUser = null;        // Usuario de Firebase

// --- ¡NUEVO! Estado del Almacén (Paginación) ---
let storeLastDoc = null;
let storeCurrentType = null;
let storeIsLoading = false;


// --- 1. Inicialización de la App ---

/**
 * Función principal que comprueba la BBDD y arranca la app.
 */
async function checkAndRunApp() {
// ... (código existente sin cambios)
    console.log("Starting App...");
    ui.setLoading("Verifying database...");
    try {
// ... (código existente sin cambios)
        let data = await loadAllDaysData();
        console.log(`Docs in 'Dias': ${data.count}`);

        if (data.count < 366) {
// ... (código existente sin cambios)
            console.warn(`Repairing... Found ${data.count} docs, expected 366.`);
            ui.setLoading("Repairing database...");
// ... (código existente sin cambios)
            const created = await generateCleanDatabase(monthNames, daysInMonth);
            ui.setLoading(`✅ DB regenerated: ${created} days!`);
// ... (código existente sin cambios)
            data = await loadAllDaysData(); // Recargar datos
        }
        
        allDaysData = data.docs;
// ... (código existente sin cambios)
        if (allDaysData.length === 0) {
             throw new Error("Database empty or invalid after loading.");
// ... (código existente sin cambios)
        }
        
        console.log(`Loaded ${allDaysData.length} valid days.`);
// ... (código existente sin cambios)
        console.log("Data sorted. First:", allDaysData[0]?.id, "Last:", allDaysData[allDaysData.length - 1]?.id);

        // Configurar la UI con los 'controladores'
// ... (código existente sin cambios)
        setupUICallbacks();
        
        // Dibujar estado inicial
// ... (código existente sin cambios)
        updateCalendarView();
        
        // Inicializar Auth
// ... (código existente sin cambios)
        initAuthListener(onAuthChange);
        
    } catch (e) {
// ... (código existente sin cambios)
        ui.showAppError(`Critical error during startup: ${e.message}`);
        console.error(e);
    }
}

/**
 * Conecta los "controladores" (lógica) a los "eventos" (UI).
 */
function setupUICallbacks() {
    ui.setupNavigation(handlePrevMonth, handleNextMonth);
    // ¡Actualizado! quitamos handleTodayClick, añadimos handleStoreClick
    ui.setupFooter(handleSearchClick, handleShuffleClick, handleAddMemoryClick, handleStoreClick);
    ui.setupRefreshButton(() => window.location.reload());
    // (Login/Logout se configuran en onAuthChange)
}

// --- 2. Controladores de Autenticación ---

function onAuthChange(user) {
// ... (código existente sin cambios)
    currentUser = user;
    // Pasa los callbacks de login/logout a la UI
// ... (código existente sin cambios)
    ui.updateLoginUI(user, handleLogin, handleLogout); 
    if (user) {
// ... (código existente sin cambios)
        console.log("User logged in:", user.displayName);
    } else {
// ... (código existente sin cambios)
        console.log("User logged out.");
    }
}

// --- 3. Controladores de Navegación y Footer ---

function handlePrevMonth() {
// ... (código existente sin cambios)
    currentMonthIndex = (currentMonthIndex - 1 + 12) % 12;
    updateCalendarView();
}

function handleNextMonth() {
// ... (código existente sin cambios)
    currentMonthIndex = (currentMonthIndex + 1) % 12;
    updateCalendarView();
}

/** Dibuja el grid del calendario para el mes actual. */
function updateCalendarView() {
// ... (código existente sin cambios)
    ui.updateMonthName(monthNames[currentMonthIndex]);
    
    const monthNumberTarget = currentMonthIndex + 1;
// ... (código existente sin cambios)
    const daysOfMonth = allDaysData.filter(dia => parseInt(dia.id.substring(0, 2), 10) === monthNumberTarget);
    
    const today = new Date();
// ... (código existente sin cambios)
    const todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    
    ui.drawCalendarGrid(daysOfMonth, daysInMonth[currentMonthIndex], todayId, currentMonthIndex, handleDayClick);
}

function handleDayClick(day) {
// ... (código existente sin cambios)
    console.log("Day clicked:", day.id);
    currentlyOpenDay = day;
// ... (código existente sin cambios)
    ui.openPreviewModal(day, () => handleEditDayClick(day));
    
    // Carga las memorias *después* de abrir el modal
// ... (código existente sin cambios)
    loadAndDrawMemories(day.id, 'preview-memorias-list');
}

// ¡ELIMINADO! La función handleTodayClick() ya no existe.

async function handleSearchClick() {
// ... (código existente sin cambios)
    const searchTerm = ui.promptSearch();
    if (!searchTerm?.trim()) return;

    const term = searchTerm.trim().toLowerCase();
// ... (código existente sin cambios)
    ui.setLoading(`Searching for "${term}"...`);
    try {
// ... (código existente sin cambios)
        const results = await searchMemories(allDaysData, term);
        ui.drawSearchResults(term, results, (memoria) => {
// ... (código existente sin cambios)
            // Lógica de clic en resultado
            const monthIndex = parseInt(memoria.diaId.substring(0, 2), 10) - 1;
// ... (código existente sin cambios)
            if (monthIndex >= 0) {
                currentMonthIndex = monthIndex;
// ... (código existente sin cambios)
                updateCalendarView();
                const targetDia = allDaysData.find(d => d.id === memoria.diaId);
// ... (código existente sin cambios)
                if(targetDia) setTimeout(() => handleDayClick(targetDia), 50);
                window.scrollTo(0, 0);
// ... (código existente sin cambios)
            }
        });
    } catch (e) {
// ... (código existente sin cambios)
        ui.showAppError(`Search error: ${e.message}`);
        console.error(e);
    }
}

function handleShuffleClick() {
// ... (código existente sin cambios)
    if (allDaysData.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * allDaysData.length);
// ... (código existente sin cambios)
    const randomDia = allDaysData[randomIndex];
    const randomMonthIndex = parseInt(randomDia.id.substring(0, 2), 10) - 1;
    
    if (currentMonthIndex !== randomMonthIndex) {
// ... (código existente sin cambios)
        currentMonthIndex = randomMonthIndex;
        updateCalendarView();
    }
// ... (código existente sin cambios)
    setTimeout(() => handleDayClick(randomDia), 50);
    window.scrollTo(0, 0);
}

function handleAddMemoryClick() {
// ... (código existente sin cambios)
    // Abre el modal de edición en modo "Añadir"
    // Elige el día de hoy por defecto
// ... (código existente sin cambios)
    const today = new Date();
    const todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
// ... (código existente sin cambios)
    currentlyOpenDay = allDaysData.find(d => d.id === todayId) || allDaysData[0]; // Fallback
    
    editingMemoryId = null;
// ... (código existente sin cambios)
    currentMemories = [];
    
    ui.openEditModal(currentlyOpenDay, allDaysData,
// ... (código existente sin cambios)
        handleSaveDayName,
        handleSaveMemorySubmit,
// ... (código existente sin cambios)
        handleSearchMusic,
        handleSearchPlace
// ... (código existente sin cambios)
    );
}

function handleEditDayClick(day) {
// ... (código existente sin cambios)
    ui.closePreviewModal();
    
    currentlyOpenDay = day;
// ... (código existente sin cambios)
    editingMemoryId = null;
    currentMemories = []; // Resetea caché

// ... (código existente sin cambios)
    // Abre el modal de edición
    setTimeout(() => {
// ... (código existente sin cambios)
        ui.openEditModal(day, allDaysData,
            handleSaveDayName,       // Callback para guardar nombre
// ... (código existente sin cambios)
            handleSaveMemorySubmit,  // Callback para guardar memoria
            handleSearchMusic,       // Callback para buscar música
// ... (código existente sin cambios)
            handleSearchPlace        // Callback para buscar lugar
        );
        // Carga las memorias *después* de abrir el modal
// ... (código existente sin cambios)
        loadAndDrawMemories(day.id, 'edit-memorias-list');
    }, 250); // Delay para que cierre el preview
}


// --- 4. Controladores de Carga de Memorias ---

/**
 * Lógica de negocio para cargar y dibujar memorias en una lista.
// ... (código existente sin cambios)
 * @param {string} listId - El ID del div donde dibujar.
 */
async function loadAndDrawMemories(diaId, listId) {
// ... (código existente sin cambios)
    try {
        const memories = await getMemoriesForDay(diaId);
        
// ... (código existente sin cambios)
        // Si es la lista de edición, guarda las memorias en caché
        if (listId === 'edit-memorias-list') {
// ... (código existente sin cambios)
            currentMemories = memories;
        }
        
// ... (código existente sin cambios)
        // Llama a la UI para dibujar
        ui.drawMemoriesList(listId, memories,
// ... (código existente sin cambios)
            (memoria) => handleEditMemoryClick(memoria), // Callback de Editar
            (memoria, displayInfo) => handleDeleteMemoryClick(memoria, displayInfo) // Callback de Borrar
// ... (código existente sin cambios)
        );
        console.log(`Loaded ${memories.length} memories for ${diaId} into ${listId}`);
// ... (código existente sin cambios)
    
    } catch (e) {
        console.error(`Error loading memories ${diaId}:`, e);
// ... (código existente sin cambios)
        ui.showMemoryListError(listId);
    }
}

// --- 5. Controladores del Modal de Edición (Formularios y API) ---

async function handleSaveDayName(newName) {
// ... (código existente sin cambios)
    if (!currentlyOpenDay) return;
    const diaId = currentlyOpenDay.id;
    
    try {
// ... (código existente sin cambios)
        const nombreGuardado = await updateDayName(diaId, newName);
        
        // Actualiza estado local
// ... (código existente sin cambios)
        const dayInState = allDaysData.find(d => d.id === diaId);
        if (dayInState) dayInState.Nombre_Especial = nombreGuardado;
// ... (código existente sin cambios)
        if (currentlyOpenDay) currentlyOpenDay.Nombre_Especial = nombreGuardado;
        
        ui.showSaveDayNameStatus("Name Saved!");
// ... (código existente sin cambios)
        updateCalendarView(); // Redibuja el grid
        
    } catch (e) {
// ... (código existente sin cambios)
        ui.showSaveDayNameStatus(`Error: ${e.message}`, true);
        console.error(e);
    }
}

async function handleSearchMusic(term) {
// ... (código existente sin cambios)
    if (!term) {
        ui.showMusicSearchError("Enter a term.");
// ... (código existente sin cambios)
        return;
    }
    ui.showMusicSearchLoading();
// ... (código existente sin cambios)
    try {
        const data = await searchiTunes(term);
// ... (código existente sin cambios)
        if (!data.results || data.resultCount === 0) {
            ui.showMusicSearchError("No results.");
// ... (código existente sin cambios)
            return;
        }
        // Pasa los datos a la UI para que los dibuje
// ... (código existente sin cambios)
        ui.drawMusicSearchResults(data.results, (track) => {
            // Callback cuando se selecciona un track
// ... (código existente sin cambios)
            selectedMusicTrack = track;
            console.log("Selected Music:", track);
// ... (código existente sin cambios)
        });
    } catch (e) {
// ... (código existente sin cambios)
        ui.showMusicSearchError(`Error: ${e.message}`);
    }
}

async function handleSearchPlace(term) {
// ... (código existente sin cambios)
    if (!term) {
        ui.showPlaceSearchError("Enter a place.");
// ... (código existente sin cambios)
        return;
    }
    ui.showPlaceSearchLoading();
// ... (código existente sin cambios)
    try {
        const data = await searchNominatim(term);
// ... (código existente sin cambios)
        if (!data || data.length === 0) {
            ui.showPlaceSearchError("No results.");
// ... (código existente sin cambios)
            return;
        }
        // Pasa los datos a la UI para que los dibuje
// ... (código existente sin cambios)
        ui.drawPlaceSearchResults(data, (place) => {
            // Callback cuando se selecciona un lugar
// ... (código existente sin cambios)
            selectedPlace = place;
            console.log("Selected Place:", place);
// ... (código existente sin cambios)
        });
    } catch (e) {
// ... (código existente sin cambios)
        ui.showPlaceSearchError(`Error: ${e.message}`);
    }
}

// --- 6. Controladores de CRUD de Memorias (Formulario) ---

/**
 * Se llama cuando el usuario hace clic en el botón 'Editar' de una memoria.
// ... (código existente sin cambios)
 */
function handleEditMemoryClick(memoria) {
    console.log("Editing memory:", memoria.id);
// ... (código existente sin cambios)
    editingMemoryId = memoria.id;
    
    // Resetea selecciones de API
// ... (código existente sin cambios)
    selectedMusicTrack = memoria.CancionData || null;
    selectedPlace = memoria.LugarData ? { name: memoria.LugarNombre, ...memoria.LugarData } : null;
    
    // Llama a la UI para rellenar el formulario
// ... (código existente sin cambios)
    ui.fillEditForm(memoria);
}

/**
 * Se llama cuando el usuario hace clic en el botón 'Borrar' de una memoria.
// ... (código existente sin cambios)
 */
function handleDeleteMemoryClick(memoria, displayInfo) {
    console.log("Deleting memory:", memoria.id);
// ... (código existente sin cambios)
    ui.showDeleteConfirmation(displayInfo, async () => {
        // Callback de confirmación
// ... (código existente sin cambios)
        if (!currentlyOpenDay) return;
        const diaId = currentlyOpenDay.id;
        
        try {
// ... (código existente sin cambios)
            await deleteMemory(diaId, memoria.id);
            ui.showSaveMemoryStatus("Deleted!");
// ... (código existente sin cambios)
            // Recarga la lista de memorias
            await loadAndDrawMemories(diaId, 'edit-memorias-list');
// ... (código existente sin cambios)
            // También recarga la preview si está abierta
            loadAndDrawMemories(diaId, 'preview-memorias-list');
// ... (código existente sin cambios)
        } catch (e) {
            ui.showSaveMemoryStatus(`Error: ${e.message}`, true);
// ... (código existente sin cambios)
            console.error(e);
        }
    });
}

/**
 * Se llama cuando el usuario envía el formulario de 'Añadir/Editar Memoria'.
 */
async function handleSaveMemorySubmit() {
// ... (código existente sin cambios)
    // 1. Obtener datos de la UI
    const selection = ui.getDaySelectionData(); // Para modo 'Añadir'
// ... (código existente sin cambios)
    const { memoryData, imageFile, isValid } = ui.getMemoryFormData();
    
    let diaId;
// ... (código existente sin cambios)
    if (selection) {
        diaId = selection.diaId;
// ... (código existente sin cambios)
    } else if (currentlyOpenDay) {
        diaId = currentlyOpenDay.id;
// ... (código existente sin cambios)
    } else {
        ui.showSaveMemoryStatus("Error: No day selected.", true);
// ... (código existente sin cambios)
        return;
    }

    if (!isValid) {
// ... (código existente sin cambios)
        ui.showSaveMemoryStatus("Fill required fields.", true);
        return;
    }

// ... (código existente sin cambios)
    // 2. Lógica de negocio para validar
    if (memoryData.Tipo === 'Imagen' && !imageFile && !editingMemoryId) {
// ... (código existente sin cambios)
        ui.showSaveMemoryStatus("New image memory requires a file.", true);
        return; // Requiere imagen si es nueva
// ... (código existente sin cambios)
    }
    
    // (Lógica de subida de imagen iría aquí)
// ... (código existente sin cambios)
    if (imageFile) {
        alert("Image upload not implemented yet.");
// ... (código existente sin cambios)
        ui.showSaveMemoryStatus("Upload not implemented.", true);
        return;
    }
    
// ... (código existente sin cambios)
    // 3. Preparar objeto de datos final
    try {
        const dateParts = memoryData.Fecha_Original.split('-');
// ... (código existente sin cambios)
        const dateOfMemory = new Date(Date.UTC(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])));
        memoryData.Fecha_Original = Timestamp.fromDate(dateOfMemory);

// ... (código existente sin cambios)
        // Añadir datos de API si existen
        if (memoryData.Tipo === 'Lugar' && selectedPlace) {
// ... (código existente sin cambios)
            memoryData.LugarNombre = selectedPlace.name;
            memoryData.LugarData = { lat: selectedPlace.lat, lon: selectedPlace.lon, osm_id: selectedPlace.osm_id, osm_type: selectedPlace.osm_type };
// ... (código existente sin cambios)
        }
        if (memoryData.Tipo === 'Musica' && selectedMusicTrack) {
// ... (código existente sin cambios)
            memoryData.CancionData = { trackId: selectedMusicTrack.trackId, artistName: selectedMusicTrack.artistName, trackName: selectedMusicTrack.trackName, artworkUrl60: selectedMusicTrack.artworkUrl60, trackViewUrl: selectedMusicTrack.trackViewUrl };
            memoryData.CancionInfo = `${selectedMusicTrack.trackName} - ${selectedMusicTrack.artistName}`;
// ... (código existente sin cambios)
        }
        
        // Mantener URL de imagen si no se cambia
// ... (código existente sin cambios)
        if (memoryData.Tipo === 'Imagen' && !imageFile && editingMemoryId) {
            const existingMem = currentMemories.find(m => m.id === editingMemoryId);
// ... (código existente sin cambios)
            if (existingMem?.ImagenURL) {
                memoryData.ImagenURL = existingMem.ImagenURL;
// ... (código existente sin cambios)
            }
        }

        // 4. Guardar en el Store
// ... (código existente sin cambios)
        await saveMemory(diaId, memoryData, editingMemoryId);
        
        // 5. Actualizar UI
// ... (código existente sin cambios)
        ui.showSaveMemoryStatus(editingMemoryId ? 'Updated!' : 'Saved!');
        ui.resetMemoryForm();
// ... (código existente sin cambios)
        editingMemoryId = null;
        selectedMusicTrack = null;
// ... (código existente sin cambios)
        selectedPlace = null;
        
        // Recargar listas
// ... (código existente sin cambios)
        await loadAndDrawMemories(diaId, 'edit-memorias-list');
        await loadAndDrawMemories(diaId, 'preview-memorias-list');

    } catch (e) {
// ... (código existente sin cambios)
        ui.showSaveMemoryStatus(`Error: ${e.message}`, true);
        console.error("Save/Update Error:", e);
    }
}

// --- 7. ¡NUEVO! Controladores del Almacén (Store) ---

/** Se llama al hacer clic en el botón 'Store' del footer. */
function handleStoreClick() {
    console.log("Store button clicked");
    // Abre el modal selector y le pasa el controlador de categorías
    ui.openStoreModal(handleStoreCategoryClick);
}

/**
 * Se llama al hacer clic en una categoría en el modal 'Store'.
 * @param {string} type - El tipo de memoria (ej. 'Lugar', 'Nombre_Especial').
 * @param {string} title - El título legible (ej. '📍 Lugares').
 */
function handleStoreCategoryClick(type, title) {
    console.log("Store category clicked:", type);
    
    // Resetear estado de paginación
    storeCurrentType = type;
    storeLastDoc = null;
    storeIsLoading = false;
    
    // Abrir el modal de lista
    ui.openStoreListModal(title, handleStoreLoadMore); // Pasa el callback para 'Cargar Más'
    
    // Cargar la primera página de resultados
    loadAndShowStoreList(true); // true = es la primera carga
}

/** Se llama al hacer clic en 'Cargar Más' en el modal de lista. */
function handleStoreLoadMore() {
    if (storeIsLoading) return;
    
    console.log("Loading more for:", storeCurrentType);
    loadAndShowStoreList(false); // false = no es la primera carga
}

/**
 * Lógica principal para cargar y mostrar la lista del almacén paginada.
 * @param {boolean} isFirstLoad - Si es la primera carga (para limpiar la lista).
 */
async function loadAndShowStoreList(isFirstLoad) {
    if (storeIsLoading || (storeLastDoc === null && !isFirstLoad)) {
        console.log("No more results to load.");
        return; // Ya no hay más
    }
    
    storeIsLoading = true;
    if (isFirstLoad) {
        ui.showStoreListLoading();
    } else {
        ui.setStoreLoadMoreLoading();
    }
    
    try {
        let results;
        // Llama a la función de 'store' adecuada
        if (storeCurrentType === 'Nombre_Especial') {
            results = await getNamedDays(storeLastDoc);
        } else {
            results = await getMemoriesByType(storeCurrentType, storeLastDoc);
        }
        
        // Actualiza el estado de paginación
        storeLastDoc = results.lastDoc;
        
        // Añadir el 'diaNombre' a las memorias (si no lo tienen)
        const memoriesConNombre = results.memories.map(mem => {
            if (!mem.diaNombre) {
                const dia = allDaysData.find(d => d.id === mem.diaId);
                mem.diaNombre = dia ? dia.Nombre_Dia : 'Día Desconocido';
            }
            return mem;
        });
        
        // Pasa los resultados a la UI
        ui.drawStoreList(memoriesConNombre, !!storeLastDoc, (memoria) => {
            // Callback para clic en un item de la lista
            console.log("Store item clicked:", memoria);
            const dia = allDaysData.find(d => d.id === memoria.diaId);
            if (dia) {
                ui.closeStoreListModal();
                ui.closeStoreModal();
                handleDayClick(dia); // Abre el preview de ese día
            }
        });
        
    } catch (e) {
        console.error("Error loading store list:", e);
        if (e.message.includes("requires an index")) {
            ui.showAppError("Error: La base de datos necesita un índice. Revisa la consola (F12) para ver el enlace y crearlo en Firebase.");
        } else {
            ui.showAppError(`Error: ${e.message}`);
        }
    } finally {
        storeIsLoading = false;
    }
}


// --- Arrancar la Aplicación ---
checkAndRunApp();

