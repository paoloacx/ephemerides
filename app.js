/* app.js - v10.0 - Unified Edit/Add Modal, Final Polish */

// Importaciones
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
    getFirestore, collection, getDocs, doc, updateDoc,
    writeBatch, setDoc, deleteDoc, Timestamp, query, orderBy, addDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
    getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
// import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

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
// const storage = getStorage(app);

// --- Global Variables & Constants ---
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
let selectedPlace = null;
let currentUser = null;

// --- SVG Icons ---
const editIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg>`;
const deleteIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m3 0l-.5 8.5a.5.5 0 1 0 .998-.06l.5-8.5a.5.5 0 1 0-.998.06m3 .5l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Z"/></svg>`;
const pencilIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/></svg>`;
const loginIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M10 3.5a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 1 1 0v2A1.5 1.5 0 0 1 9.5 14h-8A1.5 1.5 0 0 1 0 12.5v-9A1.5 1.5 0 0 1 1.5 2h8A1.5 1.5 0 0 1 11 3.5v2a.5.5 0 0 1-1 0z"/><path fill-rule="evenodd" d="M4.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H14.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708z"/></svg>`;

// --- Auth ---
onAuthStateChanged(auth, (user) => { /* ... unchanged ... */ currentUser = user; updateLoginUI(user); if (user) { console.log("User logged in:", user.displayName); } else { console.log("User logged out."); } });
function updateLoginUI(user) { /* ... unchanged ... */ const loginBtn = document.getElementById('login-btn'); const userInfo = document.getElementById('user-info'); const userName = document.getElementById('user-name'); const userImg = document.getElementById('user-img'); if (user) { if (userInfo) userInfo.style.display = 'flex'; if (userName) userName.textContent = user.displayName || user.email || 'User'; if (userImg) userImg.src = user.photoURL || 'https://placehold.co/30x30/ccc/fff?text=?'; if (loginBtn) { loginBtn.innerHTML = loginIconSVG; loginBtn.title = "Logout"; loginBtn.onclick = handleLogout; } } else { if (userInfo) userInfo.style.display = 'none'; if (loginBtn) { loginBtn.innerHTML = `<img src="https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1OLUbq VilNfRHXkvdR8VdVAbkuQGcuSgs5nbDbpaE8nhzo6g=s0-w24-h24-p-k-rw-no" alt="G" style="width: 24px; height: 24px; border-radius: 50%;">`; loginBtn.title = "Login with Google"; loginBtn.onclick = handleLogin; } } }
async function handleLogin() { /* ... unchanged ... */ const provider = new GoogleAuthProvider(); try { await signInWithPopup(auth, provider); } catch (error) { console.error("Google Sign-In Error:", error); alert(`Login failed: ${error.message}`); } }
async function handleLogout() { /* ... unchanged ... */ try { await signOut(auth); } catch (error) { console.error("Sign-out Error:", error); alert(`Logout failed: ${error.message}`); } }

// --- Check/Repair DB ---
async function checkAndRunApp() {
    console.log("Starting Check/Repair v10.0..."); // Version updated
    appContent.innerHTML = "<p>Verifying database...</p>";
    try {
        const diasRef = collection(db, "Dias");
        const checkSnapshot = await getDocs(diasRef);
        const currentDocCount = checkSnapshot.size;
        console.log(`Docs in 'Dias': ${currentDocCount}`);
        if (currentDocCount < 366) {
            console.warn(`Repairing... Found ${currentDocCount} docs, expected 366.`);
             await generateCleanDatabase(); // Regenerate if needed
        } else {
            console.log("DB verified (>= 366 days).");
        }
        await loadDataAndDrawCalendar();
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) { refreshBtn.onclick = () => window.location.reload(); }
        updateLoginUI(auth.currentUser);
    } catch (e) { appContent.innerHTML = `<p class="error">Critical error: ${e.message}</p>`; console.error(e); }
}
async function generateCleanDatabase() { /* ... unchanged ... */
    console.log("--- Starting Regeneration ---"); const diasRef = collection(db, "Dias"); try { console.log("Deleting 'Dias'..."); appContent.innerHTML = "<p>Deleting old data...</p>"; const oldDocsSnapshot = await getDocs(diasRef); if (!oldDocsSnapshot.empty) { let batch = writeBatch(db); let deleteCount = 0; for (const docSnap of oldDocsSnapshot.docs) { batch.delete(docSnap.ref); deleteCount++; if (deleteCount >= 400) { await batch.commit(); batch = writeBatch(db); deleteCount = 0; } } if (deleteCount > 0) await batch.commit(); console.log(`Deletion complete (${oldDocsSnapshot.size}).`); } else { console.log("'Dias' empty."); } } catch(e) { console.error("Error deleting:", e); throw e; }
    console.log("Generating 366 days..."); appContent.innerHTML = "<p>Generating 366 days...</p>"; let genBatch = writeBatch(db); let ops = 0, created = 0; try { for (let m = 0; m < 12; m++) { const monthNum = m + 1, monthStr = monthNum.toString().padStart(2, '0'); const numDays = daysInMonth[m]; for (let d = 1; d <= numDays; d++) { const dayStr = d.toString().padStart(2, '0'); const diaId = `${monthStr}-${dayStr}`; const diaData = { Nombre_Dia: `${d} ${monthNames[m]}`, Icono: '', Nombre_Especial: "Unnamed Day" }; const docRef = doc(db, "Dias", diaId); genBatch.set(docRef, diaData); ops++; created++; if(created % 50 === 0) appContent.innerHTML = `<p>Generating ${created}/366...</p>`; if (ops >= 400) { await genBatch.commit(); genBatch = writeBatch(db); ops = 0; } } } if (ops > 0) await genBatch.commit(); console.log(`--- Regeneration complete: ${created} ---`); appContent.innerHTML = `<p class="success">✅ DB regenerated: ${created} days!</p>`; } catch(e) { console.error("Error generating:", e); throw e; }
}

