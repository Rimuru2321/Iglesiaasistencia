// ================================================================
//  firebase-config.js
//  ⚠️  ÚNICO ARCHIVO QUE DEBES EDITAR CON TUS DATOS DE FIREBASE
//  Iglesia Luz y Vida IV — Sistema de Asistencia
// ================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyA-XTJPcNGJN1cHKANF7ShwIW68vQ4V_OQ",
  authDomain:        "iglesia-luz-vida.firebaseapp.com",
  projectId:         "iglesia-luz-vida",
  storageBucket:     "iglesia-luz-vida.firebasestorage.app",
  messagingSenderId: "2442440076",
  appId:             "1:2442440076:web:6ec7c5643d3af4fd57faa9"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
