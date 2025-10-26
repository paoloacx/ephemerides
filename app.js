/* app.js - v10.16 - Optimized Month Loading + Firebase Config Module */

// Importaciones de Firebase SDK (solo las funciones, no la inicialización)
import {
    collection, getDocs, doc, updateDoc,
    writeBatch, setDoc, deleteDoc, Timestamp, query, orderBy, addDoc, limit,
    where, documentId // Añadir where y documentId
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
    GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

// ¡CAMBIO! Importar servicios inicializados desde el nuevo módulo
import { db, auth, storage } from './firebase-config.js';

// --- Global Variables & Constants ---
const appContent = document.getElementById("app-content");
const monthNameDisplayEl = document.getElementById("month-name-display");

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // Includes leap year Feb 29

// ¡CAMBIO! Usar un objeto para guardar los datos por mes
let monthlyDaysData = {}; // Objeto para almacenar arrays de días por índice de mes (0-11)

let currentMonthIndex = new Date().getMonth();
let currentMemories = [];
let editingMemoryId = null;
let currentlyOpenDay = null; // Holds the full day object for the currently open modal
let selectedMusicTrack = null;
let selectedPlace = null;
let currentUser = null;
let map = null; // Para la instancia de Leaflet
let mapMarker = null; // Para el marcador de Leaflet

// --- SVG Icons (Sin cambios) ---
const editIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg>`;
const deleteIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0 -1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m3 0l-.5 8.5a.5.5 0 1 0 .998.06l.5-8.5a.5.5 0 1 0-.998.06m3 .5l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Z"/></svg>`;
const pencilIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/></svg>`;
const loginIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M10 3.5a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 1 1 0v2A1.5 1.5 0 0 1 9.5 14h-8A1.5 1.5 0 0 1 0 12.5v-9A1.5 1.5 0 0 1 1.5 2h8A1.5 1.5 0 0 1 11 3.5v2a.5.5 0 0 1-1 0z"/><path fill-rule="evenodd" d="M4.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H14.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708z"/></svg>`;

// --- Auth (Sin cambios) ---
onAuthStateChanged(auth, (user) => { currentUser = user; updateLoginUI(user); if (user) { console.log("User logged in:", user.displayName); } else { console.log("User logged out."); } });
function updateLoginUI(user) { const loginBtn = document.getElementById('login-btn'); const userInfo = document.getElementById('user-info'); const userName = document.getElementById('user-name'); const userImg = document.getElementById('user-img'); if (user) { if (userInfo) userInfo.style.display = 'flex'; if (userName) userName.textContent = user.displayName || user.email || 'User'; if (userImg) userImg.src = user.photoURL || 'https://placehold.co/30x30/ccc/fff?text=?'; if (loginBtn) { loginBtn.innerHTML = loginIconSVG; loginBtn.title = "Logout"; loginBtn.onclick = handleLogout; } } else { if (userInfo) userInfo.style.display = 'none'; if (loginBtn) { loginBtn.innerHTML = `<img src="https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1OLUbq VilNfRHXkvdR8VdVAbkuQGcuSgs5nbDbpaE8nhzo6g=s0-w24-h24-p-k-rw-no" alt="G" style="width: 24px; height: 24px; border-radius: 50%;">`; loginBtn.title = "Login with Google"; loginBtn.onclick = handleLogin; } } }
async function handleLogin() { const provider = new GoogleAuthProvider(); try { await signInWithPopup(auth, provider); } catch (error) { console.error("Google Sign-In Error:", error); alert(`Login failed: ${error.message}`); } }
async function handleLogout() { try { await signOut(auth); } catch (error) { console.error("Sign-out Error:", error); alert(`Logout failed: ${error.message}`); } }

// --- App Initialization ---
async function initializeAppCore() {
    console.log("Starting App Initialization v10.16..."); // Mantener versión para referencia

    if (!appContent || !monthNameDisplayEl) {
        console.error("Critical Error: #app-content or #month-name-display are null at init.");
        document.body.innerHTML = "<p style='color:red; padding:20px;'>Error: HTML elements missing. Cannot start app.</p>";
        return;
    }

    appContent.innerHTML = "<p>Loading calendar...</p>";
    try {
        await loadAndDrawMonth(currentMonthIndex);
        configurarNavegacion();
        configurarFooter();
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) { refreshBtn.onclick = () => window.location.reload(); }
        updateLoginUI(auth.currentUser);

    } catch (e) {
        appContent.innerHTML = `<p class="error">Critical error during initialization: ${e.message}</p>`;
        console.error("Initialization Error:", e);
        if (e.message.includes("Failed to fetch") || e.message.includes("offline")) {
           appContent.innerHTML += "<p>Could not connect to database. Check internet connection.</p>"
        } else if (monthlyDaysData[currentMonthIndex]?.length === 0) {
            console.warn("Initial month load failed, attempting DB regeneration...");
            try {
                await generateCleanDatabase();
                await loadAndDrawMonth(currentMonthIndex);
            } catch (regenError) {
                appContent.innerHTML = `<p class="error">DB regeneration failed: ${regenError.message}</p>`;
                console.error("Regeneration Error:", regenError);
            }
        }
    }
}

// --- Data Loading and Drawing Logic ---
async function loadAndDrawMonth(monthIndex) {
    console.log(`Attempting to load/draw month index: ${monthIndex}`);
    if (!appContent) { console.error("#app-content is null in loadAndDrawMonth"); return; }
    appContent.innerHTML = `<p>Loading ${monthNames[monthIndex]}...</p>`;

    if (monthlyDaysData[monthIndex]) {
        console.log(`Month ${monthIndex} data already loaded. Drawing...`);
        await dibujarMes(monthIndex);
        return;
    }

    console.log(`Fetching data for month index ${monthIndex} from Firestore...`);
    try {
        const monthNumber = monthIndex + 1;
        const monthStr = monthNumber.toString().padStart(2, '0');
        const daysInTargetMonth = daysInMonth[monthIndex];
        const startDate = `${monthStr}-01`;
        const endDate = `${monthStr}-${daysInTargetMonth.toString().padStart(2, '0')}`;

        const diasRef = collection(db, "Dias");
        const q = query(diasRef,
                        where(documentId(), ">=", startDate),
                        where(documentId(), "<=", endDate));

        const diasSnapshot = await getDocs(q);
        console.log(`Firestore fetch for month ${monthIndex} successful. Received ${diasSnapshot.size} documents.`);

        const fetchedDays = [];
        diasSnapshot.forEach((doc) => {
            if (doc.id.startsWith(monthStr + "-")) {
                 fetchedDays.push({ id: doc.id, ...doc.data() });
            }
        });

        if (fetchedDays.length === 0 && monthIndex === new Date().getMonth()) {
             console.warn(`No data found for the initial month (${monthIndex}). DB might be empty.`);
        }

        fetchedDays.sort((a, b) => a.id.localeCompare(b.id));
        monthlyDaysData[monthIndex] = fetchedDays;
        console.log(`Stored data for month ${monthIndex}.`);
        await dibujarMes(monthIndex);

    } catch (error) {
        console.error(`Error loading data for month ${monthIndex}:`, error);
        if (appContent) {
            appContent.innerHTML = `<p class="error">Error loading data for ${monthNames[monthIndex]}: ${error.message}</p>`;
        }
    }
}

