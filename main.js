/*
 * main.js (v4.8 - Definite Fix for Init Order & Footer)
 * Main app controller.
 */

// --- Module Imports ---
import { initFirebase, db, auth } from './firebase.js';
import { initAuthListener, handleLogin, handleLogout } from './auth.js';
import {
    checkAndRunApp as storeCheckAndRun,
    migrateDayNamesToEnglish,
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

// --- Global App State ---
let state = {
    allDaysData: [],
    currentMonthIndex: new Date().getMonth(),
    currentUser: null,
    todayId: '',
    store: {
        currentType: null,
        isLoading: false,
        lastVisible: null,
    },
    // NEW: Flag to track if UI is initialized
    uiInitialized: false
};

// --- 1. App Initialization ---

/**
 * Main function to start the application. Loads data first, then initializes UI.
 */
async function checkAndRunApp() {
    console.log("Starting Ephemerides v4.8 (Modular)...");

    try {
        initFirebase(); // Initialize Firebase services
        initAuthListener(handleAuthStateChange); // Set up auth listener immediately

        // Run checks and migrations first, report progress via console
        await storeCheckAndRun(console.log);
        await migrateDayNamesToEnglish(console.log);

        // Load essential calendar data
        console.log("main: Loading all days data...");
        state.allDaysData = await loadAllDaysData();
        console.log(`main: Loaded ${state.allDaysData.length} days.`);

        if (state.allDaysData.length === 0) {
            throw new Error("Database is empty after verification.");
        }

        // Calculate today's ID
        const today = new Date();
        state.todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

        // --- CHANGED: Initialize UI only AFTER data is loaded ---
        initializeAppUI();

    } catch (err) {
        console.error("Critical error during startup:", err);
        // Display error directly in body if UI might not be ready
        document.body.innerHTML = `<p style="color: red; padding: 20px;">Critical error: ${err.message}. Please reload.</p>`;
    }
}

/**
 * NEW: Initializes the UI module and performs the initial draw.
 */
function initializeAppUI() {
    if (state.uiInitialized) {
        console.warn("main: Attempted to initialize UI twice.");
        return;
    }
    console.log("main: Initializing UI...");
    try {
        ui.init(getUICallbacks()); // Pass all necessary callbacks to UI
        state.uiInitialized = true;
        console.log("main: UI Initialized. Performing initial draw...");

        // --- Draw initial state AFTER UI is initialized ---
        drawCurrentMonth();
        loadTodaySpotlight();
        // --- End Initial Draw ---

        console.log("App initialized successfully.");

    } catch (uiError) {
         console.error("Critical error during UI initialization:", uiError);
         document.body.innerHTML = `<p style="color: red; padding: 20px;">Critical UI error: ${uiError.message}. Please reload.</p>`;
    }
}


async function loadTodaySpotlight() {
    // Ensure UI is ready before trying to update it
    if (!state.uiInitialized) {
         console.warn("main: UI not ready, skipping spotlight load.");
         return;
    }
    const today = new Date();
    const dateString = `Today, ${today.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}`;

    const spotlightData = await getTodaySpotlight(state.todayId);

    if (spotlightData) {
        spotlightData.memories.forEach(mem => {
             if (!mem.Nombre_Dia) {
                 const dayData = state.allDaysData.find(d => d.id === state.todayId);
                 mem.Nombre_Dia = dayData ? dayData.Nombre_Dia : state.todayId;
             }
        });

        const fullDateString = `${dateString} ${spotlightData.dayName && spotlightData.dayName !== 'Unnamed Day' ? `(${spotlightData.dayName})` : ''}`;
        ui.updateSpotlight(fullDateString, spotlightData.memories);
    }
}


function drawCurrentMonth() {
     if (!state.uiInitialized) {
         console.warn("main: UI not ready, skipping month draw.");
         return;
     }
     if (state.allDaysData.length === 0) {
         console.warn("main: Attempted to draw month before allDaysData was loaded.");
         return;
     }

    const monthName = new Date(2024, state.currentMonthIndex, 1).toLocaleDateString('en-US', { month: 'long' });
    const monthNumber = state.currentMonthIndex + 1;

    const diasDelMes = state.allDaysData.filter(dia =>
        parseInt(dia.id.substring(0, 2), 10) === monthNumber
    );

    if (!state.todayId) {
        const today = new Date();
        state.todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    }

    ui.drawCalendar(monthName, diasDelMes, state.todayId);
}


// --- 2. Callbacks and Event Handlers ---

function getUICallbacks() {
    return {
        isUserLoggedIn: () => !!state.currentUser,
        loadMemoriesForDay: loadMemoriesForDay,
        getAllDaysData: () => state.allDaysData,
        getTodayId: () => state.todayId,
        onEditFromPreview: handleEditFromPreview,
        onMonthChange: handleMonthChange,
        onFooterAction: handleFooterAction,
        onLogin: handleLogin,
        onLogout: handleLogout,
        onSaveDayName: handleSaveDayName,
        onSaveMemory: handleSaveMemorySubmit,
        onDeleteMemory: handleDeleteMemory,
        onSearchMusic: handleMusicSearch,
        onSearchPlace: handlePlaceSearch,
        onStoreCategoryClick: handleStoreCategoryClick,
        onStoreLoadMore: handleStoreLoadMore,
        onStoreItemClick: handleStoreItemClick,
        onSearchSubmit: handleSearchSubmit,
    };
}

function handleAuthStateChange(user) {
    const wasLoggedIn = !!state.currentUser;
    state.currentUser = user;
    // Ensure UI is initialized before updating login status
    if (state.uiInitialized) {
        ui.updateLoginUI(user);
    }
    console.log("Authentication state changed:", user ? user.uid : "Logged out");
}

function handleMonthChange(direction) {
    if (direction === 'prev') {
        state.currentMonthIndex = (state.currentMonthIndex - 1 + 12) % 12;
    } else {
        state.currentMonthIndex = (state.currentMonthIndex + 1) % 12;
    }
    drawCurrentMonth();
}

function handleEditFromPreview(dia, memories) {
    console.log("Switching from Preview to Edit for day:", dia.id);
    ui.openEditModal(dia, memories, state.allDaysData);
}


function handleFooterAction(action) {
     console.log(`main: Footer action received: ${action}`); // Add log
    switch (action) {
        case 'add':
            if(state.allDaysData.length > 0) {
                 ui.openEditModal(null, [], state.allDaysData);
            } else {
                alert("Calendar data not loaded yet. Cannot add memory.");
            }
            break;
        case 'store':
            ui.openStoreModal();
            break;
        case 'shuffle':
            handleShuffleClick();
            break;
        default:
            console.warn("Unknown footer action passed to main.js:", action);
    }
}

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
        // Find button and simulate click - UI handles the rest
        const dayButton = document.querySelector(`.dia-btn[data-dia-id="${randomDia.id}"]`);
        if(dayButton) {
             console.log("Simulating click on shuffled day:", randomDia.id);
             dayButton.click();
        } else {
             console.error("Could not find button for shuffled day:", randomDia.id);
        }
    }, 150);

    window.scrollTo(0, 0);
}


