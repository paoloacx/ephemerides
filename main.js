/*
 * main.js (v4.4 - Removed Loader Calls)
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
    // ... (state remains the same)
    allDaysData: [],
    currentMonthIndex: new Date().getMonth(),
    currentUser: null,
    todayId: '',
    store: {
        currentType: null,
        isLoading: false,
        lastVisible: null,
    }
};

// --- 1. App Initialization ---

/**
 * Main function to start the application.
 */
async function checkAndRunApp() {
    console.log("Starting Ephemerides v4.4 (Modular, No Loader)...");
    
    try {
        // REMOVED: ui.setLoading("Verifying database...", true);
        initFirebase();
        initAuthListener(handleAuthStateChange);
        
        // Pass console.log as a dummy progress reporter now
        await storeCheckAndRun(console.log); 
        
        // REMOVED: ui.setLoading("Checking data migration...", true);
        await migrateDayNamesToEnglish(console.log); 

        // REMOVED: ui.setLoading("Loading calendar...", true);
        state.allDaysData = await loadAllDaysData();

        if (state.allDaysData.length === 0) {
            throw new Error("Database is empty after verification.");
        }
        
        const today = new Date();
        state.todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        
        ui.init(getUICallbacks());
        
        drawCurrentMonth();
        loadTodaySpotlight();
        
        // REMOVED: ui.setLoading(null, false); 
        
        console.log("App initialized successfully."); // Log success
        
    } catch (err) {
        console.error("Critical error during startup:", err);
        // Display error in the main content area if loader is gone
        const appContent = document.getElementById('app-content');
        if (appContent) {
            appContent.innerHTML = `<p style="color: red; padding: 20px;">Critical error: ${err.message}. Please reload.</p>`;
        }
    }
}

/**
 * Loads the "Spotlight" data for today.
 */
async function loadTodaySpotlight() {
    // ... (function logic remains the same)
    const today = new Date();
    const dateString = `Today, ${today.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}`; 
    
    const spotlightData = await getTodaySpotlight(state.todayId);
    
    if (spotlightData) {
        const fullDateString = `${dateString} ${spotlightData.dayName !== 'Unnamed Day' ? `(${spotlightData.dayName})` : ''}`; 
        ui.updateSpotlight(fullDateString, spotlightData.memories);
    }
}

/**
 * Draws the current month's calendar grid.
 */
function drawCurrentMonth() {
    // ... (function logic remains the same)
    const monthName = new Date(2024, state.currentMonthIndex, 1).toLocaleDateString('en-US', { month: 'long' }); 
    const monthNumber = state.currentMonthIndex + 1;
    
    const diasDelMes = state.allDaysData.filter(dia => 
        parseInt(dia.id.substring(0, 2), 10) === monthNumber
    );
    
    ui.drawCalendar(monthName, diasDelMes, state.todayId);
}


// --- 2. Callbacks and Event Handlers ---

/**
 * Returns an object of all callback functions for ui.js
 * @returns {Object}
 */
function getUICallbacks() {
    // ... (function logic remains the same)
    return {
        onMonthChange: handleMonthChange,
        onDayClick: handleDayClick,
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

/**
 * Called when authentication state changes.
 * @param {Object} user - Firebase user object or null.
 */
function handleAuthStateChange(user) {
    // ... (function logic remains the same)
    state.currentUser = user;
    ui.updateLoginUI(user);
    console.log("Authentication state changed:", user ? user.uid : "Logged out"); 
}

/**
 * Handles month navigation clicks.
 * @param {string} direction - 'prev' or 'next'.
 */
function handleMonthChange(direction) {
    // ... (function logic remains the same)
    if (direction === 'prev') {
        state.currentMonthIndex = (state.currentMonthIndex - 1 + 12) % 12;
    } else {
        state.currentMonthIndex = (state.currentMonthIndex + 1) % 12;
    }
    drawCurrentMonth();
}

/**
 * Handles clicks on a calendar day.
 * @param {Object} dia - The clicked day object.
 */
async function handleDayClick(dia) {
    // ... (function logic remains the same)
    const memories = await loadMemoriesForDay(dia.id);
    
    if (state.currentUser) {
        ui.openEditModal(dia, memories, state.allDaysData);
    } else {
        ui.openPreviewModal(dia, memories);
    }
}

/**
 * Handles footer button clicks (Add, Store, Shuffle).
 * @param {string} action - 'add', 'store', 'shuffle'.
 */
function handleFooterAction(action) {
    // ... (function logic remains the same)
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
        default:
            console.warn("Unknown footer action:", action); 
    }
}

/**
 * Navigates to a random day.
 */
function handleShuffleClick() {
    // ... (function logic remains the same)
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
 * Handles the submission from the search modal.
 * @param {string} term - Search term.
 */
async function handleSearchSubmit(term) {
    // ... (function logic remains the same)
    console.log("Searching for term:", term); 
    
    const results = await searchMemories(term.toLowerCase());
    
    ui.closeSearchModal();
    
    if (results.length === 0) {
        ui.updateSpotlight(`No results found for "${term}"`, []); 
    } else {
        ui.updateSpotlight(`Results for "${term}" (${results.length})`, results); 
    }
}


// --- 3. Modal Logic (Controller) ---
// ... (All modal controller functions remain the same) ...
// handleSaveDayName, handleSaveMemorySubmit, handleDeleteMemory
async function handleSaveDayName(diaId, newName) {
    try {
        await saveDayName(diaId, newName || "Unnamed Day"); 
        
        const dayIndex = state.allDaysData.findIndex(d => d.id === diaId);
        if (dayIndex !== -1) {
            state.allDaysData[dayIndex].Nombre_Especial = newName || "Unnamed Day"; 
        }
        
        ui.showModalStatus('save-status', 'Name saved', false); 
        drawCurrentMonth(); 
        
    } catch (err) {
        console.error("Error saving name:", err);
        ui.showModalStatus('save-status', `Error: ${err.message}`, true); 
    }
}

async function handleSaveMemorySubmit(diaId, memoryData, isEditing) {
    
    try {
        // 1. Convert date string to Date object
        try {
            const dateParts = memoryData.Fecha_Original.split('-'); // YYYY-MM-DD
            const utcDate = new Date(Date.UTC(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])));
            if (isNaN(utcDate.getTime())) throw new Error('Invalid date'); 
            memoryData.Fecha_Original = utcDate; 
        } catch (e) {
            throw new Error('Invalid original date format.'); 
        }
        
        // 2. Image upload logic (TODO)
        if (memoryData.Tipo === 'Imagen' && memoryData.file) {
            console.warn("Image upload not yet implemented."); 
            delete memoryData.file;
        }

        // 3. Save to Firestore
        const memoryId = isEditing ? memoryData.id : null;
        await saveMemory(diaId, memoryData, memoryId);
        
        // 4. Update UI
        ui.showModalStatus('memoria-status', isEditing ? 'Memory updated' : 'Memory saved', false); 
        ui.resetMemoryForm();
        
        // 5. Reload memory list in modal
        const updatedMemories = await loadMemoriesForDay(diaId);
        const currentDayData = state.allDaysData.find(d => d.id === diaId); // Get current day data
        ui.openEditModal(currentDayData, updatedMemories, state.allDaysData);
        
        // 6. Update grid (for blue dot)
        const dayIndex = state.allDaysData.findIndex(d => d.id === diaId);
        if (dayIndex !== -1 && !state.allDaysData[dayIndex].tieneMemorias) {
            state.allDaysData[dayIndex].tieneMemorias = true;
            drawCurrentMonth();
        }
        
        // 7. Reload spotlight if today was edited
        if (diaId === state.todayId) {
            loadTodaySpotlight();
        }
        
    } catch (err) {
        console.error("Error saving memory:", err);
        ui.showModalStatus('memoria-status', `Error: ${err.message}`, true); 
    }
}

