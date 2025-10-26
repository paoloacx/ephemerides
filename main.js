/*
 * main.js (v4.9 - Robust Init & Footer Logging)
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
    uiInitialized: false // Flag to track UI initialization
};

// --- 1. App Initialization ---

/**
 * Main function to start the application. Loads data first, then initializes UI.
 */
async function checkAndRunApp() {
    console.log("Starting Ephemerides v4.9 (Modular)...");

    try {
        initFirebase(); // Initialize Firebase services
        initAuthListener(handleAuthStateChange); // Set up auth listener immediately

        console.log("main: Running store checks and migrations...");
        await storeCheckAndRun(console.log); // Pass console.log for progress
        await migrateDayNamesToEnglish(console.log); // Pass console.log for progress
        console.log("main: Store checks and migrations complete.");

        console.log("main: Loading all days data...");
        state.allDaysData = await loadAllDaysData();
        console.log(`main: Loaded ${state.allDaysData.length} days.`);

        if (state.allDaysData.length === 0) {
            // Throw error only if migration didn't run or failed to create days
            console.error("main: No day data loaded, database might be empty or corrupted.");
            throw new Error("Database is empty or invalid after checks.");
        }

        // Calculate today's ID
        const today = new Date();
        state.todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        console.log(`main: Today's ID set to ${state.todayId}`);

        // --- Initialize UI only AFTER data is loaded ---
        initializeAppUI(); // This function now calls draw/load internally

    } catch (err) {
        console.error("Critical error during initial startup:", err);
        displayFatalError(`Startup error: ${err.message}`);
    }
}

/**
 * Initializes the UI module and performs the initial draw.
 */
function initializeAppUI() {
    // Prevent double initialization
    if (state.uiInitialized) {
        console.warn("main: Attempted to initialize UI twice.");
        return;
    }
    console.log("main: Initializing UI...");
    try {
        // --- ADDED: Specific Try/Catch for ui.init() ---
        console.log("main: Calling ui.init()...");
        ui.init(getUICallbacks()); // Pass all necessary callbacks to UI
        console.log("main: ui.init() completed successfully.");
        // Mark UI as ready ONLY after ui.init() completes successfully
        state.uiInitialized = true;
        console.log("main: UI Initialized flag set to true.");

        // --- Draw initial state AFTER UI is initialized ---
        console.log("main: Performing initial draw (calendar and spotlight)...");
        drawCurrentMonth(); // Draw calendar
        loadTodaySpotlight(); // Load spotlight data
        // --- End Initial Draw ---

        console.log("App initialized and initial draw complete.");

    } catch (uiError) {
         // Catch errors specifically from ui.init()
         console.error("CRITICAL ERROR during UI initialization (ui.init failed):", uiError);
         state.uiInitialized = false; // Ensure flag remains false on error
         displayFatalError(`UI Init error: ${uiError.message}`);
    }
}


/**
 * Loads the "Spotlight" data for today. Safe to call even before UI is fully ready.
 */
async function loadTodaySpotlight() {
    // Check if UI is ready before trying to update it
    if (!state.uiInitialized) {
         console.warn("main: UI not ready, skipping spotlight load.");
         return; // Don't proceed if UI isn't initialized
    }
    console.log("main: Loading spotlight data...");
    const today = new Date();
    // Use 'en-US' locale for date formatting consistent with data
    const dateString = `Today, ${today.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}`;

    // Ensure todayId is available
    if (!state.todayId) {
         console.error("main: todayId not set before loading spotlight. Calculating fallback.");
         state.todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    }

    const spotlightData = await getTodaySpotlight(state.todayId);

    if (spotlightData) {
        // Add Nombre_Dia to spotlight memories for UI context if missing
        spotlightData.memories.forEach(mem => {
             if (!mem.Nombre_Dia) {
                 // Find the corresponding day data from the main state
                 const dayData = state.allDaysData.find(d => d.id === state.todayId);
                 mem.Nombre_Dia = dayData ? dayData.Nombre_Dia : state.todayId; // Use day name or ID as fallback
             }
        });

        const fullDateString = `${dateString} ${spotlightData.dayName && spotlightData.dayName !== 'Unnamed Day' ? `(${spotlightData.dayName})` : ''}`;
        ui.updateSpotlight(fullDateString, spotlightData.memories);
        console.log("main: Spotlight updated in UI.");
    } else {
        console.warn("main: No spotlight data received from store.");
        ui.updateSpotlight(dateString, []); // Show empty spotlight explicitly
    }
}


