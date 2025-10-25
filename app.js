/* app.js - v9.2 - Fix Edit Button Listener, Final Polish */

// Importaciones (Auth y Storage)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
    getFirestore, collection, getDocs, doc, updateDoc,
    writeBatch, setDoc, deleteDoc, Timestamp, query, orderBy, addDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
    getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
// import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js"; // Para subida de archivos

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
const auth = getAuth(app);
// const storage = getStorage(app); // Inicializar Storage cuando se use

const appContent = document.getElementById("app-content");
const monthNameDisplayEl = document.getElementById("month-name-display");
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // Includes leap year Feb 29

let allDaysData = [];
let currentMonthIndex = new Date().getMonth();
let currentMemories = []; // Holds memories for the currently open day (in Edit modal)
let editingMemoryId = null;
let currentlyOpenDay = null; // Holds the full day object for the open modal (Preview or Edit)
let selectedMusicTrack = null;
let selectedPlace = null;
let currentUser = null; // Variable para guardar el usuario logueado

// --- SVG Icons ---
const editIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg>`;
const deleteIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m3 0l-.5 8.5a.5.5 0 1 0 .998-.06l.5-8.5a.5.5 0 1 0-.998.06m3 .5l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Z"/></svg>`;
const pencilIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/></svg>`;
const loginIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M10 3.5a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 1 1 0v2A1.5 1.5 0 0 1 9.5 14h-8A1.5 1.5 0 0 1 0 12.5v-9A1.5 1.5 0 0 1 1.5 2h8A1.5 1.5 0 0 1 11 3.5v2a.5.5 0 0 1-1 0z"/><path fill-rule="evenodd" d="M4.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H14.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708z"/></svg>`; // Logout Icon


// --- Auth State Change Listener ---
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    updateLoginUI(user);
    // Potentially reload data or update UI based on login state if needed
    if (user) { console.log("User logged in:", user.displayName); }
    else { console.log("User logged out."); }
});

function updateLoginUI(user) {
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const userImg = document.getElementById('user-img');

    if (user) {
        if (userInfo) userInfo.style.display = 'flex';
        if (userName) userName.textContent = user.displayName || user.email || 'User';
        if (userImg) userImg.src = user.photoURL || 'https://placehold.co/30x30/ccc/fff?text=?'; // Adjusted placeholder
        if (loginBtn) {
            loginBtn.innerHTML = loginIconSVG; // Show logout icon
            loginBtn.title = "Logout";
            loginBtn.onclick = handleLogout; // Set logout action
        }
    } else {
        if (userInfo) userInfo.style.display = 'none';
        if (loginBtn) {
            loginBtn.innerHTML = `<img src="https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1OLUbq VilNfRHXkvdR8VdVAbkuQGcuSgs5nbDbpaE8nhzo6g=s0-w24-h24-p-k-rw-no" alt="G" style="width: 24px; height: 24px; border-radius: 50%;">`; // Adjusted icon size
            loginBtn.title = "Login with Google";
            loginBtn.onclick = handleLogin; // Set login action
        }
    }
}

async function handleLogin() {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        // User logged in, onAuthStateChanged will handle UI update
    } catch (error) {
        console.error("Google Sign-In Error:", error);
        // Provide more user-friendly error messages if needed
        alert(`Login failed: ${error.message}`);
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
        // User logged out, onAuthStateChanged will handle UI update
    } catch (error) {
        console.error("Sign-out Error:", error);
        alert(`Logout failed: ${error.message}`);
    }
}


// --- Check/Repair DB (Should not run again if DB is correct) ---
async function checkAndRunApp() {
    console.log("Starting Check/Repair v9.2...");
    appContent.innerHTML = "<p>Verifying database...</p>";
    try {
        const diasRef = collection(db, "Dias");
        const checkSnapshot = await getDocs(diasRef);
        const currentDocCount = checkSnapshot.size;
        console.log(`Docs in 'Dias': ${currentDocCount}`);
        if (currentDocCount < 366) {
            console.warn(`Repairing... Found ${currentDocCount} docs, expected 366.`);
            // Only generate if absolutely necessary
            // await generateCleanDatabase(); // Comment out if confident DB is stable
        } else {
            console.log("DB verified (>= 366 days).");
        }
        await loadDataAndDrawCalendar(); // Load and draw regardless
        // Setup header buttons after main content is potentially loaded
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) { refreshBtn.onclick = () => window.location.reload(); }
        // Setup initial state for login button
        updateLoginUI(auth.currentUser);

    } catch (e) { appContent.innerHTML = `<p class="error">Critical error during startup: ${e.message}</p>`; console.error(e); }
}

// NOTE: generateCleanDatabase is kept for potential future repairs but shouldn't run normally now
async function generateCleanDatabase() {
     console.log("--- Starting Regeneration ---");
    const diasRef = collection(db, "Dias");
    // ... (Deletion logic using for...of as corrected previously) ...
    try { /* ... Deletion code ... */
         console.log("Deleting existing 'Dias' collection..."); appContent.innerHTML = "<p>Deleting old data...</p>";
        const oldDocsSnapshot = await getDocs(diasRef);
        if (!oldDocsSnapshot.empty) {
            let batch = writeBatch(db); let deleteCount = 0;
            for (const docSnap of oldDocsSnapshot.docs) {
                batch.delete(docSnap.ref); deleteCount++;
                if (deleteCount >= 400) { console.log(`Committing delete batch (${deleteCount})...`); await batch.commit(); batch = writeBatch(db); deleteCount = 0; }
            }
            if (deleteCount > 0) { console.log(`Committing final delete batch (${deleteCount})...`); await batch.commit(); }
             console.log(`Deletion complete (${oldDocsSnapshot.size}).`);
        } else { console.log("'Dias' collection was already empty."); }
    } catch(e) { console.error("Error deleting collection:", e); throw e; }

    console.log("Generating 366 clean days..."); appContent.innerHTML = "<p>Generating 366 clean days...</p>";
    let genBatch = writeBatch(db); let ops = 0, created = 0;
    try { // ... (Generation logic as corrected previously) ...
         for (let m = 0; m < 12; m++) {
            const monthNum = m + 1, monthStr = monthNum.toString().padStart(2, '0');
            const numDays = daysInMonth[m];
            for (let d = 1; d <= numDays; d++) {
                const dayStr = d.toString().padStart(2, '0'); const diaId = `${monthStr}-${dayStr}`;
                const diaData = { Nombre_Dia: `${d} ${monthNames[m]}`, Icono: '', Nombre_Especial: "Unnamed Day" };
                const docRef = doc(db, "Dias", diaId); genBatch.set(docRef, diaData); ops++; created++;
                if(created % 50 === 0) appContent.innerHTML = `<p>Generating ${created}/366...</p>`;
                if (ops >= 400) { console.log(`Committing generate batch (${ops})...`); await genBatch.commit(); genBatch = writeBatch(db); ops = 0; }
            }
        }
        if (ops > 0) { console.log(`Committing final generate batch (${ops})...`); await genBatch.commit(); }
         console.log(`--- Regeneration complete: ${created} days created ---`);
        appContent.innerHTML = `<p class="success">✅ Database regenerated with ${created} days!</p>`;
    } catch(e) { console.error("Error generating days:", e); throw e; }
}


