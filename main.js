/*
 * main.js (v5.0 - Final Init Order Fix & Footer Logging)
 * Main app controller. Ensures UI init completes before drawing.
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
    uiInitialized: false // Flag to track UI initialization status
};

// --- 1. App Initialization ---

/**
 * Main function to start the application. Loads data first, then initializes UI.
 */
async function checkAndRunApp() {
    console.log("Starting Ephemerides v5.0 (Modular)...");

    try {
        initFirebase();
        initAuthListener(handleAuthStateChange); // Setup listener early

        console.log("[main.js] Running store checks and migrations...");
        await storeCheckAndRun(console.log);
        await migrateDayNamesToEnglish(console.log);
        console.log("[main.js] Store checks and migrations complete.");

        console.log("[main.js] Loading all days data...");
        state.allDaysData = await loadAllDaysData();
        console.log(`[main.js] Loaded ${state.allDaysData.length} days.`);

        if (state.allDaysData.length === 0) {
            console.error("[main.js] No day data loaded! Database might be empty or corrupted after checks.");
            throw new Error("Database is empty or invalid after checks.");
        }

        // Calculate today's ID
        const today = new Date();
        state.todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        console.log(`[main.js] Today's ID set to ${state.todayId}`);

        // --- Initialize UI only AFTER data is loaded ---
        initializeAppUI(); // This function now calls draw/load internally

    } catch (err) {
        console.error("[main.js] CRITICAL ERROR during initial startup:", err);
        displayFatalError(`Startup error: ${err.message}`);
    }
}

/**
 * Initializes the UI module and performs the initial draw.
 * Ensures drawing happens *after* successful initialization.
 */
function initializeAppUI() {
    // Prevent double initialization
    if (state.uiInitialized) {
        console.warn("[main.js] Attempted to initialize UI twice. Skipping.");
        return;
    }
    console.log("[main.js] Attempting to initialize UI...");
    let uiInitSuccess = false; // Flag to track success within try block
    try {
        console.log("[main.js] Calling ui.init()...");
        ui.init(getUICallbacks()); // Pass all necessary callbacks to UI
        // If ui.init() completes without throwing, mark as success
        uiInitSuccess = true;
        state.uiInitialized = true; // Mark UI as ready
        console.log("[main.js] ui.init() completed successfully. UI Initialized flag set to true.");

    } catch (uiError) {
         // Catch errors specifically from ui.init()
         console.error("[main.js] CRITICAL ERROR during UI initialization (ui.init failed):", uiError);
         state.uiInitialized = false; // Ensure flag remains false on error
         displayFatalError(`UI Init error: ${uiError.message}`);
         // Stop execution here if UI init fails
         return;
    }

    // --- Draw initial state ONLY if UI initialized successfully ---
    if (uiInitSuccess) {
        console.log("[main.js] UI initialized. Performing initial draw (calendar and spotlight)...");
        try {
            drawCurrentMonth(); // Draw calendar
            loadTodaySpotlight(); // Load spotlight data
            console.log("[main.js] Initial draw completed.");
        } catch (drawError) {
             console.error("[main.js] Error during initial draw after successful UI init:", drawError);
             // Display error, but the basic UI might still be functional
             displayFatalError(`Error during initial draw: ${drawError.message}`);
        }
    } else {
         // This case should theoretically not be reached if ui.init throws
         console.error("[main.js] UI initialization failed silently (flag not set). Cannot perform initial draw.");
         displayFatalError("UI failed to initialize properly.");
    }

    // Moved success log here, only logs if init *and* draw attempt finished
    if (state.uiInitialized) {
         console.log("App initialization and first draw attempt complete.");
    }
}


/**
 * Loads the "Spotlight" data for today. Safe to call only after UI is initialized.
 */
async function loadTodaySpotlight() {
    // Check if UI is ready before trying to update it
    if (!state.uiInitialized) {
         console.warn("[main.js] UI not ready, skipping spotlight load.");
         return; // Don't proceed if UI isn't initialized
    }
    console.log("[main.js] Loading spotlight data...");
    const today = new Date();
    // Use 'en-US' locale for date formatting consistent with data
    const dateString = `Today, ${today.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}`;

    // Ensure todayId is available
    if (!state.todayId) {
         console.error("[main.js] todayId not set before loading spotlight. Calculating fallback.");
         // This calculation should have happened in checkAndRunApp
         state.todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    }

    try {
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
            console.log("[main.js] Spotlight updated in UI.");
        } else {
            console.warn("[main.js] No spotlight data received from store.");
            ui.updateSpotlight(dateString, []); // Show empty spotlight explicitly
        }
    } catch (spotlightError) {
         console.error("[main.js] Error loading or updating spotlight:", spotlightError);
         ui.updateSpotlight(dateString, []); // Show empty on error
         // Optionally show an error message in the spotlight area
         // ui.showSpotlightError(`Error: ${spotlightError.message}`);
    }
}


