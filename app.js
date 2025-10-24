/* app.js - v7.0 - Preview Modal, Footer, Refactor */

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
  storageBucket: "ephemerides-2005.firebasestorage.app",
  messagingSenderId: "360961314777",
  appId: "1:360961314777:web:809d9e66535acb292d13c8",
  measurementId: "G-BZC9FRYCJW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const appContent = document.getElementById("app-content");
const monthNameDisplayEl = document.getElementById("month-name-display"); // Target para nombre mes
const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

let allDaysData = [];
let currentMonthIndex = new Date().getMonth();
let currentMemories = [];
let editingMemoryId = null;
let currentlyOpenDay = null; // Para saber qué día está abierto en preview/edit

// --- Iconos SVG --- (Reutilizados)
const editIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg>`;
const deleteIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m3 0l-.5 8.5a.5.5 0 1 0 .998.06l.5-8.5a.5.5 0 1 0-.998.06m3 .5l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Z"/></svg>`;
const pencilIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/></svg>`;


// --- Función Principal y Reparación (SIN CAMBIOS DESDE v4.1) ---
async function checkAndRunApp() {
    console.log("Iniciando Verificación/Reparación v7.0...");
    appContent.innerHTML = "<p>Verificando base de datos...</p>";
    try {
        const diasRef = collection(db, "Dias");
        const checkSnapshot = await getDocs(diasRef);
        const currentDocCount = checkSnapshot.size;
        console.log(`Docs en 'Dias': ${currentDocCount}`);
        if (currentDocCount !== 366) {
            console.warn(`Reparando... (${currentDocCount}/366)`);
            await generateCleanDatabase();
        } else { console.log("BD verificada (366 días)."); }
        await loadDataAndDrawCalendar();
    } catch (e) { appContent.innerHTML = `<p class="error">Error crítico: ${e.message}</p>`; console.error(e); }
}
async function generateCleanDatabase() {
     console.log("--- Iniciando Regeneración ---");
    const diasRef = collection(db, "Dias");
    try {
        console.log("Borrando 'Dias'..."); appContent.innerHTML = "<p>Borrando datos antiguos...</p>";
        const oldDocsSnapshot = await getDocs(diasRef);
        if (!oldDocsSnapshot.empty) {
            let batch = writeBatch(db); let deleteCount = 0;
            oldDocsSnapshot.forEach(docSnap => {
                batch.delete(docSnap.ref); deleteCount++;
                if (deleteCount >= 499) { batch.commit(); batch = writeBatch(db); deleteCount = 0; }
            });
            if (deleteCount > 0) await batch.commit(); console.log(`Borrado completado (${oldDocsSnapshot.size}).`);
        } else { console.log("'Dias' ya estaba vacía."); }
    } catch(e) { console.error("Error borrando:", e); throw e; }
    console.log("Generando 366 días..."); appContent.innerHTML = "<p>Generando 366 días...</p>";
    let batch = writeBatch(db); let ops = 0, created = 0;
    try {
        for (let m = 0; m < 12; m++) {
            const monthNum = m + 1, monthStr = monthNum.toString().padStart(2, '0');
            const numDays = daysInMonth[m];
            for (let d = 1; d <= numDays; d++) {
                const dayStr = d.toString().padStart(2, '0'); const diaId = `${monthStr}-${dayStr}`;
                const diaData = { Nombre_Dia: `${d} de ${monthNames[m]}`, Icono: '', Nombre_Especial: "Día sin nombre" };
                const docRef = doc(db, "Dias", diaId); batch.set(docRef, diaData); ops++; created++;
                if(created % 50 === 0) appContent.innerHTML = `<p>Generando ${created}/366...</p>`;
                if (ops >= 499) { await batch.commit(); batch = writeBatch(db); ops = 0; }
            }
        }
        if (ops > 0) await batch.commit(); console.log(`--- Regeneración completa: ${created} ---`);
        appContent.innerHTML = `<p class="success">✅ ¡Base regenerada con ${created} días!</p>`;
    } catch(e) { console.error("Error generando:", e); throw e; }
}
async function loadDataAndDrawCalendar() {
    console.log("Cargando datos..."); appContent.innerHTML = "<p>Cargando calendario...</p>";
    try {
        const diasSnapshot = await getDocs(collection(db, "Dias")); allDaysData = [];
        diasSnapshot.forEach((doc) => { if (doc.id?.length === 5) allDaysData.push({ id: doc.id, ...doc.data() }); });
        if (allDaysData.length === 0) throw new Error("BD vacía post-carga.");
        console.log(`Cargados ${allDaysData.length} días.`); allDaysData.sort((a, b) => a.id.localeCompare(b.id));
        configurarNavegacion();
        configurarFooter(); // Configurar botones del footer
        dibujarMesActual();
    } catch (e) { appContent.innerHTML = `<p class="error">Error cargando: ${e.message}</p>`; console.error(e); }
}
function configurarNavegacion() {
     document.getElementById("prev-month").onclick = () => { currentMonthIndex = (currentMonthIndex - 1 + 12) % 12; dibujarMesActual(); };
    document.getElementById("next-month").onclick = () => { currentMonthIndex = (currentMonthIndex + 1) % 12; dibujarMesActual(); };
}

// --- Dibujo del Mes Actual (Estilo Hoja sin Nombre Especial visible) ---
function dibujarMesActual() {
    monthNameDisplayEl.textContent = monthNames[currentMonthIndex]; // Actualiza span en nav
    const monthNumberTarget = currentMonthIndex + 1;
    console.log(`Dibujando mes ${monthNumberTarget} (${monthNames[currentMonthIndex]})`);
    const diasDelMes = allDaysData.filter(dia => parseInt(dia.id.substring(0, 2), 10) === monthNumberTarget);
    console.log(`Encontrados ${diasDelMes.length} días para mes ${monthNumberTarget}.`);
    appContent.innerHTML = `<div class="calendario-grid" id="grid-dias"></div>`;
    const grid = document.getElementById("grid-dias");
    if (diasDelMes.length === 0) { grid.innerHTML = "<p>No días.</p>"; return; }
    const diasEsperados = daysInMonth[currentMonthIndex];
    if (diasDelMes.length !== diasEsperados) console.warn(`ALERTA: ${diasDelMes.length}/${diasEsperados} días para ${monthNames[currentMonthIndex]}.`);

    diasDelMes.forEach(dia => {
        const btn = document.createElement("button");
        btn.className = "dia-btn";
        // Estilo Hoja: Solo número grande
        btn.innerHTML = `<span class="dia-numero">${dia.id.substring(3)}</span>`;
        btn.dataset.diaId = dia.id;
        // *** CAMBIO: Ahora llama a abrirModalPreview ***
        btn.addEventListener('click', () => abrirModalPreview(dia));
        grid.appendChild(btn);
    });
    console.log(`Dibujados ${diasDelMes.length} botones.`);
}

// --- Footer ---
function configurarFooter() {
    document.getElementById('btn-hoy').onclick = () => {
        currentMonthIndex = new Date().getMonth();
        dibujarMesActual();
        window.scrollTo(0, 0); // Ir arriba
    };
    document.getElementById('btn-buscar').onclick = () => {
        const searchTerm = prompt("Buscar memoria por texto (no sensible a mayúsculas):");
        if (searchTerm && searchTerm.trim() !== '') {
            buscarMemorias(searchTerm.trim().toLowerCase());
        }
    };
}

// --- Búsqueda ---
async function buscarMemorias(term) {
    console.log("Buscando memorias con:", term);
    appContent.innerHTML = `<p>Buscando memorias que contengan "${term}"...</p>`;
    let results = [];
    try {
        for (const dia of allDaysData) {
            const memoriasRef = collection(db, "Dias", dia.id, "Memorias");
            const q = query(memoriasRef);
            const memSnapshot = await getDocs(q);
            memSnapshot.forEach(memDoc => {
                const memoria = { diaId: dia.id, diaNombre: dia.Nombre_Dia, id: memDoc.id, ...memDoc.data() };
                if (memoria.Descripcion && memoria.Descripcion.toLowerCase().includes(term)) {
                    results.push(memoria);
                }
            });
        }

        if (results.length === 0) {
            appContent.innerHTML = `<p>No se encontraron memorias que contengan "${term}".</p>`;
        } else {
            console.log(`Encontradas ${results.length} memorias.`);
             results.sort((a, b) => (b.Fecha_Original?.toDate() ?? 0) - (a.Fecha_Original?.toDate() ?? 0));
            appContent.innerHTML = `<h3>Resultados de búsqueda para "${term}" (${results.length}):</h3>`;
            const resultsList = document.createElement('div');
            resultsList.id = 'search-results-list';
            results.forEach(mem => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'memoria-item search-result';
                 let fechaStr = 'Fecha desconocida';
                 if (mem.Fecha_Original?.toDate) {
                     try { fechaStr = mem.Fecha_Original.toDate().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }); }
                     catch(e) { fechaStr = mem.Fecha_Original.toDate().toISOString().split('T')[0]; }
                 } else if (mem.Fecha_Original) { fechaStr = mem.Fecha_Original.toString(); }
                itemDiv.innerHTML = `
                    <div class="memoria-item-content">
                        <small><b>${mem.diaNombre} (${mem.diaId})</b> - ${fechaStr}</small>
                        ${mem.Descripcion || ''}
                    </div>`;
                 itemDiv.style.cursor = 'pointer';
                 itemDiv.onclick = () => {
                     const monthIndex = parseInt(mem.diaId.substring(0, 2), 10) - 1;
                     if (monthIndex >= 0 && monthIndex < 12) {
                         currentMonthIndex = monthIndex;
                         dibujarMesActual();
                         const targetDia = allDaysData.find(d => d.id === mem.diaId);
                         if(targetDia) setTimeout(() => abrirModalPreview(targetDia), 50);
                     }
                 };
                resultsList.appendChild(itemDiv);
            });
            appContent.appendChild(resultsList);
        }
    } catch (e) { appContent.innerHTML = `<p class="error">Error buscando: ${e.message}</p>`; console.error(e); }
}


// --- Modal de PREVISUALIZACIÓN ---
async function abrirModalPreview(dia) {
    console.log("Abriendo preview para:", dia.id);
    currentlyOpenDay = dia;
    let modal = document.getElementById('preview-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'preview-modal';
        modal.className = 'modal-preview';
        modal.innerHTML = `
            <div class="modal-preview-content">
                <div class="modal-preview-header">
                    <h3 id="preview-title"></h3>
                    <button id="edit-from-preview-btn" title="Editar este día">${pencilIconSVG}</button>
                </div>
                <div class="modal-preview-memorias">
                    <h4>Memorias:</h4>
                    <div id="preview-memorias-list">Cargando...</div>
                </div>
                 <button id="close-preview-btn" class="aqua-button" style="margin-top: 15px;">Cerrar</button>
            </div>`;
        document.body.appendChild(modal);
        document.getElementById('close-preview-btn').onclick = () => cerrarModalPreview();
        modal.onclick = (e) => { if (e.target.id === 'preview-modal') cerrarModalPreview(); };
        document.getElementById('edit-from-preview-btn').onclick = () => {
             cerrarModalPreview();
             setTimeout(() => abrirModalEdicion(currentlyOpenDay), 210);
        };
    }
    // Mostrar nombre del día Y nombre especial (si existe)
    document.getElementById('preview-title').textContent = `${dia.Nombre_Dia} ${dia.Nombre_Especial !== 'Día sin nombre' ? '('+dia.Nombre_Especial+')' : ''}`;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);
    await cargarYMostrarMemorias(dia.id, 'preview-memorias-list');
}
function cerrarModalPreview() {
    const modal = document.getElementById('preview-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => { modal.style.display = 'none'; }, 200);
    }
}

// --- Modal de EDICIÓN (Llamado desde Preview) ---
async function abrirModalEdicion(dia) {
    console.log("Abriendo modal EDICIÓN para:", dia.id);
    currentlyOpenDay = dia;
    let modal = document.getElementById('edit-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'edit-modal';
        modal.className = 'modal-edit';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-section">
                    <h3 id="edit-modal-title"></h3>
                    <p>Nombra este día:</p>
                    <input type="text" id="nombre-especial-input" placeholder="Ej: Día de la pizza" maxlength="25">
                     <p id="save-status"></p>
                </div>
                <div class="modal-section memorias-section">
                    <h4>Memorias de este día:</h4>
                    <div id="edit-memorias-list">Cargando...</div>
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
                     <button id="close-edit-btn">Cerrar</button>
                     <button id="save-name-btn">Guardar Nombre</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        document.getElementById('close-edit-btn').onclick = () => cerrarModalEdicion();
        modal.onclick = (e) => { if (e.target.id === 'edit-modal') cerrarModalEdicion(); };
        document.getElementById('confirm-delete-no').onclick = () => document.getElementById('confirm-delete-dialog').style.display = 'none';
    }

    resetMemoryForm();

    document.getElementById('edit-modal-title').textContent = `Editando: ${dia.Nombre_Dia} (${dia.id})`;
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
    await cargarYMostrarMemorias(dia.id, 'edit-memorias-list');
}

function cerrarModalEdicion() {
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => { modal.style.display = 'none'; resetMemoryForm(); }, 200);
    }
}


/**
 * Carga y muestra memorias en un DIV específico (con botones si es edit)
 */
async function cargarYMostrarMemorias(diaId, targetDivId) {
    const memoriasListDiv = document.getElementById(targetDivId);
    if (!memoriasListDiv) { console.error("Target div missing:", targetDivId); return; }
    memoriasListDiv.innerHTML = 'Cargando...'; currentMemories = [];

    try {
        const memoriasRef = collection(db, "Dias", diaId, "Memorias");
        const q = query(memoriasRef, orderBy("Fecha_Original", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            memoriasListDiv.innerHTML = '<p style="font-style: italic; color: #777; font-size: 12px;">No hay memorias.</p>';
            return;
        }

        memoriasListDiv.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const memoria = { id: docSnap.id, ...docSnap.data() }; currentMemories.push(memoria);
            const itemDiv = document.createElement('div'); itemDiv.className = 'memoria-item';
            let fechaStr = 'Fecha desconocida';
            if (memoria.Fecha_Original?.toDate) {
                 try { fechaStr = memoria.Fecha_Original.toDate().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }); }
                 catch(e) { fechaStr = memoria.Fecha_Original.toDate().toISOString().split('T')[0]; }
            } else if (memoria.Fecha_Original) { fechaStr = memoria.Fecha_Original.toString(); }

            // Añadir botones solo si estamos en el modal de EDICIÓN
            const actionsHTML = (targetDivId === 'edit-memorias-list') ? `
                <div class="memoria-actions">
                    <button class="edit-btn" title="Editar">${editIconSVG}</button>
                    <button class="delete-btn" title="Borrar">${deleteIconSVG}</button>
                </div>` : '';

            itemDiv.innerHTML = `
                <div class="memoria-item-content"><small>${fechaStr}</small>${memoria.Descripcion || ''}</div>
                ${actionsHTML}`;

            // Añadir listeners solo si hay botones
            if (targetDivId === 'edit-memorias-list') {
                itemDiv.querySelector('.edit-btn').onclick = () => startEditMemoria(memoria);
                itemDiv.querySelector('.delete-btn').onclick = () => confirmDeleteMemoria(diaId, memoria.id, memoria.Descripcion);
            }

            memoriasListDiv.appendChild(itemDiv);
        });
        console.log(`Cargadas ${currentMemories.length} memorias para ${diaId} en ${targetDivId}`);
    } catch (e) { console.error(`Error cargando memorias ${diaId}:`, e); memoriasListDiv.innerHTML = '<p class="error">Error.</p>'; }
}


// --- Resto de funciones CRUD (sin cambios lógicos desde v6.0) ---
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
        memoriaStatus.textContent = '¡Actualizada!'; memoriaStatus.className = 'success'; resetMemoryForm();
        await cargarYMostrarMemorias(diaId, 'edit-memorias-list');
        setTimeout(() => memoriaStatus.textContent = '', 2000);
    } catch (e) { console.error("Error actualizando:", e); memoriaStatus.textContent = `Error: ${e.message}`; memoriaStatus.className = 'error'; }
}
function confirmDeleteMemoria(diaId, memoriaId, descripcion) {
    const dialog = document.getElementById('confirm-delete-dialog'); const yesButton = document.getElementById('confirm-delete-yes');
    const textElement = document.getElementById('confirm-delete-text');
    const descPreview = descripcion ? (descripcion.length > 50 ? descripcion.substring(0, 47) + '...' : 'esta memoria') : 'esta memoria';
    textElement.textContent = `¿Borrar "${descPreview}"?`;
    // Asegurar que el diálogo está visible y dentro del modal
     const editModal = document.getElementById('edit-modal');
     if (editModal) editModal.appendChild(dialog);
    dialog.style.display = 'block';

    yesButton.onclick = async () => { dialog.style.display = 'none'; await deleteMemoria(diaId, memoriaId); };
}
async function deleteMemoria(diaId, memoriaId) {
    const memoriaStatus = document.getElementById('memoria-status');
    memoriaStatus.textContent = 'Borrando...'; memoriaStatus.className = '';
    try {
        const memoriaRef = doc(db, "Dias", diaId, "Memorias", memoriaId); await deleteDoc(memoriaRef);
        memoriaStatus.textContent = '¡Borrada!'; memoriaStatus.className = 'success';
        await cargarYMostrarMemorias(diaId, 'edit-memorias-list');
        setTimeout(() => memoriaStatus.textContent = '', 2000);
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
        memoriaStatus.textContent = '¡Guardada!'; memoriaStatus.className = 'success'; resetMemoryForm();
        await cargarYMostrarMemorias(diaId, 'edit-memorias-list');
        setTimeout(() => memoriaStatus.textContent = '', 2000);
    } catch (e) { console.error("Error guardando nueva:", e); memoriaStatus.textContent = `Error: ${e.message}`; memoriaStatus.className = 'error'; }
}
function resetMemoryForm() {
    editingMemoryId = null;
    const form = document.getElementById('add-memoria-form');
    if(form) {
        form.reset(); // Usar reset() para limpiar fecha y textarea
        const addButton = document.getElementById('add-memoria-btn');
        addButton.textContent = 'Añadir Memoria';
        addButton.classList.remove('update-mode');
        // Asegurarse de que memoria-status existe antes de limpiarlo
        const statusEl = document.getElementById('memoria-status');
        if(statusEl) statusEl.textContent = '';
    }
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