// --- loadDataAndDrawCalendar (No changes needed) ---
async function loadDataAndDrawCalendar() { /* ... unchanged ... */
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

// --- configurarNavegacion (No changes needed) ---
function configurarNavegacion() { /* ... unchanged ... */
     document.getElementById("prev-month").onclick = () => { currentMonthIndex = (currentMonthIndex - 1 + 12) % 12; dibujarMesActual(); };
    document.getElementById("next-month").onclick = () => { currentMonthIndex = (currentMonthIndex + 1) % 12; dibujarMesActual(); };
}

// --- dibujarMesActual (No changes needed) ---
function dibujarMesActual() { /* ... unchanged ... */
    monthNameDisplayEl.textContent = monthNames[currentMonthIndex]; const monthNumberTarget = currentMonthIndex + 1;
    console.log(`Drawing month ${monthNumberTarget} (${monthNames[currentMonthIndex]})`);
    const diasDelMes = allDaysData.filter(dia => parseInt(dia.id.substring(0, 2), 10) === monthNumberTarget );
    console.log(`Found ${diasDelMes.length} days for month ${monthNumberTarget}.`); appContent.innerHTML = `<div class="calendario-grid" id="grid-dias"></div>`;
    const grid = document.getElementById("grid-dias"); if (diasDelMes.length === 0) { grid.innerHTML = "<p>No days found.</p>"; return; }
    const diasEsperados = daysInMonth[currentMonthIndex]; if (diasDelMes.length !== diasEsperados) console.warn(`ALERT: ${diasDelMes.length}/${diasEsperados} days for ${monthNames[currentMonthIndex]}.`);
    diasDelMes.forEach(dia => {
        const btn = document.createElement("button"); btn.className = "dia-btn"; btn.innerHTML = `<span class="dia-numero">${dia.id.substring(3)}</span>`; btn.dataset.diaId = dia.id; btn.addEventListener('click', () => abrirModalPreview(dia)); grid.appendChild(btn);
    }); console.log(`Rendered ${diasDelMes.length} buttons.`);
}

// --- configurarFooter (No changes needed) ---
function configurarFooter() { /* ... unchanged ... */
    document.getElementById('btn-hoy').onclick = () => { const today = new Date(); const todayMonth = today.getMonth(); const todayDay = today.getDate(); const todayId = `${(todayMonth + 1).toString().padStart(2, '0')}-${todayDay.toString().padStart(2, '0')}`; const todayDia = allDaysData.find(d => d.id === todayId); if (todayDia) { if (currentMonthIndex !== todayMonth) { currentMonthIndex = todayMonth; dibujarMesActual(); setTimeout(() => abrirModalPreview(todayDia), 50); } else { abrirModalPreview(todayDia); } window.scrollTo(0, 0); } else { console.error("Could not find today's data:", todayId); alert("Error: Could not find data for today."); } };
    document.getElementById('btn-buscar').onclick = () => { const searchTerm = prompt("Search memories by text (case-insensitive):"); if (searchTerm?.trim()) { buscarMemorias(searchTerm.trim().toLowerCase()); } };
    document.getElementById('btn-shuffle').onclick = () => { if (allDaysData.length > 0) { const randomIndex = Math.floor(Math.random() * allDaysData.length); const randomDia = allDaysData[randomIndex]; const randomMonthIndex = parseInt(randomDia.id.substring(0, 2), 10) - 1; if (currentMonthIndex !== randomMonthIndex) { currentMonthIndex = randomMonthIndex; dibujarMesActual(); setTimeout(() => abrirModalPreview(randomDia), 50); } else { abrirModalPreview(randomDia); } window.scrollTo(0, 0); } };
    document.getElementById('btn-add-memory').onclick = () => { abrirModalAddMemory(); };
}

// --- buscarMemorias (No changes needed) ---
async function buscarMemorias(term) { /* ... unchanged ... */
    console.log("Searching memories containing:", term); appContent.innerHTML = `<p>Searching memories containing "${term}"...</p>`; let results = [];
    try {
        for (const dia of allDaysData) {
            const memSnapshot = await getDocs(collection(db, "Dias", dia.id, "Memorias"));
            memSnapshot.forEach(memDoc => {
                const memoria = { diaId: dia.id, diaNombre: dia.Nombre_Dia, id: memDoc.id, ...memDoc.data() }; let searchableText = memoria.Descripcion || ''; if(memoria.LugarNombre) searchableText += ' ' + memoria.LugarNombre; if(memoria.CancionInfo) searchableText += ' ' + memoria.CancionInfo;
                if (searchableText.toLowerCase().includes(term)) { results.push(memoria); }
            });
        }
        if (results.length === 0) { appContent.innerHTML = `<p>No memories found containing "${term}".</p>`; }
        else {
            console.log(`Found ${results.length} memories.`); results.sort((a, b) => (b.Fecha_Original?.toDate() ?? 0) - (a.Fecha_Original?.toDate() ?? 0)); appContent.innerHTML = `<h3>Search Results for "${term}" (${results.length}):</h3>`;
            const resultsList = document.createElement('div'); resultsList.id = 'search-results-list';
            results.forEach(mem => {
                const itemDiv = document.createElement('div'); itemDiv.className = 'memoria-item search-result'; let fechaStr = 'Unknown date'; if (mem.Fecha_Original?.toDate) { try { fechaStr = mem.Fecha_Original.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); } catch(e) { fechaStr = mem.Fecha_Original.toDate().toISOString().split('T')[0]; } } else if (mem.Fecha_Original) { fechaStr = mem.Fecha_Original.toString(); }
                 let contentHTML = `<small><b>${mem.diaNombre} (${mem.diaId})</b> - ${fechaStr}</small>`;
                 switch (mem.Tipo) { case 'Lugar': contentHTML += `📍 Visited: ${mem.LugarNombre || 'Unknown Place'}`; break; case 'Musica': if (mem.CancionData?.trackName) contentHTML += `🎵 Listened to: <strong>${mem.CancionData.trackName}</strong> by ${mem.CancionData.artistName}`; else contentHTML += `🎵 Listened to: ${mem.CancionInfo || 'Unknown Song'}`; break; case 'Imagen': contentHTML += `🖼️ Added Image`; if (mem.ImagenURL) contentHTML += ` (<a href="${mem.ImagenURL}" target="_blank" style="font-size: 10px;">View</a>)`; if (mem.Descripcion) contentHTML += `<br>${mem.Descripcion}`; break; case 'Texto': default: contentHTML += mem.Descripcion || ''; break; }
                itemDiv.innerHTML = `<div class="memoria-item-content">${contentHTML}</div>`; itemDiv.style.cursor = 'pointer';
                 itemDiv.onclick = () => { const monthIndex = parseInt(mem.diaId.substring(0, 2), 10) - 1; if (monthIndex >= 0 && monthIndex < 12) { currentMonthIndex = monthIndex; dibujarMesActual(); const targetDia = allDaysData.find(d => d.id === mem.diaId); if(targetDia) setTimeout(() => abrirModalPreview(targetDia), 50); window.scrollTo(0, 0); } };
                resultsList.appendChild(itemDiv);
            }); appContent.appendChild(resultsList);
        }
    } catch (e) { appContent.innerHTML = `<p class="error">Error during search: ${e.message}</p>`; console.error(e); }
}

