/* main.js - v3.0 Modular (UI Separada) */

// --- Importaciones de Módulos ---
import { initAuthListener, handleLogin, handleLogout } from './auth.js';
import {
    generateCleanDatabase, loadAllDaysData, searchMemories,
    getMemoriesForDay, saveMemory, deleteMemory, updateDayName
} from './store.js';
import { searchiTunes, searchNominatim } from './api.js';
// ¡NUEVO! Importar todo el módulo de UI
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

// --- 1. Inicialización de la App ---

/**
 * Función principal que comprueba la BBDD y arranca la app.
 */
async function checkAndRunApp() {
    console.log("Starting App...");
    ui.setLoading("Verifying database...");
    try {
        let data = await loadAllDaysData();
        console.log(`Docs in 'Dias': ${data.count}`);

        if (data.count < 366) {
            console.warn(`Repairing... Found ${data.count} docs, expected 366.`);
            ui.setLoading("Repairing database...");
            const created = await generateCleanDatabase(monthNames, daysInMonth);
            ui.setLoading(`✅ DB regenerated: ${created} days!`);
            data = await loadAllDaysData(); // Recargar datos
        }
        
        allDaysData = data.docs;
        if (allDaysData.length === 0) {
             throw new Error("Database empty or invalid after loading.");
        }
        
        console.log(`Loaded ${allDaysData.length} valid days.`);
        console.log("Data sorted. First:", allDaysData[0]?.id, "Last:", allDaysData[allDaysData.length - 1]?.id);

        // Configurar la UI con los 'controladores'
        setupUICallbacks();
        
        // Dibujar estado inicial
        updateCalendarView();
        
        // Inicializar Auth
        initAuthListener(onAuthChange);
        
    } catch (e) {
        ui.showAppError(`Critical error during startup: ${e.message}`);
        console.error(e);
    }
}

/**
 * Conecta los "controladores" (lógica) a los "eventos" (UI).
 */
function setupUICallbacks() {
    ui.setupNavigation(handlePrevMonth, handleNextMonth);
    ui.setupFooter(handleTodayClick, handleSearchClick, handleShuffleClick, handleAddMemoryClick);
    ui.setupRefreshButton(() => window.location.reload());
    // (Login/Logout se configuran en onAuthChange)
}

// --- 2. Controladores de Autenticación ---

function onAuthChange(user) {
    currentUser = user;
    // Pasa los callbacks de login/logout a la UI
    ui.updateLoginUI(user, handleLogin, handleLogout); 
    if (user) {
        console.log("User logged in:", user.displayName);
    } else {
        console.log("User logged out.");
    }
}

// --- 3. Controladores de Navegación y Footer ---

function handlePrevMonth() {
    currentMonthIndex = (currentMonthIndex - 1 + 12) % 12;
    updateCalendarView();
}

function handleNextMonth() {
    currentMonthIndex = (currentMonthIndex + 1) % 12;
    updateCalendarView();
}

/** Dibuja el grid del calendario para el mes actual. */
function updateCalendarView() {
    ui.updateMonthName(monthNames[currentMonthIndex]);
    
    const monthNumberTarget = currentMonthIndex + 1;
    const daysOfMonth = allDaysData.filter(dia => parseInt(dia.id.substring(0, 2), 10) === monthNumberTarget);
    
    const today = new Date();
    const todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    
    ui.drawCalendarGrid(daysOfMonth, daysInMonth[currentMonthIndex], todayId, currentMonthIndex, handleDayClick);
}

function handleDayClick(day) {
    console.log("Day clicked:", day.id);
    currentlyOpenDay = day;
    ui.openPreviewModal(day, () => handleEditDayClick(day));
    
    // Carga las memorias *después* de abrir el modal
    loadAndDrawMemories(day.id, 'preview-memorias-list');
}

