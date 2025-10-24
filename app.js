/* app.js - SCRIPT DE REPARACIÓN TOTAL DE BASE DE DATOS (EJECUTAR 1 VEZ) */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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
const contentDiv = document.getElementById("app-content");

// 1. LISTA DE DATOS CORRECTA
const csvData = `
ID_Dia,Nombre_Dia,Icono
01-01,1 de enero,🗓️
02-01,2 de enero,🗓️
03-01,3 de enero,🗓️
04-01,4 de enero,🗓️
05-01,5 de enero,🗓️
06-01,6 de enero,🗓️
07-01,7 de enero,🗓️
08-01,8 de enero,🗓️
09-01,9 de enero,🗓️
10-01,10 de enero,🗓️
11-01,11 de enero,🗓️
12-01,12 de enero,🗓️
13-01,13 de enero,🗓️
14-01,14 de enero,🗓️
15-01,15 de enero,🗓️
16-01,16 de enero,🗓️
17-01,17 de enero,🗓️
18-01,18 de enero,🗓️
19-01,19 de enero,🗓️
20-01,20 de enero,🗓️
21-01,21 de enero,🗓️
22-01,22 de enero,🗓️
23-01,23 de enero,🗓️
24-01,24 de enero,🗓️
25-01,25 de enero,🗓️
26-01,26 de enero,🗓️
27-01,27 de enero,🗓️
28-01,28 de enero,🗓️
29-01,29 de enero,🗓️
30-01,30 de enero,🗓️
31-01,31 de enero,🗓️
01-02,1 de febrero,🗓️
02-02,2 de febrero,🗓️
03-02,3 de febrero,🗓️
04-02,4 de febrero,🗓️
05-02,5 de febrero,🗓️
06-02,6 de febrero,🗓️
07-02,7 de febrero,🗓️
08-02,8 de febrero,🗓️
09-02,9 de febrero,🗓️
10-02,10 de febrero,🗓️
11-02,11 de febrero,🗓️
12-02,12 de febrero,🗓️
13-02,13 de febrero,🗓️
14-02,14 de febrero,🗓️
15-02,15 de febrero,🗓️
16-02,16 de febrero,🗓️
17-02,17 de febrero,🗓️
18-02,18 de febrero,🗓️
19-02,19 de febrero,🗓️
20-02,20 de febrero,🗓️
21-02,21 de febrero,🗓️
22-02,22 de febrero,🗓️
23-02,23 de febrero,🗓️
24-02,24 de febrero,🗓️
25-02,25 de febrero,🗓️
26-02,26 de febrero,🗓️
27-02,27 de febrero,🗓️
28-02,28 de febrero,🗓️
29-02,29 de febrero,🗓️
01-03,1 de marzo,🗓️
02-03,2 de marzo,🗓️
03-03,3 de marzo,🗓️
04-03,4 de marzo,🗓️
05-03,5 de marzo,🗓️
06-03,6 de marzo,🗓️
07-03,7 de marzo,🗓️
08-03,8 de marzo,🗓️
09-03,9 de marzo,🗓️
10-03,10 de marzo,🗓️
11-03,11 de marzo,🗓️
12-03,12 de marzo,🗓️
13-03,13 de marzo,🗓️
14-03,14 de marzo,🗓️
15-03,15 de marzo,🗓️
16-03,16 de marzo,🗓️
17-03,17 de marzo,🗓️
18-03,18 de marzo,🗓️
19-03,19 de marzo,🗓️
20-03,20 de marzo,🗓️
21-03,21 de marzo,🗓️
22-03,22 de marzo,🗓️
23-03,23 de marzo,🗓️
24-03,24 de marzo,🗓️
25-03,25 de marzo,🗓️
26-03,26 de marzo,🗓️
27-03,27 de marzo,🗓️
28-03,28 de marzo,🗓️
29-03,29 de marzo,🗓️
30-03,30 de marzo,🗓️
31-03,31 de marzo,🗓️
01-04,1 de abril,🗓️
02-04,2 de abril,🗓️
03-04,3 de abril,🗓️
04-04,4 de abril,🗓️
05-04,5 de abril,🗓️
06-04,6 de abril,🗓️
07-04,7 de abril,🗓️
08-04,8 de abril,🗓️
09-04,9 de abril,🗓️
10-04,10 de abril,🗓️
11-04,11 de abril,🗓️
12-04,12 de abril,🗓️
13-04,13 de abril,🗓️
14-04,14 de abril,🗓️
15-04,15 de abril,🗓️
16-04,16 de abril,🗓️
17-04,17 de abril,🗓️
18-04,18 de abril,🗓️
19-04,19 de abril,🗓️
20-04,20 de abril,🗓️
21-04,21 de abril,🗓️
22-04,22 de abril,🗓️
23-04,23 de abril,🗓️
24-04,24 de abril,🗓️
25-04,25 de abril,🗓️
26-04,26 de abril,🗓️
27-04,27 de abril,🗓️
28-04,28 de abril,🗓️
29-04,29 de abril,🗓️
30-04,30 de abril,🗓️
01-05,1 de mayo,🗓️
02-05,2 de mayo,🗓️
03-05,3 de mayo,🗓️
04-05,4 de mayo,🗓️
05-05,5 de mayo,🗓️
06-05,6 de mayo,🗓️
07-05,7 de mayo,🗓️
08-05,8 de mayo,🗓️
09-05,9 de mayo,🗓️
10-05,10 de mayo,🗓️
11-05,11 de mayo,🗓️
12-05,12 de mayo,🗓️
13-05,13 de mayo,🗓️
14-05,14 de mayo,🗓️
15-05,15 de mayo,🗓️
16-05,16 de mayo,🗓️
17-05,17 de mayo,🗓️
18-05,18 de mayo,🗓️
19-05,19 de mayo,🗓️
20-05,20 de mayo,🗓️
21-05,21 de mayo,🗓️
22-05,22 de mayo,🗓️
23-05,23 de mayo,🗓️
24-05,24 de mayo,🗓️
25-05,25 de mayo,🗓️
26-05,26 de mayo,🗓️
27-05,27 de mayo,🗓️
28-05,28 de mayo,🗓️
29-05,29 de mayo,🗓️
30-05,30 de mayo,🗓️
31-05,31 de mayo,🗓️
01-06,1 de junio,🗓️
02-06,2 de junio,🗓️
03-06,3 de junio,🗓️
04-06,4 de junio,🗓️
05-06,5 de junio,🗓️
06-06,6 de junio,🗓️
07-06,7 de junio,🗓️
08-06,8 de junio,🗓️
09-06,9 de junio,🗓️
10-06,10 de junio,🗓️
11-06,11 de junio,🗓️
12-06,12 de junio,🗓️
13-06,13 de junio,🗓️
14-06,14 de junio,🗓️
15-06,15 de junio,🗓️
16-06,16 de junio,🗓️
17-06,17 de junio,🗓️
18-06,18 de junio,🗓️
19-06,19 de junio,🗓️
20-06,20 de junio,🗓️
21-06,21 de junio,🗓️
22-06,22 de junio,🗓️
23-06,23 de junio,🗓️
24-06,24 de junio,🗓️
25-06,25 de junio,🗓️
26-06,26 de junio,🗓️
27-06,27 de junio,🗓️
28-06,28 de junio,🗓️
29-06,29 de junio,🗓️
30-06,30 de junio,🗓️
01-07,1 de julio,🗓️
02-07,2 de julio,🗓️
03-07,3 de julio,🗓️
04-07,4 de julio,🗓️
05-07,5 de julio,🗓️
06-07,6 de julio,🗓️
07-07,7 de julio,🗓️
08-07,8 de julio,🗓️
09-07,9 de julio,🗓️
10-07,10 de julio,🗓️
11-07,11 de julio,🗓️
12-07,12 de julio,🗓️
13-07,13 de julio,🗓️
14-07,14 de julio,🗓️
15-07,15 de julio,🗓️
16-07,16 de julio,🗓️
17-07,17 de julio,🗓️
18-07,18 de julio,🗓️
19-07,19 de julio,🗓️
20-07,20 de julio,🗓️
21-07,21 de julio,🗓️
22-07,22 de julio,🗓️
23-07,23 de julio,🗓️
24-07,24 de julio,🗓️
25-07,25 de julio,🗓️
26-07,26 de julio,🗓️
27-07,27 de julio,🗓️
28-07,28 de julio,🗓️
29-07,29 de julio,🗓️
30-07,30 de julio,🗓️
31-07,31 de julio,🗓️
01-08,1 de agosto,🗓️
02-08,2 de agosto,🗓️
03-08,3 de agosto,🗓️
04-08,4 de agosto,🗓️
05-08,5 de agosto,🗓️
06-08,6 de agosto,🗓️
07-08,7 de agosto,🗓️
08-08,8 de agosto,🗓️
09-08,9 de agosto,🗓️
10-08,10 de agosto,🗓️
11-08,11 de agosto,🗓️
12-08,12 de agosto,🗓️
13-08,13 de agosto,🗓️
14-08,14 de agosto,🗓️
15-08,15 de agosto,🗓️
16-08,16 de agosto,🗓️
17-08,17 de agosto,🗓️
18-08,18 de agosto,🗓️
19-08,19 de agosto,🗓️
20-08,20 de agosto,🗓️
21-08,21 de agosto,🗓️
22-08,22 de agosto,🗓️
23-08,23 de agosto,🗓️
24-08,24 de agosto,🗓️
25-08,25 de agosto,🗓️
26-08,26 de agosto,🗓️
27-08,27 de agosto,🗓️
28-08,28 de agosto,🗓️
29-08,29 de agosto,🗓️
30-08,30 de agosto,🗓️
31-08,31 de agosto,🗓️
01-09,1 de septiembre,🗓️
02-09,2 de septiembre,🗓️
03-09,3 de septiembre,🗓️
04-09,4 de septiembre,🗓️
05-09,5 de septiembre,🗓️
06-09,6 de septiembre,🗓️
07-09,7 de septiembre,🗓️
08-09,8 de septiembre,🗓️
09-09,9 de septiembre,🗓️
10-09,10 de septiembre,🗓️
11-09,11 de septiembre,🗓️
12-09,12 de septiembre,🗓️
13-09,13 de septiembre,🗓️
14-09,14 de septiembre,🗓️
15-09,15 de septiembre,🗓️
16-09,16 de septiembre,🗓️
17-09,17 de septiembre,🗓️
18-09,18 de septiembre,🗓️
19-09,19 de septiembre,🗓️
20-09,20 de septiembre,🗓️
21-09,21 de septiembre,🗓️
22-09,22 de septiembre,🗓️
23-09,23 de septiembre,🗓️
24-09,24 de septiembre,🗓️
25-09,25 de septiembre,🗓️
26-09,26 de septiembre,🗓️
27-09,27 de septiembre,🗓️
28-09,28 de septiembre,🗓️
29-09,29 de septiembre,🗓️
30-09,30 de septiembre,🗓️
01-10,1 de octubre,🗓️
02-10,2 de octubre,🗓️
03-10,3 de octubre,🗓️
04-10,4 de octubre,🗓️
05-10,5 de octubre,🗓️
06-10,6 de octubre,🗓️
07-10,7 de octubre,🗓️
08-10,8 de octubre,🗓️
09-10,9 de octubre,🗓️
10-10,10 de octubre,🗓️
11-10,11 de octubre,🗓️
12-10,12 de octubre,🗓️
13-10,13 de octubre,🗓️
14-10,14 de octubre,🗓️
15-10,15 de octubre,🗓️
16-10,16 de octubre,🗓️
17-10,17 de octubre,🗓️
18-10,18 de octubre,🗓️
19-10,19 de octubre,🗓️
20-10,20 de octubre,🗓️
21-10,21 de octubre,🗓️
22-10,22 de octubre,🗓️
23-10,23 de octubre,🗓️
24-10,24 de octubre,🗓️
25-10,25 de octubre,🗓️
26-10,26 de octubre,🗓️
27-10,27 de octubre,🗓️
28-10,28 de octubre,🗓️
29-10,29 de octubre,🗓️
30-10,30 de octubre,🗓️
31-10,31 de octubre,🗓️
01-11,1 de noviembre,🗓️
02-11,2 de noviembre,🗓️
03-11,3 de noviembre,🗓️
04-11,4 de noviembre,🗓️
05-11,5 de noviembre,🗓️
06-11,6 de noviembre,🗓️
07-11,7 de noviembre,🗓️
08-11,8 de noviembre,🗓️
09-11,9 de noviembre,🗓️
10-11,10 de noviembre,🗓️
11-11,11 de noviembre,🗓️
12-11,12 de noviembre,🗓️
13-11,13 de noviembre,🗓️
14-11,14 de noviembre,🗓️
15-11,15 de noviembre,🗓️
16-11,16 de noviembre,🗓️
17-11,17 de noviembre,🗓️
18-11,18 de noviembre,🗓️
19-11,19 de noviembre,🗓️
20-11,20 de noviembre,🗓️
21-11,21 de noviembre,🗓️
22-11,22 de noviembre,🗓️
23-11,23 de noviembre,🗓️
24-11,24 de noviembre,🗓️
25-11,25 de noviembre,🗓️
26-11,26 de noviembre,🗓️
27-11,27 de noviembre,🗓️
28-11,28 de noviembre,🗓️
29-11,29 de noviembre,🗓️
30-11,30 de noviembre,🗓️
01-12,1 de diciembre,🗓️
02-12,2 de diciembre,🗓️
03-12,3 de diciembre,🗓️
04-12,4 de diciembre,🗓️
05-12,5 de diciembre,🗓️
06-12,6 de diciembre,🗓️
07-12,7 de diciembre,🗓️
08-12,8 de diciembre,🗓️
09-12,9 de diciembre,🗓️
10-12,10 de diciembre,🗓️
11-12,11 de diciembre,🗓️
12-12,12 de diciembre,🗓️
13-12,13 de diciembre,🗓️
14-12,14 de diciembre,🗓️
15-12,15 de diciembre,🗓️
16-12,16 de diciembre,🗓️
17-12,17 de diciembre,🗓️
18-12,18 de diciembre,🗓️
19-12,19 de diciembre,🗓️
20-12,20 de diciembre,🗓️
21-12,21 de diciembre,🗓️
22-12,22 de diciembre,🗓️
23-12,23 de diciembre,🗓️
24-12,24 de diciembre,🗓️
25-12,25 de diciembre,🗓️
26-12,26 de diciembre,🗓️
27-12,27 de diciembre,🗓️
28-12,28 de diciembre,🗓️
29-12,29 de diciembre,🗓️
30-12,30 de diciembre,🗓️
31-12,31 de diciembre,🗓️
`;