// --- Preview Modal (No changes needed) ---
async function abrirModalPreview(dia) { /* ... unchanged ... */
    console.log("Opening preview for:", dia.id); currentlyOpenDay = dia; let modal = document.getElementById('preview-modal');
    if (!modal) {
        modal = document.createElement('div'); modal.id = 'preview-modal'; modal.className = 'modal-preview';
        modal.innerHTML = ` <div class="modal-preview-content"> <div class="modal-preview-header"> <h3 id="preview-title"></h3> <button id="edit-from-preview-btn" title="Edit this day">${pencilIconSVG}</button> </div> <div class="modal-preview-memorias"> <h4>Memories:</h4> <div id="preview-memorias-list">Loading...</div> </div> <button id="close-preview-btn" class="aqua-button" style="margin-top: 15px;">Close</button> </div>`;
        document.body.appendChild(modal); document.getElementById('close-preview-btn').onclick = () => cerrarModalPreview(); modal.onclick = (e) => { if (e.target.id === 'preview-modal') cerrarModalPreview(); }; document.getElementById('edit-from-preview-btn').onclick = () => { cerrarModalPreview(); if (currentlyOpenDay) { setTimeout(() => abrirModalEdicion(currentlyOpenDay), 210); } else { console.error("Cannot open edit modal, currentlyOpenDay is null"); } };
    }
    document.getElementById('preview-title').textContent = `${dia.Nombre_Dia} ${dia.Nombre_Especial !== 'Unnamed Day' ? '('+dia.Nombre_Especial+')' : ''}`; modal.style.display = 'flex'; setTimeout(() => modal.classList.add('visible'), 10); await cargarYMostrarMemorias(dia.id, 'preview-memorias-list');
}
function cerrarModalPreview() { /* ... unchanged ... */
    const modal = document.getElementById('preview-modal'); if (modal) { modal.classList.remove('visible'); setTimeout(() => { modal.style.display = 'none'; }, 200); } currentlyOpenDay = null;
}