// --- Load/Draw Calendar ---
async function loadDataAndDrawCalendar() { /* ... unchanged ... */
    console.log("Loading data..."); appContent.innerHTML = "<p>Loading calendar...</p>"; try { const diasSnapshot = await getDocs(collection(db, "Dias")); allDaysData = []; diasSnapshot.forEach((doc) => { if (doc.id?.length === 5 && doc.id.includes('-')) allDaysData.push({ id: doc.id, ...doc.data() }); }); if (allDaysData.length === 0) throw new Error("DB empty post-load."); console.log(`Loaded ${allDaysData.length} days.`); allDaysData.sort((a, b) => a.id.localeCompare(b.id)); configurarNavegacion(); configurarFooter(); dibujarMesActual(); } catch (e) { appContent.innerHTML = `<p class="error">Error loading: ${e.message}</p>`; console.error(e); }
}
function configurarNavegacion() { /* ... unchanged ... */
     document.getElementById("prev-month").onclick = () => { currentMonthIndex = (currentMonthIndex - 1 + 12) % 12; dibujarMesActual(); }; document.getElementById("next-month").onclick = () => { currentMonthIndex = (currentMonthIndex + 1) % 12; dibujarMesActual(); };
}
function dibujarMesActual() { /* ... unchanged ... */
    monthNameDisplayEl.textContent = monthNames[currentMonthIndex]; const monthNumberTarget = currentMonthIndex + 1; console.log(`Drawing month ${monthNumberTarget}`); const diasDelMes = allDaysData.filter(dia => parseInt(dia.id.substring(0, 2), 10) === monthNumberTarget ); console.log(`Found ${diasDelMes.length} days.`); appContent.innerHTML = `<div class="calendario-grid" id="grid-dias"></div>`; const grid = document.getElementById("grid-dias"); if (diasDelMes.length === 0) { grid.innerHTML = "<p>No days found.</p>"; return; } const diasEsperados = daysInMonth[currentMonthIndex]; if (diasDelMes.length !== diasEsperados) console.warn(`ALERT: ${diasDelMes.length}/${diasEsperados} for ${monthNames[currentMonthIndex]}.`); diasDelMes.forEach(dia => { const btn = document.createElement("button"); btn.className = "dia-btn"; btn.innerHTML = `<span class="dia-numero">${dia.id.substring(3)}</span>`; btn.dataset.diaId = dia.id; btn.addEventListener('click', () => abrirModalPreview(dia)); grid.appendChild(btn); }); console.log(`Rendered ${diasDelMes.length} buttons.`);
}

// --- Footer ---
function configurarFooter() { /* ... unchanged ... */
    document.getElementById('btn-hoy').onclick = () => { const today = new Date(); const todayMonth = today.getMonth(); const todayDay = today.getDate(); const todayId = `${(todayMonth + 1).toString().padStart(2, '0')}-${todayDay.toString().padStart(2, '0')}`; const todayDia = allDaysData.find(d => d.id === todayId); if (todayDia) { if (currentMonthIndex !== todayMonth) { currentMonthIndex = todayMonth; dibujarMesActual(); setTimeout(() => abrirModalPreview(todayDia), 50); } else { abrirModalPreview(todayDia); } window.scrollTo(0, 0); } else { alert("Error: Could not find data for today."); } };
    document.getElementById('btn-buscar').onclick = () => { const searchTerm = prompt("Search memories:"); if (searchTerm?.trim()) { buscarMemorias(searchTerm.trim().toLowerCase()); } };
    document.getElementById('btn-shuffle').onclick = () => { if (allDaysData.length > 0) { const randomIndex = Math.floor(Math.random() * allDaysData.length); const randomDia = allDaysData[randomIndex]; const randomMonthIndex = parseInt(randomDia.id.substring(0, 2), 10) - 1; if (currentMonthIndex !== randomMonthIndex) { currentMonthIndex = randomMonthIndex; dibujarMesActual(); setTimeout(() => abrirModalPreview(randomDia), 50); } else { abrirModalPreview(randomDia); } window.scrollTo(0, 0); } };
    document.getElementById('btn-add-memory').onclick = () => { abrirModalEdicion(null); }; // Open unified modal in "Add" mode
}
async function buscarMemorias(term) { /* ... unchanged ... */
    console.log("Searching:", term); appContent.innerHTML = `<p>Searching for "${term}"...</p>`; let results = []; try { for (const dia of allDaysData) { const memSnapshot = await getDocs(collection(db, "Dias", dia.id, "Memorias")); memSnapshot.forEach(memDoc => { const memoria = { diaId: dia.id, diaNombre: dia.Nombre_Dia, id: memDoc.id, ...memDoc.data() }; let searchableText = memoria.Descripcion || ''; if(memoria.LugarNombre) searchableText += ' ' + memoria.LugarNombre; if(memoria.CancionInfo) searchableText += ' ' + memoria.CancionInfo; if (searchableText.toLowerCase().includes(term)) { results.push(memoria); } }); } if (results.length === 0) { appContent.innerHTML = `<p>No results for "${term}".</p>`; } else { console.log(`Found ${results.length}.`); results.sort((a, b) => (b.Fecha_Original?.toDate() ?? 0) - (a.Fecha_Original?.toDate() ?? 0)); appContent.innerHTML = `<h3>Results for "${term}" (${results.length}):</h3>`; const resultsList = document.createElement('div'); resultsList.id = 'search-results-list'; results.forEach(mem => { const itemDiv = document.createElement('div'); itemDiv.className = 'memoria-item search-result'; let fechaStr = 'Unknown date'; if (mem.Fecha_Original?.toDate) { try { fechaStr = mem.Fecha_Original.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); } catch(e) { fechaStr = mem.Fecha_Original.toDate().toISOString().split('T')[0]; } } let contentHTML = `<small><b>${mem.diaNombre} (${mem.diaId})</b> - ${fechaStr}</small>`; switch (mem.Tipo) { case 'Lugar': contentHTML += `📍 ${mem.LugarNombre || 'Place'}`; break; case 'Musica': if (mem.CancionData?.trackName) contentHTML += `🎵 <strong>${mem.CancionData.trackName}</strong> by ${mem.CancionData.artistName}`; else contentHTML += `🎵 ${mem.CancionInfo || 'Music'}`; break; case 'Imagen': contentHTML += `🖼️ Image`; if (mem.ImagenURL) contentHTML += ` (<a href="${mem.ImagenURL}" target="_blank">View</a>)`; if (mem.Descripcion) contentHTML += `<br>${mem.Descripcion}`; break; case 'Texto': default: contentHTML += mem.Descripcion || ''; break; } itemDiv.innerHTML = `<div class="memoria-item-content">${contentHTML}</div>`; itemDiv.style.cursor = 'pointer'; itemDiv.onclick = () => { const monthIndex = parseInt(mem.diaId.substring(0, 2), 10) - 1; if (monthIndex >= 0) { currentMonthIndex = monthIndex; dibujarMesActual(); const targetDia = allDaysData.find(d => d.id === mem.diaId); if(targetDia) setTimeout(() => abrirModalPreview(targetDia), 50); window.scrollTo(0, 0); } }; resultsList.appendChild(itemDiv); }); appContent.appendChild(resultsList); } } catch (e) { appContent.innerHTML = `<p class="error">Search error: ${e.message}</p>`; console.error(e); }
}

