/* auth.js */
/* Módulo para gestionar la autenticación de Firebase */

import { auth } from './firebase.js';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

/**
 * Inicializa el listener de cambio de estado de autenticación.
 * @param {function} onAuthChangeCallback - Función a la que llamar cuando el usuario cambia (recibe el objeto 'user')
 */
export function initAuthListener(onAuthChangeCallback) {
    onAuthStateChanged(auth, onAuthChangeCallback);
}

/**
 * Inicia el proceso de login con Google.
 */
export async function handleLogin() {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Google Sign-In Error:", error);
        alert(`Login failed: ${error.message}`);
    }
}

/**
 * Cierra la sesión del usuario.
 */
export async function handleLogout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Sign-out Error:", error);
        alert(`Logout failed: ${error.message}`);
    }
}