// --- Edit Modal (No changes needed) ---
async function abrirModalEdicion(dia) { /* ... unchanged ... */
    console.log("Opening EDIT modal for:", dia.id); currentlyOpenDay = dia; let modal = document.getElementById('edit-modal');
    if (!modal) {
        modal = document.createElement('div'); modal.id = 'edit-modal'; modal.className = 'modal-edit';
        modal.innerHTML = ` <div class="modal-content"> <div class="modal-section"> <h3 id="edit-modal-title"></h3> <label for="nombre-especial-input">Name this day:</label> <input type="text" id="nombre-especial-input" placeholder="e.g., Pizza Day" maxlength="25"> <button id="save-name-btn" class="aqua-button" style="margin-top: 10px;">Save Name</button> <p id="save-status"></p> </div> <div class="modal-section memorias-section"> <h4>Memories for this day:</h4> <div id="edit-memorias-list">Loading...</div> <form id="add-memoria-form"> <label for="memoria-fecha">Original Date:</label> <input type="date" id="memoria-fecha" required> <label for="memoria-desc">Description / Content:</label> <textarea id="memoria-desc" placeholder="Write memory or edit content..." required maxlength="500"></textarea> <button type="submit" id="add-memoria-btn" class="aqua-button">Add Memory</button> <p id="memoria-status"></p> </form> </div> <div id="confirm-delete-dialog" style="display: none;"> <p id="confirm-delete-text">Are you sure?</p> <button id="confirm-delete-no" class="aqua-button">Cancel</button> <button id="confirm-delete-yes" class="aqua-button delete-confirm">Yes, delete</button> </div> <div class="modal-main-buttons"> <button id="close-edit-btn">Close</button> </div> </div>`;
        document.body.appendChild(modal); document.getElementById('close-edit-btn').onclick = () => cerrarModalEdicion(); modal.onclick = (e) => { if (e.target.id === 'edit-modal') cerrarModalEdicion(); }; document.getElementById('confirm-delete-no').onclick = () => { const dialog = document.getElementById('confirm-delete-dialog'); if(dialog) dialog.style.display = 'none'; };
    }
    resetMemoryForm(); document.getElementById('edit-modal-title').textContent = `Editing: ${dia.Nombre_Dia} (${dia.id})`; const inputNombreEspecial = document.getElementById('nombre-especial-input'); inputNombreEspecial.value = dia.Nombre_Especial === 'Unnamed Day' ? '' : dia.Nombre_Especial; document.getElementById('save-status').textContent = ''; document.getElementById('memoria-status').textContent = ''; const confirmDialog = document.getElementById('confirm-delete-dialog'); if(confirmDialog) confirmDialog.style.display = 'none'; document.getElementById('save-name-btn').onclick = () => guardarNombreEspecial(dia.id, inputNombreEspecial.value.trim()); const addMemoriaForm = document.getElementById('add-memoria-form'); addMemoriaForm.onsubmit = null; addMemoriaForm.onsubmit = async (e) => { e.preventDefault(); const fechaInput = document.getElementById('memoria-fecha').value; const descInput = document.getElementById('memoria-desc').value; if (editingMemoryId) { await updateMemoria(dia.id, editingMemoryId, fechaInput, descInput.trim()); } else { await guardarNuevaMemoria(dia.id, fechaInput, descInput.trim()); } }; modal.style.display = 'flex'; setTimeout(() => modal.classList.add('visible'), 10); await cargarYMostrarMemorias(dia.id, 'edit-memorias-list');
}
function cerrarModalEdicion() { /* ... unchanged ... */
    const modal = document.getElementById('edit-modal'); if (modal) { modal.classList.remove('visible'); setTimeout(() => { modal.style.display = 'none'; resetMemoryForm(); }, 200); } currentlyOpenDay = null;
}

// --- Load/Display Memories (Fix Edit Button Listener) ---
async function cargarYMostrarMemorias(diaId, targetDivId) {
    const memoriasListDiv = document.getElementById(targetDivId); if (!memoriasListDiv) { console.error("Target div missing:", targetDivId); return; } memoriasListDiv.innerHTML = 'Loading...'; currentMemories = []; try { const memoriasRef = collection(db, "Dias", diaId, "Memorias"); const q = query(memoriasRef, orderBy("Fecha_Original", "desc")); const querySnapshot = await getDocs(q); if (querySnapshot.empty) { memoriasListDiv.innerHTML = '<p style="font-style: italic; color: #777; font-size: 12px;">No memories yet.</p>'; return; } memoriasListDiv.innerHTML = ''; querySnapshot.forEach((docSnap) => { const memoria = { id: docSnap.id, ...docSnap.data() }; currentMemories.push(memoria); const itemDiv = document.createElement('div'); itemDiv.className = 'memoria-item'; let fechaStr = 'Unknown date'; if (memoria.Fecha_Original?.toDate) { try { fechaStr = memoria.Fecha_Original.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); } catch(e) { fechaStr = memoria.Fecha_Original.toDate().toISOString().split('T')[0]; } } else if (memoria.Fecha_Original) { fechaStr = memoria.Fecha_Original.toString(); } let contentHTML = `<small>${fechaStr}</small>`; let artworkHTML = ''; switch (memoria.Tipo) { case 'Lugar': contentHTML += `📍 Visited: ${memoria.LugarNombre || 'Unknown Place'}`; break; case 'Musica': if (memoria.CancionData?.trackName) { contentHTML += `🎵 Listened to: <strong>${memoria.CancionData.trackName}</strong> by ${memoria.CancionData.artistName}`; if(memoria.CancionData.artworkUrl60) artworkHTML = `<img src="${memoria.CancionData.artworkUrl60}" alt="Artwork" class="memoria-artwork">`; } else { contentHTML += `🎵 Listened to: ${memoria.CancionInfo || 'Unknown Song'}`; } break; case 'Imagen': contentHTML += `🖼️ Added Image`; if (memoria.ImagenURL) contentHTML += ` (<a href="${memoria.ImagenURL}" target="_blank" style="font-size: 10px;">View</a>)`; if (memoria.Descripcion) contentHTML += `<br>${memoria.Descripcion}`; break; case 'Texto': default: contentHTML += memoria.Descripcion || 'No description'; break; }
            // **Only add actions if in the edit modal**
            const actionsHTML = (targetDivId === 'edit-memorias-list') ? ` <div class="memoria-actions"> <button class="edit-btn" title="Edit" data-memoria-id="${memoria.id}">${editIconSVG}</button> <button class="delete-btn" title="Delete" data-memoria-id="${memoria.id}">${deleteIconSVG}</button> </div>` : '';
            itemDiv.innerHTML = `${artworkHTML}<div class="memoria-item-content">${contentHTML}</div>${actionsHTML}`;
            memoriasListDiv.appendChild(itemDiv); }); // Append first

            // **Attach listeners AFTER appending (important!)**
            if (targetDivId === 'edit-memorias-list') {
                memoriasListDiv.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.onclick = () => {
                         const memId = btn.getAttribute('data-memoria-id');
                         const memToEdit = currentMemories.find(m => m.id === memId);
                         if (memToEdit) startEditMemoria(memToEdit);
                         else console.error("Could not find memory to edit:", memId);
                    };
                });
                memoriasListDiv.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.onclick = () => {
                        const memId = btn.getAttribute('data-memoria-id');
                         const memToDelete = currentMemories.find(m => m.id === memId);
                        if(memToDelete) {
                             const displayInfo = memToDelete.Descripcion || memToDelete.LugarNombre || memToDelete.CancionInfo || memToDelete.ImagenURL || "this memory";
                             confirmDeleteMemoria(diaId, memToDelete.id, displayInfo);
                         } else { console.error("Could not find memory to delete:", memId); }
                    };
                });
            }
            console.log(`Loaded ${currentMemories.length} memories for ${diaId} into ${targetDivId}`); } catch (e) { console.error(`Error loading memories ${diaId}:`, e); memoriasListDiv.innerHTML = '<p class="error">Error loading memories.</p>'; }
}