// --- Preview Modal ---
async function abrirModalPreview(dia) { /* ... unchanged logic, corrected edit listener ... */
    console.log("Opening preview:", dia.id); currentlyOpenDay = dia; let modal = document.getElementById('preview-modal'); if (!modal) { modal = document.createElement('div'); modal.id = 'preview-modal'; modal.className = 'modal-preview'; modal.innerHTML = ` <div class="modal-preview-content"> <div class="modal-preview-header"> <h3 id="preview-title"></h3> <button id="edit-from-preview-btn" title="Edit this day">${pencilIconSVG}</button> </div> <div class="modal-preview-memorias"> <h4>Memories:</h4> <div id="preview-memorias-list">Loading...</div> </div> <button id="close-preview-btn" class="aqua-button">Close</button> </div>`; document.body.appendChild(modal); document.getElementById('close-preview-btn').onclick = () => cerrarModalPreview(); modal.onclick = (e) => { if (e.target.id === 'preview-modal') cerrarModalPreview(); }; document.getElementById('edit-from-preview-btn').addEventListener('click', () => { if (currentlyOpenDay) { cerrarModalPreview(); setTimeout(() => abrirModalEdicion(currentlyOpenDay), 210); } }); } document.getElementById('preview-title').textContent = `${dia.Nombre_Dia} ${dia.Nombre_Especial !== 'Unnamed Day' ? '('+dia.Nombre_Especial+')' : ''}`; modal.style.display = 'flex'; setTimeout(() => modal.classList.add('visible'), 10); await cargarYMostrarMemorias(dia.id, 'preview-memorias-list');
}
function cerrarModalPreview() { /* ... unchanged ... */ const modal = document.getElementById('preview-modal'); if (modal) { modal.classList.remove('visible'); setTimeout(() => { modal.style.display = 'none'; }, 200); } }


