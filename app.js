/* app.js - v10.17 - Redesigned Today Memory Spotlight */

// Importaciones
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
    getFirestore, collection, getDocs, doc, updateDoc,
    writeBatch, setDoc, deleteDoc, Timestamp, query, orderBy, addDoc, limit, // limit ya no se usa en spotlight
    where, documentId
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
    GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

// Importar servicios inicializados desde el módulo
import { db, auth, storage } from './firebase-config.js'; // Asumiendo que firebase-config.js está en la misma carpeta

// --- Global Variables & Constants ---
const appContent = document.getElementById("app-content");
const monthNameDisplayEl = document.getElementById("month-name-display");

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // Includes leap year Feb 29

let monthlyDaysData = {}; // Objeto para almacenar arrays de días por índice de mes (0-11)

let currentMonthIndex = new Date().getMonth();
let currentMemories = [];
let editingMemoryId = null;
let currentlyOpenDay = null;
let selectedMusicTrack = null;
let selectedPlace = null;
let currentUser = null;
let map = null;
let mapMarker = null;

// --- SVG Icons (Sin cambios) ---
const editIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg>`;
const deleteIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0 -1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m3 0l-.5 8.5a.5.5 0 1 0 .998.06l.5-8.5a.5.5 0 1 0-.998.06m3 .5l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Z"/></svg>`;
const pencilIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/></svg>`;
const loginIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M10 3.5a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 1 1 0v2A1.5 1.5 0 0 1 9.5 14h-8A1.5 1.5 0 0 1 0 12.5v-9A1.5 1.5 0 0 1 1.5 2h8A1.5 1.5 0 0 1 11 3.5v2a.5.5 0 0 1-1 0z"/><path fill-rule="evenodd" d="M4.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H14.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708z"/></svg>`;

// --- Auth (Sin cambios) ---
// ... (código igual que antes) ...
onAuthStateChanged(auth, (user) => { currentUser = user; updateLoginUI(user); if (user) { console.log("User logged in:", user.displayName); } else { console.log("User logged out."); } });
function updateLoginUI(user) { const loginBtn = document.getElementById('login-btn'); const userInfo = document.getElementById('user-info'); const userName = document.getElementById('user-name'); const userImg = document.getElementById('user-img'); if (user) { if (userInfo) userInfo.style.display = 'flex'; if (userName) userName.textContent = user.displayName || user.email || 'User'; if (userImg) userImg.src = user.photoURL || 'https://placehold.co/30x30/ccc/fff?text=?'; if (loginBtn) { loginBtn.innerHTML = loginIconSVG; loginBtn.title = "Logout"; loginBtn.onclick = handleLogout; } } else { if (userInfo) userInfo.style.display = 'none'; if (loginBtn) { loginBtn.innerHTML = `<img src="https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1OLUbq VilNfRHXkvdR8VdVAbkuQGcuSgs5nbDbpaE8nhzo6g=s0-w24-h24-p-k-rw-no" alt="G" style="width: 24px; height: 24px; border-radius: 50%;">`; loginBtn.title = "Login with Google"; loginBtn.onclick = handleLogin; } } }
async function handleLogin() { const provider = new GoogleAuthProvider(); try { await signInWithPopup(auth, provider); } catch (error) { console.error("Google Sign-In Error:", error); alert(`Login failed: ${error.message}`); } }
async function handleLogout() { try { await signOut(auth); } catch (error) { console.error("Sign-out Error:", error); alert(`Logout failed: ${error.message}`); } }


