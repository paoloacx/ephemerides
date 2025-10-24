/* app.js - v7.1 - English UI, Button Repositioning */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
    getFirestore, collection, getDocs, doc, updateDoc,
    writeBatch, setDoc, deleteDoc, Timestamp, query, orderBy, addDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// --- Firebase Config ---
const firebaseConfig = { /* ... Tu configuración ... */
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
const monthNameDisplayEl = document.getElementById("month-name-display");
// English Month Names
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

let allDaysData = [];
let currentMonthIndex = new Date().getMonth();
let currentMemories = [];
let editingMemoryId = null;
let currentlyOpenDay = null;

// --- SVG Icons ---
const editIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg>`;
const deleteIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m3 0l-.5 8.5a.5.5 0 1 0 .998.06l.5-8.5a.5.5 0 1 0-.998.06m3 .5l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Z"/></svg>`;
const pencilIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/></svg>`;


// --- Check/Repair DB ---
async function checkAndRunApp() { /* ... unchanged ... */
    console.log("Starting Check/Repair v7.1 (English)...");
    appContent.innerHTML = "<p>Verifying database...</p>";
    try {
        const diasRef = collection(db, "Dias");
        const checkSnapshot = await getDocs(diasRef);
        const currentDocCount = checkSnapshot.size;
        console.log(`Docs in 'Dias': ${currentDocCount}`);
        if (currentDocCount !== 366) {
            console.warn(`Repairing... (${currentDocCount}/366)`);
            await generateCleanDatabase();
        } else { console.log("DB verified (366 days)."); }
        await loadDataAndDrawCalendar();
    } catch (e) { appContent.innerHTML = `<p class="error">Critical error: ${e.message}</p>`; console.error(e); }
}
async function generateCleanDatabase() { /* ... unchanged ... */
    console.log("--- Starting Regeneration ---");
    const diasRef = collection(db, "Dias");
    try {
        console.log("Deleting existing 'Dias' collection..."); appContent.innerHTML = "<p>Deleting old data...</p>";
        const oldDocsSnapshot = await getDocs(diasRef);
        if (!oldDocsSnapshot.empty) {
            let batch = writeBatch(db); let deleteCount = 0;
            oldDocsSnapshot.forEach(docSnap => {
                batch.delete(docSnap.ref); deleteCount++;
                if (deleteCount >= 499) { batch.commit(); batch = writeBatch(db); deleteCount = 0; }
            });
            if (deleteCount > 0) await batch.commit(); console.log(`Deletion complete (${oldDocsSnapshot.size}).`);
        } else { console.log("'Dias' collection was already empty."); }
    } catch(e) { console.error("Error deleting:", e); throw e; }
    console.log("Generating 366 clean days..."); appContent.innerHTML = "<p>Generating 366 clean days...</p>";
    let batch = writeBatch(db); let ops = 0, created = 0;
    try {
        for (let m = 0; m < 12; m++) {
            const monthNum = m + 1, monthStr = monthNum.toString().padStart(2, '0');
            const numDays = daysInMonth[m];
            for (let d = 1; d <= numDays; d++) {
                const dayStr = d.toString().padStart(2, '0'); const diaId = `${monthStr}-${dayStr}`;
                // Use English month name here
                const diaData = { Nombre_Dia: `${d} ${monthNames[m]}`, Icono: '', Nombre_Especial: "Unnamed Day" };
                const docRef = doc(db, "Dias", diaId); batch.set(docRef, diaData); ops++; created++;
                if(created % 50 === 0) appContent.innerHTML = `<p>Generating ${created}/366...</p>`;
                if (ops >= 499) { await batch.commit(); batch = writeBatch(db); ops = 0; }
            }
        }
        if (ops > 0) await batch.commit(); console.log(`--- Regeneration complete: ${created} ---`);
        appContent.innerHTML = `<p class="success">✅ Database regenerated with ${created} days!</p>`;
    } catch(e) { console.error("Error generating:", e); throw e; }
}
async function loadDataAndDrawCalendar() { /* ... unchanged ... */
    console.log("Loading data..."); appContent.innerHTML = "<p>Loading calendar...</p>";
    try {
        const diasSnapshot = await getDocs(collection(db, "Dias")); allDaysData = [];
        diasSnapshot.forEach((doc) => { if (doc.id?.length === 5) allDaysData.push({ id: doc.id, ...doc.data() }); });
        if (allDaysData.length === 0) throw new Error("DB empty post-load.");
        console.log(`Loaded ${allDaysData.length} valid days.`); allDaysData.sort((a, b) => a.id.localeCompare(b.id));
        configurarNavegacion();
        configurarFooter();
        dibujarMesActual();
    } catch (e) { appContent.innerHTML = `<p class="error">Error loading: ${e.message}</p>`; console.error(e); }
}
function configurarNavegacion() { /* ... unchanged ... */
     document.getElementById("prev-month").onclick = () => { currentMonthIndex = (currentMonthIndex - 1 + 12) % 12; dibujarMesActual(); };
    document.getElementById("next-month").onclick = () => { currentMonthIndex = (currentMonthIndex + 1) % 12; dibujarMesActual(); };
}

// --- Draw Current Month ---
function dibujarMesActual() { /* ... unchanged ... */
    monthNameDisplayEl.textContent = monthNames[currentMonthIndex];
    const monthNumberTarget = currentMonthIndex + 1;
    console.log(`Drawing month ${monthNumberTarget} (${monthNames[currentMonthIndex]})`);
    const diasDelMes = allDaysData.filter(dia => parseInt(dia.id.substring(0, 2), 10) === monthNumberTarget);
    console.log(`Found ${diasDelMes.length} days for month ${monthNumberTarget}.`);
    appContent.innerHTML = `<div class="calendario-grid" id="grid-dias"></div>`;
    const grid = document.getElementById("grid-dias");
    if (diasDelMes.length === 0) { grid.innerHTML = "<p>No days found.</p>"; return; }
    const diasEsperados = daysInMonth[currentMonthIndex];
    if (diasDelMes.length !== diasEsperados) console.warn(`ALERT: ${diasDelMes.length}/${diasEsperados} days found for ${monthNames[currentMonthIndex]}.`);

    diasDelMes.forEach(dia => {
        const btn = document.createElement("button");
        btn.className = "dia-btn";
        btn.innerHTML = `<span class="dia-numero">${dia.id.substring(3)}</span>`;
        btn.dataset.diaId = dia.id;
        btn.addEventListener('click', () => abrirModalPreview(dia));
        grid.appendChild(btn);
    });
    console.log(`Rendered ${diasDelMes.length} buttons.`);
}

// --- Footer ---
function configurarFooter() { /* ... unchanged ... */
    document.getElementById('btn-hoy').onclick = () => {
        currentMonthIndex = new Date().getMonth(); dibujarMesActual(); window.scrollTo(0, 0);
    };
    document.getElementById('btn-buscar').onclick = () => {
        const searchTerm = prompt("Search memories by text (case-insensitive):"); // Translated prompt
        if (searchTerm && searchTerm.trim() !== '') { buscarMemorias(searchTerm.trim().toLowerCase()); }
    };
}

// --- Search ---
async function buscarMemorias(term) { /* ... unchanged logic, translated UI text ... */
    console.log("Searching memories containing:", term);
    appContent.innerHTML = `<p>Searching memories containing "${term}"...</p>`;
    let results = [];
    try {
        for (const dia of allDaysData) {
            const memoriasRef = collection(db, "Dias", dia.id, "Memorias");
            const q = query(memoriasRef);
            const memSnapshot = await getDocs(q);
            memSnapshot.forEach(memDoc => {
                const memoria = { diaId: dia.id, diaNombre: dia.Nombre_Dia, id: memDoc.id, ...memDoc.data() };
                if (memoria.Descripcion && memoria.Descripcion.toLowerCase().includes(term)) { results.push(memoria); }
            });
        }
        if (results.length === 0) { appContent.innerHTML = `<p>No memories found containing "${term}".</p>`; }
        else {
            console.log(`Found ${results.length} memories.`);
             results.sort((a, b) => (b.Fecha_Original?.toDate() ?? 0) - (a.Fecha_Original?.toDate() ?? 0));
            appContent.innerHTML = `<h3>Search Results for "${term}" (${results.length}):</h3>`;
            const resultsList = document.createElement('div'); resultsList.id = 'search-results-list';
            results.forEach(mem => {
                const itemDiv = document.createElement('div'); itemDiv.className = 'memoria-item search-result';
                 let fechaStr = 'Unknown date'; // Translated
                 if (mem.Fecha_Original?.toDate) {
                     try { fechaStr = mem.Fecha_Original.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); } // Use en-US locale
                     catch(e) { fechaStr = mem.Fecha_Original.toDate().toISOString().split('T')[0]; }
                 } else if (mem.Fecha_Original) { fechaStr = mem.Fecha_Original.toString(); }
                itemDiv.innerHTML = `<div class="memoria-item-content"><small><b>${mem.diaNombre} (${mem.diaId})</b> - ${fechaStr}</small>${mem.Descripcion || ''}</div>`;
                 itemDiv.style.cursor = 'pointer';
                 itemDiv.onclick = () => {
                     const monthIndex = parseInt(mem.diaId.substring(0, 2), 10) - 1;
                     if (monthIndex >= 0 && monthIndex < 12) {
                         currentMonthIndex = monthIndex; dibujarMesActual();
                         const targetDia = allDaysData.find(d => d.id === mem.diaId);
                         if(targetDia) setTimeout(() => abrirModalPreview(targetDia), 50);
                     }
                 };
                resultsList.appendChild(itemDiv);
            }); appContent.appendChild(resultsList);
        }
    } catch (e) { appContent.innerHTML = `<p class="error">Error during search: ${e.message}</p>`; console.error(e); }
}


// --- Preview Modal ---
async function abrirModalPreview(dia) { /* ... unchanged logic, translated UI text ... */
    console.log("Opening preview for:", dia.id);
    currentlyOpenDay = dia;
    let modal = document.getElementById('preview-modal');
    if (!modal) {
        modal = document.createElement('div'); modal.id = 'preview-modal'; modal.className = 'modal-preview';
        modal.innerHTML = `
            <div class="modal-preview-content">
                <div class="modal-preview-header">
                    <h3 id="preview-title"></h3>
                    <button id="edit-from-preview-btn" title="Edit this day">${pencilIconSVG}</button>
                </div>
                <div class="modal-preview-memorias">
                    <h4>Memories:</h4>
                    <div id="preview-memorias-list">Loading...</div>
                </div>
                 <button id="close-preview-btn" class="aqua-button" style="margin-top: 15px;">Close</button>
            </div>`;
        document.body.appendChild(modal);
        document.getElementById('close-preview-btn').onclick = () => cerrarModalPreview();
        modal.onclick = (e) => { if (e.target.id === 'preview-modal') cerrarModalPreview(); };
        document.getElementById('edit-from-preview-btn').onclick = () => { cerrarModalPreview(); setTimeout(() => abrirModalEdicion(currentlyOpenDay), 210); };
    }
    document.getElementById('preview-title').textContent = `${dia.Nombre_Dia} ${dia.Nombre_Especial !== 'Unnamed Day' ? '('+dia.Nombre_Especial+')' : ''}`; // Use "Unnamed Day"
    modal.style.display = 'flex'; setTimeout(() => modal.classList.add('visible'), 10);
    await cargarYMostrarMemorias(dia.id, 'preview-memorias-list');
}
function cerrarModalPreview() { /* ... unchanged ... */
    const modal = document.getElementById('preview-modal');
    if (modal) { modal.classList.remove('visible'); setTimeout(() => { modal.style.display = 'none'; }, 200); }
}

// --- Edit Modal ---
async function abrirModalEdicion(dia) { /* ... HTML structure change, translated text ... */
    console.log("Opening EDIT modal for:", dia.id);
    currentlyOpenDay = dia;
    let modal = document.getElementById('edit-modal');
    if (!modal) {
        modal = document.createElement('div'); modal.id = 'edit-modal'; modal.className = 'modal-edit';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-section">
                    <h3 id="edit-modal-title"></h3>
                    <label for="nombre-especial-input">Name this day:</label>
                    <input type="text" id="nombre-especial-input" placeholder="e.g., Pizza Day" maxlength="25">
                    <button id="save-name-btn" class="aqua-button" style="margin-top: 10px;">Save Name</button>
                     <p id="save-status"></p>
                </div>

                <div class="modal-section memorias-section">
                    <h4>Memories for this day:</h4>
                    <div id="edit-memorias-list">Loading...</div>
                    <form id="add-memoria-form">
                        <label for="memoria-fecha">Original Date:</label>
                        <input type="date" id="memoria-fecha" required>
                        <label for="memoria-desc">Description:</label>
                        <textarea id="memoria-desc" placeholder="Write your memory..." required maxlength="500"></textarea>
                        <button type="submit" id="add-memoria-btn" class="aqua-button">Add Memory</button>
                         <p id="memoria-status"></p>
                    </form>
                </div>

                <div id="confirm-delete-dialog" style="display: none;">
                    <p id="confirm-delete-text">Are you sure?</p>
                    <button id="confirm-delete-no" class="aqua-button">Cancel</button>
                    <button id="confirm-delete-yes" class="aqua-button delete-confirm">Yes, delete</button>
                </div>

                <div class="modal-main-buttons">
                     <button id="close-edit-btn">Close</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        document.getElementById('close-edit-btn').onclick = () => cerrarModalEdicion();
        modal.onclick = (e) => { if (e.target.id === 'edit-modal') cerrarModalEdicion(); };
        document.getElementById('confirm-delete-no').onclick = () => document.getElementById('confirm-delete-dialog').style.display = 'none';
    }

    resetMemoryForm();

    document.getElementById('edit-modal-title').textContent = `Editing: ${dia.Nombre_Dia} (${dia.id})`; // Translated
    const inputNombreEspecial = document.getElementById('nombre-especial-input');
    inputNombreEspecial.value = dia.Nombre_Especial === 'Unnamed Day' ? '' : dia.Nombre_Especial; // Use "Unnamed Day"
    document.getElementById('save-status').textContent = '';
    document.getElementById('memoria-status').textContent = '';
    document.getElementById('confirm-delete-dialog').style.display = 'none';

    // Attach listener to the MOVED Save Name button
    document.getElementById('save-name-btn').onclick = () => guardarNombreEspecial(dia.id, inputNombreEspecial.value.trim());

    const addMemoriaForm = document.getElementById('add-memoria-form');
    addMemoriaForm.onsubmit = async (e) => { /* ... unchanged logic ... */
        e.preventDefault();
        const fechaInput = document.getElementById('memoria-fecha').value;
        const descInput = document.getElementById('memoria-desc').value;
        if (editingMemoryId) { await updateMemoria(dia.id, editingMemoryId, fechaInput, descInput.trim()); }
        else { await guardarNuevaMemoria(dia.id, fechaInput, descInput.trim()); }
    };

    modal.style.display = 'flex'; setTimeout(() => modal.classList.add('visible'), 10);
    await cargarYMostrarMemorias(dia.id, 'edit-memorias-list');
}

function cerrarModalEdicion() { /* ... unchanged ... */
    const modal = document.getElementById('edit-modal');
    if (modal) { modal.classList.remove('visible'); setTimeout(() => { modal.style.display = 'none'; resetMemoryForm(); }, 200); }
}


/**
 * Load and display memories (unchanged logic, translated UI text)
 */
async function cargarYMostrarMemorias(diaId, targetDivId) { /* ... unchanged logic, translated UI text ... */
    const memoriasListDiv = document.getElementById(targetDivId);
    if (!memoriasListDiv) { console.error("Target div missing:", targetDivId); return; }
    memoriasListDiv.innerHTML = 'Loading...'; currentMemories = [];
    try {
        const memoriasRef = collection(db, "Dias", diaId, "Memorias");
        const q = query(memoriasRef, orderBy("Fecha_Original", "desc"));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) { memoriasListDiv.innerHTML = '<p style="font-style: italic; color: #777; font-size: 12px;">No memories yet.</p>'; return; } // Translated
        memoriasListDiv.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const memoria = { id: docSnap.id, ...docSnap.data() }; currentMemories.push(memoria);
            const itemDiv = document.createElement('div'); itemDiv.className = 'memoria-item';
            let fechaStr = 'Unknown date'; // Translated
            if (memoria.Fecha_Original?.toDate) {
                 try { fechaStr = memoria.Fecha_Original.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); } // Use en-US locale
                 catch(e) { fechaStr = memoria.Fecha_Original.toDate().toISOString().split('T')[0]; }
            } else if (memoria.Fecha_Original) { fechaStr = memoria.Fecha_Original.toString(); }
            const actionsHTML = (targetDivId === 'edit-memorias-list') ? `
                <div class="memoria-actions">
                    <button class="edit-btn" title="Edit">${editIconSVG}</button>
                    <button class="delete-btn" title="Delete">${deleteIconSVG}</button>
                </div>` : ''; // Translated titles
            itemDiv.innerHTML = `<div class="memoria-item-content"><small>${fechaStr}</small>${memoria.Descripcion || ''}</div>${actionsHTML}`;
            if (targetDivId === 'edit-memorias-list') {
                itemDiv.querySelector('.edit-btn').onclick = () => startEditMemoria(memoria);
                itemDiv.querySelector('.delete-btn').onclick = () => confirmDeleteMemoria(diaId, memoria.id, memoria.Descripcion);
            }
            memoriasListDiv.appendChild(itemDiv);
        });
        console.log(`Loaded ${currentMemories.length} memories for ${diaId} into ${targetDivId}`);
    } catch (e) { console.error(`Error loading memories ${diaId}:`, e); memoriasListDiv.innerHTML = '<p class="error">Error loading memories.</p>'; } // Translated
}


// --- Rest of CRUD functions (unchanged logic, translated UI text) ---
function startEditMemoria(memoria) { /* ... unchanged logic ... */
    editingMemoryId = memoria.id;
    const fechaInput = document.getElementById('memoria-fecha'); const descInput = document.getElementById('memoria-desc');
    const addButton = document.getElementById('add-memoria-btn');
    if (memoria.Fecha_Original?.toDate) {
        try { fechaInput.value = memoria.Fecha_Original.toDate().toISOString().split('T')[0]; } catch(e) { fechaInput.value = ''; }
    } else { fechaInput.value = ''; }
    descInput.value = memoria.Descripcion || '';
    addButton.textContent = 'Update Memory'; addButton.classList.add('update-mode'); descInput.focus(); // Translated
}
async function updateMemoria(diaId, memoriaId, fechaStr, descripcion) { /* ... unchanged logic, translated UI text ... */
    const memoriaStatus = document.getElementById('memoria-status');
    if (!fechaStr || !descripcion) { memoriaStatus.textContent = 'Date and description required.'; memoriaStatus.className = 'error'; setTimeout(() => memoriaStatus.textContent = '', 3000); return; } // Translated
    memoriaStatus.textContent = 'Updating...'; memoriaStatus.className = ''; // Translated
    try {
        const dateParts = fechaStr.split('-'); const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        const fechaOriginalTimestamp = Timestamp.fromDate(localDate); const memoriaRef = doc(db, "Dias", diaId, "Memorias", memoriaId);
        await updateDoc(memoriaRef, { Fecha_Original: fechaOriginalTimestamp, Descripcion: descripcion });
        memoriaStatus.textContent = 'Memory Updated!'; memoriaStatus.className = 'success'; resetMemoryForm(); // Translated
        await cargarYMostrarMemorias(diaId, 'edit-memorias-list');
        setTimeout(() => memoriaStatus.textContent = '', 2000);
    } catch (e) { console.error("Error updating:", e); memoriaStatus.textContent = `Error: ${e.message}`; memoriaStatus.className = 'error'; }
}
function confirmDeleteMemoria(diaId, memoriaId, descripcion) { /* ... unchanged logic, translated UI text ... */
    const dialog = document.getElementById('confirm-delete-dialog'); const yesButton = document.getElementById('confirm-delete-yes');
    const textElement = document.getElementById('confirm-delete-text');
    const descPreview = descripcion ? (descripcion.length > 50 ? descripcion.substring(0, 47) + '...' : 'this memory') : 'this memory'; // Translated
    textElement.textContent = `Delete "${descPreview}"?`; dialog.style.display = 'block'; // Translated
    const editModal = document.getElementById('edit-modal'); if (editModal) editModal.appendChild(dialog);
    yesButton.onclick = async () => { dialog.style.display = 'none'; await deleteMemoria(diaId, memoriaId); };
}
async function deleteMemoria(diaId, memoriaId) { /* ... unchanged logic, translated UI text ... */
    const memoriaStatus = document.getElementById('memoria-status');
    memoriaStatus.textContent = 'Deleting...'; memoriaStatus.className = ''; // Translated
    try {
        const memoriaRef = doc(db, "Dias", diaId, "Memorias", memoriaId); await deleteDoc(memoriaRef);
        memoriaStatus.textContent = 'Memory Deleted!'; memoriaStatus.className = 'success'; // Translated
        await cargarYMostrarMemorias(diaId, 'edit-memorias-list');
        setTimeout(() => memoriaStatus.textContent = '', 2000);
    } catch (e) { console.error("Error deleting:", e); memoriaStatus.textContent = `Error: ${e.message}`; memoriaStatus.className = 'error'; }
}
async function guardarNuevaMemoria(diaId, fechaStr, descripcion) { /* ... unchanged logic, translated UI text ... */
    const memoriaStatus = document.getElementById('memoria-status');
    if (!fechaStr || !descripcion) { memoriaStatus.textContent = 'Date and description required.'; memoriaStatus.className = 'error'; setTimeout(() => memoriaStatus.textContent = '', 3000); return; } // Translated
    memoriaStatus.textContent = 'Saving...'; memoriaStatus.className = ''; // Translated
    try {
        const dateParts = fechaStr.split('-'); const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        const fechaOriginalTimestamp = Timestamp.fromDate(localDate); const memoriasRef = collection(db, "Dias", diaId, "Memorias");
        await addDoc(memoriasRef, { Fecha_Original: fechaOriginalTimestamp, Descripcion: descripcion, Creado_En: Timestamp.now() });
        memoriaStatus.textContent = 'Memory Saved!'; memoriaStatus.className = 'success'; resetMemoryForm(); // Translated
        await cargarYMostrarMemorias(diaId, 'edit-memorias-list');
        setTimeout(() => memoriaStatus.textContent = '', 2000);
    } catch (e) { console.error("Error saving new:", e); memoriaStatus.textContent = `Error: ${e.message}`; memoriaStatus.className = 'error'; }
}
function resetMemoryForm() { /* ... unchanged logic ... */
    editingMemoryId = null;
    const form = document.getElementById('add-memoria-form');
    if(form) {
        form.reset();
        const addButton = document.getElementById('add-memoria-btn');
        addButton.textContent = 'Add Memory'; // Translated
        addButton.classList.remove('update-mode');
        const statusEl = document.getElementById('memoria-status');
        if(statusEl) statusEl.textContent = '';
    }
}
async function guardarNombreEspecial(diaId, nuevoNombre) { /* ... unchanged logic, translated UI text ... */
    const status = document.getElementById('save-status');
    try {
        status.textContent = "Saving..."; status.className = ''; const diaRef = doc(db, "Dias", diaId); const valorFinal = nuevoNombre || "Unnamed Day"; // Translated
        await updateDoc(diaRef, { Nombre_Especial: valorFinal }); const diaIndex = allDaysData.findIndex(d => d.id === diaId);
        if (diaIndex !== -1) allDaysData[diaIndex].Nombre_Especial = valorFinal;
        status.textContent = "Name Saved!"; status.className = 'success'; // Translated
         // Update currently open day object if preview is open or will be reopened
         if(currentlyOpenDay && currentlyOpenDay.id === diaId) {
             currentlyOpenDay.Nombre_Especial = valorFinal;
         }
        setTimeout(() => { status.textContent = ''; dibujarMesActual(); }, 1200);
    } catch (e) { status.textContent = `Error: ${e.message}`; status.className = 'error'; console.error(e); }
}

// --- Start App ---
checkAndRunApp();
```eof