// --- Unified Edit/Add Modal ---
async function abrirModalEdicion(dia) { // dia can be null if adding via footer button
    const isAdding = !dia; // Check if we are adding a new memory from footer or editing a day
    console.log(isAdding ? "Opening unified modal in ADD mode" : `Opening unified modal in EDIT mode for: ${dia.id}`);

    if (isAdding) {
        // If adding from footer, select today as default
        const today = new Date();
        const todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        currentlyOpenDay = allDaysData.find(d => d.id === todayId) || allDaysData[0]; // Fallback to first day if today not found
    } else {
        currentlyOpenDay = dia;
    }

    let modal = document.getElementById('edit-add-modal'); // Changed ID
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'edit-add-modal'; // Changed ID
        modal.className = 'modal-edit'; // Use edit styles
        modal.innerHTML = `
            <div class="modal-content">
                <!-- Section: Day Selection (Only visible in Add mode from footer) -->
                <div class="modal-section" id="day-selection-section" style="display: ${isAdding ? 'block' : 'none'};">
                     <h3>Select Day & Year</h3>
                     <label for="edit-mem-day">Day (MM-DD):</label>
                     <select id="edit-mem-day"></select>
                     <label for="edit-mem-year">Year of Memory:</label>
                     <input type="number" id="edit-mem-year" placeholder="YYYY" min="1800" max="${new Date().getFullYear() + 1}" required>
                </div>

                <!-- Section: Day Name Edit -->
                <div class="modal-section" id="day-name-section" style="display: ${isAdding ? 'none' : 'block'};">
                    <h3 id="edit-modal-title"></h3>
                    <label for="nombre-especial-input">Name this day:</label>
                    <input type="text" id="nombre-especial-input" placeholder="e.g., Pizza Day" maxlength="25">
                    <button id="save-name-btn" class="aqua-button" style="margin-top: 10px;">Save Day Name</button>
                    <p id="save-status"></p>
                </div>

                <!-- Section: Memories List & Add/Edit Form -->
                <div class="modal-section memorias-section">
                    <h4>Memories:</h4>
                    <div id="edit-memorias-list">Loading...</div>
                    <form id="memory-form">
                         <label for="memoria-fecha">Original Date:</label>
                         <input type="date" id="memoria-fecha" required>
                         <label for="memoria-type">Type:</label>
                         <select id="memoria-type">
                            <option value="Texto">Description</option>
                            <option value="Lugar">Place</option>
                            <option value="Musica">Music</option>
                            <option value="Imagen">Image</option>
                         </select>

                         {/* Dynamic Inputs */}
                         <div class="add-memory-input-group" id="input-type-Texto"><label for="memoria-desc">Description:</label><textarea id="memoria-desc" placeholder="Write your memory..."></textarea></div>
                         <div class="add-memory-input-group" id="input-type-Lugar"><label for="memoria-place-search">Search Place:</label><input type="text" id="memoria-place-search" placeholder="Enter place name..."><button type="button" class="aqua-button" id="btn-search-place">Search Place</button><div id="place-results"></div></div>
                         <div class="add-memory-input-group" id="input-type-Musica"><label for="memoria-music-search">Search iTunes:</label><input type="text" id="memoria-music-search" placeholder="Enter song/album..."><button type="button" class="aqua-button" id="btn-search-itunes">Search Music</button><div id="itunes-results"></div></div>
                         <div class="add-memory-input-group" id="input-type-Imagen"><label for="memoria-image-upload">Upload Image:</label><input type="file" id="memoria-image-upload" accept="image/*"><label for="memoria-image-desc">Desc (Optional):</label><input type="text" id="memoria-image-desc" placeholder="Describe image..."><div id="image-upload-status"></div></div>

                         <button type="submit" id="save-memoria-btn" class="aqua-button">Add Memory</button>
                         <p id="memoria-status"></p>
                    </form>
                </div>

                <!-- Delete Confirmation -->
                <div id="confirm-delete-dialog" style="display: none;"> <p id="confirm-delete-text"></p> <button id="confirm-delete-no" class="aqua-button">Cancel</button> <button id="confirm-delete-yes" class="aqua-button delete-confirm">Yes, delete</button> </div>

                <!-- Main Bottom Buttons -->
                <div class="modal-main-buttons"> <button id="close-edit-add-btn">Close</button> </div>
            </div>`;
        document.body.appendChild(modal);

        // Populate day select only once
        const daySelect = document.getElementById('edit-mem-day');
        if (daySelect && daySelect.options.length === 0) {
            allDaysData.forEach(d => { const option = document.createElement('option'); option.value = d.id; option.textContent = d.Nombre_Dia; daySelect.appendChild(option); });
        }

        // Attach listeners only once
        document.getElementById('close-edit-add-btn').onclick = () => cerrarModalEdicion();
        modal.onclick = (e) => { if (e.target.id === 'edit-add-modal') cerrarModalEdicion(); };
        document.getElementById('confirm-delete-no').onclick = () => { const dialog = document.getElementById('confirm-delete-dialog'); if(dialog) dialog.style.display = 'none'; };
        document.getElementById('memoria-type').addEventListener('change', handleMemoryTypeChangeUnified);
        document.getElementById('btn-search-itunes').onclick = buscarBSOUnified;
        document.getElementById('btn-search-place').onclick = buscarLugarUnified;
        const fileInput = document.getElementById('memoria-image-upload');
        const imageStatus = document.getElementById('image-upload-status');
        if(fileInput && imageStatus) fileInput.onchange = (e) => imageStatus.textContent = e.target.files?.[0] ? `Selected: ${e.target.files[0].name}` : '';
        document.getElementById('memory-form').onsubmit = handleMemoryFormSubmit;
        document.getElementById('save-name-btn').onclick = () => { if(currentlyOpenDay) guardarNombreEspecial(currentlyOpenDay.id, document.getElementById('nombre-especial-input').value.trim()); };
    }

    // --- Configure modal based on mode (Add vs Edit) ---
    const daySelectionSection = document.getElementById('day-selection-section');
    const dayNameSection = document.getElementById('day-name-section');
    const daySelect = document.getElementById('edit-mem-day');
    const yearInput = document.getElementById('edit-mem-year');
    const titleEl = document.getElementById('edit-modal-title');
    const nameInput = document.getElementById('nombre-especial-input');

    if (isAdding) {
        if(daySelectionSection) daySelectionSection.style.display = 'block';
        if(dayNameSection) dayNameSection.style.display = 'none'; // Hide name edit when adding
        titleEl.textContent = "Add New Memory"; // Set title for Add mode
        // Set defaults for day/year
        const today = new Date(); const todayId = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        if (daySelect && daySelect.querySelector(`option[value="${todayId}"]`)) daySelect.value = todayId;
        if(yearInput) yearInput.value = today.getFullYear();
        resetMemoryFormUnified(); // Reset form to Add mode
        handleMemoryTypeChangeUnified(); // Show default ('Texto') inputs
         // Clear memory list as we are adding, not showing existing for a specific day initially
        document.getElementById('edit-memorias-list').innerHTML = '<p style="font-style: italic; color: #777; font-size: 12px;">Add memories below.</p>';
        currentMemories = []; // Clear local cache too
    } else {
        if(daySelectionSection) daySelectionSection.style.display = 'none';
        if(dayNameSection) dayNameSection.style.display = 'block'; // Show name edit
        titleEl.textContent = `Editing: ${currentlyOpenDay.Nombre_Dia} (${currentlyOpenDay.id})`;
        nameInput.value = currentlyOpenDay.Nombre_Especial === 'Unnamed Day' ? '' : currentlyOpenDay.Nombre_Especial;
        resetMemoryFormUnified(); // Reset form to Add mode
        handleMemoryTypeChangeUnified(); // Show default inputs
        await cargarYMostrarMemorias(currentlyOpenDay.id, 'edit-memorias-list'); // Load existing memories
    }

    // Clear status messages
    document.getElementById('save-status').textContent = '';
    document.getElementById('memoria-status').textContent = '';
    const confirmDialog = document.getElementById('confirm-delete-dialog'); if(confirmDialog) confirmDialog.style.display = 'none';

    // Show modal
    modal.style.display = 'flex'; setTimeout(() => modal.classList.add('visible'), 10);
}