/**
 * Draws the current month's calendar grid. Safe to call only after UI is initialized.
 */
function drawCurrentMonth() {
     // Check if UI is ready
     if (!state.uiInitialized) {
         console.warn("[main.js] UI not ready, skipping month draw.");
         return; // Don't proceed if UI isn't initialized
     }
     // Check if data is ready
     if (!state.allDaysData || state.allDaysData.length === 0) {
         console.warn("[main.js] Attempted to draw month but allDaysData is empty or not loaded.");
         // Optionally, tell UI to show a specific loading/error state for the calendar
         // ui.showCalendarMessage("Loading calendar data..."); // Example
         return;
     }
     console.log(`[main.js] Drawing month ${state.currentMonthIndex + 1}...`);

    const monthName = new Date(2024, state.currentMonthIndex, 1).toLocaleDateString('en-US', { month: 'long' });
    const monthNumber = state.currentMonthIndex + 1;

    // Filter days for the current month - ensure 'dia' is valid
    const diasDelMes = state.allDaysData.filter(dia =>
        dia && dia.id && typeof dia.id === 'string' && dia.id.length === 5 &&
        parseInt(dia.id.substring(0, 2), 10) === monthNumber
    );

    // Ensure todayId is available (should be set, but double-check)
    if (!state.todayId) {
        const today = new Date();
        state.todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        console.warn("[main.js] todayId was missing, calculated fallback for drawCalendar.");
    }

    try {
        // Call UI function to draw
        ui.drawCalendar(monthName, diasDelMes, state.todayId);
        console.log("[main.js] ui.drawCalendar call completed successfully.");
    } catch (drawError) {
         console.error("[main.js] Error occurred during ui.drawCalendar:", drawError);
         // Display an error in the calendar area if possible
         const appContent = document.getElementById('app-content');
         if(appContent) appContent.innerHTML = `<p style="color:red;">Error drawing calendar: ${drawError.message}</p>`;
    }
}


// --- 2. Callbacks and Event Handlers ---

/**
 * Returns an object containing all callback functions needed by the UI module.
 */
function getUICallbacks() {
    console.log("[main.js] Generating UI callbacks..."); // Log generation
    return {
        // Core state/data access for UI
        isUserLoggedIn: () => !!state.currentUser,
        loadMemoriesForDay: loadMemoriesForDay, // Pass store function
        getAllDaysData: () => state.allDaysData, // Provide access to all days data
        getTodayId: () => state.todayId, // Provide access to today's ID

        // Actions triggered by UI events
        onEditFromPreview: handleEditFromPreview,
        onMonthChange: handleMonthChange,
        onFooterAction: handleFooterAction, // <-- Callback for footer clicks
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
        console.warn("[main.js] Auth state changed, but UI not ready yet. Login UI update deferred.");
    }
    console.log("[main.js] Authentication state changed:", user ? user.uid : "Logged out");

    // Potentially trigger UI updates if login status affects visibility, etc.
    // Example: if (state.uiInitialized && !user && wasLoggedIn) { ui.refreshOpenModalsForLogout(); }
}

/**
 * Handles clicks on the previous/next month navigation buttons.
 * @param {string} direction - 'prev' or 'next'.
 */
function handleMonthChange(direction) {
    console.log(`[main.js] Month change requested: ${direction}`);
    if (direction === 'prev') {
        state.currentMonthIndex = (state.currentMonthIndex - 1 + 12) % 12;
    } else if (direction === 'next') { // Ensure direction is 'next'
        state.currentMonthIndex = (state.currentMonthIndex + 1) % 12;
    } else {
        console.warn(`[main.js] Invalid direction for month change: ${direction}`);
        return;
    }
    drawCurrentMonth(); // Redraw the calendar for the new month
}

/**
 * Handles the action when the 'Edit' button is clicked within the preview modal.
 * @param {object} dia - The day data associated with the preview modal.
 * @param {array} memories - The memories already loaded for that day.
 */