async function dibujarMes(monthIndex) {
    console.log(`Drawing month index: ${monthIndex}`);
    if (!monthNameDisplayEl || !appContent) {
        console.error("Global elements monthNameDisplayEl or appContent are null in dibujarMes!");
        return;
    }

    monthNameDisplayEl.textContent = monthNames[monthIndex];
    const diasDelMes = monthlyDaysData[monthIndex] || [];

    console.log(`Found ${diasDelMes.length} days locally for month ${monthIndex}.`);

    appContent.innerHTML = `
        <h3 id="spotlight-date-header" style="display: none;"></h3>
        <div id="today-memory-spotlight" style="display: none;"></div>
        <div class="calendario-grid" id="grid-dias"></div>
    `;

    const grid = document.getElementById("grid-dias");
    if (!grid) {
        console.error("#grid-dias element not found after setting innerHTML!");
        return;
    }

    if (diasDelMes.length === 0) {
        grid.innerHTML = `<p>No days found for ${monthNames[monthIndex]}.</p>`;
         await updateTodayMemorySpotlight();
        return;
    }

    diasDelMes.forEach(dia => {
        const btn = document.createElement("button");
        btn.className = "dia-btn";
        btn.innerHTML = `<span class="dia-numero">${parseInt(dia.id.substring(3), 10)}</span>`;
        btn.dataset.diaId = dia.id;
        btn.addEventListener('click', () => abrirModalPreview(dia));

        if (dia.hasMemories) {
            btn.classList.add('tiene-memorias');
        }
        grid.appendChild(btn);
    });
    console.log(`Rendered ${diasDelMes.length} day buttons for month ${monthIndex}.`);
    await updateTodayMemorySpotlight();
    console.log(`Finished drawing month ${monthIndex}.`);
}

// --- Configuración (Llamadas una vez al inicio) ---
function configurarNavegacion() {
    console.log("Configuring navigation (once)...");
    try {
        const prevBtn = document.getElementById("prev-month");
        const nextBtn = document.getElementById("next-month");

        if (prevBtn) {
            prevBtn.onclick = () => {
                currentMonthIndex = (currentMonthIndex - 1 + 12) % 12;
                console.log("Prev month clicked, new index:", currentMonthIndex);
                loadAndDrawMonth(currentMonthIndex);
            };
            console.log("Prev month button configured.");
        } else {
            console.error("#prev-month button not found!");
        }

        if (nextBtn) {
            nextBtn.onclick = () => {
                currentMonthIndex = (currentMonthIndex + 1) % 12;
                console.log("Next month clicked, new index:", currentMonthIndex);
                loadAndDrawMonth(currentMonthIndex);
            };
            console.log("Next month button configured.");
        } else {
            console.error("#next-month button not found!");
        }
    } catch (e) {
        console.error("Error configuring navigation:", e);
    }
}

