/* app.js - v5.0 - INTEGRACIÓN DE MEMORIAS */

// Importaciones necesarias (añadimos Timestamp, query, orderBy, addDoc, writeBatch, setDoc, deleteDoc)
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
let currentMemories = []; // Para guardar las memorias del día seleccionado

// --- Función Principal (Auto-Reparadora) ---
async function checkAndRunApp() {
    console.log("Iniciando Verificación/Reparación v5.0 (con Memorias)...");
    appContent.innerHTML = "<p>Verificando base de datos...</p>";
    try {
        const diasRef = collection(db, "Dias");
        // Usamos getDocs y .size para contar, compatible con v9.6.1
        const checkSnapshot = await getDocs(diasRef);
        const currentDocCount = checkSnapshot.size;
        console.log(`Documentos encontrados en 'Dias': ${currentDocCount}`);

        if (currentDocCount !== 366) {
            console.warn(`Se necesitan 366 días, se encontraron ${currentDocCount}. Reparando...`);
            await generateCleanDatabase();
        } else {
            console.log("Base de datos verificada (366 días).");
        }
        // Siempre carga los datos después de verificar/reparar
        await loadDataAndDrawCalendar();
    } catch (e) {
        appContent.innerHTML = `<p>Error crítico al iniciar: ${e.message}</p>`;
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
        throw e; // Stop execution if cleanup fails
    }

    console.log("Generando 366 días limpios...");
    appContent.innerHTML = "<p>Generando 366 días limpios...</p>";
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
                    Icono: '🗓️',
                    Nombre_Especial: "Día sin nombre" // Default special name
                };

                const docRef = doc(db, "Dias", diaId); // Create document reference
                batch.set(docRef, diaData); // Add set operation to batch
                ops++;
                created++;

                // Log progress every 50 documents
                if(created % 50 === 0) {
                     appContent.innerHTML = `<p>Generando ${created} de 366 días...</p>`;
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
        appContent.innerHTML = `<p>✅ ¡Base de datos regenerada con ${created} días!</p>`;
    } catch(e) {
         console.error("Error generando días:", e);
         appContent.innerHTML = `<p class="error">Error al generar días: ${e.message}</p>`;
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
    }

    // Create and append buttons for each day of the month
    diasDelMes.forEach(dia => {
        const btn = document.createElement("button");
        btn.className = "dia-btn";
        // Format button text: Icon DD/MM \n Special Name (if exists)
        btn.innerHTML = `
            ${dia.Icono || '🗓️'} ${dia.id.substring(3)}/${dia.id.substring(0, 2)}
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
        currentMonthIndex--;
        if (currentMonthIndex < 0) { currentMonthIndex = 11; } // Wrap around
        dibujarMesActual();
    };
    document.getElementById("next-month").onclick = () => {
        currentMonthIndex++;
        if (currentMonthIndex > 11) { currentMonthIndex = 0; } // Wrap around
        dibujarMesActual();
    };
}

// --- MODAL Y GESTIÓN DE MEMORIAS ---

/**
 * Abre el modal, carga nombre especial y memorias del día.
 */
async function abrirModalEdicion(dia) {
    console.log("Abriendo modal para:", dia.id);
    let modal = document.getElementById('edit-modal');
    // Si el modal no existe, lo creamos con la NUEVA estructura
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'edit-modal';
        modal.className = 'modal';
        // HTML structure for the modal including memories section
        modal.innerHTML = `
            <div class="modal-content">
                <h3 id="modal-title"></h3>
                <p>Nombra este día:</p>
                <input type="text" id="nombre-especial-input" placeholder="Ej: Día de la pizza" maxlength="25">
                <div class="modal-buttons">
                     <button id="close-btn">Cerrar</button>
                     <button id="save-name-btn">Guardar Nombre</button> <!-- Changed ID -->
                </div>
                 <p id="save-status"></p>

                <!-- NUEVA SECCIÓN DE MEMORIAS -->
                <div class="memorias-section">
                    <h4>Memorias de este día:</h4>
                    <div id="memorias-list">Cargando memorias...</div>
                    <form id="add-memoria-form">
                        <label for="memoria-fecha">Fecha Original:</label>
                        <input type="date" id="memoria-fecha" required>
                        <label for="memoria-desc">Descripción:</label>
                        <textarea id="memoria-desc" placeholder="Escribe tu recuerdo..." required maxlength="500"></textarea>
                        <button type="submit" id="add-memoria-btn">Añadir Memoria</button>
                         <p id="memoria-status"></p>
                    </form>
                </div>
            </div>`;
        document.body.appendChild(modal);

        // Setup close buttons and click outside to close
        document.getElementById('close-btn').onclick = () => modal.style.display = 'none';
        modal.onclick = (e) => {
            if (e.target.id === 'edit-modal') modal.style.display = 'none';
        };
    }

    // Populate title and special name input
    document.getElementById('modal-title').textContent = `Editando: ${dia.Nombre_Dia} (${dia.id})`;
    const inputNombreEspecial = document.getElementById('nombre-especial-input');
    inputNombreEspecial.value = dia.Nombre_Especial === 'Día sin nombre' ? '' : dia.Nombre_Especial;
    document.getElementById('save-status').textContent = '';
    document.getElementById('memoria-status').textContent = ''; // Clear memories status

    // Attach action to save name button
    document.getElementById('save-name-btn').onclick = () => guardarNombreEspecial(dia.id, inputNombreEspecial.value.trim());

    // Setup the add memory form submission
    const addMemoriaForm = document.getElementById('add-memoria-form');
    addMemoriaForm.onsubmit = async (e) => {
        e.preventDefault(); // Prevent page reload
        const fechaInput = document.getElementById('memoria-fecha').value;
        const descInput = document.getElementById('memoria-desc').value;
        await guardarNuevaMemoria(dia.id, fechaInput, descInput.trim());
        // Optionally clear form after successful save
        // document.getElementById('memoria-fecha').value = '';
        // document.getElementById('memoria-desc').value = '';
    };

    // Show modal
    modal.style.display = 'flex';

    // Load and display existing memories for this day
    await cargarYMostrarMemorias(dia.id);
}

/**
 * Carga las memorias de Firestore para un día específico y las muestra.
 */
async function cargarYMostrarMemorias(diaId) {
    const memoriasListDiv = document.getElementById('memorias-list');
    memoriasListDiv.innerHTML = 'Cargando memorias...';
    currentMemories = []; // Clear local array

    try {
        // Reference to the 'Memorias' subcollection within the specific day document
        const memoriasRef = collection(db, "Dias", diaId, "Memorias");
        // Query to order memories by Fecha_Original descending (newest first)
        const q = query(memoriasRef, orderBy("Fecha_Original", "desc"));

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            memoriasListDiv.innerHTML = '<p style="font-style: italic; color: #777; font-size: 12px;">No hay memorias para este día.</p>';
            return;
        }

        memoriasListDiv.innerHTML = ''; // Clear "Cargando..."
        querySnapshot.forEach((docSnap) => {
            const memoria = { id: docSnap.id, ...docSnap.data() };
            currentMemories.push(memoria); // Store in local array

            // Create visual element for the memory
            const itemDiv = document.createElement('div');
            itemDiv.className = 'memoria-item';

            // Format the original date
            let fechaStr = 'Fecha desconocida';
            // Check if Fecha_Original exists and is a Firestore Timestamp
            if (memoria.Fecha_Original && typeof memoria.Fecha_Original.toDate === 'function') {
                try {
                    // Convert Timestamp to Date and format it
                    fechaStr = memoria.Fecha_Original.toDate().toLocaleDateString('es-ES', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    });
                } catch(e) {
                    console.warn("Error formateando fecha Timestamp:", memoria.Fecha_Original, e);
                    // Fallback if formatting fails
                    fechaStr = memoria.Fecha_Original.toDate().toISOString().split('T')[0];
                }
            } else if (memoria.Fecha_Original) {
                // Basic fallback if it's not a Timestamp (e.g., just a string)
                 fechaStr = memoria.Fecha_Original.toString();
                 console.warn("Fecha_Original no es un Timestamp:", memoria.Fecha_Original);
            }


            itemDiv.innerHTML = `
                <small>${fechaStr}</small>
                ${memoria.Descripcion || 'Sin descripción'}
                <!-- TODO: Add delete/edit buttons here later -->
            `;
            memoriasListDiv.appendChild(itemDiv);
        });
        console.log(`Se cargaron ${currentMemories.length} memorias para ${diaId}`);

    } catch (e) {
        console.error(`Error cargando memorias para ${diaId}:`, e);
        memoriasListDiv.innerHTML = '<p class="error">Error al cargar memorias.</p>';
    }
}

/**
 * Guarda una nueva memoria en la subcolección correspondiente.
 */
async function guardarNuevaMemoria(diaId, fechaStr, descripcion) {
    const memoriaStatus = document.getElementById('memoria-status');
    // Basic validation
    if (!fechaStr || !descripcion) {
        memoriaStatus.textContent = 'Error: Falta la fecha o la descripción.';
        memoriaStatus.className = 'error';
        setTimeout(() => memoriaStatus.textContent = '', 3000); // Clear error after 3s
        return;
    }

    memoriaStatus.textContent = 'Guardando memoria...';
    memoriaStatus.className = '';

    try {
        // Convert the date string (YYYY-MM-DD from input type="date") to a Firebase Timestamp
        // Important: new Date(fechaStr) might interpret the date incorrectly depending on timezone.
        // A safer way is to parse manually or use UTC. For simplicity, we use local time interpretation.
        const dateParts = fechaStr.split('-'); // YYYY, MM, DD
        const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        const fechaOriginalTimestamp = Timestamp.fromDate(localDate);


        // Reference to the subcollection
        const memoriasRef = collection(db, "Dias", diaId, "Memorias");

        // Add the new memory document
        const docRef = await addDoc(memoriasRef, {
            Fecha_Original: fechaOriginalTimestamp,
            Descripcion: descripcion,
            Creado_En: Timestamp.now() // Record when the entry was created
            // TODO: Add URL_Imagen etc. later
        });

        console.log("Memoria guardada con ID: ", docRef.id);
        memoriaStatus.textContent = '¡Memoria guardada!';
        memoriaStatus.className = 'success';

        // Clear the form after successful save
        document.getElementById('memoria-fecha').value = '';
        document.getElementById('memoria-desc').value = '';

        // Reload the memories list in the modal
        await cargarYMostrarMemorias(diaId);

        // Clear success message after a few seconds
         setTimeout(() => memoriaStatus.textContent = '', 2000);


    } catch (e) {
        console.error("Error guardando memoria: ", e);
        memoriaStatus.textContent = `Error al guardar: ${e.message}`;
        memoriaStatus.className = 'error';
    }
}


/**
 * Guarda el Nombre_Especial (sin cambios funcionales respecto a v2.1)
 */
async function guardarNombreEspecial(diaId, nuevoNombre) {
    const status = document.getElementById('save-status');
    // const modal = document.getElementById('edit-modal'); // No longer needed to close modal here
    try {
        status.textContent = "Guardando nombre...";
        const diaRef = doc(db, "Dias", diaId);
        const valorFinal = nuevoNombre || "Día sin nombre"; // Use default if empty

        // Update in Firebase
        await updateDoc(diaRef, { Nombre_Especial: valorFinal });

        // Update local cache (allDaysData)
        const diaIndex = allDaysData.findIndex(d => d.id === diaId);
        if (diaIndex !== -1) {
            allDaysData[diaIndex].Nombre_Especial = valorFinal;
        }

        status.textContent = "¡Nombre guardado!";
        status.className = 'success';

        // Clear status message after a short delay and redraw month
        setTimeout(() => {
            status.textContent = '';
            dibujarMesActual(); // Redraw current month to update button text
        }, 1200);

    } catch (e) {
        status.textContent = `Error al guardar nombre: ${e.message}`;
        status.className = 'error';
        console.error("Error guardando nombre especial:", e);
    }
}


// --- ¡Arranca la App! ---
checkAndRunApp(); // Checks DB integrity, then loads data and draws calendar

