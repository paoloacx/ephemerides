/* app.js - CÓDIGO FINAL DE LA APP: VISTA DEL CALENDARIO Y EDICIÓN */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Tu configuración de Firebase
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
const DIAS_POR_SEMANA = 7; // Para la cuadrícula visual

// --- Funciones de la App ---

/**
 * Carga todos los días de la colección 'Dias' y los dibuja.
 */
async function cargarYDibujarDias() {
    appContent.innerHTML = "<p>Cargando calendario desde Firebase...</p>";
    
    // 1. Obtener los datos de Firebase
    const diasSnapshot = await getDocs(collection(db, "Dias"));
    let diasArray = [];
    diasSnapshot.forEach((doc) => {
        diasArray.push({ id: doc.id, ...doc.data() });
    });
    
    // 2. Ordenar por ID (01-01, 01-02, ..., 12-31)
    diasArray.sort((a, b) => a.id.localeCompare(b.id));

    // 3. Comprobar si hay datos
    if (diasArray.length === 0) {
        appContent.innerHTML = "<p>Error: No se encontraron datos en la colección 'Dias' de Firebase.</p>";
        return;
    }

    // 4. Dibujar el calendario en la vista
    appContent.innerHTML = `
        <style>
            .calendario-grid {
                display: grid;
                grid-template-columns: repeat(${DIAS_POR_SEMANA}, 1fr);
                gap: 5px;
            }
            .dia-btn {
                background-color: #f0f0f0;
                border: 1px solid #c0c0c0;
                border-radius: 5px;
                padding: 10px 5px;
                text-align: center;
                cursor: pointer;
                box-shadow: 0 1px 1px rgba(0,0,0,0.1);
                transition: background-color 0.1s;
                font-size: 10px; /* Tamaño más pequeño para caber */
            }
            .dia-btn:hover {
                background-color: #e0e0e0;
            }
            .nombre-especial {
                display: block;
                font-size: 11px;
                font-weight: bold;
                color: #007aff; /* Azul clásico de iOS */
                margin-top: 3px;
                text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;
            }
            /* Estilo para la ventana modal (simple) */
            .modal {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background-color: rgba(0,0,0,0.5);
                display: none; justify-content: center; align-items: center;
                z-index: 1000;
            }
            .modal-content {
                background-color: white; padding: 20px; border-radius: 10px;
                width: 90%; max-width: 400px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            }
            .modal-content input {
                width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ccc;
                box-sizing: border-box;
            }
        </style>

        <h2>Calendario Ephemerides</h2>
        <div class="calendario-grid" id="grid-dias">
            </div>

        <div id="edit-modal" class="modal">
            <div class="modal-content">
                <h3 id="modal-title"></h3>
                <p>Nombra este día:</p>
                <input type="text" id="nombre-especial-input" placeholder="Ej: Día de la pizza" maxlength="25">
                <button id="save-btn">Guardar</button>
                <button id="close-btn">Cerrar</button>
                <p id="save-status" style="margin-top: 10px; color: green;"></p>
            </div>
        </div>
    `;
    
    const grid = document.getElementById("grid-dias");
    diasArray.forEach(dia => {
        const btn = document.createElement("button");
        btn.className = "dia-btn";
        btn.innerHTML = `
            ${dia.Icono} ${dia.id.substring(3)}/${dia.id.substring(0, 2)}
            <span class="nombre-especial">${dia.Nombre_Especial === 'Día sin nombre' ? '' : dia.Nombre_Especial}</span>
        `;
        btn.dataset.diaId = dia.id;
        btn.addEventListener('click', () => abrirModalEdicion(dia));
        grid.appendChild(btn);
    });
    
    // Configurar la lógica de la ventana modal
    configurarModal();
}

/**
 * Muestra el modal de edición y carga los datos del día.
 * @param {object} dia - El objeto del día de Firebase.
 */
function abrirModalEdicion(dia) {
    const modal = document.getElementById('edit-modal');
    const title = document.getElementById('modal-title');
    const input = document.getElementById('nombre-especial-input');
    
    title.textContent = `Editando: ${dia.Nombre_Dia} (${dia.id})`;
    input.value = dia.Nombre_Especial === 'Día sin nombre' ? '' : dia.Nombre_Especial;
    
    modal.style.display = 'flex';
    document.getElementById('save-btn').onclick = () => guardarNombreEspecial(dia.id, input.value.trim());
}

/**
 * Configura los botones de cerrar del modal.
 */
function configurarModal() {
    const modal = document.getElementById('edit-modal');
    document.getElementById('close-btn').onclick = () => {
        modal.style.display = 'none';
        document.getElementById('save-status').textContent = ''; // Limpiar estado
    };
    modal.onclick = (e) => {
        if (e.target.id === 'edit-modal') {
            modal.style.display = 'none';
            document.getElementById('save-status').textContent = '';
        }
    };
}


/**
 * Guarda el nuevo Nombre_Especial en Firebase y actualiza la vista.
 * @param {string} diaId - ID del documento (ej: '01-01').
 * @param {string} nuevoNombre - El nuevo nombre dado por el usuario.
 */
async function guardarNombreEspecial(diaId, nuevoNombre) {
    const status = document.getElementById('save-status');
    const modal = document.getElementById('edit-modal');
    
    try {
        status.textContent = "Guardando...";
        
        // 1. Referencia al documento en Firebase
        const diaRef = doc(db, "Dias", diaId);
        
        // 2. Determinar el valor a guardar
        const valorFinal = nuevoNombre || "Día sin nombre"; // Si lo deja vacío, usamos el valor por defecto
        
        // 3. Actualizar el documento
        await updateDoc(diaRef, {
            Nombre_Especial: valorFinal
        });
        
        status.textContent = "¡Guardado con éxito! Recargando...";
        
        // 4. Actualizar la vista después de un breve retraso
        setTimeout(() => {
            modal.style.display = 'none';
            cargarYDibujarDias(); // Recarga toda la vista para ver el cambio
        }, 800);
        
    } catch (e) {
        status.textContent = `Error al guardar: ${e.message}`;
        console.error("Error al actualizar el documento: ", e);
    }
}

// Inicia la aplicación al cargar la página
cargarYDibujarDias();