function configurarFooter() {
    console.log("Configuring footer (once)...");
     try {
        const btnHoy = document.getElementById('btn-hoy');
        const btnBuscar = document.getElementById('btn-buscar');
        const btnShuffle = document.getElementById('btn-shuffle');
        const btnAddMemory = document.getElementById('btn-add-memory');

        if (btnHoy) {
            btnHoy.onclick = () => {
                const today = new Date();
                const todayMonth = today.getMonth();
                const todayId = `${(todayMonth + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

                const navigateAndOpen = () => {
                    const monthData = monthlyDaysData[todayMonth];
                    if (monthData) {
                         const todayDia = monthData.find(d => d.id === todayId);
                         if (todayDia) {
                             abrirModalPreview(todayDia);
                             window.scrollTo(0, 0);
                         } else {
                             alert("Error: Could not find data for today within the loaded month.");
                         }
                    } else {
                         // Esto podría pasar si el mes actual aún no se cargó por alguna razón
                         console.warn("Attempted to navigate to today, but month data wasn't loaded. Forcing load.");
                         loadAndDrawMonth(todayMonth).then(() => { // Forzar carga y luego intentar abrir
                            const newlyLoadedMonthData = monthlyDaysData[todayMonth];
                            const todayDiaAfterLoad = newlyLoadedMonthData?.find(d => d.id === todayId);
                            if (todayDiaAfterLoad) {
                                abrirModalPreview(todayDiaAfterLoad);
                                window.scrollTo(0, 0);
                            } else {
                                alert("Error: Still could not find today's data after reloading month.");
                            }
                         });
                    }
                };

                if (currentMonthIndex !== todayMonth) {
                    currentMonthIndex = todayMonth;
                    loadAndDrawMonth(currentMonthIndex).then(navigateAndOpen);
                } else {
                    navigateAndOpen();
                }
            };
            console.log("Today button configured.");
        } else { console.error("#btn-hoy not found!"); }

        if (btnBuscar) {
            btnBuscar.onclick = () => {
                const searchTerm = prompt("Search memories (requires loading all data):");
                if (searchTerm?.trim()) {
                    buscarMemorias(searchTerm.trim().toLowerCase());
                }
            };
             console.log("Search button configured.");
        } else { console.error("#btn-buscar not found!"); }

        if (btnShuffle) {
            btnShuffle.onclick = async () => {
                 console.warn("Shuffle requires loading all data if not present.");
                 await loadAllDataIfNeeded();

                 if (Object.keys(monthlyDaysData).length === 0) { console.log("No data loaded for shuffle."); return; }

                 const allDaysFlat = Object.values(monthlyDaysData).flat();
                 if (allDaysFlat.length > 0) {
                     const randomIndex = Math.floor(Math.random() * allDaysFlat.length);
                     const randomDia = allDaysFlat[randomIndex];
                     const randomMonthIndex = parseInt(randomDia.id.substring(0, 2), 10) - 1;

                     if (currentMonthIndex !== randomMonthIndex) {
                         currentMonthIndex = randomMonthIndex;
                         await dibujarMes(currentMonthIndex);
                         setTimeout(() => abrirModalPreview(randomDia), 50);
                     } else {
                         abrirModalPreview(randomDia);
                     }
                     window.scrollTo(0, 0);
                 } else { console.log("Flattened data array is empty for shuffle.");}
            };
             console.log("Shuffle button configured.");
        } else { console.error("#btn-shuffle not found!"); }

        if (btnAddMemory) {
            btnAddMemory.onclick = () => { abrirModalEdicion(null); };
             console.log("Add Memory button configured.");
        } else { console.error("#btn-add-memory not found!"); }

    } catch (e) {
        console.error("Error configuring footer:", e);
    }
}

// --- Helper para cargar todos los datos ---
async function loadAllDataIfNeeded() {
    const totalMonths = 12;
    const loadedMonthsCount = Object.keys(monthlyDaysData).length;

    if (loadedMonthsCount < totalMonths) {
        console.log(`Need to load ${totalMonths - loadedMonthsCount} remaining months data...`);
        if(appContent) appContent.innerHTML = "<p>Loading all data for search/shuffle...</p>";
        const promises = [];
        for (let i = 0; i < totalMonths; i++) {
            if (!monthlyDaysData[i]) {
                const monthNumber = i + 1;
                const monthStr = monthNumber.toString().padStart(2, '0');
                const daysInTargetMonth = daysInMonth[i];
                const startDate = `${monthStr}-01`;
                const endDate = `${monthStr}-${daysInTargetMonth.toString().padStart(2, '0')}`;
                const diasRef = collection(db, "Dias");
                const q = query(diasRef, where(documentId(), ">=", startDate), where(documentId(), "<=", endDate));
                promises.push(getDocs(q).then(snapshot => {
                    const fetchedDays = [];
                    snapshot.forEach(doc => fetchedDays.push({ id: doc.id, ...doc.data() }));
                    fetchedDays.sort((a, b) => a.id.localeCompare(b.id));
                    monthlyDaysData[i] = fetchedDays;
                    console.log(`Loaded data for month ${i}`);
                }).catch(err => console.error(`Failed to load month ${i}:`, err)));
            }
        }
        try {
            await Promise.all(promises);
            console.log("All month data loaded.");
            // Volver a dibujar el mes actual DESPUÉS de cargar todo
            if(appContent) await dibujarMes(currentMonthIndex);
        } catch (error) {
            console.error("Error loading all data:", error);
            if(appContent) appContent.innerHTML = `<p class="error">Failed to load all necessary data.</p>`;
        }
    } else {
        console.log("All month data is already loaded.");
    }
}

// --- Database Regeneration (Sin cambios) ---
async function generateCleanDatabase() {
    // ... (igual que antes) ...
    if (!appContent) { console.error("Cannot show status: appContent is null."); return; }
    console.log("--- Starting Regeneration ---");
    const diasRef = collection(db, "Dias"); try { console.log("Deleting 'Dias'..."); appContent.innerHTML = "<p>Deleting old data...</p>"; const oldDocsSnapshot = await getDocs(diasRef); if (!oldDocsSnapshot.empty) { let batch = writeBatch(db); let deleteCount = 0; for (const docSnap of oldDocsSnapshot.docs) {
 batch.delete(docSnap.ref); deleteCount++; if (deleteCount >= 400) { console.log(`Committing delete batch (${deleteCount})...`); await batch.commit(); batch = writeBatch(db); deleteCount = 0; } } if (deleteCount > 0) { console.log(`Committing final delete batch (${deleteCount})...`); await batch.commit(); } console.log(`Deletion complete (${oldDocsSnapshot.size}).`); } else { console.log("'Dias' collection was already empty."); } } catch(e) { console.error("Error deleting collection:", e); throw e; }
    console.log("Generating 366 clean days..."); appContent.innerHTML = "<p>Generating 366 clean days...</p>"; let genBatch = writeBatch(db); let ops = 0, created = 0; try { for (let m = 0; m < 12; m++) { const monthNum = m + 1, monthStr = monthNum.toString().padStart(2, '0'); const numDays = daysInMonth[m]; for (let d = 1; d <= numDays; d++) { const dayStr = d.toString().padStart(2, '0'); const diaId = `${monthStr}-${dayStr}`; const diaData = { Nombre_Dia: `${d} ${monthNames[m]}`, Icono: '', Nombre_Especial: "Unnamed Day", hasMemories: false };
 const docRef = doc(db, "Dias", diaId); genBatch.set(docRef, diaData); ops++; created++; if(created % 50 === 0) appContent.innerHTML = `<p>Generating ${created}/366...</p>`; if (ops >= 400) { console.log(`Committing generate batch (${ops})...`); await batch.commit(); genBatch = writeBatch(db); ops = 0; } } } if (ops > 0) { console.log(`Committing final generate batch (${ops})...`); await batch.commit(); } console.log(`--- Regeneration complete: ${created} days created ---`); appContent.innerHTML = `<p class="success">✅ DB regenerated: ${created} days!</p>`; } catch(e) { console.error("Error generating days:", e); throw e; }

}

// --- Spotlight (v10.17 - Rediseñado) ---
async function updateTodayMemorySpotlight() {
    const dateHeader = document.getElementById('spotlight-date-header');
    const spotlightDiv = document.getElementById('today-memory-spotlight');

    if (!spotlightDiv || !dateHeader) {
        console.log("Spotlight elements not found, skipping update.");
        return;
    }

    const today = new Date();
    const todayMonthIndex = today.getMonth();
    const todayId = `${(todayMonthIndex + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

    if (currentMonthIndex !== todayMonthIndex) {
         spotlightDiv.innerHTML = ''; spotlightDiv.style.display = 'none'; dateHeader.style.display = 'none';
         console.log("Not current month, hiding spotlight.");
         return;
    }

    const monthData = monthlyDaysData[currentMonthIndex];
    const todayDay = monthData ? monthData.find(d => d.id === todayId) : null;

    dateHeader.textContent = `Today, ${todayDay ? todayDay.Nombre_Dia : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    dateHeader.style.display = 'block';
    spotlightDiv.style.display = 'block';
    spotlightDiv.innerHTML = `<div class="spotlight-slide">Loading memories...</div>`; // Poner loading aquí
    const slideDiv = spotlightDiv.querySelector('.spotlight-slide');

    if (!todayDay) {
        if(slideDiv) slideDiv.innerHTML = `<p class="no-memory-message">Could not find today's data in loaded month.</p>`;
        return;
    }


    try {
        const todayMemoriesRef = collection(db, "Dias", todayDay.id, "Memorias");
        // Cargar TODAS las memorias, ordenadas
        const q = query(todayMemoriesRef, orderBy("Fecha_Original", "desc"));
        console.log("Querying for ALL today's spotlight memories...");
        const snapshot = await getDocs(q);
        console.log(`Spotlight query returned ${snapshot.size} documents.`);

        if (!slideDiv) return; // Salir si el slideDiv desapareció mientras tanto

        if (!snapshot.empty) {
            slideDiv.innerHTML = ''; // Limpiar "Loading"
            snapshot.docs.forEach(doc => {
                const memoria = doc.data();
                let memoryHTML = '<div class="spotlight-memory-item">';
                let mainContent = ''; let artworkHTML = ''; let icon = '';

                switch (memoria.Tipo) {
                    case 'Lugar': icon = '📍'; mainContent = memoria.LugarNombre || 'Place'; break;
                    case 'Musica': icon = '🎵'; if (memoria.CancionData?.trackName) { mainContent = `<strong>${memoria.CancionData.trackName}</strong> by ${memoria.CancionData.artistName}`; if (memoria.CancionData.artworkUrl60) { artworkHTML = `<img src="${memoria.CancionData.artworkUrl60}" class="spotlight-artwork" alt="Artwork">`; } } else { mainContent = memoria.CancionInfo || 'Music'; } break;
                    case 'Imagen': icon = '🖼️'; mainContent = memoria.Descripcion || 'Image'; if (memoria.ImagenURL) { artworkHTML = `<img src="${memoria.ImagenURL}" class="spotlight-artwork" alt="Memory Image">`; } break;
                    default: icon = '📝'; mainContent = memoria.Descripcion || 'Memory'; break;
                }
                memoryHTML += `<span class="spotlight-memory-icon">${icon}</span>`;
                memoryHTML += `<div class="spotlight-memory-details">${mainContent}</div>`;
                memoryHTML += artworkHTML; memoryHTML += '</div>';
                slideDiv.innerHTML += memoryHTML;
            });
            spotlightDiv.classList.add('has-memory');
        } else {
            slideDiv.innerHTML = `<p class="no-memory-message">Nothing to remember today... yet!</p>`;
            spotlightDiv.classList.remove('has-memory');
        }

        spotlightDiv.onclick = () => abrirModalPreview(todayDay);
        console.log("Spotlight updated successfully with all memories.");

    } catch (error) {
        console.error("Error fetching or displaying spotlight memories:", error);
        if(slideDiv) slideDiv.innerHTML = `<p class="no-memory-message error">Error loading today's memories.</p>`;
    }
}

// --- Búsqueda (Sin cambios funcionales) ---
async function buscarMemorias(term) {
    // ... (igual que v10.16) ...
    console.log("Searching:", term);
    if (!appContent) { console.error("appContent is null in buscarMemorias"); return; }

    appContent.innerHTML = `<p>Loading data for search...</p>`;
    await loadAllDataIfNeeded();
    appContent.innerHTML = `<p>Searching for "${term}" in all data...</p>`;

    let results = [];
    try {
        for (const monthIndex in monthlyDaysData) {
            const monthDays = monthlyDaysData[monthIndex];
            for (const dia of monthDays) {
                 const memSnapshot = await getDocs(collection(db, "Dias", dia.id, "Memorias"));
                 memSnapshot.forEach(memDoc => {
                     const memoria = { diaId: dia.id, diaNombre: dia.Nombre_Dia, id: memDoc.id, ...memDoc.data() };
                     let searchableText = memoria.Descripcion || '';
                     if(memoria.LugarNombre) searchableText += ' ' + memoria.LugarNombre;
                     if(memoria.CancionInfo) searchableText += ' ' + memoria.CancionInfo;
                     if (searchableText.toLowerCase().includes(term)) {
                         results.push(memoria);
                     }
                 });
            }
        }

        if (results.length === 0) { appContent.innerHTML = `<p>No results for "${term}".</p>`; }
        else {
             console.log(`Found ${results.length} memories.`);
             results.sort((a, b) => (b.Fecha_Original?.toDate() ?? 0) - (a.Fecha_Original?.toDate() ?? 0));
             appContent.innerHTML = `<h3>Results for "${term}" (${results.length}):</h3>`;
             const resultsList = document.createElement('div');
             resultsList.id = 'search-results-list';
             results.forEach(mem => {
                 const itemDiv = document.createElement('div'); itemDiv.className = 'memoria-item search-result';
                 let fechaStr = 'Unknown date'; if (mem.Fecha_Original?.toDate) { try { fechaStr = mem.Fecha_Original.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); } catch(e) {} }
                 let contentHTML = `<small><b>${mem.diaNombre} (${mem.diaId})</b> - ${fechaStr}</small>`;
                 let icon = '';
                 switch (mem.Tipo) {
                     case 'Lugar': icon = '📍 '; contentHTML += `${icon}${mem.LugarNombre || 'Place'}`; break;
                     case 'Musica': icon = '🎵 '; if (mem.CancionData?.trackName) contentHTML += `${icon}<strong>${mem.CancionData.trackName}</strong> by ${mem.CancionData.artistName}`; else contentHTML += `${icon}${mem.CancionInfo || 'Music'}`; break;
                     case 'Imagen': icon = '🖼️ '; contentHTML += `${icon}Image`; if (mem.ImagenURL) contentHTML += ` (<a href="${mem.ImagenURL}" target="_blank">View</a>)`; if (mem.Descripcion) contentHTML += `<br>${mem.Descripcion}`; break;
                     default: icon = '📝 '; contentHTML += `${icon}${mem.Descripcion || 'Memory'}`; break;
                 }
                 itemDiv.innerHTML = `<div class="memoria-item-content">${contentHTML}</div>`; itemDiv.style.cursor = 'pointer';
                 itemDiv.onclick = () => {
                     const monthIndexOnClick = parseInt(mem.diaId.substring(0, 2), 10) - 1;
                     if (currentMonthIndex !== monthIndexOnClick) {
                         currentMonthIndex = monthIndexOnClick;
                         dibujarMes(currentMonthIndex).then(() => {
                             const targetDia = monthlyDaysData[currentMonthIndex]?.find(d => d.id === mem.diaId);
                             if(targetDia) setTimeout(() => abrirModalPreview(targetDia), 50);
                             window.scrollTo(0, 0);
                         });
                     } else {
                         const targetDia = monthlyDaysData[currentMonthIndex]?.find(d => d.id === mem.diaId);
                         if(targetDia) abrirModalPreview(targetDia);
                         window.scrollTo(0, 0);
                     }
                 };
                 resultsList.appendChild(itemDiv);
             });
             appContent.appendChild(resultsList);
        }
    } catch (e) {
        if (appContent) appContent.innerHTML = `<p class="error">Search error: ${e.message}</p>`;
        console.error("Search Error:", e);
    }
}


// --- Modales y CRUD (Sin cambios funcionales mayores respecto a v10.16) ---
// ... (Copiar funciones restantes desde v10.16) ...
async function abrirModalPreview(dia) {
    console.log("Opening preview for:", dia.id);
    let modal = document.getElementById('preview-modal');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'preview-modal';
        modal.className = 'modal-preview';
        modal.innerHTML = ` <div class="modal-preview-content"> <div class="modal-preview-header"> <h3 id="preview-title"></h3> <button id="edit-from-preview-btn" title="Edit this day">${pencilIconSVG}</button> </div> <div class="modal-preview-memorias"> <h4>Memories:</h4> <div id="preview-memorias-list">Loading...</div> </div> <button id="close-preview-btn" class="aqua-button">Close</button> </div>`;
        document.body.appendChild(modal);

        const closeBtn = document.getElementById('close-preview-btn');
        if (closeBtn) {
            closeBtn.onclick = () => cerrarModalPreview();
        }
        modal.onclick = (e) => { if (e.target.id === 'preview-modal') cerrarModalPreview(); };
    }

    const editBtn = document.getElementById('edit-from-preview-btn');
    if (editBtn) {
        const diaToEdit = dia;
        const newEditBtn = editBtn.cloneNode(true);
        if (editBtn.parentNode) {
           editBtn.parentNode.replaceChild(newEditBtn, editBtn);
        } else {
           console.error("Parent node of edit button not found");
        }

        newEditBtn.addEventListener('click', () => {
             console.log("Preview edit button clicked for:", diaToEdit.id);
             cerrarModalPreview();
             const currentMonthDays = monthlyDaysData[currentMonthIndex];
             const fullDiaObject = currentMonthDays ? currentMonthDays.find(d => d.id === diaToEdit.id) : diaToEdit;
             setTimeout(() => abrirModalEdicion(fullDiaObject || diaToEdit), 250);
        });
    } else {
        console.error("Edit button not found in preview modal.");
    }

    const previewTitle = document.getElementById('preview-title');
    if (previewTitle) {
      previewTitle.textContent = `${dia.Nombre_Dia} ${dia.Nombre_Especial !== 'Unnamed Day' ? '('+dia.Nombre_Especial+')' : ''}`;
    } else {
        console.error("#preview-title not found!");
    }
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);
    await cargarYMostrarMemorias(dia.id, 'preview-memorias-list');
}

function cerrarModalPreview() { const modal = document.getElementById('preview-modal'); if (modal) { modal.classList.remove('visible'); setTimeout(() => { modal.style.display = 'none'; }, 200); } }

async function abrirModalEdicion(dia) {
    const isAdding = !dia;
    console.log(isAdding ? "Opening unified modal: ADD mode" : `Opening unified modal: EDIT mode for ${dia?.id}`);

     let targetDay;
     if (isAdding) {
         const today = new Date();
         const todayMonthIdx = today.getMonth();
         const todayId = `${(todayMonthIdx + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
         const currentMonthDays = monthlyDaysData[todayMonthIdx];
         targetDay = currentMonthDays ? currentMonthDays.find(d => d.id === todayId) : null;
         if (!targetDay && monthlyDaysData[currentMonthIndex]) {
              targetDay = monthlyDaysData[currentMonthIndex] ? monthlyDaysData[currentMonthIndex][0] : null;
         }
         if (!targetDay) {
              console.error("No day data available to default to for Add mode."); alert("Error: Calendar data not loaded. Cannot add memory."); return;
         }
         console.log("Defaulting Add mode to day:", targetDay.id);
     } else {
         targetDay = dia;
     }
     currentlyOpenDay = targetDay;
     if (!currentlyOpenDay?.id) { console.error("Invalid day data for modal:", currentlyOpenDay); alert("Error loading day data."); return; }

    let modal = document.getElementById('edit-add-modal');
    if (!modal) {
        modal = document.createElement('div'); modal.id = 'edit-add-modal'; modal.className = 'modal-edit';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-content-scrollable"> <div class="modal-section" id="day-selection-section" style="display: none;">
                         <h3>Add Memory To...</h3>
                         <label for="edit-mem-day">Day (MM-DD):</label>
                         <select id="edit-mem-day"></select>
                         <label for="edit-mem-year">Year of Memory:</label>
                         <input type="number" id="edit-mem-year" placeholder="YYYY" min="1800" max="${new Date().getFullYear() + 1}" required>
                    </div>
                    <div class="modal-section" id="day-name-section" style="display: none;">
                        <h3 id="edit-modal-title"></h3>
                        <label for="nombre-especial-input">Name this day:</label>
                        <input type="text" id="nombre-especial-input" placeholder="e.g., Pizza Day" maxlength="25">
                        <button id="save-name-btn" class="aqua-button">Save Day Name</button>
                        <p id="save-status"></p>
                    </div>
                    <div class="modal-section memorias-section">
                        <h4>Memories</h4>
                        <div id="edit-memorias-list">Loading...</div>
                        <form id="memory-form">
                             <p class="section-description" id="memory-form-title">Add/Edit Memory</p> <label for="memoria-fecha">Original Date:</label>
                             <input type="date" id="memoria-fecha" required>
                             <label for="memoria-type">Type:</label>
                             <select id="memoria-type"> <option value="Texto">Description</option> <option value="Lugar">Place</option> <option value="Musica">Music</option> <option value="Imagen">Image</option> </select>
                             <div class="add-memory-input-group" id="input-type-Texto"><label for="memoria-desc">Description:</label><textarea id="memoria-desc" placeholder="Write memory..."></textarea></div>
                             <div class="add-memory-input-group" id="input-type-Lugar">
                                <label for="memoria-place-search">Search:</label><input type="text" id="memoria-place-search">
                                <button type="button" class="aqua-button" id="btn-search-place">Search</button>
                                <div id="place-results"></div>
                                <div id="leaflet-map"></div>
                             </div>
                             <div class="add-memory-input-group" id="input-type-Musica"><label for="memoria-music-search">Search:</label><input type="text" id="memoria-music-search"><button type="button" class="aqua-button" id="btn-search-itunes">Search</button><div id="itunes-results"></div></div>
                             <div class="add-memory-input-group" id="input-type-Imagen"><label for="memoria-image-upload">Image:</label><input type="file" id="memoria-image-upload" accept="image/*"><label for="memoria-image-desc">Desc:</label><input type="text" id="memoria-image-desc"><div id="image-upload-status"></div></div>
                             <button type="submit" id="save-memoria-btn" class="aqua-button">Add Memory</button> <p id="memoria-status"></p>
                        </form>
                    </div>
                    <div id="confirm-delete-dialog" style="display: none;"> <p id="confirm-delete-text"></p> <button id="confirm-delete-no" class="aqua-button">Cancel</button> <button id="confirm-delete-yes" class="aqua-button delete-confirm">Delete</button> </div>
                 </div> <div class="modal-main-buttons"> <button id="close-edit-add-btn">Close</button> </div>
            </div>`;
        document.body.appendChild(modal);
        const daySelectElement = document.getElementById('edit-mem-day');
        if (daySelectElement && daySelectElement.options.length === 0) {
            Object.values(monthlyDaysData).flat().sort((a,b)=> a.id.localeCompare(b.id)).forEach(d => {
                const o=document.createElement('option'); o.value=d.id; o.textContent=d.Nombre_Dia; daySelectElement.appendChild(o);
            });
            if (daySelectElement.options.length === 0 && currentlyOpenDay) {
                 const o=document.createElement('option'); o.value=currentlyOpenDay.id; o.textContent=currentlyOpenDay.Nombre_Dia; daySelectElement.appendChild(o);
            }
        }
        document.getElementById('close-edit-add-btn').onclick = () => cerrarModalEdicion();
        modal.onclick = (e) => { if (e.target.id === 'edit-add-modal') cerrarModalEdicion(); };
        document.getElementById('confirm-delete-no').onclick = () => { const d = document.getElementById('confirm-delete-dialog'); if(d) d.style.display = 'none'; };
        document.getElementById('memoria-type').addEventListener('change', handleMemoryTypeChangeUnified);
        document.getElementById('btn-search-itunes').onclick = buscarBSOUnified;
        document.getElementById('btn-search-place').onclick = buscarLugarUnified;
        const fileInput = document.getElementById('memoria-image-upload'); const imageStatus = document.getElementById('image-upload-status'); if(fileInput && imageStatus) fileInput.onchange = (e) => imageStatus.textContent = e.target.files?.[0] ? `Selected: ${e.target.files[0].name}` : 'No file selected';
        document.getElementById('memory-form').onsubmit = handleMemoryFormSubmit;
        document.getElementById('save-name-btn').onclick = () => { if(currentlyOpenDay) guardarNombreEspecial(currentlyOpenDay.id, document.getElementById('nombre-especial-input').value.trim()); };
    }

    const daySelectionSection = document.getElementById('day-selection-section');
    const dayNameSection = document.getElementById('day-name-section');
    const daySelect = document.getElementById('edit-mem-day');
    const yearInput = document.getElementById('edit-mem-year');
    const titleEl = document.getElementById('edit-modal-title');
    const nameInput = document.getElementById('nombre-especial-input');
    const memoriesList = document.getElementById('edit-memorias-list');
    const formTitle = document.getElementById('memory-form-title');

    if (isAdding) {
        if(daySelectionSection) daySelectionSection.style.display = 'block';
        if(dayNameSection) dayNameSection.style.display = 'none';
        if (daySelect && currentlyOpenDay) daySelect.value = currentlyOpenDay.id;
        if(yearInput) yearInput.value = new Date().getFullYear();
        if (formTitle) formTitle.textContent = "Add New Memory";
        if (memoriesList) memoriesList.innerHTML = '<p class="list-placeholder">Add memories below.</p>';
        currentMemories = [];
    } else {
        if(daySelectionSection) daySelectionSection.style.display = 'none';
        if(dayNameSection) dayNameSection.style.display = 'block';
        if (titleEl) titleEl.textContent = `Editing: ${currentlyOpenDay.Nombre_Dia} (${currentlyOpenDay.id})`;
        if (nameInput) nameInput.value = currentlyOpenDay.Nombre_Especial === 'Unnamed Day' ? '' : currentlyOpenDay.Nombre_Especial;
        if (formTitle) formTitle.textContent = "Add/Edit Memories";
        await cargarYMostrarMemorias(currentlyOpenDay.id, 'edit-memorias-list');
    }
    resetMemoryFormUnified(); handleMemoryTypeChangeUnified();
    const saveStatus = document.getElementById('save-status');
    const memoriaStatus = document.getElementById('memoria-status');
    if (saveStatus) saveStatus.textContent = '';
    if (memoriaStatus) memoriaStatus.textContent = '';
    const confirmDialog = document.getElementById('confirm-delete-dialog'); if(confirmDialog) confirmDialog.style.display = 'none';
    modal.style.display = 'flex'; setTimeout(() => modal.classList.add('visible'), 10);
    if (document.getElementById('leaflet-map')) { initMapIfNeeded(); }
}

function cerrarModalEdicion() {
    // ... (igual que antes) ...
    const modal = document.getElementById('edit-add-modal'); if (modal) { modal.classList.remove('visible'); setTimeout(() => { modal.style.display = 'none'; }, 200); }
    currentlyOpenDay = null; editingMemoryId = null; selectedPlace = null; selectedMusicTrack = null; if (mapMarker) { mapMarker.remove(); mapMarker = null; }
}

async function cargarYMostrarMemorias(diaId, targetDivId) {
    // ... (igual que antes) ...
    const memoriasListDiv = document.getElementById(targetDivId); if (!memoriasListDiv) return;
    memoriasListDiv.innerHTML = 'Loading...'; if (targetDivId === 'edit-memorias-list') currentMemories = [];
    try {
        const memoriasRef = collection(db, "Dias", diaId, "Memorias"); const q = query(memoriasRef, orderBy("Fecha_Original", "desc")); const querySnapshot = await getDocs(q); if (querySnapshot.empty) { memoriasListDiv.innerHTML = '<p class="list-placeholder">No memories yet.</p>'; return; } memoriasListDiv.innerHTML = ''; const fragment = document.createDocumentFragment();
        querySnapshot.forEach((docSnap) => { const memoria = { id: docSnap.id, ...docSnap.data() }; if (targetDivId === 'edit-memorias-list') currentMemories.push(memoria); const itemDiv = document.createElement('div'); itemDiv.className = 'memoria-item'; let fechaStr = 'Unknown date'; if (memoria.Fecha_Original?.toDate) { try { fechaStr = memoria.Fecha_Original.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); } catch(e) { /* fallback */ } } let contentHTML = `<small>${fechaStr}</small>`; let artworkHTML = ''; switch (memoria.Tipo) { case 'Lugar': contentHTML += `📍 ${memoria.LugarNombre || 'Place'}`; break; case 'Musica': if (memoria.CancionData?.trackName) { contentHTML += `🎵 <strong>${memoria.CancionData.trackName}</strong> by ${memoria.CancionData.artistName}`; if(memoria.CancionData.artworkUrl60) artworkHTML = `<img src="${memoria.CancionData.artworkUrl60}" class="memoria-artwork">`; } else { contentHTML += `🎵 ${memoria.CancionInfo || 'Music'}`; } break; case 'Imagen': contentHTML += `🖼️ Image`; if (memoria.ImagenURL) contentHTML += ` (<a href="${memoria.ImagenURL}" target="_blank">View</a>)`; if (memoria.Descripcion) contentHTML += `<br>${memoria.Descripcion}`; break; default: contentHTML += `📝 ${memoria.Descripcion || 'Memory'}`; break; } const actionsHTML = (targetDivId === 'edit-memorias-list') ? ` <div class="memoria-actions"> <button class="edit-btn" title="Edit" data-memoria-id="${memoria.id}">${editIconSVG}</button> <button class="delete-btn" title="Delete" data-memoria-id="${memoria.id}">${deleteIconSVG}</button> </div>` : ''; itemDiv.innerHTML = `${artworkHTML}<div class="memoria-item-content">${contentHTML}</div>${actionsHTML}`; fragment.appendChild(itemDiv); });
        memoriasListDiv.appendChild(fragment);
        if (targetDivId === 'edit-memorias-list') { attachMemoryActionListeners(diaId); }
        console.log(`Loaded ${querySnapshot.size} memories for ${diaId} into ${targetDivId}`);
    } catch (e) { console.error(`Error loading memories ${diaId}:`, e); memoriasListDiv.innerHTML = '<p class="error">Error loading memories.</p>'; }
}