// --- CRUD Functions ---
function startEditMemoria(memoria) { editingMemoryId = memoria.id; const fechaInput = document.getElementById('memoria-fecha'); const descInput = document.getElementById('memoria-desc'); const addButton = document.getElementById('add-memoria-btn'); if (memoria.Fecha_Original?.toDate) { try { fechaInput.value = memoria.Fecha_Original.toDate().toISOString().split('T')[0]; } catch(e) { fechaInput.value = ''; } } else { fechaInput.value = ''; } let contentToEdit = '', placeholderText = "Edit content..."; switch (memoria.Tipo) { case 'Lugar': contentToEdit = memoria.LugarNombre || ''; placeholderText = "Edit Place Name..."; break; case 'Musica': contentToEdit = memoria.CancionInfo || ''; placeholderText = "Edit Music Info (Text)..."; break; case 'Imagen': contentToEdit = memoria.Descripcion || memoria.ImagenURL || ''; placeholderText = "Edit Image Description or URL..."; break; case 'Texto': default: contentToEdit = memoria.Descripcion || ''; placeholderText = "Edit description..."; break; } descInput.value = contentToEdit; descInput.placeholder = placeholderText; addButton.textContent = 'Update Memory'; addButton.classList.add('update-mode'); descInput.focus(); }
async function updateMemoria(diaId, memoriaId, fechaStr, contentValue) { const memoriaStatus = document.getElementById('memoria-status'); if (!fechaStr || !contentValue) { memoriaStatus.textContent = 'Date and content required.'; memoriaStatus.className = 'error'; setTimeout(() => memoriaStatus.textContent = '', 3000); return; } memoriaStatus.textContent = 'Updating...'; memoriaStatus.className = ''; try { const dateParts = fechaStr.split('-'); const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])); if (isNaN(localDate.getTime())) throw new Error("Invalid date format."); const fechaOriginalTimestamp = Timestamp.fromDate(localDate); const memoriaRef = doc(db, "Dias", diaId, "Memorias", memoriaId); const originalMemoria = currentMemories.find(m => m.id === memoriaId); let updateData = { Fecha_Original: fechaOriginalTimestamp }; switch (originalMemoria?.Tipo) { case 'Lugar': updateData.LugarNombre = contentValue; break; case 'Musica': updateData.CancionInfo = contentValue; break; case 'Imagen': updateData.Descripcion = contentValue; break; case 'Texto': default: updateData.Descripcion = contentValue; break; } await updateDoc(memoriaRef, updateData); memoriaStatus.textContent = 'Memory Updated!'; memoriaStatus.className = 'success'; resetMemoryForm(); await cargarYMostrarMemorias(diaId, 'edit-memorias-list'); setTimeout(() => memoriaStatus.textContent = '', 2000); } catch (e) { console.error("Error updating:", e); memoriaStatus.textContent = `Error: ${e.message}`; memoriaStatus.className = 'error'; } }
function confirmDeleteMemoria(diaId, memoriaId, displayInfo) { const dialog = document.getElementById('confirm-delete-dialog'); const yesButton = document.getElementById('confirm-delete-yes'); const textElement = document.getElementById('confirm-delete-text'); const descPreview = displayInfo ? (displayInfo.length > 50 ? displayInfo.substring(0, 47) + '...' : displayInfo) : 'this memory'; textElement.textContent = `Delete "${descPreview}"?`; dialog.style.display = 'block'; const editModalContent = document.querySelector('#edit-modal .modal-content'); if (editModalContent && !editModalContent.contains(dialog)) { editModalContent.appendChild(dialog); } yesButton.onclick = null; yesButton.onclick = async () => { dialog.style.display = 'none'; await deleteMemoria(diaId, memoriaId); }; }
async function deleteMemoria(diaId, memoriaId) { const memoriaStatus = document.getElementById('memoria-status'); memoriaStatus.textContent = 'Deleting...'; memoriaStatus.className = ''; console.log(`Attempting to delete: Dias/${diaId}/Memorias/${memoriaId}`); try { const memoriaRef = doc(db, "Dias", diaId, "Memorias", memoriaId); await deleteDoc(memoriaRef); console.log("Successfully deleted:", memoriaId); memoriaStatus.textContent = 'Memory Deleted!'; memoriaStatus.className = 'success'; currentMemories = currentMemories.filter(m => m.id !== memoriaId); await cargarYMostrarMemorias(diaId, 'edit-memorias-list'); setTimeout(() => memoriaStatus.textContent = '', 2000); } catch (e) { console.error("Error deleting memory:", e); memoriaStatus.textContent = `Error: ${e.message}`; memoriaStatus.className = 'error'; } }
async function guardarNuevaMemoria(diaId, fechaStr, descripcion) { const memoriaStatus = document.getElementById('memoria-status'); if (!fechaStr || !descripcion) { memoriaStatus.textContent = 'Date and description required.'; memoriaStatus.className = 'error'; setTimeout(() => memoriaStatus.textContent = '', 3000); return; } memoriaStatus.textContent = 'Saving...'; memoriaStatus.className = ''; try { const dateParts = fechaStr.split('-'); const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])); if (isNaN(localDate.getTime())) throw new Error("Invalid date format."); const fechaOriginalTimestamp = Timestamp.fromDate(localDate); const memoriasRef = collection(db, "Dias", diaId, "Memorias"); await addDoc(memoriasRef, { Tipo: 'Texto', Fecha_Original: fechaOriginalTimestamp, Descripcion: descripcion, Creado_En: Timestamp.now() }); memoriaStatus.textContent = 'Memory Saved!'; memoriaStatus.className = 'success'; resetMemoryForm(); await cargarYMostrarMemorias(diaId, 'edit-memorias-list'); setTimeout(() => memoriaStatus.textContent = '', 2000); } catch (e) { console.error("Error saving new memory:", e); memoriaStatus.textContent = `Error: ${e.message}`; memoriaStatus.className = 'error'; } }
function resetMemoryForm() { editingMemoryId = null; const form = document.getElementById('add-memoria-form'); if(form) { form.reset(); const addButton = document.getElementById('add-memoria-btn'); if (addButton) { addButton.textContent = 'Add Memory'; addButton.classList.remove('update-mode'); } const statusEl = document.getElementById('memoria-status'); if(statusEl) statusEl.textContent = ''; const descInput = document.getElementById('memoria-desc'); if (descInput) descInput.placeholder = "Write your memory..."; } }
async function guardarNombreEspecial(diaId, nuevoNombre) { const status = document.getElementById('save-status'); try { status.textContent = "Saving..."; status.className = ''; const diaRef = doc(db, "Dias", diaId); const valorFinal = nuevoNombre || "Unnamed Day"; await updateDoc(diaRef, { Nombre_Especial: valorFinal }); const diaIndex = allDaysData.findIndex(d => d.id === diaId); if (diaIndex !== -1) allDaysData[diaIndex].Nombre_Especial = valorFinal; status.textContent = "Name Saved!"; status.className = 'success'; if(currentlyOpenDay && currentlyOpenDay.id === diaId) { currentlyOpenDay.Nombre_Especial = valorFinal; } setTimeout(() => { status.textContent = ''; dibujarMesActual(); }, 1200); const previewTitle = document.getElementById('preview-title'); const previewModal = document.getElementById('preview-modal'); if(previewTitle && currentlyOpenDay && currentlyOpenDay.id === diaId && previewModal?.style.display === 'flex') { previewTitle.textContent = `${currentlyOpenDay.Nombre_Dia} ${valorFinal !== 'Unnamed Day' ? '('+valorFinal+')' : ''}`; } } catch (e) { status.textContent = `Error: ${e.message}`; status.className = 'error'; console.error(e); } }


