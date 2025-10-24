/* app.js - CÓDIGO FINAL DE LA APP (VERSIÓN 3.0 - FILTRO NUMÉRICO) */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

let allDaysData = [];
let currentMonthIndex = new Date().getMonth();

async function iniciarApp() {
    console.log("Iniciando app v3.0 (Filtro Numérico)..."); // Log simple de inicio
    appContent.innerHTML = "<p>Cargando calendario...</p>";

    try {
        const diasSnapshot = await getDocs(collection(db, "Dias"));

        if (diasSnapshot.empty) {
            appContent.innerHTML = "<p>Error: La colección 'Dias' está vacía.</p>";
            return;
        }

        allDaysData = [];
        diasSnapshot.forEach((doc) => {
            const cleanId = String(doc.id).trim();
            // Validación estricta del formato MM-DD
            if (/^\d{2}-\d{2}$/.test(cleanId)) {
                allDaysData.push({ id: cleanId, ...doc.data() });
            } else {
                 console.warn(`ID inválido ignorado: '${doc.id}'`);
            }
        });
        console.log(`Se leyeron ${allDaysData.length} días válidos.`);

        // Ordenar cronológicamente
        allDaysData.sort((a, b) => a.id.localeCompare(b.id));

        configurarNavegacion();
        dibujarMesActual();

    } catch (e) {
        appContent.innerHTML = `<p>Error fatal al cargar: ${e.message}</p>`;
        console.error("Error en iniciarApp:", e);
    }
}

function dibujarMesActual() {
    monthNameEl.textContent = monthNames[currentMonthIndex];
    // Convertimos el mes buscado a NÚMERO (1 para Enero, 10 para Octubre)
    const monthNumberTarget = currentMonthIndex + 1;
    console.log(`Dibujando mes ${monthNumberTarget} (${monthNames[currentMonthIndex]})`);

    // *** FILTRO NUMÉRICO ***
    const diasDelMes = allDaysData.filter(dia => {
        const currentId = dia.id;
        if (currentId && currentId.length === 5 && currentId.includes('-')) {
            try {
                // Extraemos la parte del mes y la convertimos a NÚMERO
                const monthNumPart = parseInt(currentId.substring(0, 2), 10);
                // Comparamos los NÚMEROS
                return monthNumPart === monthNumberTarget;
            } catch (e) {
                // Si falla la conversión (muy improbable), lo descartamos
                console.error(`Error parseando ID '${currentId}'`, e);
                return false;
            }
        }
        return false; // Descartamos IDs mal formados
    });
    // **********************

    console.log(`Se encontraron ${diasDelMes.length} días para el mes ${monthNumberTarget}.`);

    appContent.innerHTML = `<div class="calendario-grid" id="grid-dias"></div>`;
    const grid = document.getElementById("grid-dias");

    if (diasDelMes.length === 0) {
        grid.innerHTML = "<p>No se encontraron días para este mes.</p>";
        return; // Salimos si no hay días
    }

    // Comprobación final (opcional, pero útil)
    const diasEsperados = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][currentMonthIndex];
    if (diasDelMes.length !== diasEsperados) {
       console.warn(`ALERTA: Se encontraron ${diasDelMes.length} días para ${monthNames[currentMonthIndex]}, pero deberían ser ${diasEsperados}.`);
    }

    // Dibujar botones
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

// --- Resto de funciones sin cambios ---
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

// --- ¡Arranca la App! ---
iniciarApp();