/**
 * Draws the current month's calendar grid. Safe to call even before UI is fully ready.
 */
function drawCurrentMonth() {
     // Check if UI is ready
     if (!state.uiInitialized) {
         console.warn("main: UI not ready, skipping month draw.");
         return; // Don't proceed if UI isn't initialized
     }
     // Check if data is ready
     if (state.allDaysData.length === 0) {
         console.warn("main: Attempted to draw month but allDaysData is empty.");
         // Optionally, tell UI to show a specific loading/error state for the calendar
         // ui.showCalendarError("Loading data..."); // Example
         return;
     }
     console.log(`main: Drawing month ${state.currentMonthIndex + 1}...`);

    const monthName = new Date(2024, state.currentMonthIndex, 1).toLocaleDateString('en-US', { month: 'long' });
    const monthNumber = state.currentMonthIndex + 1;

    // Filter days for the current month
    const diasDelMes = state.allDaysData.filter(dia =>
        dia && dia.id && parseInt(dia.id.substring(0, 2), 10) === monthNumber // Add safety checks
    );

    // Ensure todayId is available (should be, but double-check)
    if (!state.todayId) {
        const today = new Date();
        state.todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        console.warn("main: todayId was missing, calculated fallback for drawCalendar.");
    }

    // Call UI function to draw
    ui.drawCalendar(monthName, diasDelMes, state.todayId);
    console.log("main: Month draw call completed.");
}


// --- 2. Callbacks and Event Handlers ---

/**
 * Returns an object containing all callback functions needed by the UI module.
 */
function getUICallbacks() {
    // Log that callbacks are being generated
    console.log("main: Generating UI callbacks...");
    return {
        // Core state/data access for UI
        isUserLoggedIn: () => !!state.currentUser,
        loadMemoriesForDay: loadMemoriesForDay, // Pass store function
        getAllDaysData: () => state.allDaysData, // Provide access to all days data
        getTodayId: () => state.todayId, // Provide access to today's ID

        // Actions triggered by UI events
        onEditFromPreview: handleEditFromPreview,
        onMonthChange: handleMonthChange,
        onFooterAction: handleFooterAction, // <-- Crucial for footer buttons
        onLogin: handleLogin, // Pass auth function
        onLogout: handleLogout, // Pass auth function
        onSaveDayName: handleSaveDayName,
        onSaveMemory: handleSaveMemorySubmit,
        onDeleteMemory: handleDeleteMemory,
        onSearchMusic: handleMusicSearch,
        onSearchPlace: handlePlaceSearch,
        onStoreCategoryClick: handleStoreCategoryClick,
        onStoreLoadMore: handleStoreLoadMore,
        onStoreItemClick: handleStoreItemClick,
        onSearchSubmit: handleSearchSubmit, // Handle search form submission
    };
}

/**
 * Callback function executed when the Firebase authentication state changes.
 * @param {object|null} user - The Firebase user object, or null if logged out.
 */
function handleAuthStateChange(user) {
    const wasLoggedIn = !!state.currentUser;
    state.currentUser = user;
    // Update the UI only if it has been successfully initialized
    if (state.uiInitialized) {
        ui.updateLoginUI(user);
    } else {
        console.warn("main: Auth state changed, but UI not ready yet. Login UI update deferred.");
    }
    console.log("Authentication state changed:", user ? user.uid : "Logged out");

    // Potentially trigger UI updates if login status affects visibility, etc.
    // Example: if (state.uiInitialized && !user && wasLoggedIn) { ui.handleLogoutUIUpdates(); }
}

/**
 * Handles clicks on the previous/next month navigation buttons.
 * @param {string} direction - 'prev' or 'next'.
 */
function handleMonthChange(direction) {
    console.log(`main: Month change requested: ${direction}`);
    if (direction === 'prev') {
        state.currentMonthIndex = (state.currentMonthIndex - 1 + 12) % 12;
    } else {
        state.currentMonthIndex = (state.currentMonthIndex + 1) % 12;
    }
    drawCurrentMonth(); // Redraw the calendar for the new month
}

