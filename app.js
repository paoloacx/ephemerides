/* app.js - CÓDIGO FINAL CON DEPURACIÓN AVANZADA (v2.1-debug2) */

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
    appContent.innerHTML = "<p>Cargando calendario (modo debug avanzado)...</p>";
    
    try {
        console.log("DEBUG: Obteniendo datos de Firebase...");
        const diasSnapshot = await getDocs(collection(db, "Dias"));
        
        if (diasSnapshot.empty) {
            appContent.innerHTML = "<p>Error: La colección 'Dias' está vacía.</p>";
            console.error("DEBUG: La colección 'Dias' está vacía.");
            return; 
        }

        let count = 0;
        diasSnapshot.forEach((doc) => {
            // Asegurémonos de que el ID es una cadena limpia
            const cleanId = String(doc.id).trim(); 
            allDaysData.push({ id: cleanId, ...doc.data() });
            count++;
        });
        console.log(`DEBUG: Se leyeron ${count} documentos de Firebase.`);

        if (count < 366) { 
             console.warn(`DEBUG: ¡Alerta! Se leyeron solo ${count} documentos. Deberían ser 366.`);
        }

        console.log("DEBUG: Ordenando los datos...");
        allDaysData.sort((a, b) => a.id.localeCompare(b.id));
        console.log("DEBUG: Datos ordenados. Primer día:", allDaysData[0]?.id, "Último día:", allDaysData[allDaysData.length - 1]?.id); 
        // Loguear una muestra de IDs después de ordenar para verificar formato
        console.log("DEBUG: Muestra de IDs después de ordenar:", allDaysData.slice(270, 285).map(d => d.id)); // Muestra días alrededor de Octubre 1-15

        configurarNavegacion();
        dibujarMesActual();
        
    } catch (e) {
        appContent.innerHTML = `<p>Error fatal al cargar: ${e.message}</p>`;
        console.error("Error fatal en iniciarApp:", e);
    }
}

function dibujarMesActual() {
    console.log(`-----------------------------------------------------`);
    console.log(`DEBUG: Dibujando mes índice ${currentMonthIndex} (${monthNames[currentMonthIndex]})`);
    monthNameEl.textContent = monthNames[currentMonthIndex];
    const monthString = (currentMonthIndex + 1).toString().padStart(2, '0');
    console.log(`DEBUG: Filtro a aplicar: dia.id.startsWith('${monthString}-')`); 
    
    // *** NUEVO CHIVATO: Ver los IDs ANTES de filtrar ***
    const idsAntesDeFiltrar = allDaysData.map(dia => dia.id);
    console.log(`DEBUG: Total IDs en allDaysData ANTES de filtrar para mes ${monthString}: ${idsAntesDeFiltrar.length}`);
    // console.log("DEBUG: IDs ANTES:", idsAntesDeFiltrar.join(', ')); // Descomentar si es necesario ver TODOS

    // Filtrar
    const diasDelMes = allDaysData.filter(dia => {
        const starts = dia.id.startsWith(monthString + '-');
        // *** NUEVO CHIVATO: Ver qué hace startsWith para cada ID ***
        // if (dia.id.substring(0, 2) === monthString) { // Solo loguear para el mes actual
        //     console.log(`   - Verificando ID: '${dia.id}' -> startsWith('${monthString}-')? ${starts}`);
        // }
        return starts;
    });
    
    // *** NUEVO CHIVATO: Ver los IDs DESPUÉS de filtrar ***
    const idsDespuesDeFiltrar = diasDelMes.map(dia => dia.id);
    console.log(`DEBUG: Se encontraron ${diasDelMes.length} días DESPUÉS de filtrar para el mes ${monthString}.`); 
    console.log("DEBUG: IDs ENCONTRADOS:", idsDespuesDeFiltrar.join(', ')); // Mostrar los IDs que SÍ pasaron el filtro

    appContent.innerHTML = `<div class="calendario-grid" id="grid-dias"></div>`;
    const grid = document.getElementById("grid-dias");

    if (diasDelMes.length === 0) {
        grid.innerHTML = "<p>No se encontraron días para este mes.</p>";
        console.error(`DEBUG: ERROR GRAVE - El filtro no encontró ningún día para el prefijo '${monthString}-'`);
        return;
    }
     if (diasDelMes.length > 0 && diasDelMes.length < 28) { // Si encuentra pocos días (como 12)
        console.warn(`DEBUG: ALERTA - Se encontraron MUY POCOS días (${diasDelMes.length}) para el mes ${monthString}. ¡El filtro está fallando!`);
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
    console.log(`-----------------------------------------------------`);
}

// --- El resto de funciones (configurarNavegacion, abrirModalEdicion, guardarNombreEspecial) no cambian ---
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
