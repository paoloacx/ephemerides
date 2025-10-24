/* app.js - v6.0 - CRUD Memorias, Animaciones, Estilo Hoja Calendario */

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
const monthNameEl = document.getElementById("month-name");
const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

let allDaysData = [];
let currentMonthIndex = new Date().getMonth();
let currentMemories = [];
let editingMemoryId = null; // Para saber si estamos editando una memoria

// --- Función Principal y Reparación (SIN CAMBIOS) ---
async function checkAndRunApp() {
    console.log("Iniciando Verificación/Reparación v6.0...");
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
    } catch (e) { appContent.innerHTML = `<p>Error crítico: ${e.message}</p>`; console.error(e); }
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
                // *** ICONO VACÍO POR DEFECTO AHORA ***
                const diaData = { Nombre_Dia: `${d} de ${monthNames[m]}`, Icono: '', Nombre_Especial: "Día sin nombre" };
                const docRef = doc(db, "Dias", diaId); batch.set(docRef, diaData); ops++; created++;
                if(created % 50 === 0) appContent.innerHTML = `<p>Generando ${created}/366...</p>`;
                if (ops >= 499) { await batch.commit(); batch = writeBatch(db); ops = 0; }
            }
        }
        if (ops > 0) await batch.commit(); console.log(`--- Regeneración completa: ${created} ---`);
        appContent.innerHTML = `<p>✅ ¡Base regenerada con ${created} días!</p>`;
    } catch(e) { console.error("Error generando:", e); throw e; }
}
async function loadDataAndDrawCalendar() {
    console.log("Cargando datos..."); appContent.innerHTML = "<p>Cargando calendario...</p>";
    try {
        const diasSnapshot = await getDocs(collection(db, "Dias")); allDaysData = [];
        diasSnapshot.forEach((doc) => { if (doc.id?.length === 5) allDaysData.push({ id: doc.id, ...doc.data() }); });
        if (allDaysData.length === 0) throw new Error("BD vacía post-carga.");
        console.log(`Cargados ${allDaysData.length} días.`); allDaysData.sort((a, b) => a.id.localeCompare(b.id));
        configurarNavegacion(); dibujarMesActual();
    } catch (e) { appContent.innerHTML = `<p>Error cargando: ${e.message}</p>`; console.error(e); }
}
function configurarNavegacion() {
     document.getElementById("prev-month").onclick = () => { currentMonthIndex = (currentMonthIndex - 1 + 12) % 12; dibujarMesActual(); };
    document.getElementById("next-month").onclick = () => { currentMonthIndex = (currentMonthIndex + 1) % 12; dibujarMesActual(); };
}

// --- Dibujo del Mes Actual (Estilo Hoja Calendario SIN EMOJI) ---
function dibujarMesActual() {
    monthNameEl.textContent = monthNames[currentMonthIndex];
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
        // Estilo Hoja: Número grande, nombre especial abajo. SIN ICONO EMOJI
        btn.innerHTML = `
            <span class="dia-numero">${dia.id.substring(3)}</span>
            <span class="nombre-especial">${(dia.Nombre_Especial && dia.Nombre_Especial !== 'Día sin nombre') ? dia.Nombre_Especial : ''}</span>
        `;
        btn.dataset.diaId = dia.id;
        btn.addEventListener('click', () => abrirModalEdicion(dia));
        grid.appendChild(btn);
    });
    console.log(`Dibujados ${diasDelMes.length} botones.`);
}


// --- MODAL Y GESTIÓN DE MEMORIAS (Actualizado v6.0) ---

/**
 * Abre el modal, carga datos y configura listeners.
 */
