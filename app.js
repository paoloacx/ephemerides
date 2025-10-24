/* app.js - v7.3 - Final Polish & Footer Actions */

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
let selectedMusicTrack = null; // Store selected iTunes track data

// --- SVG Icons ---
const editIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg>`;
const deleteIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m3 0l-.5 8.5a.5.5 0 1 0 .998.06l.5-8.5a.5.5 0 1 0-.998.06m3 .5l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Z"/></svg>`;
const pencilIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/></svg>`;


// --- Check/Repair DB (Unchanged) ---
async function checkAndRunApp() { /* ... Unchanged ... */ }
async function generateCleanDatabase() { /* ... Unchanged ... */ }
async function loadDataAndDrawCalendar() { /* ... Unchanged ... */ }
function configurarNavegacion() { /* ... Unchanged ... */ }

// --- Draw Current Month (Unchanged) ---
function dibujarMesActual() { /* ... Unchanged ... */ }

// --- Footer Actions (Updated logic) ---
function configurarFooter() {
    // Today Button: Find today's date and open preview
    document.getElementById('btn-hoy').onclick = () => {
        const today = new Date();
        // Format MM-DD for ID lookup
        const todayMonth = (today.getMonth() + 1).toString().padStart(2, '0');
        const todayDay = today.getDate().toString().padStart(2, '0');
        const todayId = `${todayMonth}-${todayDay}`;
        console.log("Today button clicked, searching for ID:", todayId);

        const todayDia = allDaysData.find(d => d.id === todayId);
        if (todayDia) {
             // Go to the correct month first
             currentMonthIndex = today.getMonth();
             dibujarMesActual();
             // Open preview after a short delay to allow rendering
             setTimeout(() => abrirModalPreview(todayDia), 50);
             window.scrollTo(0, 0); // Scroll to top
        } else {
            console.error("Could not find today's data:", todayId);
            alert("Error: Could not find data for today."); // Simple alert
        }
    };

    // Search Button (Unchanged)
    document.getElementById('btn-buscar').onclick = () => {
        const searchTerm = prompt("Search memories by text (case-insensitive):");
        if (searchTerm && searchTerm.trim() !== '') { buscarMemorias(searchTerm.trim().toLowerCase()); }
    };

    // Shuffle Button: Pick random day and open preview
    document.getElementById('btn-shuffle').onclick = () => {
        if (allDaysData.length > 0) {
            const randomIndex = Math.floor(Math.random() * allDaysData.length);
            const randomDia = allDaysData[randomIndex];
            console.log("Shuffle button clicked, opening random day:", randomDia.id);
             // Go to the correct month first
             currentMonthIndex = parseInt(randomDia.id.substring(0, 2), 10) - 1;
             dibujarMesActual();
             // Open preview after a short delay
             setTimeout(() => abrirModalPreview(randomDia), 50);
             window.scrollTo(0, 0); // Scroll to top
        }
    };

    // Add Memory Button: Open the new modal
    document.getElementById('btn-add-memory').onclick = () => {
        abrirModalAddMemory();
    };
}

// --- Search Memories (Unchanged) ---
async function buscarMemorias(term) { /* ... Unchanged ... */ }

// --- Preview Modal (Unchanged) ---
async function abrirModalPreview(dia) { /* ... Unchanged ... */ }
function cerrarModalPreview() { /* ... Unchanged ... */ }

// --- Edit Modal (Unchanged) ---
async function abrirModalEdicion(dia) { /* ... Unchanged ... */ }
function cerrarModalEdicion() { /* ... Unchanged ... */ }

// --- Load/Display Memories (Updated to show new types) ---
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
            const memoria = { id: docSnap.id, ...docSnap.data() }; currentMemories.push(memoria);
            const itemDiv = document.createElement('div'); itemDiv.className = 'memoria-item';
            let fechaStr = 'Unknown date';
            if (memoria.Fecha_Original?.toDate) {
                 try { fechaStr = memoria.Fecha_Original.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
                 catch(e) { fechaStr = memoria.Fecha_Original.toDate().toISOString().split('T')[0]; }
            } else if (memoria.Fecha_Original) { fechaStr = memoria.Fecha_Original.toString(); }

            // Display different types of memories
            let contentHTML = `<small>${fechaStr}</small>`;
            switch (memoria.Tipo) {
                case 'Lugar':
                    contentHTML += `📍 Visited: ${memoria.LugarNombre || 'Unknown Place'}`;
                    // Add link if LugarData exists (future)
                    break;
                case 'Musica':
                     // Display structured music data if available (from selectedMusicTrack)
                     if (memoria.CancionData && memoria.CancionData.trackName) {
                         contentHTML += `🎵 Listened to: <strong>${memoria.CancionData.trackName}</strong> by ${memoria.CancionData.artistName}`;
                         // Maybe add a small artwork image if URL exists
                         // if(memoria.CancionData.artworkUrl60) {
                         //     contentHTML += `<img src="${memoria.CancionData.artworkUrl60}" alt="Artwork" style="width:20px; height:20px; margin-left: 5px; vertical-align: middle;">`;
                         // }
                     } else {
                         contentHTML += `🎵 Listened to: ${memoria.CancionInfo || 'Unknown Song'}`; // Fallback to text
                     }
                    break;
                case 'Imagen':
                    contentHTML += `🖼️ Added Image`;
                    if (memoria.ImagenURL) {
                        // Display thumbnail or link (simple link for now)
                        contentHTML += ` (<a href="${memoria.ImagenURL}" target="_blank" style="font-size: 10px;">View</a>)`;
                    }
                    if (memoria.Descripcion) { // Show description if added
                        contentHTML += `<br>${memoria.Descripcion}`;
                    }
                    break;
                case 'Texto': // Fallthrough for default/Texto
                default:
                     contentHTML += memoria.Descripcion || 'No description';
                     break;
            }

            const actionsHTML = (targetDivId === 'edit-memorias-list') ? `
                <div class="memoria-actions">
                    <button class="edit-btn" title="Edit">${editIconSVG}</button>
                    <button class="delete-btn" title="Delete">${deleteIconSVG}</button>
                </div>` : '';
            itemDiv.innerHTML = `<div class="memoria-item-content">${contentHTML}</div>${actionsHTML}`;

            if (targetDivId === 'edit-memorias-list') {
                 itemDiv.querySelector('.edit-btn').onclick = () => startEditMemoria(memoria);
                 // Use best available info for delete confirmation
                 const displayInfo = memoria.Descripcion || memoria.LugarNombre || memoria.CancionInfo || memoria.ImagenURL || "this memory";
                itemDiv.querySelector('.delete-btn').onclick = () => confirmDeleteMemoria(diaId, memoria.id, displayInfo);
            }
            memoriasListDiv.appendChild(itemDiv);
        });
        console.log(`Loaded ${currentMemories.length} memories for ${diaId} into ${targetDivId}`);
    } catch (e) { console.error(`Error loading memories ${diaId}:`, e); memoriasListDiv.innerHTML = '<p class="error">Error loading memories.</p>'; }
}


// --- CRUD Functions (Adapted for Editing different types - Basic for now) ---
function startEditMemoria(memoria) {
    editingMemoryId = memoria.id;
    const fechaInput = document.getElementById('memoria-fecha');
    const descInput = document.getElementById('memoria-desc'); // Still uses the main description field
    const addButton = document.getElementById('add-memoria-btn');

    // Load date
    if (memoria.Fecha_Original?.toDate) {
        try { fechaInput.value = memoria.Fecha_Original.toDate().toISOString().split('T')[0]; } catch(e) { fechaInput.value = ''; }
    } else { fechaInput.value = ''; }

    // Load appropriate content into description field (simplification for now)
    let descriptionToEdit = '';
    switch (memoria.Tipo) {
        case 'Lugar': descriptionToEdit = memoria.LugarNombre || ''; break;
        case 'Musica': descriptionToEdit = memoria.CancionInfo || ''; break; // Edit the raw text for now
        case 'Imagen': descriptionToEdit = memoria.ImagenURL || ''; break; // Edit the URL for now
        case 'Texto':
        default: descriptionToEdit = memoria.Descripcion || ''; break;
    }
    descInput.value = descriptionToEdit;

    addButton.textContent = 'Update Memory';
    addButton.classList.add('update-mode');
    descInput.focus();
}
async function updateMemoria(diaId, memoriaId, fechaStr, descriptionValue) {
    const memoriaStatus = document.getElementById('memoria-status');
    if (!fechaStr || !descriptionValue) { // Still requires both fields for simplicity
        memoriaStatus.textContent = 'Date and primary content required.'; memoriaStatus.className = 'error';
        setTimeout(() => memoriaStatus.textContent = '', 3000); return;
    }
    memoriaStatus.textContent = 'Updating...'; memoriaStatus.className = '';
    try {
        const dateParts = fechaStr.split('-');
        const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        const fechaOriginalTimestamp = Timestamp.fromDate(localDate);
        const memoriaRef = doc(db, "Dias", diaId, "Memorias", memoriaId);

        // Find the original memory to know its type
        const originalMemoria = currentMemories.find(m => m.id === memoriaId);
        let updateData = { Fecha_Original: fechaOriginalTimestamp };

        // Update the correct field based on original type
        switch (originalMemoria?.Tipo) {
             case 'Lugar': updateData.LugarNombre = descriptionValue; break;
             case 'Musica': updateData.CancionInfo = descriptionValue; break; // Update raw text
             case 'Imagen': updateData.ImagenURL = descriptionValue; break; // Update URL
             case 'Texto':
             default: updateData.Descripcion = descriptionValue; break;
        }

        await updateDoc(memoriaRef, updateData);
        memoriaStatus.textContent = 'Memory Updated!'; memoriaStatus.className = 'success'; resetMemoryForm();
        await cargarYMostrarMemorias(diaId, 'edit-memorias-list');
        setTimeout(() => memoriaStatus.textContent = '', 2000);
    } catch (e) { console.error("Error updating:", e); memoriaStatus.textContent = `Error: ${e.message}`; memoriaStatus.className = 'error'; }
}
function confirmDeleteMemoria(diaId, memoriaId, displayInfo) { /* ... Unchanged ... */ }
async function deleteMemoria(diaId, memoriaId) { /* ... Unchanged ... */ }
async function guardarNuevaMemoria(diaId, fechaStr, descripcion) { /* ... Saves only Description type ... */
     const memoriaStatus = document.getElementById('memoria-status');
     if (!fechaStr || !descripcion) { memoriaStatus.textContent = 'Date and description required.'; memoriaStatus.className = 'error'; setTimeout(() => memoriaStatus.textContent = '', 3000); return; }
     memoriaStatus.textContent = 'Saving...'; memoriaStatus.className = '';
     try {
         const dateParts = fechaStr.split('-'); const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
         const fechaOriginalTimestamp = Timestamp.fromDate(localDate); const memoriasRef = collection(db, "Dias", diaId, "Memorias");
         await addDoc(memoriasRef, {
              Tipo: 'Texto', // Explicitly set type
              Fecha_Original: fechaOriginalTimestamp,
              Descripcion: descripcion,
              Creado_En: Timestamp.now()
          });
         memoriaStatus.textContent = 'Memory Saved!'; memoriaStatus.className = 'success'; resetMemoryForm();
         await cargarYMostrarMemorias(diaId, 'edit-memorias-list');
         setTimeout(() => memoriaStatus.textContent = '', 2000);
     } catch (e) { console.error("Error saving new:", e); memoriaStatus.textContent = `Error: ${e.message}`; memoriaStatus.className = 'error'; }
 }
function resetMemoryForm() { /* ... Unchanged ... */ }
async function guardarNombreEspecial(diaId, nuevoNombre) { /* ... Unchanged ... */ }


// --- NEW Add Memory Modal ---
function abrirModalAddMemory() {
    console.log("Opening Add Memory modal...");
    selectedMusicTrack = null; // Reset selected music
    let modal = document.getElementById('add-memory-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'add-memory-modal';
        modal.className = 'modal-add-memory';
        modal.innerHTML = `
             <div class="modal-add-memory-content">
                <h3>Add New Memory</h3>

                <div class="add-memory-form-section">
                    <label for="add-mem-day">Select Day (MM-DD):</label>
                    <select id="add-mem-day"></select>

                    <label for="add-mem-year">Year of Memory:</label>
                    <input type="number" id="add-mem-year" placeholder="YYYY" min="1900" max="${new Date().getFullYear()}" required>
                </div>

                <div class="add-memory-form-section">
                    <label for="add-mem-type">Type of Memory:</label>
                    <select id="add-mem-type">
                        <option value="Texto">Description</option>
                        <option value="Lugar">Place</option>
                        <option value="Musica">Music</option>
                        <option value="Imagen">Image</option>
                    </select>

                    {/* <!-- Inputs for each type --> */}
                    <div id="input-type-Texto">
                        <label for="add-mem-desc">Description:</label>
                        <textarea id="add-mem-desc" placeholder="Write your memory..."></textarea>
                    </div>
                    <div id="input-type-Lugar" style="display: none;">
                        <label for="add-mem-place">Place Name:</label>
                        <input type="text" id="add-mem-place" placeholder="Enter place name...">
                        <button type="button" class="placeholder-button" onclick="alert('Place search coming soon!')">Search Place (Future)</button>
                    </div>
                    <div id="input-type-Musica" style="display: none;">
                         <label for="add-mem-music-search">Search iTunes:</label>
                        <input type="text" id="add-mem-music-search" placeholder="Enter song or album title...">
                        <button type="button" class="aqua-button" id="btn-search-itunes">Search Music</button>
                        <div id="itunes-results" class="mt-4 flex flex-col gap-2"></div>
                        <input type="hidden" id="add-mem-music-info"> {/* Store selected track info */}
                    </div>
                    <div id="input-type-Imagen" style="display: none;">
                        <label for="add-mem-image-url">Image URL:</label>
                        <input type="url" id="add-mem-image-url" placeholder="http://...">
                        <label for="add-mem-image-desc">Image Description (Optional):</label>
                        <input type="text" id="add-mem-image-desc" placeholder="Describe the image...">
                        <button type="button" class="placeholder-button" onclick="alert('Image upload coming soon!')">Upload Image (Future)</button>
                    </div>
                </div>

                <div class="button-group">
                    <button type="button" id="close-add-mem-btn" class="aqua-button">Cancel</button>
                    <button type="button" id="save-add-mem-btn" class="aqua-button">Save Memory</button>
                </div>
                 <p id="add-memory-status"></p>
            </div>`;
        document.body.appendChild(modal);

        const daySelect = document.getElementById('add-mem-day');
        allDaysData.forEach(dia => {
            const option = document.createElement('option');
            option.value = dia.id;
            option.textContent = dia.Nombre_Dia;
            daySelect.appendChild(option);
        });

        // Set default date to today
        const today = new Date();
        const todayMonth = (today.getMonth() + 1).toString().padStart(2, '0');
        const todayDay = today.getDate().toString().padStart(2, '0');
        const todayId = `${todayMonth}-${todayDay}`;
        if (daySelect.querySelector(`option[value="${todayId}"]`)) {
            daySelect.value = todayId;
        }
        document.getElementById('add-mem-year').value = today.getFullYear();


        document.getElementById('add-mem-type').addEventListener('change', handleMemoryTypeChange);
        document.getElementById('close-add-mem-btn').onclick = () => cerrarModalAddMemory();
        document.getElementById('save-add-mem-btn').onclick = () => saveMemoryFromAddModal();
        modal.onclick = (e) => { if (e.target.id === 'add-memory-modal') cerrarModalAddMemory(); };

        // Attach iTunes search function
        document.getElementById('btn-search-itunes').onclick = buscarBSO; // Use buscarBSO directly
    }

    document.getElementById('add-memory-status').textContent = '';
    // Reset selected music
    selectedMusicTrack = null;
    document.getElementById('itunes-results').innerHTML = '';
    document.getElementById('add-mem-music-search').value = '';

    // Set default date every time modal opens
    const today = new Date();
    const todayMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    const todayDay = today.getDate().toString().padStart(2, '0');
    const todayId = `${todayMonth}-${todayDay}`;
    const daySelect = document.getElementById('add-mem-day');
     if (daySelect.querySelector(`option[value="${todayId}"]`)) {
        daySelect.value = todayId;
     }
     document.getElementById('add-mem-year').value = today.getFullYear();


    handleMemoryTypeChange();
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);
}

function handleMemoryTypeChange() {
    const selectedType = document.getElementById('add-mem-type').value;
    document.getElementById('input-type-Texto').style.display = 'none';
    document.getElementById('input-type-Lugar').style.display = 'none';
    document.getElementById('input-type-Musica').style.display = 'none';
    document.getElementById('input-type-Imagen').style.display = 'none';
    const divToShow = document.getElementById(`input-type-${selectedType}`);
    if (divToShow) { divToShow.style.display = 'block'; }
    // Clear iTunes results if switching away from Music
    if (selectedType !== 'Musica') {
        document.getElementById('itunes-results').innerHTML = '';
        selectedMusicTrack = null;
    }
}

function cerrarModalAddMemory() {
    const modal = document.getElementById('add-memory-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => { modal.style.display = 'none'; }, 200);
    }
}

// --- iTunes Search Function ---
async function buscarBSO() {
    const queryInput = document.getElementById('add-mem-music-search');
    const resultsDiv = document.getElementById('itunes-results');
    const statusDiv = document.getElementById('add-memory-status');
    const query = queryInput.value.trim();
    if (!query) {
        resultsDiv.innerHTML = '<p class="error" style="padding: 5px;">Please enter a search term.</p>'; // Translate later
        return;
    }

    resultsDiv.innerHTML = '<p style="padding: 5px;">Searching iTunes...</p>'; // Translate later
    statusDiv.textContent = ''; // Clear status
    selectedMusicTrack = null; // Reset selection

    // Use a proxy if direct fetch is blocked by CORS (common issue)
    // Option 1: Simple Proxy (replace with a real one if needed)
    // const proxyUrl = 'https://cors-anywhere.herokuapp.com/'; // Example proxy, might not always work
    // const url = `${proxyUrl}https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5`;

    // Option 2: Direct Fetch (try first)
     const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5`;


    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.resultCount === 0) {
            resultsDiv.innerHTML = '<p style="padding: 5px;">No results found.</p>'; // Translate later
            return;
        }

        resultsDiv.innerHTML = ''; // Clear loading message
        data.results.forEach(track => {
            const trackDiv = document.createElement('div');
            trackDiv.className = 'itunes-track';
            trackDiv.innerHTML = `
                <img src="${track.artworkUrl60 || track.artworkUrl100}" alt="Artwork">
                <div class="itunes-track-info">
                    <div class="itunes-track-name">${track.trackName}</div>
                    <div class="itunes-track-artist">${track.artistName}</div>
                </div>
                <div class="itunes-track-select">➔</div>
            `;
            // Add click listener to select the track
            trackDiv.onclick = () => {
                selectedMusicTrack = track; // Store the selected track data
                // Update the input field visually (optional)
                queryInput.value = `${track.trackName} - ${track.artistName}`;
                resultsDiv.innerHTML = `<p style="padding: 5px; color: green;">Selected: ${track.trackName}</p>`; // Indicate selection
                console.log("Selected music track:", selectedMusicTrack);
            };
            resultsDiv.appendChild(trackDiv);
        });

    } catch (error) {
        console.error('Error fetching iTunes data:', error);
        resultsDiv.innerHTML = `<p class="error" style="padding: 5px;">Error searching music. Check console.</p>`; // Translate later
         // Check for CORS error specifically
         if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
             resultsDiv.innerHTML += `<br><small>This might be a CORS issue. A proxy server might be needed.</small>`;
         }
    }
}