async function handleSearchSubmit(term) {
    console.log("Searching for term:", term);

    const results = await searchMemories(term.toLowerCase());

    ui.closeSearchModal();

    if (results.length === 0) {
        ui.updateSpotlight(`No results found for "${term}"`, []);
    } else {
        results.forEach(mem => {
             if (!mem.Nombre_Dia) {
                 const dayData = state.allDaysData.find(d => d.id === mem.diaId);
                 mem.Nombre_Dia = dayData ? dayData.Nombre_Dia : mem.diaId;
             }
        });
        ui.updateSpotlight(`Results for "${term}" (${results.length})`, results);
    }
}


// --- 3. Modal Logic (Controller) ---

async function handleSaveDayName(diaId, newName) {
    try {
        await saveDayName(diaId, newName || "Unnamed Day");

        const dayIndex = state.allDaysData.findIndex(d => d.id === diaId);
        if (dayIndex !== -1) {
            state.allDaysData[dayIndex].Nombre_Especial = newName || "Unnamed Day";
        }

        ui.showModalStatus('save-status', 'Name saved', false);
        drawCurrentMonth();

        if (diaId === state.todayId) {
            loadTodaySpotlight();
        }

    } catch (err) {
        console.error("Error saving name:", err);
        ui.showModalStatus('save-status', `Error: ${err.message}`, true);
    }
}

