/* app.js - v7.5 - Corrected Batch Deletion Logic */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
    getFirestore, collection, getDocs, doc, updateDoc,
    writeBatch, setDoc, deleteDoc, Timestamp, query, orderBy, addDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// --- Firebase Config ---
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
const monthNameDisplayEl = document.getElementById("month-name-display");
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

let allDaysData = [];
let currentMonthIndex = new Date().getMonth();
let currentMemories = [];
let editingMemoryId = null;
let currentlyOpenDay = null;
let selectedMusicTrack = null;

// --- SVG Icons ---
const editIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg>`;
const deleteIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m3 0l-.5 8.5a.5.5 0 1 0 .998-.06l.5-8.5a.5.5 0 1 0-.998.06m3 .5l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Z"/></svg>`;
const pencilIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/></svg>`;


// --- Check/Repair DB ---
async function checkAndRunApp() {
    console.log("Starting Check/Repair v7.5..."); // Version updated
    appContent.innerHTML = "<p>Verifying database...</p>";
    try {
        const diasRef = collection(db, "Dias");
        const checkSnapshot = await getDocs(diasRef);
        const currentDocCount = checkSnapshot.size;
        console.log(`Docs in 'Dias': ${currentDocCount}`);
        if (currentDocCount < 366) {
            console.warn(`Repairing... Found ${currentDocCount} docs, expected 366.`);
            await generateCleanDatabase();
        } else if (currentDocCount > 366) {
             console.warn(`Found ${currentDocCount} docs, expected 366. Check for duplicates?`);
             console.log("DB verified (>= 366 days).");
        } else {
            console.log("DB verified (366 days).");
        }
        await loadDataAndDrawCalendar();
    } catch (e) { appContent.innerHTML = `<p class="error">Critical error during startup: ${e.message}</p>`; console.error(e); }
}

// ** CORRECTED generateCleanDatabase using for...of for deletion **
async function generateCleanDatabase() {
     console.log("--- Starting Regeneration ---");
    const diasRef = collection(db, "Dias");
    try {
        console.log("Deleting existing 'Dias' collection..."); appContent.innerHTML = "<p>Deleting old data...</p>";
        const oldDocsSnapshot = await getDocs(diasRef);
        if (!oldDocsSnapshot.empty) {
            let batch = writeBatch(db);
            let deleteCount = 0;
            // Use for...of loop for async operations
            for (const docSnap of oldDocsSnapshot.docs) {
                batch.delete(docSnap.ref);
                deleteCount++;
                if (deleteCount >= 400) {
                   console.log(`Committing delete batch (${deleteCount})...`);
                   await batch.commit(); // Await is needed here
                   batch = writeBatch(db); // Reinitialize batch
                   deleteCount = 0;
                }
            }
            // Commit any remaining deletes
            if (deleteCount > 0) {
                console.log(`Committing final delete batch (${deleteCount})...`);
                await batch.commit(); // Await is needed here
            }
             console.log(`Deletion complete (${oldDocsSnapshot.size}).`);
        } else { console.log("'Dias' collection was already empty."); }
    } catch(e) { console.error("Error deleting collection:", e); appContent.innerHTML = `<p class="error">Error cleaning database: ${e.message}</p>`; throw e; }

    console.log("Generating 366 clean days..."); appContent.innerHTML = "<p>Generating 366 clean days...</p>";
    let batch = writeBatch(db); let ops = 0, created = 0;
    try {
        for (let m = 0; m < 12; m++) {
            const monthNum = m + 1, monthStr = monthNum.toString().padStart(2, '0');
            const numDays = daysInMonth[m];
            for (let d = 1; d <= numDays; d++) {
                const dayStr = d.toString().padStart(2, '0'); const diaId = `${monthStr}-${dayStr}`;
                const diaData = { Nombre_Dia: `${d} ${monthNames[m]}`, Icono: '', Nombre_Especial: "Unnamed Day" };
                const docRef = doc(db, "Dias", diaId); batch.set(docRef, diaData); ops++; created++;
                if(created % 50 === 0) appContent.innerHTML = `<p>Generating ${created}/366...</p>`;
                if (ops >= 400) {
                    console.log(`Committing generate batch (${ops})...`);
                    await batch.commit(); // Await is needed here
                    batch = writeBatch(db); ops = 0;
                }
            }
        }
        if (ops > 0) {
            console.log(`Committing final generate batch (${ops})...`);
            await batch.commit(); // Await is needed here
        }
         console.log(`--- Regeneration complete: ${created} days created ---`);
        appContent.innerHTML = `<p class="success">✅ Database regenerated with ${created} days!</p>`;
    } catch(e) { console.error("Error generating days:", e); appContent.innerHTML = `<p class="error">Error generating database: ${e.message}</p>`; throw e; }
}

async function loadDataAndDrawCalendar() {
    console.log("Loading data..."); appContent.innerHTML = "<p>Loading calendar...</p>";
    try {
        const diasSnapshot = await getDocs(collection(db, "Dias")); allDaysData = [];
        diasSnapshot.forEach((doc) => { if (doc.id?.length === 5 && doc.id.includes('-')) allDaysData.push({ id: doc.id, ...doc.data() }); });
        if (allDaysData.length === 0) throw new Error("Database empty or invalid after loading.");
        console.log(`Loaded ${allDaysData.length} valid days.`);
        allDaysData.sort((a, b) => a.id.localeCompare(b.id));
        console.log("Data sorted. First:", allDaysData[0]?.id, "Last:", allDaysData[allDaysData.length - 1]?.id);
        configurarNavegacion();
        configurarFooter();
        dibujarMesActual();
    } catch (e) { appContent.innerHTML = `<p class="error">Error loading calendar data: ${e.message}</p>`; console.error(e); }
}

function configurarNavegacion() {
     document.getElementById("prev-month").onclick = () => { currentMonthIndex = (currentMonthIndex - 1 + 12) % 12; dibujarMesActual(); };
    document.getElementById("next-month").onclick = () => { currentMonthIndex = (currentMonthIndex + 1) % 12; dibujarMesActual(); };
}

// --- Draw Current Month ---
function dibujarMesActual() {
    monthNameDisplayEl.textContent = monthNames[currentMonthIndex];
    const monthNumberTarget = currentMonthIndex + 1;
    console.log(`Drawing month ${monthNumberTarget} (${monthNames[currentMonthIndex]})`);
    const diasDelMes = allDaysData.filter(dia => {
        try { return parseInt(dia.id.substring(0, 2), 10) === monthNumberTarget; }
        catch (e) { console.error(`Error parsing ID '${dia.id}' during filter`, e); return false; }
    });
    console.log(`Found ${diasDelMes.length} days for month ${monthNumberTarget}.`);
    appContent.innerHTML = `<div class="calendario-grid" id="grid-dias"></div>`;
    const grid = document.getElementById("grid-dias");
    if (diasDelMes.length === 0) { grid.innerHTML = "<p>No days found for this month.</p>"; return; }
    const diasEsperados = daysInMonth[currentMonthIndex];
    if (diasDelMes.length !== diasEsperados) console.warn(`ALERT: Found ${diasDelMes.length}/${diasEsperados} days for ${monthNames[currentMonthIndex]}.`);

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

// --- Footer Actions ---
function configurarFooter() {
    document.getElementById('btn-hoy').onclick = () => {
        const today = new Date();
        const todayMonth = (today.getMonth() + 1).toString().padStart(2, '0');
        const todayDay = today.getDate().toString().padStart(2, '0');
        const todayId = `${todayMonth}-${todayDay}`;
        console.log("Today button clicked, searching for ID:", todayId);
        const todayDia = allDaysData.find(d => d.id === todayId);
        if (todayDia) {
             currentMonthIndex = today.getMonth(); dibujarMesActual();
             setTimeout(() => abrirModalPreview(todayDia), 50); window.scrollTo(0, 0);
        } else { console.error("Could not find today's data:", todayId); alert("Error: Could not find data for today."); }
    };
    document.getElementById('btn-buscar').onclick = () => {
        const searchTerm = prompt("Search memories by text (case-insensitive):");
        if (searchTerm?.trim()) { buscarMemorias(searchTerm.trim().toLowerCase()); }
    };
    document.getElementById('btn-shuffle').onclick = () => {
        if (allDaysData.length > 0) {
            const randomIndex = Math.floor(Math.random() * allDaysData.length);
            const randomDia = allDaysData[randomIndex];
            console.log("Shuffle button clicked, opening random day:", randomDia.id);
             currentMonthIndex = parseInt(randomDia.id.substring(0, 2), 10) - 1; dibujarMesActual();
             setTimeout(() => abrirModalPreview(randomDia), 50); window.scrollTo(0, 0);
        }
    };
    document.getElementById('btn-add-memory').onclick = () => { abrirModalAddMemory(); };
}

// --- Search Memories ---
async function buscarMemorias(term) {
    console.log("Searching memories containing:", term);
    appContent.innerHTML = `<p>Searching memories containing "${term}"...</p>`;
    let results = []; let daysSearched = 0;
    try {
        for (const dia of allDaysData) {
            const memoriasRef = collection(db, "Dias", dia.id, "Memorias");
            const memSnapshot = await getDocs(memoriasRef);
            daysSearched++;
            memSnapshot.forEach(memDoc => {
                const memoria = { diaId: dia.id, diaNombre: dia.Nombre_Dia, id: memDoc.id, ...memDoc.data() };
                let searchableText = memoria.Descripcion || '';
                if(memoria.LugarNombre) searchableText += ' ' + memoria.LugarNombre;
                if(memoria.CancionInfo) searchableText += ' ' + memoria.CancionInfo;

                if (searchableText.toLowerCase().includes(term)) { results.push(memoria); }
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
                 let fechaStr = 'Unknown date';
                 if (mem.Fecha_Original?.toDate) {
                     try { fechaStr = mem.Fecha_Original.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
                     catch(e) { fechaStr = mem.Fecha_Original.toDate().toISOString().split('T')[0]; }
                 } else if (mem.Fecha_Original) { fechaStr = mem.Fecha_Original.toString(); }

                 let contentHTML = `<small><b>${mem.diaNombre} (${mem.diaId})</b> - ${fechaStr}</small>`;
                 switch (mem.Tipo) {
                     case 'Lugar': contentHTML += `📍 Visited: ${mem.LugarNombre || 'Unknown Place'}`; break;
                     case 'Musica':
                        if (mem.CancionData?.trackName) contentHTML += `🎵 Listened to: <strong>${mem.CancionData.trackName}</strong> by ${mem.CancionData.artistName}`;
                        else contentHTML += `🎵 Listened to: ${mem.CancionInfo || 'Unknown Song'}`;
                        break;
                     case 'Imagen':
                         contentHTML += `🖼️ Added Image`;
                         if (mem.ImagenURL) contentHTML += ` (<a href="${mem.ImagenURL}" target="_blank" style="font-size: 10px;">View</a>)`;
                         if (mem.Descripcion) contentHTML += `<br>${mem.Descripcion}`;
                         break;
                     case 'Texto': default: contentHTML += mem.Descripcion || ''; break;
                 }

                itemDiv.innerHTML = `<div class="memoria-item-content">${contentHTML}</div>`;
                 itemDiv.style.cursor = 'pointer';
                 itemDiv.onclick = () => {
                     const monthIndex = parseInt(mem.diaId.substring(0, 2), 10) - 1;
                     if (monthIndex >= 0 && monthIndex < 12) {
                         currentMonthIndex = monthIndex; dibujarMesActual();
                         const targetDia = allDaysData.find(d => d.id === mem.diaId);
                         if(targetDia) setTimeout(() => abrirModalPreview(targetDia), 50);
                         window.scrollTo(0, 0);
                     }
                 };
                resultsList.appendChild(itemDiv);
            }); appContent.appendChild(resultsList);
        }
    } catch (e) { appContent.innerHTML = `<p class="error">Error during search: ${e.message}</p>`; console.error(e); }
}


// --- Preview Modal ---
async function abrirModalPreview(dia) {
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
        document.getElementById('edit-from-preview-btn').onclick = () => {
             cerrarModalPreview();
             if (currentlyOpenDay) { setTimeout(() => abrirModalEdicion(currentlyOpenDay), 210); }
             else { console.error("Cannot open edit modal, currentlyOpenDay is null"); }
        };
    }
    document.getElementById('preview-title').textContent = `${dia.Nombre_Dia} ${dia.Nombre_Especial !== 'Unnamed Day' ? '('+dia.Nombre_Especial+')' : ''}`;
    modal.style.display = 'flex'; setTimeout(() => modal.classList.add('visible'), 10);
    await cargarYMostrarMemorias(dia.id, 'preview-memorias-list');
}
function cerrarModalPreview() {
    const modal = document.getElementById('preview-modal');
    if (modal) { modal.classList.remove('visible'); setTimeout(() => { modal.style.display = 'none'; }, 200); }
    currentlyOpenDay = null;
}

// --- Edit Modal ---
async function abrirModalEdicion(dia) {
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
                        <label for="memoria-desc">Description / Content:</label>
                        <textarea id="memoria-desc" placeholder="Write memory or edit content..." required maxlength="500"></textarea>
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
        document.getElementById('confirm-delete-no').onclick = () => {
             const dialog = document.getElementById('confirm-delete-dialog');
             if(dialog) dialog.style.display = 'none';
        };
    }
    resetMemoryForm();
    document.getElementById('edit-modal-title').textContent = `Editing: ${dia.Nombre_Dia} (${dia.id})`;
    const inputNombreEspecial = document.getElementById('nombre-especial-input');
    inputNombreEspecial.value = dia.Nombre_Especial === 'Unnamed Day' ? '' : dia.Nombre_Especial;
    document.getElementById('save-status').textContent = '';
    document.getElementById('memoria-status').textContent = '';
    const confirmDialog = document.getElementById('confirm-delete-dialog');
    if(confirmDialog) confirmDialog.style.display = 'none';

    document.getElementById('save-name-btn').onclick = () => guardarNombreEspecial(dia.id, inputNombreEspecial.value.trim());

    const addMemoriaForm = document.getElementById('add-memoria-form');
    // Ensure only one submit listener is attached
    addMemoriaForm.onsubmit = null;
    addMemoriaForm.onsubmit = async (e) => {
        e.preventDefault();
        const fechaInput = document.getElementById('memoria-fecha').value;
        const descInput = document.getElementById('memoria-desc').value;
        if (editingMemoryId) { await updateMemoria(dia.id, editingMemoryId, fechaInput, descInput.trim()); }
        else { await guardarNuevaMemoria(dia.id, fechaInput, descInput.trim()); }
    };

    modal.style.display = 'flex'; setTimeout(() => modal.classList.add('visible'), 10);
    await cargarYMostrarMemorias(dia.id, 'edit-memorias-list');
}
function cerrarModalEdicion() {
    const modal = document.getElementById('edit-modal');
    if (modal) { modal.classList.remove('visible'); setTimeout(() => { modal.style.display = 'none'; resetMemoryForm(); }, 200); }
    currentlyOpenDay = null;
}

// --- Load/Display Memories ---
async function cargarYMostrarMemorias(diaId, targetDivId) {
    const memoriasListDiv = document.getElementById(targetDivId);
    if (!memoriasListDiv) { console.error("Target div missing:", targetDivId); return; }
    memoriasListDiv.innerHTML = 'Loading...'; currentMemories = [];
    try {
        const memoriasRef = collection(db, "Dias", diaId, "Memorias");
        const q = query(memoriasRef, orderBy("Fecha_Original", "desc"));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) { memoriasListDiv.innerHTML = '<p style="font-style: italic; color: #777; font-size: 12px;">No memories yet.</p>'; return; }
        memoriasListDiv.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const memoria = { id: docSnap.id, ...docSnap.data() };
            currentMemories.push(memoria); // Add to local cache for edit/delete

            const itemDiv = document.createElement('div'); itemDiv.className = 'memoria-item';
            let fechaStr = 'Unknown date';
            if (memoria.Fecha_Original?.toDate) {
                 try { fechaStr = memoria.Fecha_Original.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
                 catch(e) { fechaStr = memoria.Fecha_Original.toDate().toISOString().split('T')[0]; }
            } else if (memoria.Fecha_Original) { fechaStr = memoria.Fecha_Original.toString(); }

            let contentHTML = `<small>${fechaStr}</small>`;
            switch (memoria.Tipo) {
                case 'Lugar': contentHTML += `📍 Visited: ${memoria.LugarNombre || 'Unknown Place'}`; break;
                case 'Musica':
                     if (memoria.CancionData?.trackName) contentHTML += `🎵 Listened to: <strong>${memoria.CancionData.trackName}</strong> by ${memoria.CancionData.artistName}`;
                     else contentHTML += `🎵 Listened to: ${memoria.CancionInfo || 'Unknown Song'}`;
                     break;
                case 'Imagen':
                    contentHTML += `🖼️ Added Image`;
                    if (memoria.ImagenURL) contentHTML += ` (<a href="${memoria.ImagenURL}" target="_blank" style="font-size: 10px;">View</a>)`;
                    if (memoria.Descripcion) contentHTML += `<br>${memoria.Descripcion}`;
                    break;
                case 'Texto': default: contentHTML += memoria.Descripcion || 'No description'; break;
            }

            // Only add edit/delete buttons in the edit modal
            const actionsHTML = (targetDivId === 'edit-memorias-list') ? `
                <div class="memoria-actions">
                    <button class="edit-btn" title="Edit">${editIconSVG}</button>
                    <button class="delete-btn" title="Delete">${deleteIconSVG}</button>
                </div>` : '';
            itemDiv.innerHTML = `<div class="memoria-item-content">${contentHTML}</div>${actionsHTML}`;

            if (targetDivId === 'edit-memorias-list') {
                itemDiv.querySelector('.edit-btn').onclick = () => startEditMemoria(memoria);
                const displayInfo = memoria.Descripcion || memoria.LugarNombre || memoria.CancionInfo || memoria.ImagenURL || "this memory";
                itemDiv.querySelector('.delete-btn').onclick = () => confirmDeleteMemoria(diaId, memoria.id, displayInfo);
            }
            memoriasListDiv.appendChild(itemDiv);
        });
        console.log(`Loaded ${currentMemories.length} memories for ${diaId} into ${targetDivId}`);
    } catch (e) { console.error(`Error loading memories ${diaId}:`, e); memoriasListDiv.innerHTML = '<p class="error">Error loading memories.</p>'; }
}


// --- CRUD Functions ---
function startEditMemoria(memoria) {
    editingMemoryId = memoria.id;
    const fechaInput = document.getElementById('memoria-fecha');
    const descInput = document.getElementById('memoria-desc');
    const addButton = document.getElementById('add-memoria-btn');

    if (memoria.Fecha_Original?.toDate) {
        try { fechaInput.value = memoria.Fecha_Original.toDate().toISOString().split('T')[0]; } catch(e) { fechaInput.value = ''; }
    } else { fechaInput.value = ''; }

    let contentToEdit = '';
    let placeholderText = "Edit content..."; // Default placeholder
    switch (memoria.Tipo) {
        case 'Lugar': contentToEdit = memoria.LugarNombre || ''; placeholderText = "Edit Place Name..."; break;
        case 'Musica': contentToEdit = memoria.CancionInfo || ''; placeholderText = "Edit Music Info (Text)..."; break;
        case 'Imagen':
             contentToEdit = memoria.Descripcion || memoria.ImagenURL || ''; // Prefer description
             placeholderText = "Edit Image Description or URL...";
             break;
        case 'Texto': default: contentToEdit = memoria.Descripcion || ''; placeholderText = "Edit description..."; break;
    }
    descInput.value = contentToEdit;
    descInput.placeholder = placeholderText;

    addButton.textContent = 'Update Memory';
    addButton.classList.add('update-mode');
    descInput.focus();
}

async function updateMemoria(diaId, memoriaId, fechaStr, contentValue) {
    const memoriaStatus = document.getElementById('memoria-status');
    if (!fechaStr || !contentValue) {
        memoriaStatus.textContent = 'Date and content required.'; memoriaStatus.className = 'error';
        setTimeout(() => memoriaStatus.textContent = '', 3000); return;
    }
    memoriaStatus.textContent = 'Updating...'; memoriaStatus.className = '';
    try {
        const dateParts = fechaStr.split('-');
        const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        // Add basic date validation
        if (isNaN(localDate.getTime())) throw new Error("Invalid date format.");
        const fechaOriginalTimestamp = Timestamp.fromDate(localDate);
        const memoriaRef = doc(db, "Dias", diaId, "Memorias", memoriaId);

        const originalMemoria = currentMemories.find(m => m.id === memoriaId);
        let updateData = { Fecha_Original: fechaOriginalTimestamp };

        // Update correct field based on original type
        switch (originalMemoria?.Tipo) {
             case 'Lugar': updateData.LugarNombre = contentValue; break;
             case 'Musica': updateData.CancionInfo = contentValue; break; // Still updating raw text
             case 'Imagen':
                 // Assume textarea edits the Description for images
                 updateData.Descripcion = contentValue;
                 // We don't update the URL here, assume it's fixed or managed elsewhere
                 break;
             case 'Texto': default: updateData.Descripcion = contentValue; break;
        }

        await updateDoc(memoriaRef, updateData);
        memoriaStatus.textContent = 'Memory Updated!'; memoriaStatus.className = 'success';
        resetMemoryForm();
        await cargarYMostrarMemorias(diaId, 'edit-memorias-list');
        setTimeout(() => memoriaStatus.textContent = '', 2000);
    } catch (e) { console.error("Error updating:", e); memoriaStatus.textContent = `Error: ${e.message}`; memoriaStatus.className = 'error'; }
}

function confirmDeleteMemoria(diaId, memoriaId, displayInfo) {
    const dialog = document.getElementById('confirm-delete-dialog');
    const yesButton = document.getElementById('confirm-delete-yes');
    const textElement = document.getElementById('confirm-delete-text');
    const descPreview = displayInfo ? (displayInfo.length > 50 ? displayInfo.substring(0, 47) + '...' : displayInfo) : 'this memory';
    textElement.textContent = `Delete "${descPreview}"?`;
    dialog.style.display = 'block';

    // Ensure dialog is within the modal content for proper display/styling
    const editModalContent = document.querySelector('#edit-modal .modal-content');
    if (editModalContent) {
         // Check if dialog is already a child, append if not
         if (!editModalContent.contains(dialog)) {
              editModalContent.appendChild(dialog);
         }
    } else {
        console.warn("Could not find edit modal content to append confirm dialog.");
    }


    yesButton.onclick = null; // Remove previous listener
    yesButton.onclick = async () => {
        dialog.style.display = 'none';
        await deleteMemoria(diaId, memoriaId);
    };
}

async function deleteMemoria(diaId, memoriaId) {
    const memoriaStatus = document.getElementById('memoria-status');
    memoriaStatus.textContent = 'Deleting...'; memoriaStatus.className = '';
    console.log(`Attempting to delete: Dias/${diaId}/Memorias/${memoriaId}`);
    try {
        const memoriaRef = doc(db, "Dias", diaId, "Memorias", memoriaId);
        await deleteDoc(memoriaRef);
        console.log("Successfully deleted:", memoriaId);
        memoriaStatus.textContent = 'Memory Deleted!'; memoriaStatus.className = 'success';
        currentMemories = currentMemories.filter(m => m.id !== memoriaId); // Update local cache
        await cargarYMostrarMemorias(diaId, 'edit-memorias-list');
        setTimeout(() => memoriaStatus.textContent = '', 2000);
    } catch (e) { console.error("Error deleting memory:", e); memoriaStatus.textContent = `Error: ${e.message}`; memoriaStatus.className = 'error'; }
}

// Simplified version for the Edit modal form (only adds Texto type)
async function guardarNuevaMemoria(diaId, fechaStr, descripcion) {
     const memoriaStatus = document.getElementById('memoria-status');
     if (!fechaStr || !descripcion) { memoriaStatus.textContent = 'Date and description required.'; memoriaStatus.className = 'error'; setTimeout(() => memoriaStatus.textContent = '', 3000); return; }
     memoriaStatus.textContent = 'Saving...'; memoriaStatus.className = '';
     try {
         const dateParts = fechaStr.split('-');
         const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
         if (isNaN(localDate.getTime())) throw new Error("Invalid date format.");
         const fechaOriginalTimestamp = Timestamp.fromDate(localDate);
         const memoriasRef = collection(db, "Dias", diaId, "Memorias");
         await addDoc(memoriasRef, {
              Tipo: 'Texto',
              Fecha_Original: fechaOriginalTimestamp,
              Descripcion: descripcion,
              Creado_En: Timestamp.now()
          });
         memoriaStatus.textContent = 'Memory Saved!'; memoriaStatus.className = 'success';
         resetMemoryForm();
         await cargarYMostrarMemorias(diaId, 'edit-memorias-list');
         setTimeout(() => memoriaStatus.textContent = '', 2000);
     } catch (e) { console.error("Error saving new memory:", e); memoriaStatus.textContent = `Error: ${e.message}`; memoriaStatus.className = 'error'; }
 }

function resetMemoryForm() {
    editingMemoryId = null;
    const form = document.getElementById('add-memoria-form'); // Assumes this ID is unique to the edit modal form
    if(form) {
        form.reset();
        const addButton = document.getElementById('add-memoria-btn'); // Assumes this ID is unique
        if (addButton) {
            addButton.textContent = 'Add Memory';
            addButton.classList.remove('update-mode');
        }
        const statusEl = document.getElementById('memoria-status'); // Assumes this ID is unique
        if(statusEl) statusEl.textContent = '';
        const descInput = document.getElementById('memoria-desc'); // Assumes this ID is unique
        if (descInput) descInput.placeholder = "Write your memory...";
    }
}

async function guardarNombreEspecial(diaId, nuevoNombre) {
    const status = document.getElementById('save-status');
    try {
        status.textContent = "Saving..."; status.className = ''; const diaRef = doc(db, "Dias", diaId); const valorFinal = nuevoNombre || "Unnamed Day";
        await updateDoc(diaRef, { Nombre_Especial: valorFinal }); const diaIndex = allDaysData.findIndex(d => d.id === diaId);
        if (diaIndex !== -1) allDaysData[diaIndex].Nombre_Especial = valorFinal;
        status.textContent = "Name Saved!"; status.className = 'success';
         if(currentlyOpenDay && currentlyOpenDay.id === diaId) { currentlyOpenDay.Nombre_Especial = valorFinal; }
         setTimeout(() => { status.textContent = ''; dibujarMesActual(); }, 1200); // Redraw month on success
         // Update preview title immediately if it's open
         const previewTitle = document.getElementById('preview-title');
         const previewModal = document.getElementById('preview-modal');
         if(previewTitle && currentlyOpenDay && currentlyOpenDay.id === diaId && previewModal?.style.display === 'flex') {
             previewTitle.textContent = `${currentlyOpenDay.Nombre_Dia} ${valorFinal !== 'Unnamed Day' ? '('+valorFinal+')' : ''}`;
         }
    } catch (e) { status.textContent = `Error: ${e.message}`; status.className = 'error'; console.error(e); }
}


// --- Add Memory Modal ---
function abrirModalAddMemory() {
    console.log("Opening Add Memory modal...");
    selectedMusicTrack = null;
    let modal = document.getElementById('add-memory-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'add-memory-modal';
        modal.className = 'modal-add-memory'; // Use specific class for styling
        modal.innerHTML = `
             <div class="modal-add-memory-content"> {/* Use specific class */}
                <h3>Add New Memory</h3>
                <div class="add-memory-form-section">
                    <label for="add-mem-day">Select Day (MM-DD):</label>
                    <select id="add-mem-day"></select>
                    <label for="add-mem-year">Year of Memory:</label>
                    <input type="number" id="add-mem-year" placeholder="YYYY" min="1800" max="${new Date().getFullYear() + 1}" required> {/* Adjusted year range */}
                </div>
                <div class="add-memory-form-section">
                    <label for="add-mem-type">Type of Memory:</label>
                    <select id="add-mem-type">
                        <option value="Texto">Description</option>
                        <option value="Lugar">Place</option>
                        <option value="Musica">Music</option>
                        <option value="Imagen">Image</option>
                    </select>
                    {/* Inputs */}
                    <div id="input-type-Texto"><label for="add-mem-desc">Description:</label><textarea id="add-mem-desc" placeholder="Write your memory..."></textarea></div>
                    <div id="input-type-Lugar" style="display: none;"><label for="add-mem-place">Place Name:</label><input type="text" id="add-mem-place" placeholder="Enter place name..."><button type="button" class="placeholder-button" onclick="alert('Place search coming soon!')">Search Place (Future)</button></div>
                    <div id="input-type-Musica" style="display: none;"><label for="add-mem-music-search">Search iTunes:</label><input type="text" id="add-mem-music-search" placeholder="Enter song or album title..."><button type="button" class="aqua-button" id="btn-search-itunes">Search Music</button><div id="itunes-results"></div></div> {/* Removed extra classes */}
                    <div id="input-type-Imagen" style="display: none;"><label for="add-mem-image-url">Image URL:</label><input type="url" id="add-mem-image-url" placeholder="http://..."><label for="add-mem-image-desc">Image Description (Optional):</label><input type="text" id="add-mem-image-desc" placeholder="Describe the image..."><button type="button" class="placeholder-button" onclick="alert('Image upload coming soon!')">Upload Image (Future)</button></div>
                </div>
                <div class="button-group"> {/* Standardized button group */}
                    <button type="button" id="close-add-mem-btn" class="aqua-button">Cancel</button>
                    <button type="button" id="save-add-mem-btn" class="aqua-button">Save Memory</button>
                </div>
                 <p id="add-memory-status"></p>
            </div>`;
        document.body.appendChild(modal);

        const daySelect = document.getElementById('add-mem-day');
        daySelect.innerHTML = '';
        allDaysData.forEach(dia => {
            const option = document.createElement('option');
            option.value = dia.id; option.textContent = dia.Nombre_Dia; daySelect.appendChild(option);
        });

        // Set default date to today
        const today = new Date(); const todayMonth = (today.getMonth() + 1).toString().padStart(2, '0');
        const todayDay = today.getDate().toString().padStart(2, '0'); const todayId = `${todayMonth}-${todayDay}`;
        if (daySelect.querySelector(`option[value="${todayId}"]`)) daySelect.value = todayId;
        document.getElementById('add-mem-year').value = today.getFullYear();

        document.getElementById('add-mem-type').addEventListener('change', handleMemoryTypeChange);
        document.getElementById('close-add-mem-btn').onclick = () => cerrarModalAddMemory();
        document.getElementById('save-add-mem-btn').onclick = () => saveMemoryFromAddModal();
        modal.onclick = (e) => { if (e.target.id === 'add-memory-modal') cerrarModalAddMemory(); };
        document.getElementById('btn-search-itunes').onclick = buscarBSO; // Attach search listener
    }

    // Reset fields and show
    document.getElementById('add-memory-status').textContent = '';
    selectedMusicTrack = null;
    document.getElementById('itunes-results').innerHTML = '';
    document.getElementById('add-mem-music-search').value = '';
    document.getElementById('add-mem-desc').value = '';
    document.getElementById('add-mem-place').value = '';
    document.getElementById('add-mem-image-url').value = '';
    document.getElementById('add-mem-image-desc').value = '';
    document.getElementById('add-mem-type').value = 'Texto';

    // Set default date every time modal opens
    const today = new Date(); const todayMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    const todayDay = today.getDate().toString().padStart(2, '0'); const todayId = `${todayMonth}-${todayDay}`;
    const daySelect = document.getElementById('add-mem-day');
     if (daySelect.querySelector(`option[value="${todayId}"]`)) daySelect.value = todayId;
     document.getElementById('add-mem-year').value = today.getFullYear();

    handleMemoryTypeChange(); // Show correct initial fields
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);
}

function handleMemoryTypeChange() {
    const selectedType = document.getElementById('add-mem-type').value;
    const typeDivs = ['input-type-Texto', 'input-type-Lugar', 'input-type-Musica', 'input-type-Imagen'];
    typeDivs.forEach(id => {
        const div = document.getElementById(id); if (div) div.style.display = 'none';
    });
    const divToShow = document.getElementById(`input-type-${selectedType}`);
    if (divToShow) { divToShow.style.display = 'block'; }
    if (selectedType !== 'Musica') {
        const resultsDiv = document.getElementById('itunes-results'); if (resultsDiv) resultsDiv.innerHTML = '';
        selectedMusicTrack = null;
    }
}

function cerrarModalAddMemory() {
    const modal = document.getElementById('add-memory-modal');
    if (modal) { modal.classList.remove('visible'); setTimeout(() => { modal.style.display = 'none'; }, 200); }
}

// --- iTunes Search Function ---
async function buscarBSO() {
    const queryInput = document.getElementById('add-mem-music-search');
    const resultsDiv = document.getElementById('itunes-results');
    const statusDiv = document.getElementById('add-memory-status');
    const query = queryInput.value.trim();
    if (!query) { resultsDiv.innerHTML = '<p class="error" style="padding: 5px;">Please enter a search term.</p>'; return; }

    resultsDiv.innerHTML = '<p style="padding: 5px;">Searching iTunes...</p>';
    statusDiv.textContent = ''; selectedMusicTrack = null;

    // Using a reliable CORS proxy
    const proxyUrl = 'https://corsproxy.io/?';
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5`;
    const url = proxyUrl + encodeURIComponent(itunesUrl); // Encode the target URL
    console.log("Fetching iTunes URL via proxy:", url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
             let errorText = await response.text();
             console.error("iTunes fetch failed:", response.status, errorText);
             throw new Error(`HTTP error ${response.status}: ${errorText.substring(0, 100)}`);
         }
        const data = await response.json();
        const actualData = data; // Assuming direct JSON response from this proxy

        if (!actualData.results || actualData.resultCount === 0) {
            resultsDiv.innerHTML = '<p style="padding: 5px;">No results found.</p>';
            return;
        }

        resultsDiv.innerHTML = ''; // Clear results before adding new ones
        actualData.results.forEach(track => {
            const trackDiv = document.createElement('div');
            trackDiv.className = 'itunes-track';
            const artworkUrl = track.artworkUrl100 || track.artworkUrl60 || '';
            trackDiv.innerHTML = `
                <img src="${artworkUrl}" alt="Artwork" style="${artworkUrl ? '' : 'display:none;'}" onerror="this.style.display='none'">
                <div class="itunes-track-info">
                    <div class="itunes-track-name">${track.trackName || 'Unknown Track'}</div>
                    <div class="itunes-track-artist">${track.artistName || 'Unknown Artist'}</div>
                </div>
                <div class="itunes-track-select">➔</div>
            `;
            // Add click listener to select the track
            trackDiv.onclick = () => {
                selectedMusicTrack = track; // Store the selected track data
                // Update the input field to show selection (optional)
                queryInput.value = `${track.trackName} - ${track.artistName}`;
                // Visually indicate selection and clear other results
                resultsDiv.innerHTML = `<p style="padding: 5px; color: green; font-weight: bold;">Selected: ${track.trackName}</p>`;
                console.log("Selected music track:", selectedMusicTrack);
            };
            resultsDiv.appendChild(trackDiv);
        });

    } catch (error) {
        console.error('Error fetching/processing iTunes data:', error);
        resultsDiv.innerHTML = `<p class="error" style="padding: 5px;">Error searching music. Check console.</p>`;
         if (error instanceof TypeError && error.message.includes('fetch')) {
             resultsDiv.innerHTML += `<br><small>Network error or CORS issue.</small>`;
         } else if (error instanceof SyntaxError) {
             resultsDiv.innerHTML += `<br><small>Invalid response from server/proxy.</small>`;
         } else {
             resultsDiv.innerHTML += `<br><small>${error.message}</small>`;
         }
    }
}


