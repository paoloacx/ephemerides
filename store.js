/* store.js - v3.1 (Con Collection Group Query) */

import { db } from './firebase.js';
import {
    collection, getDocs, doc, updateDoc,
    writeBatch, setDoc, deleteDoc, Timestamp, query, orderBy, addDoc,
    collectionGroup, where, limit, startAfter // ¡Nuevas importaciones!
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

/**
 * Carga TODOS los documentos de la colección 'Dias'.
 * (Se sigue usando para el arranque inicial y 'shuffle').
 */
export async function loadAllDaysData() {
// ... (código existente sin cambios)
    const diasRef = collection(db, "Dias");
    const checkSnapshot = await getDocs(diasRef);
    const count = checkSnapshot.size;
// ... (código existente sin cambios)
    
    let docs = [];
    checkSnapshot.forEach((doc) => {
// ... (código existente sin cambios)
        if (doc.id?.length === 5 && doc.id.includes('-')) {
            docs.push({ id: doc.id, ...doc.data() });
        }
    });
// ... (código existente sin cambios)
    
    // Asegurarse de que están ordenados
    docs.sort((a, b) => a.id.localeCompare(b.id));
// ... (código existente sin cambios)
    return { docs, count };
}

/**
 * (Función helper) Borra todos los documentos de una colección.
// ... (código existente sin cambios)
 */
async function deleteCollection(collectionRef) {
    const oldDocsSnapshot = await getDocs(collectionRef);
// ... (código existente sin cambios)
    if (oldDocsSnapshot.empty) {
        return 0; // No había nada que borrar
    }
    
    let batch = writeBatch(db);
// ... (código existente sin cambios)
    let deleteCount = 0;
    for (const docSnap of oldDocsSnapshot.docs) {
// ... (código existente sin cambios)
        batch.delete(docSnap.ref);
        deleteCount++;
// ... (código existente sin cambios)
        if (deleteCount >= 400) {
            console.log(`Committing delete batch (${deleteCount})...`);
// ... (código existente sin cambios)
            await batch.commit();
            batch = writeBatch(db);
// ... (código existente sin cambios)
            deleteCount = 0;
        }
    }
    if (deleteCount > 0) {
// ... (código existente sin cambios)
        console.log(`Committing final delete batch (${deleteCount})...`);
        await batch.commit();
// ... (código existente sin cambios)
    }
    return oldDocsSnapshot.size;
}

/**
 * Regenera la base de datos con 366 días limpios.
// ... (código existente sin cambios)
 */
export async function generateCleanDatabase(monthNames, daysInMonth) {
    console.log("--- Starting Regeneration ---");
// ... (código existente sin cambios)
    const diasRef = collection(db, "Dias");
    try {
        console.log("Deleting 'Dias'...");
// ... (código existente sin cambios)
        const deleted = await deleteCollection(diasRef);
        console.log(`Deletion complete (${deleted}).`);
// ... (código existente sin cambios)
    } catch(e) {
        console.error("Error deleting collection:", e);
// ... (código existente sin cambios)
        throw e;
    }

    console.log("Generating 366 clean days...");
// ... (código existente sin cambios)
    let genBatch = writeBatch(db);
    let ops = 0, created = 0;
// ... (código existente sin cambios)
    try {
        for (let m = 0; m < 12; m++) {
// ... (código existente sin cambios)
            const monthNum = m + 1, monthStr = monthNum.toString().padStart(2, '0');
            const numDays = daysInMonth[m];
// ... (código existente sin cambios)
            for (let d = 1; d <= numDays; d++) {
                const dayStr = d.toString().padStart(2, '0');
// ... (código existente sin cambios)
                const diaId = `${monthStr}-${dayStr}`;
                const diaData = {
// ... (código existente sin cambios)
                    Nombre_Dia: `${d} ${monthNames[m]}`,
                    Icono: '',
// ... (código existente sin cambios)
                    Nombre_Especial: "Unnamed Day"
                };
                const docRef = doc(db, "Dias", diaId);
// ... (código existente sin cambios)
                genBatch.set(docRef, diaData);
                ops++;
// ... (código existente sin cambios)
                created++;
                if (ops >= 400) {
// ... (código existente sin cambios)
                    console.log(`Committing generate batch (${ops})...`);
                    await genBatch.commit();
// ... (código existente sin cambios)
                    genBatch = writeBatch(db);
                    ops = 0;
// ... (código existente sin cambios)
                }
            }
        }
        if (ops > 0) {
// ... (código existente sin cambios)
            console.log(`Committing final generate batch (${ops})...`);
            await genBatch.commit();
// ... (código existente sin cambios)
        }
        console.log(`--- Regeneration complete: ${created} days created ---`);
// ... (código existente sin cambios)
        return created;
    } catch(e) {
// ... (código existente sin cambios)
        console.error("Error generating days:", e);
        throw e;
// ... (código existente sin cambios)
    }
}


/**
 * Busca memorias (LENTO, N+1 queries).
// ... (código existente sin cambios)
 * (Se mantiene para la búsqueda por texto 'contains').
 */
export async function searchMemories(allDaysData, term) {
// ... (código existente sin cambios)
    let results = [];
    try {
        // Esta es la parte LENTA (N+1 queries)
// ... (código existente sin cambios)
        for (const dia of allDaysData) {
            const memSnapshot = await getDocs(collection(db, "Dias", dia.id, "Memorias"));
// ... (código existente sin cambios)
            memSnapshot.forEach(memDoc => {
                const memoria = {
// ... (código existente sin cambios)
                    diaId: dia.id,
                    diaNombre: dia.Nombre_Dia,
// ... (código existente sin cambios)
                    id: memDoc.id,
                    ...memDoc.data()
// ... (código existente sin cambios)
                };
                
                let searchableText = memoria.Descripcion || '';
// ... (código existente sin cambios)
                if (memoria.LugarNombre) searchableText += ' ' + memoria.LugarNombre;
                if (memoria.CancionInfo) searchableText += ' ' + memoria.CancionInfo;
// ... (código existente sin cambios)
                if (memoria.Nombre_Especial) searchableText += ' ' + memoria.Nombre_Especial;

                if (searchableText.toLowerCase().includes(term)) {
// ... (código existente sin cambios)
                    results.push(memoria);
                }
            });
// ... (código existente sin cambios)
        }
        // Ordenar resultados por fecha (más reciente primero)
        results.sort((a, b) => (b.Fecha_Original?.toDate() ?? 0) - (a.Fecha_Original?.toDate() ?? 0));
// ... (código existente sin cambios)
        return results;
    } catch (e) {
// ... (código existente sin cambios)
        console.error("Search Error:", e);
        throw e;
// ... (código existente sin cambios)
    }
}

/**
 * Obtiene todas las memorias para un día específico.
// ... (código existente sin cambios)
 */
export async function getMemoriesForDay(diaId) {
    const memoriasRef = collection(db, "Dias", diaId, "Memorias");
// ... (código existente sin cambios)
    const q = query(memoriasRef, orderBy("Fecha_Original", "desc"));
    const querySnapshot = await getDocs(q);
    
    let memories = [];
// ... (código existente sin cambios)
    querySnapshot.forEach((docSnap) => {
        memories.push({ id: docSnap.id, ...docSnap.data() });
    });
// ... (código existente sin cambios)
    return memories;
}

/**
 * Guarda (añade o actualiza) una memoria.
// ... (código existente sin cambios)
 * @param {string|null} editingId - ID de la memoria si se está editando.
 */
export async function saveMemory(diaId, memoryData, editingId) {
// ... (código existente sin cambios)
    const memoriasRef = collection(db, "Dias", diaId, "Memorias");
    if (editingId) {
// ... (código existente sin cambios)
        const memRef = doc(db, "Dias", diaId, "Memorias", editingId);
        await updateDoc(memRef, memoryData);
// ... (código existente sin cambios)
    } else {
        memoryData.Creado_En = Timestamp.now();
// ... (código existente sin cambios)
        await addDoc(memoriasRef, memoryData);
    }
}

/**
 * Borra una memoria.
// ... (código existente sin cambios)
 */
export async function deleteMemory(diaId, memoriaId) {
    const memRef = doc(db, "Dias", diaId, "Memorias", memoriaId);
// ... (código existente sin cambios)
    await deleteDoc(memRef);
}

/**
 * Actualiza el Nombre_Especial de un día.
// ... (código existente sin cambios)
 */
export async function updateDayName(diaId, nuevoNombre) {
    const diaRef = doc(db, "Dias", diaId);
    const nombreGuardado = nuevoNombre || "Unnamed Day";
// ... (código existente sin cambios)
    await updateDoc(diaRef, { Nombre_Especial: nombreGuardado });
    return nombreGuardado;
}


// --- ¡NUEVAS FUNCIONES PARA EL ALMACÉN (STORE)! ---

const PAGE_SIZE = 10;

/**
 * Obtiene recuerdos paginados por tipo usando una Collection Group Query.
 * @param {string} type - El tipo de memoria ('Lugar', 'Musica', 'Imagen', 'Texto').
 * @param {object|null} lastDoc - El último documento de la página anterior (para paginación).
 * @returns {Promise<{memories: Array, lastDoc: object|null}>}
 */
export async function getMemoriesByType(type, lastDoc = null) {
    console.log(`Querying collection group 'Memorias' for Type: ${type}, starting after:`, lastDoc);
    
    // 1. Referencia al Collection Group 'Memorias'
    const memRef = collectionGroup(db, 'Memorias');
    
    // 2. Construir la consulta
    let q;
    if (lastDoc) {
        // Consulta para la siguiente página
        q = query(memRef,
            where('Tipo', '==', type),
            orderBy('Fecha_Original', 'desc'),
            startAfter(lastDoc),
            limit(PAGE_SIZE)
        );
    } else {
        // Consulta para la primera página
        q = query(memRef,
            where('Tipo', '==', type),
            orderBy('Fecha_Original', 'desc'),
            limit(PAGE_SIZE)
        );
    }

    try {
        // 3. Ejecutar la consulta
        const querySnapshot = await getDocs(q);
        
        let memories = [];
        querySnapshot.forEach((doc) => {
            // El ID del documento padre (el día) está en la ruta
            const diaId = doc.ref.parent.parent.id;
            memories.push({
                id: doc.id,
                diaId: diaId, // Añadimos el diaId
                ...doc.data()
            });
        });

        // 4. Obtener el último documento para la paginación
        const newLastDoc = querySnapshot.docs.length === PAGE_SIZE ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;

        return { memories, lastDoc: newLastDoc };

    } catch (error) {
        console.error("¡ERROR DE COLLECTION GROUP!", error);
        console.warn("Esto probablemente requiera un ÍNDICE. Revisa la consola de Chrome para ver un enlace de creación de índice.");
        throw error;
    }
}

/**
 * Obtiene días con nombre especial, paginado.
 * @param {object|null} lastDoc - El último documento de la página anterior.
 * @returns {Promise<{memories: Array, lastDoc: object|null}>}
 */
export async function getNamedDays(lastDoc = null) {
    console.log("Querying root 'Dias' for Nombre_Especial, starting after:", lastDoc);
    
    const diasRef = collection(db, 'Dias');
    
    let q;
    if (lastDoc) {
        q = query(diasRef,
            where('Nombre_Especial', '!=', 'Unnamed Day'),
            orderBy('Nombre_Especial'), // Ordenamos por nombre
            startAfter(lastDoc),
            limit(PAGE_SIZE)
        );
    } else {
        q = query(diasRef,
            where('Nombre_Especial', '!=', 'Unnamed Day'),
            orderBy('Nombre_Especial'),
            limit(PAGE_SIZE)
        );
    }
    
    try {
        const querySnapshot = await getDocs(q);
        
        let memories = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            memories.push({
                id: doc.id,
                diaId: doc.id,
                diaNombre: data.Nombre_Dia,
                Nombre_Especial: data.Nombre_Especial,
                Tipo: 'Nombre_Especial', // Tipo inventado para la UI
                Fecha_Original: doc.id // Usamos el ID como pseudo-fecha para mostrar
            });
        });
        
        const newLastDoc = querySnapshot.docs.length === PAGE_SIZE ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;

        return { memories, lastDoc: newLastDoc };

    } catch (error) {
        console.error("¡ERROR al buscar Nombres de Día!", error);
        throw error;
    }
}