function cerrarModalEdicion() {
    const modal = document.getElementById('edit-add-modal');
    if (modal) { modal.classList.remove('visible'); setTimeout(() => { modal.style.display = 'none'; }, 200); }
    currentlyOpenDay = null; // Clear day data
    editingMemoryId = null; // Ensure edit state is cleared
    selectedPlace = null;
    selectedMusicTrack = null;
}

// --- Load/Display Memories (Targeting Unified Modal) ---
async function cargarYMostrarMemorias(diaId, targetDivId) { // targetDivId is now always 'edit-memorias-list' or 'preview-memorias-list'
    const memoriasListDiv = document.getElementById(targetDivId);
    if (!memoriasListDiv) { console.error("Target div missing:", targetDivId); return; }
    memoriasListDiv.innerHTML = 'Loading...';
    // Only clear currentMemories if loading into the edit list
    if (targetDivId === 'edit-memorias-list') currentMemories = [];
    try {
        const memoriasRef = collection(db, "Dias", diaId, "Memorias");
        const q = query(memoriasRef, orderBy("Fecha_Original", "desc"));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) { memoriasListDiv.innerHTML = '<p style="font-style: italic; color: #777; font-size: 12px;">No memories yet.</p>'; return; }
        memoriasListDiv.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const memoria = { id: docSnap.id, ...docSnap.data() };
            if (targetDivId === 'edit-memorias-list') currentMemories.push(memoria); // Store only for edit list

            const itemDiv = document.createElement('div'); itemDiv.className = 'memoria-item';
            let fechaStr = 'Unknown date';
            if (memoria.Fecha_Original?.toDate) { try { fechaStr = memoria.Fecha_Original.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); } catch(e) { fechaStr = memoria.Fecha_Original.toDate().toISOString().split('T')[0]; } } else if (memoria.Fecha_Original) { fechaStr = memoria.Fecha_Original.toString(); }
            let contentHTML = `<small>${fechaStr}</small>`; let artworkHTML = '';
            switch (memoria.Tipo) { case 'Lugar': contentHTML += `📍 ${memoria.LugarNombre || 'Place'}`; break; case 'Musica': if (memoria.CancionData?.trackName) { contentHTML += `🎵 <strong>${memoria.CancionData.trackName}</strong> by ${memoria.CancionData.artistName}`; if(memoria.CancionData.artworkUrl60) artworkHTML = `<img src="${memoria.CancionData.artworkUrl60}" alt="Art" class="memoria-artwork">`; } else { contentHTML += `🎵 ${memoria.CancionInfo || 'Music'}`; } break; case 'Imagen': contentHTML += `🖼️ Image`; if (memoria.ImagenURL) contentHTML += ` (<a href="${memoria.ImagenURL}" target="_blank">View</a>)`; if (memoria.Descripcion) contentHTML += `<br>${memoria.Descripcion}`; break; case 'Texto': default: contentHTML += memoria.Descripcion || ''; break; }
            const actionsHTML = (targetDivId === 'edit-memorias-list') ? ` <div class="memoria-actions"> <button class="edit-btn" title="Edit" data-memoria-id="${memoria.id}">${editIconSVG}</button> <button class="delete-btn" title="Delete" data-memoria-id="${memoria.id}">${deleteIconSVG}</button> </div>` : '';
            itemDiv.innerHTML = `${artworkHTML}<div class="memoria-item-content">${contentHTML}</div>${actionsHTML}`;
            memoriasListDiv.appendChild(itemDiv);
        });

        // Attach listeners AFTER appending ALL items for the edit list
        if (targetDivId === 'edit-memorias-list') {
            attachMemoryActionListeners(diaId);
        }
        console.log(`Loaded ${querySnapshot.size} memories for ${diaId} into ${targetDivId}`);
    } catch (e) { console.error(`Error loading memories ${diaId}:`, e); memoriasListDiv.innerHTML = '<p class="error">Error loading memories.</p>'; }
}

// Helper to attach listeners to dynamically created buttons
function attachMemoryActionListeners(diaId) {
    const listDiv = document.getElementById('edit-memorias-list');
    if (!listDiv) return;

    listDiv.querySelectorAll('.edit-btn').forEach(btn => {
        // Remove existing listener to prevent duplicates if list reloads
        btn.replaceWith(btn.cloneNode(true));
    });
     listDiv.querySelectorAll('.delete-btn').forEach(btn => {
         btn.replaceWith(btn.cloneNode(true));
     });

     // Add new listeners
    listDiv.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const memId = btn.getAttribute('data-memoria-id');
            const memToEdit = currentMemories.find(m => m.id === memId);
            if (memToEdit) startEditMemoriaUnified(memToEdit); // Use unified start edit
            else console.error("Could not find memory to edit:", memId);
        });
    });
    listDiv.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const memId = btn.getAttribute('data-memoria-id');
            const memToDelete = currentMemories.find(m => m.id === memId);
            if(memToDelete) {
                const displayInfo = memToDelete.Descripcion || memToDelete.LugarNombre || memToDelete.CancionInfo || memToDelete.ImagenURL || "this memory";
                confirmDeleteMemoriaUnified(diaId, memToDelete.id, displayInfo); // Use unified confirm delete
            } else { console.error("Could not find memory to delete:", memId); }
        });
    });
}