async function handleDeleteMemory(diaId, memId) {
    try {
        await deleteMemory(diaId, memId);
        ui.showModalStatus('memoria-status', 'Memory deleted', false); 
        
        const updatedMemories = await loadMemoriesForDay(diaId);
        const currentDayData = state.allDaysData.find(d => d.id === diaId); // Get current day data
        
        ui.openEditModal(currentDayData, updatedMemories, state.allDaysData);

        if (updatedMemories.length === 0) {
            const dayIndex = state.allDaysData.findIndex(d => d.id === diaId);
            if (dayIndex !== -1) {
                state.allDaysData[dayIndex].tieneMemorias = false;
                drawCurrentMonth();
            }
        }

        if (diaId === state.todayId) {
            loadTodaySpotlight();
        }
        
    } catch (err) {
        console.error("Error deleting memory:", err);
        ui.showModalStatus('memoria-status', `Error: ${err.message}`, true); 
    }
}


// --- 4. External API Logic (Controller) ---
// ... (API controller functions remain the same) ...
// handleMusicSearch, handlePlaceSearch
async function handleMusicSearch(term) {
    try {
        const tracks = await searchiTunes(term);
        ui.showMusicResults(tracks);
    } catch (err) {
        console.error("Error searching iTunes:", err);
        ui.showModalStatus('memoria-status', 'Error searching music', true); 
    }
}

async function handlePlaceSearch(term) {
    try {
        const places = await searchNominatim(term);
        ui.showPlaceResults(places);
    } catch (err) {
        console.error("Error searching Nominatim:", err);
        ui.showModalStatus('memoria-status', 'Error searching places', true); 
    }
}


// --- 5. "Store" Modal Logic (Controller) ---
// ... ("Store" controller functions remain the same) ...
// handleStoreCategoryClick, handleStoreLoadMore, handleStoreItemClick
async function handleStoreCategoryClick(type) {
    console.log("Loading Store for:", type); 
    
    state.store.currentType = type;
    state.store.lastVisible = null;
    state.store.isLoading = true;
    
    const title = `Store: ${type}`; 
    ui.openStoreListModal(title);
    
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
        ui.updateStoreList([], false, false);
        if (err.code === 'failed-precondition') {
            console.error("FIREBASE INDEX REQUIRED!", err.message);
            alert("Firebase Error: An index is required. Check the console (F12) for the creation link."); 
        }
    }
}

async function handleStoreLoadMore() {
    const { currentType, lastVisible, isLoading } = state.store;
    if (isLoading || !currentType || !lastVisible) return;
    
    console.log("Loading more...", currentType); 
    state.store.isLoading = true;
    
    try {
        let result;
        if (currentType === 'Names') {
            result = await getNamedDays(10, lastVisible);
        } else {
            result = await getMemoriesByType(currentType, 10, lastVisible);
        }
        
        state.store.lastVisible = result.lastVisible;
        state.store.isLoading = false;
        
        ui.updateStoreList(result.items, true, result.hasMore);
        
    } catch (err) {
        console.error(`Error loading more ${currentType}:`, err);
        state.store.isLoading = false;
    }
}

function handleStoreItemClick(diaId) {
    const dia = state.allDaysData.find(d => d.id === diaId);
    if (!dia) {
        console.error("Day not found:", diaId); 
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


// --- 6. Initial Execution ---
checkAndRunApp();

