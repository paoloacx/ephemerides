/*
 * store.js (v2.0)
 * Módulo de Lógica de Firestore.
 * Se encarga de leer y escribir en la base de datos.
 */

// Importaciones de Firebase (desde la conexión central)
import { db } from './firebase.js';
import {
    collection, getDocs, doc, updateDoc,
    writeBatch, setDoc, deleteDoc, Timestamp, query,
    orderBy, addDoc, getDoc, limit, collectionGroup,
    where, startAfter
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// --- Constantes ---
const DIAS_COLLECTION = "Dias";
const MEMORIAS_COLLECTION = "Memorias";
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// --- 1. Lógica de Inicialización (Check/Repair) ---

/**
 * Verifica la base de datos y la repara si es necesario.
 * @param {function} onProgress - Callback para reportar progreso (ej. ui.setLoading)
 */
async function checkAndRunApp(onProgress) {
    console.log("Store: Verificando base de datos...");
    const diasRef = collection(db, DIAS_COLLECTION);
    const checkSnapshot = await getDocs(diasRef);
    const currentDocCount = checkSnapshot.size;
    
    console.log(`Store: Documentos encontrados en 'Dias': ${currentDocCount}`);
    
    if (currentDocCount < 366) {
        console.warn(`Store: Reparando... Se encontraron ${currentDocCount} docs, se esperaban 366.`);
        onProgress(`Reparando... ${currentDocCount}/366`);
        await _generateCleanDatabase(onProgress);
    } else {
        console.log("Store: Base de datos verificada (>= 366 días).");
    }
}

/**
 * (Privado) Borra la colección 'Dias' y genera 366 días limpios.
 * @param {function} onProgress - Callback para reportar progreso
 */
async function _generateCleanDatabase(onProgress) {
    const diasRef = collection(db, DIAS_COLLECTION);
    
    // 1. Borrar todos los documentos existentes
    try {
        onProgress("Borrando datos antiguos...");
        console.log("Store: Borrando 'Dias'...");
        const oldDocsSnapshot = await getDocs(diasRef);
        
        if (!oldDocsSnapshot.empty) {
            let batch = writeBatch(db);
            let deleteCount = 0;
            
            for (const docSnap of oldDocsSnapshot.docs) {
                batch.delete(docSnap.ref);
                deleteCount++;
                if (deleteCount >= 400) {
                    console.log(`Store: Commit borrado batch (${deleteCount})...`);
                    await batch.commit();
                    batch = writeBatch(db);
                    deleteCount = 0;
                }
            }
            if (deleteCount > 0) {
                console.log(`Store: Commit borrado final batch (${deleteCount})...`);
                await batch.commit();
            }
            console.log(`Store: Borrado completo (${oldDocsSnapshot.size}).`);
        } else {
            console.log("Store: La colección 'Dias' ya estaba vacía.");
        }
    } catch (e) {
        console.error("Store: Error borrando colección:", e);
        throw e; // Relanzar error
    }

    // 2. Generar 366 días limpios
    console.log("Store: Generando 366 días limpios...");
    onProgress("Generando 366 días limpios...");
    
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
                
                const diaData = {
                    Nombre_Dia: `${d} de ${MONTH_NAMES[m]}`,
                    Icono: '', // Campo legado, mantener
                    Nombre_Especial: "Unnamed Day",
                    tieneMemorias: false // Flag de optimización
                };
                
                const docRef = doc(db, DIAS_COLLECTION, diaId);
                genBatch.set(docRef, diaData);
                ops++;
                created++;
                
                if (created % 50 === 0) {
                    onProgress(`Generando ${created}/366...`);
                }

                if (ops >= 400) {
                    console.log(`Store: Commit generación batch (${ops})...`);
                    await genBatch.commit();
                    genBatch = writeBatch(db);
                    ops = 0;
                }
            }
        }
        
        if (ops > 0) {
            console.log(`Store: Commit generación final batch (${ops})...`);
            await genBatch.commit();
        }
        
        console.log(`Store: Regeneración completa: ${created} días creados.`);
        onProgress(`Base de datos regenerada: ${created} días.`);
        
    } catch (e) {
        console.error("Store: Error generando días:", e);
        throw e; // Relanzar error
    }
}