function handleEditFromPreview(dia, memories) {
    // Basic validation
    if (!dia || !dia.id) {
         console.error("[main.js] handleEditFromPreview called with invalid 'dia' object:", dia);
         return;
    }
    console.log("[main.js] Switching from Preview to Edit for day:", dia.id);
    // Directly tell the UI to open the edit modal with the provided data
    ui.openEditModal(dia, memories, state.allDaysData);
}


/**
 * Handles actions triggered by clicks on footer buttons (Add, Store, Shuffle).
 * Passed as a callback to ui.init() and called by ui.js's _setupFooter.
 * @param {string} action - The action identifier ('add', 'store', 'shuffle').
 */
function handleFooterAction(action) {
     // Log the specific action received from ui.js
     console.log(`[main.js] handleFooterAction called with action: '${action}'`);
    switch (action) {
        case 'add':
            // Check if calendar data is loaded before attempting to add
            if(state.allDaysData && state.allDaysData.length > 0) {
                 console.log("[main.js] Handling 'add' action -> Opening Add Memory modal.");
                 // Open edit modal in 'add' mode (dia=null)
                 ui.openEditModal(null, [], state.allDaysData);
            } else {
                console.error("[main.js] Calendar data not loaded. Cannot handle 'add' action.");
                alert("Cannot add memory: Calendar data is not ready.");
            }
            break;
        case 'store':
             console.log("[main.js] Handling 'store' action -> Opening Store modal.");
            ui.openStoreModal();
            break;
        case 'shuffle':
             console.log("[main.js] Handling 'shuffle' action -> Triggering Shuffle logic.");
            handleShuffleClick();
            break;
        // 'settings' is explicitly handled by ui.js, so main.js should not receive it,
        // but we handle it defensively anyway.
        case 'settings':
             console.log("[main.js] 'Settings' action received unexpectedly (should be handled by ui.js).");
             break;
        default:
            // Log any unexpected actions received
            console.warn("[main.js] Unknown or unhandled footer action received in handleFooterAction:", action);
    }
}


/**
 * Handles the logic for the 'Shuffle' action: selects a random day and navigates to it.
 */
function handleShuffleClick() {
    if (!state.allDaysData || state.allDaysData.length === 0) {
        console.warn("[main.js] Cannot shuffle, no day data loaded.");
        return;
    }
    console.log("[main.js] Shuffling to a random day...");

    const randomIndex = Math.floor(Math.random() * state.allDaysData.length);
    const randomDia = state.allDaysData[randomIndex];
     // Add safety check for randomDia object
     if (!randomDia || !randomDia.id) {
          console.error("[main.js] Shuffle resulted in invalid day object:", randomDia);
          return;
     }

    let randomMonthIndex = -1;
     try {
         randomMonthIndex = parseInt(randomDia.id.substring(0, 2), 10) - 1;
         if (isNaN(randomMonthIndex) || randomMonthIndex < 0 || randomMonthIndex > 11) {
              throw new Error("Parsed index out of range.");
         }
     } catch (e) {
          console.error(`[main.js] Error parsing month index from shuffled day ID '${randomDia.id}':`, e);
          return; // Stop if we can't determine the month
     }


    // Change month if necessary
    if (state.currentMonthIndex !== randomMonthIndex) {
         console.log(`[main.js] Changing month to ${randomMonthIndex + 1} for shuffle.`);
        state.currentMonthIndex = randomMonthIndex;
        drawCurrentMonth(); // Redraw calendar for the new month
    }

    // Use a timeout to allow the DOM to update after potential month change
    setTimeout(() => {
        // Find the specific day button in the newly drawn calendar
        const dayButton = document.querySelector(`.dia-btn[data-dia-id="${randomDia.id}"]`);
        if(dayButton) {
             console.log("[main.js] Simulating click on shuffled day button:", randomDia.id);
             dayButton.click(); // Trigger the click handler in ui.js (_handleDayClick)
        } else {
             // This case might happen if drawCurrentMonth fails or is slow
             console.error("[main.js] Could not find button for shuffled day after redraw:", randomDia.id);
             // As a fallback, try opening the preview modal directly after loading memories
             // This ensures the user sees something even if the click simulation fails
             console.log("[main.js] Fallback: Manually opening preview for shuffled day.");
             _callbacks.loadMemoriesForDay(randomDia.id)
                 .then(memories => ui.openPreviewModal(randomDia, memories))
                 .catch(err => console.error("Error loading memories for shuffle fallback:", err));
        }
    }, 300); // Slightly longer delay might help ensure DOM is ready

    window.scrollTo(0, 0); // Scroll to top
}


