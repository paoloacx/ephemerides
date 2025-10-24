/* app.js - v4.1 - Auto-Reparador COMPATIBLE (Sin getCountFromServer) */

// Importaciones necesarias (quitamos getCountFromServer)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
    getFirestore, collection, getDocs, doc, updateDoc,
    writeBatch, setDoc, deleteDoc, Timestamp, query, orderBy, addDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// --- Configuración de Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyBrd-8qaBfSplBjj74MNuKP8UWYmr8RaJA",
  authDomain: "ephemerides-2005.firebaseapp.com",
  projectId: "ephemerides-2005",
  storageBucket: "ephemerides-2005.firebasestorage.app", // Corregido storageBucket
  messagingSenderId: "360961314777",
  appId: "1:360961314777:web:809d9e66535acb292d13c8",
  measurementId: "G-BZC9FRYCJW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const appContent = document.getElementById("app-content");
const monthNameEl = document.getElementById("month-name");
const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // Includes leap year Feb 29

let allDaysData = [];
let currentMonthIndex = new Date().getMonth();

// --- Función Principal (Auto-Reparadora - Versión Compatible) ---
async function checkAndRunApp() {
    console.log("Iniciando Verificación/Reparación v4.1 (Compatible)...");
    appContent.innerHTML = "<p>Verificando base de datos...</p>";
    try {
        const diasRef = collection(db, "Dias");
        // Usamos getDocs y .size para contar, compatible con v9.6.1
        const checkSnapshot = await getDocs(diasRef);
        const currentDocCount = checkSnapshot.size;
        console.log(`Documentos encontrados en 'Dias': ${currentDocCount}`);

        if (currentDocCount !== 366) {
            console.warn(`Se encontraron ${currentDocCount} documentos. Se necesita reparar (esperado 366).`);
            await generateCleanDatabase(); // Llama a la función de regeneración
        } else {
            console.log("Base de datos verificada (366 días).");
        }
        // Siempre carga los datos después de verificar/reparar
        await loadDataAndDrawCalendar();
    } catch (e) {
        appContent.innerHTML = `<p class="error">Error crítico al iniciar: ${e.message}</p>`;
        console.error("Error en checkAndRunApp:", e);
    }
}


// --- Generación/Reparación de la Base (Compatible) ---
async function generateCleanDatabase() {
     console.log("--- Iniciando Regeneración ---");
    const diasRef = collection(db, "Dias");
    try {
        console.log("Borrando colección 'Dias' existente...");
        appContent.innerHTML = "<p>Borrando datos antiguos...</p>";
        // Borrado en lotes para evitar errores con colecciones grandes
        const oldDocsSnapshot = await getDocs(diasRef);
        if (!oldDocsSnapshot.empty) {
            let batch = writeBatch(db);
            let deleteCount = 0;
            oldDocsSnapshot.forEach(docSnap => {
                batch.delete(docSnap.ref);
                deleteCount++;
                // Commit batch every 499 deletes to stay under limits
                if (deleteCount >= 499) {
                    batch.commit();
                    batch = writeBatch(db); // Start a new batch
                    deleteCount = 0;
                }
            });
            // Commit any remaining deletes
            if (deleteCount > 0) await batch.commit();
            console.log(`Borrado completado (${oldDocsSnapshot.size} documentos).`);
        } else {
            console.log("La colección 'Dias' ya estaba vacía.");
        }
    } catch(e) {
        console.error("Error borrando colección:", e);
        appContent.innerHTML = `<p class="error">Error al borrar datos antiguos: ${e.message}</p>`;
        // Detener si falla la limpieza es crucial
        throw e;
    }

    console.log("Generando 366 días limpios...");
    appContent.innerHTML = "<p>Generando 366 días limpios...</p>";
    // Reiniciar lote para escritura
    let batch = writeBatch(db);
    let ops = 0; // Operations in current batch
    let created = 0; // Total documents created
    try {
        for (let m = 0; m < 12; m++) { // Iterate through months (0-11)
            const monthNum = m + 1;
            const monthStr = monthNum.toString().padStart(2, '0');
            const numDays = daysInMonth[m]; // Get number of days for the month

            for (let d = 1; d <= numDays; d++) { // Iterate through days
                const dayStr = d.toString().padStart(2, '0');
                const diaId = `${monthStr}-${dayStr}`; // Format ID as MM-DD

                // Data for the document
                const diaData = {
                    Nombre_Dia: `${d} de ${monthNames[m]}`, // e.g., "1 de Enero"
                    Icono: '', // Sin icono por defecto
                    Nombre_Especial: "Día sin nombre" // Default special name
                };

                const docRef = doc(db, "Dias", diaId); // Create document reference
                batch.set(docRef, diaData); // Add set operation to batch
                ops++;
                created++;

                // Log progress every 50 documents
                if(created % 50 === 0) {
                     appContent.innerHTML = `<p>Generando ${diaId}... (${created}/366)</p>`;
                     console.log(`Generando ${diaId}... (${created}/366)`);
                }

                // Commit batch every 499 operations
                if (ops >= 499) {
                    console.log(`Ejecutando lote (${ops})...`);
                    await batch.commit();
                    batch = writeBatch(db); // Start a new batch
                    ops = 0;
                }
            }
        }
        // Commit any remaining operations
        if (ops > 0) {
            console.log(`Ejecutando último lote (${ops})...`);
            await batch.commit();
        }
        console.log(`--- Regeneración completada: ${created} días creados ---`);
        appContent.innerHTML = `<p class="success">✅ ¡Base de datos regenerada con ${created} días!</p>`;
    } catch(e) {
         console.error("Error generando días:", e);
         appContent.innerHTML = `<p class="error">Error al generar días: ${e.message}</p>`;
         // Detener si falla la generación
         throw e;
    }
}