// --- Unified CRUD Functions ---
function handleMemoryTypeChangeUnified() { // For unified modal
    const selectedType = document.getElementById('memoria-type').value;
    const typeDivs = ['input-type-Texto', 'input-type-Lugar', 'input-type-Musica', 'input-type-Imagen'];
    typeDivs.forEach(id => { const div = document.getElementById(id); if (div) div.style.display = 'none'; });
    const divToShow = document.getElementById(`input-type-${selectedType}`); if (divToShow) { divToShow.style.display = 'block'; }
    // Clear results/selections when type changes
    if (selectedType !== 'Musica') { document.getElementById('itunes-results').innerHTML = ''; selectedMusicTrack = null; }
    if (selectedType !== 'Lugar') { document.getElementById('place-results').innerHTML = ''; selectedPlace = null; }
    if (selectedType !== 'Imagen') { document.getElementById('memoria-image-upload').value = null; document.getElementById('image-upload-status').textContent = ''; }
}

async function buscarBSOUnified() { // For unified modal
    const queryInput = document.getElementById('memoria-music-search'); const resultsDiv = document.getElementById('itunes-results'); const statusDiv = document.getElementById('memoria-status'); const query = queryInput.value.trim(); if (!query) { resultsDiv.innerHTML = '<p class="error">Enter search term.</p>'; return; } resultsDiv.innerHTML = '<p>Searching...</p>'; statusDiv.textContent = ''; selectedMusicTrack = null; const proxyUrl = 'https://corsproxy.io/?'; const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=5`; const url = proxyUrl + encodeURIComponent(itunesUrl); try { const response = await fetch(url); if (!response.ok) throw new Error(`HTTP ${response.status}`); const data = await response.json(); if (!data.results || data.resultCount === 0) { resultsDiv.innerHTML = '<p>No results.</p>'; return; } resultsDiv.innerHTML = ''; data.results.forEach(track => { const trackDiv = document.createElement('div'); trackDiv.className = 'itunes-track'; const artworkUrl = track.artworkUrl100 || track.artworkUrl60 || ''; trackDiv.innerHTML = ` <img src="${artworkUrl}" class="itunes-artwork" style="${artworkUrl ? '' : 'display:none;'}" onerror="this.style.display='none';"><div class="itunes-track-info"><div class="itunes-track-name">${track.trackName}</div><div class="itunes-track-artist">${track.artistName}</div></div><div class="itunes-track-select">➔</div>`; trackDiv.onclick = () => { selectedMusicTrack = track; queryInput.value = `${track.trackName} - ${track.artistName}`; resultsDiv.innerHTML = `<div class="itunes-track selected"><img src="${artworkUrl}" class="itunes-artwork" style="${artworkUrl ? '' : 'display:none;'}"><div class="itunes-track-info">...</div><span style="color:green;">✓</span></div>`; console.log("Selected:", selectedMusicTrack); }; resultsDiv.appendChild(trackDiv); }); } catch (error) { console.error('iTunes Error:', error); resultsDiv.innerHTML = `<p class="error">Search error: ${error.message}</p>`; }
}
async function buscarLugarUnified() { // For unified modal
    const queryInput = document.getElementById('memoria-place-search'); const resultsDiv = document.getElementById('place-results'); const statusDiv = document.getElementById('memoria-status'); const query = queryInput.value.trim(); if (!query) { resultsDiv.innerHTML = '<p class="error">Enter place.</p>'; return; } resultsDiv.innerHTML = '<p>Searching...</p>'; statusDiv.textContent = ''; selectedPlace = null; const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`; try { const response = await fetch(nominatimUrl, { headers: { 'Accept': 'application/json' } }); if (!response.ok) throw new Error(`HTTP ${response.status}`); const data = await response.json(); if (!data || data.length === 0) { resultsDiv.innerHTML = '<p>No results.</p>'; return; } resultsDiv.innerHTML = ''; data.forEach(place => { const placeDiv = document.createElement('div'); placeDiv.className = 'place-result'; placeDiv.innerHTML = `${place.display_name}`; placeDiv.onclick = () => { selectedPlace = { name: place.display_name, lat: place.lat, lon: place.lon, osm_id: place.osm_id, osm_type: place.osm_type }; queryInput.value = place.display_name; resultsDiv.innerHTML = `<p class="success">Selected: ${place.display_name}</p>`; console.log("Selected:", selectedPlace); }; resultsDiv.appendChild(placeDiv); }); } catch (error) { console.error('Nominatim Error:', error); resultsDiv.innerHTML = `<p class="error">Search error: ${error.message}</p>`; }
}

function startEditMemoriaUnified(memoria) { // For unified modal
    editingMemoryId = memoria.id;
    const typeSelect = document.getElementById('memoria-type');
    const fechaInput = document.getElementById('memoria-fecha');
    const descTextarea = document.getElementById('memoria-desc');
    const placeInput = document.getElementById('memoria-place-search');
    const musicInput = document.getElementById('memoria-music-search');
    const imageDescInput = document.getElementById('memoria-image-desc');
    const imageFileInput = document.getElementById('memoria-image-upload'); // File input cannot be pre-filled
    const imageStatus = document.getElementById('image-upload-status');
    const saveButton = document.getElementById('save-memoria-btn');

    // Set type and show correct fields
    typeSelect.value = memoria.Tipo || 'Texto';
    handleMemoryTypeChangeUnified(); // Show the right input group

    // Set date
    if (memoria.Fecha_Original?.toDate) { try { fechaInput.value = memoria.Fecha_Original.toDate().toISOString().split('T')[0]; } catch(e){ fechaInput.value = ''; } } else { fechaInput.value = ''; }

    // Set content based on type
    selectedPlace = null; selectedMusicTrack = null; // Clear selections
    document.getElementById('place-results').innerHTML = ''; document.getElementById('itunes-results').innerHTML = ''; imageStatus.textContent = ''; imageFileInput.value = null;

    switch (memoria.Tipo) {
        case 'Lugar': placeInput.value = memoria.LugarNombre || ''; descTextarea.value = ''; musicInput.value = ''; imageDescInput.value = ''; break;
        case 'Musica': musicInput.value = memoria.CancionInfo || ''; descTextarea.value = ''; placeInput.value = ''; imageDescInput.value = ''; break;
        case 'Imagen': imageDescInput.value = memoria.Descripcion || ''; descTextarea.value = ''; placeInput.value = ''; musicInput.value = ''; imageStatus.textContent = memoria.ImagenURL ? `Current image saved.` : 'No image file selected.'; break; // Indicate current state
        case 'Texto': default: descTextarea.value = memoria.Descripcion || ''; placeInput.value = ''; musicInput.value = ''; imageDescInput.value = ''; break;
    }

    saveButton.textContent = 'Update Memory'; saveButton.classList.add('update-mode');
    // Focus appropriate field
    if (memoria.Tipo === 'Texto' || memoria.Tipo === 'Imagen') descTextarea.focus();
    else if (memoria.Tipo === 'Lugar') placeInput.focus();
    else if (memoria.Tipo === 'Musica') musicInput.focus();
}