/**
 * Handles the action when the 'Edit' button is clicked within the preview modal.
 * @param {object} dia - The day data associated with the preview modal.
 * @param {array} memories - The memories already loaded for that day.
 */
function handleEditFromPreview(dia, memories) {
    console.log("main: Switching from Preview to Edit for day:", dia.id);
    // Directly tell the UI to open the edit modal with the provided data
    ui.openEditModal(dia, memories, state.allDaysData);
}


/**
 * Handles actions triggered by clicks on footer buttons (Add, Store, Shuffle).
 * Passed as a callback to ui.init().
 * @param {string} action - The action identifier ('add', 'store', 'shuffle').
 */
function handleFooterAction(action) {
     // Log the specific action received from ui.js
     console.log(`main: Footer action received via callback: '${action}'`);
    switch (action) {
        case 'add':
            // Check if calendar data is loaded before attempting to add
            if(state.allDaysData.length > 0) {
                 console.log("main: Handling 'add' action -> Opening Add Memory modal.");
                 // Open edit modal in 'add' mode (dia=null)
                 ui.openEditModal(null, [], state.allDaysData);
            } else {
                console.error("main: Calendar data not loaded. Cannot handle 'add' action.");
                alert("Calendar data not loaded yet. Cannot add memory.");
            }
            break;
        case 'store':
             console.log("main: Handling 'store' action -> Opening Store modal.");
            ui.openStoreModal();
            break;
        case 'shuffle':
             console.log("main: Handling 'shuffle' action -> Triggering Shuffle.");
            handleShuffleClick();
            break;
        // 'settings' is explicitly handled by ui.js, so main.js should ignore it if received
        case 'settings':
             console.log("main: 'Settings' action received, but ignored (handled by ui.js).");
             break;
        default:
            // Log any unexpected actions received
            console.warn("main: Unknown or unhandled footer action received:", action);
    }
}

/**
 * Handles the logic for the 'Shuffle' action: selects a random day and navigates to it.
 */
function handleShuffleClick() {
    if (state.allDaysData.length === 0) {
        console.warn("main: Cannot shuffle, no day data loaded.");
        return;
    }
    console.log("main: Shuffling to a random day...");

    const randomIndex = Math.floor(Math.random() * state.allDaysData.length);
    const randomDia = state.allDaysData[randomIndex];
    const randomMonthIndex = parseInt(randomDia.id.substring(0, 2), 10) - 1;

    // Change month if necessary
    if (state.currentMonthIndex !== randomMonthIndex) {
         console.log(`main: Changing month to ${randomMonthIndex + 1} for shuffle.`);
        state.currentMonthIndex = randomMonthIndex;
        drawCurrentMonth(); // Redraw calendar for the new month
    }

    // Use a timeout to allow the DOM to update after potential month change
    setTimeout(() => {
        // Find the specific day button in the newly drawn calendar
        const dayButton = document.querySelector(`.dia-btn[data-dia-id="${randomDia.id}"]`);
        if(dayButton) {
             console.log("main: Simulating click on shuffled day button:", randomDia.id);
             dayButton.click(); // Trigger the click handler in ui.js (_handleDayClick)
        } else {
             // This case should ideally not happen if drawCurrentMonth worked
             console.error("main: Could not find button for shuffled day after redraw:", randomDia.id);
             // As a fallback, maybe try opening the preview modal directly?
             // ui.openPreviewModal(randomDia, []); // Might need to load memories first
        }
    }, 250); // Increased delay for safety

    window.scrollTo(0, 0); // Scroll to top
}


/**
 * Handles the submission from the search modal. Fetches results and updates the spotlight.
 * @param {string} term - The search term entered by the user.
 */