function attachMemoryActionListeners(diaId) {
    // ... (igual que antes) ...
    const listDiv = document.getElementById('edit-memorias-list');
    if (!listDiv) return;
    listDiv.replaceWith(listDiv.cloneNode(true));
    const newListDiv = document.getElementById('edit-memorias-list');
    newListDiv.addEventListener('click', (event) => {
        const editButton = event.target.closest('.edit-btn');
        const deleteButton = event.target.closest('.delete-btn');
        if (editButton) {
            const memId = editButton.getAttribute('data-memoria-id'); const memToEdit = currentMemories.find(m => m.id === memId); if (memToEdit) { console.log("Edit button clicked for:", memId); startEditMemoriaUnified(memToEdit); } else { console.error("Memory not found for edit:", memId, currentMemories); }
        } else if (deleteButton) {
            const memId = deleteButton.getAttribute('data-memoria-id'); const memToDelete = currentMemories.find(m => m.id === memId); if(memToDelete) { console.log("Delete button clicked for:", memId); const displayInfo = memToDelete.Descripcion || memToDelete.LugarNombre || memToDelete.CancionInfo || "this memory"; confirmDeleteMemoriaUnified(diaId, memToDelete.id, displayInfo); } else { console.error("Memory not found for delete:", memId, currentMemories); }
        }
    });
    console.log("Attached memory action listeners to:", listDiv.id);
}