// Handles submission for both Add and Update in the unified modal
async function handleMemoryFormSubmit(event) {
    event.preventDefault(); // Prevent default form submission
    const statusDiv = document.getElementById('memoria-status');
    statusDiv.className = ''; statusDiv.textContent = editingMemoryId ? 'Updating...' : 'Saving...';

    // Determine the target day ID
    let diaId;
    const daySelect = document.getElementById('edit-mem-day');
    if (daySelect && daySelect.style.display !== 'none' && daySelect.value) { // Adding from footer
         diaId = daySelect.value;
    } else if (currentlyOpenDay) { // Editing within a specific day's modal
         diaId = currentlyOpenDay.id;
    } else {
         statusDiv.textContent = 'Error: Cannot determine target day.'; statusDiv.className = 'error'; return;
    }

    const yearInput = document.getElementById('edit-mem-year');
    const year = parseInt(yearInput.value, 10);
    const type = document.getElementById('memoria-type').value;
    const fechaStr = document.getElementById('memoria-fecha').value; // Get date string

    // Validation
    if (!diaId || !year || isNaN(year) || year < 1800 || year > new Date().getFullYear() + 1 || !fechaStr) { statusDiv.textContent = 'Please select day, year, and date.'; statusDiv.className = 'error'; return; }
    const month = parseInt(diaId.substring(0, 2), 10); const day = parseInt(diaId.substring(3), 10);
    if (isNaN(month) || isNaN(day) || day < 1 || day > daysInMonth[month - 1]) { statusDiv.textContent = 'Invalid day selection.'; statusDiv.className = 'error'; return; }
    let dateOfMemory; try { const dateParts = fechaStr.split('-'); dateOfMemory = new Date(Date.UTC(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))); if (isNaN(dateOfMemory.getTime())) throw new Error(); } catch(e) { statusDiv.textContent = 'Invalid Original Date.'; statusDiv.className = 'error'; return; }
    const fechaOriginalTimestamp = Timestamp.fromDate(dateOfMemory);


    let memoryData = { Fecha_Original: fechaOriginalTimestamp, Tipo: type };
    let isValid = true;
    let imageFileToUpload = null;

    // Populate memoryData based on type
    switch (type) {
        case 'Texto': memoryData.Descripcion = document.getElementById('memoria-desc').value.trim(); if (!memoryData.Descripcion) isValid = false; break;
        case 'Lugar': if (selectedPlace) { memoryData.LugarNombre = selectedPlace.name; memoryData.LugarData = { lat: selectedPlace.lat, lon: selectedPlace.lon, osm_id: selectedPlace.osm_id, osm_type: selectedPlace.osm_type }; } else { memoryData.LugarNombre = document.getElementById('memoria-place-search').value.trim(); if (!memoryData.LugarNombre) isValid = false; memoryData.LugarData = null; } break;
        case 'Musica': if (selectedMusicTrack) { memoryData.CancionData = { /* ... */ trackId: selectedMusicTrack.trackId, artistName: selectedMusicTrack.artistName, trackName: selectedMusicTrack.trackName, artworkUrl60: selectedMusicTrack.artworkUrl60, trackViewUrl: selectedMusicTrack.trackViewUrl }; memoryData.CancionInfo = `${selectedMusicTrack.trackName} - ${selectedMusicTrack.artistName}`; } else { memoryData.CancionInfo = document.getElementById('memoria-music-search').value.trim(); if (!memoryData.CancionInfo) isValid = false; memoryData.CancionData = null; } break;
        case 'Imagen': const fileInput = document.getElementById('memoria-image-upload'); memoryData.Descripcion = document.getElementById('memoria-image-desc').value.trim() || null; if (fileInput.files && fileInput.files[0]) { imageFileToUpload = fileInput.files[0]; memoryData.ImagenURL = "placeholder_uploading"; } else if (!editingMemoryId) { isValid = false; } /* Require file only for ADD */ break; // Allow update without new file
        default: isValid = false; break;
    }

    if (!isValid) { statusDiv.textContent = 'Please fill required fields or select file.'; statusDiv.className = 'error'; return; }

    // --- Save Logic ---
    try {
        const memoriasRef = collection(db, "Dias", diaId, "Memorias");
        if (editingMemoryId) { // Update existing memory
            const memRef = doc(db, "Dias", diaId, "Memorias", editingMemoryId);
             // Preserve existing fields not being updated (e.g., ImagenURL if not changing image)
             const existingMem = currentMemories.find(m => m.id === editingMemoryId);
             if (type === 'Imagen' && !imageFileToUpload && existingMem?.ImagenURL) {
                 memoryData.ImagenURL = existingMem.ImagenURL; // Keep old URL if no new file
             }
             if (type === 'Imagen' && imageFileToUpload) {
                 // ** Image upload logic needed here **
                 alert("Image upload/update not implemented yet."); return;
             }
             await updateDoc(memRef, memoryData);
             statusDiv.textContent = 'Memory Updated!'; statusDiv.className = 'success';
        } else { // Add new memory
             if (type === 'Imagen' && imageFileToUpload) {
                 // ** Image upload logic needed here **
                 alert("Image upload not implemented yet."); return;
             }
             memoryData.Creado_En = Timestamp.now(); // Add creation timestamp for new
             await addDoc(memoriasRef, memoryData);
             statusDiv.textContent = 'Memory Saved!'; statusDiv.className = 'success';
        }

        resetMemoryFormUnified(); // Reset form fields
        await cargarYMostrarMemorias(diaId, 'edit-memorias-list'); // Reload list
        setTimeout(() => statusDiv.textContent = '', 2000); // Clear status message

    } catch (e) { console.error("Error saving/updating memory:", e); statusDiv.textContent = `Error: ${e.message}`; statusDiv.className = 'error'; }
}