async function handleSearchSubmit(term) {
    if (!term) return; // Ignore empty searches
    console.log("main: Handling search submission for term:", term);

    // Tell UI to close search modal immediately
    ui.closeSearchModal();
    // Maybe show a global loading indicator while searching?
    // ui.showGlobalLoader("Searching...");

    try {
        const results = await searchMemories(term.toLowerCase()); // Perform search
        console.log(`main: Search returned ${results.length} results.`);

        // ui.hideGlobalLoader(); // Hide indicator

        if (results.length === 0) {
            // Update spotlight to show "No results" message
            ui.updateSpotlight(`No results found for "${term}"`, []);
        } else {
            // Add Nombre_Dia to results for UI context before displaying
            results.forEach(mem => {
                 if (!mem.Nombre_Dia) {
                     const dayData = state.allDaysData.find(d => d.id === mem.diaId);
                     mem.Nombre_Dia = dayData ? dayData.Nombre_Dia : mem.diaId; // Fallback to ID
                 }
            });
            // Update spotlight to display search results
            ui.updateSpotlight(`Search Results for "${term}" (${results.length})`, results);
        }
    } catch (searchError) {
        console.error("main: Error during memory search:", searchError);
        // ui.hideGlobalLoader();
        alert(`Error searching memories: ${searchError.message}`);
        ui.updateSpotlight("Search Error", []); // Clear spotlight on error
    }
}


// --- 3. Modal Logic (Controller) ---

/**
 * Saves the special name for a day. Updates state and UI.
 * @param {string} diaId - The ID of the day to update.
 * @param {string} newName - The new special name.
 */
async function handleSaveDayName(diaId, newName) {
     const finalName = newName && newName.trim() ? newName.trim() : "Unnamed Day";
     console.log(`main: Saving name "${finalName}" for day ${diaId}`);
    try {
        await saveDayName(diaId, finalName); // Call store function

        // Update local state for immediate UI reflection
        const dayIndex = state.allDaysData.findIndex(d => d.id === diaId);
        if (dayIndex !== -1) {
            state.allDaysData[dayIndex].Nombre_Especial = finalName;
        } else {
             console.warn(`main: Day ${diaId} not found in state after saving name.`);
        }

        // Inform UI about success
        ui.showModalStatus('save-status', 'Name saved', false);

        // Redraw calendar if the current month is displayed
        const editedMonthIndex = parseInt(diaId.substring(0, 2), 10) - 1;
        if (editedMonthIndex === state.currentMonthIndex) {
            drawCurrentMonth();
        }

        // Update spotlight if today's name changed
        if (diaId === state.todayId) {
            loadTodaySpotlight();
        }
        console.log(`main: Name saved successfully for ${diaId}.`);

    } catch (err) {
        console.error("Error saving day name:", err);
        ui.showModalStatus('save-status', `Error: ${err.message}`, true);
    }
}

/**
 * Handles the submission of the memory form (add or update).
 * Converts date, handles potential image upload, saves data, refreshes UI.
 * @param {string} diaId - The ID of the day the memory belongs to.
 * @param {object} memoryData - Raw data from the UI form.
 * @param {boolean} isEditing - Indicates if this is an update to an existing memory.
 */