// --- 2. Lógica de Lectura (Días y Memorias) ---

/**
 * Carga todos los 366+ documentos de días.
 * @returns {Array} - Array de objetos de día.
 */
async function loadAllDaysData() {
    const q = query(collection(db, DIAS_COLLECTION), orderBy("Nombre_Dia")); // Ordenar por Nombre_Dia (o id)
    const querySnapshot = await getDocs(q);
    
    const allDays = [];
    querySnapshot.forEach((doc) => {
        // Asegurarse de que solo se añaden días con ID de 5 chars (ej. "01-01")
        if (doc.id.length === 5 && doc.id.includes('-')) {
            allDays.push({ id: doc.id, ...doc.data() });
        }
    });
    
    // Ordenar por ID ("01-01", "01-02", ...)
    allDays.sort((a, b) => a.id.localeCompare(b.id));
    
    console.log(`Store: Cargados ${allDays.length} días.`);
    return allDays;
}

/**
 * Carga todas las memorias para un día específico.
 * @param {string} diaId - El ID del día (ej. "10-26").
 * @returns {Array} - Array de objetos de memoria.
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
 * Carga los datos del "Spotlight" para el día de hoy.
 * @param {string} todayId - El ID del día de hoy (ej. "10-26").
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
                diaId: todayId, // Añadir diaId para el contexto
                ...doc.data()
            });
        });
        
        return { dayName, memories };
        
    } catch (err) {
        console.error("Store: Error cargando spotlight:", err);
        // Devolver un estado seguro para que la UI no falle
        return { dayName: 'Error al cargar', memories: [] };
    }
}

// --- 3. Lógica de Escritura (Días y Memorias) ---

/**
 * Guarda/Actualiza el nombre especial de un día.
 * @param {string} diaId - El ID del día.
 * @param {string} newName - El nuevo nombre.
 */
async function saveDayName(diaId, newName) {
    const diaRef = doc(db, DIAS_COLLECTION, diaId);
    const finalName = newName && newName.trim() !== '' ? newName.trim() : "Unnamed Day";
    await updateDoc(diaRef, {
        Nombre_Especial: finalName
    });
}

/**
 * Guarda una memoria nueva o actualiza una existente.
 * @param {string} diaId - El ID del día al que pertenece.
 * @param {Object} memoryData - Los datos de la memoria.
 * @param {string|null} memoryId - El ID de la memoria (null si es nueva).
 */
async function saveMemory(diaId, memoryData, memoryId) {
    const diaRef = doc(db, DIAS_COLLECTION, diaId);
    
    // Convertir la fecha de JS (que viene de main.js) a Timestamp de Firebase
    if (memoryData.Fecha_Original && !(memoryData.Fecha_Original instanceof Timestamp)) {
        memoryData.Fecha_Original = Timestamp.fromDate(memoryData.Fecha_Original);
    }

    // Limpiar datos que no van a Firestore
    delete memoryData.file; // No guardar el objeto File
    if (memoryId) {
        // --- Actualizar Memoria Existente ---
        delete memoryData.id; // No guardar el id dentro del documento
        const memRef = doc(db, DIAS_COLLECTION, diaId, MEMORIAS_COLLECTION, memoryId);
        await updateDoc(memRef, memoryData);
        
    } else {
        // --- Añadir Memoria Nueva ---
        memoryData.Creado_En = Timestamp.now(); // Añadir fecha de creación
        const memRef = collection(db, DIAS_COLLECTION, diaId, MEMORIAS_COLLECTION);
        await addDoc(memRef, memoryData);
    }
    
    // Actualizar el flag 'tieneMemorias' en el día (optimización)
    await updateDoc(diaRef, {
        tieneMemorias: true
    });
}

/**
 * Borra una memoria.
 * @param {string} diaId - El ID del día.
 * @param {string} memId - El ID de la memoria.
 */