// --- App Initialization (Sin cambios) ---
// ... (código igual que antes) ...
async function initializeAppCore() {
    console.log("Starting App Initialization v10.17..."); // Actualizar versión si procede

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


// --- Data Loading and Drawing Logic (Sin cambios) ---
// ... (código igual que antes) ...
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

    // Limpiar contenido y añadir contenedores base
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
         await updateTodayMemorySpotlight(); // Actualizar spotlight de todos modos
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

// --- Configuración (Llamadas una vez al inicio, sin cambios) ---
// ... (código igual que antes) ...
function configurarNavegacion() {
    console.log("Configuring navigation (once)...");
    try {
        const prevBtn = document.getElementById("prev-month");
        const nextBtn = document.getElementById("next-month");

        if (prevBtn) {
            prevBtn.onclick = () => {
                currentMonthIndex = (currentMonthIndex - 1 + 12) % 12;
                console.log("Prev month clicked, new index:", currentMonthIndex);
                loadAndDrawMonth(currentMonthIndex); // Cargar y dibujar el nuevo mes
            };
            console.log("Prev month button configured.");
        } else {
            console.error("#prev-month button not found!");
        }

        if (nextBtn) {
            nextBtn.onclick = () => {
                currentMonthIndex = (currentMonthIndex + 1) % 12;
                console.log("Next month clicked, new index:", currentMonthIndex);
                loadAndDrawMonth(currentMonthIndex); // Cargar y dibujar el nuevo mes
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
                         alert("Error: Today's month data not loaded yet.");
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

                 if (Object.keys(monthlyDaysData).length === 0) return;

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
                 }
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


// --- Helper para cargar todos los datos (Sin cambios) ---
// ... (código igual que antes) ...
async function loadAllDataIfNeeded() {
    const totalMonths = 12;
    const loadedMonths = Object.keys(monthlyDaysData).length;

    if (loadedMonths < totalMonths) {
        console.log("Need to load remaining months data...");
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
        await Promise.all(promises);
        console.log("All month data loaded.");
         if(appContent) await dibujarMes(currentMonthIndex);
    } else {
        console.log("All month data is already loaded.");
    }
}


// --- Database Regeneration (Sin cambios) ---
// ... (código igual que antes) ...
async function generateCleanDatabase() {
    if (!appContent) { console.error("Cannot show status: appContent is null."); return; }
    console.log("--- Starting Regeneration ---");
    const diasRef = collection(db, "Dias"); try { console.log("Deleting 'Dias'..."); appContent.innerHTML = "<p>Deleting old data...</p>"; const oldDocsSnapshot = await getDocs(diasRef); if (!oldDocsSnapshot.empty) { let batch = writeBatch(db); let deleteCount = 0; for (const docSnap of oldDocsSnapshot.docs) {
 batch.delete(docSnap.ref); deleteCount++; if (deleteCount >= 400) { console.log(`Committing delete batch (${deleteCount})...`); await batch.commit(); batch = writeBatch(db); deleteCount = 0; } } if (deleteCount > 0) { console.log(`Committing final delete batch (${deleteCount})...`); await batch.commit(); } console.log(`Deletion complete (${oldDocsSnapshot.size}).`); } else { console.log("'Dias' collection was already empty."); } } catch(e) { console.error("Error deleting collection:", e); throw e; }
    console.log("Generating 366 clean days..."); appContent.innerHTML = "<p>Generating 366 clean days...</p>"; let genBatch = writeBatch(db); let ops = 0, created = 0; try { for (let m = 0; m < 12; m++) { const monthNum = m + 1, monthStr = monthNum.toString().padStart(2, '0'); const numDays = daysInMonth[m]; for (let d = 1; d <= numDays; d++) { const dayStr = d.toString().padStart(2, '0'); const diaId = `${monthStr}-${dayStr}`; const diaData = { Nombre_Dia: `${d} ${monthNames[m]}`, Icono: '', Nombre_Especial: "Unnamed Day", hasMemories: false };
 const docRef = doc(db, "Dias", diaId); genBatch.set(docRef, diaData); ops++; created++; if(created % 50 === 0) appContent.innerHTML = `<p>Generating ${created}/366...</p>`; if (ops >= 400) { console.log(`Committing generate batch (${ops})...`); await batch.commit(); genBatch = writeBatch(db); ops = 0; } } } if (ops > 0) { console.log(`Committing final generate batch (${ops})...`); await batch.commit(); } console.log(`--- Regeneration complete: ${created} days created ---`); appContent.innerHTML = `<p class="success">✅ DB regenerated: ${created} days!</p>`; } catch(e) { console.error("Error generating days:", e); throw e; }
}


// --- Spotlight (MODIFICADO) ---
async function updateTodayMemorySpotlight() {
    // Referencias a los nuevos elementos
    const dateHeader = document.getElementById('spotlight-date-header');
    const spotlightDiv = document.getElementById('today-memory-spotlight');

    if (!spotlightDiv || !dateHeader) {
        console.log("Spotlight elements not found, skipping update.");
        return;
    }

    const today = new Date();
    const todayMonthIndex = today.getMonth(); // Índice 0-11
    const todayId = `${(todayMonthIndex + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

    // Solo mostrar spotlight si estamos viendo el mes actual
    if (currentMonthIndex !== todayMonthIndex) {
         spotlightDiv.innerHTML = ''; // Limpiar
         spotlightDiv.style.display = 'none'; // Ocultar div principal
         dateHeader.style.display = 'none'; // Ocultar fecha
         console.log("Not current month, hiding spotlight.");
         return;
    }

    // Buscar el día en los datos ya cargados para este mes
    const monthData = monthlyDaysData[currentMonthIndex]; // Usar currentMonthIndex
    const todayDay = monthData ? monthData.find(d => d.id === todayId) : null;

    if (!todayDay) {
        spotlightDiv.innerHTML = `<div class="spotlight-slide"><p class="no-memory-message">Could not find today's data in loaded month.</p></div>`;
        spotlightDiv.style.display = 'block'; // Mostrar contenedor principal
        dateHeader.textContent = `Today, ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`; // Mostrar fecha genérica
        dateHeader.style.display = 'block'; // Mostrar fecha
        return;
    }

    // Mostrar fecha encima del spotlight
    dateHeader.textContent = `Today, ${todayDay.Nombre_Dia}`;
    dateHeader.style.display = 'block';
    spotlightDiv.style.display = 'block'; // Asegurarse que el contenedor principal es visible

    // Preparar el contenedor interno (slide)
    spotlightDiv.innerHTML = `<div class="spotlight-slide">Loading memories...</div>`;
    const slideDiv = spotlightDiv.querySelector('.spotlight-slide');

    try {
        const todayMemoriesRef = collection(db, "Dias", todayDay.id, "Memorias");
        // ¡CAMBIO! Cargar TODAS las memorias, ordenadas
        const q = query(todayMemoriesRef, orderBy("Fecha_Original", "desc"));
        console.log("Querying for ALL today's spotlight memories...");
        const snapshot = await getDocs(q);
        console.log(`Spotlight query returned ${snapshot.size} documents.`);

        if (!snapshot.empty) {
            slideDiv.innerHTML = ''; // Limpiar "Loading"
            snapshot.docs.forEach(doc => {
                const memoria = doc.data();
                let memoryHTML = '<div class="spotlight-memory-item">';
                let mainContent = '';
                let artworkHTML = '';
                let icon = '';

                // Determinar icono y contenido principal
                switch (memoria.Tipo) {
                    case 'Lugar':
                        icon = '📍';
                        mainContent = memoria.LugarNombre || 'Place';
                        break;
                    case 'Musica':
                        icon = '🎵';
                        if (memoria.CancionData?.trackName) {
                            mainContent = `<strong>${memoria.CancionData.trackName}</strong> by ${memoria.CancionData.artistName}`;
                            if (memoria.CancionData.artworkUrl60) {
                                artworkHTML = `<img src="${memoria.CancionData.artworkUrl60}" class="spotlight-artwork" alt="Artwork">`;
                            }
                        } else {
                            mainContent = memoria.CancionInfo || 'Music';
                        }
                        break;
                    case 'Imagen':
                        icon = '🖼️';
                        mainContent = memoria.Descripcion || 'Image'; // Usar descripción si existe
                        if (memoria.ImagenURL) {
                             artworkHTML = `<img src="${memoria.ImagenURL}" class="spotlight-artwork" alt="Memory Image">`;
                             // Podríamos añadir un enlace a la imagen completa si quisiéramos
                        }
                        break;
                    default: // Texto
                        icon = '📝';
                        mainContent = memoria.Descripcion || 'Memory';
                        break;
                }

                // Construir HTML del item
                memoryHTML += `<span class="spotlight-memory-icon">${icon}</span>`;
                memoryHTML += `<div class="spotlight-memory-details">${mainContent}</div>`;
                memoryHTML += artworkHTML; // Añadir artwork al final si existe
                memoryHTML += '</div>';

                slideDiv.innerHTML += memoryHTML; // Añadir al slide
            });
            spotlightDiv.classList.add('has-memory'); // Clase en el contenedor principal
        } else {
            slideDiv.innerHTML = `<p class="no-memory-message">Nothing to remember today... yet!</p>`;
            spotlightDiv.classList.remove('has-memory');
        }

        // Hacer clickeable todo el spotlight (contenedor principal)
        spotlightDiv.onclick = () => abrirModalPreview(todayDay);
        console.log("Spotlight updated successfully with all memories.");

    } catch (error) {
        console.error("Error fetching or displaying spotlight memories:", error);
        slideDiv.innerHTML = `<p class="no-memory-message error">Error loading today's memories.</p>`;
    }
}


// --- Búsqueda (Sin cambios funcionales, adaptada a nueva estructura de datos) ---
async function buscarMemorias(term) {
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
                         // Dibujar mes y luego abrir modal
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


// --- Modales y CRUD (Sin cambios funcionales mayores) ---
// ... (Copiar/Pegar las funciones desde v10.15/v10.16) ...
// Asegurarse que `handleMemoryFormSubmit`, `deleteMemoriaUnified`, y `guardarNombreEspecial`
// llaman a `dibujarMes(mesAfectado)` en lugar de `dibujarMesActual()` y actualizan `monthlyDaysData` localmente.

async function handleMemoryFormSubmit(event) {
    event.preventDefault();
    const statusDiv = document.getElementById('memoria-status');
    if (!statusDiv) return;
    statusDiv.className = '';
    statusDiv.textContent = editingMemoryId ? 'Updating...' : 'Saving...';

    let diaId;
    const daySelect = document.getElementById('edit-mem-day');
    const yearInput = document.getElementById('edit-mem-year');
    const daySelectionVisible = document.getElementById('day-selection-section')?.style.display !== 'none';

    if (daySelectionVisible && daySelect?.value) {
        diaId = daySelect.value;
    } else if (currentlyOpenDay) {
        diaId = currentlyOpenDay.id;
    } else {
        statusDiv.textContent = 'Error: No day selected.'; statusDiv.className = 'error'; return;
    }

    const typeSelect = document.getElementById('memoria-type');
    const fechaInput = document.getElementById('memoria-fecha');
    if (!typeSelect || !fechaInput) return;

    const type = typeSelect.value;
    const fechaStr = fechaInput.value;

    if (!diaId || !fechaStr) {
        statusDiv.textContent = 'Day and original date are required.'; statusDiv.className = 'error'; return;
    }

    if (daySelectionVisible && yearInput) {
        const year = parseInt(yearInput.value, 10);
        if (!year || isNaN(year) || year < 1800 || year > new Date().getFullYear() + 1) {
            statusDiv.textContent = 'A valid year for the day is required.'; statusDiv.className = 'error'; return;
        }
    }

    let dateOfMemory;
    try {
        const dateParts = fechaStr.split('-');
        dateOfMemory = new Date(Date.UTC(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])));
        if (isNaN(dateOfMemory.getTime())) throw new Error();
    } catch(e) {
        statusDiv.textContent = 'Invalid date.'; statusDiv.className = 'error'; return;
    }

    const fechaOriginalTimestamp = Timestamp.fromDate(dateOfMemory);
    let memoryData = { Fecha_Original: fechaOriginalTimestamp, Tipo: type };
    let isValid = true;
    let imageFileToUpload = null;

    const descTextarea = document.getElementById('memoria-desc');
    const placeSearchInput = document.getElementById('memoria-place-search');
    const musicSearchInput = document.getElementById('memoria-music-search');
    const fileUploadInput = document.getElementById('memoria-image-upload');
    const imageDescInput = document.getElementById('memoria-image-desc');

    switch (type) {
        case 'Texto':
            if (!descTextarea) return; memoryData.Descripcion = descTextarea.value.trim(); if (!memoryData.Descripcion) isValid = false; break;
        case 'Lugar':
            if (!placeSearchInput) return; if (selectedPlace) { memoryData.LugarNombre = selectedPlace.name; memoryData.LugarData = { lat: selectedPlace.lat, lon: selectedPlace.lon, osm_id: selectedPlace.osm_id, osm_type: selectedPlace.osm_type }; } else { memoryData.LugarNombre = placeSearchInput.value.trim(); if (!memoryData.LugarNombre) isValid = false; memoryData.LugarData = null; } break;
        case 'Musica':
            if (!musicSearchInput) return; if (selectedMusicTrack) { memoryData.CancionData = { trackId: selectedMusicTrack.trackId, artistName: selectedMusicTrack.artistName, trackName: selectedMusicTrack.trackName, artworkUrl60: selectedMusicTrack.artworkUrl60, trackViewUrl: selectedMusicTrack.trackViewUrl }; memoryData.CancionInfo = `${selectedMusicTrack.trackName} - ${selectedMusicTrack.artistName}`; } else { memoryData.CancionInfo = musicSearchInput.value.trim(); if (!memoryData.CancionInfo) isValid = false; memoryData.CancionData = null; } break;
        case 'Imagen':
            if (!fileUploadInput || !imageDescInput) return; memoryData.Descripcion = imageDescInput.value.trim() || null; if (fileUploadInput.files && fileUploadInput.files[0]) { imageFileToUpload = fileUploadInput.files[0]; } else if (editingMemoryId) { const existingMem = currentMemories.find(m => m.id === editingMemoryId); if (existingMem?.ImagenURL) { memoryData.ImagenURL = existingMem.ImagenURL; } else { isValid = false; } } else { isValid = false; } break;
        default: isValid = false; break;
    }

    if (!isValid) { statusDiv.textContent = 'Fill required fields or select a file.'; statusDiv.className = 'error'; return; }

    try {
        if (imageFileToUpload) {
            statusDiv.textContent = 'Uploading image...'; const filePath = `images/${diaId}/${Date.now()}-${imageFileToUpload.name}`; const storageRef = ref(storage, filePath); const uploadTask = await uploadBytes(storageRef, imageFileToUpload); const downloadURL = await getDownloadURL(uploadTask.ref); memoryData.ImagenURL = downloadURL; statusDiv.textContent = 'Image uploaded!';
        }

        const memoriasRef = collection(db, "Dias", diaId, "Memorias");
        if (editingMemoryId) {
            statusDiv.textContent = 'Updating...'; const memRef = doc(db, "Dias", diaId, "Memorias", editingMemoryId); await updateDoc(memRef, memoryData); statusDiv.textContent = 'Updated!'; statusDiv.className = 'success';
        } else {
            statusDiv.textContent = 'Saving...'; memoryData.Creado_En = Timestamp.now(); await addDoc(memoriasRef, memoryData); statusDiv.textContent = 'Saved!'; statusDiv.className = 'success';
        }

        const diaRef = doc(db, "Dias", diaId); await updateDoc(diaRef, { hasMemories: true });
        const diaMonthIndex = parseInt(diaId.substring(0, 2), 10) - 1;
        if (monthlyDaysData[diaMonthIndex]) {
             const dayIndexInMonth = monthlyDaysData[diaMonthIndex].findIndex(d => d.id === diaId);
             if (dayIndexInMonth !== -1) { monthlyDaysData[diaMonthIndex][dayIndexInMonth].hasMemories = true; }
        }

        await dibujarMes(diaMonthIndex); // Redibujar mes afectado

        resetMemoryFormUnified();
        await cargarYMostrarMemorias(diaId, 'edit-memorias-list'); // Recargar lista en modal
        setTimeout(() => { if (statusDiv) statusDiv.textContent = '' }, 2000);

        // Actualizar preview si está abierto
        const previewList = document.getElementById('preview-memorias-list');
        const previewModal = document.getElementById('preview-modal');
        // Usar currentlyOpenDay que se setea al abrir el modal de preview o edit
        const currentlyOpenDayId = document.querySelector('#preview-modal.visible') ? document.querySelector('#preview-title')?.textContent.match(/\((\d{2}-\d{2})\)/)?.[1] : null;
         if(previewList && currentlyOpenDayId === diaId && previewModal?.style.display === 'flex') {
             await cargarYMostrarMemorias(diaId, 'preview-memorias-list');
         }

        await updateTodayMemorySpotlight(); // Actualizar spotlight
    } catch (e) {
        console.error("Save/Update Error:", e); statusDiv.textContent = `Error: ${e.message}`; statusDiv.className = 'error';
    }
}

function confirmDeleteMemoriaUnified(diaId, memoriaId, displayInfo) {
    // ... (sin cambios) ...
    const d=document.getElementById('confirm-delete-dialog'),y=document.getElementById('confirm-delete-yes'),t=document.getElementById('confirm-delete-text');
    if (!d || !y || !t) return;
    const p=displayInfo?(displayInfo.length>50?displayInfo.substring(0,47)+'...':displayInfo):'this memory';
    t.textContent=`Delete "${p}"?`;
    d.style.display='block';
    const m=document.querySelector('#edit-add-modal .modal-content');
    if(m&&!m.contains(d)) m.appendChild(d);
    y.onclick=null;
    y.onclick=async()=>{d.style.display='none';await deleteMemoriaUnified(diaId,memoriaId);};
}

async function deleteMemoriaUnified(diaId, memoriaId) {
    const s=document.getElementById('memoria-status');
    if (!s) return;
    s.textContent='Deleting...'; s.className='';
    try{
        const r=doc(db,"Dias",diaId,"Memorias",memoriaId); await deleteDoc(r);

        const memoriasRef = collection(db, "Dias", diaId, "Memorias"); const snapshot = await getDocs(memoriasRef);
        let hasRemainingMemories = !snapshot.empty;

        const diaRef = doc(db, "Dias", diaId); await updateDoc(diaRef, { hasMemories: hasRemainingMemories });
        const diaMonthIndex = parseInt(diaId.substring(0, 2), 10) - 1;
         if (monthlyDaysData[diaMonthIndex]) {
             const dayIndexInMonth = monthlyDaysData[diaMonthIndex].findIndex(d => d.id === diaId);
             if (dayIndexInMonth !== -1) { monthlyDaysData[diaMonthIndex][dayIndexInMonth].hasMemories = hasRemainingMemories; }
        }

        await dibujarMes(diaMonthIndex); // Redibujar mes afectado

        s.textContent='Deleted!'; s.className='success';
        currentMemories=currentMemories.filter(m=>m.id!==memoriaId);
        await cargarYMostrarMemorias(diaId,'edit-memorias-list'); // Recargar lista en modal
        setTimeout(()=>{ if (s) s.textContent='' },2000);

        // Actualizar preview si está abierto
        const pL=document.getElementById('preview-memorias-list'),pM=document.getElementById('preview-modal');
        const currentlyOpenDayId = document.querySelector('#preview-modal.visible') ? document.querySelector('#preview-title')?.textContent.match(/\((\d{2}-\d{2})\)/)?.[1] : null;
        if(pL && currentlyOpenDayId === diaId && pM?.style.display==='flex'){
            await cargarYMostrarMemorias(diaId,'preview-memorias-list');
        }
        await updateTodayMemorySpotlight(); // Actualizar spotlight
    } catch(e){
        console.error("Delete Error:",e); s.textContent=`Error: ${e.message}`; s.className='error';
    }
}
function resetMemoryFormUnified() {
    // ... (sin cambios) ...
    editingMemoryId=null;
    const f=document.getElementById('memory-form');
    if(f){
        f.reset();
        const b=document.getElementById('save-memoria-btn');
        if(b){b.textContent='Add Memory';b.classList.remove('update-mode');}
        const s=document.getElementById('memoria-status'); if(s)s.textContent='';

        const itunesResults = document.getElementById('itunes-results');
        const placeResults = document.getElementById('place-results');
        const imageStatus = document.getElementById('image-upload-status');

        if(itunesResults) itunesResults.innerHTML='';
        if(placeResults) placeResults.innerHTML='';
        if(imageStatus) imageStatus.textContent='';

        selectedPlace=null;
        selectedMusicTrack=null;

        if (mapMarker) { mapMarker.remove(); mapMarker = null; }
        if (map) { map.setView([40.41, -3.70], 5); }

        handleMemoryTypeChangeUnified();
    }
}

async function guardarNombreEspecial(diaId, nuevoNombre) {
    const s=document.getElementById('save-status');
    if (!s) return;
    try{
        s.textContent="Saving..."; s.className='';
        const r=doc(db,"Dias",diaId); const v=nuevoNombre||"Unnamed Day";
        await updateDoc(r,{Nombre_Especial:v});

        const diaMonthIndex = parseInt(diaId.substring(0, 2), 10) - 1;
        if (monthlyDaysData[diaMonthIndex]) {
             const dayIndexInMonth = monthlyDaysData[diaMonthIndex].findIndex(d => d.id === diaId);
             if (dayIndexInMonth !== -1) { monthlyDaysData[diaMonthIndex][dayIndexInMonth].Nombre_Especial = v; }
        }
        if(currentlyOpenDay&&currentlyOpenDay.id===diaId)currentlyOpenDay.Nombre_Especial=v;

        s.textContent="Name Saved!"; s.className='success';
        setTimeout(async ()=>{
             if (s) s.textContent='';
             await dibujarMes(diaMonthIndex); // Redibujar mes afectado
        },1200);

        // Actualizar título del preview si está abierto
        const pT=document.getElementById('preview-title');
        const currentlyOpenDayId = document.querySelector('#preview-modal.visible') ? document.querySelector('#preview-title')?.textContent.match(/\((\d{2}-\d{2})\)/)?.[1] : null;
        if(pT && currentlyOpenDayId === diaId) {
             const updatedDay = monthlyDaysData[diaMonthIndex]?.find(d => d.id === diaId);
             if (updatedDay) {
                pT.textContent=`${updatedDay.Nombre_Dia} ${v!=='Unnamed Day'?'('+v+')':''}`;
             }
        }
    } catch(e){
        s.textContent=`Error: ${e.message}`; s.className='error'; console.error(e);
    }
}


// --- Expose functions needed globally (Sin cambios) ---
// ... (igual que antes) ...
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