// --- Save Memory from Add Modal ---
async function saveMemoryFromAddModal() {
    const statusDiv = document.getElementById('add-memory-status');
    statusDiv.className = ''; statusDiv.textContent = 'Saving...';

    const diaId = document.getElementById('add-mem-day').value;
    const yearInput = document.getElementById('add-mem-year');
    const year = parseInt(yearInput.value, 10);
    const type = document.getElementById('add-mem-type').value;

    if (!diaId) { statusDiv.textContent = 'Please select a day.'; statusDiv.className = 'error'; return; }
    if (!year || year < 1800 || year > new Date().getFullYear() + 1) {
        statusDiv.textContent = 'Please enter a valid year.'; statusDiv.className = 'error'; yearInput.focus(); return;
    }
    const month = parseInt(diaId.substring(0, 2), 10); const day = parseInt(diaId.substring(3), 10);
    if (day < 1 || day > daysInMonth[month - 1]) {
         statusDiv.textContent = 'Invalid day selected for this month.'; statusDiv.className = 'error'; return;
    }

    const dateOfMemory = new Date(Date.UTC(year, month - 1, day));
    if (isNaN(dateOfMemory.getTime())) {
         statusDiv.textContent = 'Invalid date components.'; statusDiv.className = 'error'; return;
    }
    const fechaOriginalTimestamp = Timestamp.fromDate(dateOfMemory);

    let memoryData = { Fecha_Original: fechaOriginalTimestamp, Tipo: type, Creado_En: Timestamp.now() };
    let isValid = true;

    switch (type) {
        case 'Texto':
            memoryData.Descripcion = document.getElementById('add-mem-desc').value.trim();
            if (!memoryData.Descripcion) isValid = false;
            break;
        case 'Lugar':
            memoryData.LugarNombre = document.getElementById('add-mem-place').value.trim();
            if (!memoryData.LugarNombre) isValid = false; memoryData.LugarData = null;
            break;
        case 'Musica':
            if (selectedMusicTrack) {
                 // Store structured data if a track was selected from results
                 memoryData.CancionData = { trackId: selectedMusicTrack.trackId, artistName: selectedMusicTrack.artistName, trackName: selectedMusicTrack.trackName, artworkUrl60: selectedMusicTrack.artworkUrl60, trackViewUrl: selectedMusicTrack.trackViewUrl };
                 memoryData.CancionInfo = `${selectedMusicTrack.trackName} - ${selectedMusicTrack.artistName}`; // Also store plain text info
            } else {
                 // Store only the text from the input if no track was selected
                 memoryData.CancionInfo = document.getElementById('add-mem-music-search').value.trim();
                 memoryData.CancionData = null;
                 if (!memoryData.CancionInfo) isValid = false; // Require text if no track selected
            }
            break;
        case 'Imagen':
            memoryData.ImagenURL = document.getElementById('add-mem-image-url').value.trim();
            memoryData.Descripcion = document.getElementById('add-mem-image-desc').value.trim() || null;
            try { new URL(memoryData.ImagenURL); } catch (_) { isValid = false; } // Basic URL format check
            if (!memoryData.ImagenURL) isValid = false;
            break;
        default: isValid = false; break;
    }

    if (!isValid) {
        statusDiv.textContent = 'Please fill required fields correctly for the selected type.'; statusDiv.className = 'error'; return;
    }

    try {
        const memoriasRef = collection(db, "Dias", diaId, "Memorias");
        const docRef = await addDoc(memoriasRef, memoryData);
        console.log("New memory saved:", docRef.id, memoryData);
        statusDiv.textContent = 'Memory Saved!'; statusDiv.className = 'success';
         // Reset form after saving
         document.getElementById('add-mem-desc').value = '';
         document.getElementById('add-mem-place').value = '';
         document.getElementById('add-mem-music-search').value = '';
         document.getElementById('itunes-results').innerHTML = '';
         document.getElementById('add-mem-image-url').value = '';
         document.getElementById('add-mem-image-desc').value = '';
         selectedMusicTrack = null;
        setTimeout(() => { cerrarModalAddMemory(); }, 1500);
    } catch (e) { console.error("Error saving new advanced memory:", e); statusDiv.textContent = `Error: ${e.message}`; statusDiv.className = 'error'; }
}

// --- Expose functions needed by dynamically created HTML ---
window.handleMemoryTypeChange = handleMemoryTypeChange;
window.buscarBSO = buscarBSO;
window.saveMemoryFromAddModal = saveMemoryFromAddModal;
window.cerrarModalAddMemory = cerrarModalAddMemory;
window.startEditMemoria = startEditMemoria;
window.confirmDeleteMemoria = confirmDeleteMemoria;


// --- Start App ---
checkAndRunApp();

