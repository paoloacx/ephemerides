/*
 * store.js (v3.0 - English Translation & Migration)
 * Firestore Logic Module.
 * Handles reading from and writing to the database.
 */

// --- Firebase Imports (from central connection) ---
import { db } from './firebase.js';
import {
    collection, getDocs, doc, updateDoc,
    writeBatch, setDoc, deleteDoc, Timestamp, query,
    orderBy, addDoc, getDoc, limit, collectionGroup,
    where, startAfter
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// --- Constants ---
const DIAS_COLLECTION = "Dias";
const MEMORIAS_COLLECTION = "Memorias";
const INTERNAL_COLLECTION = "_internal";
const MIGRATION_DOC = "migrations";

// --- NEW: English Month Names ---
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// --- 1. Init Logic (Check/Repair/Migrate) ---

/**
 * Verifies database and repairs if needed.
 * @param {function} onProgress - Callback for progress reporting (e.g., ui.setLoading)
 */
async function checkAndRunApp(onProgress) {
    console.log("Store: Verifying database...");
    const diasRef = collection(db, DIAS_COLLECTION);
    const checkSnapshot = await getDocs(diasRef);
    const currentDocCount = checkSnapshot.size;
    
    console.log(`Store: Docs found in 'Dias': ${currentDocCount}`);
    
    if (currentDocCount < 366) {
        console.warn(`Store: Repairing... Found ${currentDocCount} docs, expected 366.`);
        onProgress(`Repairing... ${currentDocCount}/366`);
        await _generateCleanDatabase(onProgress);
    } else {
        console.log("Store: Database verified (>= 366 days).");
    }
}

/**
 * NEW: One-time data migration to update day names to English.
 * @param {function} onProgress - Callback for progress reporting
 */
async function migrateDayNamesToEnglish(onProgress) {
    const migrationRef = doc(db, INTERNAL_COLLECTION, MIGRATION_DOC);
    try {
        const migrationSnap = await getDoc(migrationRef);
        if (migrationSnap.exists() && migrationSnap.data().v1_dayNamesEnglish) {
            console.log("Store: Day name migration already complete.");
            return;
        }

        onProgress("Migrating day names to English...");
        console.log("Store: Starting one-time day name migration...");

        const diasRef = collection(db, DIAS_COLLECTION);
        const diasSnapshot = await getDocs(diasRef);
        
        let batch = writeBatch(db);
        let opCount = 0;
        
        diasSnapshot.forEach(docSnap => {
            const id = docSnap.id;
            if (id.length !== 5 || !id.includes('-')) return; // Skip invalid docs

            const monthIndex = parseInt(id.substring(0, 2), 10) - 1;
            const dayNum = parseInt(id.substring(3), 10);
            
            // Recalculate name using English MONTH_NAMES
            const newName = `${MONTH_NAMES[monthIndex]} ${dayNum}`;
            
            batch.update(docSnap.ref, { Nombre_Dia: newName });
            opCount++;
            
            if (opCount >= 400) {
                batch.commit();
                batch = writeBatch(db);
                opCount = 0;
            }
        });

        // Set migration flag
        batch.set(migrationRef, { v1_dayNamesEnglish: true }, { merge: true });
        
        await batch.commit();
        console.log("Store: Day name migration finished.");
        onProgress("Migration complete.");

    } catch (err) {
        console.error("Store: Error during data migration:", err);
        // Don't block app start, just log it
    }
}


/**
 * (Private) Deletes 'Dias' and generates 366 clean days (now in English).
 * @param {function} onProgress - Callback for progress reporting
 */
async function _generateCleanDatabase(onProgress) {
    const diasRef = collection(db, DIAS_COLLECTION);
    
    // 1. Delete all existing documents
    try {
        onProgress("Deleting old data...");
        console.log("Store: Deleting 'Dias'...");
        const oldDocsSnapshot = await getDocs(diasRef);
        
        if (!oldDocsSnapshot.empty) {
            let batch = writeBatch(db);
            let deleteCount = 0;
            
            for (const docSnap of oldDocsSnapshot.docs) {
                batch.delete(docSnap.ref);
                deleteCount++;
                if (deleteCount >= 400) {
                    await batch.commit();
                    batch = writeBatch(db);
                    deleteCount = 0;
                }
            }
            if (deleteCount > 0) {
                await batch.commit();
            }
            console.log(`Store: Deletion complete (${oldDocsSnapshot.size}).`);
        } else {
            console.log("Store: 'Dias' collection was already empty.");
        }
    } catch (e) {
        console.error("Store: Error deleting collection:", e);
        throw e; // Re-throw
    }

    // 2. Generate 366 clean days
    console.log("Store: Generating 366 clean days...");
    onProgress("Generating 366 clean days...");
    
    let genBatch = writeBatch(db);
    let ops = 0;
    let created = 0;
    
    try {
        for (let m = 0; m < 12; m++) {
            const monthNum = m + 1;
            const monthStr = monthNum.toString().padStart(2, '0');
            const numDays = DAYS_IN_MONTH[m];
            
            for (let d = 1; d <= numDays; d++) {
                const dayStr = d.toString().padStart(2, '0');
                const diaId = `${monthStr}-${dayStr}`; // "01-01"
                
                // --- NEW: Use English names ---
                const diaData = {
                    Nombre_Dia: `${MONTH_NAMES[m]} ${d}`, // e.g., "January 1"
                    Icono: '', // Legacy field
                    Nombre_Especial: "Unnamed Day",
                    tieneMemorias: false // Optimization flag
                };
                
                const docRef = doc(db, DIAS_COLLECTION, diaId);
                genBatch.set(docRef, diaData);
                ops++;
                created++;
                
                if (created % 50 === 0) {
                    onProgress(`Generating ${created}/366...`);
                }

                if (ops >= 400) {
                    await genBatch.commit();
                    genBatch = writeBatch(db);
                    ops = 0;
                }
            }
        }
        
        if (ops > 0) {
            await genBatch.commit();
        }
        
        console.log(`Store: Regeneration complete: ${created} days created.`);
        onProgress(`DB regenerated: ${created} days.`);
        
    } catch (e) {
        console.error("Store: Error generating days:", e);
        throw e; // Re-throw
    }
}

// --- 2. Read Logic (Days & Memories) ---

/**
 * Loads all 366+ day documents.
 * @returns {Array} - Array of day objects.
 */
async function loadAllDaysData() {
    const q = query(collection(db, DIAS_COLLECTION));
    const querySnapshot = await getDocs(q);
    
    const allDays = [];
    querySnapshot.forEach((doc) => {
        if (doc.id.length === 5 && doc.id.includes('-')) {
            allDays.push({ id: doc.id, ...doc.data() });
        }
    });
    
    // Sort by ID ("01-01", "01-02", ...)
    allDays.sort((a, b) => a.id.localeCompare(b.id));
    
    console.log(`Store: Loaded ${allDays.length} days.`);
    return allDays;
}

/**
 * Loads all memories for a specific day.
 * @param {string} diaId - The day ID (e.g., "10-26").
 * @returns {Array} - Array of memory objects.
 */
async function loadMemoriesForDay(diaId) {
    const memoriasRef = collection(db, DIAS_COLLECTION, diaId, MEMORIAS_COLLECTION);
    const q = query(memoriasRef, orderBy("Fecha_Original", "desc"));
    
    const querySnapshot = await getDocs(q);
    const memories = [];
    querySnapshot.forEach((doc) => {
        memories.push({ id: doc.id, ...doc.data() });
    });
    
    return memories;
}

/**
 * Loads "Spotlight" data for today.
 * @param {string} todayId - Today's ID (e.g., "10-26").
 * @returns {Object} - { dayName: '...', memories: [...] }
 */
async function getTodaySpotlight(todayId) {
    try {
        // 1. Get the day name
        const diaRef = doc(db, DIAS_COLLECTION, todayId);
        const diaSnap = await getDoc(diaRef);
        const dayName = diaSnap.exists() ? (diaSnap.data().Nombre_Especial || 'Unnamed Day') : 'Unnamed Day';

        // 2. Get latest 3 memories
        const memoriasRef = collection(db, DIAS_COLLECTION, todayId, MEMORIAS_COLLECTION);
        const q = query(memoriasRef, orderBy("Fecha_Original", "desc"), limit(3));
        const memSnapshot = await getDocs(q);
        
        const memories = [];
        memSnapshot.forEach(doc => {
            memories.push({
                id: doc.id,
                diaId: todayId, // Add diaId for context
                ...doc.data()
            });
        });
        
        return { dayName, memories };
        
    } catch (err) {
        console.error("Store: Error loading spotlight:", err);
        return { dayName: 'Error loading', memories: [] };
    }
}

// --- 3. Write Logic (Days & Memories) ---

/**
 * Saves/Updates a day's special name.
 * @param {string} diaId - The day ID.
 * @param {string} newName - The new name.
 */
async function saveDayName(diaId, newName) {
    const diaRef = doc(db, DIAS_COLLECTION, diaId);
    const finalName = newName && newName.trim() !== '' ? newName.trim() : "Unnamed Day";
    await updateDoc(diaRef, {
        Nombre_Especial: finalName
    });
}

/**
 * Saves a new memory or updates an existing one.
 * @param {string} diaId - The parent day ID.
 * @param {Object} memoryData - Memory data object.
 * @param {string|null} memoryId - The memory ID (null if new).
 */
async function saveMemory(diaId, memoryData, memoryId) {
    const diaRef = doc(db, DIAS_COLLECTION, diaId);
    
    if (memoryData.Fecha_Original && !(memoryData.Fecha_Original instanceof Timestamp)) {
        memoryData.Fecha_Original = Timestamp.fromDate(memoryData.Fecha_Original);
    }

    delete memoryData.file; 
    
    if (memoryId) {
        // --- Update Existing Memory ---
        delete memoryData.id; 
        const memRef = doc(db, DIAS_COLLECTION, diaId, MEMORIAS_COLLECTION, memoryId);
        await updateDoc(memRef, memoryData);
        
    } else {
        // --- Add New Memory ---
        memoryData.Creado_En = Timestamp.now(); 
        const memRef = collection(db, DIAS_COLLECTION, diaId, MEMORIAS_COLLECTION);
        await addDoc(memRef, memoryData);
    }
    
    // Update 'tieneMemorias' flag on the day
    await updateDoc(diaRef, {
        tieneMemorias: true
    });
}

/**
 * Deletes a memory.
 * @param {string} diaId - The day ID.
 * @param {string} memId - The memory ID.
 */
async function deleteMemory(diaId, memId) {
    const memRef = doc(db, DIAS_COLLECTION, diaId, MEMORIAS_COLLECTION, memId);
    await deleteDoc(memRef);
    
    // Check if any memories are left, update flag if not
    const memoriasRef = collection(db, DIAS_COLLECTION, diaId, MEMORIAS_COLLECTION);
    const q = query(memoriasRef, limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        const diaRef = doc(db, DIAS_COLLECTION, diaId);
        await updateDoc(diaRef, {
            tieneMemorias: false
        });
    }
}

// --- 4. Search & "Store" Logic ---

/**
 * (SLOW) Searches all memories for a term.
 * @param {string} term - Search term (lowercase).
 * @returns {Array} - Array of found memories.
 */
async function searchMemories(term) {
    // This is the "slow" N+1 search (366 queries)
    
    const diasRef = collection(db, DIAS_COLLECTION);
    const diasSnapshot = await getDocs(diasRef);
    
    let results = [];
    
    const searchPromises = diasSnapshot.docs.map(async (diaDoc) => {
        const diaId = diaDoc.id;
        if (diaId.length !== 5 || !diaId.includes('-')) return; 
        
        const memoriasRef = collection(db, DIAS_COLLECTION, diaId, MEMORIAS_COLLECTION);
        const memSnapshot = await getDocs(memoriasRef);
        
        memSnapshot.forEach(memDoc => {
            const memoria = { 
                id: memDoc.id,
                diaId: diaId,
                Nombre_Dia: diaDoc.data().Nombre_Dia,
                ...memDoc.data()
            };
            
            let searchableText = memoria.Descripcion || '';
            if (memoria.LugarNombre) searchableText += ' ' + memoria.LugarNombre;
            if (memoria.CancionInfo) searchableText += ' ' + memoria.CancionInfo;
            
            if (searchableText.toLowerCase().includes(term)) {
                results.push(memoria);
            }
        });
    });
    
    await Promise.all(searchPromises);
    
    results.sort((a, b) => {
        const dateA = a.Fecha_Original ? a.Fecha_Original.toMillis() : 0;
        const dateB = b.Fecha_Original ? b.Fecha_Original.toMillis() : 0;
        return dateB - dateA; // Most recent first
    });
    
    return results;
}

/**
 * (FAST) Gets memories by type, paginated.
 * @param {string} type - 'Place', 'Music', 'Text', 'Image'
 * @param {number} pageSize - Item limit
 * @param {DocumentSnapshot} [lastVisibleDoc=null] - Last doc (for pagination)
 * @returns {Object} - { items: [], lastVisible: doc, hasMore: boolean }
 */
async function getMemoriesByType(type, pageSize = 10, lastVisibleDoc = null) {
    const memoriasGroupRef = collectionGroup(db, MEMORIAS_COLLECTION);
    
    let q;
    if (lastVisibleDoc) {
        q = query(memoriasGroupRef,
            where("Tipo", "==", type),
            orderBy("Fecha_Original", "desc"),
            startAfter(lastVisibleDoc),
            limit(pageSize)
        );
    } else {
        q = query(memoriasGroupRef,
            where("Tipo", "==", type),
            orderBy("Fecha_Original", "desc"),
            limit(pageSize)
        );
    }
    
    const querySnapshot = await getDocs(q);
    
    const items = [];
    querySnapshot.forEach(doc => {
        const diaId = doc.ref.parent.parent.id;
        items.push(_formatStoreItem(doc, diaId));
    });
    
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    // Check for more
    let hasMore = false;
    if (lastVisible) {
        const nextQuery = query(memoriasGroupRef,
            where("Tipo", "==", type),
            orderBy("Fecha_Original", "desc"),
            startAfter(lastVisible),
            limit(1)
        );
        const nextSnapshot = await getDocs(nextQuery);
        hasMore = !nextSnapshot.empty;
    }

    return { items, lastVisible, hasMore };
}

/**
 * (FAST) Gets days with special names, paginated.
 * @param {number} pageSize - Item limit
 * @param {DocumentSnapshot} [lastVisibleDoc=null] - Last doc (for pagination)
 * @returns {Object} - { items: [], lastVisible: doc, hasMore: boolean }
 */
async function getNamedDays(pageSize = 10, lastVisibleDoc = null) {
    const diasRef = collection(db, DIAS_COLLECTION);
    
    let q;
    if (lastVisibleDoc) {
        q = query(diasRef,
            where("Nombre_Especial", "!=", "Unnamed Day"),
            orderBy("Nombre_Especial", "asc"),
            startAfter(lastVisibleDoc),
            limit(pageSize)
        );
    } else {
        q = query(diasRef,
            where("Nombre_Especial", "!=", "Unnamed Day"),
            orderBy("Nombre_Especial", "asc"),
            limit(pageSize)
        );
    }
    
    const querySnapshot = await getDocs(q);
    
    const items = [];
    querySnapshot.forEach(doc => {
        items.push(_formatStoreItem(doc, doc.id, true)); // true = isDay
    });

    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    // Check for more
    let hasMore = false;
    if (lastVisible) {
        const nextQuery = query(diasRef,
            where("Nombre_Especial", "!=", "Unnamed Day"),
            orderBy("Nombre_Especial", "asc"),
            startAfter(lastVisible),
            limit(1)
        );
        const nextSnapshot = await getDocs(nextQuery);
        hasMore = !nextSnapshot.empty;
    }

    return { items, lastVisible, hasMore };
}


// --- 5. Helper Functions ---

/**
 * (Private) Formats an item for the Store list
 * @param {DocumentSnapshot} docSnap - The document snapshot
 * @param {string} diaId - The day ID
 * @param {boolean} [isDay=false] - true if it's a Day document
 * @returns {Object} - Formatted object for the UI
 */
function _formatStoreItem(docSnap, diaId, isDay = false) {
    const data = docSnap.data();
    if (isDay) {
        return {
            id: docSnap.id,
            diaId: docSnap.id,
            type: 'Names', // UI Type
            Nombre_Dia: data.Nombre_Dia,
            Nombre_Especial: data.Nombre_Especial
        };
    } else {
        return {
            id: docSnap.id,
            diaId: diaId, // The parent day ID
            ...data
        };
    }
}


// --- Module Exports ---
export {
    checkAndRunApp,
    migrateDayNamesToEnglish, // Export the new function
    loadAllDaysData,
    loadMemoriesForDay,
    saveDayName,
    saveMemory,
    deleteMemory,
    searchMemories,
    getTodaySpotlight,
    getMemoriesByType,
    getNamedDays
};

