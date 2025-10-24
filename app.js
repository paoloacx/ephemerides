/* app.js - SCRIPT DE DEBUGGING Y CARGA DE DATOS */

// Importa las funciones que necesitamos de Firebase
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

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// La URL RAW que debería funcionar
const CSV_URL = 'https://raw.githubusercontent.com/paoloacx/ephemerides/main/Ephemerides%20DB%20-%20Dias.csv'; 

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
        console.log("DEBUG: Contenido RAW del archivo (primeras 300 letras):", data.substring(0, 300));

        // 2. Procesar las líneas
        const lineas = data.split('\n').filter(line => line.trim() !== '');
        
        console.log("DEBUG: Número de líneas procesadas (debería ser ~367):", lineas.length);
        if (lineas.length <= 1) {
             contentDiv.innerHTML = "<p>Error de Parsing. El archivo no se está dividiendo correctamente. Revisa la Consola (F12) para el log de 'Contenido RAW'.</p>";
             return;
        }

        const encabezados = lineas[0].split(',').map(h => h.trim().replace(/\(Texto\)/, ''));
        console.log("DEBUG: Encabezados detectados:", encabezados);
        
        let documentosCargados = 0;

        // 3. Iterar sobre los días (empezamos en la línea 1 para saltar los encabezados)
        for (let i = 1; i < lineas.length; i++) {
            const valores = lineas[i].split(',');
            
            // Si la línea no tiene 3 valores, la saltamos.
            if (valores.length !== 3) {
                 console.warn(`WARN: Línea ${i+1} saltada. Valores (${valores.length}) no son 3:`, lineas[i]);
                 continue; 
            } 

            const ID_Dia = valores[0].trim();
            const Nombre_Dia = valores[1].trim();
            const Icono = valores[2].trim() || '🗓️';
            
            // SOLO POR DEBUG: Primera línea a cargar
            if (i === 1) {
                console.log(`DEBUG: Primera línea a cargar - ID_Dia: ${ID_Dia}, Nombre_Dia: ${Nombre_Dia}`);
            }

            const diaData = {
                Nombre_Dia: Nombre_Dia,
                Icono: Icono,
                Nombre_Especial: "Día sin nombre"
            };

            // 4. Guardar el documento en la colección 'Dias'
            await setDoc(doc(db, "Dias", ID_Dia), diaData);
            documentosCargados++;

            contentDiv.innerHTML = `<p>DEBUG: Cargando... ${documentosCargados} de ${lineas.length - 1} días.</p>`;
        }
        
        // Mensaje de éxito final
        contentDiv.innerHTML = `
            <h2>¡Carga de Días Completada!</h2>
            <p>Se cargaron ${documentosCargados} días en la colección 'Dias' de Firebase.</p>
            <p><strong>Siguiente paso:</strong> Debes reemplazar el código de app.js con el código para MOSTRAR el calendario.</p>
        `;

    } catch (error) {
        console.error("Error FATAL:", error);
        document.getElementById("app-content").innerHTML = `<p>Error FATAL. Revisa la Consola del navegador (F12) y pega el output aquí.</p><p>Detalle del error: ${error.message}</p>`;
    }
}

cargarDias();