function initMapIfNeeded() {
    // ... (igual que antes) ...
    const mapDiv = document.getElementById('leaflet-map'); if (!mapDiv) return; if (!map) { try { console.log("Initializing Leaflet map..."); map = L.map('leaflet-map').setView([40.41, -3.70], 5); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map); } catch(e) { console.error("Leaflet init error:", e); } } else { setTimeout(() => { try { map.invalidateSize(); } catch(e) { console.error("Map invalidateSize error:", e); } }, 10); }
}

// --- DEFINICIÓN DE handleMemoryTypeChangeUnified ---
function handleMemoryTypeChangeUnified() {
    console.log("handleMemoryTypeChangeUnified called"); // Log para confirmar llamada
    const t=document.getElementById('memoria-type')?.value;
    if (!t) { console.error("memoria-type select not found"); return; }
    ['Texto','Lugar','Musica','Imagen'].forEach(id=>{
        const d=document.getElementById(`input-type-${id}`);
        if(d)d.style.display='none'
        else console.warn(`#input-type-${id} not found`);
    });
    const dS=document.getElementById(`input-type-${t}`);
    if(dS)dS.style.display='block';
    else console.error(`#input-type-${t} not found`);

    const mapDiv = document.getElementById('leaflet-map');
    if(t === 'Lugar') {
        if (mapDiv) mapDiv.style.display = 'block';
        initMapIfNeeded();
    } else {
        if (mapDiv) mapDiv.style.display = 'none';
    }
    if(t!=='Musica'){const r=document.getElementById('itunes-results');if(r)r.innerHTML='';selectedMusicTrack=null;}
    if(t!=='Lugar'){const r=document.getElementById('place-results');if(r)r.innerHTML='';selectedPlace=null;}
    if(t!=='Imagen'){const f=document.getElementById('memoria-image-upload');if(f)f.value=null; const i=document.getElementById('image-upload-status');if(i)i.textContent='';}
}
// ---------------------------------------------