function confirmDeleteMemoriaUnified(diaId, memoriaId, displayInfo) { // For unified modal
    const dialog = document.getElementById('confirm-delete-dialog'); const yesButton = document.getElementById('confirm-delete-yes'); const textElement = document.getElementById('confirm-delete-text'); const descPreview = displayInfo ? (displayInfo.length > 50 ? displayInfo.substring(0, 47) + '...' : displayInfo) : 'this memory'; textElement.textContent = `Delete "${descPreview}"?`; dialog.style.display = 'block'; const modalContent = document.querySelector('#edit-add-modal .modal-content'); if (modalContent && !modalContent.contains(dialog)) { modalContent.appendChild(dialog); } yesButton.onclick = null; yesButton.onclick = async () => { dialog.style.display = 'none'; await deleteMemoriaUnified(diaId, memoriaId); };
}
async function deleteMemoriaUnified(diaId, memoriaId) { // For unified modal
    const statusDiv = document.getElementById('memoria-status'); statusDiv.textContent = 'Deleting...'; statusDiv.className = ''; try { const memoriaRef = doc(db, "Dias", diaId, "Memorias", memoriaId); await deleteDoc(memoriaRef); statusDiv.textContent = 'Memory Deleted!'; statusDiv.className = 'success'; currentMemories = currentMemories.filter(m => m.id !== memoriaId); await cargarYMostrarMemorias(diaId, 'edit-memorias-list'); setTimeout(() => statusDiv.textContent = '', 2000); } catch (e) { console.error("Error deleting:", e); statusDiv.textContent = `Error: ${e.message}`; statusDiv.className = 'error'; }
}

function resetMemoryFormUnified() { // For unified modal
    editingMemoryId = null; const form = document.getElementById('memory-form'); if(form) { form.reset(); const saveButton = document.getElementById('save-memoria-btn'); if(saveButton) { saveButton.textContent = 'Add Memory'; saveButton.classList.remove('update-mode'); } const statusEl = document.getElementById('memoria-status'); if(statusEl) statusEl.textContent = ''; document.getElementById('itunes-results').innerHTML = ''; document.getElementById('place-results').innerHTML = ''; document.getElementById('image-upload-status').textContent = ''; selectedPlace = null; selectedMusicTrack = null; handleMemoryTypeChangeUnified(); /* Ensure correct fields show */ }
}

async function guardarNombreEspecial(diaId, nuevoNombre) { /* ... unchanged ... */
    const status = document.getElementById('save-status'); try { status.textContent = "Saving..."; status.className = ''; const diaRef = doc(db, "Dias", diaId); const valorFinal = nuevoNombre || "Unnamed Day"; await updateDoc(diaRef, { Nombre_Especial: valorFinal }); const diaIndex = allDaysData.findIndex(d => d.id === diaId); if (diaIndex !== -1) allDaysData[diaIndex].Nombre_Especial = valorFinal; status.textContent = "Name Saved!"; status.className = 'success'; if(currentlyOpenDay && currentlyOpenDay.id === diaId) { currentlyOpenDay.Nombre_Especial = valorFinal; } setTimeout(() => { status.textContent = ''; dibujarMesActual(); }, 1200); const previewTitle = document.getElementById('preview-title'); const previewModal = document.getElementById('preview-modal'); if(previewTitle && currentlyOpenDay && currentlyOpenDay.id === diaId && previewModal?.style.display === 'flex') { previewTitle.textContent = `${currentlyOpenDay.Nombre_Dia} ${valorFinal !== 'Unnamed Day' ? '('+valorFinal+')' : ''}`; } } catch (e) { status.textContent = `Error: ${e.message}`; status.className = 'error'; console.error(e); }
}

// --- Expose functions needed ---
window.handleMemoryTypeChangeUnified = handleMemoryTypeChangeUnified;
window.buscarBSOUnified = buscarBSOUnified;
window.buscarLugarUnified = buscarLugarUnified;
window.handleMemoryFormSubmit = handleMemoryFormSubmit;
window.startEditMemoriaUnified = startEditMemoriaUnified; // Unified Edit Start
window.confirmDeleteMemoriaUnified = confirmDeleteMemoriaUnified; // Unified Delete Confirm
window.cerrarModalPreview = cerrarModalPreview;
window.abrirModalEdicion = abrirModalEdicion; // Keep exposed for preview button
window.cerrarModalEdicion = cerrarModalEdicion;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;

// --- Start App ---
checkAndRunApp();


// --- Start App ---
checkAndRunApp();

