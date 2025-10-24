/* app.js */

// Importa las funciones que necesitas de los SDKs de Firebase
// Usamos las URL completas para que funcione sin necesidad de "npm"
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// La configuración de Firebase de TU app web
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

// Inicializa Cloud Firestore y obtén una referencia al servicio
const db = getFirestore(app);

// --- ¡Nuestra primera prueba de conexión! ---
// Esta función intentará escribir y leer un dato en tu base de datos
async function probarConexion() {
    try {
        // 1. Escribir un dato de prueba
        const docRef = await addDoc(collection(db, "test"), {
            mensaje: "¡Hola Firebase!",
            timestamp: new Date()
        });
        console.log("Documento escrito con ID: ", docRef.id);

        // 2. Leer los datos de prueba
        const querySnapshot = await getDocs(collection(db, "test"));
        console.log("Datos leídos de Firebase:");
        querySnapshot.forEach((doc) => {
            console.log(`${doc.id} => ${doc.data().mensaje}`);
        });

        // 3. Actualizar la página para que sepas que funcionó
        document.getElementById("app-content").innerHTML = "<p>¡Conexión con Firebase exitosa!</p><p>Revisa tu base de datos en Firebase, deberías ver una nueva colección llamada 'test'.</p>";

    } catch (e) {
        console.error("Error al conectar con Firebase: ", e);
        document.getElementById("app-content").innerHTML = "<p>Error al conectar con Firebase. ¿Habilitaste la base de datos en 'modo de prueba'?</p>";
    }
}

// Llama a nuestra función de prueba cuando la página se cargue
probarConexion();