async function buscarBSOUnified() {
    // ... (igual que antes) ...
    const i=document.getElementById('memoria-music-search'),r=document.getElementById('itunes-results'),s=document.getElementById('memoria-status'),q=i?.value.trim(); if (!i || !r || !s) return; if(!q){r.innerHTML='<p class="error">Enter term.</p>';return;} r.innerHTML='<p>Searching...</p>';s.textContent='';selectedMusicTrack=null; const p='https://api.allorigins.win/raw?url=', u=`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=5`,f=p+encodeURIComponent(u); try{ const e=await fetch(f); if(!e.ok)throw new Error(`HTTP ${e.status}`); const d=await e.json(); if(!d.results||d.resultCount===0){r.innerHTML='<p>No results.</p>';return;} r.innerHTML=''; d.results.forEach(t=>{const v=document.createElement('div'); v.className='itunes-track'; const a=t.artworkUrl100||t.artworkUrl60||''; v.innerHTML=` <img src="${a}" class="itunes-artwork" style="${a?'':'display:none;'}" onerror="this.style.display='none';"><div class="itunes-track-info"><div class="itunes-track-name">${t.trackName||'?'}</div><div class="itunes-track-artist">${t.artistName||'?'}</div></div><div class="itunes-track-select">➔</div>`; v.onclick=()=>{selectedMusicTrack=t;i.value=`${t.trackName} - ${t.artistName}`;r.innerHTML=`<div class="itunes-track selected"><img src="${a}" class="itunes-artwork" style="${a?'':'display:none;'}">... <span style="color:green;">✓</span></div>`;console.log("Selected:",selectedMusicTrack);}; r.appendChild(v);}); }catch(e){ console.error('iTunes Error:',e); r.innerHTML=`<p class="error">Search error: ${e.message}</p>`; }
}
async function buscarLugarUnified() {
    // ... (igual que antes) ...
    const i=document.getElementById('memoria-place-search'),r=document.getElementById('place-results'),s=document.getElementById('memoria-status'),q=i?.value.trim(); if (!i || !r || !s) return; if(!q){r.innerHTML='<p class="error">Enter place.</p>';return;} r.innerHTML='<p>Searching...</p>';s.textContent='';selectedPlace=null; const n=`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`; try{const e=await fetch(n,{headers:{'Accept':'application/json'}}); if(!e.ok)throw new Error(`HTTP ${e.status}`); const d=await e.json(); if(!d||d.length===0){r.innerHTML='<p>No results.</p>';return;} r.innerHTML=''; d.forEach(p=>{const v=document.createElement('div'); v.className='place-result'; v.innerHTML=`${p.display_name}`; v.onclick=()=>{selectedPlace={name:p.display_name,lat:p.lat,lon:p.lon,osm_id:p.osm_id,osm_type:p.osm_type};i.value=p.display_name;r.innerHTML=`<p class="success">Selected: ${p.display_name}</p>`;console.log("Selected:",selectedPlace); if (map) { const latLon = [p.lat, p.lon]; map.setView(latLon, 13); if (mapMarker) { mapMarker.setLatLng(latLon); } else { mapMarker = L.marker(latLon).addTo(map); } } }; r.appendChild(v);}); }catch(e){console.error('Nominatim Error:',e);r.innerHTML=`<p class="error">Search error: ${e.message}</p>`;}
}