// --- Add Memory Modal ---
function abrirModalAddMemory() { console.log("Opening Add Memory modal..."); selectedMusicTrack = null; selectedPlace = null; let modal = document.getElementById('add-memory-modal'); if (!modal) { modal = document.createElement('div'); modal.id = 'add-memory-modal'; modal.className = 'modal-add-memory'; modal.innerHTML = ` <div class="modal-add-memory-content"> <h3>Add New Memory</h3> <div class="add-memory-form-section"> <label for="add-mem-day">Select Day (MM-DD):</label> <select id="add-mem-day"></select> <label for="add-mem-year">Year of Memory:</label> <input type="number" id="add-mem-year" placeholder="YYYY" min="1800" max="${new Date().getFullYear() + 1}" required> </div> <div class="add-memory-form-section"> <label for="add-mem-type">Type of Memory:</label> <select id="add-mem-type"> <option value="Texto">Description</option> <option value="Lugar">Place</option> <option value="Musica">Music</option> <option value="Imagen">Image</option> </select> <div id="input-type-Texto"><label for="add-mem-desc">Description:</label><textarea id="add-mem-desc" placeholder="Write your memory..."></textarea></div> <div id="input-type-Lugar" style="display: none;"> <label for="add-mem-place-search">Search Place:</label> <input type="text" id="add-mem-place-search" placeholder="Enter place name..."> <button type="button" class="aqua-button" id="btn-search-place">Search Place</button> <div id="place-results"></div> <input type="hidden" id="add-mem-place-name"> </div> <div id="input-type-Musica" style="display: none;"> <label for="add-mem-music-search">Search iTunes:</label> <input type="text" id="add-mem-music-search" placeholder="Enter song or album title..."> <button type="button" class="aqua-button" id="btn-search-itunes">Search Music</button> <div id="itunes-results"></div> <input type="hidden" id="add-mem-music-info"> </div> <div id="input-type-Imagen" style="display: none;"> <label for="add-mem-image-upload">Upload Image:</label> <input type="file" id="add-mem-image-upload" accept="image/*"> <label for="add-mem-image-desc">Image Description (Optional):</label> <input type="text" id="add-mem-image-desc" placeholder="Describe the image..."> <div id="image-upload-status" style="font-size: 11px; color: #555; margin-top: 5px;"></div> </div> </div> <div class="button-group"> <button type="button" id="close-add-mem-btn" class="aqua-button">Cancel</button> <button type="button" id="save-add-mem-btn" class="aqua-button">Save Memory</button> </div> <p id="add-memory-status"></p> </div>`; document.body.appendChild(modal); const daySelect = document.getElementById('add-mem-day'); daySelect.innerHTML = ''; allDaysData.forEach(dia => { const option = document.createElement('option'); option.value = dia.id; option.textContent = dia.Nombre_Dia; daySelect.appendChild(option); }); const today = new Date(); const todayMonth = (today.getMonth() + 1).toString().padStart(2, '0'); const todayDay = today.getDate().toString().padStart(2, '0'); const todayId = `${todayMonth}-${todayDay}`; if (daySelect.querySelector(`option[value="${todayId}"]`)) daySelect.value = todayId; document.getElementById('add-mem-year').value = today.getFullYear(); document.getElementById('add-mem-type').addEventListener('change', handleMemoryTypeChange); document.getElementById('close-add-mem-btn').onclick = () => cerrarModalAddMemory(); document.getElementById('save-add-mem-btn').onclick = () => saveMemoryFromAddModal(); modal.onclick = (e) => { if (e.target.id === 'add-memory-modal') cerrarModalAddMemory(); }; document.getElementById('btn-search-itunes').onclick = buscarBSO; document.getElementById('btn-search-place').onclick = buscarLugar; const fileInput = document.getElementById('add-mem-image-upload'); const imageStatus = document.getElementById('image-upload-status'); if (fileInput && imageStatus) { fileInput.onchange = (event) => { if (event.target.files && event.target.files[0]) { imageStatus.textContent = `Selected: ${event.target.files[0].name}`; imageStatus.className = ''; } else { imageStatus.textContent = ''; } }; } } document.getElementById('add-memory-status').textContent = ''; selectedMusicTrack = null; selectedPlace = null; document.getElementById('itunes-results').innerHTML = ''; document.getElementById('place-results').innerHTML = ''; document.getElementById('add-mem-music-search').value = ''; document.getElementById('add-mem-place-search').value = ''; document.getElementById('add-mem-desc').value = ''; document.getElementById('add-mem-place-name').value = ''; document.getElementById('add-mem-image-upload').value = null; document.getElementById('image-upload-status').textContent = ''; document.getElementById('add-mem-image-desc').value = ''; document.getElementById('add-mem-type').value = 'Texto'; const today = new Date(); const todayMonth = (today.getMonth() + 1).toString().padStart(2, '0'); const todayDay = today.getDate().toString().padStart(2, '0'); const todayId = `${todayMonth}-${todayDay}`; const daySelect = document.getElementById('add-mem-day'); if (daySelect.querySelector(`option[value="${todayId}"]`)) daySelect.value = todayId; document.getElementById('add-mem-year').value = today.getFullYear(); handleMemoryTypeChange(); modal.style.display = 'flex'; setTimeout(() => modal.classList.add('visible'), 10); }
function handleMemoryTypeChange() { const selectedType = document.getElementById('add-mem-type').value; const typeDivs = ['input-type-Texto', 'input-type-Lugar', 'input-type-Musica', 'input-type-Imagen']; typeDivs.forEach(id => { const div = document.getElementById(id); if (div) div.style.display = 'none'; }); const divToShow = document.getElementById(`input-type-${selectedType}`); if (divToShow) { divToShow.style.display = 'block'; } if (selectedType !== 'Musica') { const resultsDiv = document.getElementById('itunes-results'); if (resultsDiv) resultsDiv.innerHTML = ''; selectedMusicTrack = null; } if (selectedType !== 'Lugar') { const resultsDiv = document.getElementById('place-results'); if (resultsDiv) resultsDiv.innerHTML = ''; selectedPlace = null; document.getElementById('add-mem-place-name').value = ''; } if (selectedType !== 'Imagen') { const fileInput = document.getElementById('add-mem-image-upload'); if (fileInput) fileInput.value = null; const imageStatus = document.getElementById('image-upload-status'); if (imageStatus) imageStatus.textContent = ''; } }
function cerrarModalAddMemory() { const modal = document.getElementById('add-memory-modal'); if (modal) { modal.classList.remove('visible'); setTimeout(() => { modal.style.display = 'none'; }, 200); } }