async function abrirModalEdicion(dia) {
    console.log("Abriendo modal para:", dia.id);
    let modal = document.getElementById('edit-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'edit-modal';
        modal.className = 'modal'; // Animación controlada por CSS y clase 'visible'
        modal.innerHTML = `
            <div class="modal-content">
                <!-- Sección Nombre Especial -->
                <div class="modal-section">
                    <h3 id="modal-title"></h3>
                    <p>Nombra este día:</p>
                    <input type="text" id="nombre-especial-input" placeholder="Ej: Día de la pizza" maxlength="25">
                     <p id="save-status"></p>
                </div>

                <!-- Sección Memorias -->
                <div class="modal-section memorias-section">
                    <h4>Memorias de este día:</h4>
                    <div id="memorias-list">Cargando memorias...</div>
                    <form id="add-memoria-form">
                        <label for="memoria-fecha">Fecha Original:</label>
                        <input type="date" id="memoria-fecha" required>
                        <label for="memoria-desc">Descripción:</label>
                        <textarea id="memoria-desc" placeholder="Escribe tu recuerdo..." required maxlength="500"></textarea>
                        <button type="submit" id="add-memoria-btn" class="aqua-button">Añadir Memoria</button> <!-- Aplicando estilo Aqua -->
                         <p id="memoria-status"></p>
                    </form>
                </div>

                 <!-- Simple Confirmación de Borrado (oculta) -->
                <div id="confirm-delete-dialog">
                    <p id="confirm-delete-text">¿Seguro que quieres borrar esta memoria?</p>
                    <button id="confirm-delete-no" class="aqua-button">Cancelar</button>
                    <button id="confirm-delete-yes" class="aqua-button delete-confirm">Sí, borrar</button> <!-- Estilo Aqua + Rojo -->
                </div>

                <!-- Botones Principales ABAJO -->
                <div class="modal-main-buttons">
                     <button id="close-btn">Cerrar</button>
                     <button id="save-name-btn">Guardar Nombre</button>
                </div>
            </div>`;
        document.body.appendChild(modal);

        // Configurar cierre
        document.getElementById('close-btn').onclick = () => cerrarModal();
        modal.onclick = (e) => { if (e.target.id === 'edit-modal') cerrarModal(); };
        document.getElementById('confirm-delete-no').onclick = () => document.getElementById('confirm-delete-dialog').style.display = 'none';
    }

    // Resetear estado de edición
    editingMemoryId = null;
    document.getElementById('add-memoria-btn').textContent = 'Añadir Memoria';
    document.getElementById('add-memoria-btn').classList.remove('update-mode');
    document.getElementById('memoria-fecha').value = ''; // Limpiar fecha
    document.getElementById('memoria-desc').value = ''; // Limpiar descripción

    // Rellenar datos del día
    document.getElementById('modal-title').textContent = `Editando: ${dia.Nombre_Dia} (${dia.id})`;
    const inputNombreEspecial = document.getElementById('nombre-especial-input');
    inputNombreEspecial.value = dia.Nombre_Especial === 'Día sin nombre' ? '' : dia.Nombre_Especial;
    document.getElementById('save-status').textContent = '';
    document.getElementById('memoria-status').textContent = '';
    document.getElementById('confirm-delete-dialog').style.display = 'none'; // Asegurar que confirmación está oculta

    // Listeners botones principales
    document.getElementById('save-name-btn').onclick = () => guardarNombreEspecial(dia.id, inputNombreEspecial.value.trim());

    // Listener formulario memorias (Añadir o Actualizar)
    const addMemoriaForm = document.getElementById('add-memoria-form');
    addMemoriaForm.onsubmit = async (e) => {
        e.preventDefault();
        const fechaInput = document.getElementById('memoria-fecha').value;
        const descInput = document.getElementById('memoria-desc').value;

        if (editingMemoryId) { // Modo Actualizar
            await updateMemoria(dia.id, editingMemoryId, fechaInput, descInput.trim());
        } else { // Modo Añadir
            await guardarNuevaMemoria(dia.id, fechaInput, descInput.trim());
        }
    };

    // Mostrar modal con animación
    modal.style.display = 'flex'; // Primero hacerlo visible para calcular tamaño
    setTimeout(() => modal.classList.add('visible'), 10); // Luego aplicar clase para animar

    await cargarYMostrarMemorias(dia.id);
}

/** Cierra el modal con animación */
function cerrarModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.classList.remove('visible');
        // Esperar a que termine la animación para ocultarlo del todo
        setTimeout(() => {
            modal.style.display = 'none';
             // Resetear formulario por si se dejó en modo edición
             resetMemoryForm();
        }, 200); // Coincidir con la duración de la transición CSS
    }
}


/**
 * Carga y muestra memorias, añadiendo botones Editar/Borrar (con iconos SVG)
 */
