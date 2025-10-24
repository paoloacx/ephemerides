/* app.js - SCRIPT DE IMPORTACIÓN DE DATOS */

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

const CSV_URL = './Ephemerides DB - Dias.csv'; // La ruta de tu archivo CSV en GitHub Pages

/**
 * Función para cargar y procesar el CSV.
 */
async function cargarDias() {
    try {
        document.getElementById("app-content").innerHTML = "<p>Iniciando la carga de los 366 días a Firebase...</p>";

        // 1. Descargar el archivo CSV desde GitHub Pages
        const response = await fetch(CSV_URL);
        const data = await response.text();

        // 2. Procesar las líneas
        const lineas = data.split('\n').filter(line => line.trim() !== ''); // Divide por líneas y elimina vacías
        const encabezados = lineas[0].split(',').map(h => h.trim().replace(/\(Texto\)/, '')); // Extrae encabezados: ID_Dia, Nombre_Dia, Icono
        
        let documentosCargados = 0;

        // 3. Iterar sobre los días (empezamos en la línea 1 para saltar los encabezados)
        for (let i = 1; i < lineas.length; i++) {
            const valores = lineas[i].split(',');
            if (valores.length !== 3) continue; // Ignorar líneas mal formadas

            const ID_Dia = valores[0].trim();
            const Nombre_Dia = valores[1].trim();
            const Icono = valores[2].trim() || '🗓️'; // Usar 🗓️ si el campo está vacío

            // 4. Crear el objeto que se guardará en Firestore
            const diaData = {
                Nombre_Dia: Nombre_Dia,
                Icono: Icono,
                Nombre_Especial: "Día sin nombre" // Valor inicial
            };

            // 5. Guardar el documento en la colección 'Dias'
            // Usamos ID_Dia (ej: '01-01') como el ID del documento
            await setDoc(doc(db, "Dias", ID_Dia), diaData);
            documentosCargados++;

            document.getElementById("app-content").innerHTML = `<p>Cargando... ${documentosCargados} de ${lineas.length - 1} días.</p>`;
        }

        document.getElementById("app-content").innerHTML = `
            <h2>¡Carga de Días Completada!</h2>
            <p>Se cargaron ${documentosCargados} días en la colección 'Dias' de Firebase.</p>
            <p><strong>Siguiente paso:</strong> Debes reemplazar el código de app.js con el código para MOSTRAR el calendario.</p>
        `;

    } catch (error) {
        console.error("Error en la carga masiva:", error);
        document.getElementById("app-content").innerHTML = `<p>Error al cargar los días. Revisa la Consola del navegador.</p><p>Detalle del error: ${error.message}</p>`;
    }
}

// Inicia la carga de datos
cargarDias();