async function handleSaveMemorySubmit(diaId, memoryData, isEditing) {
     console.log(`main: Saving memory for day ${diaId}. Editing: ${isEditing}. Data:`, memoryData);
    const saveBtn = document.getElementById('save-memoria-btn'); // Get button for potential re-enabling

    try {
        // --- Input Validation & Preparation ---
        // 1. Convert date string (YYYY-MM-DD) to Date object for Firestore Timestamp
        if (!memoryData.Fecha_Original || typeof memoryData.Fecha_Original !== 'string') {
            throw new Error('Original date is missing or invalid.');
        }
        let utcDate;
        try {
            const dateParts = memoryData.Fecha_Original.split('-'); // Expects "YYYY-MM-DD"
            // Month needs to be 0-indexed for Date.UTC
            utcDate = new Date(Date.UTC(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])));
            if (isNaN(utcDate.getTime())) throw new Error('Invalid date constructed from parts.');
            memoryData.Fecha_Original = utcDate; // Replace string with Date object
        } catch (e) {
             console.error("Date construction error:", e, memoryData.Fecha_Original);
            throw new Error('Invalid original date format. Please ensure YYYY-MM-DD.');
        }

        // 2. Image upload logic placeholder (TODO)
        if (memoryData.Tipo === 'Image' && memoryData.file) {
            console.warn("Image upload logic needs implementation.");
            // Example: memoryData.ImagenURL = await uploadImage(memoryData.file);
            delete memoryData.file; // Don't save the File object itself
        } else {
             delete memoryData.file; // Ensure 'file' is not saved
        }
        // --- End Validation ---

        // 3. Save to Firestore
        const memoryId = isEditing ? memoryData.id : null;
        if (isEditing && !memoryId) {
            console.error("main: Edit mode, but memory ID is missing in memoryData:", memoryData);
            throw new Error("Cannot update memory: ID missing.");
        }
        await saveMemory(diaId, memoryData, memoryId); // Pass Date object
        console.log(`main: Memory ${isEditing ? 'updated' : 'saved'} successfully for ${diaId}.`);

        // 4. Update UI status (success)
        ui.showModalStatus('memoria-status', isEditing ? 'Memory updated' : 'Memory saved', false);

        // 5. Reload memory list by re-opening the edit modal (simplest way to refresh)
        console.log(`main: Reloading memories for ${diaId} to refresh modal.`);
        const updatedMemories = await loadMemoriesForDay(diaId);
        const currentDayData = state.allDaysData.find(d => d.id === diaId);
        if(currentDayData){
             // Re-opening resets form and shows the latest list
             ui.openEditModal(currentDayData, updatedMemories, state.allDaysData);
        } else {
             console.error(`main: Could not find day data for ${diaId} after saving memory.`);
             ui.closeEditModal(); // Close stale modal if day data is missing
        }

        // 6. Update grid's blue dot if this was the first memory added
        const dayIndex = state.allDaysData.findIndex(d => d.id === diaId);
        if (dayIndex !== -1 && !state.allDaysData[dayIndex].tieneMemorias) {
            console.log(`main: Marking day ${diaId} as having memories.`);
            state.allDaysData[dayIndex].tieneMemorias = true;
            // Redraw only if the currently viewed month is the one that changed
             const editedMonthIndex = parseInt(diaId.substring(0, 2), 10) - 1;
             if(editedMonthIndex === state.currentMonthIndex) {
                 drawCurrentMonth();
             }
        }

        // 7. Reload spotlight if today was edited
        if (diaId === state.todayId) {
             console.log("main: Reloading spotlight as today was edited.");
            loadTodaySpotlight();
        }

    } catch (err) {
        console.error("Error saving memory:", err);
        // Show specific error to user
        ui.showModalStatus('memoria-status', `Save Error: ${err.message}`, true);
        // Re-enable button on error
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = isEditing ? 'Update Memory' : 'Add Memory';
        }
    }
}


/**
 * Deletes a specified memory. Updates state and UI.
 * @param {string} diaId - The ID of the day the memory belongs to.
 * @param {string} memId - The ID of the memory to delete.
 */
async function handleDeleteMemory(diaId, memId) {
     console.log(`main: Deleting memory ${memId} from day ${diaId}`);
    try {
        await deleteMemory(diaId, memId); // Call store function
        console.log(`main: Memory ${memId} deleted successfully from Firestore.`);
        ui.showModalStatus('memoria-status', 'Memory deleted', false); // Show success in UI

        // Reload memory list by re-opening the edit modal
        console.log(`main: Reloading memories for ${diaId} to refresh modal after delete.`);
        const updatedMemories = await loadMemoriesForDay(diaId);
        const currentDayData = state.allDaysData.find(d => d.id === diaId);
        if(currentDayData){
             // Re-open modal with updated list
             ui.openEditModal(currentDayData, updatedMemories, state.allDaysData);
        } else {
            console.error(`main: Could not find day data for ${diaId} after deleting memory.`);
            ui.closeEditModal(); // Close modal if day context is lost
        }


        // Check if it was the last memory for the day and update grid status
        if (updatedMemories.length === 0) {
            const dayIndex = state.allDaysData.findIndex(d => d.id === diaId);
            // Update state and redraw only if the status actually changed
            if (dayIndex !== -1 && state.allDaysData[dayIndex].tieneMemorias) {
                console.log(`main: Unmarking day ${diaId} as having memories.`);
                state.allDaysData[dayIndex].tieneMemorias = false;
                 // Redraw calendar only if the current month changed
                 const deletedMonthIndex = parseInt(diaId.substring(0, 2), 10) - 1;
                 if(deletedMonthIndex === state.currentMonthIndex) {
                     drawCurrentMonth();
                 }
            }
        }

        // Reload spotlight if today was edited
        if (diaId === state.todayId) {
             console.log("main: Reloading spotlight as today was edited (memory deleted).");
            loadTodaySpotlight();
        }

    } catch (err) {
        console.error("Error deleting memory:", err);
        // Show error in UI
        ui.showModalStatus('memoria-status', `Delete Error: ${err.message}`, true);
    }
}