// --- Carga de Datos y Dibujo del Calendario ---
async function loadDataAndDrawCalendar() {
    console.log("Cargando datos de Firebase...");
    appContent.innerHTML = "<p>Cargando calendario...</p>";
    try {
        const diasSnapshot = await getDocs(collection(db, "Dias"));
        allDaysData = []; // Clear previous data
        diasSnapshot.forEach((doc) => {
             // Basic validation
            if (doc.id && doc.id.length === 5 && doc.id.includes('-')) {
                 allDaysData.push({ id: doc.id, ...doc.data() });
            } else {
                console.warn("Documento con ID inválido omitido:", doc.id);
            }
        });

        if (allDaysData.length === 0) {
            // Si después de cargar sigue vacío, algo muy raro pasa
            // Podría ser un error de permisos si las reglas cambiaron
            throw new Error("La base de datos está vacía o los datos son inválidos después de la carga.");
        }
        console.log(`Se cargaron ${allDaysData.length} días válidos.`);

        // Sort data chronologically by ID (MM-DD)
        allDaysData.sort((a, b) => a.id.localeCompare(b.id));
        console.log("Datos ordenados. Primer día:", allDaysData[0]?.id, "Último día:", allDaysData[allDaysData.length-1]?.id);


        configurarNavegacion(); // Setup month navigation buttons
        dibujarMesActual(); // Draw the current month's view
    } catch (e) {
        appContent.innerHTML = `<p class="error">Error al cargar o dibujar el calendario: ${e.message}</p>`;
        console.error("Error en loadDataAndDrawCalendar:", e);
    }
}

// --- Dibujo del Mes Actual (usando filtro numérico) ---
function dibujarMesActual() {
    monthNameEl.textContent = monthNames[currentMonthIndex]; // Update header with month name
    const monthNumberTarget = currentMonthIndex + 1; // Target month number (1-12)
    console.log(`Dibujando mes ${monthNumberTarget} (${monthNames[currentMonthIndex]})`);

    // Filter days for the current month using numeric comparison
    const diasDelMes = allDaysData.filter(dia => {
        try {
            // Extract month part (first two chars), parse as integer
            const monthPart = parseInt(dia.id.substring(0, 2), 10);
            return monthPart === monthNumberTarget;
        } catch (e) {
            console.error(`Error parsing ID '${dia.id}'`, e);
            return false; // Exclude if ID format is wrong
        }
    });

    console.log(`Se encontraron ${diasDelMes.length} días para el mes ${monthNumberTarget}.`);

    appContent.innerHTML = `<div class="calendario-grid" id="grid-dias"></div>`; // Clear previous grid
    const grid = document.getElementById("grid-dias");

    if (diasDelMes.length === 0) {
        // Handle case where no days are found (shouldn't happen with correct data)
        grid.innerHTML = "<p>No se encontraron días para este mes.</p>";
        console.error(`No days found for month ${monthNumberTarget}. Data issue?`);
        return;
    }

    // Check if the number of days found matches expected days for the month
    const diasEsperados = daysInMonth[currentMonthIndex];
    if (diasDelMes.length !== diasEsperados) {
        console.warn(`ALERTA: Se encontraron ${diasDelMes.length} días para ${monthNames[currentMonthIndex]}, pero se esperaban ${diasEsperados}. Revisar datos.`);
        // No detenemos la ejecución, solo avisamos
    }

    // Create and append buttons for each day of the month
    diasDelMes.forEach(dia => {
        const btn = document.createElement("button");
        btn.className = "dia-btn";
        // Estilo Hoja: Número grande, nombre especial abajo. SIN ICONO EMOJI
        btn.innerHTML = `
            <span class="dia-numero">${dia.id.substring(3)}</span>
            <span class="nombre-especial">${(dia.Nombre_Especial && dia.Nombre_Especial !== 'Día sin nombre') ? dia.Nombre_Especial : ''}</span>
        `;
        btn.dataset.diaId = dia.id; // Store day ID for reference
        btn.addEventListener('click', () => abrirModalEdicion(dia)); // Attach click listener
        grid.appendChild(btn);
    });
    console.log(`Se dibujaron ${diasDelMes.length} botones.`);
}

