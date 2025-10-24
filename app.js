/* app.js - SCRIPT FINAL DE IMPORTACIÓN DE DATOS (PARA EJECUTAR SÓLO UNA VEZ) */

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

// ¡LA URL CORREGIDA! Apuntando al archivo Dias.csv
const CSV_URL = 'https://raw.githubusercontent.com/paoloacx/ephemerides/main/Ephemerides%20DB%20-%20Dias.csv'; 

/**
 * Función para cargar y procesar el CSV.
 */
async function cargarDias() {
    try {
        const contentDiv = document.getElementById("app-content");
        contentDiv.innerHTML = "<p>Iniciando la carga de los 366 días a Firebase...</p>";

        // 1. Descargar el archivo CSV
        const response = await fetch(CSV_URL);
        
        if (!response.ok) {
             // Si falla de nuevo, mostrar el error 
            contentDiv.innerHTML = `<p>Error HTTP: ${response.status}. La URL no funciona: ${CSV_URL}</p>`;
            throw new Error(`Error HTTP: ${response.status} - No se pudo acceder al archivo CSV.`);
        }
        
        const data = await response.text();
        const lineas = data.split('\n').filter(line => line.trim() !== '');
        
        // Saltamos la primera línea (encabezados)
        if (lineas.length <= 1) {
             contentDiv.innerHTML = "<p>Error de lectura. El archivo está vacío o mal formado.</p>";
             return;
        }

        let documentosCargados = 0;

        // 3. Iterar sobre los días (empezamos en la línea 1 para saltar los encabezados)
        for (let i = 1; i < lineas.length; i++) {
            const valores = lineas[i].split(',');
            
            // Verificación de formato para asegurar 3 valores (ID, Nombre, Icono)
            if (valores.length < 3) continue; 

            const ID_Dia = valores[0].trim();
            const Nombre_Dia = valores[1].trim();
            const Icono = valores[2].trim() || '🗓️';

            const diaData = {
                Nombre_Dia: Nombre_Dia,
                Icono: Icono,
                Nombre_Especial: "Día sin nombre" 
            };

            // 4. Guardar el documento en la colección 'Dias'
            await setDoc(doc(db, "Dias", ID_Dia), diaData);
            documentosCargados++;

            contentDiv.innerHTML = `<p>Cargando... ${documentosCargados} de ${lineas.length - 1} días.</p>`;
        }

        contentDiv.innerHTML = `
            <h2>¡Carga de Días Completada!</h2>
            <p>Se cargaron ${documentosCargados} días en la colección 'Dias' de Firebase.</p>
            <hr>
            <h3>✅ ¡La base de datos está lista!</h3>
            <p><strong>Siguiente paso:</strong> Debes reemplazar este código de importación con el código para **MOSTRAR** el calendario.</p>
        `;

    } catch (error) {
        console.error("Error en la carga masiva:", error);
        document.getElementById("app-content").innerHTML = `<p>Error al cargar. ${error.message}</p>`;
    }
}

// Inicia la carga de datos
cargarDias();