function handleTodayClick() {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayId = `${(todayMonth + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    const todayDia = allDaysData.find(d => d.id === todayId);
    
    if (todayDia) {
        if (currentMonthIndex !== todayMonth) {
            currentMonthIndex = todayMonth;
            updateCalendarView();
        }
        // Espera a que la UI se redibuje
        setTimeout(() => handleDayClick(todayDia), 50);
        window.scrollTo(0, 0);
    } else {
        alert("Error: Could not find data for today.");
    }
}

async function handleSearchClick() {
    const searchTerm = ui.promptSearch();
    if (!searchTerm?.trim()) return;

    const term = searchTerm.trim().toLowerCase();
    ui.setLoading(`Searching for "${term}"...`);
    try {
        const results = await searchMemories(allDaysData, term);
        ui.drawSearchResults(term, results, (memoria) => {
            // Lógica de clic en resultado
            const monthIndex = parseInt(memoria.diaId.substring(0, 2), 10) - 1;
            if (monthIndex >= 0) {
                currentMonthIndex = monthIndex;
                updateCalendarView();
                const targetDia = allDaysData.find(d => d.id === memoria.diaId);
                if(targetDia) setTimeout(() => handleDayClick(targetDia), 50);
                window.scrollTo(0, 0);
            }
        });
    } catch (e) {
        ui.showAppError(`Search error: ${e.message}`);
        console.error(e);
    }
}

function handleShuffleClick() {
    if (allDaysData.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * allDaysData.length);
    const randomDia = allDaysData[randomIndex];
    const randomMonthIndex = parseInt(randomDia.id.substring(0, 2), 10) - 1;
    
    if (currentMonthIndex !== randomMonthIndex) {
        currentMonthIndex = randomMonthIndex;
        updateCalendarView();
    }
    setTimeout(() => handleDayClick(randomDia), 50);
    window.scrollTo(0, 0);
}

function handleAddMemoryClick() {
    // Abre el modal de edición en modo "Añadir"
    // Elige el día de hoy por defecto
    const today = new Date();
    const todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    currentlyOpenDay = allDaysData.find(d => d.id === todayId) || allDaysData[0]; // Fallback
    
    editingMemoryId = null;
    currentMemories = [];
    
    ui.openEditModal(currentlyOpenDay, allDaysData,
        handleSaveDayName,
        handleSaveMemorySubmit,
        handleSearchMusic,
        handleSearchPlace
    );
}

function handleEditDayClick(day) {
    ui.closePreviewModal();
    
    currentlyOpenDay = day;
    editingMemoryId = null;
    currentMemories = []; // Resetea caché

    // Abre el modal de edición
    setTimeout(() => {
        ui.openEditModal(day, allDaysData,
            handleSaveDayName,       // Callback para guardar nombre
            handleSaveMemorySubmit,  // Callback para guardar memoria
            handleSearchMusic,       // Callback para buscar música
            handleSearchPlace        // Callback para buscar lugar
        );
        // Carga las memorias *después* de abrir el modal
        loadAndDrawMemories(day.id, 'edit-memorias-list');
    }, 250); // Delay para que cierre el preview
}


// --- 4. Controladores de Carga de Memorias ---

/**
 * Lógica de negocio para cargar y dibujar memorias en una lista.
 * @param {string} diaId - El ID del día (ej. "10-26").
 * @param {string} listId - El ID del div donde dibujar.
 */
async function loadAndDrawMemories(diaId, listId) {
    try {
        const memories = await getMemoriesForDay(diaId);
        
        // Si es la lista de edición, guarda las memorias en caché
        if (listId === 'edit-memorias-list') {
            currentMemories = memories;
        }
        
        // Llama a la UI para dibujar
        ui.drawMemoriesList(listId, memories,
            (memoria) => handleEditMemoryClick(memoria), // Callback de Editar
            (memoria, displayInfo) => handleDeleteMemoryClick(memoria, displayInfo) // Callback de Borrar
        );
        console.log(`Loaded ${memories.length} memories for ${diaId} into ${listId}`);
    
    } catch (e) {
        console.error(`Error loading memories ${diaId}:`, e);
        ui.showMemoryListError(listId);
    }
}

// --- 5. Controladores del Modal de Edición (Formularios y API) ---

async function handleSaveDayName(newName) {
    if (!currentlyOpenDay) return;
    const diaId = currentlyOpenDay.id;
    
    try {
        const nombreGuardado = await updateDayName(diaId, newName);
        
        // Actualiza estado local
        const dayInState = allDaysData.find(d => d.id === diaId);
        if (dayInState) dayInState.Nombre_Especial = nombreGuardado;
        if (currentlyOpenDay) currentlyOpenDay.Nombre_Especial = nombreGuardado;
        
        ui.showSaveDayNameStatus("Name Saved!");
        updateCalendarView(); // Redibuja el grid
        
    } catch (e) {
        ui.showSaveDayNameStatus(`Error: ${e.message}`, true);
        console.error(e);
    }
}

async function handleSearchMusic(term) {
    if (!term) {
        ui.showMusicSearchError("Enter a term.");
        return;
    }
    ui.showMusicSearchLoading();
    try {
        const data = await searchiTunes(term);
        if (!data.results || data.resultCount === 0) {
            ui.showMusicSearchError("No results.");
            return;
        }
        // Pasa los datos a la UI para que los dibuje
        ui.drawMusicSearchResults(data.results, (track) => {
            // Callback cuando se selecciona un track
            selectedMusicTrack = track;
            console.log("Selected Music:", track);
        });
    } catch (e) {
        ui.showMusicSearchError(`Error: ${e.message}`);
    }
}

async function handleSearchPlace(term) {
    if (!term) {
        ui.showPlaceSearchError("Enter a place.");
        return;
    }
    ui.showPlaceSearchLoading();
    try {
        const data = await searchNominatim(term);
        if (!data || data.length === 0) {
            ui.showPlaceSearchError("No results.");
            return;
        }
        // Pasa los datos a la UI para que los dibuje
        ui.drawPlaceSearchResults(data, (place) => {
            // Callback cuando se selecciona un lugar
            selectedPlace = place;
            console.log("Selected Place:", place);
        });
    } catch (e) {
        ui.showPlaceSearchError(`Error: ${e.message}`);
    }
}

// --- 6. Controladores de CRUD de Memorias (Formulario) ---

/**
 * Se llama cuando el usuario hace clic en el botón 'Editar' de una memoria.
 * @param {object} memoria - El objeto de memoria a editar.
 */
function handleEditMemoryClick(memoria) {
    console.log("Editing memory:", memoria.id);
    editingMemoryId = memoria.id;
    
    // Resetea selecciones de API
    selectedMusicTrack = memoria.CancionData || null;
    selectedPlace = memoria.LugarData ? { name: memoria.LugarNombre, ...memoria.LugarData } : null;
    
    // Llama a la UI para rellenar el formulario
    ui.fillEditForm(memoria);
}

/**
 * Se llama cuando el usuario hace clic en el botón 'Borrar' de una memoria.
 * @param {object} memoria - El objeto de memoria a borrar.
 * @param {string} displayInfo - Texto para mostrar en la confirmación.
 */
function handleDeleteMemoryClick(memoria, displayInfo) {
    console.log("Deleting memory:", memoria.id);
    ui.showDeleteConfirmation(displayInfo, async () => {
        // Callback de confirmación
        if (!currentlyOpenDay) return;
        const diaId = currentlyOpenDay.id;
        
        try {
            await deleteMemory(diaId, memoria.id);
            ui.showSaveMemoryStatus("Deleted!");
            // Recarga la lista de memorias
            await loadAndDrawMemories(diaId, 'edit-memorias-list');
            // También recarga la preview si está abierta
            loadAndDrawMemories(diaId, 'preview-memorias-list');
        } catch (e) {
            ui.showSaveMemoryStatus(`Error: ${e.message}`, true);
            console.error(e);
        }
    });
}

/**
 * Se llama cuando el usuario envía el formulario de 'Añadir/Editar Memoria'.
 */
async function handleSaveMemorySubmit() {
    // 1. Obtener datos de la UI
    const selection = ui.getDaySelectionData(); // Para modo 'Añadir'
    const { memoryData, imageFile, isValid } = ui.getMemoryFormData();
    
    let diaId;
    if (selection) {
        diaId = selection.diaId;
    } else if (currentlyOpenDay) {
        diaId = currentlyOpenDay.id;
    } else {
        ui.showSaveMemoryStatus("Error: No day selected.", true);
        return;
    }

    if (!isValid) {
        ui.showSaveMemoryStatus("Fill required fields.", true);
        return;
    }

    // 2. Lógica de negocio para validar
    if (memoryData.Tipo === 'Imagen' && !imageFile && !editingMemoryId) {
        ui.showSaveMemoryStatus("New image memory requires a file.", true);
        return; // Requiere imagen si es nueva
    }
    
    // (Lógica de subida de imagen iría aquí)
    if (imageFile) {
        alert("Image upload not implemented yet.");
        ui.showSaveMemoryStatus("Upload not implemented.", true);
        return;
    }
    
    // 3. Preparar objeto de datos final
    try {
        const dateParts = memoryData.Fecha_Original.split('-');
        const dateOfMemory = new Date(Date.UTC(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])));
        memoryData.Fecha_Original = Timestamp.fromDate(dateOfMemory);

        // Añadir datos de API si existen
        if (memoryData.Tipo === 'Lugar' && selectedPlace) {
            memoryData.LugarNombre = selectedPlace.name;
            memoryData.LugarData = { lat: selectedPlace.lat, lon: selectedPlace.lon, osm_id: selectedPlace.osm_id, osm_type: selectedPlace.osm_type };
        }
        if (memoryData.Tipo === 'Musica' && selectedMusicTrack) {
            memoryData.CancionData = { trackId: selectedMusicTrack.trackId, artistName: selectedMusicTrack.artistName, trackName: selectedMusicTrack.trackName, artworkUrl60: selectedMusicTrack.artworkUrl60, trackViewUrl: selectedMusicTrack.trackViewUrl };
            memoryData.CancionInfo = `${selectedMusicTrack.trackName} - ${selectedMusicTrack.artistName}`;
        }
        
        // Mantener URL de imagen si no se cambia
        if (memoryData.Tipo === 'Imagen' && !imageFile && editingMemoryId) {
            const existingMem = currentMemories.find(m => m.id === editingMemoryId);
            if (existingMem?.ImagenURL) {
                memoryData.ImagenURL = existingMem.ImagenURL;
            }
        }

        // 4. Guardar en el Store
        await saveMemory(diaId, memoryData, editingMemoryId);
        
        // 5. Actualizar UI
        ui.showSaveMemoryStatus(editingMemoryId ? 'Updated!' : 'Saved!');
        ui.resetMemoryForm();
        editingMemoryId = null;
        selectedMusicTrack = null;
        selectedPlace = null;
        
        // Recargar listas
        await loadAndDrawMemories(diaId, 'edit-memorias-list');
        await loadAndDrawMemories(diaId, 'preview-memorias-list');

    } catch (e) {
        ui.showSaveMemoryStatus(`Error: ${e.message}`, true);
        console.error("Save/Update Error:", e);
    }
}

// --- Arrancar la Aplicación ---
checkAndRunApp();