async function cargarYMostrarMemorias(diaId) {
    const memoriasListDiv = document.getElementById('memorias-list');
    memoriasListDiv.innerHTML = 'Cargando memorias...';
    currentMemories = [];

    // --- Iconos SVG ---
    const editIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg>`;
    const deleteIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m3 0l-.5 8.5a.5.5 0 1 0 .998.06l.5-8.5a.5.5 0 1 0-.998.06m3 .5l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Z"/></svg>`;
    // --- Fin Iconos SVG ---


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
            const memoria = { id: docSnap.id, ...docSnap.data() };
            currentMemories.push(memoria);

            const itemDiv = document.createElement('div');
            itemDiv.className = 'memoria-item';
            let fechaStr = 'Fecha desconocida';
            if (memoria.Fecha_Original?.toDate) {
                try { fechaStr = memoria.Fecha_Original.toDate().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }); }
                catch(e) { console.warn("Error fecha", e); fechaStr = memoria.Fecha_Original.toDate().toISOString().split('T')[0]; }
            } else if (memoria.Fecha_Original) { fechaStr = memoria.Fecha_Original.toString(); }

            itemDiv.innerHTML = `
                <div class="memoria-item-content">
                    <small>${fechaStr}</small>
                    ${memoria.Descripcion || 'Sin descripción'}
                </div>
                <div class="memoria-actions">
                    <button class="edit-btn" title="Editar">${editIconSVG}</button>
                    <button class="delete-btn" title="Borrar">${deleteIconSVG}</button>
                </div>
            `;
            // Añadir listeners a los botones
            itemDiv.querySelector('.edit-btn').onclick = () => startEditMemoria(memoria);
            itemDiv.querySelector('.delete-btn').onclick = () => confirmDeleteMemoria(diaId, memoria.id, memoria.Descripcion); // Pasamos desc para confirmación

            memoriasListDiv.appendChild(itemDiv);
        });
        console.log(`Cargadas ${currentMemories.length} memorias para ${diaId}`);

    } catch (e) { console.error(`Error cargando memorias ${diaId}:`, e); memoriasListDiv.innerHTML = '<p class="error">Error al cargar.</p>'; }
}

/** Prepara el formulario para editar una memoria existente */
function startEditMemoria(memoria) {
    console.log("Editando memoria:", memoria.id);
    editingMemoryId = memoria.id; // Marcar que estamos editando
    const fechaInput = document.getElementById('memoria-fecha');
    const descInput = document.getElementById('memoria-desc');
    const addButton = document.getElementById('add-memoria-btn');

    if (memoria.Fecha_Original?.toDate) {
        try { fechaInput.value = memoria.Fecha_Original.toDate().toISOString().split('T')[0]; }
        catch(e) { console.error("Error convirtiendo fecha", e); fechaInput.value = ''; }
    } else { fechaInput.value = ''; }

    descInput.value = memoria.Descripcion || '';
    addButton.textContent = 'Actualizar Memoria'; // Cambiar texto botón
    addButton.classList.add('update-mode'); // Cambiar estilo botón
    descInput.focus(); // Poner foco en la descripción
}

/** Guarda los cambios de una memoria editada */
async function updateMemoria(diaId, memoriaId, fechaStr, descripcion) {
    const memoriaStatus = document.getElementById('memoria-status');
    if (!fechaStr || !descripcion) {
        memoriaStatus.textContent = 'Error: Falta fecha o descripción.'; memoriaStatus.className = 'error';
        setTimeout(() => memoriaStatus.textContent = '', 3000); return;
    }
    memoriaStatus.textContent = 'Actualizando...'; memoriaStatus.className = '';
    try {
        const dateParts = fechaStr.split('-');
        const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        const fechaOriginalTimestamp = Timestamp.fromDate(localDate);

        const memoriaRef = doc(db, "Dias", diaId, "Memorias", memoriaId);
        await updateDoc(memoriaRef, {
            Fecha_Original: fechaOriginalTimestamp,
            Descripcion: descripcion,
        });

        console.log("Memoria actualizada:", memoriaId);
        memoriaStatus.textContent = '¡Actualizada!'; memoriaStatus.className = 'success';
        resetMemoryForm();
        await cargarYMostrarMemorias(diaId);
        setTimeout(() => memoriaStatus.textContent = '', 2000);

    } catch (e) { console.error("Error actualizando:", e); memoriaStatus.textContent = `Error: ${e.message}`; memoriaStatus.className = 'error'; }
}