async function repararBaseDeDatos() {
    try {
        // --- 2. FASE DE LIMPIEZA ---
        contentDiv.innerHTML = "<p>Iniciando reparación... Fase 1: Limpiando datos corruptos...</p>";
        const querySnapshot = await getDocs(collection(db, "Dias"));
        
        if (querySnapshot.empty) {
            console.log("La colección 'Dias' ya estaba vacía. Saltando limpieza.");
        } else {
            const deletePromises = [];
            querySnapshot.forEach((doc) => {
                deletePromises.push(deleteDoc(doc.ref));
            });
            await Promise.all(deletePromises);
            contentDiv.innerHTML = `<p>Fase 1 completada: Se eliminaron ${querySnapshot.size} días corruptos.</p>`;
        }
        
        // --- 3. FASE DE RECARGA ---
        contentDiv.innerHTML += "<p>Fase 2: Cargando 366 días limpios...</p>";
        
        const lineas = csvData.trim().split(/\r?\n/).filter(line => line.trim() !== '');
        let documentosCargados = 0;

        for (let i = 1; i < lineas.length; i++) { // Empezar en 1 para saltar encabezados
            const valores = lineas[i].split(',');
            if (valores.length < 3) continue;

            const ID_Dia = valores[0].trim();
            const Nombre_Dia = valores[1].trim();
            const Icono = valores[2].trim() || '🗓️';
            
            if (!ID_Dia) continue; // Seguridad

            const diaData = {
                Nombre_Dia: Nombre_Dia,
                Icono: Icono,
                Nombre_Especial: "Día sin nombre" 
            };
            
            await setDoc(doc(db, "Dias", ID_Dia), diaData);
            documentosCargados++;
            contentDiv.innerHTML = `<p>Cargando... ${documentosCargados} de 366 días.</p>`;
        }

        // --- 4. MENSAJE DE ÉXITO ---
        contentDiv.innerHTML = `
            <h2>✅ ¡Reparación Completada!</h2>
            <p>Se cargaron ${documentosCargados} días en la colección 'Dias' de Firebase.</p>
            <hr>
            <h3>Siguiente paso:</h3>
            <p>Vuelve a GitHub y reemplaza este script por el código final de la app (Misión 18).</p>
        `;

    } catch (error) {
        console.error("Error en la reparación:", error);
        contentDiv.innerHTML = `<p>Error al reparar. ${error.message}</p>`;
    }
}

// Inicia la reparación
repararBaseDeDatos();
