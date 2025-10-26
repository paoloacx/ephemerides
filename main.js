/*
 * main.js (v4.7 - Fix Calendar Load Order)
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
    }
};

// --- 1. App Initialization ---

async function checkAndRunApp() {
    console.log("Starting Ephemerides v4.7 (Modular)...");
    
    try {
        initFirebase();
        initAuthListener(handleAuthStateChange);
        
        // Run checks and migrations first
        await storeCheckAndRun(console.log); 
        await migrateDayNamesToEnglish(console.log); 

        // Load essential data
        state.allDaysData = await loadAllDaysData();

        if (state.allDaysData.length === 0) {
            throw new Error("Database is empty after verification.");
        }
        
        // Calculate today's ID
        const today = new Date();
        state.todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        
        // --- MOVED ---
        // Initialize UI only AFTER data is loaded and todayId is known
        ui.init(getUICallbacks()); 
        
        // --- MOVED ---
        // Draw initial state AFTER UI is initialized
        drawCurrentMonth();
        loadTodaySpotlight();
        // --- End Moved ---
        
        console.log("App initialized successfully.");
        
    } catch (err) {
        console.error("Critical error during startup:", err);
        // Try to display error in UI if possible
        const appContent = document.getElementById('app-content');
        if (appContent) { // Check if appContent exists before using it
            appContent.innerHTML = `<p style="color: red; padding: 20px;">Critical error: ${err.message}. Please reload.</p>`;
        } else {
             // Fallback if UI hasn't even loaded the basic structure
             document.body.innerHTML = `<p style="color: red; padding: 20px;">Critical error: ${err.message}. Please reload.</p>`;
        }
    }
}

async function loadTodaySpotlight() {
    const today = new Date();
    const dateString = `Today, ${today.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}`; 
    
    // Ensure todayId is set before calling getTodaySpotlight
    if (!state.todayId) {
         console.error("main: todayId not set before loading spotlight.");
         state.todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    }

    const spotlightData = await getTodaySpotlight(state.todayId);
    
    if (spotlightData) {
        // Add Nombre_Dia to spotlight memories for UI context if missing
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
     // Ensure state is ready before drawing
     if (state.allDaysData.length === 0) {
         console.warn("main: Attempted to draw month before allDaysData was loaded.");
         return; 
     }

    const monthName = new Date(2024, state.currentMonthIndex, 1).toLocaleDateString('en-US', { month: 'long' }); 
    const monthNumber = state.currentMonthIndex + 1;
    
    const diasDelMes = state.allDaysData.filter(dia => 
        parseInt(dia.id.substring(0, 2), 10) === monthNumber
    );
    
    // Ensure todayId is available for ui.drawCalendar
    if (!state.todayId) {
        const today = new Date();
        state.todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        console.warn("main: todayId was not set, calculating now for drawCalendar.");
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
        // onDayClick is now handled internally by ui.js calling _handleDayClick
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
    ui.updateLoginUI(user); 
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
    // --- FIX: Correct month index calculation ---
    const randomMonthIndex = parseInt(randomDia.id.substring(0, 2), 10) - 1; 
    
    if (state.currentMonthIndex !== randomMonthIndex) {
        state.currentMonthIndex = randomMonthIndex;
        drawCurrentMonth();
    }
    
    setTimeout(() => {
        // Find the button and trigger its click event, which calls ui.js's _handleDayClick
        const dayButton = document.querySelector(`.dia-btn[data-dia-id="${randomDia.id}"]`);
        if(dayButton) {
             console.log("Simulating click on shuffled day:", randomDia.id);
             dayButton.click(); 
        } else {
             console.error("Could not find button for shuffled day:", randomDia.id);
             // Fallback: Manually call the internal handler (less ideal)
             // ui._handleDayClick(randomDia); // This assumes _handleDayClick is exposed or accessible
        }
    }, 100); // Increased delay slightly
    
    window.scrollTo(0, 0);
}


async function handleSearchSubmit(term) {
    console.log("Searching for term:", term); 
    
    const results = await searchMemories(term.toLowerCase());
    
    ui.closeSearchModal(); 
    
    if (results.length === 0) {
        ui.updateSpotlight(`No results found for "${term}"`, []); 
    } else {
         // Add Nombre_Dia to results for UI context
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
        // Do NOT reset form here, let UI handle it after re-opening modal below

        // 5. Reload memory list by re-opening the edit modal
        const updatedMemories = await loadMemoriesForDay(diaId);
        const currentDayData = state.allDaysData.find(d => d.id === diaId); 
        ui.openEditModal(currentDayData, updatedMemories, state.allDaysData); // This also resets the form via its own logic
        
        // 6. Update grid (for blue dot)
        const dayIndex = state.allDaysData.findIndex(d => d.id === diaId);
        // Only redraw if the status *changed* from false to true
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

        // Check if it was the last memory for the day
        if (updatedMemories.length === 0) {
            const dayIndex = state.allDaysData.findIndex(d => d.id === diaId);
             // Only redraw if the status *changed* from true to false
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
        // Show loading state?
        const tracks = await searchiTunes(term);
        ui.showMusicResults(tracks);
    } catch (err) {
        console.error("Error searching iTunes:", err);
        ui.showModalStatus('memoria-status', 'Error searching music', true); 
        ui.showMusicResults([]); // Clear results on error
    }
}

async function handlePlaceSearch(term) {
    try {
        // Show loading state?
        const places = await searchNominatim(term);
        ui.showPlaceResults(places);
    } catch (err) {
        console.error("Error searching Nominatim:", err);
        ui.showModalStatus('memoria-status', 'Error searching places', true); 
        ui.showPlaceResults([]); // Clear results on error
    }
}

// --- 5. "Store" Modal Logic (Controller) ---

async function handleStoreCategoryClick(type) {
    console.log("Loading Store for:", type); 
    
    state.store.currentType = type;
    state.store.lastVisible = null;
    state.store.isLoading = true;
    
    const title = `Store: ${type}`; 
    ui.openStoreListModal(title); // Opens modal with "Loading..." placeholder
    
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
        state.store.isLoading = false; // Ensure loading is stopped
        ui.updateStoreList([], false, false); // Clear list
        if (err.code === 'failed-precondition') {
            console.error("FIREBASE INDEX REQUIRED!", err.message);
            alert("Firebase Error: An index is required. Check the console (F12) for the creation link."); 
        } else {
            alert(`Error loading store: ${err.message}`);
        }
         // Maybe close the list modal on error? Or show error inside?
         // ui.closeStoreListModal(); 
    }
}


async function handleStoreLoadMore() {
    const { currentType, lastVisible, isLoading } = state.store;
    if (isLoading || !currentType || !lastVisible) return;
    
    console.log("Loading more...", currentType); 
    state.store.isLoading = true;
    // Disable button in UI? ui.setStoreLoading(true);
    
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
        // ui.setStoreLoading(false);
        
    } catch (err) {
        console.error(`Error loading more ${currentType}:`, err);
        state.store.isLoading = false;
        // ui.setStoreLoading(false);
        alert(`Error loading more items: ${err.message}`);
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
    
     // --- FIX: Correct month index calculation ---
    const monthIndex = parseInt(dia.id.substring(0, 2), 10) - 1; 
    
    if (state.currentMonthIndex !== monthIndex) {
        state.currentMonthIndex = monthIndex;
        drawCurrentMonth();
    }
    
    setTimeout(() => {
        // Simulate click using ui.js's internal handler
        const dayButton = document.querySelector(`.dia-btn[data-dia-id="${dia.id}"]`);
        if(dayButton) {
             console.log("Simulating click on store item day:", dia.id);
             dayButton.click(); 
        } else {
             console.error("Could not find button for store item day:", dia.id);
        }
    }, 150); // Slightly longer delay might help rendering
    
    window.scrollTo(0, 0);
}


// --- 6. Initial Execution ---
checkAndRunApp();

