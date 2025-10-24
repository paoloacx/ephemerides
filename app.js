/* app.js - CÓDIGO FINAL AUTO-REPARADOR (VERSIÓN 4.0) */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, writeBatch, setDoc, deleteDoc, getCountFromServer } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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
const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // Incluye 29 Feb

let allDaysData = [];
let currentMonthIndex = new Date().getMonth();

/**
 * Función Principal: Verifica/Repara la BD y luego inicia la app.
 */
async function checkAndRunApp() {
    console.log("Iniciando Verificación/Reparación v4.0...");
    appContent.innerHTML = "<p>Verificando base de datos...</p>";

    try {
        const diasRef = collection(db, "Dias");
        const countSnapshot = await getCountFromServer(diasRef);
        const currentDocCount = countSnapshot.data().count;

        console.log(`Documentos encontrados en 'Dias': ${currentDocCount}`);

        // Si la cuenta no es 366, reparamos.
        if (currentDocCount !== 366) {
            console.warn(`Se encontraron ${currentDocCount} documentos. Se necesita reparar (esperado 366).`);
            appContent.innerHTML = "<p>Base de datos incompleta o corrupta. Iniciando reparación automática...</p>";
            await generateCleanDatabase();
        } else {
            console.log("Base de datos verificada (366 días). Cargando calendario...");
            appContent.innerHTML = "<p>Base de datos correcta. Cargando calendario...</p>";
        }

        // Una vez reparada (o si ya estaba bien), cargamos y mostramos
        await loadDataAndDrawCalendar();

    } catch (e) {
        appContent.innerHTML = `<p>Error crítico durante verificación/reparación: ${e.message}</p>`;
        console.error("Error en checkAndRunApp:", e);
    }
}

/**
 * BORRA y REGENERA programáticamente los 366 días.
 */
async function generateCleanDatabase() {
    console.log("--- Iniciando Regeneración ---");
    const diasRef = collection(db, "Dias");

    // 1. Borrar todo lo existente (si hay algo)
    try {
        console.log("Borrando colección 'Dias' existente...");
        appContent.innerHTML = "<p>Borrando datos antiguos...</p>";
        const oldDocsSnapshot = await getDocs(diasRef);
        if (!oldDocsSnapshot.empty) {
            let batch = writeBatch(db);
            let deleteCount = 0;
            oldDocsSnapshot.forEach(docSnap => {
                batch.delete(docSnap.ref);
                deleteCount++;
                if (deleteCount >= 499) {
                    batch.commit(); // Commit parcial
                    batch = writeBatch(db);
                    deleteCount = 0;
                }
            });
            if (deleteCount > 0) await batch.commit(); // Commit final
            console.log(`Borrado completado (${oldDocsSnapshot.size} documentos eliminados).`);
        } else {
            console.log("La colección 'Dias' ya estaba vacía.");
        }
    } catch(e) {
         console.error("Error durante el borrado:", e);
         appContent.innerHTML = `<p>Error borrando datos antiguos: ${e.message}. Recarga para reintentar.</p>`;
         throw e; // Detener si falla el borrado
    }


    // 2. Generar y escribir los 366 días limpios
    console.log("Generando 366 días limpios...");
    appContent.innerHTML = "<p>Generando 366 días limpios...</p>";
    let batch = writeBatch(db);
    let operationsInBatch = 0;
    let documentsCreated = 0;

    for (let m = 0; m < 12; m++) { // Meses 0-11
        const monthNum = m + 1;
        const monthStr = monthNum.toString().padStart(2, '0');
        const numDays = daysInMonth[m];

        for (let d = 1; d <= numDays; d++) { // Días 1 hasta numDays
            const dayStr = d.toString().padStart(2, '0');
            const diaId = `${monthStr}-${dayStr}`; // Formato MM-DD limpio

            const diaData = {
                Nombre_Dia: `${d} de ${monthNames[m]}`,
                Icono: '🗓️',
                Nombre_Especial: "Día sin nombre"
            };

            const docRef = doc(db, "Dias", diaId);
            batch.set(docRef, diaData);
            operationsInBatch++;
            documentsCreated++;
            
            if(documentsCreated % 50 === 0) {
                 console.log(`Generando ${diaId}... (${documentsCreated}/366)`);
                 appContent.innerHTML = `<p>Generando ${documentsCreated} de 366 días...</p>`;
            }

            // Commit si el lote está lleno
            if (operationsInBatch >= 499) {
                console.log(`Ejecutando lote (${operationsInBatch})...`);
                await batch.commit();
                batch = writeBatch(db);
                operationsInBatch = 0;
            }
        }
    }

    // Commit del último lote
    if (operationsInBatch > 0) {
        console.log(`Ejecutando último lote (${operationsInBatch})...`);
        await batch.commit();
    }

    console.log(`--- Regeneración completada: ${documentsCreated} días creados ---`);
    appContent.innerHTML = `<p>✅ ¡Base de datos regenerada con ${documentsCreated} días!</p>`;
}


/**
 * Carga los datos de Firebase (asumiendo que son correctos) y dibuja el calendario.
 */
