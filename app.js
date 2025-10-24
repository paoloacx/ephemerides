/* app.js - CÓDIGO FINAL DE LA APP (VERSIÓN 2.1 - VISTA MENSUAL) */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// --- Configuración de Firebase (Tu llave) ---
const firebaseConfig = {
  apiKey: "AIzaSyBrd-8qaBfSplBjj74MNuKP8UWYmr8RaJA",
  authDomain: "ephemerides-2005.firebaseapp.com",
  projectId: "ephemerides-2005",
  storageBucket: "ephemerides-2005.firebasestorage.app",
  messagingSenderId: "360961314777",
  appId: "1:360961314777:web:809d9e66535acb292d13c8",
  measurementId: "G-BZC9FRYCJW"
};

// --- Inicialización de Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Variables Globales de la App ---
const appContent = document.getElementById("app-content");
const monthNameEl = document.getElementById("month-name");
const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

let allDaysData = []; // Almacén para guardar los 366 días
// Inicia en el mes actual
let currentMonthIndex = new Date().getMonth(); 

/**
 * INICIO DE LA APP: Carga todos los datos de Firebase UNA VEZ.
 */
async function iniciarApp() {
    appContent.innerHTML = "<p>Cargando calendario...</p>";
    
    try {
        // 1. Obtener TODOS los datos de Firebase
        const diasSnapshot = await getDocs(collection(db, "Dias"));
        if (diasSnapshot.empty) {
            appContent.innerHTML = "<p>Error: La colección 'Dias' está vacía en Firebase. Asegúrate de haber importado los datos correctamente.</p>";
            return; // Detener si no hay datos
        }

        diasSnapshot.forEach((doc) => {
            allDaysData.push({ id: doc.id, ...doc.data() });
        });
        
        // 2. Ordenar los datos (¡esto arregla el desorden!)
        allDaysData.sort((a, b) => a.id.localeCompare(b.id));

        // 3. Configurar los botones de navegación
        configurarNavegacion();
        
        // 4. Dibujar el mes actual
        dibujarMesActual();
        
    } catch (e) {
        appContent.innerHTML = `<p>Error fatal al cargar la base de datos: ${e.message}</p>`;
        console.error("Error al iniciar la app:", e);
    }
}

/**
 * Dibuja en pantalla SÓLO los días del mes actual.
 */
function dibujarMesActual() {
    // 1. Poner el nombre del mes en el header
    monthNameEl.textContent = monthNames[currentMonthIndex];
    
    // 2. Crear el string del mes (ej: "01", "10", "12")
    const monthString = (currentMonthIndex + 1).toString().padStart(2, '0');
    
    // 3. Filtrar nuestro almacén para este mes
    const diasDelMes = allDaysData.filter(dia => dia.id.startsWith(monthString + '-'));

    // 4. Limpiar el contenido anterior y preparar la cuadrícula
    appContent.innerHTML = `<div class="calendario-grid" id="grid-dias"></div>`;
    const grid = document.getElementById("grid-dias");

    // 5. Dibujar cada día del mes
    if (diasDelMes.length === 0) {
        grid.innerHTML = "<p>No hay días para mostrar en este mes.</p>"; // Mensaje si el filtro no encuentra nada
        return;
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
}

/**
 * Configura los botones "<" y ">"
 */
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

/**
 * Muestra el modal de edición
 */
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

/**
 * Guarda el nuevo Nombre_Especial en Firebase y actualiza la vista.
 */
async function guardarNombreEspecial(diaId, nuevoNombre) {
    const status = document.getElementById('save-status');
    const modal = document.getElementById('edit-modal');
    
    try {
        status.textContent = "Guardando...";
        
        const diaRef = doc(db, "Dias", diaId);
        const valorFinal = nuevoNombre || "Día sin nombre";
        
        await updateDoc(diaRef, { Nombre_Especial: valorFinal });
        
        // Actualizar el almacén local (mucho más rápido)
        const diaIndex = allDaysData.findIndex(d => d.id === diaId);
        if (diaIndex !== -1) {
            allDaysData[diaIndex].Nombre_Especial = valorFinal;
        }

        status.textContent = "¡Guardado!";
        
        setTimeout(() => {
            modal.style.display = 'none';
            dibujarMesActual(); // Redibuja el mes actual
        }, 800);
        
    } catch (e) {
        status.textContent = `Error al guardar: ${e.message}`;
        console.error("Error al guardar nombre especial:", e);
    }
}

// --- ¡Arranca la App! ---
iniciarApp();