// --- 4. External API Logic (Controller) ---

/**
 * Initiates an iTunes music search and displays results in the UI.
 * @param {string} term - The search term.
 */
async function handleMusicSearch(term) {
    if (!term || !term.trim()) return; // Avoid empty searches
    const searchTerm = term.trim();
    console.log(`main: Searching iTunes for "${searchTerm}"`);
    try {
        ui.showModalStatus('memoria-status', 'Searching music...', false); // Indicate loading
        const tracks = await searchiTunes(searchTerm); // Call API module
        ui.showMusicResults(tracks); // Display results in UI
        ui.showModalStatus('memoria-status', '', false); // Clear loading status
    } catch (err) {
        console.error("Error searching iTunes:", err);
        ui.showModalStatus('memoria-status', 'Error searching music', true); // Show error
        ui.showMusicResults([]); // Clear results on error
    }
}

/**
 * Initiates a Nominatim place search and displays results in the UI.
 * @param {string} term - The search term.
 */
async function handlePlaceSearch(term) {
    if (!term || !term.trim()) return; // Avoid empty searches
     const searchTerm = term.trim();
    console.log(`main: Searching Nominatim for "${searchTerm}"`);
    try {
        ui.showModalStatus('memoria-status', 'Searching places...', false); // Indicate loading
        const places = await searchNominatim(searchTerm); // Call API module
        ui.showPlaceResults(places); // Display results in UI
        ui.showModalStatus('memoria-status', '', false); // Clear loading status
    } catch (err) {
        console.error("Error searching Nominatim:", err);
        ui.showModalStatus('memoria-status', 'Error searching places', true); // Show error
        ui.showPlaceResults([]); // Clear results on error
    }
}

// --- 5. "Store" Modal Logic (Controller) ---

/**
 * Handles clicks on categories within the Store modal. Fetches initial data.
 * @param {string} type - The category type ('Names', 'Place', 'Music', etc.).
 */
async function handleStoreCategoryClick(type) {
    console.log("main: Loading Store category:", type);

    // Update state
    state.store.currentType = type;
    state.store.lastVisible = null; // Reset pagination
    state.store.isLoading = true;

    const title = `Store: ${type}`;
    ui.openStoreListModal(title); // Opens modal with "Loading..." placeholder

    try {
        // Fetch first page of data from store module
        let result;
        if (type === 'Names') {
            result = await getNamedDays(10); // Page size 10
        } else {
            result = await getMemoriesByType(type, 10); // Page size 10
        }
        console.log(`main: Store loaded ${result.items.length} initial items for ${type}. Has more: ${result.hasMore}`);

        // Update pagination state
        state.store.lastVisible = result.lastVisible;
        state.store.isLoading = false;

        // Display data in UI
        ui.updateStoreList(result.items, false, result.hasMore); // Replace content

    } catch (err) {
        console.error(`Error loading category ${type}:`, err);
        state.store.isLoading = false; // Ensure loading stops on error
        ui.updateStoreList([], false, false); // Show empty list on error

        // Handle specific Firebase errors (like missing index)
        if (err.code === 'failed-precondition') {
            console.error("FIREBASE INDEX REQUIRED!", err.message);
            alert("Firebase Error: An index is required. Check the console (F12) for the creation link.");
        } else {
            // Generic error message
            alert(`Error loading store: ${err.message}`);
        }
         // Consider closing the list modal on error?
         // ui.closeStoreListModal();
    }
}


/**
 * Handles clicks on the 'Load More' button in the Store list modal. Fetches next page.
 */
