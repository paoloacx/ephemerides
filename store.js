/* store.js */
/* Módulo para toda la interacción con la base de datos (Firestore) */

import { db } from './firebase.js';
import {
    collection, getDocs, doc, updateDoc,
    writeBatch, setDoc, deleteDoc, Timestamp, query, orderBy, addDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

/**
 * Genera una base de datos limpia con 366 días.
 * @param {string[]} monthNames - Array con los nombres de los meses.
 * @param {number[]} daysInMonth - Array con los días de cada mes.
 */
export async function generateCleanDatabase(monthNames, daysInMonth) {
    console.log("--- Starting Regeneration ---");
    const diasRef = collection(db, "Dias");
    
    // 1. Borrar datos antiguos
    try {
        console.log("Deleting 'Dias'...");
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
            console.log(`Deletion complete (${oldDocsSnapshot.size}).`);
        } else {
            console.log("'Dias' collection was already empty.");
        }
    } catch(e) {
        console.error("Error deleting collection:", e);
        throw e; // Lanza el error para que checkAndRunApp lo coja
    }

    // 2. Generar días nuevos
    console.log("Generating 366 clean days...");
    let genBatch = writeBatch(db);
    let ops = 0, created = 0;
    try {
        for (let m = 0; m < 12; m++) {
            const monthNum = m + 1, monthStr = monthNum.toString().padStart(2, '0');
            const numDays = daysInMonth[m];
            for (let d = 1; d <= numDays; d++) {
                const dayStr = d.toString().padStart(2, '0');
                const diaId = `${monthStr}-${dayStr}`;
                const diaData = {
                    Nombre_Dia: `${d} ${monthNames[m]}`,
                    Icono: '',
                    Nombre_Especial: "Unnamed Day"
                };
                const docRef = doc(db, "Dias", diaId);
                genBatch.set(docRef, diaData);
                ops++;
                created++;
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
        console.log(`--- Regeneration complete: ${created} days created ---`);
        return created; // Devuelve el número de días creados
    } catch(e) {
        console.error("Error generating days:", e);
        throw e;
    }
}

/**
 * Carga todos los documentos de la colección "Dias"
 * @returns {Promise<{docs: Array, count: number}>} Un objeto con los documentos y el conteo.
 */
export async function loadAllDaysData() {
    const diasSnapshot = await getDocs(collection(db, "Dias"));
    let allDaysData = [];
    diasSnapshot.forEach((doc) => {
        if (doc.id?.length === 5 && doc.id.includes('-')) {
            allDaysData.push({ id: doc.id, ...doc.data() });
        }
    });
    
    if (allDaysData.length > 0) {
        allDaysData.sort((a, b) => a.id.localeCompare(b.id));
    }
    
    return {
        docs: allDaysData,
        count: diasSnapshot.size // Devuelve el conteo total original
    };
}

/**
 * Busca memorias que coincidan con el término.
 * @param {Array} allDaysData - El array completo de días para buscar.
 * @param {string} term - El término de búsqueda.
 * @returns {Promise<Array>} Un array de memorias que coinciden.
 */
export async function searchMemories(allDaysData, term) {
    let results = [];
    for (const dia of allDaysData) {
        const memSnapshot = await getDocs(collection(db, "Dias", dia.id, "Memorias"));
        memSnapshot.forEach(memDoc => {
            const memoria = { diaId: dia.id, diaNombre: dia.Nombre_Dia, id: memDoc.id, ...memDoc.data() };
            let searchableText = memoria.Descripcion || '';
            if (memoria.LugarNombre) searchableText += ' ' + memoria.LugarNombre;
            if (memoria.CancionInfo) searchableText += ' ' + memoria.CancionInfo;
            
            if (searchableText.toLowerCase().includes(term)) {
                results.push(memoria);
            }
        });
    }
    results.sort((a, b) => (b.Fecha_Original?.toDate() ?? 0) - (a.Fecha_Original?.toDate() ?? 0));
    return results;
}

/**
 * Obtiene todas las memorias para un día específico.
 * @param {string} diaId - El ID del día (ej. "10-26").
 * @returns {Promise<Array>} Un array con las memorias ordenadas.
 */
export async function getMemoriesForDay(diaId) {
    const memories = [];
    const memoriasRef = collection(db, "Dias", diaId, "Memorias");
    const q = query(memoriasRef, orderBy("Fecha_Original", "desc"));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach((docSnap) => {
        memories.push({ id: docSnap.id, ...docSnap.data() });
    });
    return memories;
}

/**
 * Guarda o actualiza una memoria en Firestore.
 * @param {string} diaId - El ID del día (ej. "10-26").
 * @param {object} memoryData - El objeto de datos de la memoria.
 * @param {string|null} editingMemoryId - El ID de la memoria si se está editando, o null si es nueva.
 */
export async function saveMemory(diaId, memoryData, editingMemoryId) {
    if (editingMemoryId) {
        // Actualizar memoria existente
        const memRef = doc(db, "Dias", diaId, "Memorias", editingMemoryId);
        await updateDoc(memRef, memoryData);
    } else {
        // Añadir memoria nueva
        memoryData.Creado_En = Timestamp.now(); // Añadir timestamp de creación
        const memoriasRef = collection(db, "Dias", diaId, "Memorias");
        await addDoc(memoriasRef, memoryData);
    }
}

/**
 * Borra una memoria de Firestore.
 * @param {string} diaId - El ID del día (ej. "10-26").
 * @param {string} memoriaId - El ID de la memoria a borrar.
 */
export async function deleteMemory(diaId, memoriaId) {
    const memRef = doc(db, "Dias", diaId, "Memorias", memoriaId);
    await deleteDoc(memRef);
}

/**
 * Actualiza el Nombre_Especial de un día.
 * @param {string} diaId - El ID del día (ej. "10-26").
 * @param {string} nuevoNombre - El nuevo nombre para el día.
 */
export async function updateDayName(diaId, nuevoNombre) {
    const diaRef = doc(db, "Dias", diaId);
    const nombreFinal = nuevoNombre || "Unnamed Day";
    await updateDoc(diaRef, { Nombre_Especial: nombreFinal });
    return nombreFinal; // Devuelve el nombre que se guardó
}
