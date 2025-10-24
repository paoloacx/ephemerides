/* app.js - CÓDIGO FINAL CON DEPURACIÓN (v2.1-debug) */

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
    console.log("DEBUG: Iniciando app...");
    appContent.innerHTML = "<p>Cargando calendario (modo debug)...</p>";
    
    try {
        console.log("DEBUG: Obteniendo datos de Firebase...");
        const diasSnapshot = await getDocs(collection(db, "Dias"));
        
        if (diasSnapshot.empty) {
            appContent.innerHTML = "<p>Error: La colección 'Dias' está vacía. Importa los datos.</p>";
            console.error("DEBUG: La colección 'Dias' está vacía.");
            return; 
        }

        let count = 0;
        diasSnapshot.forEach((doc) => {
            allDaysData.push({ id: doc.id, ...doc.data() });
            count++;
        });
        console.log(`DEBUG: Se leyeron ${count} documentos de Firebase.`); // CHIVATO 1

        if (count < 300) { // Sospechoso si lee menos de 300
             console.warn("DEBUG: ¡Alerta! Se leyeron muy pocos documentos de Firebase.");
        }

        // Ordenar los datos
        console.log("DEBUG: Ordenando los datos...");
        allDaysData.sort((a, b) => a.id.localeCompare(b.id));
        console.log("DEBUG: Datos ordenados. Primer día:", allDaysData[0]?.id, "Último día:", allDaysData[allDaysData.length - 1]?.id); // CHIVATO 2

        configurarNavegacion();
        dibujarMesActual();
        
    } catch (e) {
        appContent.innerHTML = `<p>Error fatal al cargar: ${e.message}</p>`;
        console.error("Error fatal en iniciarApp:", e);
    }
}

function dibujarMesActual() {
    console.log(`DEBUG: Dibujando mes índice ${currentMonthIndex} (${monthNames[currentMonthIndex]})`);
    monthNameEl.textContent = monthNames[currentMonthIndex];
    const monthString = (currentMonthIndex + 1).toString().padStart(2, '0');
    console.log(`DEBUG: Filtrando por prefijo '${monthString}-'`); // CHIVATO 3
    
    // Filtrar
    const diasDelMes = allDaysData.filter(dia => dia.id.startsWith(monthString + '-'));
    console.log(`DEBUG: Se encontraron ${diasDelMes.length} días para este mes.`); // CHIVATO 4

    appContent.innerHTML = `<div class="calendario-grid" id="grid-dias"></div>`;
    const grid = document.getElementById("grid-dias");

    if (diasDelMes.length === 0) {
        grid.innerHTML = "<p>No hay días para mostrar en este mes (¿Error en filtro o datos?).</p>";
        console.warn("DEBUG: El filtro no encontró días para el prefijo:", monthString);
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
    console.log(`DEBUG: Se dibujaron ${diasDelMes.length} botones.`);
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
    // ... (El código del modal no cambia) ...
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
    // ... (El código de guardar no cambia) ...
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