function startEditMemoriaUnified(memoria) {
    // ... (igual que antes) ...
    editingMemoryId = memoria.id; const typeSelect = document.getElementById('memoria-type'); const fechaInput = document.getElementById('memoria-fecha'); const descTextarea = document.getElementById('memoria-desc'); const placeInput = document.getElementById('memoria-place-search'); const musicInput = document.getElementById('memoria-music-search'); const imageDescInput = document.getElementById('memoria-image-desc'); const imageFileInput = document.getElementById('memoria-image-upload'); const imageStatus = document.getElementById('image-upload-status'); const saveButton = document.getElementById('save-memoria-btn'); const placeResults = document.getElementById('place-results'); const itunesResults = document.getElementById('itunes-results'); if (!typeSelect || !fechaInput || !descTextarea || !placeInput || !musicInput || !imageDescInput || !imageFileInput || !imageStatus || !saveButton || !placeResults || !itunesResults) { console.error("One or more form elements missing in startEditMemoriaUnified"); return; } typeSelect.value = memoria.Tipo || 'Texto'; handleMemoryTypeChangeUnified(); if (memoria.Fecha_Original?.toDate) { try { fechaInput.value = memoria.Fecha_Original.toDate().toISOString().split('T')[0]; } catch(e){ fechaInput.value = ''; } } else { fechaInput.value = ''; } selectedPlace = null; selectedMusicTrack = null; placeResults.innerHTML = ''; itunesResults.innerHTML = ''; imageStatus.textContent = ''; imageFileInput.value = null; if (mapMarker) { mapMarker.remove(); mapMarker = null; } switch (memoria.Tipo) { case 'Lugar': placeInput.value = memoria.LugarNombre || ''; descTextarea.value = ''; musicInput.value = ''; imageDescInput.value = ''; selectedPlace = memoria.LugarData ? { name: memoria.LugarNombre, ...memoria.LugarData } : null; if (map && selectedPlace && selectedPlace.lat && selectedPlace.lon) { const latLon = [selectedPlace.lat, selectedPlace.lon]; map.setView(latLon, 13); mapMarker = L.marker(latLon).addTo(map); } break; case 'Musica': musicInput.value = memoria.CancionInfo || ''; descTextarea.value = ''; placeInput.value = ''; imageDescInput.value = ''; selectedMusicTrack = memoria.CancionData || null; break; case 'Imagen': imageDescInput.value = memoria.Descripcion || ''; descTextarea.value = ''; placeInput.value = ''; musicInput.value = ''; imageStatus.textContent = memoria.ImagenURL ? `Current image saved.` : 'No image file selected.'; break; default: descTextarea.value = memoria.Descripcion || ''; placeInput.value = ''; musicInput.value = ''; imageDescInput.value = ''; break; } saveButton.textContent = 'Update Memory'; saveButton.classList.add('update-mode'); if (memoria.Tipo === 'Texto' || memoria.Tipo === 'Imagen') descTextarea.focus(); else if (memoria.Tipo === 'Lugar') placeInput.focus(); else if (memoria.Tipo === 'Musica') musicInput.focus();
}

async function handleMemoryFormSubmit(event) {
    // ... (igual que antes) ...
    event.preventDefault(); const statusDiv = document.getElementById('memoria-status'); if (!statusDiv) return; statusDiv.className = ''; statusDiv.textContent = editingMemoryId ? 'Updating...' : 'Saving...'; let diaId; const daySelect = document.getElementById('edit-mem-day'); const yearInput = document.getElementById('edit-mem-year'); const daySelectionVisible = document.getElementById('day-selection-section')?.style.display !== 'none'; if (daySelectionVisible && daySelect?.value) { diaId = daySelect.value; } else if (currentlyOpenDay) { diaId = currentlyOpenDay.id; } else { statusDiv.textContent = 'Error: No day selected.'; statusDiv.className = 'error'; return; } const typeSelect = document.getElementById('memoria-type'); const fechaInput = document.getElementById('memoria-fecha'); if (!typeSelect || !fechaInput) return; const type = typeSelect.value; const fechaStr = fechaInput.value; if (!diaId || !fechaStr) { statusDiv.textContent = 'Day and original date are required.'; statusDiv.className = 'error'; return; } if (daySelectionVisible && yearInput) { const year = parseInt(yearInput.value, 10); if (!year || isNaN(year) || year < 1800 || year > new Date().getFullYear() + 1) { statusDiv.textContent = 'A valid year for the day is required.'; statusDiv.className = 'error'; return; } } let dateOfMemory; try { const dateParts = fechaStr.split('-'); dateOfMemory = new Date(Date.UTC(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))); if (isNaN(dateOfMemory.getTime())) throw new Error(); } catch(e) { statusDiv.textContent = 'Invalid date.'; statusDiv.className = 'error'; return; } const fechaOriginalTimestamp = Timestamp.fromDate(dateOfMemory); let memoryData = { Fecha_Original: fechaOriginalTimestamp, Tipo: type }; let isValid = true; let imageFileToUpload = null; const descTextarea = document.getElementById('memoria-desc'); const placeSearchInput = document.getElementById('memoria-place-search'); const musicSearchInput = document.getElementById('memoria-music-search'); const fileUploadInput = document.getElementById('memoria-image-upload'); const imageDescInput = document.getElementById('memoria-image-desc'); switch (type) { case 'Texto': if (!descTextarea) return; memoryData.Descripcion = descTextarea.value.trim(); if (!memoryData.Descripcion) isValid = false; break; case 'Lugar': if (!placeSearchInput) return; if (selectedPlace) { memoryData.LugarNombre = selectedPlace.name; memoryData.LugarData = { lat: selectedPlace.lat, lon: selectedPlace.lon, osm_id: selectedPlace.osm_id, osm_type: selectedPlace.osm_type }; } else { memoryData.LugarNombre = placeSearchInput.value.trim(); if (!memoryData.LugarNombre) isValid = false; memoryData.LugarData = null; } break; case 'Musica': if (!musicSearchInput) return; if (selectedMusicTrack) { memoryData.CancionData = { trackId: selectedMusicTrack.trackId, artistName: selectedMusicTrack.artistName, trackName: selectedMusicTrack.trackName, artworkUrl60: selectedMusicTrack.artworkUrl60, trackViewUrl: selectedMusicTrack.trackViewUrl }; memoryData.CancionInfo = `${selectedMusicTrack.trackName} - ${selectedMusicTrack.artistName}`; } else { memoryData.CancionInfo = musicSearchInput.value.trim(); if (!memoryData.CancionInfo) isValid = false; memoryData.CancionData = null; } break; case 'Imagen': if (!fileUploadInput || !imageDescInput) return; memoryData.Descripcion = imageDescInput.value.trim() || null; if (fileUploadInput.files && fileUploadInput.files[0]) { imageFileToUpload = fileUploadInput.files[0]; } else if (editingMemoryId) { const existingMem = currentMemories.find(m => m.id === editingMemoryId); if (existingMem?.ImagenURL) { memoryData.ImagenURL = existingMem.ImagenURL; } else { isValid = false; } } else { isValid = false; } break; default: isValid = false; break; } if (!isValid) { statusDiv.textContent = 'Fill required fields or select a file.'; statusDiv.className = 'error'; return; } try { if (imageFileToUpload) { statusDiv.textContent = 'Uploading image...'; const filePath = `images/${diaId}/${Date.now()}-${imageFileToUpload.name}`; const storageRef = ref(storage, filePath); const uploadTask = await uploadBytes(storageRef, imageFileToUpload); const downloadURL = await getDownloadURL(uploadTask.ref); memoryData.ImagenURL = downloadURL; statusDiv.textContent = 'Image uploaded!'; } const memoriasRef = collection(db, "Dias", diaId, "Memorias"); if (editingMemoryId) { statusDiv.textContent = 'Updating...'; const memRef = doc(db, "Dias", diaId, "Memorias", editingMemoryId); await updateDoc(memRef, memoryData); statusDiv.textContent = 'Updated!'; statusDiv.className = 'success'; } else { statusDiv.textContent = 'Saving...'; memoryData.Creado_En = Timestamp.now(); await addDoc(memoriasRef, memoryData); statusDiv.textContent = 'Saved!'; statusDiv.className = 'success'; } const diaRef = doc(db, "Dias", diaId); await updateDoc(diaRef, { hasMemories: true }); const diaMonthIndex = parseInt(diaId.substring(0, 2), 10) - 1; if (monthlyDaysData[diaMonthIndex]) { const dayIndexInMonth = monthlyDaysData[diaMonthIndex].findIndex(d => d.id === diaId); if (dayIndexInMonth !== -1) { monthlyDaysData[diaMonthIndex][dayIndexInMonth].hasMemories = true; } } await dibujarMes(diaMonthIndex); resetMemoryFormUnified(); await cargarYMostrarMemorias(diaId, 'edit-memorias-list'); setTimeout(() => { if (statusDiv) statusDiv.textContent = '' }, 2000); const previewList = document.getElementById('preview-memorias-list'); const previewModal = document.getElementById('preview-modal'); const currentlyOpenDayId = document.querySelector('#preview-modal.visible') ? document.querySelector('#preview-title')?.textContent.match(/\((\d{2}-\d{2})\)/)?.[1] : null; if(previewList && currentlyOpenDayId === diaId && previewModal?.style.display === 'flex') { await cargarYMostrarMemorias(diaId, 'preview-memorias-list'); } await updateTodayMemorySpotlight(); } catch (e) { console.error("Save/Update Error:", e); statusDiv.textContent = `Error: ${e.message}`; statusDiv.className = 'error'; }
}