// --- Save Memory from Add Modal (Handles different types) ---
async function saveMemoryFromAddModal() {
    const statusDiv = document.getElementById('add-memory-status');
    statusDiv.className = ''; statusDiv.textContent = 'Saving...';

    const diaId = document.getElementById('add-mem-day').value;
    const year = parseInt(document.getElementById('add-mem-year').value, 10);
    const type = document.getElementById('add-mem-type').value;

    if (!diaId || !year || year < 1900 || year > new Date().getFullYear()) {
        statusDiv.textContent = 'Please select a valid day and year.'; statusDiv.className = 'error'; return;
    }
    const month = parseInt(diaId.substring(0, 2), 10); const day = parseInt(diaId.substring(3), 10);
    const dateOfMemory = new Date(year, month - 1, day);
    const fechaOriginalTimestamp = Timestamp.fromDate(dateOfMemory);

    let memoryData = { Fecha_Original: fechaOriginalTimestamp, Tipo: type, Creado_En: Timestamp.now() };
    let isValid = true;

    if (type === 'Texto') {
        memoryData.Descripcion = document.getElementById('add-mem-desc').value.trim();
        if (!memoryData.Descripcion) isValid = false;
    } else if (type === 'Lugar') {
        memoryData.LugarNombre = document.getElementById('add-mem-place').value.trim();
        if (!memoryData.LugarNombre) isValid = false; memoryData.LugarData = null; // Placeholder
    } else if (type === 'Musica') {
        if (selectedMusicTrack) {
             // Save structured data if a track was selected from iTunes results
             memoryData.CancionData = {
                 trackId: selectedMusicTrack.trackId,
                 artistName: selectedMusicTrack.artistName,
                 trackName: selectedMusicTrack.trackName,
                 artworkUrl60: selectedMusicTrack.artworkUrl60,
                 trackViewUrl: selectedMusicTrack.trackViewUrl
                 // Add more fields if needed
             };
             memoryData.CancionInfo = `${selectedMusicTrack.trackName} - ${selectedMusicTrack.artistName}`; // Also save simple string
        } else {
            // Fallback: Save the raw search text if no track was selected
             memoryData.CancionInfo = document.getElementById('add-mem-music-search').value.trim();
             memoryData.CancionData = null;
             if (!memoryData.CancionInfo) isValid = false;
        }
    } else if (type === 'Imagen') {
        memoryData.ImagenURL = document.getElementById('add-mem-image-url').value.trim();
        memoryData.Descripcion = document.getElementById('add-mem-image-desc').value.trim(); // Save optional description
        // Basic URL validation (very simple)
        if (!memoryData.ImagenURL || !memoryData.ImagenURL.startsWith('http')) isValid = false;
    } else { isValid = false; }

    if (!isValid) {
        statusDiv.textContent = 'Please fill in the required fields for the selected memory type.'; statusDiv.className = 'error'; return;
    }

    try {
        const memoriasRef = collection(db, "Dias", diaId, "Memorias");
        const docRef = await addDoc(memoriasRef, memoryData);
        console.log("New memory saved:", docRef.id, memoryData);
        statusDiv.textContent = 'Memory Saved!'; statusDiv.className = 'success';
        setTimeout(() => { cerrarModalAddMemory(); }, 1500);
    } catch (e) { console.error("Error saving new advanced memory:", e); statusDiv.textContent = `Error: ${e.message}`; statusDiv.className = 'error'; }
}

// --- Start App ---
checkAndRunApp();