async function loadDataAndDrawCalendar() {
    console.log("Cargando datos de Firebase...");
    appContent.innerHTML = "<p>Cargando calendario...</p>";
    try {
        const diasSnapshot = await getDocs(collection(db, "Dias"));
        allDaysData = [];
        diasSnapshot.forEach((doc) => {
             // Ya no necesitamos validación extra, confiamos en los datos generados
            allDaysData.push({ id: doc.id, ...doc.data() });
        });

        if (allDaysData.length === 0) {
             throw new Error("La base de datos está vacía después de la carga.");
        }

        console.log(`Se cargaron ${allDaysData.length} días.`);

        // Ordenar cronológicamente (necesario siempre)
        allDaysData.sort((a, b) => a.id.localeCompare(b.id));

        configurarNavegacion();
        dibujarMesActual();

    } catch (e) {
        appContent.innerHTML = `<p>Error fatal al cargar/dibujar: ${e.message}</p>`;
        console.error("Error en loadDataAndDrawCalendar:", e);
    }
}


// --- El resto de funciones (dibujarMesActual, configurarNavegacion, etc.) son las mismas que antes, usando el FILTRO NUMÉRICO ---

function dibujarMesActual() {
    monthNameEl.textContent = monthNames[currentMonthIndex];
    const monthNumberTarget = currentMonthIndex + 1; // 1-12
    console.log(`Dibujando mes ${monthNumberTarget} (${monthNames[currentMonthIndex]})`);

    // *** FILTRO NUMÉRICO ***
    const diasDelMes = allDaysData.filter(dia => {
        const currentId = dia.id; // MM-DD
        if (currentId && currentId.length === 5 && currentId.includes('-')) {
            try {
                const monthNumPart = parseInt(currentId.substring(0, 2), 10);
                return monthNumPart === monthNumberTarget;
            } catch (e) { return false; }
        }
        return false;
    });
    // **********************

    console.log(`Se encontraron ${diasDelMes.length} días para el mes ${monthNumberTarget}.`);

    appContent.innerHTML = `<div class="calendario-grid" id="grid-dias"></div>`;
    const grid = document.getElementById("grid-dias");

    if (diasDelMes.length === 0) {
        grid.innerHTML = "<p>No se encontraron días para este mes.</p>";
        return;
    }

    const diasEsperados = daysInMonth[currentMonthIndex];
    if (diasDelMes.length !== diasEsperados) {
       console.warn(`ALERTA: Se encontraron ${diasDelMes.length} días para ${monthNames[currentMonthIndex]}, pero deberían ser ${diasEsperados}.`);
    }

    diasDelMes.forEach(dia => {
        const btn = document.createElement("button");
        btn.className = "dia-btn";
        btn.innerHTML = `
            ${dia.Icono || '🗓️'} ${dia.id.substring(3)}/${dia.id.substring(0, 2)}
            <span class="nombre-especial">${(dia.Nombre_Especial && dia.Nombre_Especial !== 'Día sin nombre') ? dia.Nombre_Especial : ''}</span>
        `;
        btn.dataset.diaId = dia.id;
        btn.addEventListener('click', () => abrirModalEdicion(dia));
        grid.appendChild(btn);
    });
    console.log(`Se dibujaron ${diasDelMes.length} botones.`);
}

function configurarNavegacion() {
    document.getElementById("prev-month").onclick = () => {
        currentMonthIndex--;
        if (currentMonthIndex < 0) { currentMonthIndex = 11; }
        dibujarMesActual();
    };

    document.getElementById("next-month").onclick = () => {
        currentMonthIndex++;
        if (currentMonthIndex > 11) { currentMonthIndex = 0; }
        dibujarMesActual();
    };
}

function abrirModalEdicion(dia) {
    let modal = document.getElementById('edit-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'edit-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3 id="modal-title"></h3>
                <p>Nombra este día:</p>
                <input type="text" id="nombre-especial-input" placeholder="Ej: Día de la pizza" maxlength="25">
                <button id="save-btn">Guardar</button>
                <button id="close-btn">Cerrar</button>
                <p id="save-status" style="margin-top: 10px; color: green;"></p>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('close-btn').onclick = () => modal.style.display = 'none';
        modal.onclick = (e) => {
            if (e.target.id === 'edit-modal') modal.style.display = 'none';
        };
    }

    document.getElementById('modal-title').textContent = `Editando: ${dia.Nombre_Dia} (${dia.id})`;
    const input = document.getElementById('nombre-especial-input');
    input.value = dia.Nombre_Especial === 'Día sin nombre' ? '' : dia.Nombre_Especial;
    document.getElementById('save-status').textContent = '';

    modal.style.display = 'flex';
    document.getElementById('save-btn').onclick = () => guardarNombreEspecial(dia.id, input.value.trim());
}

async function guardarNombreEspecial(diaId, nuevoNombre) {
    const status = document.getElementById('save-status');
    const modal = document.getElementById('edit-modal');

    try {
        status.textContent = "Guardando...";

        const diaRef = doc(db, "Dias", diaId);
        const valorFinal = nuevoNombre || "Día sin nombre";

        await updateDoc(diaRef, { Nombre_Especial: valorFinal });

        const diaIndex = allDaysData.findIndex(d => d.id === diaId);
        if (diaIndex !== -1) {
            allDaysData[diaIndex].Nombre_Especial = valorFinal;
        }

        status.textContent = "¡Guardado!";

        setTimeout(() => {
            modal.style.display = 'none';
            dibujarMesActual();
        }, 800);

    } catch (e) {
        status.textContent = `Error al guardar: ${e.message}`;
        console.error("Error al guardar nombre especial:", e);
    }
}

// --- ¡Arranca la App llamando a la función principal! ---
checkAndRunApp();