async function handleStoreLoadMore() {
    const { currentType, lastVisible, isLoading } = state.store;

    // Prevent multiple simultaneous loads or loading when no more data
    if (isLoading || !currentType || !lastVisible) {
         console.log("main: Load more skipped (loading or no context).");
         return;
    }

    console.log("main: Loading more items for store category:", currentType);
    state.store.isLoading = true;
    // Visually indicate loading in the UI (e.g., disable button, show spinner)
    ui.updateStoreList([], true, true); // Keep existing items, show loading state (hasMore=true disables button implicitly)

    try {
        // Fetch the next page of data from the store module
        let result;
        if (currentType === 'Names') {
            result = await getNamedDays(10, lastVisible); // Page size 10, start after lastVisible
        } else {
            result = await getMemoriesByType(currentType, 10, lastVisible); // Page size 10, start after lastVisible
        }
        // --- FIX: Log the correct variable ---
        console.log(`main: Store loaded ${result.items.length} more items for ${currentType}. Has more: ${result.hasMore}`);

        // Update pagination state
        state.store.lastVisible = result.lastVisible;
        state.store.isLoading = false;

        // Append the new results to the UI list
        ui.updateStoreList(result.items, true, result.hasMore);

    } catch (err) {
        console.error(`Error loading more ${currentType}:`, err);
        state.store.isLoading = false; // Stop loading on error
        alert(`Error loading more items: ${err.message}`);
        // Update UI to hide loading state and potentially show error
        ui.updateStoreList([], true, false); // Keep existing items, hide loading button
    }
}

/**
 * Handles clicks on individual items within the Store list modal. Navigates to the item's day.
 * @param {string} diaId - The ID of the day associated with the clicked item.
 */
function handleStoreItemClick(diaId) {
     if (!diaId) {
          console.error("main: Store item click received invalid diaId.");
          return;
     }
     console.log(`main: Store item clicked, navigating to day ${diaId}`);

    // Find the corresponding day data in the main state
    const dia = state.allDaysData.find(d => d.id === diaId);
    if (!dia) {
        // This might happen if allDaysData is somehow stale or ID is wrong
        console.error("main: Day data not found in state for diaId:", diaId);
        alert("Error: Could not find the selected day's data. Please refresh.");
        return;
    }

    // Close Store modals first
    ui.closeStoreListModal();
    ui.closeStoreModal();

    // Calculate the target month index
    let monthIndex = -1;
     try {
         monthIndex = parseInt(dia.id.substring(0, 2), 10) - 1;
         if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
             throw new Error("Invalid index parsed.");
         }
     } catch(e) {
          console.error("main: Invalid month index calculated from diaId:", dia.id, e);
          alert("Error navigating to the selected day.");
          return;
     }


    // Change month if necessary
    if (state.currentMonthIndex !== monthIndex) {
        console.log(`main: Changing month to ${monthIndex + 1} for store navigation.`);
        state.currentMonthIndex = monthIndex;
        drawCurrentMonth(); // Draw the new month's calendar
    }

    // Use a timeout to allow the DOM to update (especially after month change)
    // before simulating the click on the day button
    setTimeout(() => {
        const dayButton = document.querySelector(`.dia-btn[data-dia-id="${dia.id}"]`);
        if(dayButton) {
             console.log("main: Simulating click on store item day button:", dia.id);
             dayButton.click(); // This triggers ui.js _handleDayClick -> openPreviewModal
        } else {
             // If the button isn't found, the calendar might not have rendered correctly
             console.error("main: Could not find button for store item day after navigation:", dia.id);
             // As a fallback, try to open the preview modal directly, but it might lack context
             // ui.openPreviewModal(dia, []); // Needs memories loaded first
        }
    }, 250); // Increased delay again for safety

    window.scrollTo(0, 0); // Scroll to top
}

// --- Helper Functions ---
/**
 * Displays a fatal error message, replacing the body content.
 * @param {string} message - The error message to display.
 */
function displayFatalError(message) {
     console.error("FATAL ERROR:", message);
     // Use try-catch for DOM manipulation as a last resort
     try {
         const appContent = document.getElementById('app-content');
         // If appContent exists, use it, otherwise replace the whole body
         const targetElement = appContent || document.body;
         targetElement.innerHTML = `<p style="color: red; padding: 20px; font-weight: bold; text-align: center;">${message}. Please reload the application.</p>`;
     } catch (domError) {
          console.error("Error displaying fatal error message:", domError);
          // Fallback to alert if even basic DOM manipulation fails
          alert(`FATAL ERROR: ${message}. Please reload.`);
     }
}


// --- 6. Initial Execution ---
// Ensure the script runs after the DOM is ready (though module scripts usually do)
if (document.readyState === 'loading') {
    // Use 'DOMContentLoaded' which fires earlier than 'load'
    document.addEventListener('DOMContentLoaded', checkAndRunApp);
} else {
    checkAndRunApp(); // DOM is already ready
}

