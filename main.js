/*
 * main.js (v4.6 - Connects UI v7.1 changes)
 * - Adds isUserLoggedIn and onEditFromPreview callbacks
 * - Simplifies day click logic (UI decides modal)
 * - Exposes helper functions needed by UI
 */

// --- Module Imports ---
import { initFirebase, db, auth } from './firebase.js'; 
import { initAuthListener, handleLogin, handleLogout } from './auth.js';
import { 
    checkAndRunApp as storeCheckAndRun,
    migrateDayNamesToEnglish,
    loadAllDaysData,
    loadMemoriesForDay, // Keep this import
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
    }
};

// --- 1. App Initialization ---

async function checkAndRunApp() {
    console.log("Starting Ephemerides v4.6 (Modular)...");
    
    try {
        initFirebase();
        initAuthListener(handleAuthStateChange);
        
        await storeCheckAndRun(console.log); 
        await migrateDayNamesToEnglish(console.log); 

        state.allDaysData = await loadAllDaysData();

        if (state.allDaysData.length === 0) {
            throw new Error("Database is empty after verification.");
        }
        
        const today = new Date();
        state.todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        
        // --- CHANGED: init MUST be called before drawing ---
        ui.init(getUICallbacks()); 
        
        // --- CHANGED: Draw functions called AFTER ui.init ---
        drawCurrentMonth();
        loadTodaySpotlight();
        
        console.log("App initialized successfully.");
        
    } catch (err) {
        console.error("Critical error during startup:", err);
        const appContent = document.getElementById('app-content');
        if (appContent) {
            appContent.innerHTML = `<p style="color: red; padding: 20px;">Critical error: ${err.message}. Please reload.</p>`;
        }
    }
}

async function loadTodaySpotlight() {
    const today = new Date();
    const dateString = `Today, ${today.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}`; 
    
    const spotlightData = await getTodaySpotlight(state.todayId);
    
    if (spotlightData) {
        const fullDateString = `${dateString} ${spotlightData.dayName !== 'Unnamed Day' ? `(${spotlightData.dayName})` : ''}`; 
        ui.updateSpotlight(fullDateString, spotlightData.memories);
    }
}

function drawCurrentMonth() {
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
    return {
        // --- NEW Callbacks needed by ui.js ---
        isUserLoggedIn: () => !!state.currentUser, 
        loadMemoriesForDay: loadMemoriesForDay, 
        getAllDaysData: () => state.allDaysData, 
        getTodayId: () => state.todayId, // Added callback for today's ID
        onEditFromPreview: handleEditFromPreview, 
        // --- End New ---

        // Nav & Footer
        onMonthChange: handleMonthChange,
        // REMOVED: onDayClick - ui.js handles this internally now
        onFooterAction: handleFooterAction,
        
        // Auth
        onLogin: handleLogin,
        onLogout: handleLogout,
        
        // Edit Modal Actions
        onSaveDayName: handleSaveDayName,
        onSaveMemory: handleSaveMemorySubmit,
        onDeleteMemory: handleDeleteMemory,
        
        // API Actions
        onSearchMusic: handleMusicSearch,
        onSearchPlace: handlePlaceSearch,
        
        // Store Modal Actions
        onStoreCategoryClick: handleStoreCategoryClick,
        onStoreLoadMore: handleStoreLoadMore,
        onStoreItemClick: handleStoreItemClick,

        // Search Modal Action
        onSearchSubmit: handleSearchSubmit, 
    };
}

function handleAuthStateChange(user) {
    const wasLoggedIn = !!state.currentUser;
    state.currentUser = user;
    ui.updateLoginUI(user); 
    console.log("Authentication state changed:", user ? user.uid : "Logged out"); 

    // If user logs out while preview modal is open, update its edit button
    if (!user && wasLoggedIn) {
        // We might need a direct function in ui.js to update the preview modal if it's open
        // For now, assume modal closes or user navigates away.
    }
    // If user logs in, clicking a day will now open Edit directly (handled by ui.js)
}

function handleMonthChange(direction) {
    if (direction === 'prev') {
        state.currentMonthIndex = (state.currentMonthIndex - 1 + 12) % 12;
    } else {
        state.currentMonthIndex = (state.currentMonthIndex + 1) % 12;
    }
    drawCurrentMonth();
}

/**
 * Handles the callback when the Edit button is clicked in the Preview modal.
 * @param {Object} dia - The day data from the preview modal.
 * @param {Array} memories - The memories already loaded for that day.
 */
function handleEditFromPreview(dia, memories) {
    console.log("Switching from Preview to Edit for day:", dia.id);
    ui.openEditModal(dia, memories, state.allDaysData);
}


function handleFooterAction(action) {
    switch (action) {
        case 'add':
            // Ensure we have day data before opening add modal
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
        // 'settings' action is handled directly in ui.js
        default:
            console.warn("Unknown footer action passed to main.js:", action); 
    }
}

function handleShuffleClick() {
    if (state.allDaysData.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * state.allDaysData.length);
    const randomDia = state.allDaysData[randomIndex];
    const randomMonthIndex = parseInt(randomDia.id.substring(0, 2), 10 - 1);
    
    if (state.currentMonthIndex !== randomMonthIndex) {
        state.currentMonthIndex = randomMonthIndex;
        drawCurrentMonth();
    }
    
    setTimeout(() => {
        // Simulate click using ui.js's internal handler
        const dayButton = document.querySelector(`.dia-btn[data-dia-id="${randomDia.id}"]`);
        if(dayButton) dayButton.click(); 
        else console.error("Could not find button for shuffled day:", randomDia.id);
    }, 100);
    
    window.scrollTo(0, 0);
}

async function handleSearchSubmit(term) {
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
        // 1. Convert date string (YYYY-MM-DD) to Date object
        try {
            const dateParts = memoryData.Fecha_Original.split('-'); 
            const utcDate = new Date(Date.UTC(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])));
            if (isNaN(utcDate.getTime())) throw new Error('Invalid date constructed'); 
            memoryData.Fecha_Original = utcDate; 
        } catch (e) {
            throw new Error('Invalid original date format constructed.'); 
        }
        
        // 2. Image upload logic (TODO)
        if (memoryData.Tipo === 'Image' && memoryData.file) {
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
        const currentDayData = state.allDaysData.find(d => d.id === diaId); 
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
        const currentDayData = state.allDaysData.find(d => d.id === diaId); 
        
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
        alert(`Error loading more items: ${err.message}`);
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
    
    const monthIndex = parseInt(dia.id.substring(0, 2), 10 - 1);
    if (state.currentMonthIndex !== monthIndex) {
        state.currentMonthIndex = monthIndex;
        drawCurrentMonth();
    }
    
    setTimeout(() => {
        // Simulate click using ui.js's internal handler
        const dayButton = document.querySelector(`.dia-btn[data-dia-id="${dia.id}"]`);
        if(dayButton) dayButton.click(); 
        else console.error("Could not find button for store item day:", dia.id);
    }, 100);
    
    window.scrollTo(0, 0);
}


// --- 6. Initial Execution ---
checkAndRunApp();