/**
 * Handles the submission from the search modal. Fetches results and updates the spotlight.
 * @param {string} term - The search term entered by the user.
 */
async function handleSearchSubmit(term) {
    if (!term || !term.trim()) return; // Ignore empty searches
    const searchTerm = term.trim();
    console.log("[main.js] Handling search submission for term:", searchTerm);

    // Tell UI to close search modal immediately
    ui.closeSearchModal();
    // OPTIONAL: Show a loading state in the spotlight area while searching
    ui.updateSpotlight(`Searching for "${searchTerm}"...`, []);

    try {
        const results = await searchMemories(searchTerm.toLowerCase()); // Perform search
        console.log(`[main.js] Search returned ${results.length} results.`);

        if (results.length === 0) {
            // Update spotlight to show "No results" message
            ui.updateSpotlight(`No results found for "${searchTerm}"`, []);
        } else {
            // Add Nombre_Dia to results for UI context before displaying
            results.forEach(mem => {
                 if (!mem.Nombre_Dia) {
                     const dayData = state.allDaysData.find(d => d.id === mem.diaId);
                     mem.Nombre_Dia = dayData ? dayData.Nombre_Dia : mem.diaId; // Fallback to ID
                 }
            });
            // Update spotlight to display search results
            ui.updateSpotlight(`Search Results for "${searchTerm}" (${results.length})`, results);
        }
    } catch (searchError) {
        console.error("[main.js] Error during memory search:", searchError);
        alert(`Error searching memories: ${searchError.message}`);
        ui.updateSpotlight("Search Error", []); // Clear spotlight on error
    }
}


// --- 3. Modal Logic (Controller) ---

// ... (handleSaveDayName, handleSaveMemorySubmit, handleDeleteMemory remain the same - ensure they have logging) ...
async function handleSaveDayName(diaId, newName) { /* ... v4.9 logic ... */ }
async function handleSaveMemorySubmit(diaId, memoryData, isEditing) { /* ... v4.9 logic ... */ }
async function handleDeleteMemory(diaId, memId) { /* ... v4.9 logic ... */ }

// --- 4. External API Logic (Controller) ---

// ... (handleMusicSearch, handlePlaceSearch remain the same - ensure they have logging) ...
async function handleMusicSearch(term) { /* ... v4.9 logic ... */ }
async function handlePlaceSearch(term) { /* ... v4.9 logic ... */ }

// --- 5. "Store" Modal Logic (Controller) ---

// ... (handleStoreCategoryClick, handleStoreLoadMore, handleStoreItemClick remain the same - ensure they have logging) ...
async function handleStoreCategoryClick(type) { /* ... v4.9 logic ... */ }
async function handleStoreLoadMore() { /* ... v4.9 logic ... */ }
function handleStoreItemClick(diaId) { /* ... v4.9 logic ... */ }

// --- Helper Functions ---
/**
 * Displays a fatal error message, replacing the body content.
 * @param {string} message - The error message to display.
 */
function displayFatalError(message) {
     console.error("FATAL ERROR:", message);
     // Use try-catch for DOM manipulation as a last resort
     try {
         // Try to find the main content area, otherwise use body
         const appContent = document.getElementById('app-content');
         const targetElement = appContent || document.body;
         // Set innerHTML to display the error message
         targetElement.innerHTML = `<p style="color: red; padding: 20px; font-weight: bold; text-align: center;">${message}. Please reload the application.</p>`;
     } catch (domError) {
          console.error("Error displaying fatal error message:", domError);
          // Fallback to alert if even basic DOM manipulation fails
          alert(`FATAL ERROR: ${message}. Please reload.`);
     }
}


// --- 6. Initial Execution ---
// Ensure the script runs after the DOM is ready
if (document.readyState === 'loading') {
    // Wait for the DOMContentLoaded event before running the app
    console.log("[main.js] DOM not ready yet, adding listener...");
    document.addEventListener('DOMContentLoaded', checkAndRunApp);
} else {
    // DOM is already ready, run the app immediately
    console.log("[main.js] DOM already ready, running app...");
    checkAndRunApp();
}