/** Muestra diálogo de confirmación antes de borrar, mostrando descripción */
function confirmDeleteMemoria(diaId, memoriaId, descripcion) {
    const dialog = document.getElementById('confirm-delete-dialog');
    const yesButton = document.getElementById('confirm-delete-yes');
    const textElement = document.getElementById('confirm-delete-text');

    // Mostrar parte de la descripción para confirmación
    const descPreview = descripcion ? (descripcion.length > 50 ? descripcion.substring(0, 47) + '...' : descripcion) : 'esta memoria';
    textElement.textContent = `¿Seguro que quieres borrar "${descPreview}"?`;

    dialog.style.display = 'block';
    // Reasignar listener
    yesButton.onclick = async () => {
        dialog.style.display = 'none';
        await deleteMemoria(diaId, memoriaId);
    };
}

/** Borra una memoria específica de Firebase */
async function deleteMemoria(diaId, memoriaId) {
    const memoriaStatus = document.getElementById('memoria-status');
    memoriaStatus.textContent = 'Borrando...'; memoriaStatus.className = '';
    console.log(`Borrando: Dias/${diaId}/Memorias/${memoriaId}`);
    try {
        const memoriaRef = doc(db, "Dias", diaId, "Memorias", memoriaId);
        await deleteDoc(memoriaRef);

        console.log("Borrada:", memoriaId);
        memoriaStatus.textContent = '¡Borrada!'; memoriaStatus.className = 'success';
        await cargarYMostrarMemorias(diaId); // Recargar lista
        setTimeout(() => memoriaStatus.textContent = '', 2000);

    } catch (e) { console.error("Error borrando:", e); memoriaStatus.textContent = `Error: ${e.message}`; memoriaStatus.className = 'error'; }
}

/** Guarda una nueva memoria */
async function guardarNuevaMemoria(diaId, fechaStr, descripcion) {
    const memoriaStatus = document.getElementById('memoria-status');
    if (!fechaStr || !descripcion) {
        memoriaStatus.textContent = 'Error: Falta fecha o descripción.'; memoriaStatus.className = 'error';
        setTimeout(() => memoriaStatus.textContent = '', 3000); return;
    }
    memoriaStatus.textContent = 'Guardando...'; memoriaStatus.className = '';
    try {
        const dateParts = fechaStr.split('-');
        const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        const fechaOriginalTimestamp = Timestamp.fromDate(localDate);
        const memoriasRef = collection(db, "Dias", diaId, "Memorias");
        const docRef = await addDoc(memoriasRef, {
            Fecha_Original: fechaOriginalTimestamp, Descripcion: descripcion, Creado_En: Timestamp.now()
        });
        console.log("Guardada ID:", docRef.id);
        memoriaStatus.textContent = '¡Guardada!'; memoriaStatus.className = 'success';
        resetMemoryForm();
        await cargarYMostrarMemorias(diaId);
        setTimeout(() => memoriaStatus.textContent = '', 2000);
    } catch (e) { console.error("Error guardando nueva:", e); memoriaStatus.textContent = `Error: ${e.message}`; memoriaStatus.className = 'error'; }
}

/** Resetea el formulario de memoria a modo "Añadir" */
function resetMemoryForm() {
    editingMemoryId = null;
    document.getElementById('memoria-fecha').value = '';
    document.getElementById('memoria-desc').value = '';
    const addButton = document.getElementById('add-memoria-btn');
    addButton.textContent = 'Añadir Memoria';
    addButton.classList.remove('update-mode');
}


/** Guarda el Nombre_Especial (sin cambios) */
async function guardarNombreEspecial(diaId, nuevoNombre) {
    const status = document.getElementById('save-status');
    try {
        status.textContent = "Guardando..."; status.className = '';
        const diaRef = doc(db, "Dias", diaId); const valorFinal = nuevoNombre || "Día sin nombre";
        await updateDoc(diaRef, { Nombre_Especial: valorFinal });
        const diaIndex = allDaysData.findIndex(d => d.id === diaId);
        if (diaIndex !== -1) allDaysData[diaIndex].Nombre_Especial = valorFinal;
        status.textContent = "¡Nombre guardado!"; status.className = 'success';
        setTimeout(() => { status.textContent = ''; dibujarMesActual(); }, 1200);
    } catch (e) { status.textContent = `Error: ${e.message}`; status.className = 'error'; console.error(e); }
}

// --- ¡Arranca la App! ---
checkAndRunApp();
```

#### Paso 3: Modificar `index.html` (Cache Buster)

1.  Abre `index.html`.
2.  Cambia la última línea a `app.js?v=16` (o superior):
    ```html
    <script type="module" src="app.js?v=16"></script> 
    