async function handleSaveMemorySubmit(diaId, memoryData, isEditing) {

    try {
        // Convert date string (YYYY-MM-DD) to Date object
        try {
            const dateParts = memoryData.Fecha_Original.split('-');
            const utcDate = new Date(Date.UTC(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])));
            if (isNaN(utcDate.getTime())) throw new Error('Invalid date constructed');
            memoryData.Fecha_Original = utcDate;
        } catch (e) {
            throw new Error('Invalid original date format constructed.');
        }

        // Image upload logic (TODO)
        if (memoryData.Tipo === 'Image' && memoryData.file) {
            console.warn("Image upload not yet implemented.");
            delete memoryData.file;
        }

        // Save to Firestore
        const memoryId = isEditing ? memoryData.id : null;
        await saveMemory(diaId, memoryData, memoryId);

        // Update UI status
        ui.showModalStatus('memoria-status', isEditing ? 'Memory updated' : 'Memory saved', false);
        
        // Reload memory list by re-opening the edit modal
        // This ensures the list is fresh and form is reset cleanly
        const updatedMemories = await loadMemoriesForDay(diaId);
        const currentDayData = state.allDaysData.find(d => d.id === diaId);
        ui.openEditModal(currentDayData, updatedMemories, state.allDaysData);

        // Update grid (for blue dot) if status changed
        const dayIndex = state.allDaysData.findIndex(d => d.id === diaId);
        if (dayIndex !== -1 && !state.allDaysData[dayIndex].tieneMemorias) {
            state.allDaysData[dayIndex].tieneMemorias = true;
            drawCurrentMonth();
        }

        // Reload spotlight if today was edited
        if (diaId === state.todayId) {
            loadTodaySpotlight();
        }

    } catch (err) {
        console.error("Error saving memory:", err);
        ui.showModalStatus('memoria-status', `Error: ${err.message}`, true);
        // Re-enable button on error
        const saveBtn = document.getElementById('save-memoria-btn');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = isEditing ? 'Update Memory' : 'Add Memory';
        }
    }
}


async function handleDeleteMemory(diaId, memId) {
    try {
        await deleteMemory(diaId, memId);
        ui.showModalStatus('memoria-status', 'Memory deleted', false);

        const updatedMemories = await loadMemoriesForDay(diaId);
        const currentDayData = state.allDaysData.find(d => d.id === diaId);

        // Re-open modal to refresh list
        ui.openEditModal(currentDayData, updatedMemories, state.allDaysData);

        // Check if it was the last memory for the day and update grid if status changed
        if (updatedMemories.length === 0) {
            const dayIndex = state.allDaysData.findIndex(d => d.id === diaId);
            if (dayIndex !== -1 && state.allDaysData[dayIndex].tieneMemorias) {
                state.allDaysData[dayIndex].tieneMemorias = false;
                drawCurrentMonth();
            }
        }

        // Reload spotlight if today was edited
        if (diaId === state.todayId) {
            loadTodaySpotlight();
        }

    } catch (err) {
        console.error("Error deleting memory:", err);
        ui.showModalStatus('memoria-status', `Error: ${err.message}`, true);
    }
}


// --- 4. External API Logic (Controller) ---

