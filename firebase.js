/*
 * firebase.js (v2.0 - Corregido)
 * Módulo de inicialización de Firebase.
 * Exporta las instancias 'db' y 'auth'.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// --- Configuración ---
const firebaseConfig = {
  apiKey: "AIzaSyBrd-8qaBfSplBjj74MNuKP8UWYmr8RaJA",
  authDomain: "ephemerides-2005.firebaseapp.com",
  projectId: "ephemerides-2005",
  storageBucket: "ephemerides-2005.firebasestorage.app",
  messagingSenderId: "360961314777",
  appId: "1:360961314777:web:809d9e66535acb292d13c8",
  measurementId: "G-BZC9FRYCJW"
};

// --- Inicialización ---
// Inicializamos Firebase aquí, al cargar el módulo.
const app = initializeApp(firebaseConfig);

// Exportamos las instancias que otros módulos usarán
export const db = getFirestore(app);
export const auth = getAuth(app);

// CORRECCIÓN: Exportamos la función 'initFirebase' que main.js espera.
// Ya no necesita hacer nada (la app se inicializa arriba),
// pero su existencia evita el error de importación.
export function initFirebase() {
    console.log("Firebase module initialized.");
}

