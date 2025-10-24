/* app.js - SCRIPT DE DEBUGGING (PARA VER QUÉ LEE) */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

// La URL RAW correcta
const CSV_URL = 'https://raw.githubusercontent.com/paoloacx/ephemerides/main/dias.csv'; 

async function cargarDias() {
    try {
        const contentDiv = document.getElementById("app-content");
        contentDiv.innerHTML = "<p>DEBUG: Iniciando la carga de datos. Revisa la Consola (F12).</p>";

        // 1. Descargar el archivo CSV
        console.log("DEBUG: Intentando descargar el CSV desde:", CSV_URL);
        const response = await fetch(CSV_URL);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - No se pudo acceder al archivo CSV.`);
        }
        
        const data = await response.text();
        console.log("DEBUG: Contenido RAW del archivo (primeras 500 letras):", data.substring(0, 500));

        // 2. Procesar las líneas
        const lineas = data.trim().split(/\r?\n/).filter(line => line.trim() !== '');
        
        console.log("DEBUG: Número total de líneas detectadas (debería ser 367):", lineas.length);
        if (lineas.length <= 1) {
             contentDiv.innerHTML = "<p>Error de Parsing. El archivo no se está dividiendo correctamente (Líneas <= 1). Revisa la Consola.</p>";
             return;
        }

        const encabezados = lineas[0].split(',').map(h => h.trim());
        console.log("DEBUG: Encabezados detectados:", encabezados);
        
        let documentosCargados = 0;

        // 3. Iterar sobre los días (empezamos en la línea 1 para saltar los encabezados)
        for (let i = 1; i < lineas.length; i++) {
            const valores = lineas[i].split(',');
            
            if (valores.length < 3) {
                 console.warn(`WARN: Línea ${i+1} saltada. Valores (${valores.length}) no son 3:`, lineas[i]);
                 continue; 
            } 

            const ID_Dia = valores[0].trim();
            
            if (!ID_Dia) {
                console.warn(`WARN: Línea ${i+1} saltada. El ID_Dia está VACÍO.`);
                continue;
            }

            const Nombre_Dia = valores[1].trim();
            const Icono = valores[2].trim() || '🗓️';
            
            if (i === 1) { // Log de la primera línea de datos
                console.log(`DEBUG: Primera línea a cargar - ID_Dia: [${ID_Dia}], Nombre_Dia: [${Nombre_Dia}], Icono: [${Icono}]`);
            }

            const diaData = {
                Nombre_Dia: Nombre_Dia,
                Icono: Icono,
                Nombre_Especial: "Día sin nombre"
            };

            await setDoc(doc(db, "Dias", ID_Dia), diaData);
            documentosCargados++;

            contentDiv.innerHTML = `<p>DEBUG: Cargando... ${documentosCargados} de ${lineas.length - 1} días.</p>`;
        }
        
        // Mensaje de éxito final
        contentDiv.innerHTML = `
            <h2>¡Carga de Días Completada!</h2>
            <p>Se cargaron ${documentosCargados} días en la colección 'Dias' de Firebase.</p>
        `;

    } catch (error) {
        console.error("Error FATAL:", error);
        contentDiv.innerHTML = `<p>Error FATAL. Revisa la Consola del navegador (F12) y pega el output aquí.</p><p>Detalle del error: ${error.message}</p>`;
    }
}

cargarDias();