// --- Configuración Navegación Meses (sin cambios) ---
function configurarNavegacion() {
     document.getElementById("prev-month").onclick = () => {
        currentMonthIndex = (currentMonthIndex - 1 + 12) % 12; // Wrap around correctly
        dibujarMesActual();
    };
    document.getElementById("next-month").onclick = () => {
        currentMonthIndex = (currentMonthIndex + 1) % 12; // Wrap around correctly
        dibujarMesActual();
    };
}

// --- MODAL Y GESTIÓN DE MEMORIAS (v6.0 - SIN CAMBIOS DESDE LA ÚLTIMA VERSIÓN FUNCIONAL) ---
// (Incluye CRUD completo, animación, iconos SVG, etc.)

// --- Iconos SVG ---
const editIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg>`;
const deleteIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m3 0l-.5 8.5a.5.5 0 1 0 .998.06l.5-8.5a.5.5 0 1 0-.998.06m3 .5l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Z"/></svg>`;

let currentMemories = [];
let editingMemoryId = null;

async function abrirModalEdicion(dia) {
    console.log("Abriendo modal para:", dia.id);
    let modal = document.getElementById('edit-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'edit-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-section">
                    <h3 id="modal-title"></h3>
                    <p>Nombra este día:</p>
                    <input type="text" id="nombre-especial-input" placeholder="Ej: Día de la pizza" maxlength="25">
                     <p id="save-status"></p>
                </div>
                <div class="modal-section memorias-section">
                    <h4>Memorias de este día:</h4>
                    <div id="memorias-list">Cargando memorias...</div>
                    <form id="add-memoria-form">
                        <label for="memoria-fecha">Fecha Original:</label>
                        <input type="date" id="memoria-fecha" required>
                        <label for="memoria-desc">Descripción:</label>
                        <textarea id="memoria-desc" placeholder="Escribe tu recuerdo..." required maxlength="500"></textarea>
                        <button type="submit" id="add-memoria-btn" class="aqua-button">Añadir Memoria</button>
                         <p id="memoria-status"></p>
                    </form>
                </div>
                <div id="confirm-delete-dialog" style="display: none;">
                    <p id="confirm-delete-text">¿Seguro?</p>
                    <button id="confirm-delete-no" class="aqua-button">Cancelar</button>
                    <button id="confirm-delete-yes" class="aqua-button delete-confirm">Sí, borrar</button>
                </div>
                <div class="modal-main-buttons">
                     <button id="close-btn">Cerrar</button>
                     <button id="save-name-btn">Guardar Nombre</button>
                </div>
            </div>`;
        document.body.appendChild(modal);

        document.getElementById('close-btn').onclick = () => cerrarModal();
        modal.onclick = (e) => { if (e.target.id === 'edit-modal') cerrarModal(); };
        document.getElementById('confirm-delete-no').onclick = () => document.getElementById('confirm-delete-dialog').style.display = 'none';
    }

    resetMemoryForm(); // Resetear siempre al abrir

    document.getElementById('modal-title').textContent = `Editando: ${dia.Nombre_Dia} (${dia.id})`;
    const inputNombreEspecial = document.getElementById('nombre-especial-input');
    inputNombreEspecial.value = dia.Nombre_Especial === 'Día sin nombre' ? '' : dia.Nombre_Especial;
    document.getElementById('save-status').textContent = '';
    document.getElementById('memoria-status').textContent = '';
    document.getElementById('confirm-delete-dialog').style.display = 'none';

    document.getElementById('save-name-btn').onclick = () => guardarNombreEspecial(dia.id, inputNombreEspecial.value.trim());

    const addMemoriaForm = document.getElementById('add-memoria-form');
    addMemoriaForm.onsubmit = async (e) => {
        e.preventDefault();
        const fechaInput = document.getElementById('memoria-fecha').value;
        const descInput = document.getElementById('memoria-desc').value;
        if (editingMemoryId) { await updateMemoria(dia.id, editingMemoryId, fechaInput, descInput.trim()); }
        else { await guardarNuevaMemoria(dia.id, fechaInput, descInput.trim()); }
    };

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);
    await cargarYMostrarMemorias(dia.id);
}

function cerrarModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => { modal.style.display = 'none'; resetMemoryForm(); }, 200);
    }
}

async function cargarYMostrarMemorias(diaId) {
    const memoriasListDiv = document.getElementById('memorias-list');
    memoriasListDiv.innerHTML = 'Cargando...'; currentMemories = [];
    try {
        const memoriasRef = collection(db, "Dias", diaId, "Memorias");
        const q = query(memoriasRef, orderBy("Fecha_Original", "desc"));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) { memoriasListDiv.innerHTML = '<p>No hay memorias.</p>'; return; }
        memoriasListDiv.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const memoria = { id: docSnap.id, ...docSnap.data() }; currentMemories.push(memoria);
            const itemDiv = document.createElement('div'); itemDiv.className = 'memoria-item';
            let fechaStr = 'Fecha desconocida';
            if (memoria.Fecha_Original?.toDate) {
                 try { fechaStr = memoria.Fecha_Original.toDate().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }); }
                 catch(e) { fechaStr = memoria.Fecha_Original.toDate().toISOString().split('T')[0]; }
            } else if (memoria.Fecha_Original) { fechaStr = memoria.Fecha_Original.toString(); }
            itemDiv.innerHTML = `
                <div class="memoria-item-content"><small>${fechaStr}</small>${memoria.Descripcion || ''}</div>
                <div class="memoria-actions">
                    <button class="edit-btn" title="Editar">${editIconSVG}</button>
                    <button class="delete-btn" title="Borrar">${deleteIconSVG}</button>
                </div>`;
            itemDiv.querySelector('.edit-btn').onclick = () => startEditMemoria(memoria);
            itemDiv.querySelector('.delete-btn').onclick = () => confirmDeleteMemoria(diaId, memoria.id, memoria.Descripcion);
            memoriasListDiv.appendChild(itemDiv);
        });
        console.log(`Cargadas ${currentMemories.length} memorias para ${diaId}`);
    } catch (e) { console.error(`Error cargando memorias ${diaId}:`, e); memoriasListDiv.innerHTML = '<p class="error">Error.</p>'; }
}

function startEditMemoria(memoria) {
    editingMemoryId = memoria.id;
    const fechaInput = document.getElementById('memoria-fecha'); const descInput = document.getElementById('memoria-desc');
    const addButton = document.getElementById('add-memoria-btn');
    if (memoria.Fecha_Original?.toDate) {
        try { fechaInput.value = memoria.Fecha_Original.toDate().toISOString().split('T')[0]; } catch(e) { fechaInput.value = ''; }
    } else { fechaInput.value = ''; }
    descInput.value = memoria.Descripcion || '';
    addButton.textContent = 'Actualizar Memoria'; addButton.classList.add('update-mode'); descInput.focus();
}

async function updateMemoria(diaId, memoriaId, fechaStr, descripcion) {
    const memoriaStatus = document.getElementById('memoria-status');
    if (!fechaStr || !descripcion) { memoriaStatus.textContent = 'Faltan datos.'; memoriaStatus.className = 'error'; setTimeout(() => memoriaStatus.textContent = '', 3000); return; }
    memoriaStatus.textContent = 'Actualizando...'; memoriaStatus.className = '';
    try {
        const dateParts = fechaStr.split('-'); const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        const fechaOriginalTimestamp = Timestamp.fromDate(localDate); const memoriaRef = doc(db, "Dias", diaId, "Memorias", memoriaId);
        await updateDoc(memoriaRef, { Fecha_Original: fechaOriginalTimestamp, Descripcion: descripcion });
        memoriaStatus.textContent = '¡Actualizada!'; memoriaStatus.className = 'success'; resetMemoryForm(); await cargarYMostrarMemorias(diaId); setTimeout(() => memoriaStatus.textContent = '', 2000);
    } catch (e) { console.error("Error actualizando:", e); memoriaStatus.textContent = `Error: ${e.message}`; memoriaStatus.className = 'error'; }
}

function confirmDeleteMemoria(diaId, memoriaId, descripcion) {
    const dialog = document.getElementById('confirm-delete-dialog'); const yesButton = document.getElementById('confirm-delete-yes');
    const textElement = document.getElementById('confirm-delete-text');
    const descPreview = descripcion ? (descripcion.length > 50 ? descripcion.substring(0, 47) + '...' : 'esta memoria') : 'esta memoria';
    textElement.textContent = `¿Borrar "${descPreview}"?`; dialog.style.display = 'block';
    yesButton.onclick = async () => { dialog.style.display = 'none'; await deleteMemoria(diaId, memoriaId); };
}

async function deleteMemoria(diaId, memoriaId) {
    const memoriaStatus = document.getElementById('memoria-status');
    memoriaStatus.textContent = 'Borrando...'; memoriaStatus.className = '';
    try {
        const memoriaRef = doc(db, "Dias", diaId, "Memorias", memoriaId); await deleteDoc(memoriaRef);
        memoriaStatus.textContent = '¡Borrada!'; memoriaStatus.className = 'success'; await cargarYMostrarMemorias(diaId); setTimeout(() => memoriaStatus.textContent = '', 2000);
    } catch (e) { console.error("Error borrando:", e); memoriaStatus.textContent = `Error: ${e.message}`; memoriaStatus.className = 'error'; }
}

async function guardarNuevaMemoria(diaId, fechaStr, descripcion) {
    const memoriaStatus = document.getElementById('memoria-status');
    if (!fechaStr || !descripcion) { memoriaStatus.textContent = 'Faltan datos.'; memoriaStatus.className = 'error'; setTimeout(() => memoriaStatus.textContent = '', 3000); return; }
    memoriaStatus.textContent = 'Guardando...'; memoriaStatus.className = '';
    try {
        const dateParts = fechaStr.split('-'); const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        const fechaOriginalTimestamp = Timestamp.fromDate(localDate); const memoriasRef = collection(db, "Dias", diaId, "Memorias");
        await addDoc(memoriasRef, { Fecha_Original: fechaOriginalTimestamp, Descripcion: descripcion, Creado_En: Timestamp.now() });
        memoriaStatus.textContent = '¡Guardada!'; memoriaStatus.className = 'success'; resetMemoryForm(); await cargarYMostrarMemorias(diaId); setTimeout(() => memoriaStatus.textContent = '', 2000);
    } catch (e) { console.error("Error guardando nueva:", e); memoriaStatus.textContent = `Error: ${e.message}`; memoriaStatus.className = 'error'; }
}

function resetMemoryForm() {
    editingMemoryId = null; document.getElementById('memoria-fecha').value = ''; document.getElementById('memoria-desc').value = '';
    const addButton = document.getElementById('add-memoria-btn'); addButton.textContent = 'Añadir Memoria'; addButton.classList.remove('update-mode');
}

async function guardarNombreEspecial(diaId, nuevoNombre) {
    const status = document.getElementById('save-status');
    try {
        status.textContent = "Guardando..."; status.className = ''; const diaRef = doc(db, "Dias", diaId); const valorFinal = nuevoNombre || "Día sin nombre";
        await updateDoc(diaRef, { Nombre_Especial: valorFinal }); const diaIndex = allDaysData.findIndex(d => d.id === diaId);
        if (diaIndex !== -1) allDaysData[diaIndex].Nombre_Especial = valorFinal;
        status.textContent = "¡Nombre guardado!"; status.className = 'success'; setTimeout(() => { status.textContent = ''; dibujarMesActual(); }, 1200);
    } catch (e) { status.textContent = `Error: ${e.message}`; status.className = 'error'; console.error(e); }
}

// --- ¡Arranca la App! ---
checkAndRunApp(); // Verifica/Repara BD si es necesario, luego carga y dibuja