// --- buscarBSO ---
async function buscarBSO() { const queryInput = document.getElementById('add-mem-music-search'); const resultsDiv = document.getElementById('itunes-results'); const statusDiv = document.getElementById('add-memory-status'); const query = queryInput.value.trim(); if (!query) { resultsDiv.innerHTML = '<p class="error" style="padding: 5px;">Please enter a search term.</p>'; return; } resultsDiv.innerHTML = '<p style="padding: 5px;">Searching iTunes...</p>'; statusDiv.textContent = ''; selectedMusicTrack = null; const proxyUrl = 'https://corsproxy.io/?'; const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=5`; const url = proxyUrl + encodeURIComponent(itunesUrl); console.log("Fetching iTunes URL via proxy:", url); try { const response = await fetch(url); if (!response.ok) { let errorText = await response.text(); console.error("iTunes fetch failed:", response.status, errorText); throw new Error(`HTTP error ${response.status}`); } const data = await response.json(); const actualData = data; if (!actualData.results || actualData.resultCount === 0) { resultsDiv.innerHTML = '<p style="padding: 5px;">No results found.</p>'; return; } resultsDiv.innerHTML = ''; actualData.results.forEach(track => { const trackDiv = document.createElement('div'); trackDiv.className = 'itunes-track'; const artworkUrl = track.artworkUrl100 || track.artworkUrl60 || ''; trackDiv.innerHTML = ` <img src="${artworkUrl}" alt="Artwork" class="itunes-artwork" style="${artworkUrl ? '' : 'display:none;'}" onerror="this.style.display='none'; this.parentElement.classList.add('no-artwork');"> <div class="itunes-track-info"> <div class="itunes-track-name">${track.trackName || 'Unknown Track'}</div> <div class="itunes-track-artist">${track.artistName || 'Unknown Artist'}</div> </div> <div class="itunes-track-select">➔</div> `; trackDiv.onclick = () => { selectedMusicTrack = track; queryInput.value = `${track.trackName} - ${track.artistName}`; resultsDiv.innerHTML = `<div class="itunes-track selected"><img src="${artworkUrl}" alt="Artwork" class="itunes-artwork" style="${artworkUrl ? '' : 'display:none;'}"><div class="itunes-track-info"><div class="itunes-track-name">${track.trackName}</div><div class="itunes-track-artist">${track.artistName}</div></div><span style="color:green; margin-left: auto; font-weight: bold;">✓</span></div>`; console.log("Selected music track:", selectedMusicTrack); }; resultsDiv.appendChild(trackDiv); }); } catch (error) { console.error('Error fetching/processing iTunes data:', error); resultsDiv.innerHTML = `<p class="error" style="padding: 5px;">Error searching music: ${error.message}</p>`; } }

// --- buscarLugar ---
async function buscarLugar() { const queryInput = document.getElementById('add-mem-place-search'); const resultsDiv = document.getElementById('place-results'); const statusDiv = document.getElementById('add-memory-status'); const query = queryInput.value.trim(); if (!query) { resultsDiv.innerHTML = '<p class="error" style="padding: 5px;">Please enter a place name.</p>'; return; } resultsDiv.innerHTML = '<p style="padding: 5px;">Searching places...</p>'; statusDiv.textContent = ''; selectedPlace = null; const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`; console.log("Fetching Nominatim URL:", nominatimUrl); try { const response = await fetch(nominatimUrl, { headers: { 'Accept': 'application/json' } }); if (!response.ok) { let errorText = await response.text(); console.error("Nominatim fetch failed:", response.status, errorText); throw new Error(`HTTP error ${response.status}`); } const data = await response.json(); if (!data || data.length === 0) { resultsDiv.innerHTML = '<p style="padding: 5px;">No places found.</p>'; return; } resultsDiv.innerHTML = ''; data.forEach(place => { const placeDiv = document.createElement('div'); placeDiv.className = 'place-result'; placeDiv.innerHTML = `${place.display_name}`; placeDiv.onclick = () => { selectedPlace = { name: place.display_name, lat: place.lat, lon: place.lon, osm_id: place.osm_id, osm_type: place.osm_type }; queryInput.value = place.display_name; resultsDiv.innerHTML = `<p style="padding: 5px; color: green; font-weight: bold;">Selected: ${place.display_name}</p>`; console.log("Selected place:", selectedPlace); }; resultsDiv.appendChild(placeDiv); }); } catch (error) { console.error('Error fetching/processing Nominatim data:', error); resultsDiv.innerHTML = `<p class="error" style="padding: 5px;">Error searching places: ${error.message}</p>`; } }