async function handleMusicSearch(term) {
    try {
        ui.showModalStatus('memoria-status', 'Searching music...', false); // Indicate loading
        const tracks = await searchiTunes(term);
        ui.showMusicResults(tracks);
        ui.showModalStatus('memoria-status', '', false); // Clear status
    } catch (err) {
        console.error("Error searching iTunes:", err);
        ui.showModalStatus('memoria-status', 'Error searching music', true);
        ui.showMusicResults([]);
    }
}

async function handlePlaceSearch(term) {
    try {
        ui.showModalStatus('memoria-status', 'Searching places...', false); // Indicate loading
        const places = await searchNominatim(term);
        ui.showPlaceResults(places);
        ui.showModalStatus('memoria-status', '', false); // Clear status
    } catch (err) {
        console.error("Error searching Nominatim:", err);
        ui.showModalStatus('memoria-status', 'Error searching places', true);
        ui.showPlaceResults([]);
    }
}

// --- 5. "Store" Modal Logic (Controller) ---

async function handleStoreCategoryClick(type) {
    console.log("Loading Store for:", type);

    state.store.currentType = type;
    state.store.lastVisible = null;
    state.store.isLoading = true;

    const title = `Store: ${type}`;
    ui.openStoreListModal(title); // Opens modal with "Loading..."

    try {
        let result;
        if (type === 'Names') {
            result = await getNamedDays(10);
        } else {
            result = await getMemoriesByType(type, 10);
        }

        state.store.lastVisible = result.lastVisible;
        state.store.isLoading = false;

        ui.updateStoreList(result.items, false, result.hasMore);

    } catch (err) {
        console.error(`Error loading category ${type}:`, err);
        state.store.isLoading = false;
        ui.updateStoreList([], false, false); // Show empty list on error
        if (err.code === 'failed-precondition') {
            console.error("FIREBASE INDEX REQUIRED!", err.message);
            alert("Firebase Error: An index is required. Check the console (F12) for the creation link.");
        } else {
            alert(`Error loading store: ${err.message}`);
        }
    }
}


async function handleStoreLoadMore() {
    const { currentType, lastVisible, isLoading } = state.store;
    if (isLoading || !currentType || !lastVisible) return;

    console.log("Loading more...", currentType);
    state.store.isLoading = true;
    ui.updateStoreList([], true, true); // Show loading indicator? Or disable button?

    try {
        let result;
        if (currentType === 'Names') {
            result = await getNamedDays(10, lastVisible);
        } else {
            result = await getMemoriesByType(currentType, 10, lastVisible);
        }

        state.store.lastVisible = result.lastVisible;
        state.store.isLoading = false;

        ui.updateStoreList(result.items, true, result.hasMore); // Append results

    } catch (err) {
        console.error(`Error loading more ${currentType}:`, err);
        state.store.isLoading = false;
        alert(`Error loading more items: ${err.message}`);
        ui.updateStoreList([], true, false); // Hide loading button on error?
    }
}

function handleStoreItemClick(diaId) {
    const dia = state.allDaysData.find(d => d.id === diaId);
    if (!dia) {
        console.error("Day not found in state:", diaId);
        alert("Error: Could not find the selected day's data.");
        return;
    }

    ui.closeStoreListModal();
    ui.closeStoreModal();

    const monthIndex = parseInt(dia.id.substring(0, 2), 10) - 1;

    if (state.currentMonthIndex !== monthIndex) {
        state.currentMonthIndex = monthIndex;
        drawCurrentMonth(); // Draw the new month first
    }

    // Use a slightly longer delay to ensure the DOM is ready
    setTimeout(() => {
        const dayButton = document.querySelector(`.dia-btn[data-dia-id="${dia.id}"]`);
        if(dayButton) {
             console.log("Simulating click on store item day:", dia.id);
             dayButton.click();
        } else {
             console.error("Could not find button for store item day:", dia.id);
        }
    }, 200); // Increased delay

    window.scrollTo(0, 0);
}


// --- 6. Initial Execution ---
checkAndRunApp();

