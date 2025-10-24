/* app.js - CÓDIGO FINAL CON DEPURACIÓN DE CARACTERES (v2.1-debug5) */

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

// Función para obtener códigos de caracteres de una cadena
function getCharCodes(str) {
  let codes = '';
  for (let i = 0; i < str.length; i++) {
    codes += str.charCodeAt(i) + ' ';
  }
  return codes.trim();
}

async function iniciarApp() {
    console.log("DEBUG: Iniciando app (v2.1-debug5)...");
    appContent.innerHTML = "<p>Cargando calendario (modo debug caracteres)...</p>";
    
    try {
        console.log("DEBUG: Obteniendo datos de Firebase...");
        const diasSnapshot = await getDocs(collection(db, "Dias"));
        
        if (diasSnapshot.empty) {
            appContent.innerHTML = "<p>Error: La colección 'Dias' está vacía.</p>";
            console.error("DEBUG: La colección 'Dias' está vacía.");
            return; 
        }

        let count = 0;
        allDaysData = []; 
        diasSnapshot.forEach((doc) => {
            const rawId = doc.id; // Guardamos el ID original para depuración
            const cleanId = String(rawId).trim(); 
            if (/^\d{2}-\d{2}$/.test(cleanId)) {
                allDaysData.push({ id: cleanId, rawId: rawId, ...doc.data() }); // Guardamos rawId también
                count++;
            } else {
                 console.warn(`DEBUG: ID con formato inválido ignorado: '${rawId}' (length ${rawId.length}) CharCodes: [${getCharCodes(rawId)}]`);
            }
        });
        console.log(`DEBUG: Se leyeron y validaron ${count} documentos de Firebase.`);

        if (count !== 366) { 
             console.warn(`DEBUG: ¡Alerta! Se validaron ${count} documentos. Deberían ser 366.`);
        }

        console.log("DEBUG: Ordenando los datos...");
        allDaysData.sort((a, b) => a.id.localeCompare(b.id));
        console.log("DEBUG: Datos ordenados. Primer día:", allDaysData[0]?.id, "Último día:", allDaysData[allDaysData.length - 1]?.id); 
        
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
    console.log(`DEBUG: Filtro manual a aplicar: dia.id.split('-')[0] === '${monthString}'`); 
    
    let diasEncontradosCount = 0;
    const idsEncontrados = [];
    const idsFallidos = []; // Para ver por qué fallan

    // *** FILTRO CON LOG DE CARACTERES ***
    const diasDelMes = allDaysData.filter(dia => {
        let match = false;
        const currentId = dia.id; // Ya está trim() y validado por regex
        
        if (currentId && currentId.length === 5 && currentId.includes('-')) {
            const parts = currentId.split('-');
            const monthPart = parts[0];
            const dayPart = parts[1]; 
            
            // Comparación
            match = (monthPart === monthString);

            // Loguear DETALLES si el día es >= 10
            if (parseInt(dayPart, 10) >= 10) {
                 console.log(`   - Verificando ID: '${currentId}' (len ${currentId.length}) [${getCharCodes(currentId)}] | Mes extraído: '${monthPart}' | Comparando con: '${monthString}' | ¿Coincide?: ${match}`);
            }

            if (match) {
                diasEncontradosCount++;
                idsEncontrados.push(currentId);
            } else if (monthPart === monthString.substring(0,1) && parseInt(monthString) >= 10){ 
                // Si el mes empieza igual pero no coincide (ej: mes '10', id '1') - para buscar errores
                idsFallidos.push(`ID: '${currentId}' MesExtraido: '${monthPart}'`);
            }
        } else {
             // Esto no debería ocurrir porque ya filtramos en iniciarApp
             console.warn(`   - ID con formato inesperado encontrado durante el filtro: '${currentId}'`);
        }
        return match;
    });
    // *******************************
    
    console.log(`DEBUG: Se encontraron ${diasEncontradosCount} días DESPUÉS de filtrar (manual detallado) para el mes ${monthString}.`); 
    if(idsEncontrados.length > 0) console.log("DEBUG: IDs ENCONTRADOS:", idsEncontrados.join(', ')); 
    if(idsFallidos.length > 0) console.log("DEBUG: IDs QUE FALLARON (posiblemente):", idsFallidos);

    appContent.innerHTML = `<div class="calendario-grid" id="grid-dias"></div>`;
    const grid = document.getElementById("grid-dias");

    if (diasDelMes.length === 0) {
        grid.innerHTML = "<p>No se encontraron días para este mes.</p>";
        console.error(`DEBUG: ERROR GRAVE - El filtro detallado no encontró ningún día para el mes '${monthString}'`);
        return;
    }
    const diasEsperados = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][currentMonthIndex];
     if (diasDelMes.length !== diasEsperados) {
        console.warn(`DEBUG: ALERTA - Se encontraron ${diasDelMes.length} días para ${monthNames[currentMonthIndex]}, pero deberían ser ${diasEsperados}. ¡El filtro sigue fallando!`);
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