// --- saveMemoryFromAddModal ---
async function saveMemoryFromAddModal() { const statusDiv = document.getElementById('add-memory-status'); statusDiv.className = ''; statusDiv.textContent = 'Saving...'; const diaId = document.getElementById('add-mem-day').value; const yearInput = document.getElementById('add-mem-year'); const year = parseInt(yearInput.value, 10); const type = document.getElementById('add-mem-type').value; if (!diaId || !year || isNaN(year) || year < 1800 || year > new Date().getFullYear() + 1) { statusDiv.textContent = 'Please select a valid day and year.'; statusDiv.className = 'error'; return; } const month = parseInt(diaId.substring(0, 2), 10); const day = parseInt(diaId.substring(3), 10); if (isNaN(month) || isNaN(day) || day < 1 || day > daysInMonth[month - 1]) { statusDiv.textContent = 'Invalid day selected.'; statusDiv.className = 'error'; return; } const dateOfMemory = new Date(Date.UTC(year, month - 1, day)); if (isNaN(dateOfMemory.getTime())) { statusDiv.textContent = 'Invalid date.'; statusDiv.className = 'error'; return; } const fechaOriginalTimestamp = Timestamp.fromDate(dateOfMemory); let memoryData = { Fecha_Original: fechaOriginalTimestamp, Tipo: type, Creado_En: Timestamp.now() }; let isValid = true; let imageFileToUpload = null; switch (type) { case 'Texto': memoryData.Descripcion = document.getElementById('add-mem-desc').value.trim(); if (!memoryData.Descripcion) isValid = false; break; case 'Lugar': if (selectedPlace) { memoryData.LugarNombre = selectedPlace.name; memoryData.LugarData = { lat: selectedPlace.lat, lon: selectedPlace.lon, osm_id: selectedPlace.osm_id, osm_type: selectedPlace.osm_type }; } else { memoryData.LugarNombre = document.getElementById('add-mem-place-search').value.trim(); if (!memoryData.LugarNombre) isValid = false; memoryData.LugarData = null; } break; case 'Musica': if (selectedMusicTrack) { memoryData.CancionData = { trackId: selectedMusicTrack.trackId, artistName: selectedMusicTrack.artistName, trackName: selectedMusicTrack.trackName, artworkUrl60: selectedMusicTrack.artworkUrl60, trackViewUrl: selectedMusicTrack.trackViewUrl }; memoryData.CancionInfo = `${selectedMusicTrack.trackName} - ${selectedMusicTrack.artistName}`; } else { memoryData.CancionInfo = document.getElementById('add-mem-music-search').value.trim(); memoryData.CancionData = null; if (!memoryData.CancionInfo) isValid = false; } break; case 'Imagen': const fileInput = document.getElementById('add-mem-image-upload'); memoryData.Descripcion = document.getElementById('add-mem-image-desc').value.trim() || null; if (fileInput.files && fileInput.files[0]) { imageFileToUpload = fileInput.files[0]; memoryData.ImagenURL = "placeholder_uploading"; isValid = true; document.getElementById('image-upload-status').textContent = `Ready: ${imageFileToUpload.name}`; } else { isValid = false; } break; default: isValid = false; break; } if (!isValid) { statusDiv.textContent = 'Please fill required fields or select file.'; statusDiv.className = 'error'; return; } try { if (type === 'Imagen' && imageFileToUpload) { statusDiv.textContent = 'Image upload pending...'; alert("Image upload functionality is not yet implemented. Memory not saved."); statusDiv.textContent = 'Save cancelled: Image upload pending.'; statusDiv.className = 'error'; return; } else { await saveMemoryData(diaId, memoryData); } } catch (e) { console.error("Error in saveMemoryFromAddModal:", e); statusDiv.textContent = `Error: ${e.message}`; statusDiv.className = 'error'; } }
async function saveMemoryData(diaId, memoryData) { const statusDiv = document.getElementById('add-memory-status'); const memoriasRef = collection(db, "Dias", diaId, "Memorias"); const docRef = await addDoc(memoriasRef, memoryData); console.log("New memory saved:", docRef.id, memoryData); statusDiv.textContent = 'Memory Saved!'; statusDiv.className = 'success'; resetAddMemoryFormFields(); setTimeout(() => { cerrarModalAddMemory(); }, 1500); }
function resetAddMemoryFormFields() { document.getElementById('add-mem-desc').value = ''; document.getElementById('add-mem-place-search').value = ''; document.getElementById('place-results').innerHTML = ''; document.getElementById('add-mem-place-name').value = ''; document.getElementById('add-mem-music-search').value = ''; document.getElementById('itunes-results').innerHTML = ''; document.getElementById('add-mem-image-upload').value = null; document.getElementById('image-upload-status').textContent = ''; document.getElementById('add-mem-image-desc').value = ''; selectedMusicTrack = null; selectedPlace = null; }


// --- Expose functions needed ---
window.handleMemoryTypeChange = handleMemoryTypeChange;
window.buscarBSO = buscarBSO;
window.buscarLugar = buscarLugar;
window.saveMemoryFromAddModal = saveMemoryFromAddModal;
window.cerrarModalAddMemory = cerrarModalAddMemory;
window.startEditMemoria = startEditMemoria;
window.confirmDeleteMemoria = confirmDeleteMemoria;
window.cerrarModalPreview = cerrarModalPreview;
window.abrirModalEdicion = abrirModalEdicion;
window.cerrarModalEdicion = cerrarModalEdicion;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;


// --- Start App ---
checkAndRunApp();