function confirmDeleteMemoriaUnified(diaId, memoriaId, displayInfo) {
    // ... (igual que antes) ...
    const d=document.getElementById('confirm-delete-dialog'),y=document.getElementById('confirm-delete-yes'),t=document.getElementById('confirm-delete-text'); if (!d || !y || !t) return; const p=displayInfo?(displayInfo.length>50?displayInfo.substring(0,47)+'...':displayInfo):'this memory'; t.textContent=`Delete "${p}"?`; d.style.display='block'; const m=document.querySelector('#edit-add-modal .modal-content'); if(m&&!m.contains(d)) m.appendChild(d); y.onclick=null; y.onclick=async()=>{d.style.display='none';await deleteMemoriaUnified(diaId,memoriaId);};
}

async function deleteMemoriaUnified(diaId, memoriaId) {
    // ... (igual que antes) ...
    const s=document.getElementById('memoria-status'); if (!s) return; s.textContent='Deleting...'; s.className=''; try{ const r=doc(db,"Dias",diaId,"Memorias",memoriaId); await deleteDoc(r); const memoriasRef = collection(db, "Dias", diaId, "Memorias"); const snapshot = await getDocs(memoriasRef); let hasRemainingMemories = !snapshot.empty; const diaRef = doc(db, "Dias", diaId); await updateDoc(diaRef, { hasMemories: hasRemainingMemories }); const diaMonthIndex = parseInt(diaId.substring(0, 2), 10) - 1; if (monthlyDaysData[diaMonthIndex]) { const dayIndexInMonth = monthlyDaysData[diaMonthIndex].findIndex(d => d.id === diaId); if (dayIndexInMonth !== -1) { monthlyDaysData[diaMonthIndex][dayIndexInMonth].hasMemories = hasRemainingMemories; } } await dibujarMes(diaMonthIndex); s.textContent='Deleted!'; s.className='success'; currentMemories=currentMemories.filter(m=>m.id!==memoriaId); await cargarYMostrarMemorias(diaId,'edit-memorias-list'); setTimeout(()=>{ if (s) s.textContent='' },2000); const pL=document.getElementById('preview-memorias-list'),pM=document.getElementById('preview-modal'); const currentlyOpenDayId = document.querySelector('#preview-modal.visible') ? document.querySelector('#preview-title')?.textContent.match(/\((\d{2}-\d{2})\)/)?.[1] : null; if(pL && currentlyOpenDayId === diaId && pM?.style.display==='flex'){ await cargarYMostrarMemorias(diaId,'preview-memorias-list'); } await updateTodayMemorySpotlight(); } catch(e){ console.error("Delete Error:",e); s.textContent=`Error: ${e.message}`; s.className='error'; }
}
function resetMemoryFormUnified() {
    // ... (igual que antes) ...
    editingMemoryId=null; const f=document.getElementById('memory-form'); if(f){ f.reset(); const b=document.getElementById('save-memoria-btn'); if(b){b.textContent='Add Memory';b.classList.remove('update-mode');} const s=document.getElementById('memoria-status'); if(s)s.textContent=''; const itunesResults = document.getElementById('itunes-results'); const placeResults = document.getElementById('place-results'); const imageStatus = document.getElementById('image-upload-status'); if(itunesResults) itunesResults.innerHTML=''; if(placeResults) placeResults.innerHTML=''; if(imageStatus) imageStatus.textContent=''; selectedPlace=null; selectedMusicTrack=null; if (mapMarker) { mapMarker.remove(); mapMarker = null; } if (map) { map.setView([40.41, -3.70], 5); } handleMemoryTypeChangeUnified(); }
}

async function guardarNombreEspecial(diaId, nuevoNombre) {
    // ... (igual que antes) ...
    const s=document.getElementById('save-status'); if (!s) return; try{ s.textContent="Saving..."; s.className=''; const r=doc(db,"Dias",diaId); const v=nuevoNombre||"Unnamed Day"; await updateDoc(r,{Nombre_Especial:v}); const diaMonthIndex = parseInt(diaId.substring(0, 2), 10) - 1; if (monthlyDaysData[diaMonthIndex]) { const dayIndexInMonth = monthlyDaysData[diaMonthIndex].findIndex(d => d.id === diaId); if (dayIndexInMonth !== -1) { monthlyDaysData[diaMonthIndex][dayIndexInMonth].Nombre_Especial = v; } } if(currentlyOpenDay&&currentlyOpenDay.id===diaId)currentlyOpenDay.Nombre_Especial=v; s.textContent="Name Saved!"; s.className='success'; setTimeout(async ()=>{ if (s) s.textContent=''; await dibujarMes(diaMonthIndex); },1200); const pT=document.getElementById('preview-title'); const currentlyOpenDayId = document.querySelector('#preview-modal.visible') ? document.querySelector('#preview-title')?.textContent.match(/\((\d{2}-\d{2})\)/)?.[1] : null; if(pT && currentlyOpenDayId === diaId) { const updatedDay = monthlyDaysData[diaMonthIndex]?.find(d => d.id === diaId); if (updatedDay) { pT.textContent=`${updatedDay.Nombre_Dia} ${v!=='Unnamed Day'?'('+v+')':''}`; } } } catch(e){ s.textContent=`Error: ${e.message}`; s.className='error'; console.error(e); }
}


// --- Expose functions needed globally ---
// Asegurarse que la función está definida ANTES de exponerla
window.handleMemoryTypeChangeUnified = handleMemoryTypeChangeUnified;
window.buscarBSOUnified = buscarBSOUnified;
window.buscarLugarUnified = buscarLugarUnified;
window.handleMemoryFormSubmit = handleMemoryFormSubmit;
window.cerrarModalPreview = cerrarModalPreview;
window.abrirModalEdicion = abrirModalEdicion;
window.cerrarModalEdicion = cerrarModalEdicion;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;

// --- Start App ---
initializeAppCore();