async function deleteMemory(diaId, memId) {
    const memRef = doc(db, DIAS_COLLECTION, diaId, MEMORIAS_COLLECTION, memId);
    await deleteDoc(memRef);
    
    // Comprobar si quedan más memorias, si no, actualizar flag
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

// --- 4. Lógica de Búsqueda y "Almacén" ---

/**
 * (LENTO) Busca en todas las memorias un término.
 * @param {string} term - Término de búsqueda (en minúsculas).
 * @returns {Array} - Array de memorias encontradas.
 */
async function searchMemories(term) {
    // Esta es la búsqueda "lenta" N+1 (366 consultas)
    // TODO: Reemplazar con CollectionGroup si se necesita mejor rendimiento
    
    const diasRef = collection(db, DIAS_COLLECTION);
    const diasSnapshot = await getDocs(diasRef);
    
    let results = [];
    
    // Usamos Promise.all para paralelizar las 366 búsquedas
    const searchPromises = diasSnapshot.docs.map(async (diaDoc) => {
        const diaId = diaDoc.id;
        if (diaId.length !== 5 || !diaId.includes('-')) return; // Omitir docs inválidos
        
        const memoriasRef = collection(db, DIAS_COLLECTION, diaId, MEMORIAS_COLLECTION);
        const memSnapshot = await getDocs(memoriasRef);
        
        memSnapshot.forEach(memDoc => {
            const memoria = { 
                id: memDoc.id,
                diaId: diaId,
                Nombre_Dia: diaDoc.data().Nombre_Dia,
                ...memDoc.data()
            };
            
            // Construir texto de búsqueda
            let searchableText = memoria.Descripcion || '';
            if (memoria.LugarNombre) searchableText += ' ' + memoria.LugarNombre;
            if (memoria.CancionInfo) searchableText += ' ' + memoria.CancionInfo;
            
            if (searchableText.toLowerCase().includes(term)) {
                results.push(memoria);
            }
        });
    });
    
    await Promise.all(searchPromises);
    
    // Ordenar resultados (ej. por fecha original)
    results.sort((a, b) => {
        const dateA = a.Fecha_Original ? a.Fecha_Original.toMillis() : 0;
        const dateB = b.Fecha_Original ? b.Fecha_Original.toMillis() : 0;
        return dateB - dateA; // Más reciente primero
    });
    
    return results;
}

/**
 * (RÁPIDO) Obtiene memorias por tipo, paginadas.
 * @param {string} type - 'Lugar', 'Musica', 'Texto', 'Imagen'
 * @param {number} pageSize - Límite de items
 * @param {DocumentSnapshot} [lastVisibleDoc=null] - El último doc (para paginación)
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
        // Necesitamos encontrar el diaId (padre) para el contexto
        const diaId = doc.ref.parent.parent.id;
        items.push(_formatStoreItem(doc, diaId));
    });
    
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    // Comprobar si hay más
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
 * (RÁPIDO) Obtiene días con nombre especial, paginados.
 * @param {number} pageSize - Límite de items
 * @param {DocumentSnapshot} [lastVisibleDoc=null] - El último doc (para paginación)
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
    
    // Comprobar si hay más
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


// --- 5. Funciones de Ayuda (Helpers) ---

/**
 * (Privado) Formatea un item para la lista del Almacén
 * @param {DocumentSnapshot} docSnap - El snapshot del documento
 * @param {string} diaId - El ID del día
 * @param {boolean} [isDay=false] - true si es un documento de Día
 * @returns {Object} - Objeto formateado para la UI
 */
function _formatStoreItem(docSnap, diaId, isDay = false) {
    const data = docSnap.data();
    if (isDay) {
        return {
            id: docSnap.id,
            diaId: docSnap.id,
            type: 'Nombres', // Tipo para la UI
            Nombre_Dia: data.Nombre_Dia,
            Nombre_Especial: data.Nombre_Especial
        };
    } else {
        return {
            id: docSnap.id,
            diaId: diaId, // El ID del día padre
            ...data
            // Nota: Fecha_Original sigue siendo un Timestamp, la UI lo maneja
        };
    }
}


// --- Exportaciones del Módulo ---
// Exportamos todas las funciones que main.js necesita
export {
    checkAndRunApp,
    loadAllDaysData,
    loadMemoriesForDay,
    saveDayName,
    saveMemory,
    deleteMemory,
    searchMemories,
    getTodaySpotlight, // <-- ¡AQUÍ ESTÁ!
    getMemoriesByType,
    getNamedDays
};

